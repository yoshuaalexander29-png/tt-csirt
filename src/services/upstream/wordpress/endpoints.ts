/**
 * TT-CSIRT WordPress Upstream API Endpoints & Request Helpers
 *
 * Centralizes all WordPress REST API endpoint construction, field declarations,
 * and header contract definitions for upstream consumption.
 */

export const WP_BASE_URL = "/api/advisories";

/**
 * Standard WordPress REST API headers for pagination metadata
 */
export const WP_HEADERS = {
  TOTAL: "x-wp-total",
  TOTAL_PAGES: "x-wp-totalpages",
} as const;

/**
 * Explicit fields requested for listing queries (excludes heavy 'content' article body)
 */
export const WP_LISTING_FIELDS = "id,date,modified,slug,title,excerpt,categories,tags,link";

/**
 * Explicit fields requested for full individual advisory detail queries (includes 'content')
 */
export const WP_DETAIL_FIELDS = "id,date,modified,slug,title,excerpt,content,categories,tags,link";

/**
 * Builds the endpoint URL for querying authoritative advisories and alerts
 */
export function buildWordPressPostsEndpoint(params: {
  categories?: number[];
  fields?: string;
  perPage?: number;
  page?: number;
  slug?: string;
  id?: string | number;
}): string {
  if (params.id !== undefined) {
    const fieldsParam = params.fields ? `?_fields=${params.fields}` : "";
    return `${WP_BASE_URL}/posts/${params.id}${fieldsParam}`;
  }

  const queryParts: string[] = [];

  if (params.fields) {
    queryParts.push(`_fields=${params.fields}`);
  }

  if (params.categories && params.categories.length > 0) {
    queryParts.push(`categories=${params.categories.join(",")}`);
  }

  if (params.perPage !== undefined) {
    queryParts.push(`per_page=${params.perPage}`);
  }

  if (params.page !== undefined) {
    queryParts.push(`page=${params.page}`);
  }

  if (params.slug) {
    queryParts.push(`slug=${encodeURIComponent(params.slug)}`);
  }

  const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
  return `${WP_BASE_URL}/posts${queryString}`;
}

/**
 * Returns provenance URL for complete advisory corpus requests
 */
export function buildWordPressCorpusEndpoint(): string {
  return `${WP_BASE_URL}/posts?corpus=all`;
}

/**
 * Builds the fallback permalink for an advisory on the legacy WordPress site
 */
export function buildWordPressPostPermalink(id: number | string): string {
  return `https://ttcsirt.gov.tt/?p=${id}`;
}

