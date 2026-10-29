import { IncidentStatistics, FALLBACK_STATISTICS } from "./statistics";

export interface CachedStatistics {
  metadata: {
    fetchedAt: number;
    isFallback?: boolean;
  };
  data: IncidentStatistics;
}

const CACHE_KEY = "ttcsirt_statistics_v2";

// We use an in-memory cache to guarantee synchronous reads across the app once loaded
let memoryCache: CachedStatistics | null = null;

export function getSynchronousStatistics(): CachedStatistics | null {
  if (memoryCache) return memoryCache;
  if (typeof window === "undefined" || !window.localStorage) return null;
  
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CachedStatistics;
      if (parsed && parsed.data && parsed.metadata) {
        memoryCache = parsed;
        return parsed;
      }
    }
  } catch (e) {
    // Ignore
  }
  return null;
}

export async function getResilientStatistics(): Promise<CachedStatistics> {
  const cacheEntry: CachedStatistics = {
    metadata: { fetchedAt: Date.now(), isFallback: false },
    data: FALLBACK_STATISTICS,
  };
  memoryCache = cacheEntry;

  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(CACHE_KEY, JSON.stringify(cacheEntry));
    } catch {
      // The canonical in-memory dataset remains available when storage is disabled or full.
    }
  }

  return cacheEntry;
}
