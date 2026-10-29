# TT-CSIRT Canonical Advisory Document & Content Model Contract
## Phase 1 Implementation Specification: Frozen Schemas, Content AST, Versioning & Delivery Contracts

**Document Reference**: `TTCSIRT-SPEC-PUB-001`  
**Status**: Frozen Architectural Contract (Phase 1 Baseline)  
**Security Classification**: Official / Architectural Standard  
**Target Domain**: Trinidad and Tobago Cyber Security Incident Response Team (TT-CSIRT)  
**Publication Date**: 22 September 2026  

---

## 1. Executive Overview & Design Principles

This document establishes the canonical data schemas, content Abstract Syntax Tree (AST), versioning structures, and delivery payloads for the TT-CSIRT Advisory Publishing System.

### Fundamental Schema Invariants
1. **Total Isolation from Legacy CMS**: The canonical document model is completely divorced from WordPress post IDs, WordPress taxonomy/tag/category IDs, WordPress REST JSON structures, Elementor CSS classes, and raw HTML markup.
2. **Strict Separation of Concerns**: Technical vulnerability data, editorial workflow metadata, publication status, and public presentation concerns are factored into distinct, typed sub-objects.
3. **Structured Content AST**: Advisory content is stored as typed semantic nodes (paragraphs, subheadings, lists, tables, callouts, code blocks, references). Arbitrary staff-authored HTML is strictly prohibited and rejected by schema validation.
4. **Append-Only Immutability**: Published versions cannot be modified in place. Any correction, revision, or update creates a new integer version snapshot ($v_{n+1}$).

---

## 2. Canonical Advisory Document Schema (`AdvisoryDocument`)

The `AdvisoryDocument` represents the complete authoritative record of a security advisory or alert in the publishing system.

### 2.1 Schema Definition (TypeScript)

```typescript
/**
 * Authoritative classifications for national cyber publications
 */
export type AdvisoryClassification = "advisory" | "alert";

/**
 * Standardized national severity rating
 */
export type SeverityRating = "critical" | "high" | "medium" | "low" | "informational";

/**
 * Traffic Light Protocol (TLP) marking for public disclosures
 */
export type TlpMarking = "TLP:CLEAR" | "TLP:GREEN";

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
  | "withdrawn";

/**
 * Common Vulnerability and Exposure (CVE) structured metadata
 */
export interface CveMetadata {
  /** Identifier adhering to regex ^CVE-\d{4}-\d{4,}$ */
  id: string;
  /** CVSS Specification version */
  cvssVersion?: "3.1" | "4.0";
  /** CVSS Base Score (0.0 to 10.0) */
  cvssScore?: number;
  /** CVSS Vector string, e.g. "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H" */
  cvssVector?: string;
  /** Common Weakness Enumeration references, e.g. ["CWE-79", "CWE-89"] */
  cweIds?: string[];
  /** Brief summary of specific vulnerability mechanism */
  summary?: string;
}

/**
 * Affected product and software version ranges
 */
export interface AffectedProduct {
  /** Vendor or hardware/software manufacturer */
  vendor: string;
  /** Specific product or software suite */
  product: string;
  /** Human-readable string representations of vulnerable versions */
  affectedVersions: string[];
  /** Fixed or patched versions available */
  fixedVersions?: string[];
  /** Common Platform Enumeration (CPE 2.3) URIs where known */
  cpeUris?: string[];
}

/**
 * External reference or technical citation
 */
export interface AdvisoryReference {
  /** Unique reference ID within the advisory */
  id: string;
  /** Human-readable citation title */
  title: string;
  /** Absolute URL (must strictly begin with https:// or mailto:) */
  url: string;
  /** Semantic classification of reference */
  type:
    | "vendor_advisory"
    | "mitre_cve"
    | "nvd_record"
    | "exploit_database"
    | "academic_research"
    | "news_report"
    | "official_guidance";
  /** ISO 8601 date when the resource was verified by analysts */
  accessedDate?: string;
  /** Flag denoting whether link leads outside the gov.tt domain */
  isExternal: boolean;
}

/**
 * Verified media asset associated with the advisory
 */
export interface AdvisoryMediaAsset {
  /** Internal stable asset identifier (UUIDv4) */
  assetId: string;
  /** Canonical storage path: /assets/advisories/{advisoryId}/{sha256}.{ext} */
  storagePath: string;
  /** Public accessible URL path */
  publicUrl: string;
  /** Verified MIME type */
  mimeType: "image/png" | "image/jpeg" | "image/webp" | "image/svg+xml" | "application/pdf";
  /** SHA-256 digest of asset bytes */
  sha256: string;
  /** File size in bytes */
  byteSize: number;
  /** Mandatory descriptive text for accessibility */
  altText: string;
  /** Visible caption rendered beneath figure */
  caption?: string;
}

/**
 * Ingestion provenance tracking
 */
export interface AdvisoryProvenance {
  /** How this advisory entered the canonical system */
  origin: "native_authoring" | "wordpress_migration";
  /** Original WordPress Post ID if imported */
  legacyPostId?: number;
  /** Original authoritative slug on wp.ttcsirt.gov.tt */
  legacySlug?: string;
  /** Timestamp when migration ingestion occurred */
  migratedAt?: string;
}

/**
 * Editorial and governance workflow metadata (restricted to control plane)
 */
export interface AdvisoryEditorialMetadata {
  /** User identifier of the initial draft author */
  authorId: string;
  /** Email address of author */
  authorEmail: string;
  /** User identifier of the peer reviewer */
  reviewerId?: string;
  /** Feedback or revision notes left by reviewer */
  reviewerNotes?: string;
  /** User identifier of the release approver */
  approverId?: string;
  /** Release approval notes or authorization reference */
  approverNotes?: string;
  /** Reason for revision or changes requested */
  changeSummary?: string;
  /** Internal tracking tags for analysts (not published) */
  internalTags?: string[];
}

/**
 * Temporal and publication lifecycle metadata
 */
export interface AdvisoryPublicationMetadata {
  /** Monotonically increasing version number (1, 2, 3...) */
  version: number;
  /** Current editorial status */
  status: AdvisoryStatus;
  /** ISO 8601 UTC creation date of the draft */
  createdAt: string;
  /** ISO 8601 UTC timestamp of initial publication */
  publishedAt?: string;
  /** ISO 8601 UTC timestamp of latest approved version publication */
  updatedAt?: string;
  /** If superseded, reference to successor advisory */
  supersededBy?: {
    advisoryId: string;
    referenceNumber: string;
    supersededAt: string;
  };
  /** If this advisory replaces previous publications, list of predecessors */
  supersedes?: Array<{
    advisoryId: string;
    referenceNumber: string;
  }>;
  /** Formal statement required if publication is retracted/withdrawn */
  withdrawalNotice?: {
    withdrawnAt: string;
    authorizedBy: string;
    publicReason: string;
  };
}

/**
 * Complete Canonical Advisory Document Model
 */
export interface AdvisoryDocument {
  // 1. Identity & Routing
  /** Stable UUIDv4 identifier across all versions of this advisory */
  id: string;
  /** Official national bulletin reference (e.g. "TT-CSIRT-ADV-2026-042") */
  referenceNumber: string;
  /** URL slug (e.g. "critical-pan-os-vulnerability-cve-2026-0300") */
  slug: string;
  /** Document classification */
  classification: AdvisoryClassification;
  /** Public title in plain English sentence case */
  title: string;

  // 2. Technical Vulnerability Attributes
  /** Overall national severity score */
  severity: SeverityRating;
  /** Traffic Light Protocol designation */
  tlp: TlpMarking;
  /** Primary CVE identifier if one vulnerability dominates disclosure */
  primaryCve?: string;
  /** Exhaustive list of CVE records addressed */
  cveList: CveMetadata[];
  /** Affected vendors, products, and software versions */
  affectedProducts: AffectedProduct[];

  // 3. Structured Content Body (AST)
  /** Plain-text lead paragraph for cards, search indexing, and social previews */
  leadParagraph: string;
  /** Structured sections containing typed AST nodes */
  sections: {
    /** Executive technical overview (Mandatory) */
    overview: CanonicalAdvisorySection;
    /** Potential business and technical operational impact (Mandatory) */
    impact: CanonicalAdvisorySection;
    /** In-depth vulnerability mechanics and proof-of-concept status (Optional) */
    technicalDetails?: CanonicalAdvisorySection;
    /** Indicators of Compromise (IoCs) and threat hunting instructions (Optional) */
    detectionMethods?: CanonicalAdvisorySection;
    /** Urgent immediate mitigations and workarounds (Optional) */
    immediateActions?: CanonicalAdvisorySection;
    /** Comprehensive patching, updates, and vendor fixes (Mandatory) */
    remediation: CanonicalAdvisorySection;
    /** Any specialized auxiliary sections */
    customSections?: CanonicalAdvisorySection[];
  };

  // 4. Auxiliary Technical Assets
  /** Curated reference links */
  references: AdvisoryReference[];
  /** Media assets embedded within the document */
  mediaAssets: AdvisoryMediaAsset[];

  // 5. Governance & Lifecycle (Sub-objects)
  /** Editorial review and author tracking */
  editorial: AdvisoryEditorialMetadata;
  /** Publication state and version tree metadata */
  publication: AdvisoryPublicationMetadata;
  /** Ingestion origin */
  provenance: AdvisoryProvenance;
}
```

---

## 3. Canonical Content Abstract Syntax Tree (AST)

To eliminate raw HTML injection, XSS vectors, and inconsistent markup, all narrative content within advisory sections is represented as structured AST nodes.

### 3.1 Node Model Definitions

```typescript
/**
 * Inline formatting element within text blocks
 */
export type InlineNode =
  | { type: "text"; text: string }
  | { type: "strong"; text: string }
  | { type: "emphasis"; text: string }
  | { type: "code"; text: string }
  | {
      type: "link";
      text: string;
      href: string;
      isExternal: boolean;
      title?: string;
    };

/**
 * Base properties for all block-level content nodes
 */
export interface BaseContentNode {
  /** Deterministic node ID unique within the document */
  id: string;
}

/**
 * Standard semantic paragraph
 */
export interface ParagraphNode extends BaseContentNode {
  type: "paragraph";
  /** Fallback plain-text representation */
  text: string;
  /** Rich inline node sequence */
  inlines: InlineNode[];
}

/**
 * Subordinate section headings (H3 and H4 only; H1 is page title, H2 is section title)
 */
export interface SubheadingNode extends BaseContentNode {
  type: "subheading";
  level: 3 | 4;
  text: string;
}

/**
 * Ordered or unordered list item
 */
export interface ListItemNode {
  id: string;
  text: string;
  inlines: InlineNode[];
}

/**
 * Structured list block
 */
export interface ListNode extends BaseContentNode {
  type: "list";
  ordered: boolean;
  items: ListItemNode[];
}

/**
 * Structured tabular data
 */
export interface TableNode extends BaseContentNode {
  type: "table";
  caption?: string;
  headers: string[];
  rows: string[][];
  alignments?: Array<"left" | "center" | "right">;
}

/**
 * Technical warning or security notice callout
 */
export interface CalloutNode extends BaseContentNode {
  type: "callout";
  tone: "warning" | "advisory" | "important";
  title?: string;
  text: string;
  inlines: InlineNode[];
}

/**
 * Preformatted code, log snippet, terminal command, or Yara/Snort rule
 */
export interface CodeBlockNode extends BaseContentNode {
  type: "code";
  code: string;
  language?: "bash" | "powershell" | "yara" | "snort" | "json" | "python" | "xml" | "text";
  filename?: string;
}

/**
 * Dedicated reference list block
 */
export interface ReferenceListNode extends BaseContentNode {
  type: "references";
  referenceIds: string[]; // Links to AdvisoryReference.id
}

/**
 * Union of all canonical content nodes permitted within sections
 */
export type CanonicalContentNode =
  | ParagraphNode
  | SubheadingNode
  | ListNode
  | TableNode
  | CalloutNode
  | CodeBlockNode
  | ReferenceListNode;

/**
 * Major advisory document section (rendered with H2 heading)
 */
export interface CanonicalAdvisorySection {
  id: string;
  title: string;
  level: 2;
  nodes: CanonicalContentNode[];
}
```

### 3.2 Structure Classification Table

| Content Structure | Canonical Treatment | Ingestion / Migration Action | Validation Gate Rule |
| :--- | :--- | :--- | :--- |
| **`<p>` Paragraph** | Preserved as `ParagraphNode` | Strips inline font tags, color styles, and class names. | Must contain non-whitespace text. Length $\le 4,000$ chars. |
| **`<h3>`, `<h4>` Headings** | Preserved as `SubheadingNode` | Converted to GDS sentence case; generates deterministic ID slug. | Level must be 3 or 4. Cannot contain hyperlinks. |
| **`<h2>` Headings** | Section Boundary | Divides document into `CanonicalAdvisorySection`. | H1 and H2 forbidden inside node array. |
| **`<h1>` Headings** | Stripped / Replaced | Rejected if present in body; title is held exclusively at document root. | Exactly one H1 per page, rendered exclusively by layout. |
| **`<ul>` Unordered List** | Preserved as `ListNode (ordered: false)` | Strips WordPress bullet wrappers, `<br>` separators, and bullet symbols (`•`, `*`). | Must contain $\ge 1$ item. Max 50 items. |
| **`<ol>` Ordered List** | Preserved as `ListNode (ordered: true)` | Strips WordPress number markers; normalizes item array. | Must contain $\ge 1$ item. Max 50 items. |
| **`<table>` Data Table** | Preserved as `TableNode` | Strips nested layout tables; converts Elementor wrappers to standard headers/rows. | Layout tables converted to definition lists or rejected. |
| **`<div>`, `<span>` Containers**| Unwrapped | Strips all visual wrapper containers and CSS class styling. | Container tags rejected in canonical AST. |
| **`<font>`, `<b>`, `<i>`** | Converted to `InlineNode` | `<font color="...">` stripped; `<b>` $\rightarrow$ `strong`; `<i>` $\rightarrow$ `emphasis`. | Style and font attributes rejected. |
| **`<a href="...">` Links** | Converted to `InlineNode.link` | Rewrites protocol to `https://`; marks `isExternal`; cleans anchor text. | `http://` flagged; `javascript:` and data URIs rejected. |
| **`<pre>`, `<code>`** | Preserved as `CodeBlockNode` | Extracts raw code text; strips syntax-highlighter HTML wrapper markup. | Language restricted to approved whitelist. |
| **`<script>`, `<iframe>`** | **REJECTED BY VALIDATION** | Completely discarded during migration; never admitted to canonical store. | Fatal 422 error. Causes immediate draft rejection. |
| **`style="..."` Attributes** | **REJECTED BY VALIDATION** | Stripped during sanitization. | Fatal 422 error if present in incoming payload. |
| **Consecutive Hyperlinks** | Preserved as separate paragraphs or `ReferenceListNode` | Links appearing in prose remain inline paragraphs; never artificially bulleted. | Bulleting consecutive links prohibited by TT-CSIRT rule. |

---

## 4. Advisory Version Contract (`AdvisoryVersion`)

Published advisories are permanent historical security records. An existing version $v_n$ is **strictly immutable**.

### 4.1 Schema Definition (TypeScript)

```typescript
export interface AdvisoryVersion {
  /** UUIDv4 primary identifier of the version record */
  versionId: string;
  /** Reference to the parent advisory bulletin */
  advisoryId: string;
  /** Official bulletin reference, e.g. "TT-CSIRT-ADV-2026-042" */
  referenceNumber: string;
  /** Monotonically increasing version number (1, 2, 3...) */
  versionNumber: number;
  /** Complete, self-contained canonical document snapshot */
  documentPayload: AdvisoryDocument;
  /** Cryptographic content integrity digest */
  contentDigest: {
    algorithm: "SHA-256";
    /** Hex digest computed over deterministic canonical JSON string */
    hexDigest: string;
  };
  /** Publication event metadata */
  publishedAt: string;
  /** User identifier of approving officer */
  approvedByUserId: string;
  /** User identifier of release administrator who published */
  publishedByUserId: string;
  /** Public summary of changes in this version */
  releaseNotes: string;
  /** Relationship pointers */
  supersededBy?: {
    advisoryId: string;
    referenceNumber: string;
    effectiveDate: string;
  };
}
```

### 4.2 Version Branching and Correction Rules
1. **Initial Publication ($v_1$)**: When an advisory passes review and approval, the system freezes the document as Version `1`.
2. **Corrections and Updates**:
   - To make an update, an Analyst creates a new draft version ($v+1$) based on $v_n$.
   - While $v+1$ is undergoing drafting and review, the public website continues serving $v_n$ without disruption.
   - Once $v+1$ is approved and published:
     - Version $n+1$ becomes the active version served to the public.
     - Version $n$ is retained in the historical version archive.
     - The public document display renders an update banner indicating: `Version 2 - Published 24 September 2026 (Updated from Version 1)`.
3. **Immutability Invariant**: No database query, API endpoint, or background script shall execute `UPDATE` or `DELETE` statements on `AdvisoryVersion` records.

---

## 5. Audit Event Contract (`AdvisoryAuditEvent`)

All state transitions, editorial mutations, and governance approvals generate append-only audit events.

### 5.1 Schema Definition (TypeScript)

```typescript
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
  | "MEDIA_QUARANTINED";

export interface AdvisoryAuditEvent {
  /** Unique UUIDv4 event identifier */
  eventId: string;
  /** Target advisory identifier */
  advisoryId: string;
  /** Bulletin reference number */
  referenceNumber: string;
  /** Version number associated with event */
  version: number;
  /** Authenticated actor information */
  actor: {
    userId: string;
    email: string;
    role: "AUTHOR" | "REVIEWER" | "APPROVER" | "ADMINISTRATOR" | "SYSTEM";
    ipAddress: string;
    userAgent: string;
  };
  /** Executed lifecycle action */
  action: AuditAction;
  /** Status prior to transition */
  previousStatus?: AdvisoryStatus;
  /** Status resulting from transition */
  resultingStatus: AdvisoryStatus;
  /** ISO 8601 UTC timestamp of event */
  timestamp: string;
  /** Justification comment, reviewer feedback, or withdrawal rationale */
  comment?: string;
  /** Content digest of document payload at this exact moment */
  payloadDigest?: {
    algorithm: "SHA-256";
    hexDigest: string;
  };
  /** Structural diff summary */
  diffSummary?: {
    sectionsModified: string[];
    cvesAdded?: string[];
    cvesRemoved?: string[];
    affectedProductsModified?: boolean;
  };
  /** Optional cryptographic signature recorded as hardening extension */
  signature?: {
    keyId: string;
    algorithm: "Ed25519";
    signatureHex: string;
  };
}
```

---

## 6. Public Delivery Contract (`PublishedAdvisoryDocument`)

The public website consumes only verified, published artefacts. It has zero awareness of internal workflow states, staff identities, or reviewer notes.

### 6.1 Schema Definition (TypeScript)

```typescript
/**
 * Clean public presentation payload delivered to browser / CDN
 */
export interface PublishedAdvisoryDocument {
  // Identity & Discovery
  id: string;
  referenceNumber: string;
  slug: string;
  classification: AdvisoryClassification;
  title: string;
  version: number;

  // Timestamps
  publishedDate: string; // Formatted display date, e.g. "20 July 2026"
  publishedAtIso: string; // ISO 8601 UTC
  updatedDate?: string;
  updatedAtIso?: string;

  // Technical Security Details
  severity: SeverityRating;
  tlp: TlpMarking;
  primaryCve?: string;
  cveList: Array<{
    id: string;
    cvssScore?: number;
    cvssVector?: string;
    summary?: string;
  }>;
  affectedProducts: Array<{
    vendor: string;
    product: string;
    affectedVersions: string[];
    fixedVersions?: string[];
  }>;

  // Content Narrative
  leadParagraph: string;
  sections: Array<{
    id: string;
    title: string;
    level: 2;
    nodes: CanonicalContentNode[];
  }>;

  // External Citations & Media
  references: Array<{
    title: string;
    url: string;
    type: string;
    isExternal: boolean;
  }>;
  mediaAssets: Array<{
    publicUrl: string;
    altText: string;
    caption?: string;
  }>;

  // Lifecycle Pointers
  isSuperseded: boolean;
  supersededBy?: {
    referenceNumber: string;
    slug: string;
    title: string;
  };
  supersedesPredecessors?: Array<{
    referenceNumber: string;
    slug: string;
  }>;
  isWithdrawn: boolean;
  withdrawalNotice?: {
    withdrawnDate: string;
    publicReason: string;
  };

  // Integrity & Presentation Aid
  readingTimeMinutes: number;
  contentDigest: string; // SHA-256 hex digest
}
```

### 6.2 Fields Explicitly Stripped from Public Payloads
The following fields are **strictly prohibited** from ever being transmitted to or stored on the public delivery plane:
* `authorId`, `authorEmail`
* `reviewerId`, `reviewerNotes`
* `approverId`, `approverNotes`
* `internalTags`
* Internal database primary keys (`serial`, internal row UUIDs)
* Validation failure logs and reviewer rejection histories
* Unapproved draft versions or intermediate revisions
* Legacy WordPress category IDs, term taxonomies, and author IDs

---

## 7. Published Repository & Directory Contract

The published repository is a static, read-only content store serving the public delivery plane and external subscribers.

### 7.1 Path & Routing Specifications

```
/advisories/v1/
├── index.json                             # Canonical index listing of all published bulletins
├── feed.atom                              # Authoritative national Atom syndication feed
├── feed.rss                               # Authoritative RSS 2.0 syndication feed
├── by-slug/
│   ├── {slug}.json                        # Latest approved version resolved by URL slug
│   └── ...
├── by-reference/
│   ├── {referenceNumber}.json             # Latest approved version resolved by bulletin reference
│   └── {referenceNumber}/
│       ├── v1.json                        # Immutable historical snapshot Version 1
│       ├── v2.json                        # Immutable historical snapshot Version 2
│       └── ...
└── assets/
    └── {advisoryId}/
        ├── {sha256}.png                   # Content-addressed immutable media
        └── ...
```

### 7.2 Index Payload Specification (`/advisories/v1/index.json`)

```typescript
export interface PublishedAdvisoryIndexItem {
  id: string;
  referenceNumber: string;
  slug: string;
  classification: AdvisoryClassification;
  title: string;
  version: number;
  publishedDate: string;
  publishedAtIso: string;
  updatedDate?: string;
  updatedAtIso?: string;
  severity: SeverityRating;
  tlp: TlpMarking;
  primaryCve?: string;
  cveList: string[];
  affectedVendors: string[];
  leadParagraph: string;
  isSuperseded: boolean;
  isWithdrawn: boolean;
  contentDigest: string;
}

export interface PublishedAdvisoryIndex {
  version: "1.0";
  generatedAt: string;
  totalBulletins: number;
  activeBulletins: number;
  supersededBulletins: number;
  withdrawnBulletins: number;
  items: PublishedAdvisoryIndexItem[];
}
```

### 7.3 HTTP Caching & Invalidation Headers

| Resource Path | Cache-Control Header | Invalidation Mechanism |
| :--- | :--- | :--- |
| `/advisories/v1/index.json` | `public, max-age=120, s-maxage=300, stale-while-revalidate=86400` | Purged immediately by Publishing API upon release of any bulletin. |
| `/advisories/v1/by-slug/{slug}.json` | `public, max-age=300, s-maxage=900, stale-while-revalidate=86400` | Purged immediately upon publication of a new version or withdrawal. |
| `/advisories/v1/by-reference/{ref}/v{n}.json` | `public, max-age=31536000, immutable` | **Never invalidated** (immutable historical snapshot). |
| `/assets/{advisoryId}/{sha256}.{ext}` | `public, max-age=31536000, immutable` | **Never invalidated** (content-addressed by SHA-256). |

---

## 8. Controlled Media & Asset Contract

The legacy `/wp-content/uploads/` path structure is deprecated. All media assets in the publishing architecture are strictly validated, content-addressed, and quarantined prior to release.

### 8.1 Asset Constraints & Parameters

```typescript
export const MEDIA_CONSTRAINTS = {
  ALLOWED_MIME_TYPES: [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/svg+xml",
    "application/pdf",
  ] as const,

  MAX_IMAGE_SIZE_BYTES: 5 * 1024 * 1024, // 5 Megabytes
  MAX_DOCUMENT_SIZE_BYTES: 25 * 1024 * 1024, // 25 Megabytes

  PATH_FORMAT: "/assets/advisories/{advisoryId}/{sha256}.{ext}",
  QUARANTINE_PATH_FORMAT: "/quarantine/assets/{advisoryId}/{sha256}.{ext}",
};
```

### 8.2 Media Lifecycle & Quarantine Rules
1. **Upload to Quarantine**: When an author uploads an asset during drafting, the file is saved exclusively in the isolated quarantine store.
2. **Server-Side Validation**:
   - **Magic Byte Verification**: Inspects leading binary signatures to prevent MIME spoofing (e.g. executable disguised as PNG).
   - **SVG Sanitization**: Parsed with XML DOM; strips all `<script>`, `<iframe>`, `<object>`, external XML entity declarations (`<!ENTITY`), and inline event handlers (`onload`, `onerror`).
   - **PDF Structural Inspection**: Verifies valid PDF trailer; rejects files embedding JavaScript actions (`/JS`, `/JavaScript`).
3. **Promotion on Publication**: Upon formal approval and publication of the advisory, referenced assets are copied atomically from quarantine to the public immutable storage path.
4. **Orphan Sweeper**: Assets uploaded to drafts that remain unpublished for $>30$ days are purged from quarantine.

---

## 9. Implemented Shared Package: `@ttcsirt/canonical-types`

The canonical contract package is implemented locally at `packages/canonical-types/` and aliased in `tsconfig.json` and `vite.config.ts`.

### 9.1 Module Layout & Exports

```
packages/canonical-types/
├── package.json
└── src/
    ├── advisory.ts       # AdvisoryDocument, PublishedAdvisoryDocument, toPublishedAdvisoryDocument
    ├── audit.ts          # AdvisoryAuditEvent, AuditAction, AuditActor, AuditDiffSummary
    ├── content.ts        # CanonicalContentNode AST, ParagraphNode, TableNode, CalloutNode, etc.
    ├── discovery.ts      # PublishedAdvisoryIndex, PublishedAdvisoryIndexItem, Syndication
    ├── index.ts          # Root barrel export for all canonical types
    ├── media.ts          # AdvisoryMediaAsset, MediaMimeType, MEDIA_CONSTRAINTS
    ├── publication.ts    # AdvisoryStatus, AdvisoryPublicationMetadata, EditorialMetadata, References
    ├── taxonomy.ts       # PublicationType, AdvisoryClassification, SeverityRating, TlpMarking
    ├── validation.ts     # ValidationResult, ValidationError, ValidationWarning, Error codes
    ├── version.ts        # AdvisoryVersion, VersionHistorySummary, snapshot models
    └── vulnerability.ts  # CveMetadata, CvssVersion, AffectedProduct, VulnerabilityMetric
```

### 9.2 Strict Architectural Invariants & Dependency Rules

The shared package maintains zero dependencies on:
* WordPress REST endpoints, taxonomy IDs, post IDs, or `/wp-json/`
* Browser DOM APIs (`window`, `document`, `DOMParser`, `localStorage`, `indexedDB`)
* React runtime or components (`@vitejs/plugin-react`, `dangerouslySetInnerHTML`)
* Server/Database frameworks (`express`, `pg`, `drizzle`)

### 9.3 Mapping to Existing Codebase

During the current Phase 1 freeze, the live website continues running without modification to avoid breaking the active WordPress ingestion path. The following table identifies existing types and their target canonical counterparts:

| Existing File / Type | Corresponding Canonical Type (`@ttcsirt/canonical-types`) | Future Migration Strategy |
| :--- | :--- | :--- |
| `src/services/publicationTaxonomy.ts`: `PublicationType`, `TaxonomyEntity` | `taxonomy.ts`: `PublicationType`, `CanonicalTag` | Will be replaced by import from `@ttcsirt/canonical-types`. |
| `src/services/advisoryDocument.ts`: `CanonicalNode` (has `raw-html`) | `content.ts`: `CanonicalContentNode` (no `raw-html`) | `raw-html` eliminated; legacy parser will map into typed AST nodes or callouts. |
| `src/services/advisoryDocument.ts`: `CanonicalSection` | `content.ts`: `CanonicalAdvisorySection` | Exact match; can be imported directly. |
| `src/services/advisoryDocument.ts`: `CanonicalAdvisoryDocument` | `advisory.ts`: `PublishedAdvisoryDocument` | Public reader page will accept `PublishedAdvisoryDocument`. |
| `src/services/advisories.ts`: `AdvisoryItem` | `discovery.ts`: `PublishedAdvisoryIndexItem` | Public catalog loader will hydrate from canonical index items. |
| `src/services/advisories.ts`: `AdvisoryDocumentDetail` | `advisory.ts`: `PublishedAdvisoryDocument` | Detail page loader will hydrate from canonical published JSON. |

---
*Contract End - Phase 1 Canonical Contract Implementation Complete.*
