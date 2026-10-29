import assert from "node:assert/strict";
import test from "node:test";
import { DustEmitter, edgeIndicator, squashScale, stepSpring } from "../src/game/risk/feel.ts";

test("visual squash preserves volume", () => {
  for (let vertical = 0.75; vertical <= 1.25; vertical += 0.05) {
    const scale = squashScale(vertical);
    assert.ok(Math.abs(scale.x * scale.y * scale.z - 1) < 1e-9);
  }
});

test("landing spring recovers without an unstable hitch", () => {
  const spring = { x: 0.88, v: 0 };
  stepSpring(spring, 1, 5, 0.4, 0.1);
  assert.ok(Number.isFinite(spring.x) && Math.abs(spring.x - 1) < 0.3);
});

test("edge cue clamps off-screen targets and keeps on-screen targets clear", () => {
  assert.equal(edgeIndicator(0.2, -0.3).onScreen, true);
  const cue = edgeIndicator(3, 2);
  assert.equal(cue.onScreen, false);
  assert.ok(Math.abs(cue.x) <= 0.921 && Math.abs(cue.y) <= 0.921);
  assert.ok(Math.abs(cue.angle - Math.atan2(2, 3)) < 1e-9);
});

test("distance-based dust emission is independent of frame rate", () => {
  const run = (fps) => {
    const emitter = new DustEmitter();
    let count = 0;
    for (let frame = 0; frame < fps * 0.7; frame += 1) count += emitter.update(5, 1 / fps);
    return count;
  };
  assert.equal(run(20), run(144));
});
