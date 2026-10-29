# TT-CSIRT Editorial Workflow, RBAC Matrix & Publishing API Contract
## Phase 1 Implementation Specification: Governance, Two-Person Integrity, Preview & API Specifications

**Document Reference**: `TTCSIRT-SPEC-PUB-002`  
**Status**: Frozen Architectural Contract (Phase 1 Baseline)  
**Security Classification**: Official / Architectural Standard  
**Target Domain**: Trinidad and Tobago Cyber Security Incident Response Team (TT-CSIRT)  
**Publication Date**: 22 September 2026  

---

## 1. Editorial Lifecycle State Machine

The TT-CSIRT publishing control plane enforces an authoritative state machine to manage the lifecycle of national technical advisories and urgent alerts.

### 1.1 Lifecycle State Model

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

### 1.2 State Definitions

| State Name | Definition & Security Invariant |
| :--- | :--- |
| `DRAFT` | Mutable working copy owned by the author. Not accessible to public or search indexing. |
| `READY_FOR_REVIEW` | Content frozen by author and submitted for peer review. Server-side validation has passed. |
| `CHANGES_REQUESTED` | Reviewer or approver has returned the advisory with structured technical feedback. |
| `APPROVED` | Peer review has confirmed technical accuracy and formatting. Ready for release authorization. |
| `PUBLISHED` | Active, immutable version released to the public delivery plane and national distribution channels. |
| `SUPERSEDED` | Replaced by a newer authoritative advisory. Preserved with a public notice pointing to the successor. |
| `WITHDRAWN` | Formally retracted due to invalidation. Resolves to a public retraction notice explaining reasons. |

> **Architectural Decision**: *Validation as a Gate, Not a State.*  
> In accordance with GDS and secure systems engineering, validation is treated as a **server-side gate process** executed during transitions, rather than a persistent database state (`VALIDATING`). Submitting a draft runs validation synchronously: if validation fails, the document remains in `DRAFT` (or transitions to `CHANGES_REQUESTED`) with validation errors returned; if validation passes, it transitions directly to `READY_FOR_REVIEW`.

---

## 2. Legal and Illegal Transitions

### 2.1 Complete Legal State Transition Table

| From State | To State | Initiator Role | Auth Assurance | Two-Person Rule | Emitted Audit Event | Reversible? | Notes & Enforcement |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| *None* | `DRAFT` | `AUTHOR`, `ADMIN` | MFA Session | No | `DRAFT_CREATED` | Yes (Delete) | Initializes blank document with new UUID. |
| `DRAFT` | `DRAFT` | `AUTHOR`, `ADMIN` | MFA Session | No | `DRAFT_MUTATED` | Yes | Saves intermediate author edits. |
| `DRAFT` | `READY_FOR_REVIEW` | `AUTHOR`, `ADMIN` | MFA Session | No | `SUBMITTED_FOR_REVIEW`| Yes | **Gate**: Server-side validation must pass 100%. |
| `READY_FOR_REVIEW`| `CHANGES_REQUESTED`| `REVIEWER`, `ADMIN`| MFA Session | No | `CHANGES_REQUESTED` | Yes | Mandatory structured reviewer notes required. |
| `CHANGES_REQUESTED`| `DRAFT` | `AUTHOR`, `ADMIN` | MFA Session | No | `RETURNED_TO_DRAFT` | Yes | Unfreezes draft for editorial modifications. |
| `READY_FOR_REVIEW`| `APPROVED` | `REVIEWER`, `ADMIN`| MFA Session | **Yes**: Actor $\ne$ Author | `APPROVED` | Yes | Verifies technical accuracy and CVE data. |
| `APPROVED` | `CHANGES_REQUESTED`| `APPROVER`, `ADMIN`| MFA Session | No | `CHANGES_REQUESTED` | Yes | Approver identifies issue prior to publication. |
| `APPROVED` | `PUBLISHED` | `APPROVER`, `ADMIN`| MFA Session | **Yes**: Actor $\ne$ Author | `PUBLISHED` | **No** (Creates $v_{n+1}$) | Generates immutable `AdvisoryVersion`, writes to public CDN. |
| `PUBLISHED` | `DRAFT (v+1)` | `AUTHOR`, `ADMIN` | MFA Session | No | `CORRECTION_DRAFTED`| Yes | Branches new draft version; $v_n$ stays live. |
| `PUBLISHED` | `SUPERSEDED` | `APPROVER`, `ADMIN`| MFA Session | No | `SUPERSEDED` | No | Requires valid successor bulletin reference. |
| `PUBLISHED` | `WITHDRAWN` | `APPROVER`, `ADMIN`| MFA Session | No | `WITHDRAWN` | No | Requires formal retraction statement. |
| *Any Published* | `PUBLISHED (v+1)`| `APPROVER`, `ADMIN`| MFA Session | **Yes**: Actor $\ne$ Author | `ROLLBACK_EXECUTED` | No | Re-publishes historical snapshot $v_k$ as new version. |

### 2.2 Prohibited (Illegal) Transitions
The API layer explicitly rejects the following invalid transitions with `409 Conflict` or `403 Forbidden`:
1. `DRAFT` $\rightarrow$ `APPROVED`: Bypasses mandatory peer review.
2. `DRAFT` $\rightarrow$ `PUBLISHED`: Bypasses review and release authorization gates.
3. `CHANGES_REQUESTED` $\rightarrow$ `APPROVED`: Cannot approve without author addressing feedback and re-submitting.
4. `CHANGES_REQUESTED` $\rightarrow$ `PUBLISHED`: Direct publication of unaddressed feedback is strictly denied.
5. `WITHDRAWN` $\rightarrow$ `DRAFT` or `PUBLISHED`: Retracted bulletins cannot be un-retracted; an entirely new bulletin must be authored.
6. `SUPERSEDED` $\rightarrow$ `PUBLISHED`: Predecessor cannot overwrite its successor.
7. **Self-Approval**: An `AUTHOR` cannot approve their own submission (`authorId === approverId`).
8. **Direct Mutation of Published Version**: Calling `PUT /api/publishing/advisories/{id}` on a document in `PUBLISHED`, `SUPERSEDED`, or `WITHDRAWN` state is strictly rejected.

---

## 3. Two-Person Integrity (Dual-Control Enforcement)

To protect the national cyber authority against insider threat, account compromise, or catastrophic accidental disclosure:

### 3.1 Dual-Control Invariants
1. **Author vs Approver Separation**:
   $$\text{actor.userId} \ne \text{document.editorial.authorId}$$
   The API gateway enforces this rule at the database transaction level when transitioning `APPROVED` $\rightarrow$ `PUBLISHED`.
2. **Reviewer vs Author Integrity**:
   By organizational baseline, peer review should be conducted by an independent analyst (`actor.userId !== document.editorial.authorId`).
3. **Emergency Override Protocol**:
   In declared national cyber emergency conditions, an `ADMINISTRATOR` may authorize publication only if an explicit secondary digital token is supplied from the National CSIRT Director, which is permanently logged in the audit ledger with reason code `EMERGENCY_DIRECTOR_OVERRIDE`.

---

## 4. Role-Based Access Control (RBAC) Matrix

Authorization is enforced server-side on every request. Client-side navigation or UI hides are purely cosmetic and do not represent access control.

### 4.1 System Roles
* **AUTHOR**: Technical Analyst who conducts vulnerability investigations and drafts advisories.
* **REVIEWER**: Senior Analyst who peer reviews drafts for technical rigor, CVSS accuracy, and mitigations.
* **APPROVER**: Threat Intelligence Lead or Operations Manager authorized to release public bulletins.
* **ADMINISTRATOR**: Systems Administrator responsible for user management, emergency rollbacks, and audit ledger monitoring.

### 4.2 Comprehensive Permissions Matrix

| Functional Operation | AUTHOR | REVIEWER | APPROVER | ADMINISTRATOR | Server-Side Rule |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Create New Draft** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | Assigns `authorId = caller.userId`. |
| **Edit Own Draft** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | Allowed only if document status is `DRAFT`. |
| **Edit Other's Draft** | DENY | DENY | DENY | **ALLOW** | Prevents concurrent editing conflicts. |
| **Trigger Validation Gate** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | Synchronous execution; read-only on document. |
| **Submit Draft for Review** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | Permitted only if validation passes 100%. |
| **Request Changes** | DENY | **ALLOW** | **ALLOW** | **ALLOW** | Requires structured feedback payload. |
| **Approve Document** | DENY | **ALLOW** | **ALLOW** | **ALLOW** | Enforces `caller.userId !== authorId`. |
| **Publish Document** | DENY | DENY | **ALLOW** | **ALLOW** | Enforces `caller.userId !== authorId`. |
| **Draft Correction ($v+1$)** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | Clones published version into mutable draft. |
| **Supersede Advisory** | DENY | DENY | **ALLOW** | **ALLOW** | Validates successor reference exists. |
| **Withdraw Advisory** | DENY | DENY | **ALLOW** | **ALLOW** | Requires public justification text. |
| **Execute Rollback** | DENY | DENY | DENY | **ALLOW** | Restricted to authorized emergency administrator. |
| **Generate Preview Token** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | Issues ephemeral HMAC signed token. |
| **View Audit History** | DENY | **ALLOW** | **ALLOW** | **ALLOW** | Read-only ledger query. |
| **Upload / Manage Media** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | Uploads route to quarantine pipeline. |
| **Manage User Accounts / Roles**| DENY | DENY | DENY | **ALLOW** | Full IdP / user administration. |

---

## 5. Preview Safety & Execution Contract

Analysts and reviewers require visual verification using the authentic GOV.UK rendering components before authorizing release, without leaking unembargoed vulnerabilities to the public.

### 5.1 Preview Architecture & Constraints
1. **Isolated Endpoint**: Preview content is delivered via `GET /api/publishing/advisories/{id}/preview` on the internal publishing plane.
2. **Ephemeral HMAC Token**:
   - Preview URLs require a cryptographically signed query token:
     $$\text{Token} = \text{HMAC-SHA256}(K_{\text{preview}}, \text{advisoryId} \parallel \text{version} \parallel \text{expiresAt})$$
   - Token validity is strictly capped at **15 minutes**.
   - Invalid, forged, or expired tokens return an immediate generic `404 Not Found`.
3. **Public Search & Crawler Exclusion**:
   - Preview responses include mandatory headers:
     ```http
     X-Robots-Tag: noindex, nofollow, noarchive, nosnippet
     Cache-Control: no-store, no-cache, must-revalidate, private
     ```
   - Preview documents are hard-excluded from `siteSearch.ts`, sitemap generators, RSS feeds, and browser persistence caches.
4. **Visual Watermark Invariant**:
   - The preview interface embeds a prominent full-width GOV.UK alert banner:  
     `OFFICIAL USE ONLY – UNAPPROVED DRAFT PREVIEW – NOT FOR PUBLIC RELEASE`
   - Reuses the shared `AdvisoryContentRenderer.tsx` component to guarantee 100% visual parity with public output.

---

## 6. Publishing API Boundary Specifications

All endpoints are hosted on the private internal publishing control plane (`/api/publishing/*`). All requests require an authenticated staff session bearer token.

### 6.1 Endpoint Contract Catalog

#### 1. Create Draft
* **Method & Path**: `POST /api/publishing/advisories`
* **Permitted Roles**: `AUTHOR`, `REVIEWER`, `APPROVER`, `ADMINISTRATOR`
* **Request Payload**:
  ```json
  {
    "classification": "advisory",
    "title": "Critical vulnerability in Cisco IOS XE Software Web UI",
    "severity": "critical",
    "tlp": "TLP:CLEAR",
    "leadParagraph": "A critical vulnerability has been disclosed affecting Cisco IOS XE..."
  }
  ```
* **Response Payload** (`201 Created`): Complete initialized `AdvisoryDocument` with generated `id` (UUIDv4) and reference number.
* **Audit Event**: `DRAFT_CREATED`
* **Error Responses**: `400 Bad Request` (invalid title syntax), `401 Unauthorized`.

#### 2. Update Draft
* **Method & Path**: `PUT /api/publishing/advisories/{id}`
* **Permitted Roles**: `AUTHOR`, `REVIEWER`, `APPROVER`, `ADMINISTRATOR`
* **Pre-condition**: Document must be in `DRAFT` or `CHANGES_REQUESTED` state.
* **Request Payload**: Partial or full `AdvisoryDocument` updates.
* **Response Payload** (`200 OK`): Updated `AdvisoryDocument`.
* **Audit Event**: `DRAFT_MUTATED`
* **Error Responses**: `409 Conflict` (document locked or in review), `422 Unprocessable Entity` (malformed AST).

#### 3. Retrieve Draft
* **Method & Path**: `GET /api/publishing/advisories/{id}`
* **Permitted Roles**: `AUTHOR`, `REVIEWER`, `APPROVER`, `ADMINISTRATOR`
* **Response Payload** (`200 OK`): Complete `AdvisoryDocument`.
* **Error Responses**: `404 Not Found`.

#### 4. Trigger Validation Gate
* **Method & Path**: `POST /api/publishing/advisories/{id}/validate`
* **Permitted Roles**: `AUTHOR`, `REVIEWER`, `APPROVER`, `ADMINISTRATOR`
* **Request Payload**: None (or optional dry-run payload).
* **Response Payload** (`200 OK`):
  ```json
  {
    "isValid": true,
    "errors": [],
    "warnings": [
      { "field": "references[0].url", "message": "Reference link uses HTTP instead of HTTPS" }
    ],
    "validatedAt": "2026-09-22T14:30:00Z"
  }
  ```
* **Audit Event**: `VALIDATION_PASSED` or `VALIDATION_FAILED`
* **Error Responses**: `422 Unprocessable Entity` (returns detailed validation error list).

#### 5. Submit for Review
* **Method & Path**: `POST /api/publishing/advisories/{id}/submit-review`
* **Permitted Roles**: `AUTHOR`, `ADMINISTRATOR`
* **Pre-condition**: Document in `DRAFT` state; server-side validation gate passes 100%.
* **Request Payload**:
  ```json
  { "submissionNotes": "Initial complete draft with verified CVE-2026-9999 CVSS score." }
  ```
* **Response Payload** (`200 OK`): `AdvisoryDocument` with status updated to `READY_FOR_REVIEW`.
* **Audit Event**: `SUBMITTED_FOR_REVIEW`
* **Error Responses**: `422 Unprocessable Entity` (validation errors exist), `409 Conflict`.

#### 6. Request Changes
* **Method & Path**: `POST /api/publishing/advisories/{id}/request-changes`
* **Permitted Roles**: `REVIEWER`, `APPROVER`, `ADMINISTRATOR`
* **Pre-condition**: Document in `READY_FOR_REVIEW` or `APPROVED` state.
* **Request Payload**:
  ```json
  {
    "feedbackNotes": "Please verify fixed firmware version for hardware models A100 and B200.",
    "affectedSections": ["remediation"]
  }
  ```
* **Response Payload** (`200 OK`): `AdvisoryDocument` with status updated to `CHANGES_REQUESTED`.
* **Audit Event**: `CHANGES_REQUESTED`
* **Error Responses**: `400 Bad Request` (missing mandatory feedback notes).

#### 7. Approve Advisory
* **Method & Path**: `POST /api/publishing/advisories/{id}/approve`
* **Permitted Roles**: `REVIEWER`, `APPROVER`, `ADMINISTRATOR`
* **Pre-condition**: Document in `READY_FOR_REVIEW` state; `actor.userId !== document.editorial.authorId`.
* **Request Payload**:
  ```json
  { "approvalNotes": "Technical review completed. Indicators of compromise verified." }
  ```
* **Response Payload** (`200 OK`): `AdvisoryDocument` with status updated to `APPROVED`.
* **Audit Event**: `APPROVED`
* **Error Responses**: `403 Forbidden` (self-approval prohibited by two-person rule).

#### 8. Publish Advisory
* **Method & Path**: `POST /api/publishing/advisories/{id}/publish`
* **Permitted Roles**: `APPROVER`, `ADMINISTRATOR`
* **Pre-condition**: Document in `APPROVED` state; `actor.userId !== document.editorial.authorId`.
* **Request Payload**:
  ```json
  {
    "releaseNotes": "Initial public disclosure.",
    "purgeCdnImmediate": true
  }
  ```
* **Response Payload** (`200 OK`):
  ```json
  {
    "success": true,
    "referenceNumber": "TT-CSIRT-ADV-2026-042",
    "version": 1,
    "publishedAt": "2026-09-22T15:00:00Z",
    "publicUrl": "https://ttcsirt.gov.tt/advisories/critical-vulnerability-cisco-ios-xe",
    "contentDigest": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  }
  ```
* **Audit Event**: `PUBLISHED`
* **System Action**: Freezes immutable `AdvisoryVersion`, writes canonical JSON to static repository, promotes media from quarantine, purges public index cache.
* **Error Responses**: `403 Forbidden` (two-person violation), `409 Conflict`.

#### 9. Generate Preview Token
* **Method & Path**: `POST /api/publishing/advisories/{id}/preview-token`
* **Permitted Roles**: `AUTHOR`, `REVIEWER`, `APPROVER`, `ADMINISTRATOR`
* **Request Payload**: `{ "ttlSeconds": 900 }`
* **Response Payload** (`200 OK`):
  ```json
  {
    "previewToken": "5d41402abc4b2a76b9719d911017c592...",
    "expiresAt": "2026-09-22T15:15:00Z",
    "previewUrl": "/preview/advisories/cisco-ios-xe?token=5d41402abc4b2a76b9719d911017c592"
  }
  ```

#### 10. Retrieve Preview Document
* **Method & Path**: `GET /api/publishing/advisories/{id}/preview?token={token}`
* **Permitted Access**: Authenticated staff OR bearer of valid signed token.
* **Response Payload** (`200 OK`): Render-ready document payload with draft watermark flags.
* **Error Responses**: `404 Not Found` (token expired, forged, or draft non-existent).

#### 11. Retrieve Audit Trail
* **Method & Path**: `GET /api/publishing/advisories/{id}/audit-trail`
* **Permitted Roles**: `REVIEWER`, `APPROVER`, `ADMINISTRATOR`
* **Response Payload** (`200 OK`): Chronological array of immutable `AdvisoryAuditEvent` objects.

#### 12. Supersede Advisory
* **Method & Path**: `POST /api/publishing/advisories/{id}/supersede`
* **Permitted Roles**: `APPROVER`, `ADMINISTRATOR`
* **Pre-condition**: Document must be currently `PUBLISHED`.
* **Request Payload**:
  ```json
  {
    "successorReferenceNumber": "TT-CSIRT-ADV-2026-088",
    "reason": "Comprehensive patch released superseding interim mitigation guidance."
  }
  ```
* **Response Payload** (`200 OK`): Updated status with supersession link established.
* **Audit Event**: `SUPERSEDED`

#### 13. Withdraw Advisory
* **Method & Path**: `POST /api/publishing/advisories/{id}/withdraw`
* **Permitted Roles**: `APPROVER`, `ADMINISTRATOR`
* **Pre-condition**: Document must be currently `PUBLISHED`.
* **Request Payload**:
  ```json
  {
    "withdrawalReason": "Vendor confirmed threat intelligence report was false positive."
  }
  ```
* **Response Payload** (`200 OK`): Updated status with public withdrawal notice injected.
* **Audit Event**: `WITHDRAWN`

#### 14. Execute Emergency Rollback
* **Method & Path**: `POST /api/publishing/advisories/{id}/rollback`
* **Permitted Roles**: `ADMINISTRATOR`
* **Request Payload**:
  ```json
  {
    "targetVersionNumber": 1,
    "rollbackReason": "Erroneous embargoed details published in version 2."
  }
  ```
* **Response Payload** (`200 OK`): Version $v_1$ content published as new version $v_3$.
* **Audit Event**: `ROLLBACK_EXECUTED`
* **Error Responses**: `403 Forbidden`, `404 Not Found` (target version does not exist).

---
*Contract End - Frozen for Phase 1 Architecture Baseline.*
