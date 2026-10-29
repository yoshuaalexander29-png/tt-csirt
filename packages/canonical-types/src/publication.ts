/**
 * @fileoverview Canonical Publication & Governance Contracts
 * Defines publication metadata, references, and supersession/withdrawal relationships.
 */

/**
 * Editorial lifecycle statuses
 */
export type AdvisoryStatus =
  | "draft"
  | "ready_for_review"
  | "changes_requested"
  | "approved"
  | "published"
  | "superseded"
  | "withdrawn"
  | "deleted";

/**
 * External technical reference citation
 */
export interface AdvisoryReference {
  /** Unique citation identifier within citation list */
  id: string;
  /** Human-readable citation title */
  title: string;
  /** Verified resource URL (must strictly start with https:// or mailto:) */
  url: string;
  /** Citation classification */
  type:
    | "vendor_advisory"
    | "mitre_cve"
    | "nvd_record"
    | "exploit_database"
    | "academic_research"
    | "news_report"
    | "official_guidance";
  /** ISO 8601 date when the resource was verified */
  accessedDate?: string;
  /** Flag denoting whether URL exits the gov.tt perimeter */
  isExternal: boolean;
}

/**
 * Supersession link pointing to successor bulletin
 */
export interface SupersessionRelationship {
  /** Target successor advisory identifier */
  successorAdvisoryId: string;
  /** Bulletin reference number of successor */
  successorReferenceNumber: string;
  /** ISO 8601 timestamp when supersession took effect */
  supersededAt: string;
  /** Optional rationale */
  reason?: string;
}

/**
 * Predecessor bulletins replaced by this advisory
 */
export interface PredecessorReference {
  advisoryId: string;
  referenceNumber: string;
}

/**
 * Formal withdrawal / retraction notice
 */
export interface WithdrawalNotice {
  /** ISO 8601 timestamp when retraction was authorized */
  withdrawnAt: string;
  /** User identifier or authority authorizing retraction */
  authorizedBy: string;
  /** Public rationale explaining why bulletin was retracted */
  publicReason: string;
}

/**
 * Internal editorial tracking metadata (Control plane only)
 */
export interface AdvisoryEditorialMetadata {
  /** Identifier of analyst who initiated draft */
  authorId: string;
  /** Contact email of author */
  authorEmail: string;
  /** Assigned or reviewing analyst identifier */
  reviewerId?: string;
  /** Technical feedback notes left during review */
  reviewerNotes?: string;
  /** Authorizing manager who signed off publication */
  approverId?: string;
  /** ISO 8601 timestamp when approval was recorded */
  approvedAt?: string;
  /** Approval notes or authorization reference */
  approverNotes?: string;
  /** Summary of changes made in this revision */
  changeSummary?: string;
  /** Internal analyst triage tags (never published publicly) */
  internalTags?: string[];
}

/**
 * Public and temporal publication metadata
 */
export interface AdvisoryPublicationMetadata {
  /** Monotonically increasing version number (1, 2, 3...) */
  version: number;
  /** Current editorial status */
  status: AdvisoryStatus;
  /** ISO 8601 UTC creation timestamp */
  createdAt: string;
  /** ISO 8601 UTC timestamp of initial release */
  publishedAt?: string;
  /** ISO 8601 UTC timestamp of latest approved version */
  updatedAt?: string;
  /** Supersession pointer */
  supersededBy?: SupersessionRelationship;
  /** Predecessors replaced */
  supersedes?: PredecessorReference[];
  /** Retraction notice */
  withdrawalNotice?: WithdrawalNotice;
}
