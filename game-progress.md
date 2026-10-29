# TT-CSIRT cyber-risk platformer checkpoint — 2026-10-13

## Architecture and assets

The existing React + Three.js scene and installed Rapier character controller remain in place; no engine, framework, or runtime dependency was added. The game is lazy-loaded from the proactive-risk page. The live scene uses curated Kenney Platformer Kit GLBs in `public/assets/game/kenney/`, its shared `Textures/colormap.png`, and the adjacent CC0 licence. Asset roles and the visual specification are recorded in `docs/work-log/2026-10-13-kenney-game/asset-catalogue.md` and the contact sheet.

The official Game Studio and community Three.js skill guidance were evaluated. No new skill/plugin was installed: the existing direct Three.js + Rapier implementation already fits the project, and the requested work could be completed with its own browser QA. Jev was not used because no unresolved decision needed a judgment call.

## Current implementation

- One traversable island route with five learning interactions and tokens, a solid crate, spike sensor, checkpoint and beacon finish.
- Five animated character variants, three live tint presets, and a 3D workshop plinth. Desktop and narrow-mobile camera framing keep the selected character visible.
- Rapier movement, grounded-only jumping, platform/crate collision, sensor hazard recovery, and checkpoint respawn.
- Keyboard and touch controls, optional sound, reduced-motion handling, and a development-only read-only state snapshot.

## Verification evidence

- `pnpm lint`: passed.
- `pnpm build`: passed for the main site and publishing app. Build output retains legacy missing font/crest asset warnings and a large lazy game chunk warning (about 5 MB minified / 1.8 MB gzip).
- `node --experimental-strip-types --test tests/risk-game-physics.test.mjs`: 4/4 passed (jump reach/landing, no double-jump, solid crate collision, spike sensor and checkpoint respawn).
- `node tests/risk-game-rendered-qa.mjs`: passed on `http://localhost:8080/services/proactive-risk-management`. Verified all local Kenney GLBs and the colour map, character selection/tint, keyboard movement and jumps through the first two learning stops, both question interfaces, checkpoint activation in the browser, mobile controls, 390 px no-overflow, zero console errors, and zero failed requests.
- Desktop and 390 px mobile screenshots, including the mid-route and checkpoint states, are in `docs/work-log/2026-10-13-kenney-game/evidence/`.

## Remaining verification

The browser run reaches the mid-course checkpoint, but does not complete all five interactions through the finish beacon. Hazard recovery is physics-tested but was not captured in a browser screenshot. Production deployment and older-device frame-time measurements were not performed.
