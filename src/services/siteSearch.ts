/**
 * Global Site Search Adapter for TT-CSIRT Portal
 *
 * Preserves the public API expected by existing components while
 * delegating all indexing, normalization, scoring, and caching
 * to the dedicated search engine module in `src/services/search/`.
 */

import {
  SearchDocument as CoreSearchDocument,
  SearchResultItem as CoreSearchResultItem,
  SearchResponse,
  SearchOptions,
  siteSearchEngine,
  getCanonicalStaticDocuments,
} from "./search";

export type SearchDocument = CoreSearchDocument;
export type SearchResultItem = CoreSearchResultItem;

export type {
  SearchContentType,
  IndexedSearchDocument,
  SearchResponse,
  SearchOptions,
  SearchScoringWeights,
} from "./search";

export {
  DEFAULT_SEARCH_WEIGHTS,
  CONTENT_TYPE_PRIORITY,
  siteSearchEngine,
  getCanonicalStaticDocuments,
  buildSearchIndex,
  normalizeText,
  normalizeCompact,
  tokenize,
  extractCveIdentifiers,
  extractAdvisoryIdentifiers,
  damerauLevenshteinDistance,
  calculateSimilarity,
  CURATED_ALIASES,
  resolveAliasToCanonical,
  getAliasesForCanonical,
  getQueryExpansions,
  hydrateSearchCorpus,
} from "./search";

/**
 * Static documents indexing curated hubs, services, guides, and strategic resources.
 * Derived directly from canonical application manifests.
 */
export const STATIC_SEARCH_DOCUMENTS: SearchDocument[] = getCanonicalStaticDocuments();

/**
 * Primary search function for TT-CSIRT portal.
 * Executes deterministic, multi-tier ranking (exact > prefix > alias > fuzzy).
 */
export function searchSite(query: string, options?: SearchOptions): SearchResultItem[] {
  return siteSearchEngine.search(query, options).results;
}

/**
 * Detailed search execution returning timing metrics, typo correction suggestions,
 * and deterministic match diagnostics.
 */
export function searchSiteDetailed(query: string, options?: SearchOptions): SearchResponse {
  return siteSearchEngine.search(query, options);
}
