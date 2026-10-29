import test from "node:test";
import assert from "node:assert/strict";
import { createRiskPhysics } from "../src/game/risk/physics.ts";
import { BARRIERS, PLATFORMS, WORLD_SURFACE } from "../src/game/risk/level.ts";

const toSurfaces = (platforms) => platforms.map(({ x, z, top, halfX, halfZ }) => ({ x, z, top, halfX, halfZ }));
const settle = (physics, frames = 30) => {
  let position;
  for (let frame = 0; frame < frames; frame += 1) position = physics.step(0, 0, 1 / 60);
  return position;
};

test("continuous landscape preserves jumping and prevents a second airborne jump", async () => {
  const physics = await createRiskPhysics(
    [0, 0, 0],
    [WORLD_SURFACE],
    BARRIERS,
    [],
  );
  try {
    settle(physics);
    assert.equal(physics.isGrounded(), true);
    assert.equal(physics.jump(), true);
    assert.equal(physics.jump(), false);

    let position;
    for (let frame = 0; frame < 60; frame += 1) position = physics.step(-3.5, -2, 1 / 60);

    assert.equal(physics.isGrounded(), true);
    assert.ok(Math.abs(position[1] - WORLD_SURFACE.top) < 0.08, `landed at y=${position[1].toFixed(2)}`);
    assert.ok(position[0] < 0 && position[2] < 0, "movement continues over the connected landscape");
  } finally {
    physics.dispose();
  }
});

test("a collidable woodland trunk blocks grounded movement", async () => {
  const tree = BARRIERS.find((barrier) => barrier.id === "woodland-1");
  assert.ok(tree);
  const physics = await createRiskPhysics([tree.x + 1.6, 0, tree.z], [WORLD_SURFACE], BARRIERS, []);
  try {
    settle(physics);
    let position;
    for (let frame = 0; frame < 60; frame += 1) position = physics.step(-5, 0, 1 / 60);
    assert.ok(position[0] > tree.x - tree.halfX - 0.35, `player crossed tree at x=${position[0].toFixed(2)}`);
  } finally {
    physics.dispose();
  }
});

test("fixed-step movement is stable across 30, 60 and 120 Hz render deltas", async () => {
  const travelForOneSecond = async (frameDelta) => {
    const physics = await createRiskPhysics([0, 0, 0], [WORLD_SURFACE], [], []);
    try {
      settle(physics);
      let position;
      const frames = Math.round(1 / frameDelta);
      for (let frame = 0; frame < frames; frame += 1) position = physics.step(3, 0, frameDelta);
      return position[0];
    } finally {
      physics.dispose();
    }
  };

  const [at30, at60, at120] = await Promise.all([1 / 30, 1 / 60, 1 / 120].map(travelForOneSecond));
  assert.ok(Math.abs(at30 - at60) < 0.1, `30 Hz x=${at30.toFixed(2)}, 60 Hz x=${at60.toFixed(2)}`);
  assert.ok(Math.abs(at120 - at60) < 0.1, `120 Hz x=${at120.toFixed(2)}, 60 Hz x=${at60.toFixed(2)}`);
});

test("a spike sensor detects contact and checkpoint respawn restores the saved position", async () => {
  const physics = await createRiskPhysics(
    [0, 0, 0],
    [WORLD_SURFACE],
    [],
    [{ x: 0.9, y: 0.36, z: 0, halfX: 0.25, halfY: 0.1, halfZ: 0.35 }],
  );
  try {
    settle(physics);
    let position;
    let detected = false;
    for (let frame = 0; frame < 24 && !detected; frame += 1) {
      position = physics.step(5, 0, 1 / 60);
      detected = physics.hitHazard();
    }
    assert.equal(detected, true);
    physics.respawn([-1.5, 0, 1.25]);
    position = settle(physics, 2);
    assert.ok(Math.abs(position[0] + 1.5) < 0.05);
    assert.ok(Math.abs(position[1]) < 0.08);
    assert.ok(Math.abs(position[2] - 1.25) < 0.05);
  } finally {
    physics.dispose();
  }
});





