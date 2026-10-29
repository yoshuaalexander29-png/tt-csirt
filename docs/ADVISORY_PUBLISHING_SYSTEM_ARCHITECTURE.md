# TT-CSIRT Advisory Publishing System Architecture Specification
## Internal Control Plane & Public Delivery Plane Separation

**Status**: Architectural Specification & Design Ledger  
**Classification**: Official / System Architecture  
**Target Domain**: Trinidad and Tobago Cyber Security Incident Response Team (TT-CSIRT)  
**Date**: September 2026

---

## 1. Executive Summary & Architectural Separation

The TT-CSIRT portal operates as a national public delivery plane, responsible for communicating high-integrity cyber threat warnings, vulnerability disclosures, statutory services, and emergency reporting channels to citizens, critical national infrastructure (CNI), and governmental agencies.

The **Advisory Publishing System** is an independent, authenticated internal control plane responsible for the full authoring and governance lifecycle:
```
Draft → Validate → Preview → Review → Approve → Publish → Superseded / Withdrawn
```

### The Invariant Boundary
The public delivery application and the internal publishing application are strictly decoupled across process, data, and security boundaries:

```
[ Internal Staff / Analysts / Approvers ]
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│        INTERNAL PUBLISHING SYSTEM (Control Plane)      │
│  - Staff Authentication & Session Management (MFA)     │
│  - Role-Based Access Control (RBAC: Author/Review/Appr)│
│  - Structured Advisory Schema Editor & Asset Ingestion │
│  - Two-Person Integrity & Approval State Machine       │
│  - Preview Server (Signed / Authenticated Non-Public)  │
│  - Versioning & Immutable Audit Ledger                 │
└──────────────────────────┬─────────────────────────────┘
                           │ (Publish Action via Private API)
                           ▼
┌────────────────────────────────────────────────────────┐
│        PUBLISHING API & PERSISTENCE BACKEND            │
│  - Advisory Store (Drafts, Historic Versions, Audit)   │
│  - Validation Engine (Schema, CVE, CVSS, Link Audit)   │
│  - Asset Storage & Media Quarantine/Signer             │
│  - Atomic Release Distributor                          │
└──────────────────────────┬─────────────────────────────┘
                           │ (Generates / Syncs Published Artefacts)
                           ▼
┌────────────────────────────────────────────────────────┐
│       CANONICAL PUBLISHED ADVISORY REPOSITORY          │
│  - Read-Only Published Canonical JSON Documents        │
│  - Public Search Ingestion Feeds                       │
│  - Verified Static Media (/documents/, /assets/)       │
└──────────────────────────┬─────────────────────────────┘
                           │ (Read-Only Fetch / Edge Cache)
                           ▼
┌────────────────────────────────────────────────────────┐
│         PUBLIC TT-CSIRT WEBSITE (Delivery Plane)       │
│  - Read-Only Public Delivery & Navigation              │
│  - Zero Staff Auth / Zero Edit / Zero Draft Controls   │
│  - Zero Privileged Publishing Credentials              │
│  - Deterministic GOV.UK Rendering Engine               │
│  - Search Indexing of Approved Content ONLY            │
└────────────────────────────────────────────────────────┘
```

### Public Delivery Plane Invariants
The public application must NEVER contain or expose:
1. Staff authentication flows or login gateways;
2. Editorial controls, WYSIWYG markup generators, or draft management panels;
3. Approval controls or two-person review mechanisms;
4. Privileged publishing credentials, private signing keys, or direct write access to the advisory database;
5. Unrestricted or authenticated advisory write endpoints;
6. Arbitrary staff-authored raw HTML rendering (all rendering is driven by structured canonical AST nodes).

---

## 2. Repository Analysis & Shared Module Isolation

### Current Codebase Inspection
An audit of existing advisory, parsing, and rendering modules identified the following boundaries:

| Current File / Component | Responsibility | Recommended Destination |
| :--- | :--- | :--- |
| `src/services/publicationTaxonomy.ts` | Canonical taxonomy (`PublicationType`, `cleanEntities`) | **Shared Package** (`@ttcsirt/canonical-types`) |
| `src/services/advisoryDocument.ts` (AST types & render rules) | Canonical AST (`CanonicalNode`, `CanonicalSection`, `CanonicalAdvisoryDocument`) | **Shared Package** (`@ttcsirt/canonical-types`) |
| `src/services/advisoryDocument.ts` (HTML normalization & parsing) | Legacy HTML sanitizer, table unroller, regex normalizer | **Migration / Upstream Adapter** (Ingestion only) |
| `src/services/advisoryTableNormalizer.ts` | Legacy table unwrapper for Elementor/WordPress HTML | **Migration / Upstream Adapter** (Ingestion only) |
| `src/components/AdvisoryContentRenderer.tsx` | Pure deterministic React rendering of `CanonicalNode`s | **Shared UI Component** (Used by public site & internal preview) |
| `src/services/advisories.ts` | Fetching advisories from transitional WP adapter | **Transitional Public Client** (Replaced by Canonical Client) |
| `src/services/advisoryCache.ts` | Resilient browser-side IndexedDB/localStorage cache | **Public Delivery Plane Only** |
| `src/services/upstream/wordpress/*` | WordPress categories, endpoints, pagination headers | **Transitional Ingestion Worker Only** |
| `src/services/search/*` | Search corpus, tokenization, alias expansion, indexing | **Public Delivery Plane** (Consumes published documents) |
| `src/pages/AdvisoriesPage.tsx` | Public advisory listing, search, pagination | **Public Delivery Plane Only** |
| `src/pages/AdvisoryDetailPage.tsx` | Public advisory document viewing | **Public Delivery Plane Only** |

### Shared vs Isolated Contracts

```
SHARED CONTRACTS & PACKAGES (@ttcsirt/canonical-types)
├── Publication Types & Classifications
├── Canonical Advisory Schema (v1.0)
├── Canonical AST & Content Block Definitions
├── Advisory Severity, CVSS v3.1/v4.0, & CVE Model
├── Standard Error & Validation Result Schemas
└── Advisory Audit Event Data Contracts

INTERNAL CONTROL PLANE ONLY (Publishing System)
├── Staff Identity, Session Tokens, MFA, & RBAC Claims
├── Editorial Workflow State Machine & Transition Rules
├── Two-Person Rule & Cryptographic Approval Verification
├── Draft Validation Engine & Asset Upload Pipeline
├── Draft Persistence, Version Tree, & Diff Engine
└── Publishing API Endpoints (/api/publishing/*)

PUBLIC DELIVERY PLANE ONLY (Public Website)
├── Read-Only Published Document Fetchers & Fallback Cache
├── Public Routing (/advisories, /advisories/:slug)
├── Site Search Ingestion Engine (Published documents only)
└── Anonymous Public Incident Reporting Service
```

---

## 3. Canonical Advisory Contract (`AdvisoryDocument`)

The canonical contract represents structured, validated technical disclosures. It does **not** store or transport arbitrary WordPress HTML, untrusted `<script>` tags, inline styling, or vendor-specific attributes.

### Schema Definition (TypeScript Interface)

```typescript
export type AdvisoryStatus =
  | "draft"
  | "ready_for_review"
  | "changes_requested"
  | "approved"
  | "published"
  | "superseded"
  | "withdrawn";

export type AdvisoryClassification = "advisory" | "alert";

export type SeverityRating = "critical" | "high" | "medium" | "low" | "informational";

export interface CveMetadata {
  id: string; // Format: CVE-YYYY-NNNN+
  cvssVersion?: "3.1" | "4.0";
  cvssScore?: number; // 0.0 - 10.0
  cvssVector?: string; // e.g. "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"
  cweIds?: string[]; // e.g. ["CWE-79", "CWE-89"]
}

export interface AffectedSystem {
  vendor: string;
  product: string;
  affectedVersions: string[];
  fixedVersions?: string[];
  cpe?: string[];
}

export interface StructuredAdvisoryNode {
  id: string;
  type:
    | "paragraph"
    | "subheading"
    | "list"
    | "table"
    | "warning"
    | "code"
    | "metadata-block"
    | "callout";
  text?: string;
  level?: 3 | 4; // Subheadings
  ordered?: boolean;
  items?: string[]; // For lists
  headers?: string[]; // For tables
  rows?: string[][]; // For tables
  language?: string; // For code blocks
  links?: Array<{ href: string; text: string; isExternal?: boolean }>;
}

export interface StructuredAdvisorySection {
  id: string;
  title: string;
  level: 2;
  nodes: StructuredAdvisoryNode[];
}

export interface AdvisoryReferenceLink {
  title: string;
  url: string;
  type: "vendor_advisory" | "mitre_cve" | "nvd" | "exploit_db" | "news" | "official_guidance";
  accessedDate?: string;
}

export interface AdvisoryDocument {
  // 1. Identity & Classification
  id: string; // UUIDv4 internal ID
  referenceNumber: string; // Official format: "TT-CSIRT-ADV-YYYY-NNN" or "TT-CSIRT-ALT-YYYY-NNN"
  slug: string; // URL-safe slug, e.g. "critical-pan-os-vulnerability-cve-2026-0300"
  classification: AdvisoryClassification;
  title: string; // Plain-English sentence case headline
  version: number; // Monotonically increasing version counter (1, 2, 3...)
  status: AdvisoryStatus;

  // 2. Temporal Metadata
  publishedDate?: string; // ISO 8601 UTC
  updatedDate?: string; // ISO 8601 UTC
  createdDate: string; // ISO 8601 UTC

  // 3. Technical Vulnerability Profiles
  severity: SeverityRating;
  cveList: CveMetadata[];
  primaryCve?: string;
  affectedSystems: AffectedSystem[];

  // 4. Structured Technical Narrative
  leadParagraph: string; // Plain-text executive summary for listings & search
  sections: {
    overview: StructuredAdvisorySection;
    impact: StructuredAdvisorySection;
    technicalDetails?: StructuredAdvisorySection;
    detectionMethods?: StructuredAdvisorySection;
    immediateActions?: StructuredAdvisorySection;
    remediation: StructuredAdvisorySection;
    customSections?: StructuredAdvisorySection[];
  };

  // 5. References & Media
  references: AdvisoryReferenceLink[];
  mediaAssets: Array<{
    assetId: string;
    caption: string;
    altText: string;
    path: string;
    sha256: string;
  }>;

  // 6. Relationships & Lifecycle
  supersededBy?: string; // Reference to new advisory if superseded
  supersedes?: string[]; // References to older advisories replaced by this one
  withdrawalReason?: string; // Required if status === "withdrawn"

  // 7. Provenance & Control Metadata (Stripped from public delivery plane)
  internalMetadata?: {
    authorId: string;
    reviewerId?: string;
    approverId?: string;
    contentHash: string; // SHA-256 of canonical JSON
    sourceProvenance?: "native_authoring" | "wordpress_migration";
    legacySourceId?: number; // Original WP post ID if migrated
  };
}
```

---

## 4. Editorial Workflow State Machine

The publishing lifecycle mandates clear role segregation and non-repudiation.

> **Architectural Invariant**: Validation is executed as a synchronous **server-side gate process** during submission rather than an intermediate persistent database state (`VALIDATING`). If validation fails, errors are returned immediately and the draft remains in `DRAFT` or `CHANGES_REQUESTED`.

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                          DRAFT                          │◄───────────────────────┐
                    └────────────────────────────┬────────────────────────────┘                        │
                                                 │ Author Submits                                      │
                                                 │ (Server-side validation gate must pass 100%)        │
                                                 ▼                                                     │
                                    ┌─────────────────────────┐                                        │
                                    │    READY_FOR_REVIEW     │                                        │
                                    └────────────┬────────────┘                                        │
                         Reviewer Rejects        │            │ Reviewer Passes                        │
                         (Provides Notes)        │            │                                        │
                                                 ▼            ▼                                        │
                                    ┌─────────────────────────┐                                        │
                                    │    CHANGES_REQUESTED    ├────────────────────────────────────────┘
                                    └────────────▲────────────┘   Author Re-enters Draft to Address Notes
                                                 │
                                                 │ Approver Rejects Prior to Sign-off
                                                 │
                                    ┌────────────┴────────────┐
                                    │        APPROVED         │
                                    └────────────┬────────────┘
                                                 │ Approver Publishes
                                                 │ (Two-person integrity: Author != Approver)
                                                 ▼
                                    ┌─────────────────────────┐
                                    │        PUBLISHED        │
                                    └──────┬────────────┬─────┘
                                           │            │
                         Successor Issued  │            │ Formal Retraction
                                           ▼            ▼
                                    ┌────────────┐ ┌────────────┐
                                    │ SUPERSEDED │ │ WITHDRAWN  │
                                    └────────────┘ └────────────┘
```

### Role-Based Access Control (RBAC) Matrix

| State Transition | Permitted Roles | Prerequisite & Rules |
| :--- | :--- | :--- |
| `DRAFT` → `READY_FOR_REVIEW` | `AUTHOR`, `ADMINISTRATOR` | Server-side validation gate must pass 100% (syntax, CVE, links). |
| `READY_FOR_REVIEW` → `CHANGES_REQUESTED` | `REVIEWER`, `ADMINISTRATOR` | Reviewer provides structured feedback notes. |
| `CHANGES_REQUESTED` → `DRAFT` | `AUTHOR`, `ADMINISTRATOR` | Unfreezes draft for author revisions. |
| `READY_FOR_REVIEW` → `APPROVED` | `REVIEWER`, `ADMINISTRATOR` | **Two-Person Rule**: Reviewer cannot be the same actor as Author. |
| `APPROVED` → `CHANGES_REQUESTED` | `APPROVER`, `ADMINISTRATOR` | Approver identifies issue prior to publication. |
| `APPROVED` → `PUBLISHED` | `APPROVER`, `ADMINISTRATOR` | **Two-Person Rule**: Approver cannot be Author (`approverId !== authorId`). |
| `PUBLISHED` → `DRAFT (v+1)` | `AUTHOR`, `ADMINISTRATOR` | Creates a new draft version ($v+1$); published version remains active. |
| `PUBLISHED` → `SUPERSEDED` | `APPROVER`, `ADMINISTRATOR` | Requires pointer to new valid `referenceNumber`. |
| `PUBLISHED` → `WITHDRAWN` | `APPROVER`, `ADMINISTRATOR` | Requires formal justification statement and public retraction note. |
| *Any Published* → `PUBLISHED (v+1)` | `ADMINISTRATOR` | **Emergency Rollback**: Re-publishes prior snapshot $v_k$ as new version. |

---

## 5. Versioning and Immutable Audit Ledger

### Monotonic Versioning
Advisories are versioned as append-only records:
* **Initial Release**: Version `1`.
* **Editorial Revisions / Corrections**: Increment version (`2`, `3`, etc.).
* **Published State Invariant**: A published version $v_n$ is **frozen and immutable**. Any update generates draft $v_{n+1}$.
* **Public Visibility**: The public site serves the latest approved published version by default, with an explicit version banner (`Version 2.0 - Updated 24 September 2026`).

### Audit Event Model
Every mutation or state transition emits an immutable audit event:

```typescript
export interface AdvisoryAuditEvent {
  eventId: string; // UUIDv4
  timestamp: string; // ISO 8601 UTC
  advisoryId: string;
  version: number;
  actor: {
    userId: string;
    email: string;
    role: string;
    ipAddress: string;
    userAgent: string;
  };
  action:
    | "CREATED"
    | "EDITED"
    | "VALIDATION_PASSED"
    | "VALIDATION_FAILED"
    | "SUBMITTED_FOR_REVIEW"
    | "CHANGES_REQUESTED"
    | "APPROVED"
    | "PUBLISHED"
    | "SUPERSEDED"
    | "WITHDRAWN"
    | "ROLLBACK";
  previousState?: AdvisoryStatus;
  newState: AdvisoryStatus;
  changeSummary?: string;
  diffSummary?: {
    fieldsChanged: string[];
    cvesAdded?: string[];
    cvesRemoved?: string[];
  };
  contentDigest: {
    algorithm: "SHA-256";
    hash: string; // Hex digest of normalized AdvisoryDocument payload
  };
  signature?: {
    keyId: string;
    signatureValue: string; // Ed25519 signature of the hash
  };
}
```

---

## 6. Security Boundaries & Trust Architecture

```
        ZONE 1: PUBLIC DELIVERY                    ZONE 2: INTERNAL CONTROL PLANE
 (Internet Facing / Zero Secrets)             (Enterprise Perimeter / Authenticated)

  ┌─────────────────────────────┐               ┌───────────────────────────────┐
  │   Public TT-CSIRT Web App   │               │   Internal Publishing UI      │
  │   - Edge CDN / Cache        │               │   - Authenticated Analysts    │
  │   - Read-Only JSON Fetch    │               │   - MFA & Hardware Tokens     │
  │   - Client-side Search      │               │   - Preview Mode Engine       │
  └──────────────▲──────────────┘               └───────────────┬───────────────┘
                 │ Read-Only                                    │ Authenticated
                 │ Static Feeds                                 │ REST / mTLS
                 │                                              ▼
  ┌──────────────┴──────────────┐               ┌───────────────────────────────┐
  │  Published Content Storage  │◄──Publish─────┤   Publishing Control API      │
  │  - Static CDN Origin / S3   │    (Signed)   │   - Authorization / RBAC      │
  │  - Immutable Releases       │               │   - Validation Engine         │
  └─────────────────────────────┘               │   - State Machine Enforcer    │
                                                └───────────────┬───────────────┘
                                                                │ Direct Connection
                                                                ▼
                                                ┌───────────────────────────────┐
                                                │   Internal PostgreSQL DB      │
                                                │   - Drafts & Version Trees    │
                                                │   - Audit Event Ledger        │
                                                │   - User Identity & Roles     │
                                                └───────────────────────────────┘
```

### Trust Boundary Rules
1. **No Shared Database Credentials**: The public web tier has no network route or database credentials to the internal database.
2. **One-Way Content Propagation**: Content flows in one direction:
   $$\text{Publishing Engine} \xrightarrow{\text{Atomic Write / CDN Invalidation}} \text{Published Static Store} \xrightarrow{\text{HTTP GET}} \text{Public Site}$$
3. **Deny-by-Default API**: All internal publishing endpoints require signed JWT bearer tokens validated server-side against role policies.
4. **Content Security Policy (CSP)**:
   - Public site CSP prohibits execution of inline scripts and disallows connections to the internal publishing API.

---

## 7. Preview Safety Architecture

Staff must preview how an advisory will appear before approval, using the authentic public GOV.UK rendering components without risking pre-disclosure of confidential zero-days or sensitive vulnerability details.

### Preview Isolation Invariants
1. **Zero Public Indexing**: Drafts and preview instances are strictly excluded from:
   - `siteSearch.ts` and search indexing caches;
   - Sitemap generators (`sitemap.xml`);
   - Public RSS/Atom feeds;
   - Browser history storage (`sessionStorage.getItem("ttcsirt_advisories_url")`).
2. **Ephemeral Signed Preview URLs**:
   - Preview URLs are generated with cryptographic signatures and expiration timestamps:  
     `/preview/advisories?token=<HMAC-SHA256-Signature>&expires=1727028000`
   - Unauthenticated or expired requests receive an immediate `404 Not Found` (avoiding timing attacks that confirm draft existence).
3. **Shared Visual Component**:
   - The preview interface reuses the pure `AdvisoryContentRenderer.tsx` component from the shared design package, guaranteeing 100% visual parity with public output.
4. **Prominent Watermark & Security Header**:
   - Previews render a full-width GOV.UK warning banner:  
     `UNOFFICIAL DRAFT PREVIEW – NOT APPROVED FOR PUBLIC DISTRIBUTION`
   - HTTP response header: `X-Robots-Tag: noindex, nofollow, noarchive`.

---

## 8. Content Validation Engine

To prevent malformed structures, formatting breakages, and injection vulnerabilities, validation runs on both client (for UX feedback) and server (for gatekeeping).

### Validation Rules
1. **Schema & Typographic Validation**:
   - **Reference Number**: Must match regex `^TT-CSIRT-(ADV|ALT)-\d{4}-\d{3,}$`.
   - **Sentence Case Invariant**: Headings must strictly conform to GDS sentence case rules (enforced by `normalizeHeadingSentenceCase`).
   - **Mandatory Sections**: Overview and Remediation sections are strictly required.
   - **Forbidden HTML**: Raw `<script>`, `<iframe>`, `<style>`, `<object>`, `<embed>`, or arbitrary `style="..."` attributes are rejected with `422 Unprocessable Entity`.
2. **CVE & CVSS Integrity**:
   - Every CVE must match `^CVE-\d{4}-\d{4,}$`.
   - If CVSS score is present, vector string must be syntactically valid against FIRST CVSS v3.1 / v4.0 specifications.
3. **Hyperlink Sanitization**:
   - All links must use `https://` or `mailto:`. `http://` is flagged with a warning.
   - Links pointing to known malicious TLDs or raw IP addresses are quarantined.
   - External links automatically receive `rel="noopener noreferrer"`.

---

## 9. Controlled Media & Asset Pipeline

The legacy reliance on WordPress `/wp-content/uploads/` is completely eliminated in the publishing architecture.

### Asset Pipeline Specifications
* **Allowed MIME Types**: `image/png`, `image/jpeg`, `image/webp`, `image/svg+xml`, `application/pdf`. (All executables, scripts, and macro-enabled documents are rejected).
* **Maximum File Sizes**:
  - Images: `5 MB`
  - PDF documents: `25 MB`
* **Storage & Addressing**:
  - Assets are stored by SHA-256 hash: `/assets/advisories/{advisory-id}/{sha256}.{ext}`.
  - Public paths are immutable.
* **SVG Sanitization**: SVGs are parsed server-side via XML DOM; all script tags, external entity declarations (XXE mitigation), and event handlers (`onload`, `onerror`) are stripped.
* **Draft Cleanup Lifecycle**: Assets uploaded to drafts that remain unpublished for >30 days are swept into a quarantine archive and deleted after 90 days.

---

## 10. Publication Rollback Mechanism

In the event of an erroneous disclosure, embargo breach, or critical typo:

1. **No Destructive DB Mutating**: Historical database records are never hard-deleted.
2. **State Transition to Prior Snapshot**:
   - A rollback selects a previous immutable version $v_k$ ($k < n$).
   - The system creates a new version $v_{n+1}$ whose canonical content exactly matches $v_k$.
3. **Audit Event Emission**:
   - An audit record `ROLLBACK` is generated with `targetVersion: k`, `authorizingActor`, and `reason`.
4. **Immediate Edge Cache Purge**:
   - The publishing API issues a synchronous cache invalidation to CDN endpoints serving the affected advisory ID and the main advisory index.
5. **Emergency Retraction**:
   - If an advisory must be retracted entirely without a previous version, its state transitions to `WITHDRAWN`. The URL continues to resolve to an official retraction statement explaining the revocation, avoiding dead links or 404 confusion.

---

## 11. Deployment Architecture

Both planes are deployed independently to ensure that compromise of the public frontend never impacts publishing authority:

```
+-------------------------------------------------------------------------+
| PUBLIC CLOUD RUN / STATIC DELIVERY PLANE                                |
| - Service: ttcsirt-public-web                                           |
| - Service Account: sa-public-delivery@... (Read-only access to assets)  |
| - Environment Secrets: None (Zero publishing secrets, zero DB keys)     |
+-------------------------------------------------------------------------+

+-------------------------------------------------------------------------+
| INTERNAL CONTROL PLANE (Private VPC / Identity-Aware Proxy)             |
| - Service: ttcsirt-publishing-app & ttcsirt-publishing-api              |
| - Service Account: sa-publishing-control@... (Write access to DB & CDN) |
| - Security: Enforced via Cloud IAP / Enterprise IdP + OIDC              |
| - Environment Secrets: DB_URL, JWT_SIGNING_KEY, RESEND_API_KEY          |
+-------------------------------------------------------------------------+
```

---

## 12. Phased Implementation Roadmap

```
Phase 1: Canonical Schema & Contracts
  ├── Extract @ttcsirt/canonical-types (AdvisoryDocument, AST nodes, CVE types)
  ├── Extract pure AdvisoryContentRenderer to shared library
  └── Create comprehensive unit validation test suite

Phase 2: Publishing Backend & Persistence Model
  ├── Provision internal storage (PostgreSQL / Cloud SQL / Drizzle)
  ├── Implement version tree schema & audit ledger tables
  └── Implement draft CRUD and atomic release distributor

Phase 3: Authentication & Role-Based Access Control
  ├── Integrate Staff Identity Provider (OIDC / SSO / MFA)
  ├── Enforce server-side RBAC middleware (Author, Reviewer, Approver)
  └── Implement non-repudiation audit logging

Phase 4: Draft & Structured Editor Experience
  ├── Implement GOV.UK-compliant structured authoring UI
  ├── Form-based section and metadata builders (no unstructured HTML)
  └── Auto-save and draft conflict resolution

Phase 5: Validation & Isolated Preview Engine
  ├── Implement schema validator and link integrity scanner
  ├── Implement ephemeral signed preview tokens
  └── Integrate shared AdvisoryContentRenderer in preview container

Phase 6: Two-Person Review & Approval Workflow
  ├── Peer review feedback and revision tracking
  ├── Cryptographic release signing
  └── Multi-role transition enforcement

Phase 7: Public Delivery Integration
  ├── Update public website to consume canonical published JSON feeds
  ├── Implement high-speed edge caching and invalidation
  └── Connect site search engine to published feed

Phase 8: WordPress Decommissioning
  ├── One-time migration of historical advisory archive into canonical schema
  ├── Cut over domain traffic and retire legacy WordPress upstream adapter
```

---

## 13. Normative Implementation Contracts (Phase 1 Baseline)

The architecture is governed by three frozen Phase 1 implementation contracts:
1. **Canonical Schema, AST & Versioning**: [`docs/CANONICAL_ADVISORY_SCHEMA_CONTRACT.md`](./CANONICAL_ADVISORY_SCHEMA_CONTRACT.md)
   - Canonical `AdvisoryDocument` schema (independent of WordPress).
   - Structured content AST model (no arbitrary HTML).
   - Immutable `AdvisoryVersion` and append-only `AdvisoryAuditEvent`.
   - Public delivery contract (`PublishedAdvisoryDocument`) and repository layout.
   - Controlled media asset model and quarantine lifecycle.
   - `@ttcsirt/canonical-types` package scope.
2. **Editorial State Machine, RBAC & Publishing API**: [`docs/EDITORIAL_WORKFLOW_RBAC_API_CONTRACT.md`](./EDITORIAL_WORKFLOW_RBAC_API_CONTRACT.md)
   - 7-state lifecycle with server-side validation gate.
   - Dual-control / Two-person integrity rule (`authorId !== approverId`).
   - Server-side, deny-by-default RBAC matrix (Author, Reviewer, Approver, Admin).
   - Ephemeral signed preview contract and 100% visual parity.
   - 14 Publishing Control API endpoint specifications with status codes.
3. **Threat Model, Topology & Migration Mapping**: [`docs/PUBLISHING_SYSTEM_THREAT_MODEL_DEPLOYMENT.md`](./PUBLISHING_SYSTEM_THREAT_MODEL_DEPLOYMENT.md)
   - 13-point security threat matrix and technical controls.
   - Implementation-neutral deployment boundaries and trust topology.
   - Concrete file-by-file existing codebase migration classification.

---
*Signed off by TT-CSIRT System Architecture & Security Operations.*
