/**
 * Search Types and Document Model for TT-CSIRT Global Site Search
 */

export type SearchContentType =
  | "advisory"
  | "alert"
  | "guidance"
  | "service"
  | "training"
  | "event"
  | "news"
  | "statistics"
  | "institutional"
  | "page";

/**
 * Raw search document derived from canonical content sources
 */
export interface SearchDocument {
  id: string;
  title: string;
  description?: string;
  href: string;
  type: SearchContentType;
  date?: string;
  keywords?: string[];
  aliases?: string[];
  searchText?: string;

  // Backwards compatibility and rich presentation fields:
  summary: string;
  categoryLabel?: string;
  cves?: string[];
  advisoryId?: string;
  publishedAt?: string;
}

/**
 * Indexed search document with precomputed normalized fields for O(1) matching
 */
export interface IndexedSearchDocument extends SearchDocument {
  normalizedTitle: string;
  normalizedDescription: string;
  normalizedKeywords: string[];
  normalizedAliases: string[];
  normalizedSearchText: string;
  tokenizedTitle: string[];
  tokenizedDescription: string[];
  tokenizedKeywords: string[];
  titleTokenSet: Set<string>;
  descriptionTokenSet: Set<string>;
  keywordTokenSet: Set<string>;
  cvesUpper: string[];
  advisoryIdsUpper: string[];
}

/**
 * Scoring breakdown for transparency and deterministic ranking
 */
export interface ScoreBreakdown {
  exactIdentifier: number;
  exactTitle: number;
  titlePhrase: number;
  titlePrefix: number;
  topicGuidanceBoost: number;
  titleTokenMatches: number;
  allTitleTokensBonus: number;
  exactKeyword: number;
  exactAlias: number;
  descriptionPhrase: number;
  descriptionTokenMatches: number;
  allDescriptionTokensBonus: number;
  bodyTokenMatches: number;
  urlMatch: number;
  fuzzyPenalty: number;
  fuzzyConfidence: number;
}

/**
 * Scored search result item
 */
export interface SearchResultItem {
  document: SearchDocument;
  score: number;
  matchedCve?: string;
  matchedIdentifier?: string;
  matchedAlias?: string;
  isFuzzyMatch?: boolean;
  scoreBreakdown?: ScoreBreakdown;
}

/**
 * Full search execution response
 */
export interface SearchResponse {
  query: string;
  normalizedQuery: string;
  results: SearchResultItem[];
  totalResults: number;
  executionTimeMs: number;
  suggestedQuery?: string;
  correctedQuery?: string;
  originalQuery?: string;
  isFuzzyRecovered?: boolean;
}

/**
 * Search options passed to the engine
 */
export interface SearchOptions {
  limit?: number;
  typeFilter?: SearchContentType | SearchContentType[];
  allowFuzzy?: boolean;
  exactOnly?: boolean;
  includeBreakdown?: boolean;
}

/**
 * Configurable weights for relevance calculation
 */
export interface SearchScoringWeights {
  exactIdentifier: number;
  exactTitle: number;
  titlePhrase: number;
  titlePrefix: number;
  topicGuidanceBoost: number;
  titleToken: number;
  allTitleTokensBonus: number;
  exactKeyword: number;
  exactAlias: number;
  descriptionPhrase: number;
  descriptionToken: number;
  allDescriptionTokensBonus: number;
  bodyToken: number;
  urlMatch: number;
  fuzzyTitle: number;
  fuzzyDescription: number;
  fuzzyPenaltyPerEdit: number;
  minFuzzyConfidence: number;
}
