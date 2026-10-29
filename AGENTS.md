# TT-CSIRT GOV.UK System Guidelines & Rules

## Hyperlinks and References
- **Do not automatically convert hyperlinks into bulleted lists.**
- A hyperlink is not a list item simply because multiple links appear consecutively.
- Preserve the semantic structure of the source:
  - If the source contains a genuine list of references (e.g. `<ul>`, `<ol>`, or source items explicitly written as a structured list), use a bulleted list.
  - If the source contains standalone links or linked sentences, render them as normal paragraphs with descriptive links.
  - Do not add bullets solely to visually separate links.
  - Do not prepend bullets, arrows, or other decorative characters to ordinary hyperlinks.
  - Follow GOV.UK link guidance: make link text descriptive and understandable without relying on surrounding visual styling.

---

# Agent Operating System & Project Rules

This document defines how the coding agent operates on the TT-CSIRT portal.

## 1. Core Operating Principles
The agent must adhere to these foundational principles across all operations:
- **Inspect before editing**: Never assume file content, structure, or exports. Always call `view_file` on target code before modifying.
- **Understand requirements and invariants**: Before modifying anything, explicitly distinguish what must change (*Requirements*) from what must not change (*Invariants*).
- **Identify blast radius**: Determine all affected files, shared components, CSS cascades, and state flows before executing changes.
- **Root cause over symptom patching**: Diagnose underlying structural or semantic flaws instead of layering cosmetic workarounds or `!important` CSS overrides.
- **Minimal scoped changes**: Make the smallest surgical change necessary to satisfy the prompt. Never rewrite entire files when targeted edits suffice.
- **Preserve existing behavior**: Unrelated routes, layout geometry, caching layers, and accessibility landmarks outside the requested scope must remain intact.
- **Leverage existing primitives**: Use standard GOV.UK Frontend v6+ components (`govuk-frontend`), existing design tokens, and shared utilities. Avoid creating duplicate components or parallel styles.
- **Inspect rendered UI for UI tasks**: Treat visual and DOM inspection as mandatory verification steps. Never assume styling works because compilation succeeds.
- **Verify desktop and mobile behavior**: Validate both large screen (≥640px) and small screen (<640px) layouts, including mobile navigation toggle states and column collapsing.
- **Verify accessibility & interaction states**: Check keyboard tab order, skip links, yellow focus rings (`#ffdd00`), touch target heights (≥44px on mobile), and contrast ratios.
- **Perform regression checks**: Ensure shared components, global search, sticky navigation, and routing still function as expected.
- **Iterate on discrepancies**: If visual or structural flaws are detected during review, analyze the cause, apply fixes, and re-verify.
- **Compilation is not completion**: Passing `tsc --noEmit` or `vite build` verifies only type and bundle validity, not visual correctness, accessibility, or functional compliance.

---

## 2. Nine-Stage Implementation Lifecycle

For all substantial implementation and UI tasks, the agent follows this sequence:

```
Understand → Inspect → Plan → Implement → Render → Critique → Fix → Verify → Report
```

1. **Understand**: Read the user prompt carefully. Identify the goal, boundaries, and explicit acceptance criteria.
2. **Inspect**: Read target source files, stylesheets, and relevant documentation. Confirm existing layout geometry and state contracts.
3. **Plan**: Formulate a concise, minimal action plan identifying files to modify, new components needed (if any), and invariants to protect.
4. **Implement**: Execute scoped, surgical edits using `edit_file` or `multi_edit_file`. Keep code clean, typed, and formatted.
5. **Render**: Build the application (`compile_applet`) and inspect rendered output across affected routes.
6. **Critique**: Compare rendered UI against design guidelines (`/guidelines/Guidelines.md`). Evaluate hierarchy, spacing, alignment, typography, responsive behavior, overflow, clipping, and interaction states.
7. **Fix**: Address any concrete discrepancies or layout flaws discovered during critique.
8. **Verify**: Run `lint_applet` and `compile_applet`. Verify desktop (≥640px) and mobile (<640px) responsiveness and accessibility.
9. **Report**: Summarize user-facing functional and design outcomes concisely without internal file chatter or marketing hype.

---

## 3. Acceptance-Gate Behavior

Every implementation task must be evaluated against three distinct tiers before completion:

### Tier 1: Requirements (What Must Change)
- Explicit user deliverables requested in the prompt.
- Functional capabilities, content adjustments, or structural updates.

### Tier 2: Invariants (What Must NOT Change)
- The single `h1` per page rule.
- Sentence case convention for headings, tables, buttons, and navigation.
- GDS 5px-modulo spacing scale (no arbitrary pixel values).
- No dashboard/SaaS visual chrome (no floating shadow cards, no cyan-on-dark glow, no nested cards).
- Hyperlink and reference semantic integrity (no artificial bulleting of consecutive links).
- Authentic GDS yellow focus box (`#ffdd00`) across all interactive controls.
- Asymmetric incident data layout (Row 1 full-width, Row 2 50/50).
- Sticky 29%/71% two-column split layout geometry and `#eef5fb` surface continuity on desktop.
- Live WordPress API integration and advisory caching mechanisms.

### Tier 3: Acceptance Criteria (How Completion is Verified)
- Code passes TypeScript linting (`tsc --noEmit`) without errors.
- Production build succeeds (`vite build` via `compile_applet`).
- Visual check confirms correct typography, spacing, and responsive reflow at <640px and ≥640px.
- Interactive states (focus, hover, click, mobile menu toggle) operate smoothly.
- No unintended regressions in adjacent views or shared components.

A task is **NOT complete** until its acceptance criteria have been verified against the running codebase.

---

## 4. Rule Precedence & Hierarchy of Authority

When architectural, design, or implementation instructions appear to overlap or conflict, resolve them using this strict hierarchy:

```
1. Existing Project Decisions (/DECISIONS.md) & Design System (/guidelines/Guidelines.md)
   ↓
2. Agent Operating Rules (/AGENTS.md)
   ↓
3. Task-Specific User Instructions
```

**Conflict Resolution Protocol**: If a user prompt explicitly requests a change that violates an architectural decision or design invariant (e.g. asking to introduce floating SaaS dashboard cards or all-caps headings), surface the tension politely and explain the GDS design system constraint while presenting a compliant alternative. Do not silently break core invariants.

---

## 5. Reusable Review Workflows

The agent uses two specialized review workflows:
- **UI Review Workflow**: See `/skills/ui-review/SKILL.md` for the 9-step visual and design system compliance inspection.
- **Regression Review Workflow**: See `/skills/regression-review/SKILL.md` for verifying backward compatibility, shared components, responsive behavior, and accessibility.

---

## 6. Authoritative Documentation Map
- **Agent Behavior**: `/AGENTS.md` (this file)
- **Design System Rules**: `/guidelines/Guidelines.md` (and reference `/design.txt`)
- **System Architecture**: `/ARCHITECTURE.md`
- **Architectural Decisions**: `/DECISIONS.md`
- **Current Application State**: `/CURRENT_STATE.md`
- **Review Workflows**: `/skills/ui-review/SKILL.md` & `/skills/regression-review/SKILL.md`
