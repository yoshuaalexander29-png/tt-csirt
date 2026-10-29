# TT-CSIRT Threat Model, Deployment Boundaries & Code Migration Map
## Phase 1 Implementation Specification: Security Analysis, Physical Topology & Migration Classifications

**Document Reference**: `TTCSIRT-SPEC-PUB-003`  
**Status**: Frozen Architectural Contract (Phase 1 Baseline)  
**Security Classification**: Official / Architectural Standard  
**Target Domain**: Trinidad and Tobago Cyber Security Incident Response Team (TT-CSIRT)  
**Publication Date**: 22 September 2026  

---

## 1. Threat Model & Security Controls

The TT-CSIRT Advisory Publishing System produces national-level cyber threat warnings. A compromise could cause public panic, disclose embargoed zero-days, or disrupt national critical infrastructure. The following threat analysis evaluates 13 key risks and maps them to concrete controls realizable with existing web application and cloud service architectures.

### 1.1 Threat Matrix & Control Mapping

| # | Threat Scenario | Threat Actor & Attack Vector | Impact Level | Intended Technical Control |
| :---: | :--- | :--- | :---: | :--- |
| **1** | **Compromised Public Frontend** | Adversary compromises public web server via dependency flaw or XSS. | **High** | **Strict Plane Separation & Read-Only Exposure**: The public frontend possesses zero staff credentials, zero publishing API tokens, and zero database connection strings. Compromise of the public frontend grants read-only access to already public assets. |
| **2** | **Stolen Staff Session** | Adversary steals staff session token via phishing, workstation malware, or traffic sniffing. | **High** | **Short-Lived Tokens & Device Binding**: Staff sessions require multi-factor authentication (MFA). Bearer JWTs have 15-minute expiry, IP binding verification, and mandatory re-authentication for destructive actions (e.g. publication, rollback). |
| **3** | **Privilege Escalation** | An `AUTHOR` attempts to invoke approval or publishing endpoints directly. | **High** | **Server-Side Deny-by-Default RBAC**: Every endpoint enforces role validation in server middleware prior to handler dispatch. Role claims in tokens are validated against current user status in the database. |
| **4** | **Unauthorized Publication** | Rogue analyst or compromised single account attempts to publish a fake or unreviewed advisory. | **Critical** | **Two-Person Rule Invariant**: Database transaction constraints verify that `approverId !== authorId`. A single staff credential cannot draft and release an advisory. |
| **5** | **Draft / Zero-Day Leakage** | Confidential draft containing active zero-day vulnerability details is exposed to unauthorized users. | **Critical** | **Storage & Access Isolation**: Drafts are stored in private internal database tables never synced to the public edge. Draft retrieval strictly validates analyst identity and role. |
| **6** | **Preview URL Leakage** | Preview link is shared, forwarded, or intercepted by third parties. | **Medium** | **Ephemeral HMAC Tokens**: Preview tokens expire in 15 minutes, are bound to specific version digests, and reject expired requests with generic `404 Not Found` to prevent discovery. Header `X-Robots-Tag: noindex` prevents crawler ingestion. |
| **7** | **Malicious Advisory Content (XSS/Defacement)** | Author injects malicious `<script>`, `<iframe>`, or `onload` handlers into advisory narrative. | **High** | **Strict AST Validation & No Raw HTML**: Content must conform strictly to typed AST nodes. Raw HTML strings are rejected with `422 Unprocessable Entity`. Pure React rendering treats text as text nodes. |
| **8** | **Malicious SVG / Media Exploitation** | Adversary uploads weaponized SVG with embedded scripts or XXE entity expansion. | **High** | **Server-Side Media Quarantine & XML DOM Sanitization**: Uploads are restricted to approved MIME types validated via magic numbers. SVGs are parsed server-side to strip scripts and external entities before promotion. |
| **9** | **Audit Log Tampering** | Malicious insider attempts to alter or erase audit records to conceal unauthorized actions. | **Critical** | **Append-Only Database Schema**: Audit log tables allow `INSERT` permissions only; database user credentials for the application layer have `UPDATE` and `DELETE` revoked at the database grant level. |
| **10** | **Replay / Duplicate Publication** | Network latency or race condition triggers duplicate publication of an advisory version. | **Medium** | **Idempotency Keys & Monotonic Version Locks**: Publishing endpoint requires unique idempotency token and enforces optimistic concurrency locks on advisory version counter. |
| **11** | **Rollback Abuse** | Malformed rollback call reverts a critical advisory to an unpatched or obsolete vulnerability guidance. | **High** | **Admin-Only Rollback & Two-Person Verification**: Rollbacks are restricted to `ADMINISTRATOR` roles and generate a distinct public version banner indicating the rollback rationale. |
| **12** | **Compromised Publishing API** | Attacker breaches the internal publishing API service. | **Critical** | **Internal VPC & Network Ingress Control**: The publishing API is bound to private network interfaces behind an Identity-Aware Proxy (IAP) or VPN, not reachable from the public Internet. |
| **13** | **Compromised Storage / CDN Poisoning** | Adversary attempts direct write access to the published JSON repository. | **Critical** | **One-Way Asymmetric Storage IAM**: Public delivery plane has read-only IAM privileges. Write/delete permissions are granted exclusively to the publishing distribution worker service account. |

---

## 2. Implementation-Neutral Deployment Boundaries

The architecture guarantees physical and logical isolation between the control plane (where advisories are written and approved) and the delivery plane (where the public consumes them).

### 2.1 Topology & Trust Boundary Diagram

```
══════════════════════════════════════════════════════════════════════════════════════════════════════
                                    INTERNET (PUBLIC ACCESS)
══════════════════════════════════════════════════════════════════════════════════════════════════════
                                               │
                                               │ HTTPS (Port 443)
                                               ▼
                              ┌─────────────────────────────────┐
                              │         PUBLIC WEBSITE          │
                              │       (TT-CSIRT Web App)        │
                              │  - Read-only static delivery    │
                              │  - Pure client-side search      │
                              │  - Zero staff login / Zero auth │
                              │  - Zero database credentials    │
                              └────────────────┬────────────────┘
                                               │
                                               │ HTTP GET (Public JSON Feeds)
                                               │ Read-Only Access
                                               ▼
                              ┌─────────────────────────────────┐
                              │      PUBLISHED REPOSITORY       │
                              │   - Static Published JSON       │
                              │   - Versioned Bulletins (/v1/)  │
                              │   - Edge CDN Cached             │
                              │   - Public Media (/assets/)     │
                              └────────────────▲────────────────┘
                                               │
═══════════════════════════════════════════════╪══════════════════════════════════════════════════════
           TRUST BOUNDARY (No Inbound Internet Access to Internal Control Plane)
═══════════════════════════════════════════════╪══════════════════════════════════════════════════════
                                               │
                                               │ One-Way Release Sync
                                               │ (Write Only via Service Account)
                                               │
                              ┌────────────────┴────────────────┐
                              │         PUBLISHING API          │
                              │  - RBAC & Two-Person Enforcer   │
                              │  - Validation Gate Engine       │
                              │  - Ephemeral Preview Generator  │
                              │  - State Machine Transition Mgr │
                              └───────▲─────────────────▲───────┘
                                      │                 │
                   Private VPC / mTLS │                 │ OAuth 2.0 / OIDC
                                      │                 ▼
       ┌──────────────────────────────┴───┐    ┌──────────────────┐
       │      PUBLISHING APPLICATION      │    │ IDENTITY PROVIDER│
       │       (Staff Control Panel)      │    │ - Staff Accounts │
       │  - Structured Form Authoring UI  │    │ - MFA Tokens     │
       │  - Review & Approval Dashboard   │    │ - Role Claims    │
       │  - Preview Container with Banner │    └──────────────────┘
       └──────────────────────────────────┘
              │                    │
              ▼                    ▼
       ┌──────────────┐     ┌──────────────┐
       │ DRAFT/AUDIT  │     │    MEDIA     │
       │    STORE     │     │  QUARANTINE  │
       │  (Postgres)  │     │   STORAGE    │
       └──────────────┘     └──────────────┘
```

### 2.2 Network Exposure & Component Authority Matrix

| Component Name | Network Exposure | Read Access | Write Access | Trust Classification |
| :--- | :--- | :--- | :--- | :--- |
| **PUBLIC WEBSITE** | Public Internet (0.0.0.0/0) | Published Repository, Local Browser Storage | None (Stateless Delivery) | Low Trust / Internet Facing |
| **PUBLISHED REPOSITORY** | Public CDN Edge Cache | Public Web, External Citizens, RSS Readers | Publishing API Service Account ONLY | High Integrity Public Data |
| **PUBLISHING API** | Internal Corporate VPC / IAP | Draft Store, Audit Store, Quarantine Storage | Draft Store, Audit Store, Published Repository | High Security Control Plane |
| **PUBLISHING APPLICATION** | Internal Corporate VPC / IAP | Publishing API via Bearer Tokens | Publishing API via Bearer Tokens | Authenticated Staff Workstations |
| **IDENTITY PROVIDER** | Enterprise SSO / OIDC | Authenticated Staff Directory | Directory Administrators | High Security Auth Authority |
| **DRAFT / AUDIT STORE** | Private Subnet (No Internet) | Publishing API ONLY | Publishing API ONLY (Audit is Append-Only) | Critical Confidential Store |
| **MEDIA STORAGE** | Private (Quarantine) / Public (Assets) | Publishing API | Publishing API (Promotes on Publication) | High Security Asset Store |

---

## 3. Existing-Code Mapping & Migration Strategy

To transition from the current monolithic delivery application (which fetches and normalizes legacy WordPress HTML in the browser) to the two-plane architecture, each relevant file in the existing codebase is classified below.

### 3.1 Component Classification Matrix

| Current Repository Path | Primary Responsibility | Target Destination | Migration Action & Justification |
| :--- | :--- | :--- | :--- |
| `src/services/publicationTaxonomy.ts` | Canonical taxonomy classifications, entity cleaning, category types | **MOVE TO SHARED CONTRACT** (`@ttcsirt/canonical-types`) | Keep taxonomy definitions identical across publishing control plane and public site. |
| `src/services/advisoryDocument.ts` (AST Types & Node Model) | `CanonicalNode`, `CanonicalSection`, `CanonicalAdvisoryDocument` interfaces | **MOVE TO SHARED CONTRACT** (`@ttcsirt/canonical-types`) | Extract pure AST definitions. Remove `raw-html` node type and replace with typed inline AST. |
| `src/services/advisoryDocument.ts` (HTML Normalizer & Regex) | Elementor unrollers, legacy `<br>` cleaners, table fixers | **MOVE TO MIGRATION / LEGACY ADAPTER** | Isolate to one-time historical WordPress migration tool. Public site will no longer parse raw HTML. |
| `src/services/advisoryTableNormalizer.ts` | Normalizes legacy Elementor and WordPress nested HTML layout tables | **MOVE TO MIGRATION / LEGACY ADAPTER** | Ingestion-only utility. Published advisories store native `TableNode` structures. |
| `src/services/advisoryCache.ts` | Multi-tier browser storage cache (memory, IndexedDB, localStorage) | **KEEP IN PUBLIC APP** | Retain on the public delivery plane to provide offline-first resilience for citizens during outages. |
| `src/services/advisories.ts` | Browser fetcher consuming WordPress REST endpoints | **REPLACE** | Replace with `src/services/canonicalAdvisories.ts` consuming `/advisories/v1/index.json` and `/by-slug/{slug}.json`. |
| `src/services/upstream/wordpress/*` | WordPress categories, endpoints, pagination headers, and client | **RETIRE** (post-migration) | Decommission once historical corpus migration into canonical database is completed. |
| `src/components/AdvisoryContentRenderer.tsx` | Pure React component rendering `CanonicalNode` AST into GOV.UK HTML | **KEEP IN PUBLIC APP & MOVE TO SHARED COMPONENT** | Reused identically in public detail page and staff preview container to ensure 100% visual fidelity. |
| `src/services/search/*` & `src/services/siteSearch.ts` | Tokenization, alias expansion, exact/fuzzy search engine | **KEEP IN PUBLIC APP** | Maintain in public app; update advisory corpus hydrator to ingest `PublishedAdvisoryDocument` JSON directly. |
| `src/pages/AdvisoryDetailPage.tsx` | Public advisory view with breadcrumbs, GDS summary list, navigation | **KEEP IN PUBLIC APP** | Update data contract to accept `PublishedAdvisoryDocument`; remove legacy HTML fallback rendering. |
| `src/pages/AdvisoriesPage.tsx` | Public advisory catalog, search filters, pagination | **KEEP IN PUBLIC APP** | Update data loader to consume `/advisories/v1/index.json`; retain GDS pagination and filter UX. |

---

## 4. Architectural Boundaries Checklist (Pre-Implementation Freeze)

* [x] **No Arbitrary HTML Invariant**: Canonical content model is completely structured. No `raw-html` AST nodes.
* [x] **Zero Control-Plane Exposure**: Public website code contains no admin routes, no staff login buttons, and no secret keys.
* [x] **Two-Person Rule Enforced**: Dual-control rule codified in API validation rules (`approverId !== authorId`).
* [x] **Validation as a Gate**: Validations occur during state transitions; no unnecessary persistent `VALIDATING` state in database.
* [x] **Immutable Releases**: Historical versions are permanent; corrections branch as $v_{n+1}$.
* [x] **Quarantined Asset Pipeline**: Media uploads verified for MIME type and sanitized server-side; `/wp-content/uploads/` eliminated.
* [x] **Zero Breaking Changes to Public Website**: The current site continues operating normally with existing ingestion until Phase 7 cutover.

---
*Contract End - Frozen for Phase 1 Architecture Baseline.*
