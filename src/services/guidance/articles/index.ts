/**
 * Aggregator and Resolver for All Guidance Articles
 * Provides deterministic slug resolution with support for legacy aliases.
 */

import { GuidanceArticle } from "../types";
import { INDIVIDUAL_ARTICLES } from "./individuals";
import { ORGANISATION_ARTICLES } from "./organisations";
import { GOVERNMENT_ARTICLES } from "./government";
import { TECHNICAL_ARTICLES } from "./technical";

export const ALL_GUIDANCE_ARTICLES: GuidanceArticle[] = [
  ...INDIVIDUAL_ARTICLES,
  ...ORGANISATION_ARTICLES,
  ...GOVERNMENT_ARTICLES,
  ...TECHNICAL_ARTICLES,
];

/**
 * Returns full guidance article by slug, handling legacy and convenience aliases
 */
export function getGuidanceArticleBySlug(slug: string): GuidanceArticle | undefined {
  if (!slug) return undefined;

  const normalized = slug.trim().toLowerCase();

  // Canonical alias resolution
  const canonicalSlug =
    normalized === "ransomware-response-guide" || normalized === "ransomware"
      ? "ransomware-prevention-response"
      : normalized === "dpa-privacy-principles" || normalized === "dpa"
      ? "data-protection-security"
      : normalized === "incident-response" || normalized === "incident-response-guide"
      ? "incident-response-planning"
      : normalized === "taxonomy" || normalized === "incident-taxonomy"
      ? "national-cyber-security-incident-taxonomy"
      : normalized === "child-safety" || normalized === "child-protection"
      ? "online-child-safety"
      : normalized;

  return ALL_GUIDANCE_ARTICLES.find((article) => article.slug === canonicalSlug);
}

/**
 * Returns all articles
 */
export function getAllGuidanceArticles(): GuidanceArticle[] {
  return ALL_GUIDANCE_ARTICLES;
}
