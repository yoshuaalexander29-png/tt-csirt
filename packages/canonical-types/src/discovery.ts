/**
 * @fileoverview Canonical Public Discovery & Index Contracts
 * Defines catalog index feeds consumed by the public website search, catalog, and RSS engines.
 */

import type { AdvisoryClassification, SeverityRating, TargetSector, TlpMarking } from "./taxonomy.ts";

/**
 * Lightweight catalog entry for list views, search results, and cards
 */
export interface PublishedAdvisoryIndexItem {
  id: string;
  referenceNumber: string;
  slug: string;
  classification: AdvisoryClassification;
  title: string;
  severity: SeverityRating;
  tlp: TlpMarking;
  leadParagraph: string;
  cveIds: string[];
  affectedVendors: string[];
  affectedProducts: string[];
  targetSectors?: TargetSector[];
  taxonomyTags?: string[];
  publishedAt: string;
  updatedAt?: string;
  version: number;
  status: "published" | "superseded" | "withdrawn";
  readingTimeMinutes?: number;
}

/**
 * Authoritative public index feed manifest (/advisories/v1/index.json)
 */
export interface PublishedAdvisoryIndex {
  schemaVersion: "1.0";
  generatedAt: string;
  totalCount: number;
  advisories: PublishedAdvisoryIndexItem[];
}

/**
 * Syndication item for Atom / RSS XML feeds
 */
export interface AdvisorySyndicationItem {
  guid: string;
  referenceNumber: string;
  title: string;
  link: string;
  publishedAt: string;
  updatedAt?: string;
  summary: string;
  severity: SeverityRating;
  tlp: TlpMarking;
  cves: string[];
}
