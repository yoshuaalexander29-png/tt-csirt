# TT-CSIRT GOV.UK System Guidelines & Rules

Official Design System and Content Standards for the Trinidad and Tobago Cyber Security Incident Response Team (TT-CSIRT) Portal.
Based on the UK Government Digital Service (GDS) / GOV.UK Frontend v6+ standards, Home Office Design System patterns, and Government Analysis Function guidance.

---

## 1. Core Architectural Principles & Institutional Identity

### 1.1 Resolving Competing Typographic Authorities
A critical source of visual dissonance in public sector portals occurs when institutional branding competes with page-level semantic headings. In this system:
- **Service Identity / Masthead**: `"TRINIDAD AND TOBAGO / CYBER SECURITY / INCIDENT / RESPONSE TEAM"` operates strictly as the institutional masthead/branding block. It is not an `h1` and must never compete with page headings.
- **Page Proposition (Semantic `h1`)**: The primary purpose of the view (e.g. `"Securing Trinidad and Tobago’s digital future."` on the homepage, or `"Cyber security advisories"` on `/advisories`) is the sole semantic `h1` of the page. Only one `h1` is permitted per page.
- **Major Section Headings (`h2`)**: Major page sections (e.g. `"What TT-CSIRT does"`, `"Cyber security advisories"`, `"Cyber security incidents in 2026"`, `"Cyber security services"`) are semantic `h2` elements.
- **Audience & Subsection Headings (`h3`)**: Sub-cards, audience guidance modules, and footer column titles use semantic `h3` elements.
- **Section Captions (`caption-l` / `caption-m`)**: Contextual kickers (e.g. `"National authority"`, `"Cyber security updates"`, `"Incident response & defence"`) sit directly above headings to provide scope without competing for typographic authority.

### 1.2 Editorial Tone & Content Standards
- **National Authority Voice**: Authoritative, calm, objective, plain English. Avoid marketing hype, promotional verbs ("supercharge", "empower"), or sensationalist cybersecurity jargon.
- **UK Government Spelling**: Adhere strictly to British English spelling conventions across all copy (*unauthorised*, *organisations*, *programmes*, *prioritise*, *defence*, *centre*).
- **Domain Terminology**: Use `"cyber security"` as two distinct words, following GOV.UK and TT-CSIRT standard practice.
- **Sentence Case Rule**: All text across page titles, headings, table headers, buttons, navigation links, and badges must be formatted in sentence case. Only capitalise the first word and proper nouns (e.g. *TT-CSIRT*, *Trinidad and Tobago*, *FortiGate*, *PAN-OS*, *CVE-2026-XXXX*).
  - *Correct*: `"What’s happening now"`, `"Report a cyber incident"`, `"Cyber security advisories"`
  - *Incorrect*: `"What’s Happening Now"`, `"REPORT A CYBER INCIDENT"`, `"Latest Advisories"`

---

## 2. Typography & Type Scale

### 2.1 Primary Typeface & Font Stack
- **Primary Typeface**: `"GDS Transport", Arial, sans-serif`
- **Weights**: Regular (`400`) and Bold (`700`). Medium is not part of the standard GDS Transport specification; bold (`700`) is used for strong emphasis and headings.
- **Font Assets**: Authentic local woff/woff2 font files located in `/src/assets/fonts/` (`light-*` and `bold-*`).

### 2.2 GOV.UK Frontend v6+ Type Scale
All line-heights are mathematically locked to multiples of 5px (20px, 25px, 30px, 35px, 40px, 50px) to preserve a strict vertical baseline grid. Breakpoint for responsive scaling is 640px (`40.0625em`).

| GDS Role | Semantic Tag / Class | Large Screen (≥640px) | Small Screen (<640px) | Context of Use |
| :--- | :--- | :--- | :--- | :--- |
| `heading-xl` | `h1` / `.govuk-heading-xl` | 48px / 50px line-height | 32px / 35px line-height | Reserved for dedicated long-form guides and major stat callouts |
| `heading-l` | `h1` or `h2` / `.govuk-heading-l` | 36px / 40px line-height | 27px / 30px line-height | Primary page proposition (`h1`) & major page section headings (`h2`) |
| `heading-m` | `h2` or `h3` / `.govuk-heading-m` | 24px / 30px line-height | 21px / 25px line-height | Audience need cards, subsection cards, secondary section headings |
| `heading-s` | `h3` or `h4` / `.govuk-heading-s` | 19px / 25px line-height | 19px / 25px line-height | Subsections, key insight headers, table headers, footer groups |
| `caption-xl` | `span` / `.govuk-caption-xl` | 27px / 30px line-height | 18px / 25px line-height | Context preceding `heading-xl` |
| `caption-l` | `span` / `.govuk-caption-l` | 24px / 30px line-height | 18px / 25px line-height | Context preceding `heading-l` (e.g. `"Cyber incidents in 2026"`) |
| `caption-m` | `span` / `.govuk-caption-m` | 19px / 25px line-height | 16px / 20px line-height | Context preceding `heading-m` |
| `body-l` | `p` / `.govuk-body-l` | 24px / 30px line-height | 21px / 25px line-height | Restricted to the single introductory lead paragraph of a page |
| `body` | `p` / `.govuk-body` | 19px / 25px line-height | 19px / 25px line-height | Standard explanatory paragraphs, card body text, descriptions |
| `body-s` | `p` / `.govuk-body-s` | 16px / 20px line-height | 16px / 20px line-height | Dates, advisory descriptions, sub-metadata, table data |

### 2.3 Typographic Rules & Constraints
- **Single Lead Paragraph**: Only one `govuk-body-l` paragraph is permitted per view. Section descriptions must use standard `govuk-body` (19px) to prevent competing lead paragraphs.
- **Line Length Constrained**: Body text lines must be constrained to 65–75 characters (`max-width: 75ch` or standard 2/3 grid column) to maintain readability.
- **Tabular Numerals**: When displaying statistics, counts, CVE numbers, or comparative tabular figures, use `.govuk-!-font-tabular-numbers` for vertical alignment.

---

## 3. Spacing System (5px-Modulo Scale)

All margins, paddings, gaps, and section dividers must strictly map to the official GDS spacing scale. Never eyeball or introduce arbitrary spacing values (e.g. 17px, 23px, 33px, 44px).

| GDS Step | Mobile (<640px) | Desktop (≥640px) | GDS Utility Classes | Use Case |
| :--- | :--- | :--- | :--- | :--- |
| **Step 1** | 5px | 5px | `.govuk-!-margin-bottom-1` | Fine element spacing, caption bottom margins, icon offsets |
| **Step 2** | 10px | 10px | `.govuk-!-margin-bottom-2` | Small gaps, tag inner padding, stat number margin |
| **Step 3** | 15px | 15px | `.govuk-!-margin-bottom-3` | Standard mobile bottom margins, list items, card inner spacing |
| **Step 4** | 15px | 20px | `.govuk-!-margin-bottom-4` | Card inner padding, component group separations |
| **Step 5** | 20px | 25px | `.govuk-!-margin-bottom-5` | Subsection margins, form group spacing |
| **Step 6** | 20px | 30px | `.govuk-!-margin-bottom-6` | Major heading bottom margins, standard block separation |
| **Step 7** | 30px | 40px | `.govuk-!-margin-bottom-7` | Section gutters, panel separation, horizontal rule breaks |
| **Step 8** | 40px | 50px | `.govuk-!-margin-bottom-8` | Large section block rhythm |
| **Step 9** | 50px | 60px | `.govuk-!-margin-bottom-9` | Major page container separation, footer top padding |

---

## 4. Layout, Container & Grid Behavior

### 4.1 Page Width Container
- Standard container: `.govuk-width-container` (fixed maximum content width of `1020px`).
- Centered horizontally with responsive gutters: 15px mobile, 30px desktop.

### 4.2 Two-Column Split Architecture
The core portal layout implements a 29% / 71% asymmetric structural grid on desktop viewports (≥640px):
- **Left Column (`.app-page-nav` / `.app-page-support`)**:
  - Desktop width: `29%` (`flex: 0 0 29%`).
  - Background: Continuous pale blue-grey (`#eef5fb`).
  - Full-Bleed Alignment: Uses a pseudo-element (`::before`) extending `100vw` to the left edge of the viewport, ensuring an unbroken tinted navigation surface regardless of screen width.
  - Sticky Behavior: Contains `.app-page-nav__container` which pins `30px` from the top on desktop for in-page table of contents navigation.
- **Right Column (`.app-page-content`)**:
  - Desktop width: `71%` (`flex: 0 0 71%`).
  - Background: Crisp white (`#ffffff`).
  - Border: Separated from the left nav by a `1px solid #b1b4b6` vertical divider and top border extending to the right screen edge.
  - Padding: `35px` top, `60px` bottom, `30px` left, `15px` right.

### 4.3 Breadcrumb Bar
- Sits immediately beneath the service navigation header as a full-width strip (`.app-breadcrumb-bar`).
- Background: `#eef5fb` (matches the left navigation column).
- Vertical padding: `12px` top and bottom.
- Zero margin against header to form a unified navigation band.

---

## 5. Responsive Behavior & Breakpoints

- **Single Primary Breakpoint**: `40.0625em` (640px). All layout reflows occur purely via CSS media queries. Zero JavaScript window resize listeners.
- **Small Screens (<640px)**:
  - Sticky sub-nav unpins and stacks in natural document flow above page content.
  - Grid columns collapse to 100% full width (`.govuk-grid-column-full`).
  - Mobile service navigation toggle button appears (`.govuk-service-navigation__toggle`).
  - Data numbers scale down from 48px to 36px.
  - Pseudo-element full-bleed backgrounds are deactivated.
- **Large Screens (≥640px)**:
  - Side-by-side 29% / 71% split view is active.
  - Sticky navigation pins on scroll with real-time active section tracking via `IntersectionObserver`.
  - Mobile toggle button is hidden; full horizontal service navigation links are visible.

---

## 6. Links, Hyperlinks and References

### 6.1 Hyperlink and References Structural Integrity
- **Do not automatically convert hyperlinks into bulleted lists.**
- A hyperlink is not a list item simply because multiple links appear consecutively.
- Preserve the semantic structure of the source:
  - If the source contains a genuine list of references (e.g. `<ul>`, `<ol>`, or source items explicitly written as a structured list), use a bulleted list (`.govuk-list.govuk-list--bullet`).
  - If the source contains standalone links or linked sentences, render them as normal paragraphs with descriptive links.
  - Do not add bullets solely to visually separate links.
  - Do not prepend bullets, arrows, or other decorative characters to ordinary hyperlinks.
  - Follow GOV.UK link guidance: make link text descriptive and understandable without relying on surrounding visual styling.

### 6.2 Link Color and State Specification
- **Default State**: `#1d70b8` with a 1px solid underline.
- **Hover State**: `#003078` with a thicker 3px solid underline.
- **Visited State**: `#4c2c92` with underline.
- **Active State**: `#0b0c0c`.
- **Focus State**: Background `#ffdd00`, text `#0b0c0c`, `outline: 3px solid transparent`, box-shadow `0 -2px #ffdd00, 0 4px #0b0c0c`. Underline is removed on focus.
- **Prohibition against Unicode Arrows**: Do not append decorative unicode arrows (e.g. `→`, `➔`, `»`) to standard inline links or section links. Let descriptive anchor text communicate the action.

---

## 7. Buttons and Interaction Primitives

### 7.1 Button Variants & Usage
- **Primary Action Button (`.govuk-button`)**: Used for the single primary action in a view (e.g. initiating incident reporting, applying filters). Standard GDS green (`#00703c`) or portal deep blue (`#1d70b8`).
- **Warning Button (`.govuk-button--warning`)**: Used for destructive or emergency actions. Red (`#d4351c` / `#da291c`).
- **Secondary Button (`.govuk-button--secondary`)**: Neutral background (`#f3f2f1`), dark text (`#0b0c0c`), 2px box-shadow.
- **Button Geometry**: Squared corners with subtle 0–2px micro-rounding (`--control-radius: 0`). No large rounded pills (`border-radius: 9999px` is strictly forbidden for buttons).
- **Minimum Touch Target**: 44px vertical height on mobile viewports.

---

## 8. Form Controls & Dropdown / Select Behavior

- **Text Inputs (`.govuk-input`)**:
  - Border: 2px solid `#0b0c0c`.
  - Height: Standard 40px.
  - Focus state: 3px yellow `#ffdd00` focus ring with 2px inner black border.
  - Accompanying Labels: Every input must have an explicitly associated `<label>` using `.govuk-label` with `for` pointing to input `id`.
  - Optional Hints: Use `.govuk-hint` directly between the label and the input.
- **Dropdowns / Selects (`.govuk-select`)**:
  - Must use native `<select>` element styled with `.govuk-select`.
  - Do not introduce heavy bespoke JavaScript select overlays that break screen readers, tab navigation, or mobile OS selection wheels.
  - Border: 2px solid `#0b0c0c`.
- **Fieldsets & Legends**:
  - Related inputs (e.g. date ranges, filter groups) must be wrapped in a `<fieldset class="govuk-fieldset">` with a semantic `<legend class="govuk-fieldset__legend">`.

---

## 9. Alerts, Notices and Status Treatments

### 9.1 Alert & Notification Components
- **Warning Text (`.govuk-warning-text`)**: Used for urgent national security warnings and critical incident notices. Features a circular exclamation mark icon with visually hidden `"Warning: "` text prefix for assistive technologies.
- **Notification Banner (`.govuk-notification-banner`)**: Used for prominent advisory updates, maintenance alerts, or confirmation notices.
- **Inset Text (`.govuk-inset-text`)**: Used for statutory references, legal notes, or contextual guidance callouts. Features a thick 10px left border in `#b1b4b6` and left padding.

### 9.2 Advisory Severity & Status Tags (`.govuk-tag`)
Severity levels are communicated via standard GOV.UK tags with high-contrast text:
- **Critical**: `.govuk-tag--red` (Background: `#d4351c` or `#da291c`, Text: `#ffffff`)
- **High**: `.govuk-tag--orange` (Background: `#f47738`, Text: `#0b0c0c`)
- **Medium**: `.govuk-tag--yellow` (Background: `#ffdd00`, Text: `#0b0c0c`)
- **Low**: `.govuk-tag--green` (Background: `#00703c`, Text: `#ffffff`)
- **Informational / General**: `.govuk-tag--blue` (Background: `#1d70b8`, Text: `#ffffff`)
- **CVE Codes**: Rendered in `.govuk-tag` neutral style (`#f3f2f1`, text `#0b0c0c`) with tabular numerals.

---

## 10. Data Presentation & Rules Against Dashboard Noise

### 10.1 Government Analysis Function Alignment
National cyber security statistics must be presented as authoritative public data rather than SaaS KPI dashboard widgets.
- **No Floating Dashboard Cards**: Ban cards with floating drop-shadows, glowing borders, multi-nested containers, or arbitrary gradient fills.
- **Asymmetric Data Layout**:
  - *Row 1 (Primary Finding)*: Spans full content width (`.govuk-grid-column-full`). Highlights the most significant national finding (e.g. 48 Phishing incidents) paired with explanatory plain English narrative.
  - *Row 2 (Secondary Findings)*: Spans equal half-width columns (`.govuk-grid-column-one-half`). Highlights secondary metrics (e.g. 17 Data breaches, 71 Total incidents).
- **Tabular Numerals**: Display values using `.incident-stat-number.govuk-!-font-tabular-numbers` (48px desktop / 36px mobile) with tight bottom margin (`.govuk-!-margin-bottom-2`).
- **Semantic Pairing**: Numbers must not be wrapped in artificial `<h3>` tags without context. The narrative explanation immediately follows the number in DOM order.

---

## 11. Accessibility (WCAG 2.2 AA) & Interaction States

### 11.1 Heading Hierarchy & DOM Traversal
- Exactly one `h1` per page.
- Strict linear hierarchy: `h1` → `h2` → `h3`. Never skip heading levels (e.g. no jumping from `h2` to `h4`).
- Screen reader headings must describe section contents, not visual styling.

### 11.2 Keyboard Navigation & Focus Ring
- **Skip Link**: The very first focusable element on every page must be `<a href="#main-content" class="govuk-skip-link">Skip to main content</a>`.
- **Universal Focus Style**: All focusable interactive elements (links, buttons, inputs, tabs, checkboxes) must display the official GOV.UK yellow focus ring:
  ```css
  outline: 3px solid transparent;
  background-color: #ffdd00;
  box-shadow: 0 -2px #ffdd00, 0 4px #0b0c0c;
  color: #0b0c0c !important;
  ```

### 11.3 Contrast Ratios
- Body text (#0b0c0c) on white (#ffffff) achieves a contrast ratio of >16:1, far exceeding WCAG AA (4.5:1).
- Secondary metadata (#505a5f) achieves >7:1 contrast on white canvas.
- Never place low-contrast grey text on tinted backgrounds.

### 11.4 Overflow, Tables and Word Wrapping
- **Data Tables**: Wrap tables in `.govuk-table__wrapper` or a scrollable container with clear visual boundaries on mobile viewports.
- **Technical Strings & CVEs**: Apply `overflow-wrap: break-word; word-break: break-word;` to technical advisory bodies, hashes, and URLs so they never induce horizontal scroll on the viewport.
- **Page Overflow Prohibition**: The root document must never exhibit horizontal scrollbars across viewports from 320px to 1920px.
