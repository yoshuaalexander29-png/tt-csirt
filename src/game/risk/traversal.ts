import * as THREE from "three";

export type MovementState = "grounded" | "airborne" | "wallrun" | "homing" | "gliding";

export type WallSurface = {
  id: string;
  p1: [number, number]; // [x, z] start
  p2: [number, number]; // [x, z] end
  yBottom: number;
  yTop: number;
  normal: [number, number]; // [nx, nz] normalized outward normal
  tangent: [number, number]; // [tx, tz] normalized traversal direction along wall
};

export type HomingTarget = {
  id: string;
  position: [number, number, number];
  kind: "lesson" | "token" | "finish";
  name: string;
  active: boolean;
};

export type HomingLock = {
  target: HomingTarget;
  distance: number;
  direction: [number, number, number];
  angleToFacing: number;
  eligible: boolean;
};

export type WallRunState = {
  active: boolean;
  surface: WallSurface | null;
  duration: number;
  speed: number;
  directionSign: number; // +1 along tangent, -1 against tangent
  wallDistance: number;
  exitGraceTimer: number;
};

export type HomingArcState = {
  active: boolean;
  targetId: string | null;
  startPos: [number, number, number];
  targetPos: [number, number, number];
  elapsed: number;
  totalDuration: number;
};

const WALL_RUN_MAX_DURATION = 2.4;
const WALL_RUN_MIN_SPEED = 2.2;
const WALL_RUN_TARGET_SPEED = 6.2;
const WALL_RUN_DETECTION_DIST = 0.85;
const WALL_STANDOFF = 0.36; // Distance from wall plane
const HOMING_MAX_RANGE = 9.0;
const HOMING_MAX_ANGLE = (58 * Math.PI) / 180; // 58 degrees field of view
const HOMING_SPEED = 18.5; // Meters per second

/**
 * Checks if a point [px, pz] is near a line segment [p1, p2] and returns
 * the projected parameter t, distance, and perpendicular normal offset.
 */
export function projectPointOnSegment(
  px: number,
  pz: number,
  p1: [number, number],
  p2: [number, number],
): { t: number; projX: number; projZ: number; distance: number; side: number } {
  const dx = p2[0] - p1[0];
  const dz = p2[1] - p1[1];
  const lengthSq = dx * dx + dz * dz;
  if (lengthSq < 1e-6) {
    const dist = Math.hypot(px - p1[0], pz - p1[1]);
    return { t: 0, projX: p1[0], projZ: p1[1], distance: dist, side: 1 };
  }

  const t = Math.max(0, Math.min(1, ((px - p1[0]) * dx + (pz - p1[1]) * dz) / lengthSq));
  const projX = p1[0] + t * dx;
  const projZ = p1[1] + t * dz;
  const distance = Math.hypot(px - projX, pz - projZ);

  // Cross product to determine which side of the segment the point is on
  const cross = (p2[0] - p1[0]) * (pz - p1[1]) - (p2[1] - p1[1]) * (px - p1[0]);
  const side = cross >= 0 ? 1 : -1;

  return { t, projX, projZ, distance, side };
}

/**
 * Evaluates candidate wall surfaces for wall-run entry.
 */
export function evaluateWallRunEntry(
  pos: [number, number, number],
  velocity: [number, number], // [vx, vz]
  grounded: boolean,
  wallSurfaces: WallSurface[],
): { canEnter: boolean; surface: WallSurface | null; directionSign: number } {
  const speed = Math.hypot(velocity[0], velocity[1]);
  if (speed < WALL_RUN_MIN_SPEED) {
    return { canEnter: false, surface: null, directionSign: 1 };
  }

  const vNormX = velocity[0] / speed;
  const vNormZ = velocity[1] / speed;

  for (const surface of wallSurfaces) {
    // Check height range (with generous margin while airborne or on ramp)
    if (pos[1] < surface.yBottom - 0.2 || pos[1] > surface.yTop + 0.8) {
      continue;
    }

    const { t, distance } = projectPointOnSegment(pos[0], pos[2], surface.p1, surface.p2);
    // Must be within segment bounds [0.05, 0.95] and close enough to the wall
    if (t < 0.04 || t > 0.96 || distance > WALL_RUN_DETECTION_DIST) {
      continue;
    }

    // Check angle between player velocity and wall tangent
    const dotTangent = vNormX * surface.tangent[0] + vNormZ * surface.tangent[1];
    // Angle with outward normal: player should be approaching from the active normal side
    const dotNormal = vNormX * surface.normal[0] + vNormZ * surface.normal[1];

    // Must be moving somewhat along the wall (abs(dotTangent) > 0.35)
    // and not flying directly away from the normal (dotNormal < 0.6)
    if (Math.abs(dotTangent) > 0.32 && dotNormal < 0.65) {
      const directionSign = dotTangent >= 0 ? 1 : -1;
      return { canEnter: true, surface, directionSign };
    }
  }

  return { canEnter: false, surface: null, directionSign: 1 };
}

/**
 * Updates an active wall-run state and returns the constrained position and velocity.
 */
export function stepWallRun(
  state: WallRunState,
  pos: [number, number, number],
  delta: number,
): {
  continueRun: boolean;
  newPos: [number, number, number];
  newVelocity: [number, number, number];
  rotationY: number;
} {
  if (!state.active || !state.surface) {
    return {
      continueRun: false,
      newPos: pos,
      newVelocity: [0, 0, 0],
      rotationY: 0,
    };
  }

  state.duration += delta;
  if (state.duration > WALL_RUN_MAX_DURATION) {
    state.active = false;
    return {
      continueRun: false,
      newPos: pos,
      newVelocity: [
        state.surface.tangent[0] * state.directionSign * state.speed * 0.75,
        -0.5,
        state.surface.tangent[1] * state.directionSign * state.speed * 0.75,
      ],
      rotationY: Math.atan2(
        state.surface.tangent[0] * state.directionSign,
        state.surface.tangent[1] * state.directionSign,
      ),
    };
  }

  // Smooth acceleration up to target running speed
  state.speed = Math.min(
    WALL_RUN_TARGET_SPEED,
    state.speed + (WALL_RUN_TARGET_SPEED - state.speed) * (1 - Math.exp(-6 * delta)),
  );

  const surface = state.surface;
  const { t, projX, projZ } = projectPointOnSegment(pos[0], pos[2], surface.p1, surface.p2);

  // If reached end of wall segment, smoothly dismount with forward speed
  if (
    (state.directionSign > 0 && t >= 0.96) ||
    (state.directionSign < 0 && t <= 0.04)
  ) {
    state.active = false;
    return {
      continueRun: false,
      newPos: pos,
      newVelocity: [
        surface.tangent[0] * state.directionSign * state.speed * 1.05,
        1.8,
        surface.tangent[1] * state.directionSign * state.speed * 1.05,
      ],
      rotationY: Math.atan2(
        surface.tangent[0] * state.directionSign,
        surface.tangent[1] * state.directionSign,
      ),
    };
  }

  // Move along the tangent
  const moveDistance = state.speed * state.directionSign * delta;
  const targetX = projX + surface.tangent[0] * moveDistance;
  const targetZ = projZ + surface.tangent[1] * moveDistance;

  // Standoff position: perpendicular to wall by WALL_STANDOFF along the normal
  const constrainedX = targetX + surface.normal[0] * WALL_STANDOFF;
  const constrainedZ = targetZ + surface.normal[1] * WALL_STANDOFF;

  // Gentle vertical stabilization: slightly counter gravity during sprint
  const subtleDescent = -0.35 * delta;
  const newY = Math.max(surface.yBottom + 0.1, Math.min(surface.yTop + 0.5, pos[1] + subtleDescent));

  const runYaw = Math.atan2(
    surface.tangent[0] * state.directionSign,
    surface.tangent[1] * state.directionSign,
  );

  return {
    continueRun: true,
    newPos: [constrainedX, newY, constrainedZ],
    newVelocity: [
      surface.tangent[0] * state.directionSign * state.speed,
      subtleDescent / delta,
      surface.tangent[1] * state.directionSign * state.speed,
    ],
    rotationY: runYaw,
  };
}

/**
 * Calculates a dynamic wall jump impulse pushing away from the wall normal
 * and forward along the run direction with strong upward lift.
 */
export function computeWallJumpImpulse(
  surface: WallSurface,
  directionSign: number,
): [number, number, number] {
  const normalPush = 4.8;
  const forwardPush = 3.6;
  const upwardLift = 6.85;

  const vx = surface.normal[0] * normalPush + surface.tangent[0] * directionSign * forwardPush;
  const vy = upwardLift;
  const vz = surface.normal[1] * normalPush + surface.tangent[1] * directionSign * forwardPush;

  return [vx, vy, vz];
}

/**
 * Finds the best eligible homing target within range and viewing cone.
 */
export function findBestHomingTarget(
  playerPos: [number, number, number],
  facingDir: [number, number], // [fx, fz] normalized
  targets: HomingTarget[],
  isGrounded: boolean,
): HomingLock | null {
  let bestTarget: HomingTarget | null = null;
  let bestDistance = HOMING_MAX_RANGE;
  let bestAngle = HOMING_MAX_ANGLE;
  let bestDir: [number, number, number] = [0, 0, 0];

  for (const target of targets) {
    if (!target.active) continue;

    const dx = target.position[0] - playerPos[0];
    const dy = target.position[1] - playerPos[1];
    const dz = target.position[2] - playerPos[2];
    const dist = Math.hypot(dx, dy, dz);

    if (dist < 0.6 || dist > HOMING_MAX_RANGE) continue;

    // Planar angle between facing direction and target vector
    const planarDist = Math.hypot(dx, dz);
    if (planarDist < 1e-4) continue;

    const targetDirX = dx / planarDist;
    const targetDirZ = dz / planarDist;
    const dot = targetDirX * facingDir[0] + targetDirZ * facingDir[1];
    const angle = Math.acos(Math.max(-1, Math.min(1, dot)));

    // Weight by distance and central focus angle
    if (angle <= HOMING_MAX_ANGLE) {
      const score = dist + angle * 2.5;
      const bestScore = bestDistance + bestAngle * 2.5;
      if (score < bestScore) {
        bestTarget = target;
        bestDistance = dist;
        bestAngle = angle;
        bestDir = [dx / dist, dy / dist, dz / dist];
      }
    }
  }

  if (!bestTarget) return null;

  return {
    target: bestTarget,
    distance: bestDistance,
    direction: bestDir,
    angleToFacing: bestAngle,
    eligible: true,
  };
}

/**
 * Computes a smooth curved homing trajectory toward the target.
 * Uses a dynamic hermite curve that vaults upward then strikes cleanly into the target.
 */
export function stepHomingArc(
  state: HomingArcState,
  delta: number,
): { finished: boolean; currentPos: [number, number, number]; rotationY: number } {
  state.elapsed += delta;
  const t = Math.min(1, state.elapsed / state.totalDuration);

  // Smooth step interpolation
  const smoothT = t * t * (3 - 2 * t);

  // Linear position
  const lx = state.startPos[0] + (state.targetPos[0] - state.startPos[0]) * smoothT;
  const lz = state.startPos[2] + (state.targetPos[2] - state.startPos[2]) * smoothT;

  // Arc height: bell curve peaking at t = 0.45
  const arcHeight = Math.sin(t * Math.PI) * 0.72;
  const ly =
    state.startPos[1] +
    (state.targetPos[1] - state.startPos[1]) * smoothT +
    arcHeight;

  const dx = state.targetPos[0] - state.startPos[0];
  const dz = state.targetPos[2] - state.startPos[2];
  const yaw = Math.atan2(dx, dz);

  const finished = t >= 1;
  if (finished) state.active = false;

  return {
    finished,
    currentPos: [lx, ly, lz],
    rotationY: yaw,
  };
}

/**
 * Initializes a homing arc toward a chosen target.
 */
export function startHomingArc(
  startPos: [number, number, number],
  targetPos: [number, number, number],
): HomingArcState {
  const dist = Math.hypot(
    targetPos[0] - startPos[0],
    targetPos[1] - startPos[1],
    targetPos[2] - startPos[2],
  );
  const duration = Math.max(0.24, Math.min(0.52, dist / HOMING_SPEED));

  return {
    active: true,
    targetId: null,
    startPos: [...startPos],
    targetPos: [...targetPos],
    elapsed: 0,
    totalDuration: duration,
  };
}
