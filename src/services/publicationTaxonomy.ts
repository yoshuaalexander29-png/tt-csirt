/**
 * Publication Taxonomy and Normalization Layer for TT-CSIRT
 * Strictly classifies upstream content into explicit semantic types:
 * - advisory: Technical security advisories with CVE/CVSS/affected systems
 * - alert: Urgent notices of active threat campaigns
 * - news: National cybersecurity updates, MOUs, organizational announcements
 * - event: Workshops, conferences, bilateral meetings, challenge exercises
 * - training: Capacity-building courses, school programs, student cohorts
 * - guidance: Procedural guides, best practices, checklists
 * - institutional: Statutory mandate, strategy documents, statutory reports
 */

export type PublicationType =
  | "advisory"
  | "alert"
  | "news"
  | "event"
  | "training"
  | "guidance"
  | "institutional";

export interface NormalizedPublication {
  id: string;
  type: PublicationType;
  title: string;
  rawTitle?: string;
  summary: string;
  publishedAt: string;
  modifiedAt?: string;
  href: string;
  categories: string[];
  tags: string[];
  cves: string[];
  rawExcerpt?: string;
  referenceNumber?: string;
  featured?: boolean;
}

export interface PublicationTaxonomy {
  id: number;
  slug: string;
  name: string;
  count: number;
}

/**
 * Deterministically classifies a canonical publication item based on
 * canonical categories, tags, title, and content patterns.
 */
export function classifyPublication(item: {
  id?: number | string;
  type?: PublicationType;
  categories?: string[];
  tags?: string[];
  title?: string;
  content?: string;
  slug?: string;
}): PublicationType {
  if (item.type) {
    return item.type;
  }

  const categories = Array.isArray(item.categories) ? item.categories.map((c) => c.toLowerCase()) : [];
  const tags = Array.isArray(item.tags) ? item.tags.map((t) => t.toLowerCase()) : [];

  const titleStr = typeof item.title === "string" ? item.title : "";
  const titleLower = titleStr.toLowerCase();
  const slugLower = (item.slug || "").toLowerCase();

  // 1. Check for Training / Education indicators
  const hasTrainingTag = tags.some((t) =>
    t.includes("training") || t.includes("cyber challenge") || t.includes("cyber paths")
  );
  const hasTrainingCategory = categories.some((c) => c.includes("training"));
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

  if (hasTrainingTag || hasTrainingCategory || hasTrainingKeyword) {
    return "training";
  }

  // 2. Check for Event indicators
  const hasEventCat = categories.some((c) => c.includes("event"));
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
  const hasGuidanceCat = categories.some((c) => c.includes("guidance"));
  const hasGuidanceKeyword =
    titleLower.includes("guide") ||
    titleLower.includes("checklist") ||
    titleLower.includes("tips") ||
    titleLower.includes("best practices") ||
    titleLower.includes("general privacy principles") ||
    slugLower.includes("guidance") ||
    slugLower.includes("checklist") ||
    slugLower.includes("safety-tips");

  if ((hasGuidanceCat || hasGuidanceKeyword) && !titleLower.includes("advisory") && !titleLower.includes("cve-")) {
    return "guidance";
  }

  // 4. Check for Alert category
  if (categories.some((c) => c.includes("alert")) || titleLower.startsWith("alert:")) {
    return "alert";
  }

  // 5. Check for Advisories (explicit category, CVE pattern, or advisory reference)
  const hasAdvisoryCat = categories.some((c) => c.includes("advisory") || c.includes("advisories"));
  const hasCve = /cve-\d{4}-\d{4,}/i.test(titleStr);
  const hasAdvisoryRef = /tt-csirt\s*[-–.]*\s*\d+/i.test(titleStr);

  if (hasAdvisoryCat || hasCve || hasAdvisoryRef) {
    if (
      categories.some((c) => c.includes("news")) &&
      !hasCve &&
      !hasAdvisoryRef &&
      (titleLower.includes("mou") || titleLower.includes("memory of") || titleLower.includes("collaborat"))
    ) {
      return "news";
    }
    return "advisory";
  }

  // 6. Check for News category
  if (categories.some((c) => c.includes("news") || c.includes("current activity") || c.includes("current-activity"))) {
    return "news";
  }

  // 7. Check for Institutional content
  if (slugLower.includes("about") || slugLower.includes("strategy") || slugLower.includes("mandate") || slugLower.includes("contact")) {
    return "institutional";
  }

  return "advisory";
}

/**
 * Validates whether a publication is eligible for the /advisories repository.
 * Enforces the strict rule: an advisory must enter /advisories ONLY because
 * authoritative taxonomy says it is an advisory/alert. Never because it was recent.
 */
export function isAuthoritativeAdvisory(item: {
  id?: number | string;
  type?: PublicationType;
  categories?: string[];
  tags?: string[];
  title?: string;
  slug?: string;
}): boolean {
  if (item.type) {
    return item.type === "advisory" || item.type === "alert";
  }
  const type = classifyPublication(item);
  return type === "advisory" || type === "alert";
}

/**
 * Decodes standard HTML entities commonly found in legacy/upstream titles and content
 */
export function cleanEntities(str: string): string {
  if (!str) return "";
  return str
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#8216;/g, "‘")
    .replace(/&#8217;/g, "’")
    .replace(/&#8220;/g, "“")
    .replace(/&#8221;/g, "”")
    .replace(/&#038;/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\[&hellip;\]/g, "")
    .trim();
}
