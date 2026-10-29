export type Platform = {
  id: string;
  x: number;
  z: number;
  top: number;
  halfX: number;
  halfZ: number;
  kind: "home" | "path" | "checkpoint" | "finish";
  lessonId?: string;
};

export type Barrier = { id?: string; x: number; z: number; top: number; halfX: number; halfZ: number };
export type EnvironmentProp = {
  id: string;
  asset: "tree1" | "tree2" | "tree3" | "bush" | "fern" | "flowers" | "rocks";
  position: [number, number, number];
  scale: number;
  rotationY: number;
  blocksPlayer: boolean;
  blocksNpc: boolean;
  collision?: { halfX: number; halfZ: number; top: number };
};

export const LAYOUT_SEED = 20261021;
export function createSeededRandom(seed = LAYOUT_SEED) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

// A continuous, expansive mainland landscape connecting the Sanctuary meadow,
// central Woodland stream, and Western elevated ridge overlook.
export const WORLD_SURFACE: Platform = { id: "mainland", x: -14, z: 0, top: 0, halfX: 30, halfZ: 22, kind: "home" };
export const PLAYER_START: [number, number, number] = [0, 0, 0];
export const GUIDE_START: [number, number, number] = [0.5, 0, 1.35];
export const CHECKPOINT_START: [number, number, number] = [PLAYER_START[0], PLAYER_START[1], PLAYER_START[2]];

export const PLATFORMS: Platform[] = [
  { id: "home", x: -14, z: 0, top: 0, halfX: 30, halfZ: 22, kind: "home" },
  { id: "inventory", x: -4.2, z: -2.1, top: 0, halfX: 1.5, halfZ: 1.5, kind: "path", lessonId: "inventory" },
  { id: "exposure", x: -8.4, z: -2.8, top: 0, halfX: 1.5, halfZ: 1.5, kind: "path", lessonId: "exposure" },
  { id: "priority", x: -12.5, z: -0.1, top: 0, halfX: 1.6, halfZ: 1.6, kind: "checkpoint", lessonId: "priority" },
  { id: "accounts", x: -17, z: -2.6, top: 0, halfX: 1.5, halfZ: 1.5, kind: "path", lessonId: "accounts" },
  { id: "recovery", x: -21.8, z: -4, top: 0, halfX: 1.6, halfZ: 1.6, kind: "path", lessonId: "recovery" },
  { id: "finish", x: -27, z: -1.2, top: 0, halfX: 2, halfZ: 2, kind: "finish" },
];

// Hand-authored groves and clearings. Blocking footprints are the same data
// used for both Rapier colliders and the deterministic placement audit.
export const ENVIRONMENT_PROPS: EnvironmentProp[] = [
  { id: "welcome-grove-west", asset: "tree1", position: [-2.2, 0, 4.8], scale: 0.62, rotationY: -0.4, blocksPlayer: true, blocksNpc: true, collision: { halfX: 0.32, halfZ: 0.32, top: 1.9 } },
  { id: "welcome-grove-north", asset: "tree2", position: [-4.2, 0, 5.4], scale: 0.68, rotationY: 0.8, blocksPlayer: true, blocksNpc: true, collision: { halfX: 0.35, halfZ: 0.35, top: 2.1 } },
  { id: "pond-tree-1", asset: "tree3", position: [-6.4, 0, 8.0], scale: 0.64, rotationY: 1.1, blocksPlayer: true, blocksNpc: true, collision: { halfX: 0.34, halfZ: 0.34, top: 2 } },
  { id: "pond-tree-2", asset: "tree1", position: [-12.0, 0, 7.7], scale: 0.7, rotationY: -0.8, blocksPlayer: true, blocksNpc: true, collision: { halfX: 0.36, halfZ: 0.36, top: 2.2 } },
  { id: "woodland-1", asset: "tree2", position: [-9.4, 0, -7], scale: 0.7, rotationY: -0.2, blocksPlayer: true, blocksNpc: true, collision: { halfX: 0.36, halfZ: 0.36, top: 2.2 } },
  { id: "woodland-2", asset: "tree3", position: [-11.4, 0, -7.7], scale: 0.64, rotationY: 0.5, blocksPlayer: true, blocksNpc: true, collision: { halfX: 0.34, halfZ: 0.34, top: 2 } },
  { id: "woodland-3", asset: "tree1", position: [-13.8, 0, -7.3], scale: 0.72, rotationY: 1.4, blocksPlayer: true, blocksNpc: true, collision: { halfX: 0.37, halfZ: 0.37, top: 2.3 } },
  { id: "woodland-4", asset: "tree2", position: [-15.3, 0, -6.4], scale: 0.67, rotationY: -1.2, blocksPlayer: true, blocksNpc: true, collision: { halfX: 0.35, halfZ: 0.35, top: 2.1 } },
  { id: "overlook-1", asset: "tree3", position: [-19.3, 0, -8.6], scale: 0.74, rotationY: 0.3, blocksPlayer: true, blocksNpc: true, collision: { halfX: 0.38, halfZ: 0.38, top: 2.4 } },
  { id: "overlook-2", asset: "tree1", position: [-23.5, 0, -8], scale: 0.7, rotationY: 1.1, blocksPlayer: true, blocksNpc: true, collision: { halfX: 0.36, halfZ: 0.36, top: 2.2 } },
  { id: "flower-meadow-west", asset: "flowers", position: [-3.5, 0, -5.4], scale: 0.6, rotationY: 0.4, blocksPlayer: false, blocksNpc: false },
  { id: "flower-meadow-east", asset: "flowers", position: [-5.5, 0, -5.7], scale: 0.52, rotationY: 2.1, blocksPlayer: false, blocksNpc: false },
  { id: "flower-meadow-accounts", asset: "flowers", position: [-17.8, 0, 1.5], scale: 0.65, rotationY: -0.7, blocksPlayer: false, blocksNpc: false },
  { id: "flower-finish", asset: "flowers", position: [-29.2, 0, 2.2], scale: 0.55, rotationY: 0.8, blocksPlayer: false, blocksNpc: false },
  { id: "fern-pond-1", asset: "fern", position: [-5.1, 0, 8.4], scale: 0.62, rotationY: 0.7, blocksPlayer: false, blocksNpc: false },
  { id: "fern-pond-2", asset: "fern", position: [-9.8, 0, 8.5], scale: 0.55, rotationY: -0.4, blocksPlayer: false, blocksNpc: false },
  { id: "bush-woodland", asset: "bush", position: [-10.1, 0, -4.8], scale: 0.58, rotationY: 0.2, blocksPlayer: true, blocksNpc: true, collision: { halfX: 0.45, halfZ: 0.45, top: 0.8 } },
  { id: "rock-stream-west", asset: "rocks", position: [-4.8, 0, 6.6], scale: 0.62, rotationY: 0.5, blocksPlayer: true, blocksNpc: true, collision: { halfX: 0.4, halfZ: 0.38, top: 0.55 } },
  { id: "rock-stream-east", asset: "rocks", position: [-12.8, 0, 5.8], scale: 0.55, rotationY: 1.7, blocksPlayer: true, blocksNpc: true, collision: { halfX: 0.35, halfZ: 0.34, top: 0.5 } },
];

export const BARRIERS: Barrier[] = ENVIRONMENT_PROPS
  .filter((prop) => prop.blocksPlayer && prop.collision)
  .map((prop) => ({ id: prop.id, x: prop.position[0], z: prop.position[2], ...prop.collision! }))
  .concat([
    { id: "service-hub", x: 3.2, z: 3.6, top: 2.5, halfX: 1.1, halfZ: 0.85 },
    { id: "checkpoint-flag", x: -10.5, z: 1.7, top: 1.5, halfX: 0.12, halfZ: 0.12 },
    { id: "recovery-chest", x: -25.4, z: -0.2, top: 1.1, halfX: 0.45, halfZ: 0.42 },
    { id: "recovery-flag", x: -25.5, z: -2.6, top: 1.5, halfX: 0.12, halfZ: 0.12 },
  ]);

export const TOKEN_POSITIONS: Record<string, [number, number, number]> = {
  inventory: [-4.2, 0.9, -2.1],
  exposure: [-8.4, 0.9, -2.8],
  priority: [-12.5, 0.9, -0.1],
  accounts: [-17, 0.9, -2.6],
  recovery: [-21.8, 0.9, -4],
};

export function validateEnvironmentLayout() {
  const locations = [{ id: "player-start", x: PLAYER_START[0], z: PLAYER_START[2], radius: 0.35 }, { id: "guide-rest", x: GUIDE_START[0], z: GUIDE_START[2], radius: 0.35 }, ...PLATFORMS.filter((p) => p.lessonId).map((p) => ({ id: `lesson:${p.lessonId}`, x: p.x, z: p.z, radius: 0.8 }))];
  const errors: string[] = [];
  for (const barrier of BARRIERS) {
    for (const location of locations) {
      const inside = Math.abs(location.x - barrier.x) < location.radius + barrier.halfX && Math.abs(location.z - barrier.z) < location.radius + barrier.halfZ;
      if (inside) errors.push(`${barrier.id ?? "barrier"} overlaps ${location.id} at (${barrier.x}, ${barrier.z})`);
    }
  }
  return errors;
}

export type WallSurfaceData = {
  id: string;
  p1: [number, number];
  p2: [number, number];
  yBottom: number;
  yTop: number;
  normal: [number, number];
  tangent: [number, number];
};

export const WALL_RUN_SURFACES: WallSurfaceData[] = [
  {
    id: "river-terrace-wall",
    p1: [-11.0, 3.8],
    p2: [-14.4, 1.6],
    yBottom: 0,
    yTop: 2.2,
    normal: [0.54, 0.84],
    tangent: [-0.84, -0.54],
  },
  {
    id: "woodland-ridge-wall",
    p1: [-15.2, -3.2],
    p2: [-18.8, -4.6],
    yBottom: 0,
    yTop: 2.0,
    normal: [-0.36, 0.93],
    tangent: [-0.93, -0.36],
  },
];

export const ISLAND_EXCLUSIONS: Array<{ x: number; z: number; radius: number }> = [
  { x: PLAYER_START[0], z: PLAYER_START[2], radius: 2.4 },
  { x: GUIDE_START[0], z: GUIDE_START[2], radius: 2.0 },
  { x: 3.2, z: 3.6, radius: 2.6 }, // Service hub
  { x: -8.4, z: 5.1, radius: 4.2 }, // Pond clearing
  { x: -14.75, z: -1.35, radius: 2.2 }, // Bridge
  ...PLATFORMS.map((platform) => ({ x: platform.x, z: platform.z, radius: 2.2 })),
];

export type SpacedPointOptions = {
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  minDistance: number;
  exclusions: Array<{ x: number; z: number; radius: number }>;
  random?: () => number;
  maxAttempts?: number;
};

/**
 * 2D Poisson-disc / minimum-distance spatial spacing generator.
 * Enforces natural clearance around navigation corridors, lesson objectives,
 * water bodies, and existing solid landmarks.
 */
export function generateSpacedPoints(options: SpacedPointOptions): Array<[number, number]> {
  const {
    bounds,
    minDistance,
    exclusions,
    random = createSeededRandom(LAYOUT_SEED + 109),
    maxAttempts = 500,
  } = options;
  const points: Array<[number, number]> = [];
  const minDistanceSq = minDistance * minDistance;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const x = bounds.minX + random() * (bounds.maxX - bounds.minX);
    const z = bounds.minZ + random() * (bounds.maxZ - bounds.minZ);

    let insideExclusion = false;
    for (const ex of exclusions) {
      const dx = x - ex.x;
      const dz = z - ex.z;
      if (dx * dx + dz * dz < ex.radius * ex.radius) {
        insideExclusion = true;
        break;
      }
    }
    if (insideExclusion) continue;

    let tooClose = false;
    for (const [px, pz] of points) {
      const dx = x - px;
      const dz = z - pz;
      if (dx * dx + dz * dz < minDistanceSq) {
        tooClose = true;
        break;
      }
    }
    if (tooClose) continue;

    points.push([x, z]);
  }

  return points;
}


