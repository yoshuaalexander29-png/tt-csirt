---
name: regression-review
description: Reusable agent workflow for validating that new changes on the TT-CSIRT portal do not break existing functionality, shared components, responsive behavior, or accessibility.
---

# Regression Review Workflow

Use this workflow before completing any task that alters shared components, global stylesheets, routing, or data models.

---

## 6-Point Regression Review Checklist

```
1. Requested Functionality → 2. Related Features → 3. Shared Primitives →
4. Responsive Reflow → 5. Code Hygiene → 6. Accessibility Safeguards
```

### 1. Verify Requested Behavior
- Does the modified code fulfill all explicit *Requirements* stated in the prompt?
- Does the feature behave as expected under standard and edge-case inputs?

### 2. Verify Existing Related Functionality
- Did the change inadvertently alter adjacent sections or views?
  - If editing `/advisories`, confirm that `/advisories/:id` detail rendering and CVE tag filtering still function.
  - If editing `/statistics`, confirm that the homepage 2026 summary metrics still align.
  - If editing header search (`SiteSearch.tsx`), confirm standard service navigation links and mobile drawer still work.

### 3. Verify Shared Components & Stylesheets
- Shared components (`TtcsirtHeader`, `Breadcrumbs`, `PageNavigation`, `Footer`) must remain uniform across all views.
- Edits to `src/styles/homepage.css` or `src/styles/govuk-foundation.scss` must not override styles on unintended pages.
- Check that the desktop 29%/71% grid structure (`.app-page-grid-row`) maintains the continuous `#eef5fb` left background without introducing horizontal overflow.

### 4. Verify Responsive Behavior
- **Desktop (≥640px)**:
  - Sticky sub-nav pins correctly on scroll.
  - Active section highlights update via `IntersectionObserver`.
  - Content columns do not narrow or crush words.
- **Mobile (<640px)**:
  - Sidebar unpins and stacks in natural document flow.
  - Columns expand to 100% full width (`.govuk-grid-column-full`).
  - Mobile navigation toggle button functions with proper `aria-expanded` attributes.
  - Touch targets maintain at least 44px height.

### 5. Verify Code Hygiene & Obsolete Code Removal
- Ensure no orphaned state variables, unused imports, or dead CSS declarations were left behind.
- Clean up any temporary debug logs, test DOM nodes, or commented-out blocks.

### 6. Verify Accessibility & Interaction Safeguards
- **Keyboard Tab Order**: Verify logical tab progression through the view.
- **Skip Link**: Confirm `<a href="#main-content" class="govuk-skip-link">` is the first tab stop and focuses the main content area.
- **Focus Ring**: Confirm yellow `#ffdd00` GDS focus ring appears on all focused controls.
- **Heading Order**: Verify single `h1` at root and zero skipped heading levels (`h1` → `h2` → `h3`).
- **Screen Reader Clarity**: Check that decorative icons carry `aria-hidden="true"` and that links possess descriptive text.
