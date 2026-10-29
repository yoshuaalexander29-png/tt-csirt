/**
 * Shared publication taxonomy and local API endpoint helpers.
 * Public pages consume the application's local delivery API and canonical data;
 * they do not fetch content from the legacy TT-CSIRT website.
 */

export * from "./wordpress/taxonomy.ts";
export * from "./wordpress/endpoints.ts";
