/**
 * Relevance Scoring Engine and Deterministic Sorting for TT-CSIRT Search
 */

import {
  IndexedSearchDocument,
  ScoreBreakdown,
  SearchResultItem,
  SearchScoringWeights,
} from "./searchTypes";
import {
  normalizeText,
  normalizeCompact,
  tokenize,
  extractCveIdentifiers,
  extractAdvisoryIdentifiers,
  calculateSimilarity,
  similarityFromDistance,
  damerauLevenshteinDistance,
} from "./searchNormalize";
import { resolveAliasToCanonical, getAliasesForCanonical } from "./searchAliases";

/**
 * Standard scoring weights adhering to invariant:
 * exact > prefix > alias > fuzzy
 */
export const DEFAULT_SEARCH_WEIGHTS: SearchScoringWeights = {
  exactIdentifier: 1000,
  exactTitle: 900,
  titlePhrase: 650,
  titlePrefix: 750,
  topicGuidanceBoost: 350,
  titleToken: 600,
  allTitleTokensBonus: 200,
  exactKeyword: 500,
  exactAlias: 450,
  descriptionPhrase: 350,
  descriptionToken: 250,
  allDescriptionTokensBonus: 100,
  bodyToken: 150,
  urlMatch: 200,
  fuzzyTitle: 120,
  fuzzyDescription: 40,
  fuzzyPenaltyPerEdit: 35,
  minFuzzyConfidence: 0.68,
};

/**
 * Content-type priority order for deterministic tie-breaking
 */
export const CONTENT_TYPE_PRIORITY: Record<string, number> = {
  service: 1,
  guidance: 2,
  advisory: 3,
  alert: 3,
  statistics: 4,
  training: 5,
  event: 6,
  news: 7,
  institutional: 8,
  page: 9,
};

/**
 * Evaluates a search document against a normalized query and returns a scored result item.
 */
export function scoreDocument(
  doc: IndexedSearchDocument,
  query: string,
  weights: SearchScoringWeights = DEFAULT_SEARCH_WEIGHTS,
  options: { allowFuzzy?: boolean; exactOnly?: boolean } = {}
): SearchResultItem | null {
  const normQuery = normalizeText(query);
  const compactQuery = normalizeCompact(query);
  if (!normQuery) return null;

  const queryTokens = tokenize(normQuery);
  if (queryTokens.length === 0) return null;

  const breakdown: ScoreBreakdown = {
    exactIdentifier: 0,
    exactTitle: 0,
    titlePhrase: 0,
    titlePrefix: 0,
    topicGuidanceBoost: 0,
    titleTokenMatches: 0,
    allTitleTokensBonus: 0,
    exactKeyword: 0,
    exactAlias: 0,
    descriptionPhrase: 0,
    descriptionTokenMatches: 0,
    allDescriptionTokensBonus: 0,
    bodyTokenMatches: 0,
    urlMatch: 0,
    fuzzyPenalty: 0,
    fuzzyConfidence: 0,
  };

  let matchedCve: string | undefined;
  let matchedIdentifier: string | undefined;
  let matchedAlias: string | undefined;
  let isFuzzyMatch = false;

  // ==========================================
  // TIER 1: EXACT IDENTIFIERS & INTENT
  // ==========================================
  const queryCves = extractCveIdentifiers(query);
  if (queryCves.length > 0) {
    const matchingCve = queryCves.find((cve) => doc.cvesUpper.includes(cve));
    if (!matchingCve) return null;

    if (doc.cvesUpper.length > 0) {
      breakdown.exactIdentifier += weights.exactIdentifier;
      matchedCve = matchingCve;
      matchedIdentifier = matchingCve;
    }
  }

  const queryAdvIds = extractAdvisoryIdentifiers(query);
  if (queryAdvIds.length > 0) {
    for (const advId of queryAdvIds) {
      if (
        doc.advisoryIdsUpper.includes(advId) ||
        doc.id.toUpperCase().includes(advId) ||
        doc.title.toUpperCase().includes(advId)
      ) {
        breakdown.exactIdentifier += weights.exactIdentifier;
        matchedIdentifier = advId;
        break;
      }
    }
  }

  // ==========================================
  // TIER 2: EXACT TITLE, PHRASE, & PREFIX
  // ==========================================
  const docNormTitle = doc.normalizedTitle;
  const docCompactTitle = normalizeCompact(doc.title);
  const docNormDesc = doc.normalizedDescription;

  // Exact full title match
  if (docNormTitle === normQuery || docCompactTitle === compactQuery) {
    breakdown.exactTitle = weights.exactTitle;
  }
  // Title prefix match
  else if (docNormTitle.startsWith(normQuery) || docCompactTitle.startsWith(compactQuery)) {
    breakdown.titlePrefix = weights.titlePrefix;
  }
  // Title contains exact phrase
  else if (docNormTitle.includes(normQuery) || (normQuery.length >= 4 && docCompactTitle.includes(compactQuery))) {
    breakdown.titlePhrase = weights.titlePhrase;
  }

  // Exact URL path match
  if (doc.href.toLowerCase().includes(normQuery)) {
    breakdown.urlMatch = weights.urlMatch;
  }

  // Title token matches
  let titleTokensMatched = 0;
  for (const token of queryTokens) {
    if (doc.titleTokenSet.has(token)) {
      titleTokensMatched++;
    } else {
      // Check prefix of title tokens for query words >= 4 chars
      if (token.length >= 4) {
        for (const titleToken of doc.tokenizedTitle) {
          if (titleToken.startsWith(token)) {
            titleTokensMatched += 0.8;
            break;
          }
        }
      }
    }
  }

  if (titleTokensMatched > 0) {
    breakdown.titleTokenMatches = Math.round(
      (titleTokensMatched / queryTokens.length) * weights.titleToken
    );
    if (titleTokensMatched >= queryTokens.length) {
      if (queryTokens.length > 1) {
        breakdown.allTitleTokensBonus = weights.allTitleTokensBonus;
      }
      const titleLength = doc.tokenizedTitle.length || 1;
      const densityBonus = Math.round(
        (queryTokens.length / Math.max(queryTokens.length, titleLength)) * 250
      );
      breakdown.allTitleTokensBonus += densityBonus;
    }
  }

  if (
    doc.type === "guidance" &&
    queryTokens.length === 1 &&
    getAliasesForCanonical(normQuery).length > 0 &&
    doc.titleTokenSet.has(queryTokens[0])
  ) {
    breakdown.topicGuidanceBoost = weights.topicGuidanceBoost;
  }

  // ==========================================
  // TIER 3: CURATED KEYWORDS & ALIASES
  // ==========================================
  // Exact keyword matches
  for (const kw of doc.normalizedKeywords) {
    if (kw === normQuery || (kw.length >= 4 && normalizeCompact(kw) === compactQuery)) {
      breakdown.exactKeyword = Math.max(breakdown.exactKeyword, weights.exactKeyword);
    } else if (kw.includes(normQuery)) {
      breakdown.exactKeyword = Math.max(breakdown.exactKeyword, Math.round(weights.exactKeyword * 0.7));
    }
  }

  // Keyword token matches
  let kwTokensMatched = 0;
  for (const token of queryTokens) {
    if (doc.keywordTokenSet.has(token)) {
      kwTokensMatched++;
    }
  }
  if (kwTokensMatched > 0) {
    breakdown.exactKeyword = Math.max(
      breakdown.exactKeyword,
      Math.round((kwTokensMatched / queryTokens.length) * (weights.exactKeyword * 0.8))
    );
  }

  // Curated alias resolution
  const canonicalQuery = resolveAliasToCanonical(normQuery) || resolveAliasToCanonical(compactQuery);
  if (canonicalQuery) {
    const canonicalTokens = tokenize(canonicalQuery);
    const allCanonicalTokensPresent =
      canonicalTokens.length > 0 &&
      canonicalTokens.every(
        (ct) => doc.titleTokenSet.has(ct) || doc.keywordTokenSet.has(ct) || doc.descriptionTokenSet.has(ct)
      );

    if (
      docNormTitle.includes(canonicalQuery) ||
      docNormDesc.includes(canonicalQuery) ||
      doc.normalizedKeywords.some((k) => k.includes(canonicalQuery)) ||
      allCanonicalTokensPresent
    ) {
      breakdown.exactAlias = weights.exactAlias;
      matchedAlias = canonicalQuery;
    }
  }

  // Reverse alias check: does query match an alias of this document's keywords/title?
  const possibleAliases = getAliasesForCanonical(normQuery);
  for (const alias of possibleAliases) {
    if (docNormTitle.includes(alias) || doc.keywordTokenSet.has(alias)) {
      breakdown.exactAlias = Math.max(breakdown.exactAlias, weights.exactAlias);
      matchedAlias = alias;
    }
  }

  // Document aliases check
  for (const docAlias of doc.normalizedAliases) {
    if (docAlias === normQuery || docAlias.includes(normQuery)) {
      breakdown.exactAlias = Math.max(breakdown.exactAlias, weights.exactAlias);
      matchedAlias = docAlias;
    }
  }

  // ==========================================
  // DESCRIPTION & SEARCH TEXT MATCHING
  // ==========================================
  if (docNormDesc) {
    if (docNormDesc.includes(normQuery)) {
      breakdown.descriptionPhrase = weights.descriptionPhrase;
    }

    let descTokensMatched = 0;
    for (const token of queryTokens) {
      if (doc.descriptionTokenSet.has(token)) {
        descTokensMatched++;
      }
    }
    if (descTokensMatched > 0) {
      breakdown.descriptionTokenMatches = Math.round(
        (descTokensMatched / queryTokens.length) * weights.descriptionToken
      );
      if (descTokensMatched >= queryTokens.length && queryTokens.length > 1) {
        breakdown.allDescriptionTokensBonus = weights.allDescriptionTokensBonus;
      }
    }
  }

  // Search text (deep body/metadata tokens)
  if (doc.normalizedSearchText) {
    let bodyMatched = 0;
    for (const token of queryTokens) {
      if (doc.normalizedSearchText.includes(token)) {
        bodyMatched++;
      }
    }
    if (bodyMatched > 0) {
      breakdown.bodyTokenMatches = Math.round(
        (bodyMatched / queryTokens.length) * weights.bodyToken
      );
    }
  }

  // Compute non-fuzzy raw score
  let totalScore =
    breakdown.exactIdentifier +
    breakdown.exactTitle +
    breakdown.titlePhrase +
    breakdown.titlePrefix +
    breakdown.topicGuidanceBoost +
    breakdown.titleTokenMatches +
    breakdown.allTitleTokensBonus +
    breakdown.exactKeyword +
    breakdown.exactAlias +
    breakdown.descriptionPhrase +
    breakdown.descriptionTokenMatches +
    breakdown.allDescriptionTokensBonus +
    breakdown.bodyTokenMatches +
    breakdown.urlMatch;

  // ==========================================
  // TIER 4: FUZZY RECOVERY (When exact score is low or zero)
  // ==========================================
  const canPerformFuzzy =
    options.allowFuzzy !== false &&
    !options.exactOnly &&
    totalScore === 0 &&
    normQuery.length >= 4;

  if (canPerformFuzzy) {
    let bestSimilarity = 0;
    let bestEditDistance = 999;
    let matchedField: "title" | "keyword" | "desc" | null = null;

    // Check against individual title tokens and full title
    for (const titleToken of doc.tokenizedTitle) {
      if (Math.abs(titleToken.length - normQuery.length) <= 2) {
        const dist = damerauLevenshteinDistance(normQuery, titleToken);
        if (dist <= 2 && dist < bestEditDistance) {
          const sim = similarityFromDistance(dist, normQuery.length, titleToken.length);
          if (sim >= weights.minFuzzyConfidence) {
            bestSimilarity = sim;
            bestEditDistance = dist;
            matchedField = "title";
          }
        }
      }
    }

    // Check against keywords
    if (bestEditDistance > 1) {
      for (const kw of doc.tokenizedKeywords) {
        if (Math.abs(kw.length - normQuery.length) <= 2) {
          const dist = damerauLevenshteinDistance(normQuery, kw);
          if (dist <= 2 && dist < bestEditDistance) {
            const sim = similarityFromDistance(dist, normQuery.length, kw.length);
            if (sim >= weights.minFuzzyConfidence) {
              bestSimilarity = sim;
              bestEditDistance = dist;
              matchedField = "keyword";
            }
          }
        }
      }
    }

    if (bestSimilarity >= weights.minFuzzyConfidence && bestEditDistance <= 2) {
      isFuzzyMatch = true;
      const baseScore =
        matchedField === "title"
          ? weights.fuzzyTitle
          : weights.fuzzyDescription;

      const penalty = bestEditDistance * weights.fuzzyPenaltyPerEdit;
      const score = Math.max(15, baseScore - penalty);

      breakdown.fuzzyConfidence = bestSimilarity;
      breakdown.fuzzyPenalty = penalty;
      totalScore = score;
    }
  }

  if (totalScore <= 0) return null;

  return {
    document: doc,
    score: totalScore,
    matchedCve,
    matchedIdentifier,
    matchedAlias,
    isFuzzyMatch,
    scoreBreakdown: breakdown,
  };
}

/**
 * Deterministic comparison function for search results:
 * 1. relevance score (descending)
 * 2. content-type priority (ascending / defined priority)
 * 3. date descending where available
 * 4. title alphabetical
 * 5. stable document id as final tie-breaker
 */
export function compareSearchResults(a: SearchResultItem, b: SearchResultItem): number {
  // 1. Relevance score descending
  if (b.score !== a.score) {
    return b.score - a.score;
  }

  // 2. Content-type priority
  const typeA = a.document.type;
  const typeB = b.document.type;
  const priorityA = CONTENT_TYPE_PRIORITY[typeA] ?? 99;
  const priorityB = CONTENT_TYPE_PRIORITY[typeB] ?? 99;
  if (priorityA !== priorityB) {
    return priorityA - priorityB;
  }

  // 3. Date descending where meaningful
  const dateStrA = a.document.date || a.document.publishedAt;
  const dateStrB = b.document.date || b.document.publishedAt;
  if (dateStrA && dateStrB) {
    const timeA = Date.parse(dateStrA) || 0;
    const timeB = Date.parse(dateStrB) || 0;
    if (timeA !== timeB) {
      return timeB - timeA;
    }
  } else if (dateStrA && !dateStrB) {
    return -1;
  } else if (!dateStrA && dateStrB) {
    return 1;
  }

  // 4. Title alphabetical (locale-independent)
  const titleA = a.document.title;
  const titleB = b.document.title;
  const titleCompare = titleA.localeCompare(titleB, "en", { sensitivity: "base" });
  if (titleCompare !== 0) {
    return titleCompare;
  }

  // 5. Stable document id as final tie-breaker
  return a.document.id.localeCompare(b.document.id);
}
