// TT-CSIRT Advisory Resilient Data Architecture
// Implements a two-level cache (L1 In-Memory, L2 IndexedDB / LocalStorage)
// with Stale-While-Revalidate, Request Deduplication, Explicit Freshness Policy,
// Semantic Usability Validation, and Zero Hardcoded Records.

import {
  Advisory,
  AdvisoryDetail,
  AdvisoryFetchResult,
  AdvisoryDetailFetchResult,
  fetchLiveAdvisories,
  fetchAllLiveAdvisories,
  fetchLiveAdvisoryDetail,
  cleanHumanTitle,
  normalizeDisplaySummary,
  extractAdministrativeReference,
  extractPrimaryCve,
  extractCves,
} from "./advisories";
import {
  buildWordPressPostsEndpoint,
  buildWordPressCorpusEndpoint,
} from "./upstream/wordpress/endpoints.ts";

export const CACHE_CONFIG = {
  VERSION: 2,
  // 0 to 5 minutes: Fresh (no background check needed)
  FRESH_TTL_MS: 5 * 60 * 1000,
  // Max usable stale age: 24 hours
  MAX_STALE_TTL_MS: 24 * 60 * 60 * 1000,
  // Configurable TT-CSIRT service-design threshold for initial blank-state timeout (1.5 - 2.0s)
  INITIAL_BLANK_THRESHOLD_MS: 1800,
  // Configurable TT-CSIRT service-design threshold for background freshness confirmation (40s)
  FRESHNESS_CONFIRMATION_THRESHOLD_MS: 40 * 1000,
  DB_NAME: "ttcsirt_advisory_cache_db",
  STORE_LISTS: "advisory_lists_v2",
  STORE_DETAILS: "advisory_details_v2",
} as const;

export interface CacheMetadata {
  version: number;
  fetchedAt: number; // Unix timestamp in ms
  lastAttemptedAt: number;
  sourceUrl: string;
}

export interface CachedListEntry {
  key: string;
  advisories: Advisory[];
  totalRecords?: number;
  totalPages?: number;
  currentPage: number;
  metadata: CacheMetadata;
}

export interface CachedDetailEntry {
  key: string;
  advisory: AdvisoryDetail;
  metadata: CacheMetadata;
}

export type FreshnessState = "fresh" | "stale" | "expired" | "none";

// Level 1: In-Memory Cache Store (fastest, synchronous during active session)
const memoryListCache = new Map<string, CachedListEntry>();
const memoryDetailCache = new Map<string, CachedDetailEntry>();

// In-Flight Request Deduplication Map
const inFlightListRequests = new Map<string, Promise<AdvisoryFetchResult>>();
const inFlightDetailRequests = new Map<string, Promise<AdvisoryDetailFetchResult>>();

// --- Semantic Usability Validators ---

/**
 * Checks if a single advisory object contains the required semantic properties
 * to be considered genuinely usable and navigable by humans and assistive tech.
 */
export function isUsableAdvisory(item: unknown): item is Advisory {
  if (!item || typeof item !== "object") return false;
  const a = item as Record<string, unknown>;
  const hasId = typeof a.id === "number" && a.id > 0;
  const hasTitle = typeof a.title === "string" && a.title.trim().length > 0;
  const hasDate = typeof a.date === "string" && a.date.trim().length > 0;
  const hasSummary =
    (typeof a.displaySummary === "string" && a.displaySummary.trim().length > 0) ||
    (typeof a.sourceExcerpt === "string" && a.sourceExcerpt.trim().length > 0);
  const hasLink =
    (typeof a.url === "string" && a.url.startsWith("http")) ||
    (typeof a.slug === "string" && a.slug.trim().length > 0);

  return hasId && hasTitle && hasDate && hasSummary && hasLink;
}

/**
 * Evaluates whether an advisory listing array contains usable advisory records.
 * Uses 3 or more valid records as an initial confidence heuristic for full listing,
 * while allowing fewer complete records if genuinely usable.
 */
export function isUsableAdvisoryList(advisories: unknown): boolean {
  if (!Array.isArray(advisories) || advisories.length === 0) return false;
  return advisories.every(isUsableAdvisory);
}

/**
 * Evaluates whether an individual advisory detail record contains the essential
 * readable content and metadata required to meaningfully read the advisory.
 */
export function isUsableAdvisoryDetail(detail: unknown): detail is AdvisoryDetail {
  if (!detail || typeof detail !== "object") return false;
  const d = detail as Record<string, unknown>;
  const hasId = typeof d.id === "number" && d.id > 0;
  const hasTitle = typeof d.title === "string" && d.title.trim().length > 0;
  const hasDate = typeof d.date === "string" && d.date.trim().length > 0;
  const hasContent =
    (typeof d.contentHtml === "string" && d.contentHtml.trim().length > 0) ||
    (typeof d.sourceExcerpt === "string" && d.sourceExcerpt.trim().length > 0) ||
    (typeof d.displaySummary === "string" && d.displaySummary.trim().length > 0);
  const hasUrl = typeof d.url === "string" && d.url.startsWith("http");

  return hasId && hasTitle && hasDate && hasContent && hasUrl;
}

/**
 * Formats a timestamp into accessible standard format without technical jargon
 * e.g. "24 August 2026 at 20:44"
 */
export function formatFreshnessTimestamp(timestamp?: number | string | Date): string {
  if (!timestamp) return "";
  const d =
    typeof timestamp === "number" || typeof timestamp === "string"
      ? new Date(timestamp)
      : timestamp;
  if (isNaN(d.getTime())) return "";

  const day = d.getDate();
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${day} ${month} ${year} at ${hours}:${minutes}`;
}

// --- IndexedDB / Level 2 Persistent Storage Helpers ---

let dbPromise: Promise<IDBDatabase | null> | null = null;

function getIndexedDB(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.resolve(null);
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    try {
      const request = indexedDB.open(CACHE_CONFIG.DB_NAME, CACHE_CONFIG.VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(CACHE_CONFIG.STORE_LISTS)) {
          db.createObjectStore(CACHE_CONFIG.STORE_LISTS, { keyPath: "key" });
        }
        if (!db.objectStoreNames.contains(CACHE_CONFIG.STORE_DETAILS)) {
          db.createObjectStore(CACHE_CONFIG.STORE_DETAILS, { keyPath: "key" });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });

  return dbPromise;
}

function ensureNormalizedAdvisory(advisory: Advisory): Advisory {
  const normalizedTitle = cleanHumanTitle(advisory.rawTitle || advisory.title);
  const primaryCve = extractPrimaryCve(advisory.rawTitle || advisory.title);
  const normalizedSummary = normalizeDisplaySummary(advisory.sourceExcerpt, normalizedTitle, primaryCve);
  const refNum = advisory.referenceNumber || extractAdministrativeReference(advisory.rawTitle || advisory.title);
  const cves = advisory.cveList || extractCves(`${advisory.rawTitle || advisory.title} ${advisory.sourceExcerpt}`);

  return {
    ...advisory,
    title: normalizedTitle,
    displaySummary: normalizedSummary,
    referenceNumber: refNum,
    cveList: cves.length > 0 ? cves : undefined,
  };
}

function ensureNormalizedAdvisoryDetail(detail: AdvisoryDetail): AdvisoryDetail {
  const normalizedTitle = cleanHumanTitle(detail.rawTitle || detail.title);
  const primaryCve = extractPrimaryCve(detail.rawTitle || detail.title);
  const normalizedSummary = normalizeDisplaySummary(detail.sourceExcerpt, normalizedTitle, primaryCve);
  const refNum = detail.referenceNumber || extractAdministrativeReference(detail.rawTitle || detail.title);
  const cves = detail.cveList || extractCves(`${detail.rawTitle || detail.title} ${detail.sourceExcerpt} ${detail.contentHtml}`);

  return {
    ...detail,
    title: normalizedTitle,
    displaySummary: normalizedSummary,
    referenceNumber: refNum,
    cveList: cves.length > 0 ? cves : undefined,
  };
}

export async function persistListEntry(entry: CachedListEntry): Promise<void> {
  const normalizedEntry: CachedListEntry = {
    ...entry,
    advisories: entry.advisories.map(ensureNormalizedAdvisory),
  };

  // Always update Level 1 in-memory
  memoryListCache.set(normalizedEntry.key, normalizedEntry);

  // Attempt Level 2 IndexedDB
  try {
    const db = await getIndexedDB();
    if (db) {
      const tx = db.transaction(CACHE_CONFIG.STORE_LISTS, "readwrite");
      const store = tx.objectStore(CACHE_CONFIG.STORE_LISTS);
      store.put(normalizedEntry);
      return;
    }
  } catch {
    // Fallback to localStorage
  }

  // Graceful LocalStorage fallback
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(
        `ttcsirt_list_${normalizedEntry.key}`,
        JSON.stringify(normalizedEntry)
      );
    }
  } catch {
    // Storage quota or restriction safely ignored
  }
}

export function getSynchronousMemoryListEntry(key: string): CachedListEntry | null {
  if (memoryListCache.has(key)) {
    const entry = memoryListCache.get(key)!;
    if (entry.metadata.version === CACHE_CONFIG.VERSION && isUsableAdvisoryList(entry.advisories)) {
      return {
        ...entry,
        advisories: entry.advisories.map(ensureNormalizedAdvisory),
      };
    }
  }

  // Cross-key fallback: if page 1 with small count is requested, derive from larger pre-loaded caches
  if (key === "page=1&perPage=5" || key === "page=1&perPage=10") {
    const count = key === "page=1&perPage=5" ? 5 : 10;
    for (const parentKey of ["corpus_all", "page=1&perPage=100", "page=1&perPage=10"]) {
      if (parentKey !== key && memoryListCache.has(parentKey)) {
        const parentEntry = memoryListCache.get(parentKey)!;
        if (parentEntry.metadata.version === CACHE_CONFIG.VERSION && isUsableAdvisoryList(parentEntry.advisories)) {
          return {
            ...parentEntry,
            key,
            advisories: parentEntry.advisories.slice(0, count).map(ensureNormalizedAdvisory),
          };
        }
      }
    }
  }

  return null;
}

/**
 * Returns initial synchronous state for the /advisories page listing.
 * Checks the authoritative 10-record list cache first. If not present, checks if
 * valid homepage records (page=1&perPage=5) exist to provide immediate useful content
 * without fabricating totalRecords or totalPages.
 */
export function getInitialAdvisoryListingState(): {
  advisories: Advisory[];
  totalPages?: number;
  totalRecords?: number;
  fetchedAt?: number;
  isProvisional: boolean;
} {
  const fullEntry = getSynchronousMemoryListEntry("page=1&perPage=100");
  if (fullEntry && isUsableAdvisoryList(fullEntry.advisories)) {
    return {
      advisories: fullEntry.advisories.map(ensureNormalizedAdvisory),
      totalPages: fullEntry.totalPages,
      totalRecords: fullEntry.totalRecords,
      fetchedAt: fullEntry.metadata.fetchedAt,
      isProvisional: false,
    };
  }

  const hpEntry = getSynchronousMemoryListEntry("page=1&perPage=5");
  if (hpEntry && isUsableAdvisoryList(hpEntry.advisories)) {
    return {
      advisories: hpEntry.advisories.slice(0, 5).map(ensureNormalizedAdvisory),
      totalPages: undefined,
      totalRecords: undefined,
      fetchedAt: hpEntry.metadata.fetchedAt,
      isProvisional: true,
    };
  }

  return {
    advisories: [],
    totalPages: undefined,
    totalRecords: undefined,
    fetchedAt: undefined,
    isProvisional: false,
  };
}

export function getSynchronousMemoryDetailEntry(keyOrSlug: string): CachedDetailEntry | null {
  const normKey = String(keyOrSlug).toLowerCase().trim();
  if (memoryDetailCache.has(normKey)) {
    const entry = memoryDetailCache.get(normKey)!;
    if (entry.metadata.version === CACHE_CONFIG.VERSION && isUsableAdvisoryDetail(entry.advisory)) {
      return {
        ...entry,
        advisory: ensureNormalizedAdvisoryDetail(entry.advisory),
      };
    }
  }
  return null;
}

export async function retrieveListEntry(key: string): Promise<CachedListEntry | null> {
  // 1. Check Level 1 In-Memory (instant)
  const memEntry = getSynchronousMemoryListEntry(key);
  if (memEntry) return memEntry;

  // 2. Check Level 2 IndexedDB
  try {
    const db = await getIndexedDB();
    if (db) {
      const tx = db.transaction(CACHE_CONFIG.STORE_LISTS, "readonly");
      const store = tx.objectStore(CACHE_CONFIG.STORE_LISTS);
      const request = store.get(key);

      const result = await new Promise<CachedListEntry | null>((resolve) => {
        request.onsuccess = () => {
          const val = request.result as CachedListEntry | undefined;
          if (
            val &&
            val.metadata?.version === CACHE_CONFIG.VERSION &&
            isUsableAdvisoryList(val.advisories)
          ) {
            resolve({
              ...val,
              advisories: val.advisories.map(ensureNormalizedAdvisory),
            });
          } else {
            resolve(null);
          }
        };
        request.onerror = () => resolve(null);
      });

      if (result) {
        memoryListCache.set(key, result);
        return result;
      }
    }
  } catch {
    // Fallback to localStorage
  }

  // 3. Fallback to LocalStorage
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem(`ttcsirt_list_${key}`);
      if (raw) {
        const parsed = JSON.parse(raw) as CachedListEntry;
        if (
          parsed?.metadata?.version === CACHE_CONFIG.VERSION &&
          isUsableAdvisoryList(parsed.advisories)
        ) {
          const normalized: CachedListEntry = {
            ...parsed,
            advisories: parsed.advisories.map(ensureNormalizedAdvisory),
          };
          memoryListCache.set(key, normalized);
          return normalized;
        }
      }
    }
  } catch {
    // Ignore error
  }

  // 4. Cross-key fallback: if page 1 with small count is requested, try larger caches
  if (key === "page=1&perPage=5" || key === "page=1&perPage=10") {
    const count = key === "page=1&perPage=5" ? 5 : 10;
    for (const parentKey of ["corpus_all", "page=1&perPage=100", "page=1&perPage=10"]) {
      if (parentKey !== key) {
        const memParent = memoryListCache.get(parentKey);
        if (memParent && isUsableAdvisoryList(memParent.advisories)) {
          const derived: CachedListEntry = {
            ...memParent,
            key,
            advisories: memParent.advisories.slice(0, count).map(ensureNormalizedAdvisory),
          };
          memoryListCache.set(key, derived);
          return derived;
        }
      }
    }
  }

  return null;
}

export async function persistDetailEntry(entry: CachedDetailEntry): Promise<void> {
  const normalizedEntry: CachedDetailEntry = {
    ...entry,
    advisory: ensureNormalizedAdvisoryDetail(entry.advisory),
  };

  // Update Level 1 in-memory
  memoryDetailCache.set(normalizedEntry.key, normalizedEntry);
  if (normalizedEntry.advisory.slug && normalizedEntry.advisory.slug !== normalizedEntry.key) {
    memoryDetailCache.set(normalizedEntry.advisory.slug, normalizedEntry);
  }
  memoryDetailCache.set(String(normalizedEntry.advisory.id), normalizedEntry);

  // Attempt Level 2 IndexedDB
  try {
    const db = await getIndexedDB();
    if (db) {
      const tx = db.transaction(CACHE_CONFIG.STORE_DETAILS, "readwrite");
      const store = tx.objectStore(CACHE_CONFIG.STORE_DETAILS);
      store.put(normalizedEntry);
      return;
    }
  } catch {
    // Fallback to localStorage
  }

  // Graceful LocalStorage fallback
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(
        `ttcsirt_detail_${normalizedEntry.key}`,
        JSON.stringify(normalizedEntry)
      );
    }
  } catch {
    // Storage quota or restriction safely ignored
  }
}

export async function retrieveDetailEntry(keyOrSlug: string): Promise<CachedDetailEntry | null> {
  const normKey = String(keyOrSlug).toLowerCase().trim();

  // 1. Check Level 1 In-Memory
  const memEntry = getSynchronousMemoryDetailEntry(normKey);
  if (memEntry) return memEntry;

  // 2. Check Level 2 IndexedDB
  try {
    const db = await getIndexedDB();
    if (db) {
      const tx = db.transaction(CACHE_CONFIG.STORE_DETAILS, "readonly");
      const store = tx.objectStore(CACHE_CONFIG.STORE_DETAILS);
      const request = store.get(normKey);

      const result = await new Promise<CachedDetailEntry | null>((resolve) => {
        request.onsuccess = () => {
          const val = request.result as CachedDetailEntry | undefined;
          if (
            val &&
            val.metadata?.version === CACHE_CONFIG.VERSION &&
            isUsableAdvisoryDetail(val.advisory)
          ) {
            resolve({
              ...val,
              advisory: ensureNormalizedAdvisoryDetail(val.advisory),
            });
          } else {
            resolve(null);
          }
        };
        request.onerror = () => resolve(null);
      });

      if (result) {
        memoryDetailCache.set(normKey, result);
        return result;
      }
    }
  } catch {
    // Fallback to localStorage
  }

  // 3. Fallback to LocalStorage
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem(`ttcsirt_detail_${normKey}`);
      if (raw) {
        const parsed = JSON.parse(raw) as CachedDetailEntry;
        if (
          parsed?.metadata?.version === CACHE_CONFIG.VERSION &&
          isUsableAdvisoryDetail(parsed.advisory)
        ) {
          const normalized: CachedDetailEntry = {
            ...parsed,
            advisory: ensureNormalizedAdvisoryDetail(parsed.advisory),
          };
          memoryDetailCache.set(normKey, normalized);
          return normalized;
        }
      }
    }
  } catch {
    // Ignore error
  }

  return null;
}

// --- Freshness Evaluation Helper ---

export function evaluateFreshness(fetchedAt: number): FreshnessState {
  const now = Date.now();
  const ageMs = now - fetchedAt;

  if (ageMs < 0) return "fresh";
  if (ageMs <= CACHE_CONFIG.FRESH_TTL_MS) {
    return "fresh";
  }
  if (ageMs <= CACHE_CONFIG.MAX_STALE_TTL_MS) {
    return "stale";
  }
  return "expired";
}

// --- Resilient Data Layer Interfaces ---

export interface ResilientAdvisoriesResult {
  status: "loading" | "success" | "error";
  advisories: Advisory[];
  totalRecords?: number;
  totalPages?: number;
  currentPage: number;
  hasUsableContent: boolean;
  isFresh: boolean;
  freshnessUnconfirmed: boolean;
  fetchedAt?: number;
  errorMessage?: string;
  isProvisional?: boolean;
}

export interface ResilientAdvisoryDetailResult {
  status: "loading" | "success" | "error";
  advisory?: AdvisoryDetail;
  hasUsableContent: boolean;
  isFresh: boolean;
  freshnessUnconfirmed: boolean;
  fetchedAt?: number;
  errorMessage?: string;
}

/**
 * Retrieves advisory listing with Stale-While-Revalidate, Request Deduplication,
 * and 2-level caching (L1 Memory + L2 IndexedDB/LocalStorage).
 */
export async function getResilientAdvisories(
  options: {
    page?: number;
    perPage?: number;
    fetchAll?: boolean;
    forceRefresh?: boolean;
    signal?: AbortSignal;
    onUpdate?: (updated: ResilientAdvisoriesResult) => void;
  } = {}
): Promise<ResilientAdvisoriesResult> {
  // 0. Entire Corpus Retrieval (prevents advisory collection truncation)
  if (options.fetchAll) {
    const allCacheKey = "corpus_all";
    const cachedAll = options.forceRefresh ? null : await retrieveListEntry(allCacheKey);

    if (cachedAll && isUsableAdvisoryList(cachedAll.advisories)) {
      const freshness = evaluateFreshness(cachedAll.metadata.fetchedAt);
      if (freshness === "fresh") {
        return {
          status: "success",
          advisories: cachedAll.advisories,
          totalRecords: cachedAll.advisories.length,
          totalPages: 1,
          currentPage: 1,
          hasUsableContent: true,
          isFresh: true,
          freshnessUnconfirmed: false,
          fetchedAt: cachedAll.metadata.fetchedAt,
          isProvisional: false,
        };
      }

      // Stale: trigger background revalidation
      triggerBackgroundAllListRevalidation(allCacheKey, cachedAll, options.onUpdate);

      return {
        status: "success",
        advisories: cachedAll.advisories,
        totalRecords: cachedAll.advisories.length,
        totalPages: 1,
        currentPage: 1,
        hasUsableContent: true,
        isFresh: false,
        freshnessUnconfirmed: false,
        fetchedAt: cachedAll.metadata.fetchedAt,
        isProvisional: false,
      };
    }

    // Check if partial listing exists (e.g. page=1&perPage=100 or page=1&perPage=10)
    // to show immediate content while fetching the full corpus in background
    const partial100 = await retrieveListEntry("page=1&perPage=100");
    const partial10 = !partial100 ? await retrieveListEntry("page=1&perPage=10") : null;
    const partial = partial100 || partial10;

    if (partial && isUsableAdvisoryList(partial.advisories)) {
      performLiveAllListFetch(allCacheKey, options.signal, options.onUpdate);
      return {
        status: "success",
        advisories: partial.advisories,
        totalRecords: partial.totalRecords || partial.advisories.length,
        totalPages: 1,
        currentPage: 1,
        hasUsableContent: true,
        isFresh: false,
        freshnessUnconfirmed: false,
        fetchedAt: partial.metadata.fetchedAt,
        isProvisional: true,
      };
    }

    return performLiveAllListFetch(allCacheKey, options.signal, options.onUpdate);
  }

  const page = options.page || 1;
  const perPage = options.perPage || 10;
  const cacheKey = `page=${page}&perPage=${perPage}`;

  // 1. Check existing direct cache for this key unless forceRefresh requested
  const cached = options.forceRefresh ? null : await retrieveListEntry(cacheKey);

  if (cached && isUsableAdvisoryList(cached.advisories)) {
    const freshness = evaluateFreshness(cached.metadata.fetchedAt);

    if (freshness === "fresh") {
      // Fresh usable data available immediately
      return {
        status: "success",
        advisories: cached.advisories,
        totalRecords: cached.totalRecords,
        totalPages: cached.totalPages,
        currentPage: page,
        hasUsableContent: true,
        isFresh: true,
        freshnessUnconfirmed: false,
        fetchedAt: cached.metadata.fetchedAt,
        isProvisional: false,
      };
    }

    // Stale usable data exists: trigger quiet background verification with freshness window
    triggerBackgroundListRevalidation(page, perPage, cacheKey, cached, options.onUpdate);

    // Return usable data immediately for instant reading without delay
    return {
      status: "success",
      advisories: cached.advisories,
      totalRecords: cached.totalRecords,
      totalPages: cached.totalPages,
      currentPage: page,
      hasUsableContent: true,
      isFresh: false,
      freshnessUnconfirmed: false,
      fetchedAt: cached.metadata.fetchedAt,
      isProvisional: false,
    };
  }

  // 2. Cross-route cache reuse for Page 1 listing (10 records):
  // If the complete 10-record list is not yet cached, check if the homepage (page=1&perPage=5)
  // has already retrieved usable records.
  if (page === 1 && perPage === 10 && !options.forceRefresh) {
    const hpCached = await retrieveListEntry("page=1&perPage=5");
    if (hpCached && isUsableAdvisoryList(hpCached.advisories)) {
      // Start the deduplicated authoritative 10-record fetch in background
      performLiveListFetch(page, perPage, cacheKey, options.signal).then((fullLive) => {
        if (options.onUpdate) {
          options.onUpdate(fullLive);
        }
      });

      // Yield immediate usable content (provisional 5 records) without fabricating pagination
      return {
        status: "success",
        advisories: hpCached.advisories.slice(0, 5),
        totalRecords: undefined,
        totalPages: undefined,
        currentPage: 1,
        hasUsableContent: true,
        isFresh: evaluateFreshness(hpCached.metadata.fetchedAt) === "fresh",
        freshnessUnconfirmed: false,
        fetchedAt: hpCached.metadata.fetchedAt,
        isProvisional: true,
      };
    }
  }

  // 3. No usable cache or forced refresh: perform live fetch
  return performLiveListFetch(page, perPage, cacheKey, options.signal);
}

/**
 * Deduplicated live network fetch for advisory list
 */
function performLiveListFetch(
  page: number,
  perPage: number,
  cacheKey: string,
  signal?: AbortSignal
): Promise<ResilientAdvisoriesResult> {
  if (inFlightListRequests.has(cacheKey)) {
    return inFlightListRequests.get(cacheKey)!.then((liveResult) =>
      mapLiveListResultToResilient(liveResult, page)
    );
  }

  const livePromise = fetchLiveAdvisories({ page, perPage, signal })
    .then(async (liveResult) => {
      if (liveResult.status === "success" && isUsableAdvisoryList(liveResult.advisories)) {
        const fetchedAt = Date.now();
        const entry: CachedListEntry = {
          key: cacheKey,
          advisories: liveResult.advisories,
          totalRecords: liveResult.totalRecords,
          totalPages: liveResult.totalPages,
          currentPage: page,
          metadata: {
            version: CACHE_CONFIG.VERSION,
            fetchedAt,
            lastAttemptedAt: fetchedAt,
            sourceUrl: buildWordPressPostsEndpoint({ perPage, page }),
          },
        };
        await persistListEntry(entry);
      }
      return liveResult;
    })
    .finally(() => {
      inFlightListRequests.delete(cacheKey);
    });

  inFlightListRequests.set(cacheKey, livePromise);

  return livePromise.then((liveResult) =>
    mapLiveListResultToResilient(liveResult, page)
  );
}

function mapLiveListResultToResilient(
  liveResult: AdvisoryFetchResult,
  page: number
): ResilientAdvisoriesResult {
  if (liveResult.status === "success" && isUsableAdvisoryList(liveResult.advisories)) {
    return {
      status: "success",
      advisories: liveResult.advisories,
      totalRecords: liveResult.totalRecords,
      totalPages: liveResult.totalPages,
      currentPage: page,
      hasUsableContent: true,
      isFresh: true,
      freshnessUnconfirmed: false,
      fetchedAt: Date.now(),
    };
  }
  return {
    status: "error",
    advisories: [],
    currentPage: page,
    hasUsableContent: false,
    isFresh: false,
    freshnessUnconfirmed: false,
    errorMessage:
      liveResult.errorMessage ||
      "Advisory information is currently unavailable.",
  };
}

/**
 * Quiet background revalidation for advisory listing.
 * Employs the configurable freshness confirmation threshold (40s).
 */
function triggerBackgroundListRevalidation(
  page: number,
  perPage: number,
  cacheKey: string,
  staleEntry: CachedListEntry,
  onUpdate?: (updated: ResilientAdvisoriesResult) => void
): void {
  if (inFlightListRequests.has(cacheKey)) return;

  let isCompleted = false;

  // Freshness timer for State C: If background check remains unresolved after threshold, notify
  const freshnessTimer = setTimeout(() => {
    if (!isCompleted && onUpdate) {
      onUpdate({
        status: "success",
        advisories: staleEntry.advisories,
        totalRecords: staleEntry.totalRecords,
        totalPages: staleEntry.totalPages,
        currentPage: page,
        hasUsableContent: true,
        isFresh: false,
        freshnessUnconfirmed: true,
        fetchedAt: staleEntry.metadata.fetchedAt,
      });
    }
  }, CACHE_CONFIG.FRESHNESS_CONFIRMATION_THRESHOLD_MS);

  const livePromise = fetchLiveAdvisories({ page, perPage })
    .then(async (liveResult) => {
      isCompleted = true;
      clearTimeout(freshnessTimer);

      if (liveResult.status === "success" && isUsableAdvisoryList(liveResult.advisories)) {
        const fetchedAt = Date.now();
        const entry: CachedListEntry = {
          key: cacheKey,
          advisories: liveResult.advisories,
          totalRecords: liveResult.totalRecords,
          totalPages: liveResult.totalPages,
          currentPage: page,
          metadata: {
            version: CACHE_CONFIG.VERSION,
            fetchedAt,
            lastAttemptedAt: fetchedAt,
            sourceUrl: buildWordPressPostsEndpoint({ perPage, page }),
          },
        };
        await persistListEntry(entry);

        if (onUpdate) {
          onUpdate({
            status: "success",
            advisories: liveResult.advisories,
            totalRecords: liveResult.totalRecords,
            totalPages: liveResult.totalPages,
            currentPage: page,
            hasUsableContent: true,
            isFresh: true,
            freshnessUnconfirmed: false,
            fetchedAt,
          });
        }
      } else {
        // Revalidation failed - show freshness limitation without destroying usable cached content
        if (onUpdate) {
          onUpdate({
            status: "success",
            advisories: staleEntry.advisories,
            totalRecords: staleEntry.totalRecords,
            totalPages: staleEntry.totalPages,
            currentPage: page,
            hasUsableContent: true,
            isFresh: false,
            freshnessUnconfirmed: true,
            fetchedAt: staleEntry.metadata.fetchedAt,
          });
        }
      }
      return liveResult;
    })
    .catch(() => {
      isCompleted = true;
      clearTimeout(freshnessTimer);
      if (onUpdate) {
        onUpdate({
          status: "success",
          advisories: staleEntry.advisories,
          totalRecords: staleEntry.totalRecords,
          totalPages: staleEntry.totalPages,
          currentPage: page,
          hasUsableContent: true,
          isFresh: false,
          freshnessUnconfirmed: true,
          fetchedAt: staleEntry.metadata.fetchedAt,
        });
      }
      return {
        status: "error" as const,
        advisories: [],
        errorMessage: "Connection unavailable",
      };
    })
    .finally(() => {
      inFlightListRequests.delete(cacheKey);
    });

  inFlightListRequests.set(cacheKey, livePromise);
}

/**
 * Deduplicated live network fetch for entire advisory corpus
 */
function performLiveAllListFetch(
  cacheKey: string,
  signal?: AbortSignal,
  onUpdate?: (updated: ResilientAdvisoriesResult) => void
): Promise<ResilientAdvisoriesResult> {
  if (inFlightListRequests.has(cacheKey)) {
    return inFlightListRequests.get(cacheKey)!.then((liveResult) =>
      mapLiveListResultToResilient(liveResult, 1)
    );
  }

  const livePromise = fetchAllLiveAdvisories({
    signal,
    onPageProgress: (currentAdvisories, page) => {
      // Stream initial progress so the user never encounters a blank screen
      if (page === 1 && onUpdate) {
        onUpdate({
          status: "success",
          advisories: currentAdvisories,
          totalRecords: currentAdvisories.length,
          totalPages: 1,
          currentPage: 1,
          hasUsableContent: true,
          isFresh: false,
          freshnessUnconfirmed: false,
          fetchedAt: Date.now(),
          isProvisional: true,
        });
      }
    },
  })
    .then(async (liveResult) => {
      if (liveResult.status === "success" && isUsableAdvisoryList(liveResult.advisories)) {
        const fetchedAt = Date.now();
        const entry: CachedListEntry = {
          key: cacheKey,
          advisories: liveResult.advisories,
          totalRecords: liveResult.advisories.length,
          totalPages: 1,
          currentPage: 1,
          metadata: {
            version: CACHE_CONFIG.VERSION,
            fetchedAt,
            lastAttemptedAt: fetchedAt,
            sourceUrl: buildWordPressCorpusEndpoint(),
          },
        };
        await persistListEntry(entry);
      }
      return liveResult;
    })
    .finally(() => {
      inFlightListRequests.delete(cacheKey);
    });

  inFlightListRequests.set(cacheKey, livePromise);

  return livePromise.then((liveResult) =>
    mapLiveListResultToResilient(liveResult, 1)
  );
}

/**
 * Quiet background revalidation for the entire advisory corpus.
 */
function triggerBackgroundAllListRevalidation(
  cacheKey: string,
  staleEntry: CachedListEntry,
  onUpdate?: (updated: ResilientAdvisoriesResult) => void
): void {
  if (inFlightListRequests.has(cacheKey)) return;

  let isCompleted = false;

  const freshnessTimer = setTimeout(() => {
    if (!isCompleted && onUpdate) {
      onUpdate({
        status: "success",
        advisories: staleEntry.advisories,
        totalRecords: staleEntry.totalRecords,
        totalPages: staleEntry.totalPages,
        currentPage: 1,
        hasUsableContent: true,
        isFresh: false,
        freshnessUnconfirmed: true,
        fetchedAt: staleEntry.metadata.fetchedAt,
      });
    }
  }, CACHE_CONFIG.FRESHNESS_CONFIRMATION_THRESHOLD_MS);

  const livePromise = fetchAllLiveAdvisories()
    .then(async (liveResult) => {
      isCompleted = true;
      clearTimeout(freshnessTimer);

      if (liveResult.status === "success" && isUsableAdvisoryList(liveResult.advisories)) {
        const fetchedAt = Date.now();
        const entry: CachedListEntry = {
          key: cacheKey,
          advisories: liveResult.advisories,
          totalRecords: liveResult.advisories.length,
          totalPages: 1,
          currentPage: 1,
          metadata: {
            version: CACHE_CONFIG.VERSION,
            fetchedAt,
            lastAttemptedAt: fetchedAt,
            sourceUrl: buildWordPressCorpusEndpoint(),
          },
        };
        await persistListEntry(entry);

        if (onUpdate) {
          onUpdate({
            status: "success",
            advisories: liveResult.advisories,
            totalRecords: liveResult.advisories.length,
            totalPages: 1,
            currentPage: 1,
            hasUsableContent: true,
            isFresh: true,
            freshnessUnconfirmed: false,
            fetchedAt,
          });
        }
      } else {
        if (onUpdate) {
          onUpdate({
            status: "success",
            advisories: staleEntry.advisories,
            totalRecords: staleEntry.totalRecords,
            totalPages: staleEntry.totalPages,
            currentPage: 1,
            hasUsableContent: true,
            isFresh: false,
            freshnessUnconfirmed: true,
            fetchedAt: staleEntry.metadata.fetchedAt,
          });
        }
      }
      return liveResult;
    })
    .catch(() => {
      isCompleted = true;
      clearTimeout(freshnessTimer);
      if (onUpdate) {
        onUpdate({
          status: "success",
          advisories: staleEntry.advisories,
          totalRecords: staleEntry.totalRecords,
          totalPages: staleEntry.totalPages,
          currentPage: 1,
          hasUsableContent: true,
          isFresh: false,
          freshnessUnconfirmed: true,
          fetchedAt: staleEntry.metadata.fetchedAt,
        });
      }
      return {
        status: "error" as const,
        advisories: [],
        errorMessage: "Connection unavailable",
      };
    })
    .finally(() => {
      inFlightListRequests.delete(cacheKey);
    });

  inFlightListRequests.set(cacheKey, livePromise);
}

/**
 * Retrieves a single advisory detail with Stale-While-Revalidate, Request Deduplication,
 * and 2-level caching (L1 Memory + L2 IndexedDB/LocalStorage).
 */
export async function getResilientAdvisoryDetail(
  idOrSlug: string | number,
  options: {
    forceRefresh?: boolean;
    signal?: AbortSignal;
    onUpdate?: (updated: ResilientAdvisoryDetailResult) => void;
  } = {}
): Promise<ResilientAdvisoryDetailResult> {
  const normKey = String(idOrSlug).toLowerCase().trim();

  // 1. Check existing cache unless forceRefresh requested
  const cached = options.forceRefresh ? null : await retrieveDetailEntry(normKey);

  if (cached && isUsableAdvisoryDetail(cached.advisory)) {
    const freshness = evaluateFreshness(cached.metadata.fetchedAt);

    if (freshness === "fresh") {
      return {
        status: "success",
        advisory: cached.advisory,
        hasUsableContent: true,
        isFresh: true,
        freshnessUnconfirmed: false,
        fetchedAt: cached.metadata.fetchedAt,
      };
    }

    // Stale usable detail: trigger quiet background verification with freshness window
    triggerBackgroundDetailRevalidation(normKey, cached, options.onUpdate);

    return {
      status: "success",
      advisory: cached.advisory,
      hasUsableContent: true,
      isFresh: false,
      freshnessUnconfirmed: false,
      fetchedAt: cached.metadata.fetchedAt,
    };
  }

  // 2. No usable cache or forced refresh: perform live fetch
  return performLiveDetailFetch(normKey, options.signal);
}

/**
 * Deduplicated live network fetch for advisory detail
 */
function performLiveDetailFetch(
  idOrSlug: string,
  signal?: AbortSignal
): Promise<ResilientAdvisoryDetailResult> {
  if (inFlightDetailRequests.has(idOrSlug)) {
    return inFlightDetailRequests.get(idOrSlug)!.then((liveResult) =>
      mapLiveDetailResultToResilient(liveResult)
    );
  }

  const livePromise = fetchLiveAdvisoryDetail(idOrSlug, { signal })
    .then(async (liveResult) => {
      if (liveResult.status === "success" && isUsableAdvisoryDetail(liveResult.advisory)) {
        const fetchedAt = Date.now();
        const entry: CachedDetailEntry = {
          key: idOrSlug,
          advisory: liveResult.advisory,
          metadata: {
            version: CACHE_CONFIG.VERSION,
            fetchedAt,
            lastAttemptedAt: fetchedAt,
            sourceUrl: liveResult.advisory.url,
          },
        };
        await persistDetailEntry(entry);
      }
      return liveResult;
    })
    .finally(() => {
      inFlightDetailRequests.delete(idOrSlug);
    });

  inFlightDetailRequests.set(idOrSlug, livePromise);

  return livePromise.then((liveResult) =>
    mapLiveDetailResultToResilient(liveResult)
  );
}

function mapLiveDetailResultToResilient(
  liveResult: AdvisoryDetailFetchResult
): ResilientAdvisoryDetailResult {
  if (liveResult.status === "success" && isUsableAdvisoryDetail(liveResult.advisory)) {
    return {
      status: "success",
      advisory: liveResult.advisory,
      hasUsableContent: true,
      isFresh: true,
      freshnessUnconfirmed: false,
      fetchedAt: Date.now(),
    };
  }
  return {
    status: "error",
    hasUsableContent: false,
    isFresh: false,
    freshnessUnconfirmed: false,
    errorMessage:
      liveResult.errorMessage ||
      "Advisory information is currently unavailable.",
  };
}

/**
 * Quiet background revalidation for single advisory detail.
 * Employs the configurable freshness confirmation threshold (40s).
 */
function triggerBackgroundDetailRevalidation(
  idOrSlug: string,
  staleEntry: CachedDetailEntry,
  onUpdate?: (updated: ResilientAdvisoryDetailResult) => void
): void {
  if (inFlightDetailRequests.has(idOrSlug)) return;

  let isCompleted = false;

  const freshnessTimer = setTimeout(() => {
    if (!isCompleted && onUpdate) {
      onUpdate({
        status: "success",
        advisory: staleEntry.advisory,
        hasUsableContent: true,
        isFresh: false,
        freshnessUnconfirmed: true,
        fetchedAt: staleEntry.metadata.fetchedAt,
      });
    }
  }, CACHE_CONFIG.FRESHNESS_CONFIRMATION_THRESHOLD_MS);

  const livePromise = fetchLiveAdvisoryDetail(idOrSlug)
    .then(async (liveResult) => {
      isCompleted = true;
      clearTimeout(freshnessTimer);

      if (liveResult.status === "success" && isUsableAdvisoryDetail(liveResult.advisory)) {
        const fetchedAt = Date.now();
        const entry: CachedDetailEntry = {
          key: idOrSlug,
          advisory: liveResult.advisory,
          metadata: {
            version: CACHE_CONFIG.VERSION,
            fetchedAt,
            lastAttemptedAt: fetchedAt,
            sourceUrl: liveResult.advisory.url,
          },
        };
        await persistDetailEntry(entry);

        if (onUpdate) {
          onUpdate({
            status: "success",
            advisory: liveResult.advisory,
            hasUsableContent: true,
            isFresh: true,
            freshnessUnconfirmed: false,
            fetchedAt,
          });
        }
      } else {
        if (onUpdate) {
          onUpdate({
            status: "success",
            advisory: staleEntry.advisory,
            hasUsableContent: true,
            isFresh: false,
            freshnessUnconfirmed: true,
            fetchedAt: staleEntry.metadata.fetchedAt,
          });
        }
      }
      return liveResult;
    })
    .catch(() => {
      isCompleted = true;
      clearTimeout(freshnessTimer);
      if (onUpdate) {
        onUpdate({
          status: "success",
          advisory: staleEntry.advisory,
          hasUsableContent: true,
          isFresh: false,
          freshnessUnconfirmed: true,
          fetchedAt: staleEntry.metadata.fetchedAt,
        });
      }
      return {
        status: "error" as const,
        errorMessage: "Connection unavailable",
      };
    })
    .finally(() => {
      inFlightDetailRequests.delete(idOrSlug);
    });

  inFlightDetailRequests.set(idOrSlug, livePromise);
}

// --- Intelligent Advisory Detail Prefetching (Phase 3) ---

export const PREFETCH_CONFIG = {
  MAX_CONCURRENT: 2,
  TOP_CANDIDATES_LIMIT: 3,
  HOVER_DEBOUNCE_MS: 65,
} as const;

/**
 * Checks client environment and network connection hints to determine if speculative
 * prefetching should run. Respects user Save-Data headers and slow network types (2g/slow-2g).
 */
export function shouldPerformSpeculativePrefetch(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as unknown as {
    connection?: {
      saveData?: boolean;
      effectiveType?: string;
    };
  };
  if (nav.connection?.saveData === true) return false;
  if (nav.connection?.effectiveType === "slow-2g" || nav.connection?.effectiveType === "2g") {
    return false;
  }
  return true;
}

interface PrefetchTask {
  idOrSlug: string;
  priority: "high" | "low";
}

const prefetchQueue: PrefetchTask[] = [];
const activePrefetchKeys = new Set<string>();
let activePrefetchCount = 0;

function processPrefetchQueue(): void {
  if (!shouldPerformSpeculativePrefetch()) {
    prefetchQueue.length = 0;
    return;
  }

  while (activePrefetchCount < PREFETCH_CONFIG.MAX_CONCURRENT && prefetchQueue.length > 0) {
    // Prioritize high-priority interaction intent tasks first
    const highIdx = prefetchQueue.findIndex((t) => t.priority === "high");
    const task = highIdx >= 0 ? prefetchQueue.splice(highIdx, 1)[0] : prefetchQueue.shift()!;
    const normKey = String(task.idOrSlug).toLowerCase().trim();

    // Check if already in L1 memory cache and fresh
    const mem = getSynchronousMemoryDetailEntry(normKey);
    if (mem && evaluateFreshness(mem.metadata.fetchedAt) === "fresh") {
      activePrefetchKeys.delete(normKey);
      continue;
    }

    // Check if already currently being prefetched
    if (activePrefetchKeys.has(normKey)) {
      continue;
    }

    activePrefetchCount++;
    activePrefetchKeys.add(normKey);

    getResilientAdvisoryDetail(normKey)
      .catch(() => {
        // Silently catch speculative errors without affecting UI
      })
      .finally(() => {
        activePrefetchCount--;
        activePrefetchKeys.delete(normKey);
        if (typeof window !== "undefined") {
          if (typeof window.requestIdleCallback === "function") {
            window.requestIdleCallback(() => processPrefetchQueue());
          } else {
            setTimeout(processPrefetchQueue, 40);
          }
        }
      });
  }
}

/**
 * Prefetches an individual advisory detail speculatively into the existing L1/L2 cache.
 * High priority: triggered by user interaction intent (hover, keyboard focus, touchstart).
 * Low priority: triggered during idle time for top candidate advisories.
 */
export function prefetchAdvisoryDetail(
  idOrSlug: string | number,
  priority: "high" | "low" = "low"
): void {
  if (!idOrSlug) return;
  const normKey = String(idOrSlug).toLowerCase().trim();

  // If already synchronously in L1 and fresh, no action needed
  const mem = getSynchronousMemoryDetailEntry(normKey);
  if (mem && evaluateFreshness(mem.metadata.fetchedAt) === "fresh") {
    return;
  }

  if (activePrefetchKeys.has(normKey)) {
    return;
  }

  // Remove existing queued task for the same key if any to upgrade priority or avoid duplicates
  const existingIdx = prefetchQueue.findIndex(
    (t) => String(t.idOrSlug).toLowerCase().trim() === normKey
  );
  if (existingIdx >= 0) {
    if (priority === "high") {
      prefetchQueue[existingIdx].priority = "high";
    }
  } else {
    if (priority === "high") {
      prefetchQueue.unshift({ idOrSlug: normKey, priority });
    } else {
      prefetchQueue.push({ idOrSlug: normKey, priority });
    }
  }

  if (priority === "high") {
    processPrefetchQueue();
  } else {
    if (typeof window !== "undefined") {
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(() => processPrefetchQueue(), { timeout: 2000 });
      } else {
        setTimeout(processPrefetchQueue, 150);
      }
    }
  }
}

/**
 * Schedules background idle prefetching for the top N visible/recent advisories.
 */
export function prefetchTopAdvisories(
  advisories: Advisory[],
  limit: number = PREFETCH_CONFIG.TOP_CANDIDATES_LIMIT
): void {
  if (!advisories || advisories.length === 0) return;
  if (!shouldPerformSpeculativePrefetch()) return;

  const candidates = advisories.slice(0, limit);
  for (const item of candidates) {
    const slugOrId = item.slug || String(item.id);
    if (slugOrId) {
      prefetchAdvisoryDetail(slugOrId, "low");
    }
  }
}
