/**
 * TT-CSIRT WordPress Upstream Taxonomy Adapter
 *
 * Maps authoritative WordPress categories, tags, and IDs to canonical PublicationType.
 * Discovered via /wp-json/wp/v2/categories and /wp-json/wp/v2/tags.
 *
 * This adapter isolates WordPress taxonomy conventions from the canonical domain model.
 */

import { type PublicationType } from "../../publicationTaxonomy.ts";

/**
 * Authoritative WordPress Categories discovered via /wp-json/wp/v2/categories
 * 5: Advisories (slug: 'advisory')
 * 7: Alerts (slug: 'alert')
 * 23: Security Advisories (slug: 'security-advisories')
 * 6: Events (slug: 'events')
 * 22: News (slug: 'news')
 * 21: Current Activity (slug: 'current-activity')
 * 1: Uncategorized (slug: 'uncategorized')
 */
export const WP_CATEGORIES = {
  ADVISORY: 5,
  ALERT: 7,
  SECURITY_ADVISORIES: 23,
  EVENTS: 6,
  NEWS: 22,
  CURRENT_ACTIVITY: 21,
  UNCATEGORIZED: 1,
} as const;

/**
 * Known training-related tags from /wp-json/wp/v2/tags
 * 47: OAS & Citi Foundation Cyber Paths Training Program
 * 45: OAS Cyber Paths 2026
 * 42: OAS Cyber Challenge 2026
 */
export const WP_TRAINING_TAGS = [42, 45, 47];

/**
 * Deterministically classifies a raw WordPress post based on
 * WordPress category IDs, tag IDs, title, and content patterns.
 */
export function classifyWordPressPost(item: {
  id?: number | string;
  categories?: number[];
  tags?: number[];
  title?: string | { rendered?: string };
  content?: string | { rendered?: string };
  slug?: string;
}): PublicationType {
  const catIds = Array.isArray(item.categories) ? item.categories : [];
  const tagIds = Array.isArray(item.tags) ? item.tags : [];

  const titleStr =
    typeof item.title === "string"
      ? item.title
      : item.title && typeof item.title === "object" && "rendered" in item.title
        ? String(item.title.rendered)
        : "";

  const titleLower = titleStr.toLowerCase();
  const slugLower = (item.slug || "").toLowerCase();

  // 1. Check for Training / Education indicators
  const hasTrainingTag = tagIds.some((t) => WP_TRAINING_TAGS.includes(t));
  const hasTrainingKeyword =
    titleLower.includes("training program") ||
    titleLower.includes("school education program") ||
    titleLower.includes("cyber paths") ||
    titleLower.includes("cyber challenge") ||
    titleLower.includes("shesecures") ||
    titleLower.includes("bootcamp") ||
    titleLower.includes("tabletop exercise") ||
    titleLower.includes("immersion workshop") ||
    slugLower.includes("school-education") ||
    slugLower.includes("cyber-paths");

  if (hasTrainingTag || hasTrainingKeyword) {
    return "training";
  }

  // 2. Check for Event indicators (category 6 or event keywords)
  const hasEventCat = catIds.includes(WP_CATEGORIES.EVENTS);
  const hasEventKeyword =
    titleLower.includes("conference") ||
    titleLower.includes("webinar:") ||
    titleLower.includes("symposium") ||
    titleLower.includes("workshop") ||
    titleLower.includes("you're invited") ||
    titleLower.includes("registration now open");

  if (hasEventCat || (hasEventKeyword && !titleLower.includes("cve-"))) {
    return "event";
  }

  // 3. Check for Guidance indicators
  const hasGuidanceKeyword =
    titleLower.includes("guide") ||
    titleLower.includes("checklist") ||
    titleLower.includes("tips") ||
    titleLower.includes("best practices") ||
    titleLower.includes("general privacy principles") ||
    slugLower.includes("guidance") ||
    slugLower.includes("checklist") ||
    slugLower.includes("safety-tips");

  if (hasGuidanceKeyword && !titleLower.includes("advisory") && !titleLower.includes("cve-")) {
    return "guidance";
  }

  // 4. Check for Alert category (7)
  if (catIds.includes(WP_CATEGORIES.ALERT)) {
    return "alert";
  }

  // 5. Check for Advisories (categories 5, 23, or explicit CVE/reference numbers)
  const hasAdvisoryCat =
    catIds.includes(WP_CATEGORIES.ADVISORY) ||
    catIds.includes(WP_CATEGORIES.SECURITY_ADVISORIES);
  const hasCve = /cve-\d{4}-\d{4,}/i.test(titleStr);
  const hasAdvisoryRef = /tt-csirt\s*[-–.]*\s*\d+/i.test(titleStr);

  if (hasAdvisoryCat || hasCve || hasAdvisoryRef) {
    // Ensure news/memorial posts in category 22 or 21 without CVE are not mistakenly flagged
    if (
      catIds.includes(WP_CATEGORIES.NEWS) &&
      !hasCve &&
      !hasAdvisoryRef &&
      (titleLower.includes("mou") ||
        titleLower.includes("memory of") ||
        titleLower.includes("collaborat"))
    ) {
      return "news";
    }
    return "advisory";
  }

  // 6. Check for News category (22)
  if (catIds.includes(WP_CATEGORIES.NEWS)) {
    return "news";
  }

  // 7. Check for Institutional content
  if (
    slugLower.includes("about") ||
    slugLower.includes("strategy") ||
    slugLower.includes("mandate") ||
    slugLower.includes("contact")
  ) {
    return "institutional";
  }

  // Default fallback based on current-activity or news
  if (catIds.includes(WP_CATEGORIES.CURRENT_ACTIVITY)) {
    return "news";
  }

  return "advisory";
}

/**
 * Validates whether a raw WordPress publication is eligible for the /advisories repository.
 */
export function isAuthoritativeWordPressAdvisory(item: {
  categories?: number[];
  tags?: number[];
  title?: string | { rendered?: string };
  slug?: string;
}): boolean {
  const type = classifyWordPressPost(item);
  return type === "advisory" || type === "alert";
}
