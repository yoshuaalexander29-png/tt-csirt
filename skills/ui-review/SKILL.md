---
name: ui-review
description: Reusable agent workflow for inspecting, critiquing, and validating rendered UI against TT-CSIRT GOV.UK design guidelines.
---

# UI Review Workflow

Use this workflow whenever a user request introduces or alters user interface components, layouts, typography, spacing, or visual states on the TT-CSIRT portal.

---

## 9-Step UI Review Sequence

```
1. Run/Build → 2. Route Check → 3. Render Inspect → 4. Guideline Compare →
5. Multi-Axis Evaluation → 6. Discrepancy Log → 7. Material Fix → 8. Re-Render → 9. Final Verification
```

### Step 1: Run or Build the Application
- Verify the dev server is active or compile the project via `compile_applet`.
- Ensure there are no fatal compilation, syntax, or bundler errors before attempting UI review.

### Step 2: Navigate to Affected Route(s)
- Identify all routes touched by the changes (e.g. `/`, `/advisories`, `/advisories/:id`, `/statistics`).
- If headless testing is required, use existing Puppeteer runners (`node run_puppeteer.cjs`) or evaluate DOM nodes via scripts.

### Step 3: Inspect the Rendered DOM and Visual Tree
- Examine the rendered output, checking container widths, layout positioning, and element stacking.
- Check both desktop viewports (≥640px) and mobile viewports (320px–639px).

### Step 4: Compare Against Project Design Guidelines
- Cross-reference against `/guidelines/Guidelines.md`.
- Confirm that the UI respects the mechanical GOV.UK Frontend rules rather than superficial SaaS decorations.

### Step 5: Evaluate Along Core Design Axes
Examine the following specific criteria:
1. **Typographic Hierarchy**:
   - Exactly one semantic `h1` per page (the proposition).
   - Strict `h1` → `h2` → `h3` sequential order (no skipped heading levels).
   - GDS Transport font stack active (`"GDS Transport", Arial, sans-serif`).
   - Sentence case applied to all headings, badges, table columns, and buttons.
2. **Spacing & Baseline Rhythm**:
   - All paddings, margins, and gaps must conform strictly to the GDS 5px-modulo scale (5, 10, 15, 20, 25, 30, 40, 50, 60px).
   - No arbitrary pixel values (e.g. 17px, 23px, 33px, 44px).
3. **Alignment & Grid Integrity**:
   - Desktop: 29% left column (`.app-page-nav`) and 71% right content column (`.app-page-content`).
   - Max content container locked to 1020px (`.govuk-width-container`).
   - Breadcrumb strip sitting flush beneath the header with unbroken `#eef5fb` background.
4. **Anti-Dashboard Rules**:
   - No floating cards with box-shadows.
   - No cards nested within cards.
   - Incident data formatted as data + narrative findings (Row 1 full-width; Row 2 50/50).
   - No decorative arrows prepended/appended to ordinary text links.
5. **Hyperlink & Reference Rules**:
   - Consecutive hyperlinks must NOT be automatically turned into bulleted lists.
   - Only authentic source lists (`<ul>`, `<ol>`) render as lists.
6. **Interaction & Focus States**:
   - Focus ring displays high-contrast yellow `#ffdd00` background with black inner box-shadow.
   - Touch targets meet minimum 44px height on mobile.
7. **Overflow & Clipping**:
   - Zero horizontal scrollbar on root `html`/`body` from 320px to 1920px.
   - Tables and code snippets safely wrapped in scrolling containers.

### Step 6: Identify Concrete Discrepancies
- Document any specific CSS deviations, misaligned margins, skipped heading tags, or casing violations.

### Step 7: Apply Material Fixes
- Perform surgical code edits in the offending component or stylesheet.
- Avoid introducing `!important` flags; fix the cascade at the root selector level.

### Step 8: Re-Render & Re-Inspect
- Re-compile via `compile_applet` and re-evaluate the modified route.

### Step 9: Verify and Conclude
- Confirm all discrepancies are resolved and that no new layout regressions were introduced.
