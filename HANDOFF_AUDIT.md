# Handoff: security hardening of advisory rendering (29 Oct 2026)

## Problem
Advisory HTML from WordPress was cleaned with regular expressions, then injected with `dangerouslySetInnerHTML` (11 places in `AdvisoryContentRenderer.tsx`). Regexes cannot reliably neutralise XSS (e.g. `javascript:` links, `onerror=` attributes, and the link rewriter re-emitted raw `href` values).

## Fix
1. `src/services/safeHtml.ts`: allow-list sanitizer using DOMPurify (tags, attributes, URL schemes). `AdvisoryContentRenderer.tsx::enrichExternalLinksHtml` now = `sanitizeAdvisoryHtml(addLinkSemantics(html))`, so every injected string is sanitised last.
2. `src/services/safeHtmlFallback.ts`: fail-closed plain-text fallback if no DOM.
3. `server/securityHeaders.js` (wired in `server.js`): CSP (no inline/eval scripts, no framing, no plugins, base-uri/form-action locked), HSTS on HTTPS only, COOP/CORP, X-Frame-Options, nosniff. `TTCSIRT_CSP_REPORT_ONLY=1` = monitor-only rollout.
4. DOMPurify `^3.4.14` added to package.json/lock (already in lockfile via jsPDF, so no new supplier).
5. **Windows path fix:** removed 928 files (464 per folder) in `public/data/canonical/documents` and `src/data/canonical/documents` that had very long slug names (up to 182 chars). Each was byte-identical (MD5-verified) to a short `<id>.json` sibling; nothing references documents by filename. Longest path is now 115 chars.

## Sources
- OWASP XSS Prevention Cheat Sheet (recommends DOMPurify; names native Sanitizer API as alternative).
- DOMPurify README (hooks, ALLOWED_URI_REGEXP). MDN CSP guide; Helmet defaults for header set.
- Chosen over native Sanitizer API because cross-browser support was not yet universal; DOMPurify is browser-agnostic and OWASP-endorsed.

## Verified (this session)
- `tests/security-headers.test.mjs` 4/4 pass; `tests/safe-html-fallback.test.mjs` 3/3 pass.
- DOMPurify 3.4.14 + jsdom: `javascript:` href stripped, `onerror` stripped, `<script>` removed, tab-obfuscated `jav&#x09;ascript:` stripped, external link gets `target=_blank rel="noopener noreferrer"`.

## NOT verified (auditor please run)
- `npm install && npm run lint && npm test && npm run build` (no node_modules here; full build not run).
- Browser check of an advisory page with the CSP enforced: set `TTCSIRT_CSP_REPORT_ONLY=1` first, watch the console, then enforce. Possible CSP breakage: external fonts/scripts not found in my grep, `img-src` hosts (ttcsirt.gov.tt, *.mcusercontent.com only; 14 images point to private 192.168.70.12 and are removed).
- Game removal and wider dead-file cleanup NOT done (260 root files flagged unused by name-grep; deletion deferred as unverified).
- Not compared against "new live ttcsirt.gov.tt advisory": not done.

---
# Addendum: UI consistency pass (29 Oct 2026)
Goal: one source of truth for repeated custom components, zero visual change, no layout geometry touched (AGENTS.md invariants: 29/71 layout, single h1, sentence case all untouched).

| Before | After |
|---|---|
| Error box copy-pasted with inline `#d4351c`/`#fbf2f0` in `AdvisoryDetailPage` and `AdvisoriesPage` | `.ttcsirt-error-callout` (+ `__row`, `__icon`) in `src/styles/homepage.css` |
| Inline grey `#505a5f`, inset padding, code block styling, table scroll, `pre-wrap` in renderer / report page | `.ttcsirt-secondary-text`, `.ttcsirt-inset-compact`, `.ttcsirt-code-block`, `.advisory-table-container`, `.ttcsirt-preserve-lines` |
| Hard-coded hex per file | CSS variables `--ttcsirt-*` on `:root` |
Extra: code blocks get a readable black-outline style in print.

Verified: esbuild parses all 5 edited TS/TSX files and the CSS. NOT verified: rendered screenshots at 375/768/1280px, keyboard/focus check, `tsc`, full tests. Auditor: run `npm run build`, view `/advisories`, an advisory page, `/report-an-incident` review step, and compare with the previous zip.
Source followed: GOV.UK Design System error-summary pattern and its functional colours (`#d4351c` error), plus the project's own `AGENTS.md`.
