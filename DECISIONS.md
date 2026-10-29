# TT-CSIRT Architectural & Design Decision Ledger

This ledger records the deliberate architectural, design-system, and user experience decisions established for the TT-CSIRT portal. Future agents must not casually reverse these decisions.

---

## Decision Status Legend
- **Confirmed**: Explicitly established, implemented in production code, and validated against standards.
- **Assumption / Planned**: Tentative architectural consensus intended for future implementation phases.

---

## 1. Mechanical GOV.UK Frontend v6+ Adoption Over Cosmetic Theming
- **Status**: Confirmed
- **Context**: The portal was previously a hybrid of legacy containers, bespoke CSS, and superficial GOV.UK colors. This produced broken heading trees, layout collapsing between 768px and 1024px, and poor accessibility.
- **Decision**: Adopt the underlying layout mechanics, semantic typography, and spacing tokens of GOV.UK Frontend v6+ (`govuk-frontend`). The portal must adhere to government digital standards rather than simply "looking like" a government site.
- **Consequences for Future Agents**: Do NOT introduce bespoke card components, custom flex containers, or CSS-in-JS libraries. Always use official GOV.UK primitives (`govuk-grid-row`, `govuk-grid-column-*`, `govuk-heading-*`, `govuk-body`).

---

## 2. Institutional Masthead vs. Semantic Page Heading
- **Status**: Confirmed
- **Context**: Public sector portals often confuse institutional branding with the page subject, placing "MINISTRY OF..." or "TT-CSIRT" in the primary `<h1>`, which breaks accessibility outlines.
- **Decision**: `"TRINIDAD AND TOBAGO / CYBER SECURITY / INCIDENT / RESPONSE TEAM"` functions strictly as the institutional masthead/identity block. The page proposition (e.g. `"Securing Trinidad and Tobago’s digital future."`) is the sole semantic `<h1>` of the page.
- **Consequences for Future Agents**: Never tag the TT-CSIRT masthead or header title as an `<h1>`. Every view must have exactly one semantic `<h1>` that describes the page's specific proposition.

---

## 3. Two-Column Asymmetric Grid (29% / 71%) with Full-Bleed Sticky Nav
- **Status**: Confirmed
- **Context**: Navigating dense technical guidance, advisories, and emergency response pathways requires persistent navigation without forcing users to scroll back to the top.
- **Decision**: Implement a two-column desktop split layout (≥640px):
  - Left column (`29%`): Sticky table-of-contents navigation with real-time `IntersectionObserver` active tracking and a continuous `#eef5fb` surface extending to the left edge of the viewport.
  - Right column (`71%`): Main content area with a crisp white canvas and a `1px solid #b1b4b6` left divider.
  - Breakpoint (<640px): Unpins and collapses into natural vertical document flow.
- **Consequences for Future Agents**: Do NOT replace the sticky TOC with a top dropdown or collapsible accordion on desktop. Do NOT alter the flex percentage without running Puppeteer layout audits.

---

## 4. Information-Led Incident Data Presentation Over Dashboard Cards
- **Status**: Confirmed
- **Context**: Incident numbers were previously displayed in floating SaaS KPI cards with borders, drop-shadows, and `clamp()` fonts, obscuring the narrative significance of the data.
- **Decision**: Align with the UK Government Analysis Function:
  - Present figures as data, not headings.
  - Couple numbers directly with explanatory plain-English narratives in semantic DOM order.
  - Format metrics with tabular numerals (`govuk-!-font-tabular-numbers`).
  - Use an asymmetric layout: Row 1 full-width for the primary finding (48 Phishing incidents); Row 2 50/50 for secondary metrics (17 Data breaches, 71 Total reports).
  - Eliminate floating shadows, glowing cards, and dashboard chrome.
- **Consequences for Future Agents**: Do NOT revert statistics to floating KPI boxes or cards-within-cards. Data must remain narrative-led and integrated into the document flow.

---

## 5. Semantic Hyperlink and Reference Integrity (No Artificial Bulleting)
- **Status**: Confirmed
- **Context**: Upstream WordPress advisory content often contains consecutive links or references. Automated parsers frequently convert consecutive links into bulleted lists or prepend decorative arrows, which distorts the original meaning.
- **Decision**: Preserve the semantic structure of the source:
  - Genuine source lists (`<ul>`, `<ol>`) render as semantic bulleted lists.
  - Standalone links and linked sentences render as normal paragraphs with descriptive link text.
  - Do NOT add bullets solely to separate links visually.
  - Do NOT prepend decorative characters or unicode arrows (e.g. `→`) to hyperlinks.
- **Consequences for Future Agents**: When parsing content or authoring markdown, never wrap consecutive links in a `<ul>` unless they represent an intentional list.

---

## 6. Strict GDS 5px-Modulo Spacing and Sentence Case Typography
- **Status**: Confirmed
- **Context**: Inconsistent spacing (13px, 17px, 33px) and title-cased headings created visual clutter and disrupted vertical baseline alignment.
- **Decision**:
  - All spacing, margins, padding, and line-heights must strictly map to the official GDS 5px-modulo scale (5, 10, 15, 20, 25, 30, 40, 50, 60px).
  - All headings, table headers, buttons, badges, and navigation items must use sentence case, capitalizing only the first word and proper nouns.
- **Consequences for Future Agents**: Never introduce arbitrary pixel values for margins or paddings. Never use all-caps or title case for headings.

---

## 7. Client-Side History Routing with Dual Caching Fallback
- **Status**: Confirmed
- **Context**: The application operates in sandboxed cloud preview containers where multi-page server routes can cause full-page reloads and state resets.
- **Decision**: Use client-side history routing (`pushState` + `popstate`) in `App.tsx` combined with local storage caching in `advisoryCache.ts` and fallback mock seeds. This guarantees instantaneous view switching and reliable offline rendering.
- **Consequences for Future Agents**: Do NOT install heavy external routing libraries (e.g. React Router) that disrupt the existing history stack. Preserve the `advisoryCache.ts` fallback layer.

---

## 8. Deep Service Catalogue Expansion Architecture
- **Status**: Confirmed
- **Context**: The homepage previously only listed high-level service summaries ("Incident response", "Proactive risk management").
- **Decision**: Implemented dedicated statutory service routes (`/services`, `/services/incident-response`, `/services/proactive-risk-management`) adhering strictly to the 29% / 71% two-column split layout, providing structured triage guidance, emergency hotline numbers, verified response tiers (Consultative, Incident Handling, Incident Management), vulnerability assessment workflows, and capacity-building frameworks.
- **Consequences for Future Agents**: Maintain layout parity when expanding further service pages.

---

## 9. Comprehensive Central Routing Model and Route-Derived Breadcrumbs
- **Status**: Confirmed
- **Context**: As the portal expanded from a single homepage with advisories to a multi-section national portal, hardcoded path checks in components risked inconsistent titles, broken navigation states, and missing breadcrumbs.
- **Decision**: Centralized routing in `src/routing/routes.ts` as the single source of truth for path resolution (`resolveRoute`), document titles (`getDocumentTitle`), active navigation IDs (`getActiveNavId`), and hierarchical breadcrumbs (`getBreadcrumbTrail`). The route-derived `Breadcrumbs` component automatically computes the full path hierarchy without requiring manual breadcrumb declarations per page.
- **Consequences for Future Agents**: Always define new routes in `src/routing/routes.ts` before creating page components. Do not hardcode ad-hoc breadcrumb arrays in page templates.

---

## 10. Publication Taxonomy Classification Invariant
- **Status**: Confirmed
- **Context**: Upstream WordPress REST API returns heterogeneous posts. Naive consumption would incorrectly classify standard news or event announcements as technical vulnerability advisories.
- **Decision**: Created `src/services/publicationTaxonomy.ts` to strictly classify posts based on official category IDs, category slugs, and the presence of technical CVE/CVSS metadata. Only genuine vulnerability disclosures enter the advisory pipeline.
- **Consequences for Future Agents**: Never classify a post as an advisory simply because it appears in a general `/wp/v2/posts` query. Always validate against the taxonomy model.

---

## 11. Unified Site Search with Instant CVE Recognition and In-Memory Caching
- **Status**: Confirmed
- **Context**: Users require instant lookup for CVE identifiers (e.g. `CVE-2024-38077`) as well as general site content across guidance, services, and strategic documentation.
- **Decision**: Implemented `src/services/siteSearch.ts` which combines:
  - Regex-based CVE pattern recognition with an aggressive relevance score boost (+100).
  - In-memory synchronous inspection of cached advisory payloads (`getSynchronousMemoryListEntry`) for instant response times.
  - Curated static knowledge indexing of statutory services, ransomware playbooks, training programs, and national policies.
  - Full-text faceted result filtering on the dedicated `/search` route.
- **Consequences for Future Agents**: When adding new static pages or statutory services, register them in `STATIC_SEARCH_DOCUMENTS` in `siteSearch.ts` to ensure site-wide discoverability.

