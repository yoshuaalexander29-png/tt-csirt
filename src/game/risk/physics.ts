import RAPIER, { type Collider, type RigidBody } from "@dimforge/rapier3d-compat";

let rapierReady: Promise<void> | undefined;
const PLAYER_RADIUS = 0.24;
const PLAYER_HALF_HEIGHT = 0.42;
const FIXED_STEP = 1 / 60;
const MAX_FRAME_DELTA = 0.1;
const MAX_SUBSTEPS = 5;
const COYOTE_TIME = 0.1;
const JUMP_BUFFER_TIME = 0.12;

export type PhysicsSurface = { x: number; z: number; top: number; halfX: number; halfZ: number };
export type PhysicsBarrier = PhysicsSurface;
export type PhysicsHazard = { x: number; y: number; z: number; halfX: number; halfY: number; halfZ: number };
export type RiskPhysics = {
  world: RAPIER.World;
  body: RigidBody;
  collider: Collider;
  controller: RAPIER.KinematicCharacterController;
  step: (x: number, z: number, delta: number) => [number, number, number];
  jump: () => boolean;
  releaseJump: () => void;
  verticalVelocity: () => number;
  setVerticalVelocity: (vy: number) => void;
  setPosition: (point: [number, number, number]) => void;
  wallJump: (impulseVy: number) => void;
  isGrounded: () => boolean;
  respawn: (point: [number, number, number]) => void;
  hitHazard: () => boolean;
  dispose: () => void;
};

export async function createRiskPhysics(
  start: [number, number, number],
  surfaces: PhysicsSurface[],
  barriers: PhysicsBarrier[],
  hazards: PhysicsHazard[],
): Promise<RiskPhysics> {
  rapierReady ??= RAPIER.init();
  await rapierReady;

  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  const fixed = (descriptor: RAPIER.ColliderDesc) => world.createCollider(descriptor);

  for (const surface of surfaces) {
    fixed(
      RAPIER.ColliderDesc.cuboid(surface.halfX, 0.35, surface.halfZ)
        .setTranslation(surface.x, surface.top - 0.35, surface.z)
        .setFriction(0.9),
    );
  }
  for (const barrier of barriers) {
    fixed(
      RAPIER.ColliderDesc.cuboid(barrier.halfX, barrier.top / 2, barrier.halfZ)
        .setTranslation(barrier.x, barrier.top / 2, barrier.z)
        .setFriction(0.8),
    );
  }
  const hazardColliders = hazards.map((hazard) =>
    fixed(
      RAPIER.ColliderDesc.cuboid(hazard.halfX, hazard.halfY, hazard.halfZ)
        .setTranslation(hazard.x, hazard.y, hazard.z)
        .setSensor(true),
    ),
  );

  const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(start[0], start[1] + PLAYER_HALF_HEIGHT + PLAYER_RADIUS, start[2]),
  );
  const collider = world.createCollider(
    RAPIER.ColliderDesc.capsule(PLAYER_HALF_HEIGHT, PLAYER_RADIUS).setFriction(0.2),
    body,
  );
  const controller = world.createCharacterController(0.035);
  controller.setUp({ x: 0, y: 1, z: 0 });
  controller.setOffset(0.035);
  controller.setMaxSlopeClimbAngle(0.64);
  controller.setMinSlopeSlideAngle(0.84);
  controller.enableAutostep(0.2, 0.16, true);
  controller.enableSnapToGround(0.18);
  controller.setSlideEnabled(true);

  let verticalSpeed = 0;
  let grounded = false;
  let coyoteTime = 0;
  let jumpBuffer = 0;
  let accumulator = 0;
  const initialPosition = body.translation();
  let currentPosition = { x: initialPosition.x, y: initialPosition.y, z: initialPosition.z };
  const step = (x: number, z: number, delta: number): [number, number, number] => {
    accumulator = Math.min(accumulator + Math.min(Math.max(delta, 0), MAX_FRAME_DELTA), FIXED_STEP * MAX_SUBSTEPS);
    let substeps = 0;
    while (accumulator >= FIXED_STEP && substeps < MAX_SUBSTEPS) {
      accumulator -= FIXED_STEP;
      substeps += 1;
      coyoteTime = grounded ? COYOTE_TIME : Math.max(0, coyoteTime - FIXED_STEP);
      jumpBuffer = Math.max(0, jumpBuffer - FIXED_STEP);
      if (jumpBuffer > 0 && coyoteTime > 0) {
        verticalSpeed = 7.25;
        grounded = false;
        coyoteTime = 0;
        jumpBuffer = 0;
      }

      verticalSpeed = Math.max(-18, verticalSpeed - 17 * FIXED_STEP);
      const bodyPosition = body.translation();
      const desired = { x: x * FIXED_STEP, y: verticalSpeed * FIXED_STEP, z: z * FIXED_STEP };
      controller.computeColliderMovement(collider, desired, RAPIER.QueryFilterFlags.EXCLUDE_SENSORS);
      const movement = controller.computedMovement();
      grounded = controller.computedGrounded();
      if (grounded && verticalSpeed < 0) verticalSpeed = 0;
      body.setNextKinematicTranslation({
        x: bodyPosition.x + movement.x,
        y: bodyPosition.y + movement.y,
        z: bodyPosition.z + movement.z,
      });
      world.timestep = FIXED_STEP;
      world.step();
      const settled = body.translation();
      currentPosition = { x: settled.x, y: settled.y, z: settled.z };
    }

    return [currentPosition.x, currentPosition.y - PLAYER_HALF_HEIGHT - PLAYER_RADIUS, currentPosition.z];
  };

  const jump = () => {
    if (grounded || coyoteTime > 0) {
      verticalSpeed = 7.25;
      grounded = false;
      coyoteTime = 0;
      jumpBuffer = 0;
      return true;
    }
    if (verticalSpeed < 0) {
      jumpBuffer = JUMP_BUFFER_TIME;
      return true;
    }
    return false;
  };

  const releaseJump = () => {
    if (verticalSpeed > 0) verticalSpeed *= 0.48;
  };

  const respawn = (point: [number, number, number]) => {
    verticalSpeed = 0;
    grounded = false;
    coyoteTime = 0;
    jumpBuffer = 0;
    accumulator = 0;
    body.setTranslation({ x: point[0], y: point[1] + PLAYER_HALF_HEIGHT + PLAYER_RADIUS, z: point[2] }, true);
    body.setNextKinematicTranslation({ x: point[0], y: point[1] + PLAYER_HALF_HEIGHT + PLAYER_RADIUS, z: point[2] });
    currentPosition = { x: point[0], y: point[1] + PLAYER_HALF_HEIGHT + PLAYER_RADIUS, z: point[2] };
  };

  const hitHazard = () => {
    const position = body.translation();
    return hazards.some((hazard) =>
      Math.abs(position.x - hazard.x) < hazard.halfX + PLAYER_RADIUS &&
      Math.abs(position.z - hazard.z) < hazard.halfZ + PLAYER_RADIUS &&
      Math.abs(position.y - hazard.y) < PLAYER_HALF_HEIGHT + PLAYER_RADIUS + hazard.halfY,
    );
  };

  const setVerticalVelocity = (vy: number) => {
    verticalSpeed = vy;
  };

  const setPosition = (point: [number, number, number]) => {
    body.setTranslation(
      {
        x: point[0],
        y: point[1] + PLAYER_HALF_HEIGHT + PLAYER_RADIUS,
        z: point[2],
      },
      true,
    );
    body.setNextKinematicTranslation({
      x: point[0],
      y: point[1] + PLAYER_HALF_HEIGHT + PLAYER_RADIUS,
      z: point[2],
    });
    currentPosition = {
      x: point[0],
      y: point[1] + PLAYER_HALF_HEIGHT + PLAYER_RADIUS,
      z: point[2],
    };
  };

  const wallJump = (impulseVy: number) => {
    verticalSpeed = impulseVy;
    grounded = false;
    coyoteTime = 0;
    jumpBuffer = 0;
  };

  return {
    world,
    body,
    collider,
    controller,
    step,
    jump,
    releaseJump,
    verticalVelocity: () => verticalSpeed,
    setVerticalVelocity,
    setPosition,
    wallJump,
    isGrounded: () => grounded,
    respawn,
    hitHazard,
    dispose: () => world.free(),
  };
}









