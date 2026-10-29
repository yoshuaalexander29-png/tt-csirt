import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { computeAnimationSpeed, computeProceduralBobAndTilt } from "../src/game/risk/animation-clips.ts";
import { buildClips } from "../src/game/risk/characterLoader.ts";

test("authored character buildClips generates all standard locomotion, traversal and glide clips", () => {
  // Create a mock hierarchy matching the Grove Oracle FBX skeletal structure
  const root = new THREE.Group();
  const bones = [
    "spine_a", "spine_b", "head", "n_hara",
    "arm_L_a", "arm_L_b", "hand_L",
    "arm_R_a", "arm_R_b", "hand_R",
    "leg_L_a", "leg_L_b", "foot_L",
    "leg_R_a", "leg_R_b", "foot_R",
    "wing_L_a", "wing_R_a", "wingupper_L_a", "wingupper_R_a",
  ];
  bones.forEach((name) => {
    const bone = new THREE.Bone();
    bone.name = name;
    root.add(bone);
  });

  const oracleClips = buildClips(root, "oracle");
  const expectedStates = ["idle", "walk", "run", "jump", "fall", "glide", "interact", "wallrun", "homing"];

  for (const state of expectedStates) {
    assert.ok(oracleClips[state], `Oracle character should have '${state}' animation clip`);
    assert.ok(oracleClips[state].duration > 0, `'${state}' clip duration must be > 0`);
    assert.ok(oracleClips[state].tracks.length > 0, `'${state}' clip must contain keyframe tracks`);
  }

  // Verify glide clip includes wing flaring tracks
  const glideTracks = oracleClips["glide"].tracks.map((t) => t.name);
  assert.ok(glideTracks.some((t) => t.includes("wing_L")), "Glide clip must flare left wing");
  assert.ok(glideTracks.some((t) => t.includes("wing_R")), "Glide clip must flare right wing");
  assert.ok(glideTracks.some((t) => t.includes("arm_L")), "Glide clip must pose left arm");
  assert.ok(glideTracks.some((t) => t.includes("arm_R")), "Glide clip must pose right arm");
});

test("authored character buildClips generates Kaya guide clips", () => {
  const root = new THREE.Group();
  const bones = [
    "spine_a", "spine_b", "head",
    "arm_L_a", "arm_L_b", "arm_R_a", "arm_R_b",
    "leg_L_a", "leg_L_b", "leg_R_a", "leg_R_b",
  ];
  bones.forEach((name) => {
    const bone = new THREE.Bone();
    bone.name = name;
    root.add(bone);
  });

  const hunterClips = buildClips(root, "hunter");
  assert.ok(hunterClips["idle"], "Hunter must have idle clip");
  assert.ok(hunterClips["interact"], "Hunter must have interact dialogue clip");
  assert.ok(hunterClips["walk"], "Hunter must have walk clip");
});

test("glide state aerodynamic procedural pitch and roll bobbing", () => {
  const procedural = computeProceduralBobAndTilt("glide", 1.5, 5.2);
  // Glide should have subtle upward aerodynamic pitch and gentle glide altitude bob
  assert.ok(typeof procedural.pitch === "number");
  assert.ok(typeof procedural.roll === "number");
  assert.ok(typeof procedural.bob === "number");
  assert.ok(Math.abs(procedural.pitch) > 0.05, "Glide must apply aerodynamic forward flight pitch");
});

test("computeAnimationSpeed produces expected rates for locomotion and gliding", () => {
  assert.equal(computeAnimationSpeed("glide", 5.2), 1.0);
  assert.equal(computeAnimationSpeed("idle", 0), 1.0);
  assert.ok(computeAnimationSpeed("run", 6.2) > computeAnimationSpeed("walk", 3.0));
});
