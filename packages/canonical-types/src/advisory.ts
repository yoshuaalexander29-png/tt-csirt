/**
 * @fileoverview Canonical Advisory Contracts
 * Defines the authoritative AdvisoryDocument (internal control plane) and
 * PublishedAdvisoryDocument (public delivery plane), ensuring strict separation
 * between internal editorial metadata and public disclosure content.
 *
 * Strict Architectural Invariant:
 * Pure TypeScript domain contracts with zero runtime or platform dependencies.
 */

import type { AdvisorySectionBundle } from "./content.ts";
import type { AdvisoryMediaAsset } from "./media.ts";
import type {
  AdvisoryEditorialMetadata,
  AdvisoryPublicationMetadata,
  AdvisoryReference,
  PredecessorReference,
  SupersessionRelationship,
  WithdrawalNotice,
} from "./publication.ts";
import type {
  AdvisoryClassification,
  SeverityRating,
  TargetSector,
  TlpMarking,
} from "./taxonomy.ts";
import type { AffectedProduct, CveMetadata } from "./vulnerability.ts";

/**
 * Historical and administrative provenance
 */
export interface AdvisoryProvenance {
  /** Originating reporting agency, e.g. "TT-CSIRT Vulnerability Coordination Team" */
  originatingAgency: string;
  /** Primary source advisory URL or reference, e.g. from CISA or vendor */
  sourceReferenceUrl?: string;
  /** ISO 8601 UTC date of first upstream disclosure */
  upstreamDisclosedAt?: string;
  /** Tracking ticket reference in internal incident tracking system */
  internalTrackingId?: string;
}

/**
 * Authoritative Canonical AdvisoryDocument (Internal Control Plane)
 * Contains the complete technical disclosure, editorial metadata, and publication status.
 */
export interface AdvisoryDocument {
  /** Unique UUIDv4 identifier */
  id: string;
  /** Official national bulletin reference, e.g. "TT-CSIRT-ADV-2026-042" */
  referenceNumber: string;
  /** Advisory or Alert classification */
  classification: AdvisoryClassification;
  /** Official disclosure title in sentence case */
  title: string;
  /** URL-friendly slug */
  slug: string;
  /** Standardized national severity rating */
  severity: SeverityRating;
  /** FIRST Traffic Light Protocol marking */
  tlp: TlpMarking;
  /** Concise executive summary paragraph */
  leadParagraph: string;
  /** Target constituency sectors */
  targetSectors?: TargetSector[];
  /** Semantic classification tags */
  taxonomyTags?: string[];
  /** Structured vulnerability records */
  cveMetadata: CveMetadata[];
  /** Affected hardware/software ranges */
  affectedProducts: AffectedProduct[];
  /** Structured content AST sections */
  sections: AdvisorySectionBundle;
  /** External technical citations */
  references: AdvisoryReference[];
  /** Controlled media assets */
  mediaAssets: AdvisoryMediaAsset[];
  /** Administrative provenance */
  provenance: AdvisoryProvenance;
  /** Internal editorial tracking (Strictly private to control plane) */
  editorial: AdvisoryEditorialMetadata;
  /** Publication lifecycle metadata */
  publication: AdvisoryPublicationMetadata;
}

/**
 * Public publication metadata (Cleaned of all internal workflow states)
 */
export interface PublishedPublicationInfo {
  version: number;
  status: "published" | "superseded" | "withdrawn";
  publishedAt: string;
  updatedAt?: string;
  supersededBy?: SupersessionRelationship;
  supersedes?: PredecessorReference[];
  withdrawalNotice?: WithdrawalNotice;
}

/**
 * Public Delivery Contract (Public Website & CDN)
 * Clean, stripped representation delivered to citizens and public consumers.
 *
 * Invariant:
 * Internal editorial fields (authorId, authorEmail, reviewerId, reviewerNotes,
 * approverId, approverNotes, internalTags, changeSummary, draft states)
 * are mathematically EXCLUDED from this contract.
 */
export interface PublishedAdvisoryDocument {
  id: string;
  referenceNumber: string;
  classification: AdvisoryClassification;
  title: string;
  slug: string;
  severity: SeverityRating;
  tlp: TlpMarking;
  leadParagraph: string;
  targetSectors?: TargetSector[];
  taxonomyTags?: string[];
  cveMetadata: CveMetadata[];
  affectedProducts: AffectedProduct[];
  sections: AdvisorySectionBundle;
  references: AdvisoryReference[];
  mediaAssets: AdvisoryMediaAsset[];
  publication: PublishedPublicationInfo;
  /** Estimated reading time in minutes */
  readingTimeMinutes?: number;
  /** Structural discriminant guaranteeing public delivery readiness */
  isPublicDeliveryReady: true;
}

/**
 * Pure contract transformer that securely derives a PublishedAdvisoryDocument
 * from an internal AdvisoryDocument by stripping all private editorial metadata.
 *
 * @throws Error if advisory is in draft, review, or changes_requested state.
 */
export function toPublishedAdvisoryDocument(
  doc: AdvisoryDocument,
  options?: { readingTimeMinutes?: number },
): PublishedAdvisoryDocument {
  const { status } = doc.publication;

  if (status !== "published" && status !== "superseded" && status !== "withdrawn") {
    throw new Error(
      `Cannot derive PublishedAdvisoryDocument: advisory status is '${status}'. Only published, superseded, or withdrawn advisories can be published.`,
    );
  }

  if (!doc.publication.publishedAt) {
    throw new Error(
      "Cannot derive PublishedAdvisoryDocument: advisory lacks a publishedAt timestamp.",
    );
  }

  const publishedPublication: PublishedPublicationInfo = {
    version: doc.publication.version,
    status,
    publishedAt: doc.publication.publishedAt,
    ...(doc.publication.updatedAt ? { updatedAt: doc.publication.updatedAt } : {}),
    ...(doc.publication.supersededBy ? { supersededBy: doc.publication.supersededBy } : {}),
    ...(doc.publication.supersedes ? { supersedes: doc.publication.supersedes } : {}),
    ...(doc.publication.withdrawalNotice
      ? { withdrawalNotice: doc.publication.withdrawalNotice }
      : {}),
  };

  // Explicit projection: internal editorial metadata (authorId, reviewerNotes, etc.) is never transferred.
  return {
    id: doc.id,
    referenceNumber: doc.referenceNumber,
    classification: doc.classification,
    title: doc.title,
    slug: doc.slug,
    severity: doc.severity,
    tlp: doc.tlp,
    leadParagraph: doc.leadParagraph,
    targetSectors: doc.targetSectors ? [...doc.targetSectors] : undefined,
    taxonomyTags: doc.taxonomyTags ? [...doc.taxonomyTags] : undefined,
    cveMetadata: doc.cveMetadata.map((cve) => ({ ...cve })),
    affectedProducts: doc.affectedProducts.map((p) => ({
      ...p,
      affectedVersions: [...p.affectedVersions],
      fixedVersions: p.fixedVersions ? [...p.fixedVersions] : undefined,
      cpeUris: p.cpeUris ? [...p.cpeUris] : undefined,
    })),
    sections: JSON.parse(JSON.stringify(doc.sections)),
    references: doc.references.map((r) => ({ ...r })),
    mediaAssets: doc.mediaAssets.map((m) => ({ ...m })),
    publication: publishedPublication,
    ...(options?.readingTimeMinutes ? { readingTimeMinutes: options.readingTimeMinutes } : {}),
    isPublicDeliveryReady: true,
  };
}
