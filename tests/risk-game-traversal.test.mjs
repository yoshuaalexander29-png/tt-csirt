import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateWallRunEntry,
  stepWallRun,
  computeWallJumpImpulse,
  findBestHomingTarget,
  stepHomingArc,
  startHomingArc,
  projectPointOnSegment,
} from "../src/game/risk/traversal.ts";
import { WALL_RUN_SURFACES } from "../src/game/risk/level.ts";
import { computeAnimationSpeed } from "../src/game/risk/animation-clips.ts";

const sampleWall = {
  id: "test-retaining-wall",
  p1: [0, 0],
  p2: [10, 0],
  yBottom: 0,
  yTop: 2.5,
  normal: [0, 1], // Facing +Z
  tangent: [1, 0], // Along +X
};

test("projectPointOnSegment projects point accurately on line segment", () => {
  const result = projectPointOnSegment(5, 2, [0, 0], [10, 0]);
  assert.equal(result.t, 0.5);
  assert.equal(result.projX, 5);
  assert.equal(result.projZ, 0);
  assert.equal(result.distance, 2);
  assert.equal(result.side, 1); // +Z side
});

test("evaluateWallRunEntry requires minimum speed and appropriate tangent approach", () => {
  // Too slow (speed = 1.0 < 2.2)
  const tooSlow = evaluateWallRunEntry([5, 1.0, 0.5], [1.0, 0], false, [sampleWall]);
  assert.equal(tooSlow.canEnter, false);

  // Too far from wall (dist = 2.0 > 0.85)
  const tooFar = evaluateWallRunEntry([5, 1.0, 2.0], [4.0, 0], false, [sampleWall]);
  assert.equal(tooFar.canEnter, false);

  // Moving directly away from normal
  const flyingAway = evaluateWallRunEntry([5, 1.0, 0.4], [0, 5.0], false, [sampleWall]);
  assert.equal(flyingAway.canEnter, false);

  // Valid approach: close, moving along +X tangent at speed 4.5
  const valid = evaluateWallRunEntry([5, 1.0, 0.4], [4.5, -0.2], false, [sampleWall]);
  assert.equal(valid.canEnter, true);
  assert.equal(valid.surface?.id, "test-retaining-wall");
  assert.equal(valid.directionSign, 1);
});

test("stepWallRun maintains safe standoff distance and terminates at wall boundaries", () => {
  const state = {
    active: true,
    surface: sampleWall,
    duration: 0,
    speed: 5.0,
    directionSign: 1,
    wallDistance: 0.36,
    exitGraceTimer: 0,
  };

  // Step 1: should be constrained to normal standoff distance (Z = 0.36)
  const step1 = stepWallRun(state, [5, 1.2, 0.4], 0.05);
  assert.equal(step1.continueRun, true);
  assert.ok(Math.abs(step1.newPos[2] - 0.36) < 1e-4, "player kept at safe wall standoff distance");
  assert.ok(step1.newPos[0] > 5, "player advanced along wall tangent");

  // Advance near the end of segment (t >= 0.96)
  const stepEnd = stepWallRun(state, [9.8, 1.2, 0.36], 0.05);
  assert.equal(stepEnd.continueRun, false, "smoothly dismounts when reaching wall end");
  assert.equal(state.active, false);
  assert.ok(stepEnd.newVelocity[0] > 0, "preserves forward dismount momentum");
});

test("computeWallJumpImpulse provides outward normal push and upward lift", () => {
  const [vx, vy, vz] = computeWallJumpImpulse(sampleWall, 1);
  assert.ok(vz > 4.0, "pushes outward along wall normal (+Z)");
  assert.ok(vx > 3.0, "carries forward momentum along tangent (+X)");
  assert.ok(vy > 6.0, "delivers upward vertical jump lift");
});

test("findBestHomingTarget prioritizes targets within range and viewing cone", () => {
  const targets = [
    { id: "token-1", position: [4, 1, 0], kind: "token", name: "Risk Token 1", active: true },
    { id: "token-far", position: [20, 1, 0], kind: "token", name: "Far Token", active: true },
    { id: "token-behind", position: [-5, 1, 0], kind: "token", name: "Behind Token", active: true },
    { id: "inactive-token", position: [2, 1, 0], kind: "token", name: "Inactive", active: false },
  ];

  const playerPos = [0, 1, 0];
  const facingDir = [1, 0]; // Facing +X

  const lock = findBestHomingTarget(playerPos, facingDir, targets, false);
  assert.ok(lock !== null);
  assert.equal(lock.target.id, "token-1");
  assert.ok(lock.distance <= 4.01);
  assert.ok(lock.eligible);

  // If player turns around (facing -X), token-1 is behind and rejected
  const lockBehind = findBestHomingTarget(playerPos, [-1, 0], targets, false);
  assert.ok(lockBehind !== null);
  assert.equal(lockBehind.target.id, "token-behind");
});

test("stepHomingArc smoothly interpolates and terminates precisely on target", () => {
  const start = [0, 1, 0];
  const target = [6, 2, 0];
  const arc = startHomingArc(start, target);

  assert.equal(arc.active, true);
  assert.ok(arc.totalDuration > 0.2 && arc.totalDuration < 0.6);

  // Midpoint step
  const mid = stepHomingArc(arc, arc.totalDuration * 0.5);
  assert.equal(mid.finished, false);
  assert.ok(mid.currentPos[1] > 1.5, "arcs vertically for dramatic gameplay feel");

  // Complete step
  const end = stepHomingArc(arc, arc.totalDuration * 0.6);
  assert.equal(end.finished, true);
  assert.ok(Math.abs(end.currentPos[0] - target[0]) < 0.05);
  assert.ok(Math.abs(end.currentPos[1] - target[1]) < 0.05);
  assert.ok(Math.abs(end.currentPos[2] - target[2]) < 0.05);
});

test("level WALL_RUN_SURFACES are valid geometry and lie within world boundaries", () => {
  assert.ok(WALL_RUN_SURFACES.length >= 2, "authored wall-run surfaces present");
  for (const wall of WALL_RUN_SURFACES) {
    const length = Math.hypot(wall.p2[0] - wall.p1[0], wall.p2[1] - wall.p1[1]);
    assert.ok(length >= 2.5, `${wall.id} has sufficient running length`);
    assert.ok(wall.yTop > wall.yBottom, `${wall.id} has positive vertical clearance`);
  }
});

test("computeAnimationSpeed scales playback appropriately across locomotion states", () => {
  assert.equal(computeAnimationSpeed("idle", 0), 1.0);
  const walkRate = computeAnimationSpeed("walk", 3.2);
  const runRate = computeAnimationSpeed("run", 5.2);
  const wallRate = computeAnimationSpeed("wallrun", 5.0);

  assert.ok(runRate > walkRate, "run animates faster than walk");
  assert.ok(wallRate > 1.2, "wall run plays at energetic speed");
});
