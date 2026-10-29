import test from "node:test";
import assert from "node:assert/strict";
import { BARRIERS, createSeededRandom, ENVIRONMENT_PROPS, GUIDE_START, LAYOUT_SEED, PLATFORMS, PLAYER_START, WORLD_SURFACE, validateEnvironmentLayout } from "../src/game/risk/level.ts";

test("authored spawn, guide and lesson clearings avoid solid environment footprints", () => {
  assert.deepEqual(validateEnvironmentLayout(), []);
  const props = ENVIRONMENT_PROPS.filter((prop) => prop.blocksPlayer);
  assert.ok(props.length >= 10, "the authored grove and woodland use explicit collision descriptors");
  assert.equal(BARRIERS.length, props.length + 4, "hub and recovery landmarks have matching physical barriers");
});

test("pond-side tree roots stay clearly outside the water footprint", () => {
  const pond = { x: -8.4, z: 5.1, halfX: 3.6, halfZ: 1.8 };
  for (const id of ["pond-tree-1", "pond-tree-2"]) {
    const tree = ENVIRONMENT_PROPS.find((prop) => prop.id === id);
    assert.ok(tree, `Missing authored pond tree: ${id}`);
    const bankDistance = Math.hypot(
      (tree.position[0] - pond.x) / pond.halfX,
      (tree.position[2] - pond.z) / pond.halfZ,
    );
    assert.ok(bankDistance > 1.5, `${id} is too close to the pond edge (normalised distance ${bankDistance.toFixed(2)})`);
  }
});

test("all objectives and the guide rest point lie on the walkable island collider", () => {
  const withinIsland = (x, z) => Math.abs(x - WORLD_SURFACE.x) <= WORLD_SURFACE.halfX && Math.abs(z - WORLD_SURFACE.z) <= WORLD_SURFACE.halfZ;
  assert.ok(withinIsland(...[PLAYER_START[0], PLAYER_START[2]]));
  assert.ok(withinIsland(GUIDE_START[0], GUIDE_START[2]));
  for (const point of PLATFORMS) assert.ok(withinIsland(point.x, point.z), `${point.id} is inside the walkable surface`);
});

test("seeded landscape and wildlife choices repeat exactly", () => {
  const sequence = (seed) => Array.from({ length: 12 }, createSeededRandom(seed));
  assert.deepEqual(sequence(LAYOUT_SEED), sequence(LAYOUT_SEED));
  assert.notDeepEqual(sequence(LAYOUT_SEED), sequence(LAYOUT_SEED + 1));
});
