/**
 * @fileoverview Canonical Media Asset Contracts
 * Defines content-addressed media assets and file validation constraints.
 */

/**
 * Permitted MIME types for technical advisory media
 */
export type MediaMimeType =
  | "image/png"
  | "image/jpeg"
  | "image/webp"
  | "image/svg+xml"
  | "application/pdf";

/**
 * Technical media constraints enforced by validation gates
 */
export const MEDIA_CONSTRAINTS = {
  ALLOWED_MIME_TYPES: [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/svg+xml",
    "application/pdf",
  ] as const,

  MAX_IMAGE_SIZE_BYTES: 5 * 1024 * 1024, // 5 MB
  MAX_DOCUMENT_SIZE_BYTES: 25 * 1024 * 1024, // 25 MB

  /** Canonical immutable path template */
  PATH_TEMPLATE: "/assets/advisories/{advisoryId}/{sha256}.{ext}",
  /** Quarantine storage path template */
  QUARANTINE_TEMPLATE: "/quarantine/assets/{advisoryId}/{sha256}.{ext}",
} as const;

/**
 * Controlled media asset associated with a canonical advisory
 */
export interface AdvisoryMediaAsset {
  /** Internal stable asset identifier (UUIDv4) */
  assetId: string;
  /** Content-addressed storage path */
  storagePath: string;
  /** Public URL path */
  publicUrl: string;
  /** Verified MIME type */
  mimeType: MediaMimeType;
  /** Cryptographic SHA-256 digest of original binary bytes */
  sha256: string;
  /** Exact size in bytes */
  byteSize: number;
  /** Mandatory accessibility alternative text */
  altText: string;
  /** Visible figure caption rendered in GOV.UK layout */
  caption?: string;
  /** Quarantine promotion flag */
  isQuarantined?: boolean;
}
