# TT-CSIRT Portal Architecture

This document details the architectural layout, data flow, component hierarchies, routing models, publication taxonomy, and technical constraints of the TT-CSIRT (Trinidad and Tobago Cyber Security Incident Response Team) portal.

---

## 1. Routes and Views

The portal utilizes a centralized client-side history routing model (`src/routing/routes.ts` & `src/App.tsx`) supporting standard, bookmarkable URL paths with complete responsive reflow:

| Route Path | View / Component | Purpose | Layout Structure |
| :--- | :--- | :--- | :--- |
| `/` | `App.tsx` (Homepage Sections) | National focal point overview, emergency reporting, latest advisories, audience guidance, national incident statistics, core statutory services. | Two-column 29% / 71% split view with sticky Table of Contents sub-nav. |
| `/services` | `ServicesHubPage.tsx` | Overview of statutory cyber security services (reactive incident handling and proactive risk management) with eligibility matrix and service level targets. | Two-column 29% / 71% split view with persistent sidebar TOC. |
| `/services/incident-response` | `IncidentResponsePage.tsx` | National incident response service guide, triage SLAs, 24/7 emergency hotlines, encrypted communications, and structured triage classification. | Two-column 29% / 71% split view with step-by-step guidance. |
| `/services/proactive-risk-management` | `ProactiveRiskManagementPage.tsx` | Vulnerability assessment, threat intelligence briefings, attack surface monitoring, and capacity-building programmes for ministries and critical infrastructure. | Two-column 29% / 71% split view with service matrix. |
| `/advisories` | `AdvisoriesPage.tsx` | Searchable, filterable repository of national cyber security advisories with CVE search, severity filters, WordPress taxonomy mapping, and pagination. | Two-column 29% / 71% split view with filter sidebar. |
| `/advisories/:slug` | `AdvisoryDetailPage.tsx` | Technical advisory detail view with CVE/CVSS metadata summary, affected software versions, remediation instructions, and printable GDS layout. | Full-width single-column document layout with breadcrumbs. |
| `/guidance` | `GuidanceHubPage.tsx` | National knowledge base and procedural guidance categorized by audience (citizens, SMEs, public sector, critical national infrastructure). | Two-column 29% / 71% split view with audience filtering. |
| `/guidance/ransomware-response-guide` | `RansomwareGuidePage.tsx` | Procedural step-by-step guide for organizations experiencing active ransomware outbreaks, containment playbooks, and evidence preservation checklists. | Two-column 29% / 71% split view with phase-based TOC. |
| `/news-events` | `NewsEventsPage.tsx` | Official press releases, security notices, international cyber summit alerts, and capacity building updates. | Two-column 29% / 71% split view with type filtering. |
| `/training` | `TrainingPage.tsx` | National cyber capacity building programmes, technical incident handling workshops, and certifications for public sector IT officers. | Two-column 29% / 71% split view with course catalogue. |
| `/statistics` | `StatisticsPage.tsx` | National cyber security statistics monitor with incident trend breakdowns, sector distributions, and accessible data tables. | Two-column 29% / 71% split view with statistical navigation. |
| `/about` | `AboutPage.tsx` | National mandate, institutional governance within the Ministry of Homeland Security, CSIRT-Americas partnerships, and operational frameworks. | Two-column 29% / 71% split view with institutional summary. |
| `/about/national-cyber-security-strategy` | `NationalStrategyPage.tsx` | Trinidad and Tobago National Cyber Security Strategy documentation, strategic pillars, and multi-year implementation roadmaps. | Two-column 29% / 71% split view with pillar-by-pillar breakdown. |
| `/contact` | `ContactPage.tsx` | Official contact directories, 24/7 emergency incident hotlines, PGP encryption fingerprints, and media inquiry channels. | Two-column 29% / 71% split view with verified contact cards. |
| `/search` | `SearchPage.tsx` | Unified site-wide search combining live WordPress advisory archives, CVE regex matching, and curated static guides. | Two-column 29% / 71% split view with faceted type filtering. |

---

## 2. Component Hierarchy

```
App.tsx (Root Layout & State Router)
├── SkipLink (.govuk-skip-link)
├── TtcsirtHeader
│   ├── Government Identity & Masthead (Coat of Arms + TT-CSIRT Title)
│   ├── TtcsirtNavigation (TT-CSIRT expandable mega-menu with route-aware links)
│   └── SiteSearchForm (Global search bar routing to /search?q=)
├── BreadcrumbBar (.app-breadcrumb-bar with pale blue-grey background #eef5fb)
│   └── Breadcrumbs (Dynamic route-derived breadcrumb trail)
├── MainWrapper (.govuk-main-wrapper)
│   ├── [Route: /] (Homepage with PageNavigation + Sections)
│   ├── [Route: /services] (ServicesHubPage)
│   ├── [Route: /services/incident-response] (IncidentResponsePage)
│   ├── [Route: /services/proactive-risk-management] (ProactiveRiskManagementPage)
│   ├── [Route: /advisories] (AdvisoriesPage)
│   ├── [Route: /advisories/:slug] (AdvisoryDetailPage)
│   ├── [Route: /guidance] (GuidanceHubPage)
│   ├── [Route: /guidance/ransomware-response-guide] (RansomwareGuidePage)
│   ├── [Route: /news-events] (NewsEventsPage)
│   ├── [Route: /training] (TrainingPage)
│   ├── [Route: /statistics] (StatisticsPage)
│   ├── [Route: /about] (AboutPage)
│   ├── [Route: /about/national-cyber-security-strategy] (NationalStrategyPage)
│   ├── [Route: /contact] (ContactPage)
│   └── [Route: /search] (SearchPage)
└── Footer (GOV.UK directory footer with Coat of Arms, statutory details, contacts, and internal navigation)
```

---

## 3. Publication Taxonomy & Classification Architecture

To ensure strict factual integrity with upstream TT-CSIRT WordPress systems (`https://ttcsirt.gov.tt/wp-json/wp/v2/`), the portal implements an explicit publication taxonomy (`src/services/publicationTaxonomy.ts`):

1. **WordPress Category Mapping**:
   - `Advisory` (Category ID `6`): Technical vulnerability advisories with CVE identifiers and mitigation guidance.
   - `Alert` (Category ID `7`): High-severity immediate threats requiring urgent defensive intervention.
   - `Guidance` (Category ID `8`): Practical hardening advice and security guidelines.
   - `News` (Category ID `9`): Organizational announcements and press releases.
   - `Event` (Category ID `10`): Workshops, cyber summits, and national conferences.
2. **Discriminator Invariant**: Generic WordPress posts (`/wp/v2/posts`) are **never** classified as advisories by default. Posts must possess the appropriate category ID, category slug, or explicit vulnerability metadata (CVE, CVSS score) to enter the technical advisory index.

---

## 4. Unified Site Search Architecture (`src/services/siteSearch.ts`)

The search service provides high-performance, client-side indexing across heterogeneous data sources:
- **Instant CVE Recognition**: Uses regex (`CVE-\d{4}-\d{4,}`) to prioritize exact vulnerability matches with a relevance score boost (+100).
- **Synchronous In-Memory Cache Lookup**: Inspects cached WordPress advisory payloads (`getSynchronousMemoryListEntry`) to provide instant sub-millisecond results without network round-trips.
- **Static Knowledge Grounding**: Indexes curated statutory services, incident response procedures, ransomware guidance, national strategy pillars, and training programs.
- **Faceted Categorization**: Users can filter search results by *All*, *Advisories*, *Guidance*, *Services*, *News*, and *Policy*.

---

## 5. Navigation & Layout Invariants

- **Two-Column 29% / 71% Split Geometry**: All informational pages, hubs, and guides adhere to the standard two-column layout. The left column (`29%`) contains sticky in-page navigation or filtering, while the right column (`71%`) holds primary content.
- **Surface Continuity**: The left navigation tint (`#eef5fb`) extends seamlessly to the viewport edge via `.app-page-nav::before`.
- **Accessible Focus Indicators**: All interactive controls, links, and search inputs implement the authentic GOV.UK yellow focus ring (`#ffdd00`) with a dark border.
- **Single `h1` Constraint**: Every route establishes exactly one semantic `<h1>` representing the page proposition; institutional lockups are never tagged as `<h1>`.
- **Sentence Case Typography**: Headings, navigation items, buttons, and table headers use sentence case rather than title case or all-caps.
- **Semantic Reference Integrity**: Consecutive links are rendered as natural paragraphs rather than artificial bulleted lists.

---

## 6. Runtime and Build Environment

- **Node.js Environment**: Runs as an ES Module (`"type": "module"` in `package.json`).
- **Production Build**: `npm run build` compiles static assets to `dist/` using Vite.
- **Type Safety**: `npm run lint` executes `tsc --noEmit` to enforce strict TypeScript validation.
- **Container Port**: Configured strictly to Port 3000 as required by hosting infrastructure.

---

## 7. Advisory Publishing System & Control Plane Architecture

The portal operates with an isolated internal publishing control plane and a public delivery plane. See `/docs/ADVISORY_PUBLISHING_SYSTEM_ARCHITECTURE.md` for the complete architecture specification, canonical data contracts, RBAC state machine, and two-person integrity publishing lifecycle.
