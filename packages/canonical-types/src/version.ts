/**
 * @fileoverview Canonical Advisory Versioning Contracts
 * Defines immutable snapshots and monotonic versioning structures.
 *
 * Invariant:
 * An approved, published advisory version (v_n) is strictly immutable.
 * Any revision, correction, or update creates a new version record (v_{n+1}).
 */

import type { AdvisoryDocument } from "./advisory.ts";
import type { SupersessionRelationship } from "./publication.ts";

/**
 * Immutable published advisory snapshot
 */
export interface AdvisoryVersion {
  /** UUIDv4 primary identifier of the version record */
  versionId: string;
  /** Stable identifier of the parent bulletin across all versions */
  advisoryId: string;
  /** Official national bulletin reference, e.g. "TT-CSIRT-ADV-2026-042" */
  referenceNumber: string;
  /** Monotonically increasing version counter (1, 2, 3...) */
  versionNumber: number;
  /** Frozen canonical advisory snapshot */
  documentPayload: AdvisoryDocument;
  /** Cryptographic content integrity verification */
  contentDigest: {
    algorithm: "SHA-256";
    hexDigest: string;
  };
  /** ISO 8601 UTC timestamp of release */
  publishedAt: string;
  /** Identifier of approving officer */
  approvedByUserId: string;
  /** Identifier of releasing officer */
  publishedByUserId: string;
  /** Public release notes describing changes in this version */
  releaseNotes: string;
  /** Pointer if superseded */
  supersededBy?: SupersessionRelationship;
}

/**
 * Concise historical version summary for version history lists
 */
export interface VersionHistorySummary {
  versionNumber: number;
  publishedAt: string;
  releaseNotes: string;
  contentDigest: string;
  isLatest: boolean;
}
