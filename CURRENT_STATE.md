# TT-CSIRT Portal Current State

*Last updated: September 2026*

This document provides a concise snapshot of the portal's active routes, implementation completeness, technical debt, and architectural integrity.

---

## 1. Major Routes & Implementation Status

| Route | Component | Status | Description & Capabilities |
| :--- | :--- | :--- | :--- |
| `/` | `App.tsx` | Production Ready | Full responsive homepage with sticky 29%/71% TOC sub-nav, emergency hotlines, mandate, advisory feed, audience guidance, 2026 incident data (48/17/71 layout), core services, and GDS directory footer. |
| `/services` | `ServicesHubPage.tsx` | Production Ready | Comprehensive overview of TT-CSIRT statutory services, triage response procedures, proactive risk management, eligibility criteria, and operational targets. |
| `/services/incident-response` | `IncidentResponsePage.tsx` | Production Ready | Dedicated national incident response guide, emergency hotlines, encrypted reporting guidelines, verified response levels (Consultative, Incident Handling, Incident Management), and evidence preservation advice. |
| `/services/proactive-risk-management` | `ProactiveRiskManagementPage.tsx` | Production Ready | Vulnerability assessment request procedures, national threat intelligence alerts, attack surface monitoring, and capacity building programs. |
| `/advisories` | `AdvisoriesPage.tsx` | Production Ready | Advisory repository with live search, severity dropdown, category filter, CVE tag extraction, date sorting, and pagination (10 items/page). |
| `/advisories/:slug` | `AdvisoryDetailPage.tsx` | Production Ready | Technical advisory reader with GDS summary list (CVE, CVSS, Severity, Date, Vendor), sanitized body content (`AdvisoryContentRenderer`), print stylesheet, and PDF export. |
| `/guidance` | `GuidanceHubPage.tsx` | Production Ready | National cyber security knowledge base categorized for citizens, businesses, public sector, and critical national infrastructure. |
| `/guidance/ransomware-response-guide` | `RansomwareGuidePage.tsx` | Production Ready | Step-by-step procedural guide for organizations responding to active ransomware infections, containment strategies, and recovery checklists. |
| `/news-events` | `NewsEventsPage.tsx` | Production Ready | Press releases, official security notices, and national cyber symposium announcements with category filtering. |
| `/training` | `TrainingPage.tsx` | Production Ready | National cyber capacity building programmes, technical incident handling workshops, and certifications for public sector IT officers. |
| `/statistics` | `StatisticsPage.tsx` | Production Ready | Comprehensive 2026 incident analytics view featuring incident type distributions, sector reporting breakdowns, and accessible GDS data tables. |
| `/about` | `AboutPage.tsx` | Production Ready | Institutional governance, statutory mandate within the Ministry of Homeland Security, international CSIRT-Americas partnerships, and RFC 2350 disclosure. |
| `/about/national-cyber-security-strategy` | `NationalStrategyPage.tsx` | Production Ready | National Cyber Security Strategy documentation, strategic pillars, and governance structures for Trinidad and Tobago. |
| `/contact` | `ContactPage.tsx` | Production Ready | Verified contact directories, emergency incident hotlines, physical office locations, and PGP encryption keys. |
| `/search` | `SearchPage.tsx` | Production Ready | Unified site-wide search with real-time CVE regex matching, synchronous cached advisory querying, and curated static knowledge grounding. |

---

## 2. Navigation and Taxonomy Features Implemented

1. **TT-CSIRT Mega-navigation (`TtcsirtNavigation.tsx`)**:
   - Route-aware destinations grouped under Services, Guidance, News & events, and Statistics.
   - Expandable menu with a keyboard-operable toggle and responsive layout.
2. **Contextual Breadcrumb Trail (`Breadcrumbs.tsx`)**:
   - Route-derived breadcrumbs reflecting institutional hierarchy (`Ministry of Homeland Security > TT-CSIRT > [Section] > [Page]`).
   - Reusable across all dynamic and static pages with active page `aria-current="page"`.
3. **Publication Taxonomy Model (`publicationTaxonomy.ts`)**:
   - Strict classification separating technical Advisories/Alerts from generic News, Events, and Guidance.
   - Prevents unverified posts from polluting the technical vulnerability index.
4. **Unified Site Search (`siteSearch.ts` & `SearchPage.tsx`)**:
   - Instant search with CVE regex boosting (+100 relevance score).
   - In-memory synchronous advisory lookup for immediate rendering.
   - Faceted result filtering by content type.
5. **Cyber Security Incident Taxonomy & Controlled Statistics Mapping**:
   - Authoritative single source of truth for the 11-category national "Cyber Security Incident Taxonomy" (`src/services/taxonomy/cyberSecurityIncidentTaxonomy.ts`).
   - Controlled mapping layer (`src/services/statistics/taxonomyMapping.ts`) linking annual operational statistics types to official taxonomy categories with typed relationships (`primary`, `secondary`, `subsumed`, `contributing`) and technical justifications.
   - 10-invariant automated validation pipeline (`src/services/statistics/validation.ts`) enforcing zero-variance mathematical reconciliation across all reporting periods (485 total: 319 Public, 166 Private; 2026 partial period designation).
   - Safe analytical selectors (`src/services/statistics/taxonomySelectors.ts`) automating discoverability and guidance linkage without automating policy.
   - Accessible disclosure table in `StatisticsPage.tsx` with explicit operational governance notes, GDS semantic table pattern (`scope="col"`, `scope="row"`), restrained secondary typographic metadata for relationship labels (avoiding tag badges), and keyboard-accessible horizontal reflow for mobile devices.
6. **Locally Hosted National Cyber Security Strategy Document**:
   - Authoritative policy document (`public/documents/national-cyber-security-strategy-2012.pdf`) hosted directly via Vite's public assets directory without runtime external dependencies.
   - Updated document link on `/about/national-cyber-security-strategy` using standard native browser viewing pattern (`target="_blank"`, `rel="noopener noreferrer"`) with accessible link text identifying document and PDF file format.
   - Preserved byte-for-byte fidelity with zero invented metadata. Production build and dev server verified.

---

## 3. Known Technical Debt & Maintenance Notes

- **Monolithic Stylesheet (`src/styles/homepage.css`)**:
   - Contains layout definitions and service navigation styling. Stable, passing all GDS audits.
- **Root Audit Scripts**:
   - Root-level `.cjs` and `.sh` audit scripts remain available for testing historical typography and layout compliance.

---

## 4. Architectural Invariants Protected

1. **29% / 71% Layout Geometry**: Desktop split layout preserved across all major hubs and documents with `#eef5fb` surface continuity.
2. **Single `h1` Per Page**: Strict adherence across all 15 routes; institutional lockup is never tagged as `<h1>`.
3. **Sentence Case Typography**: Maintained across all headings, navigation items, buttons, and badges.
4. **Reference Integrity**: Consecutive hyperlinks preserved as standard paragraphs rather than artificial bulleted lists.
5. **Port 3000 Binding**: Container environment configurations untouched.
