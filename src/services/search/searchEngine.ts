/**
 * Deterministic, High-Performance Client-Side Site Search Engine for TT-CSIRT
 *
 * Implements Google Chromium Omnibox architectural principles:
 * 1. Multi-tiered scoring signals
 * 2. Exact matches strictly outranking fuzzy/partial matches
 * 3. Bounded typo tolerance with strict confidence thresholds (rejecting garbage)
 * 4. Deterministic secondary ordering (no iteration or timing variance)
 * 5. Bounded LRU query caching
 * 6. Non-destructive "Did you mean" recovery
 */

import {
  IndexedSearchDocument,
  SearchOptions,
  SearchResponse,
  SearchResultItem,
  SearchScoringWeights,
} from "./searchTypes";
import {
  normalizeText,
  normalizeCompact,
  tokenize,
  damerauLevenshteinDistance,
  calculateSimilarity,
  similarityFromDistance,
} from "./searchNormalize";
import {
  scoreDocument,
  compareSearchResults,
  DEFAULT_SEARCH_WEIGHTS,
} from "./searchScore";
import { buildSearchIndex } from "./searchIndex";
import { resolveAliasToCanonical, getAliasesForCanonical } from "./searchAliases";
import {
  getResilientAdvisories,
  retrieveListEntry,
  isUsableAdvisoryList,
} from "../advisoryCache";

/**
 * Lightweight, bounded LRU cache for search queries
 */
class BoundedSearchCache {
  private cache = new Map<string, SearchResponse>();
  private readonly maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  get(key: string): SearchResponse | undefined {
    const item = this.cache.get(key);
    if (item) {
      // Re-insert for LRU freshness
      this.cache.delete(key);
      this.cache.set(key, item);
    }
    return item;
  }

  set(key: string, value: SearchResponse): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }
}

export class SiteSearchEngine {
  private indexedDocuments: IndexedSearchDocument[] = [];
  private vocabulary: Map<string, number> = new Map();
  private cache = new BoundedSearchCache(100);
  private weights: SearchScoringWeights = DEFAULT_SEARCH_WEIGHTS;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.rebuildIndex();
  }

  /**
   * Subscribes to search index changes (e.g. following background corpus hydration)
   */
  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error("Search listener error:", err);
      }
    });
  }

  /**
   * Builds or refreshes the immutable search index
   */
  public rebuildIndex(): void {
    const indexData = buildSearchIndex();
    this.indexedDocuments = indexData.documents;
    this.vocabulary = indexData.vocabulary;
    this.cache.clear();
    this.notifyListeners();
  }

  /**
   * Returns all indexed documents
   */
  public getDocuments(): readonly IndexedSearchDocument[] {
    return this.indexedDocuments;
  }

  /**
   * Attempts to find a high-confidence spelling correction for a query or query token.
   * Rejects queries with low similarity (e.g. "asdfghjkl") by returning null.
   */
  public findSpellingCorrection(query: string): string | null {
    const norm = normalizeText(query);
    if (!norm || norm.length < 4) return null;

    const words = norm.split(/\s+/);
    let anyWordCorrected = false;
    const correctedWords: string[] = [];

    for (const word of words) {
      if (word.length < 4) {
        correctedWords.push(word);
        continue;
      }

      // If word already exists in vocabulary with good frequency, don't correct it
      if (this.vocabulary.has(word)) {
        correctedWords.push(word);
        continue;
      }

      let bestCandidate: string | null = null;
      let bestSimilarity = 0;
      let minDistance = 999;
      let maxFrequency = 0;

      for (const [vocabWord, freq] of this.vocabulary.entries()) {
        const lenDiff = Math.abs(vocabWord.length - word.length);
        if (lenDiff > 2) continue;

        const dist = damerauLevenshteinDistance(word, vocabWord);
        // Only accept edit distance 1 for 4-5 letter words, max 2 for 6+ letters
        const maxAllowedDist = word.length <= 5 ? 1 : 2;

        if (dist <= maxAllowedDist) {
          const sim = similarityFromDistance(dist, word.length, vocabWord.length);
          if (sim >= this.weights.minFuzzyConfidence) {
            if (
              dist < minDistance ||
              (dist === minDistance && sim > bestSimilarity) ||
              (dist === minDistance && sim === bestSimilarity && freq > maxFrequency)
            ) {
              minDistance = dist;
              bestSimilarity = sim;
              bestCandidate = vocabWord;
              maxFrequency = freq;
            }
          }
        }
      }

      if (bestCandidate && bestSimilarity >= this.weights.minFuzzyConfidence) {
        correctedWords.push(bestCandidate);
        anyWordCorrected = true;
      } else {
        correctedWords.push(word);
      }
    }

    if (!anyWordCorrected) return null;

    const candidatePhrase = correctedWords.join(" ");
    // Final sanity check: if the corrected phrase is identical, no correction
    if (candidatePhrase === norm) return null;

    return candidatePhrase;
  }

  /**
   * Executes a search query with deterministic scoring and ranking
   */
  public search(query: string, options: SearchOptions = {}): SearchResponse {
    const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();
    const rawTrimmed = (query || "").trim();

    if (!rawTrimmed) {
      return {
        query: "",
        normalizedQuery: "",
        results: [],
        totalResults: 0,
        executionTimeMs: 0,
      };
    }

    const limit = options.limit || 20;
    const cacheKey = `${rawTrimmed.toLowerCase()}__lim:${limit}__ex:${!!options.exactOnly}`;

    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const normQuery = normalizeText(rawTrimmed);

    // Step 1: Execute primary match on exact/prefix/alias/tokens
    const scoredList: SearchResultItem[] = [];

    for (const doc of this.indexedDocuments) {
      // Apply type filter if requested
      if (options.typeFilter) {
        if (Array.isArray(options.typeFilter)) {
          if (!options.typeFilter.includes(doc.type)) continue;
        } else if (doc.type !== options.typeFilter) {
          continue;
        }
      }

      const scored = scoreDocument(doc, rawTrimmed, this.weights, {
        allowFuzzy: false,
        exactOnly: options.exactOnly,
      });

      if (scored && scored.score > 0) {
        scoredList.push(scored);
      }
    }

    let isFuzzyRecovered = false;
    let correctedQuery: string | undefined;
    let suggestedQuery: string | undefined;

    // Step 2: If primary search yielded zero results and exactOnly is false, check for typo recovery
    if (scoredList.length === 0 && !options.exactOnly && options.allowFuzzy !== false) {
      const correction = this.findSpellingCorrection(rawTrimmed);

      if (correction) {
        suggestedQuery = correction;

        // Perform search using the corrected query
        for (const doc of this.indexedDocuments) {
          if (options.typeFilter) {
            if (Array.isArray(options.typeFilter)) {
              if (!options.typeFilter.includes(doc.type)) continue;
            } else if (doc.type !== options.typeFilter) {
              continue;
            }
          }

          const scored = scoreDocument(doc, correction, this.weights, {
            allowFuzzy: false,
            exactOnly: false,
          });

          if (scored && scored.score > 0) {
            // Apply fuzzy penalty because this is a spelling correction
            scored.score = Math.max(15, scored.score - 100);
            scored.isFuzzyMatch = true;
            scoredList.push(scored);
          }
        }

        if (scoredList.length > 0) {
          isFuzzyRecovered = true;
          correctedQuery = correction;
        }
      }

      // If still no results, attempt direct token-level fuzzy match on documents
      if (scoredList.length === 0) {
        for (const doc of this.indexedDocuments) {
          if (options.typeFilter) {
            if (Array.isArray(options.typeFilter)) {
              if (!options.typeFilter.includes(doc.type)) continue;
            } else if (doc.type !== options.typeFilter) {
              continue;
            }
          }

          const scored = scoreDocument(doc, rawTrimmed, this.weights, {
            allowFuzzy: true,
            exactOnly: false,
          });

          if (scored && scored.score > 0) {
            scoredList.push(scored);
            isFuzzyRecovered = true;
          }
        }
      }
    }

    // Step 3: Sort deterministically
    scoredList.sort(compareSearchResults);

    // Step 4: Bounded slice
    const boundedResults = scoredList.slice(0, limit);

    const endTime = typeof performance !== "undefined" ? performance.now() : Date.now();
    const executionTimeMs = Math.round((endTime - startTime) * 100) / 100;

    const response: SearchResponse = {
      query: rawTrimmed,
      normalizedQuery: normQuery,
      results: boundedResults,
      totalResults: scoredList.length,
      executionTimeMs,
      suggestedQuery,
      correctedQuery,
      originalQuery: rawTrimmed,
      isFuzzyRecovered,
    };

    this.cache.set(cacheKey, response);
    return response;
  }

  /**
   * Fast autocomplete suggestions (top 5)
   */
  public getSuggestions(query: string, limit = 5): SearchResultItem[] {
    const response = this.search(query, { limit, allowFuzzy: true });
    return response.results;
  }
}

// Global singleton instance for high performance and in-memory persistence
export const siteSearchEngine = new SiteSearchEngine();

/**
 * Public drop-in function matching existing siteSearch.ts API
 */
export function searchSite(query: string): SearchResultItem[] {
  return siteSearchEngine.search(query).results;
}

/**
 * Full detailed search function returning performance metadata and typo suggestions
 */
export function searchSiteDetailed(query: string, options?: SearchOptions): SearchResponse {
  return siteSearchEngine.search(query, options);
}

let corpusHydrationPromise: Promise<void> | null = null;

/**
 * Hydrates search corpus in the background using existing resilient advisory cache
 * without blocking UI rendering or main thread responsiveness.
 */
export function hydrateSearchCorpus(): Promise<void> {
  if (corpusHydrationPromise) return corpusHydrationPromise;

  corpusHydrationPromise = (async () => {
    try {
      // 1. Check L2 IndexedDB cache first for previously saved corpus
      if (typeof window !== "undefined") {
        const cached = await retrieveListEntry("corpus_all");
        if (cached && isUsableAdvisoryList(cached.advisories)) {
          siteSearchEngine.rebuildIndex();
        }
      }

      // 2. Hydrate full advisory corpus via resilient advisory cache
      await getResilientAdvisories({
        fetchAll: true,
        onUpdate: (updated) => {
          if (updated.advisories && updated.advisories.length > 0) {
            siteSearchEngine.rebuildIndex();
          }
        },
      });

      siteSearchEngine.rebuildIndex();
    } catch {
      // Non-blocking background hydration fails gracefully
    } finally {
      corpusHydrationPromise = null;
    }
  })();

  return corpusHydrationPromise;
}
