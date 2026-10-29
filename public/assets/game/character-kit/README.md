# Two-character Three.js prototype

This is a runnable Three.js test project using the two uploaded, skinned FBX character sources with custom diffuse-color palettes and runtime procedural bone clips.

## Characters in this prototype

- **Relic Hunter** — recolored body diffuse map with teal/ember accents; the base mesh and skeleton are from the supplied Lady Impa FBX.
- **Grove Oracle** — purple/olive body palette and moon-gold wings; the base mesh and skeleton are from the supplied Great Fairy FBX. The Three.js demo replaces the long/updo hair meshes with a custom short blonde pixie cap, warm-gold side locks, and a pale-gold swept fringe attached to the head bone.

These are **prototype variants**, not fully original replacement meshes. The original silhouettes, UV layouts, rig topology, and many materials remain from the supplied source files. The diffuse texture changes are non-destructive copies within this package.

## Run locally

1. Install Node.js 22.12+ (or a compatible current Node.js release).
2. Open a terminal in this folder.
3. Run `npm install`.
4. Run `npm run dev`.
5. Open the local URL printed by Vite.

Use the character buttons to switch animation states. Drag to orbit and scroll to zoom.

## Animation clips

The FBXs did not contain animation clips. `src/main.js` creates Three.js `AnimationClip` and `AnimationMixer` tracks at runtime using existing named skeleton bones:

- Both: `idle`, `walk`
- Relic Hunter: `special` (scan relic)
- Grove Oracle: `special` (cast spell), `wing` (wing flutter)

This means the FBX files are still models without baked clips: the demo generates and plays the animation clips in JavaScript. The pixie cut is generated in `src/pixie-cut.js` at runtime; the source FBX itself is kept intact, and its original hair meshes are hidden only in the demo scene. If you need a standalone FBX/GLB with the hairstyle baked into the model, open the source in a 3D editor and export the replacement geometry there. For your Three.js game, reuse `src/pixie-cut.js` and call `installPixieCut(root, holder)` after loading, normalizing, and parenting the fairy model.

## Three.js integration notes

The demo uses `FBXLoader` and `AnimationMixer`. The FBX loader can load binary FBX 7.x assets, and the animation mixer plays bone keyframe tracks. See the official Three.js [FBXLoader documentation](https://threejs.org/docs/pages/FBXLoader.html), [animation system guide](https://threejs.org/manual/pages/animation-system.html), and [installation guide](https://threejs.org/manual/pages/installation.html).

The code remaps texture paths embedded in the FBX files (which refer to Windows paths from the original authoring machine) to the local model folder. Keep the texture filenames intact unless you also update the URL remapper.

## Important source-asset rights note

The uploaded FBXs are character assets from *The Legend of Zelda: Echoes of Wisdom* (Nintendo). Recoloring them does not transfer or create rights to Nintendo's meshes, character designs, or game assets. This kit is for prototyping and technical evaluation; before releasing or monetizing a game, confirm the original source terms and use assets you have permission to distribute. Consider replacing these meshes with original models or commissioned/licensed assets for a commercial release.
