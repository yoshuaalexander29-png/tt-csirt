# Redesigning TT-CSIRT as a Responsive Government Digital Service

**Information architecture, content design and design-system implementation for Trinidad and Tobago’s national cyber incident response service**

---

## 1. Executive Summary & Narrative

I rebuilt the TT-CSIRT (Trinidad and Tobago Cyber Security Incident Response Team) homepage around government design-system mechanics rather than reproducing their visual appearance.

The challenge was not simply to make a national cyber-security website look more polished. The existing implementation combined GOV.UK-inspired visual components with legacy containers, custom CSS, and an inconsistent information architecture. I audited the codebase against GOV.UK Frontend standards, Home Office Design System patterns, and government publishing guidance. I then re-engineered the page around a coherent responsive grid system that preserved TT-CSIRT’s institutional identity, authoritative taxonomy, and active data pipelines.

---

## 2. Project Context

TT-CSIRT is Trinidad and Tobago’s national cyber security incident response team, operating under the Ministry of National Security. The portal serves as the primary public entry point for:

- **Emergency reporting**: Direct assistance pathways during active cyber attacks.
- **National advisories**: Timely vulnerabilities, alerts, and remediation guidance.
- **Audience guidance**: Tailored security measures for citizens, businesses, and public sector bodies.
- **National statistics**: Verifiable incident response figures across Trinidad and Tobago.
- **Capabilities & partnerships**: Statutory mandate, domestic cooperation, and international CSIRT alliances.

The previous codebase attempted to apply government styling through bespoke CSS layers overlaid on top of legacy container frameworks. This caused layout conflicts, broken heading trees, and duplicated markup across viewports. This project reconciled information architecture, plain-English content design, design-system mechanics, and production TypeScript/React code.

---

## 3. The Original Problem

A comprehensive code and UX audit revealed structural, architectural, editorial, and accessibility bottlenecks:

```
[ Legacy Application State ]
├── Competing Outer Containers (Global wrapper vs. local bespoke margins)
├── Redundant Content Blocks (Capability blurbs duplicated deep-tier service catalogs)
├── Broken Heading Outlines (Visual prominence used instead of semantic H1 → H2 → H3 hierarchy)
├── Dashboard-Style KPI Cards (Numbers styled with bespoke shadows, pills, and custom clamp() fonts)
├── Arbitrary Vertical Spacing (Hardcoded 70px–100px margins causing visual disassociation)
└── Fragmented Grid Columns (Three-column compression collapsing text at 768px–1024px)
```

### Key Audit Findings

| Dimension | Observed Issue in Legacy Code | Real-World Impact |
| :--- | :--- | :--- |
| **Structural** | Competing CSS container wrappers and conflicting flexbox percentages. | Horizontal overflow at intermediate widths; columns collapsing to 1–2 words per line. |
| **Information Architecture** | 5 redundant capability summaries duplicating the deeper service taxonomy. | Users faced repetitive reading without clear pathways to actionable service operations. |
| **Content Design** | "Overview and mandate" acted as the page H1 while describing only one section. | Misleading page outline; heading did not describe the total subject matter. |
| **Data Presentation** | Statistics rendered as SaaS-like KPI dashboard cards with floating borders. | Visual chrome obscured data context; statistical figures lacked semantic relationships. |
| **Accessibility** | Numbers marked as headings (`<h3>48</h3>`); bold tags used as pseudo-headings. | Screen reader navigation trees were fragmented; heading hierarchy failed logical traversal. |

---

## 4. My Role & Contributions

As the sole engineer and content designer on this re-engineering effort, my technical contributions spanned:

- **Research & Standards Auditing**: Mapped UI patterns to GOV.UK Frontend v6+, Home Office Design System, and Government Analysis Function guidance.
- **Information Architecture**: Restructured the 8-section homepage layout, pruned redundant capability listings, and elevated primary service pathways.
- **Content Design & Copywriting**: Rewrote introductory prose, audience pathways, and statistical findings in plain English (UK spelling) following GDS style rules.
- **Design System Engineering**: Replaced bespoke CSS with native GOV.UK layout primitives, standard type tokens, and responsive spacing units.
- **Production React/TypeScript Implementation**: Refactored component hierarchies in `App.tsx` and scoped CSS in `homepage.css` while preserving live advisory data fetching and routing.
- **Responsive & Accessibility Testing**: Validated reflow, keyboard focus, and reading order from 320px to 1440px viewports without viewport-dependent JS branching.

---

## 5. Research & Standards Matrix

Decisions were grounded in published standards, distinguishing strictly between **mandatory requirements**, **official recommendations**, and **project-specific structural decisions**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                STANDARDS & GOVERNANCE                                 │
├──────────────────────────────┬─────────────────────────────┬──────────────────────────┤
│ Documented Requirement       │ Documented Recommendation   │ Project Architecture     │
├──────────────────────────────┼─────────────────────────────┼──────────────────────────┤
│ • Single H1 per page         │ • Max ~75 characters / line │ • 4/12 Sticky Sub-nav +  │
│ • Unbroken heading tree      │ • 19px body font (v6+)      │   8/12 Main Content      │
│ • Tabular nums for comp data │ • Single lead paragraph     │ • Primary 48 finding on  │
│ • Standard GOV.UK grid       │ • Plain English / active    │   full width; 17 & 71 in │
│ • 4.5:1 text contrast        │ • Avoid decorative cards    │   50%/50% half-width     │
└──────────────────────────────┴─────────────────────────────┴──────────────────────────┘
```

- **GOV.UK Design System (v6+)**: Applied responsive grid classes (`govuk-grid-row`, `govuk-grid-column-*`), responsive spacing scale (tokens 1–9), and standard typography tokens (`govuk-heading-l`, `govuk-heading-m`, `govuk-heading-s`, `govuk-body`).
- **GOV.UK Publishing Guidelines**: Enforced sentence case, plain English, UK spelling (*unauthorised*, *organisations*, *cyber security* as two words), and clear link text.
- **Home Office Design System**: Implemented contextual navigation mechanics for the sticky sub-navigation rail with real-time IntersectionObserver tracking.
- **Government Analysis Function (ONS)**: Applied data presentation principles: numbers as data (not headings), direct pairing with plain findings, and tabular numerals (`govuk-!-font-tabular-numbers`).

---

## 6. Information Architecture Refactor

### Before vs. After Information Hierarchy

```
BEFORE (Fragmented & Redundant)            AFTER (Streamlined & Service-Led)
───────────────────────────────────        ───────────────────────────────────
[Page H1: Overview and mandate]             [Page H1: Cyber security in T&T]
  │                                          │
  ├─ Mandate text                            ├── Our role and mandate
  ├─ Immediate Support (Alert box)           ├── Need immediate support?
  ├─ Guidance by audience (Generic)          ├── Cyber security advisories
  ├─ Incident Statistics (Cards)             ├── Guidance by audience
  ├─ 5 Redundant Capability Blurbs           ├── Cyber security incidents in 2026
  ├─ Advisory feed (Mixed widths)            ├── Cyber security services
  ├─ Partner links                           ├── Working with partners
  └─ Footer metadata                         │   └── Partner agencies
                                             └── About TT-CSIRT and its work
```

### Architectural Decisions
1. **Elevating Page Identity**: Replaced the narrow "Overview and mandate" title with the comprehensive page-level title `Cyber security in Trinidad and Tobago`. "Our role and mandate" became an organic `H2` sub-section.
2. **Eliminating Capability Duplication**: The legacy site presented 5 bulky capability paragraphs that duplicated content found on dedicated service pages. These were replaced with two clean, top-level service entry routes:
   - *Incident response* (Reactive)
   - *Proactive risk and exposure management* (Preventive)

---

## 7. Content Design & Plain-English Transformations

| Component | Before (Legacy) | After (GDS Refactored) | Rationale & Standard |
| :--- | :--- | :--- | :--- |
| **Page Title** | `Overview and mandate` | `Cyber security in Trinidad and Tobago` | Establishes the true page scope. Avoids treating an introductory section as the entire page subject. |
| **Audience Guidance** | *“Get practical guidance to protect systems, services and information.”* | *“Find practical advice on common cyber security risks, from protecting personal information to securing critical services.”* | Provides actionable context for both individuals and infrastructure teams without forcing artificial "pick your persona" friction. |
| **Data Intro** | *“Recent cyber threat activity across Trinidad and Tobago.”* | *“TT-CSIRT uses incident reports to understand the threats affecting people and organisations across Trinidad and Tobago, strengthen its response and help others protect themselves.”* | Explains *why* the data is published rather than merely repeating the section title. Uses standard `govuk-body`. |
| **Phishing Finding** | *“These emails look real but are designed to steal credentials...”* | *“Phishing was the most frequently reported cyber threat in 2026. These emails can look genuine but are designed to steal credentials or gain unauthorised access to systems.”* | "Can look genuine" is clearer, more natural government terminology. Uses UK spelling (*unauthorised*). |

---

## 8. Design System Implementation

### Typography & Heading Scale

```html
<!-- Single Page-Level H1 -->
<h1 class="govuk-heading-l govuk-!-margin-top-0 govuk-!-margin-bottom-4">
  Cyber security in Trinidad and Tobago
</h1>

<!-- Single Page Lead Paragraph -->
<p class="govuk-body-l govuk-!-margin-bottom-4">
  TT-CSIRT is the national cyber security incident response team...
</p>

<!-- Major Section Heading -->
<h2 class="govuk-heading-m govuk-!-margin-top-0 govuk-!-margin-bottom-3" id="incidents-now-heading">
  Cyber security incidents in 2026
</h2>

<!-- Standard Section Copy -->
<p class="govuk-body govuk-!-margin-bottom-6">
  TT-CSIRT uses incident reports to understand the threats...
</p>
```

### Layout Primitives

The layout uses GOV.UK 2/3 and 1/3 structural columns. On desktop viewports (≥40.0625em / 640px):
- **Sticky Contextual Navigation**: Left column spans `4/12` (`govuk-grid-column-one-third`).
- **Main Section Flow**: Right content column spans `8/12` (`govuk-grid-column-two-thirds`).

---

## 9. Data Presentation Case Study

### The Problem: Dashboard Chrome
The legacy implementation displayed the 2026 incident data in three equal-width floating cards with borders, drop shadows, and arbitrary `clamp()` typography.

### The Solution: Information-Led Data Layout
Using Government Analysis Function principles, the data was re-architected to reflect factual priority:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 48                                                                     │
│ Phishing was the most frequently reported cyber threat in 2026.        │
│ These emails can look genuine but are designed to steal credentials... │
└────────────────────────────────────────────────────────────────────────┘
┌───────────────────────────────────┬────────────────────────────────────┐
│ 17                                │ 71                                 │
│ Sensitive information was exposed │ Most reports received in 2026      │
│ or accessed without permission... │ came from public sector orgs...    │
└───────────────────────────────────┴────────────────────────────────────┘
```

```html
<!-- Primary Finding: Full Width (Row 1) -->
<div class="govuk-grid-row govuk-!-margin-bottom-6">
  <div class="govuk-grid-column-full">
    <div class="incident-stat-block" style="max-width: 75ch;">
      <p class="incident-stat-number govuk-!-font-tabular-numbers govuk-!-margin-top-0 govuk-!-margin-bottom-2">
        48
      </p>
      <p class="govuk-body govuk-!-margin-bottom-2">
        Phishing was the most frequently reported cyber threat in 2026.
      </p>
      <p class="govuk-body govuk-!-margin-bottom-0">
        These emails can look genuine but are designed to steal credentials or gain unauthorised access to systems.
      </p>
    </div>
  </div>
</div>

<!-- Secondary Findings: 50% / 50% (Row 2) -->
<div class="govuk-grid-row govuk-!-margin-bottom-6">
  <div class="govuk-grid-column-one-half govuk-!-margin-bottom-4">
    <div class="incident-stat-block">
      <p class="incident-stat-number govuk-!-font-tabular-numbers govuk-!-margin-top-0 govuk-!-margin-bottom-2">
        17
      </p>
      <p class="govuk-body govuk-!-margin-bottom-2">
        Sensitive information was exposed or accessed without permission.
      </p>
      <p class="govuk-body govuk-!-margin-bottom-0">
        These incidents include lost, stolen or improperly accessed personal or business data.
      </p>
    </div>
  </div>
  <div class="govuk-grid-column-one-half govuk-!-margin-bottom-4">
    <div class="incident-stat-block">
      <p class="incident-stat-number govuk-!-font-tabular-numbers govuk-!-margin-top-0 govuk-!-margin-bottom-2">
        71
      </p>
      <p class="govuk-body govuk-!-margin-bottom-0">
        Most reports received in 2026 came from public sector organisations.
      </p>
    </div>
  </div>
</div>
```

---

## 10. Responsive Engineering & Breakpoints

The layout responds purely to viewport geometry via CSS media queries, without relying on client-side JS resize handlers:

```
VIEWPORT BREAKPOINT BEHAVIOURS
─────────────────────────────────────────────────────────────────────────────
• Mobile Portrait (<640px / <40.0625em)
  - Sticky navigation is unpinned and flows inline at the top of the page.
  - All columns collapse to 100% full width (`govuk-grid-column-full`).
  - Numbers render at 36px (2.25rem); body text maintains strict 19px readability.
  - Vertical reading order: Primary Finding (48) → Breach (17) → Total (71).

• Tablet & Desktop (≥640px / ≥40.0625em)
  - Layout splits into 4/12 sub-nav column and 8/12 main content stream.
  - Sub-navigation pins with active section highlighting on scroll.
  - Numbers scale up to 48px (3.0rem / govuk-heading-xl scale).
  - Row 1 spans 100% of the 8/12 container; Row 2 splits into two equal 50% columns.
```

---

## 11. Accessibility Verification

| Criterion | Implementation & Validation |
| :--- | :--- |
| **Heading Structure** | Strict single `H1` at root; all major section landmarks use `H2`; nested cards use `H3` or semantic paragraphs. Zero skipped heading levels. |
| **Screen Reader Reading Order** | Data values are coupled directly with narrative findings in semantic DOM order rather than relying on visual card boundaries. |
| **Keyboard Interaction** | All links and interactive anchors provide the standard GOV.UK 3px yellow outline with 3px black focus box (`govuk-link:focus`). |
| **Colour & Contrast** | Text achieves ≥7:1 contrast ratio against the light canvas (#0b0c0c on white; #505a5f on secondary metadata). |
| **No Viewport Branching** | Exact same DOM is delivered to mobile and desktop without hiding or duplicating nodes (`display: none` for content avoided). |

---

## 12. Iteration & Regression Analysis

During iterative development, three concrete regressions were detected, diagnosed, and resolved:

```
[ Regression 1: Intermediate Width Column Crushing ]
• Symptom: Between 768px and 900px, 3-column statistic cards narrowed to 120px wide, breaking words.
• Diagnosis: A custom flex percentage was overriding the parent GOV.UK grid column.
• Resolution: Replaced bespoke CSS with native `govuk-grid-column-full` and `govuk-grid-column-one-half`.

[ Regression 2: Arrow Glyphs on Text Links ]
• Symptom: The link "View all cyber security advisories →" appended a decorative unicode arrow.
• Diagnosis: Violated standard GDS link conventions where descriptive link text alone indicates navigation.
• Resolution: Removed the arrow while maintaining standard GOV.UK bold link styling.

[ Regression 3: Redundant Lead Paragraphs ]
• Symptom: Multiple sections applied `govuk-body-l` (24px) to section subheadings.
• Diagnosis: Broke the typographic hierarchy by creating competing lead paragraphs.
• Resolution: Restricted `govuk-body-l` exclusively to the top page summary; all section copy converted to `govuk-body`.
```

---

## 13. Maintainability & System Architecture

```
LEGACY SYSTEM (Brittle & Bespoke)           REFACTORED SYSTEM (Scalable & Standardised)
┌───────────────────────────────┐           ┌─────────────────────────────────────────┐
│ Custom .css per page / card   │           │ GOV.UK Frontend Core Utility Tokens     │
│ Arbitrary clamp() font sizes  │    ──►    │ Strict GDS Responsive Spacing Scale     │
│ Bespoke flexbox layouts       │           │ Standard govuk-grid-* primitives        │
│ Multi-nested div card wrapper │           │ Scoped TT-CSIRT domain components       │
└───────────────────────────────┘           └─────────────────────────────────────────┘
```

By decoupling bespoke styling and rooting the application in GOV.UK layout primitives:
1. **Zero Layout Thrashing**: Removed `window.innerWidth` JS listeners; the browser handles reflow natively.
2. **Component Reusability**: Service pages (`/services/*`) and Advisory detail pages (`/advisories/*`) now share the identical grid and typographic hierarchy.
3. **Auditability**: Government editors can introduce new content without breaking responsive geometry or accessibility outlines.

---

## 14. Key Takeaways & Future Roadmap

### Technical Lessons
- **Design Systems are Mechanical, Not Cosmetic**: Applying government styling is not a matter of copying colors and fonts; it requires respecting document geometry, content density, and semantic hierarchy.
- **Content Hierarchy Trumps Visual Decoration**: Replacing dashboard cards with an asymmetric grid (full-width featured finding + 50/50 secondary findings) communicated data significance more effectively than decorative UI chrome.

### Next Steps
1. **Extend System to Service Detail Pages**: Migrate deeper incident response catalog pages to use the standardized 4/12 + 8/12 grid.
2. **Establish GDS Advisory Schema**: Formalize the advisory detail templates to adhere to GOV.UK news and communication document types.
3. **Continuous Automated Accessibility Testing**: Integrate automated Axe-core checks into CI pipelines to monitor future editorial updates.
