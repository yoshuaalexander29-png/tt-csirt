# Kenney Platformer Kit asset catalogue

**Source:** [Kenney Platformer Kit](https://kenney.nl/assets/platformer-kit) · **Licence:** CC0 1.0 · **Retrieved:** 2026-10-13. The official kit page identifies the pack as 3D, CC0 and animation enabled. The official import guide recommends GLB as a compact glTF format; the archive supplies the colormap as a shared external texture, which is copied locally with the models.

![Kenney Platformer Kit preview sheet](kenney-platformer-kit-contact-sheet.png)

## Selected visual language

Use the original green grass tops, warm earth sides, white/orange trims and the five coloured Oobi character variants. Keep the environment assets within this single pack. The course is suspended above a light blue sky; the same grass block and pine-tree models provide depth in the distance.

| Role | Local source models | Use |
| --- | --- | --- |
| Player workshop and guide | character-oobi.glb, character-oodi.glb, character-ooli.glb, character-oopi.glb, character-oozi.glb | Five selectable, independently animated character variants; tint presets multiply the embedded character map. |
| Main route surfaces | block-grass-large.glb, block-grass.glb | Large safe starting/finish islands and progressively narrow landing platforms. Rapier cuboids match their visible top footprint and height. |
| Checkpoint / goal | flag.glb, chest.glb, sign.glb | Mid-route checkpoint, recovery beacon and route landmark. |
| Hazard / obstacle | trap-spikes.glb, crate-strong.glb | Rapier sensor resets the player at spikes; solid crate collider blocks passage. |
| Collectibles / route dressing | coin-gold.glb, tree.glb, flowers.glb, rocks.glb, mushrooms.glb, spring.glb | Five gold tokens, start-island focal tree, small path landmarks and a spring pad. |

The selected character GLBs include idle, walk, sprint, jump, fall, interact-right, pick-up, emote-yes and other clips. Character loading and the 3D renderer are lazy, so the 3D dependencies and assets load only after the visitor opens the exercise.

## Visual specification

- Third-person follow camera, angled from behind the next platform; target reads the player and landing ahead.
- Character height is scaled to about 1.4 world units. The starting island is about 5.7 units wide; jump platforms are about 2.2–2.4 units wide.
- Palette: Kenney's green and earth platform map, warm white sun, cool sky fill and pale blue atmospheric background. Avoid emissive cyber props and unrelated packs.
- Soft filtered directional shadows and restrained fog provide depth. HUD remains inside the play frame; mobile controls stay on the lower corners with at least 48px touch targets.
- Route: broad start → curved short jumps → spike ledge → checkpoint → narrow jumps → chest/flag finish. Falling returns to the most recent checkpoint.

## Files copied into the site

The public game asset folder contains the 18 GLB models used by the live scene and workshop, their required shared local `Textures/colormap.png`, the CC0 `License.txt`, and no generated or externally hosted model dependency. The full archive was inspected from `tmp/kenney-game-assets-20261013/`; only the selected models, shared texture and licence are served by the website. The unselected model variants stay outside the public asset folder.



