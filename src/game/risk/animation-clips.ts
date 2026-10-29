import * as THREE from "three";

export type AnimationStateName =
  | "idle"
  | "walk"
  | "run"
  | "jump"
  | "fall"
  | "glide"
  | "interact"
  | "wallrun"
  | "homing";

export const ANIMATION_CLIP_MATCHERS: Record<string, RegExp> = {
  idle: /\bidle\b|static/i,
  walk: /\bwalk\b/i,
  run: /\bsprint\b|\brun\b/i,
  jump: /\bjump\b/i,
  fall: /\bfall\b/i,
  interact: /spell.cast|interact|emote.yes/i,
};

export function findMatchingClip(
  animations: THREE.AnimationClip[],
  state: AnimationStateName,
): THREE.AnimationClip | undefined {
  if (state === "run") {
    return (
      animations.find((clip) => ANIMATION_CLIP_MATCHERS.run.test(clip.name)) ??
      animations.find((clip) => /walk/i.test(clip.name))
    );
  }
  if (state === "wallrun") {
    return (
      animations.find((clip) => ANIMATION_CLIP_MATCHERS.run.test(clip.name)) ??
      animations.find((clip) => /walk/i.test(clip.name))
    );
  }
  if (state === "homing") {
    return (
      animations.find((clip) => ANIMATION_CLIP_MATCHERS.jump.test(clip.name)) ??
      animations.find((clip) => ANIMATION_CLIP_MATCHERS.fall.test(clip.name))
    );
  }
  const matcher = ANIMATION_CLIP_MATCHERS[state];
  return matcher ? animations.find((clip) => matcher.test(clip.name)) : undefined;
}

export function computeAnimationSpeed(
  state: AnimationStateName,
  groundSpeed: number,
  baseRate = 1.0,
): number {
  switch (state) {
    case "walk":
      return Math.max(0.6, Math.min(1.4, (groundSpeed / 3.2) * baseRate));
    case "run":
      return Math.max(0.9, Math.min(2.1, (groundSpeed / 5.2) * baseRate * 1.15));
    case "wallrun":
      return Math.max(1.1, Math.min(2.2, (groundSpeed / 5.0) * baseRate * 1.25));
    case "homing":
      return 1.8 * baseRate;
    case "glide":
      return 1.0;
    case "jump":
    case "fall":
    case "idle":
    case "interact":
    default:
      return baseRate;
  }
}

export function computeProceduralBobAndTilt(
  state: AnimationStateName,
  clock: number,
  speed: number,
  wallNormal?: [number, number],
  wallForward?: [number, number],
): { bob: number; roll: number; pitch: number; scaleMod: [number, number, number] } {
  if (state === "glide") {
    return {
      bob: Math.sin(clock * 3.5) * 0.015,
      roll: Math.sin(clock * 1.8) * 0.03,
      pitch: 0.16,
      scaleMod: [1.02, 0.98, 1.05],
    };
  }

  if (state === "wallrun") {
    // Lean character inward toward the wall surface and rhythmically pulse stride
    const wallLean = 0.32; // ~18.3 degrees tilt toward wall
    const strideBob = Math.abs(Math.sin(clock * 14)) * 0.035;
    return {
      bob: strideBob,
      roll: wallLean,
      pitch: 0.12,
      scaleMod: [1.04, 0.96, 1.04],
    };
  }

  if (state === "homing") {
    // Aerodynamic forward dive with rotational energy
    return {
      bob: 0,
      roll: 0,
      pitch: -0.42,
      scaleMod: [0.88, 1.25, 0.88], // forward stretch
    };
  }

  if (state === "run" || (state === "walk" && speed > 3.8)) {
    const bob = Math.abs(Math.sin(clock * 12.5)) * 0.032;
    const roll = Math.sin(clock * 6.2) * 0.04;
    return {
      bob,
      roll,
      pitch: 0.08,
      scaleMod: [1.02, 0.98, 1.02],
    };
  }

  if (state === "walk") {
    const bob = Math.abs(Math.sin(clock * 10.5)) * 0.026;
    const roll = Math.sin(clock * 5.2) * 0.025;
    return {
      bob,
      roll,
      pitch: 0.02,
      scaleMod: [1, 1, 1],
    };
  }

  // Idle state
  return {
    bob: Math.sin(clock * 2.1) * 0.008,
    roll: 0,
    pitch: 0,
    scaleMod: [1, 1, 1],
  };
}
