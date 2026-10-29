# TT-CSIRT Portal V3 — Header Cleanup Report

Date: 2026-10-29

## Scope

This cleanup removes the unused public-header variant switch and historical header-only scratch artifacts while preserving the intended white government masthead (including `src/assets/govtt-logo.png`), the current TT-CSIRT service identity, menu/search interactions, and the active publishing staff interface.

## Active source changes

- `src/App.tsx`: removed the `?variant=a`/prop switch; the public site now always uses the canonical `.govuk-generic-header` class.
- `src/components/TtcsirtNavigation.tsx`: removed the unused `isVariantB` prop and variant-only class. The menu markup and open/close behavior are unchanged.
- `src/styles/ttcsirt-header-search.scss`: removed the redundant `.govuk-generic-header--variant-b` selectors. The rules remain attached to `.govuk-generic-header`.
- `apps/publishing/src/components/GdsHeader.tsx`: removed the redundant variant class from the active staff publishing header. The staff header component itself remains because `/publishing` uses it.

## Removed legacy scratch files

One-off patch/debug scripts not referenced by package scripts/imports/automated-test configuration:

- `fix_header.cjs`, `fix_header.js`, `fix_header_bg.py`, `fix_all_header_css.cjs`
- `rewrite_header.cjs`, `test_header.cjs`, `test_header_detail.cjs`, `debug-nav.cjs`
- `fix_desktop_nav_audit.py`, `fix_servicenav_toggle.cjs`, `fix_servicenav_react.cjs`, `fix_servicenav_width.cjs`
- `fix_mobile_nav_colors.py`, `fix_service_nav_colors.py`
- `patch_header.cjs`, `patch_header2.cjs`, `patch_header_hierarchical.cjs`, `patch_nav.py`, `fix-nav.cjs`

Removed superseded screenshot artifacts of the older red/black header and menu:

- `header_hover_line.png`, `current_header.png`, `header_desktop.png`, `header_mobile.png`
- `nav-1024.png`, `nav-1280.png`, `nav-1440.png`, `nav-1920.png`

Removed the unreferenced scratch prototype directory `tmp-gds/` (three old GOV.UK navigation template/prototype files).

## Deliberately retained

- `src/components/TtcsirtNavigation.tsx` and `src/components/ttcsirt-navigation.css`: active public-site navigation.
- `src/styles/ttcsirt-header-search.scss`: active styling for the white masthead, iGovTT/GOVTT logo, service header, search panel, and menu controls.
- `src/assets/govtt-logo.png`: the logo used by the canonical public masthead; not deleted.
- `tests/masthead-layout.test.cjs` and `tests/navigation-regression.test.cjs`: maintained regression tests; not deleted.
- `apps/publishing/src/components/GdsHeader.tsx`: distinct active staff publishing header at `/publishing`. It is not an alternate public-site header.
- `src/components/ui/navigation-menu.tsx` and other reusable UI primitives: generic component library files, not alternate masthead implementations.
- Unrelated audit results and screenshots: preserved.

## Verification status

- Static source reference scan: passed; no `variant=a`, `isVariantB`, `.govuk-generic-header--variant-b`, or `.ttcsirt-navigation--variant-b` references remain in active `src/` or `apps/` source.
- Header asset/source scan: passed; the canonical `govtt-logo.png` import and the `TtcsirtHeader` / `TtcsirtNavigation` implementation remain present.
- Legacy-reference scan: passed; no code/config references to the removed one-off scripts, stale header screenshots, or `tmp-gds/` remain.
- TypeScript check/build and browser screenshot tests: not run. The supplied archive had no `node_modules`; attempting `npm ci --ignore-scripts --prefer-offline --no-audit --no-fund` did not complete within the execution window. The partial install was removed and is not included in the output ZIP.
- The source changes intentionally remove only redundant classes/variant plumbing; they do not alter the structure or core styles of the canonical white header.
- The original uploaded archive is left untouched. This report describes the cleaned copy, not the original archive.

## Included audit artifacts

- `HEADER_REMOVALS.txt`: inventory of removed header-related scratch files and obsolete screenshot captures.
- `SOURCE_CHANGES.patch`: unified patch for the four active source files changed by this cleanup.

## Rollback

Use the original `ttcsirt-portal-v3.zip` archive to restore any removed artifact. The cleaned ZIP is a separate output.
