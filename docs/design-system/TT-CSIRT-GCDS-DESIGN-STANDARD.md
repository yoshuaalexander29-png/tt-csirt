# TT-CSIRT design system and interactive experience standard

**Audit date:** 8 October 2026  
**GCDS packages:** `@gcds-core/components` and `@gcds-core/components-react` 1.6.0  
**Status:** Shared GCDS implementations and the new statistics/game experiences are implemented. Whole-site GCDS migration, assistive-technology testing and production verification remain incomplete.

## A. Design system and content/UI conventions

TT-CSIRT retains its Trinidad and Tobago and Ministry of Homeland Security identity, coat of arms, existing page architecture and GDS Transport typography. GCDS supplies real components and documented mechanics where appropriate; this is not a Canada.ca rebrand. The existing two-column page layout remains because it provides persistent “On this page” navigation and is already used by the site. One route container and one shared breadcrumb implementation are used; the GCDS Container/Grid components have not been mechanically wrapped around every existing column.

Use a GCDS component when the package provides the needed semantic component and its state model fits the task. Keep native HTML for headings, tables and links when it provides the required semantics, and retain GOV.UK controls where the current incident workflow still depends on their validation and layout. This is a staged migration: remaining legacy components are listed honestly below.

Spacing follows the existing GOV.UK 5px rhythm for page content and GCDS spacing tokens for GCDS components. Reading width, heading wrap and page gutters are assessed in the existing container rather than by adding one-off page widths. The primary incident CTA keeps TT-CSIRT blue (`#1d70b8`) and its start arrow while using the actual GCDS Button. Its focus state remains yellow with a dark outline. The application’s locked typography is preserved.

### Current component audit

| Component | Existing pattern and target | Actual implementation | Routes / status | Legacy treatment |
|---|---|---|---|---|
| Details | GCDS Details for secondary content | Shared React adapter passes `open={false}` when closed so GCDS receives a real boolean state. Existing panel content is retained. | Home, incident reporting and statistics; rendered closed/open checks passed. | No GOV.UK Details content markup remains. The mobile “On this page” navigation disclosure is native `<details>` because it is navigation, not secondary article content. |
| Notice | GCDS Notice | Shared adapter uses `GcdsNotice` with role, title and semantic heading level. | Proactive-risk, statistics, advisories and selected guidance/advisory content; existing selection remains contextual rather than decorative. | GOV.UK inset text remains for non-alert callouts. |
| Breadcrumbs | GCDS Breadcrumbs | One shared `GcdsBreadcrumbs` implementation in the common government-width container. Each slotted label receives the shared `--gcds-spacing-100` separation after the component's chevron. Current page is omitted from the trail. | All non-home routes; responsive and hierarchy review remains part of QA. | No second breadcrumb component is used by application routes. |
| Button | GCDS Button where a real action or CTA benefits | Shared GCDS Button adapter is used for incident-response CTA, search submit, statistics export/reset and the homepage incident CTA. Start button uses TT-CSIRT blue and keeps the arrow. | Selected primary actions; implementation is not yet a full-site button migration. | GOV.UK buttons remain in the multi-step incident flow and older action groups where its interaction/validation is still coupled to the form. |
| Link | Native anchors for navigation | Anchors preserve copy/open-in-new-tab behaviour and descriptive link text; internal SPA navigation is intercepted only for unmodified primary clicks. | Site-wide semantic pattern. | GCDS Link is available but is not a universal replacement because many links are inline article links or routing anchors. |
| Heading | Native `h1`–`h6` | GDS Transport classes provide the established scale; semantic heading level reflects page hierarchy. | Site-wide. | No GCDS heading wrapper is used merely to style native headings. |
| Container / Grid | Existing shared GOV.UK width container and page grid | Shared geometry is retained, including the established sidebar/content layout. | Site-wide; mobile collapse is inherited from existing layout. | GCDS Container/Grid exist in the installed package but have not been adopted around the existing grid because that would duplicate geometry without a proven benefit. |
| Table | GCDS Table for the filtered explorer; semantic HTML tables for editorial/statistical publication tables | The explorer table has a caption, sortable year and numeric value columns; the existing publication tables remain intact. | Statistics explorer uses GCDS Table; published summaries remain semantic HTML. | Legacy GOV.UK table classes remain on existing report tables. |
| Pagination | GCDS Pagination is available; advisory paging remains established GOV.UK markup | Not migrated in this pass; page state and query behaviour are preserved. | Advisories. | Yes, intentionally retained pending a separate interaction-equivalence check. |
| Search | GCDS Search is available; site header/search route are existing TT-CSIRT implementations | Search semantics and current functionality remain; SearchPage submit uses the GCDS Button. | Header and search route. | Header/search UI not yet migrated to the GCDS Search component. |
| Stepper | GCDS Stepper is available | Incident progress remains custom to the current reporting flow and preserves stable “Step x of 10” positioning and validation behaviour. | Incident reporting. | Custom task indicator remains; not presented as a GCDS Stepper. |
| Radios / checkboxes / fieldset / input / select / textarea / file uploader | GCDS counterparts exist | Most incident form controls remain GOV.UK/native so current validation and saved step state remain intact. Statistics uses GCDS Select. | Report form and statistics. | Mixed. Full form migration requires a dedicated parity review of errors, keyboard flow and file handling. |
| Date input | GCDS Date Input | GCDS Date Input is used on incident step 2 with the existing ISO state, progression and back navigation. | Incident reporting. | No GOV.UK date input on that step. Encapsulated focus and all invalid partial states still need assistive-technology verification. |
| Error message / summary | Mixed existing GOV.UK validation and GCDS form primitives | Current incident errors and server validation are preserved; GCDS Date Input owns its date message. | Reporting and advisory/statistics failure states. | Mixed; do not claim a unified error system. |
| Native disclosure | Native `<details>` | Used only by mobile “On this page” navigation. | Pages with persistent page navigation. | A legitimate navigation disclosure; not an article Details exception. |

### Details defect and verification

The old gray rule under closed Details was caused by the React adapter forwarding `open={undefined}`. The GCDS component rendered `aria-expanded="undefined"`, so its closed-state styling did not match. The adapter now passes an explicit boolean (`open ?? false`); the browser tree reports `false` when closed and `true` when opened. In the rendered page, the guide line is absent in the closed state and appears only with the expanded panel, as intended by GCDS. Reporting-page technical details use the same adapter. No page-specific selector hides the line.

The label-to-chevron gap is set once in the shared breadcrumb adapter with the GCDS `--gcds-spacing-100` token. A slotted label wrapper makes that separation render consistently with the component's shadow DOM on every route; breadcrumbs remain aligned inside the shared width container. The route matrix confirmed no horizontal overflow at 1280px, 768px and 375px; long-label wrapping still needs a focused check.

### Site-wide visual rhythm

The shared shell owns breadcrumbs, route container and persistent page navigation. Page headings and sections keep their established content hierarchy. Notices are reserved for status or risk information, not decoration. Details reveal secondary information rather than navigate. Links remain links; buttons remain state-changing actions. Tables follow their explanatory heading and captions identify dataset and period. The game is optional and scoped to proactive-risk content; it is not included on the statistics page.

### Legacy CSS audit

- The application has no content component rendered with `.govuk-details`; all content disclosures use the shared GCDS adapter.
- `govuk-frontend` and its styles remain required by the incident form and other legacy GOV.UK controls, tables, pagination and errors.
- Native `<details>` remains only for mobile page navigation.
- The previous SVG risk activity and its module stylesheet were removed when the Three.js game replaced it.
- Existing utility and legacy selectors remain in use across routes; a global deletion or cascade reset would risk breaking the incident task and is not part of this pass.

## B. Statistics data explorer

The publication dataset is still the source of truth. The explorer consumes the existing `presentation.trendChart.series` and category/sector series generated by the statistics selectors; it does not change published counts or synthesize category-by-sector records.

“On this page” remains document navigation. It is not duplicated with tabs. The controls transform one annual dataset to answer analytical questions:

- **From year / To year:** changes the points and table rows; an inverted selection is corrected by moving the opposite boundary to the selected year.
- **Measure:** total notifications, public-sector notifications, private-sector notifications or one incident category.
- **Category:** appears only for the category measure and changes the plotted/table values.
- **Display:** chart, table or both. Chart-only retains a visually hidden data table for assistive technology.
- **Show all data:** restores the full published period, total measure and combined chart/table display.

The live summary states the selected range and measure total. For all-sector totals it also identifies the leading category; for a category measure it reports that selected category's total. It does not pair a sector total with a category ranking because the data is published as aggregate category and aggregate sector series, with no category-by-sector cross-tab. The latest partial year remains marked in options, chart labels and table caption. The existing page caveat continues to explain that a partial year is not directly comparable with full-year totals.

The GCDS Select and Table are actual package components. There is no page-section tab control and no locally invented component represented as official GCDS Tabs. Keyboard and screen-reader usability of the custom elements still requires a full assistive-technology pass.

## C. Interactive learning experience

### Design objective and visual direction

The activity is a compact original TT-CSIRT island-office diorama. It uses the broad qualities requested—warm low-poly scenery, chibi proportions, soft light, saturated but controlled materials and an isometric camera—without using Zelda/Nintendo characters, models, maps, textures, logos or animation. The goal is playful but still recognizable as a Trinidad and Tobago public-service learning experience. The reference brief is the user-supplied design direction; no third-party game assets are used.

### Technology, assets and performance

Three.js `0.186.0` is lazy-loaded only after the user chooses “Enter the island office.” The island, government office, server equipment, gateway, backup room, palms, signs and two people are procedurally built from small Three.js meshes. There are no downloaded textures, GLTF files, external asset packages, accounts, backend calls or gameplay analytics. The renderer caps device pixel ratio, uses low-power rendering and soft shadows, and the game is scoped to the proactive-risk route. The built game chunk is approximately 558 kB minified / 143 kB gzip; this is meaningful transfer weight and should be considered for a later asset/bundle optimization pass. The base app and statistics bundle also retain existing large-chunk warnings.

### Movement and camera

The fixed orthographic camera is intentionally isometric; the user cannot rotate it. WASD and arrow keys move the player with eased acceleration, directional facing, body bob and limb movement. Pointer Events provide click/tap-to-move. Rectangular boundaries protect the office, server room, gateway and backup room; circular boundaries protect stations; an island-radius limit prevents walking off the map. Movement and world positions are processed in Three.js rather than simulated as an SVG scene.

### Character, NPC and animation

The player and NPC Amara are original procedural chibi figures with face, hair, clothing, limbs and turn-to-direction orientation. The NPC greets the player, explains the exercise and offers a proximity-based conversation. The player has idle and walking animation, a short interaction gesture and a brief success reaction. Nearby stations provide a DOM interaction button; stations use restrained state color feedback. Reduced motion disables ambient bob, station rotation and success animation. There is no sound.

### Puzzles and lessons

Five station decisions teach asset awareness, limiting public exposure, prioritising known exploited vulnerabilities, using MFA for important accounts and protecting/testing backups. Each question presents a safer and less safe decision. A wrong answer marks the station and explains the consequence while allowing another choice; a successful answer changes the station state and gives a short explanatory response. Completion summarizes explored decisions, not an invented security score. Reset returns the character to the start and clears station outcomes. Normal play is designed for a few minutes of exploration, rather than an open-world session.

### Accessibility and fallback

The game has written instructions, keyboard movement, pointer/touch movement, a focusable canvas with a description, large DOM interaction and answer buttons, a live dialogue status, replay and reduced-motion behavior. The five lessons remain available as ordinary text before the game starts. If WebGL creation fails, the page provides a message and the lesson list remains usable. This is a useful content fallback, not a fully equivalent no-JavaScript gameplay mode. Collision boundaries and all puzzle paths require additional direct play testing on desktop, tablet and mobile.

## Evidence and implementation decisions

| Public source | Short source excerpt | TT-CSIRT decision | Implementation consequence |
|---|---|---|---|
| [GCDS Details](https://design-system.canada.ca/en/components/details/) | “reveals additional information on a page” | Use Details only for secondary content, with a truthful open state. | Shared GCDS Details adapter uses an explicit boolean and preserves panel content. |
| [GCDS Breadcrumbs](https://design-system.canada.ca/en/components/breadcrumbs/) and [spacing tokens](https://design-system.canada.ca/en/foundations/design-tokens/spacing/) | “Use breadcrumbs to help users understand where they are” | Keep one semantic breadcrumb trail aligned to the common page container with a reliable chevron/label gap. | One shared GCDS Breadcrumbs adapter and a slotted label using the `--gcds-spacing-100` token. |
| [GCDS Table](https://design-system.canada.ca/en/components/table/) | “display tabular data” | Let users inspect the filtered series in a sortable, captioned table. | GCDS Table receives actual series data, labels and a period caption. |
| [GCDS Container](https://design-system.canada.ca/en/components/container/) | “constrain content width” | Keep the existing width container and sidebar grid until a replacement is shown to preserve geometry. | No nested container is added inside the already constrained content column. |
| [Three.js WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html) | “It is recommended to use `setAnimationLoop`” | Use the lightest credible 3D renderer with a deliberate fixed camera. | A lazy-loaded Three.js scene uses `setAnimationLoop`, controlled DPR and original procedural assets. |
| [Three.js Raycaster](https://threejs.org/docs/pages/Raycaster.html) | “used for mouse picking” | Pointer and touch should use a shared movement model. | Pointer Events and raycasting map clicks/taps to the ground or a station. |

## Verification and evidence status

The production build and TypeScript check passed. Puppeteer with the installed Chrome browser rendered nine routes at 1280px, 768px and 375px. Every route returned successfully, had one main `h1`, no duplicate IDs and no horizontal document overflow. The proactive-risk route was rendered before and after starting the scene on desktop and mobile; the 3D canvas rendered, and keyboard/pointer movement and one incorrect-then-correct decision path were exercised. Statistics range/measure/category controls changed the summary and the GCDS table; reset restored all data. The reporting and statistics Details controls were inspected closed, and the statistics Details was opened; the closed Details had `aria-expanded=false`, no before pseudo-element border, and no residual guide line. Browser console errors and failed requests were zero in the final route-matrix run. The homepage CTA was rendered after conversion to GCDS Button.

**Not verified in this pass:** actual touch on a physical device, complete arrow-key movement and all collision boundaries, every puzzle branch and full reset/replay path, the browser's reduced-motion preference, screen-reader output, cross-category/sector filtering (not supported by the source data), production behavior, and frame-rate profiling on representative hardware.

Fresh screenshots and machine-readable route results are saved under [`evidence/`](evidence/): homepage CTA, desktop/mobile breadcrumb geometry, proactive Notice, game start state, desktop and mobile 3D scene, the first puzzle with incorrect feedback and a solved decision, default/filtered/mobile statistics, and closed/open statistics Details. The filtered explorer capture reflects the selected 2020–2024 ransomware series and its chart/table. Older images remain in the folder and are not evidence of the new game.

### Build/runtime result

- `npx tsc --noEmit`: passed.
- `npm run build`: passed for the public site and publishing app.
- Local runtime: verified at port 8080 across homepage, services, proactive-risk, ransomware guidance, reporting, advisories, statistics, training and contact.
- Visual: desktop/tablet/mobile route matrix passed overflow, duplicate-ID and single-main-heading checks; representative Details, CTA, statistics and game states were captured. This is rendered QA, not a full design or usability audit.
- Accessibility: selected semantics and visible focus were checked; not a complete audit.
- Production: not verified.
- Build warnings remain for an unresolved GOV.UK crest asset in the public build, unresolved GOV.UK font and crest assets in the separate publishing build, and large chunks (including the existing main and statistics bundles, plus the lazy Three.js game chunk). The public runtime route-matrix run had no failed requests after the Sass font URL fix.

## Follow-up work

1. Migrate remaining form controls, errors, search and advisory pagination where GCDS integration preserves validation, routing and content semantics.
2. Capture fresh after-state desktop/mobile screenshots and rerun a route matrix after the final CSS pass.
3. Test all game choices, station proximity, wall/station collision, replay, mobile touch and `prefers-reduced-motion` directly.
4. Run keyboard, screen-reader, focus, contrast and GCDS custom-element behavior checks with assistive technology.
5. Profile renderer draw calls/frame time on representative mobile hardware and consider asset/code splitting if measured transfer or frame cost is too high.
6. Revisit the shared breadcrumb on narrow mobile and long-label pages.
