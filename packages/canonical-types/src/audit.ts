/**
 * @fileoverview Canonical Audit Ledger Contracts
 * Models append-only audit records for all publishing system state transitions and mutations.
 */

import type { AdvisoryStatus } from "./publication.ts";

/**
 * Valid audit lifecycle actions
 */
export type AuditAction =
  | "DRAFT_CREATED"
  | "DRAFT_MUTATED"
  | "VALIDATION_PASSED"
  | "VALIDATION_FAILED"
  | "SUBMITTED_FOR_REVIEW"
  | "CHANGES_REQUESTED"
  | "RETURNED_TO_DRAFT"
  | "APPROVED"
  | "PUBLISHED"
  | "CORRECTION_DRAFTED"
  | "SUPERSEDED"
  | "WITHDRAWN"
  | "ROLLBACK_EXECUTED"
  | "MEDIA_ATTACHED"
  | "MEDIA_QUARANTINED"
  | "DELETED";

/**
 * Authenticated staff actor who performed the action
 */
export interface AuditActor {
  /** User account identifier */
  userId: string;
  /** Verified email address */
  email: string;
  /** Role held at the time of execution */
  role: "AUTHOR" | "REVIEWER" | "APPROVER" | "ADMINISTRATOR" | "SYSTEM";
  /** Network IP address */
  ipAddress: string;
  /** Client user agent */
  userAgent: string;
}

/**
 * Structural diff summary of fields changed in the mutation
 */
export interface AuditDiffSummary {
  sectionsModified: string[];
  cvesAdded?: string[];
  cvesRemoved?: string[];
  affectedProductsModified?: boolean;
  metadataFieldsChanged?: string[];
}

/**
 * Immutable audit event ledger entry
 */
export interface AdvisoryAuditEvent {
  /** Unique UUIDv4 event identifier */
  eventId: string;
  /** Target advisory identifier */
  advisoryId: string;
  /** Target bulletin reference number */
  referenceNumber: string;
  /** Target version number */
  version: number;
  /** Actor information */
  actor: AuditActor;
  /** Executed lifecycle action */
  action: AuditAction;
  /** Advisory status prior to transition */
  previousStatus?: AdvisoryStatus;
  /** Resulting advisory status */
  resultingStatus: AdvisoryStatus;
  /** ISO 8601 UTC timestamp of execution */
  timestamp: string;
  /** Justification comment, review notes, or withdrawal rationale */
  comment?: string;
  /** SHA-256 digest of advisory payload at this exact point in time */
  payloadDigest?: {
    algorithm: "SHA-256";
    hexDigest: string;
  };
  /** Structural diff summary */
  diffSummary?: AuditDiffSummary;
  /** Optional cryptographic signature recorded as a hardening extension */
  signature?: {
    keyId: string;
    algorithm: "Ed25519";
    signatureHex: string;
  };
}
