import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import {
  ZeldaTiltShiftShader,
  createZeldaLagoonMaterial,
} from "@/game/risk/diorama-shaders";
import {
  createSculptedTree,
  createSculptedShrub,
  createSculptedFern,
  computeWorldPerches,
} from "@/game/risk/stylized-vegetation";
import {
  createCharacter,
  loadAuthoredCharacter,
  type AuthoredCharacter,
  type AnimatedCharacter,
} from "@/game/risk/character";
import { createMeadowGrass } from "@/game/risk/grass";
import { LESSONS } from "@/game/risk/lessons";
import {
  BARRIERS,
  CHECKPOINT_START,
  createSeededRandom,
  ENVIRONMENT_PROPS,
  GUIDE_START,
  LAYOUT_SEED,
  PLAYER_START,
  PLATFORMS,
  TOKEN_POSITIONS,
  validateEnvironmentLayout,
  WALL_RUN_SURFACES,
  WORLD_SURFACE,
  generateSpacedPoints,
} from "@/game/risk/level";
import { createRiskPhysics, type RiskPhysics } from "@/game/risk/physics";
import { createTrailMarker, type TrailMarker } from "@/game/risk/trailMarker";
import { DustEmitter, edgeIndicator, squashScale, stepSpring, type DustParticle } from "@/game/risk/feel";
import { createMeadowBirds } from "@/game/risk/wildlife";
import {
  evaluateWallRunEntry,
  stepWallRun,
  computeWallJumpImpulse,
  findBestHomingTarget,
  stepHomingArc,
  startHomingArc,
  type WallSurface,
  type HomingTarget,
  type HomingLock,
  type WallRunState,
  type HomingArcState,
  type MovementState,
} from "@/game/risk/traversal";

type Phase = "workshop" | "opening" | "walking" | "question" | "feedback" | "paused" | "complete";
type Choice = { id: string; label: string };
type Sfx = "jump" | "collect" | "checkpoint" | "fall" | "finish";
type Engine = {
  dispose: () => void;
  start: () => void;
  move: (source: string, x: number, z: number) => void;
  releaseMove: (source: string) => void;
  jump: () => void;
  releaseJump: () => void;
  homing: () => void;
  pause: () => void;
  select: (index: number, tint: string) => void;
  tint: (colour: string) => void;
  sound: (enabled: boolean) => void;
  sfx: (kind: Sfx) => void;
};
type Snapshot = {
  phase: Phase;
  player: [number, number, number];
  grounded: boolean;
  movementState?: MovementState;
  hasTargetLock?: boolean;
  checkpoint: [number, number, number];
  collected: number;
  completedLessons: number;
  objective: string;
};
type Callbacks = {
  phase: Phase;
  solved: string[];
  collected: string[];
  nearby: (id: string | null) => void;
  lock: (lock: HomingLock | null) => void;
  state: (st: MovementState) => void;
  objective: string;
};

declare global {
  interface Window {
    render_game_to_text?: () => string;
  }
}

const ROOT = "/assets/game/kenney/";
const CHARACTERS: Choice[] = [
  { id: "copper", label: "Copper" },
  { id: "amber", label: "Golden" },
  { id: "rose", label: "Rose" },
  { id: "teal", label: "Teal" },
  { id: "plum", label: "Plum" },
];
const CHARACTER_TINTS = ["#c96d52", "#d5994c", "#bb6687", "#4c9d91", "#8669a9"];
const TINTS = [
  { label: "Original colours", colour: "#ffffff" },
  { label: "Sea glass", colour: "#d7f1e9" },
  { label: "Sunshine", colour: "#fff0ce" },
];
const STATIC_MODELS = [
  "block-grass.glb",
  "block-grass-large.glb",
  "coin-gold.glb",
  "flag.glb",
  "chest.glb",
  "tree.glb",
  "flowers.glb",
  "rocks.glb",
  "mushrooms.glb",
  "spring.glb",
  "sign.glb",
  "crate-strong.glb",
  "character-oobi.glb",
  "character-oodi.glb",
  "character-ooli.glb",
  "character-oopi.glb",
  "character-oozi.glb",
];
const PLAYER_MODELS = [
  "character-oobi.glb",
  "character-oodi.glb",
  "character-ooli.glb",
  "character-oopi.glb",
  "character-oozi.glb",
];
const ROUTE_FORWARD = new THREE.Vector3(PLATFORMS[1].x - PLAYER_START[0], 0, PLATFORMS[1].z - PLAYER_START[2]).normalize();
const SCREEN_RIGHT = new THREE.Vector3(-ROUTE_FORWARD.z, 0, ROUTE_FORWARD.x);

function createMainlandLandscape(scene: THREE.Scene) {
  const group = new THREE.Group();
  group.name = "expansive-mainland-landscape";

  const grassMaterial = new THREE.MeshPhysicalMaterial({
    color: "#52ab44",
    roughness: 0.54,
    metalness: 0.02,
    clearcoat: 0.1,
    clearcoatRoughness: 0.35,
    reflectivity: 0.45,
  });

  const ridgeGrassMaterial = new THREE.MeshPhysicalMaterial({
    color: "#469c3a",
    roughness: 0.52,
    metalness: 0.02,
    clearcoat: 0.12,
  });

  const cliffMaterial = new THREE.MeshPhysicalMaterial({
    color: "#7e624b",
    roughness: 0.72,
    metalness: 0.03,
  });

  const stoneStepMat = new THREE.MeshStandardMaterial({
    color: "#c8bea8",
    roughness: 0.62,
    metalness: 0.02,
  });

  // 1. Primary Walkable Mainland Landmass (60m x 44m, top flush at y = 0, depth 1.4m)
  const terrainMaterials = [
    cliffMaterial, // +x
    cliffMaterial, // -x
    grassMaterial, // +y (top meadow turf)
    cliffMaterial, // -y
    cliffMaterial, // +z
    cliffMaterial, // -z
  ];
  const land = new THREE.Mesh(new THREE.BoxGeometry(60, 1.4, 44), terrainMaterials);
  land.position.set(-14, -0.7, 0);
  land.receiveShadow = true;
  land.castShadow = true;
  land.name = "walkable-mainland-terrain";
  group.add(land);

  // 2. Area C: Elevated Ridge Terrace at Y = 1.85m
  // Spanning X: -6 to -23, Z: 6.0 to 13.0 (halfX = 8.5, halfZ = 3.5, center [-14.5, 9.5])
  const ridgeBaseGeo = new THREE.BoxGeometry(17, 1.85, 7);
  const ridgeMaterials = [
    cliffMaterial,
    cliffMaterial,
    ridgeGrassMaterial,
    cliffMaterial,
    cliffMaterial,
    cliffMaterial,
  ];
  const ridgeMesh = new THREE.Mesh(ridgeBaseGeo, ridgeMaterials);
  ridgeMesh.position.set(-14.5, 0.925, 9.5);
  ridgeMesh.receiveShadow = true;
  ridgeMesh.castShadow = true;
  ridgeMesh.name = "elevated-ridge-terrace";
  group.add(ridgeMesh);

  // Stepped rock retaining blocks along the south ridge boundary
  const retainingStoneMat = new THREE.MeshStandardMaterial({ color: "#746c62", roughness: 0.7 });
  const ridgeRetainingBlocks = [
    [-21.5, 0.5, 6.1, 2.4, 1.1, 0.8, 0.05],
    [-18.5, 0.6, 6.0, 2.6, 1.3, 0.85, -0.08],
    [-15.2, 0.7, 5.9, 2.8, 1.5, 0.85, 0.04],
    [-11.8, 0.8, 6.0, 2.6, 1.7, 0.85, -0.06],
    [-8.5, 0.85, 6.2, 2.5, 1.8, 0.8, 0.12],
  ];
  ridgeRetainingBlocks.forEach(([bx, by, bz, lx, ly, lz, ry]) => {
    const block = new THREE.Mesh(new THREE.BoxGeometry(lx, ly, lz), retainingStoneMat);
    block.position.set(bx, by, bz);
    block.rotation.y = ry;
    block.castShadow = true;
    block.receiveShadow = true;
    group.add(block);
  });

  // 3. Wide Natural Flagstone Ridge Access Stairs (East Meadow to Upper Terrace)
  const ridgeStairs = [
    { x: -6.2, y: 0.18, z: 9.5, w: 1.8, h: 0.36, d: 0.8 },
    { x: -6.8, y: 0.54, z: 9.5, w: 1.8, h: 0.36, d: 0.8 },
    { x: -7.4, y: 0.90, z: 9.5, w: 1.8, h: 0.36, d: 0.8 },
    { x: -8.0, y: 1.26, z: 9.5, w: 1.8, h: 0.36, d: 0.8 },
    { x: -8.6, y: 1.62, z: 9.5, w: 1.8, h: 0.36, d: 0.8 },
  ];
  ridgeStairs.forEach((st) => {
    const step = new THREE.Mesh(new THREE.BoxGeometry(st.d, st.h, st.w), stoneStepMat);
    step.position.set(st.x, st.y, st.z);
    step.castShadow = true;
    step.receiveShadow = true;
    group.add(step);
  });

  // 4. Western Gentle Terrace Ramp descending into Western Lower Landing
  const rampGeo = new THREE.BoxGeometry(4.2, 0.6, 3.8);
  const rampMesh = new THREE.Mesh(rampGeo, ridgeMaterials);
  rampMesh.position.set(-22.8, 0.95, 8.8);
  rampMesh.rotation.z = 0.28;
  rampMesh.castShadow = true;
  rampMesh.receiveShadow = true;
  group.add(rampMesh);

  scene.add(group);
  return land;
}

const BRIDGE_CENTER: [number, number] = [-14.75, -1.35];
const BRIDGE_SURFACE = { x: BRIDGE_CENTER[0], z: BRIDGE_CENTER[1], top: 0.12, halfX: 1.78, halfZ: 1.78 };

function createMeadowTrail(scene: THREE.Scene) {
  const route = PLATFORMS.map((point) => new THREE.Vector3(point.x, 0.015, point.z));
  const curve = new THREE.CatmullRomCurve3(route, false, "centripetal", 0.25);
  const vertices: number[] = [], indices: number[] = [];
  const count = 140, baseHalfWidth = 0.78;
  for (let index = 0; index <= count; index += 1) {
    const t = index / count, point = curve.getPoint(t), tangent = curve.getTangent(t);
    const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const widthVariation = baseHalfWidth * (0.88 + 0.18 * Math.sin(index * 0.45));
    vertices.push(
      point.x - side.x * widthVariation, point.y, point.z - side.z * widthVariation,
      point.x + side.x * widthVariation, point.y, point.z + side.z * widthVariation
    );
    if (index < count) {
      const base = index * 2;
      indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const trailMat = new THREE.MeshPhysicalMaterial({
    color: "#cbab7c",
    roughness: 0.65,
    metalness: 0.02,
    clearcoat: 0.15,
    clearcoatRoughness: 0.35,
    side: THREE.DoubleSide,
  });
  const trail = new THREE.Mesh(geometry, trailMat);
  trail.name = "winding-meadow-trail";
  trail.receiveShadow = true;
  scene.add(trail);
}

function createRiverAndBridge(scene: THREE.Scene, streamMat?: THREE.Material) {
  const riverPath = [
    new THREE.Vector3(-8.4, 0, 5.1), new THREE.Vector3(-11.8, 0, 4.2), new THREE.Vector3(-14, 0, 2.4),
    new THREE.Vector3(-15.4, 0, -0.1), new THREE.Vector3(BRIDGE_CENTER[0], 0, BRIDGE_CENTER[1]),
    new THREE.Vector3(-14.2, 0, -2.3), new THREE.Vector3(-13, 0, -4.6), new THREE.Vector3(-11.7, 0, -7.4),
  ];
  const curve = new THREE.CatmullRomCurve3(riverPath, false, "centripetal", 0.35);

  const buildRibbon = (halfWidth: number, y: number, material: THREE.Material, name: string) => {
    const vertices: number[] = [], indices: number[] = [], segments = 96;
    for (let index = 0; index <= segments; index += 1) {
      const t = index / segments, point = curve.getPoint(t), tangent = curve.getTangent(t);
      const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const taper = Math.min(1, 0.4 + Math.min(t, 1 - t) * 3.8);
      const width = halfWidth * taper * (0.92 + 0.1 * Math.sin(index * 0.71));
      vertices.push(point.x - side.x * width, y, point.z - side.z * width, point.x + side.x * width, y, point.z + side.z * width);
      if (index < segments) {
        const base = index * 2;
        indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.receiveShadow = true;
    scene.add(mesh);
  };

  // 1. Carved Sunken Riverbed (Dark gravel and silt depression)
  buildRibbon(
    0.95,
    -0.16,
    new THREE.MeshStandardMaterial({ color: "#544332", roughness: 0.85, side: THREE.DoubleSide }),
    "carved-river-bed"
  );

  // 2. Sloped Pebble Banks (Naturally frames water channel below turf level)
  buildRibbon(
    1.18,
    -0.02,
    new THREE.MeshPhysicalMaterial({ color: "#c9ad84", roughness: 0.68, clearcoat: 0.15, side: THREE.DoubleSide }),
    "soft-river-bank"
  );

  // 3. Crystal Turquoise Caustic Water (Sunken at y = -0.06m within riverbed)
  const waterMaterial = streamMat ?? new THREE.MeshPhysicalMaterial({
    color: "#34ccd8",
    roughness: 0.16,
    metalness: 0.04,
    clearcoat: 0.95,
    clearcoatRoughness: 0.08,
    side: THREE.DoubleSide,
  });
  buildRibbon(0.82, -0.06, waterMaterial, "winding-woodland-stream");

  // 4. Smooth River Stones & Boulders along meanders
  const riverStoneMat = new THREE.MeshStandardMaterial({ color: "#746e66", roughness: 0.65 });
  const riverStones = [
    [-9.8, -0.04, 4.6, 0.28, 0.2, 0.24],
    [-12.6, -0.05, 3.5, 0.32, 0.22, 0.28],
    [-15.6, -0.05, 0.8, 0.25, 0.18, 0.22],
    [-13.8, -0.04, -3.2, 0.35, 0.24, 0.3],
    [-12.2, -0.05, -5.8, 0.28, 0.19, 0.25],
  ];
  riverStones.forEach(([rx, ry, rz, sx, sy, sz]) => {
    const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 1), riverStoneMat);
    stone.position.set(rx, ry, rz);
    stone.scale.set(sx, sy, sz);
    stone.receiveShadow = true;
    stone.castShadow = true;
    stone.name = "river-stepping-stone";
    scene.add(stone);
  });

  // 5. Solid Timber Bridge Anchored into Heavy Stone Masonry Abutments
  const bridge = new THREE.Group();
  bridge.position.set(BRIDGE_CENTER[0], 0, BRIDGE_CENTER[1]);
  bridge.rotation.y = Math.atan2(2.5, -4.5);
  bridge.name = "timber-stream-bridge";

  const stoneAbutmentMat = new THREE.MeshStandardMaterial({ color: "#7a766e", roughness: 0.65 });
  const wood = new THREE.MeshPhysicalMaterial({ color: "#8a573b", roughness: 0.42, clearcoat: 0.2 });
  const plank = new THREE.MeshPhysicalMaterial({ color: "#ac754b", roughness: 0.38, clearcoat: 0.18 });
  const ironBoltMat = new THREE.MeshStandardMaterial({ color: "#2e2d2b", roughness: 0.5, metalness: 0.8 });

  // Stone Masonry Foundation Abutments on both riverbanks
  for (const side of [-1.72, 1.72]) {
    const abutment = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.45, 1.95), stoneAbutmentMat);
    abutment.position.set(side, -0.08, 0);
    abutment.castShadow = true;
    abutment.receiveShadow = true;
    bridge.add(abutment);
  }

  // Heavy timber transverse support stringers
  const stringer1 = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.15, 0.2), wood);
  stringer1.position.set(0, 0.05, -0.62);
  stringer1.castShadow = true;
  bridge.add(stringer1);
  const stringer2 = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.15, 0.2), wood);
  stringer2.position.set(0, 0.05, 0.62);
  stringer2.castShadow = true;
  bridge.add(stringer2);

  // Structural sub-deck
  const deck = new THREE.Mesh(new THREE.BoxGeometry(3.55, 0.08, 1.55), wood);
  deck.position.y = 0.07;
  deck.castShadow = true;
  deck.receiveShadow = true;
  bridge.add(deck);

  // 13 Arched timber bridge planks with alternating grain tones
  for (let index = 0; index < 13; index += 1) {
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.038, 1.52), index % 2 === 0 ? wood : plank);
    board.position.set(-1.62 + index * 0.27, 0.13, 0);
    board.castShadow = true;
    board.receiveShadow = true;
    bridge.add(board);
  }

  // Bridge posts, iron fasteners, and guide handrails
  for (const side of [-1, 1]) {
    for (const along of [-1.55, 1.55]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.72, 0.14), wood);
      post.position.set(along, 0.44, side * 0.7);
      post.castShadow = true;
      bridge.add(post);

      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.16, 6), ironBoltMat);
      bolt.rotation.z = Math.PI / 2;
      bolt.position.set(along, 0.66, side * 0.7);
      bridge.add(bolt);
    }
    const rail = new THREE.Mesh(new THREE.BoxGeometry(3.42, 0.11, 0.12), plank);
    rail.position.set(0, 0.70, side * 0.7);
    rail.castShadow = true;
    bridge.add(rail);
  }
  scene.add(bridge);
}

function createHub(scene: THREE.Scene) {
  const group = new THREE.Group();
  group.position.set(3.2, 0, 3.6);
  group.name = "island-service-hub";

  const stoneMat = new THREE.MeshPhysicalMaterial({
    color: "#cec2aa",
    roughness: 0.58,
    metalness: 0.02,
    clearcoat: 0.08,
  });
  const flagstoneMat = new THREE.MeshStandardMaterial({
    color: "#dfd4c1",
    roughness: 0.52,
    metalness: 0.02,
  });
  const canopyMat = new THREE.MeshPhysicalMaterial({
    color: "#a45d3e",
    roughness: 0.38,
    metalness: 0.02,
    clearcoat: 0.25,
    clearcoatRoughness: 0.2,
  });
  const bronzeMat = new THREE.MeshStandardMaterial({
    color: "#cf9f3e",
    roughness: 0.35,
    metalness: 0.65,
  });

  // 1. Grounded Stepped Foundation Plinth & Connecting Flagstone Steps
  const basePlinth = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.44, 2.05), stoneMat);
  basePlinth.position.y = -0.10;
  basePlinth.castShadow = true;
  basePlinth.receiveShadow = true;

  const upperPlinth = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.16, 1.85), flagstoneMat);
  upperPlinth.position.y = 0.16;
  upperPlinth.castShadow = true;
  upperPlinth.receiveShadow = true;

  // 3 Wide welcoming flagstone stairs stepping down to meadow turf
  const sanctuarySteps = [
    { z: 1.05, y: 0.11, depth: 0.38, width: 1.45 },
    { z: 1.38, y: 0.06, depth: 0.38, width: 1.65 },
    { z: 1.72, y: 0.02, depth: 0.42, width: 1.85 },
  ];
  sanctuarySteps.forEach((st) => {
    const step = new THREE.Mesh(new THREE.BoxGeometry(st.width, 0.10, st.depth), flagstoneMat);
    step.position.set(0, st.y, st.z);
    step.castShadow = true;
    step.receiveShadow = true;
    group.add(step);
  });

  // Connecting flagstone apron to meadow path
  const apron = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.03, 0.6), flagstoneMat);
  apron.position.set(0, 0.015, 2.15);
  apron.receiveShadow = true;
  group.add(apron);

  group.add(basePlinth, upperPlinth);

  // 2. Classical Sandstone Sanctuary Columns with Base & Capitals
  const colPositions: [number, number][] = [
    [-0.86, -0.66],
    [0.86, -0.66],
    [-0.86, 0.66],
    [0.86, 0.66],
  ];
  colPositions.forEach(([cx, cz]) => {
    const colGroup = new THREE.Group();
    colGroup.position.set(cx, 0.25, cz);

    const baseTorus = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.1, 12), stoneMat);
    baseTorus.position.y = 0.05;
    colGroup.add(baseTorus);

    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 1.45, 12), stoneMat);
    shaft.position.y = 0.8;
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    colGroup.add(shaft);

    const capital = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.28), stoneMat);
    capital.position.y = 1.55;
    capital.castShadow = true;
    colGroup.add(capital);

    group.add(colGroup);
  });

  // 3. Back Masonry Altar Wall with Engraved Bronze Medallion
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(1.85, 1.55, 0.22), stoneMat);
  backWall.position.set(0, 1.02, -0.66);
  backWall.castShadow = true;
  backWall.receiveShadow = true;

  const medallion = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 24), bronzeMat);
  medallion.rotation.x = Math.PI / 2;
  medallion.position.set(0, 1.32, -0.52);
  medallion.castShadow = true;

  group.add(backWall, medallion);

  // 4. Carved Architrave Lintel and Terracotta Pitched Canopy
  const architrave = new THREE.Mesh(new THREE.BoxGeometry(2.18, 0.18, 1.78), stoneMat);
  architrave.position.y = 1.86;
  architrave.castShadow = true;
  architrave.receiveShadow = true;

  const canopy = new THREE.Mesh(new THREE.BoxGeometry(2.26, 0.24, 1.86), canopyMat);
  canopy.position.y = 2.05;
  canopy.castShadow = true;

  const roofRidge = new THREE.Mesh(new THREE.BoxGeometry(2.32, 0.14, 0.2), stoneMat);
  roofRidge.position.set(0, 2.2, 0);
  roofRidge.castShadow = true;

  group.add(architrave, canopy, roofRidge);

  // 5. Central Public Service Altar with Open Coordination Registry
  const altarPodium = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.62, 0.42), flagstoneMat);
  altarPodium.position.set(0, 0.45, 0.05);
  altarPodium.castShadow = true;
  altarPodium.receiveShadow = true;

  const registry = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.05, 0.3),
    new THREE.MeshStandardMaterial({ color: "#fefcf2", roughness: 0.35 })
  );
  registry.position.set(0, 0.79, 0.05);
  group.add(altarPodium, registry);

  // 6. Two Ceremonial Bronze Braziers with Flickering Amber Flame
  const brazierPositions: [number, number][] = [
    [-1.32, 0.62],
    [1.32, 0.62],
  ];
  brazierPositions.forEach(([bx, bz]) => {
    const brazierGroup = new THREE.Group();
    brazierGroup.position.set(bx, 0, bz);

    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.52, 8), stoneMat);
    pedestal.position.y = 0.26;
    pedestal.castShadow = true;
    pedestal.receiveShadow = true;
    brazierGroup.add(pedestal);

    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.12, 0.18, 12), bronzeMat);
    bowl.position.y = 0.58;
    bowl.castShadow = true;
    brazierGroup.add(bowl);

    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.1, 0.22, 8),
      new THREE.MeshBasicMaterial({ color: "#ff8222" })
    );
    flame.position.y = 0.74;
    brazierGroup.add(flame);

    const flameLight = new THREE.PointLight("#ff8824", 0.9, 4.2);
    flameLight.position.y = 0.78;
    brazierGroup.add(flameLight);

    group.add(brazierGroup);
  });

  scene.add(group);
  return group;
}

function createDistantHills(scene: THREE.Scene) {
  const group = new THREE.Group();
  group.name = "distant-horizon-knolls";
  const horizonMat = new THREE.MeshPhysicalMaterial({
    color: "#4e825a",
    roughness: 0.74,
    metalness: 0.02,
    clearcoat: 0.08,
  });

  // Expansive rolling horizon knolls framing the mainland on all boundaries
  const distantKnolls: Array<[number, number, number, number, number, number]> = [
    [-54, -1.8, -32, 28, 4.5, 16],
    [-28, -1.9, -36, 32, 5.2, 18],
    [12, -1.9, -34, 26, 4.0, 15],
    [-52, -1.8, 34, 30, 4.8, 17],
    [-22, -1.9, 36, 34, 5.0, 19],
    [14, -1.9, 32, 25, 4.2, 15],
    [-60, -1.8, 0, 34, 5.5, 20],
    [28, -1.8, 0, 26, 4.2, 16],
  ];

  for (const [x, y, z, sx, sy, sz] of distantKnolls) {
    const knoll = new THREE.Mesh(new THREE.CylinderGeometry(sx * 0.9, sx, sy, 32), horizonMat);
    knoll.position.set(x, y + sy / 2, z);
    knoll.scale.set(1, 1, sz / sx);
    knoll.receiveShadow = true;
    group.add(knoll);
  }
  scene.add(group);
}

function createWaterfallAndOverlook(scene: THREE.Scene, lagoonMat: THREE.Material) {
  const group = new THREE.Group();
  group.name = "waterfall-and-elevated-overlook";

  const cliffStoneMat = new THREE.MeshPhysicalMaterial({
    color: "#726555",
    roughness: 0.72,
    metalness: 0.02,
    clearcoat: 0.1,
  });
  const mossGrassMat = new THREE.MeshPhysicalMaterial({
    color: "#46953a",
    roughness: 0.55,
    clearcoat: 0.12,
  });
  const flagstoneMat = new THREE.MeshStandardMaterial({
    color: "#d8ceba",
    roughness: 0.6,
  });
  const woodMat = new THREE.MeshPhysicalMaterial({
    color: "#7a4e32",
    roughness: 0.44,
    clearcoat: 0.2,
  });

  // 1. Elevated Cliff Overlook Plateau at [-5.2, 0, 8.8]
  const plateauBase = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.4, 2.2, 16), cliffStoneMat);
  plateauBase.position.set(-5.2, 1.1, 8.8);
  plateauBase.castShadow = true;
  plateauBase.receiveShadow = true;
  group.add(plateauBase);

  const plateauCap = new THREE.Mesh(new THREE.CylinderGeometry(2.15, 2.1, 0.18, 16), mossGrassMat);
  plateauCap.position.set(-5.2, 2.29, 8.8);
  plateauCap.receiveShadow = true;
  group.add(plateauCap);

  // Overlook observation platform pavers
  for (let ox = -1; ox <= 1; ox++) {
    for (let oz = -1; oz <= 1; oz++) {
      if (Math.hypot(ox, oz) <= 1.2) {
        const paver = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.04, 0.62), flagstoneMat);
        paver.position.set(-5.2 + ox * 0.68, 2.39, 8.8 + oz * 0.68);
        paver.receiveShadow = true;
        group.add(paver);
      }
    }
  }

  // Overlook timber safety balustrade railing
  const railRadius = 1.95;
  for (let a = 0; a < Math.PI * 1.6; a += 0.55) {
    const rx = -5.2 + Math.cos(a) * railRadius;
    const rz = 8.8 + Math.sin(a) * railRadius;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.72, 8), woodMat);
    post.position.set(rx, 2.74, rz);
    post.castShadow = true;
    group.add(post);
  }
  const topRail = new THREE.Mesh(new THREE.TorusGeometry(railRadius, 0.045, 8, 24, Math.PI * 1.6), woodMat);
  topRail.rotation.x = Math.PI / 2;
  topRail.position.set(-5.2, 3.08, 8.8);
  topRail.castShadow = true;
  group.add(topRail);

  // 2. Flight of Carved Natural Stone Stairs Leading from Meadow up to Overlook
  const steps = [
    { x: -3.4, y: 0.18, z: 7.2, w: 1.15, h: 0.36, d: 0.7, ry: -0.4 },
    { x: -3.8, y: 0.54, z: 7.7, w: 1.15, h: 0.36, d: 0.7, ry: -0.3 },
    { x: -4.3, y: 0.90, z: 8.2, w: 1.15, h: 0.36, d: 0.7, ry: -0.2 },
    { x: -4.7, y: 1.26, z: 8.6, w: 1.15, h: 0.36, d: 0.7, ry: -0.1 },
    { x: -5.0, y: 1.62, z: 8.8, w: 1.20, h: 0.36, d: 0.7, ry: 0.0 },
    { x: -5.2, y: 1.98, z: 8.8, w: 1.25, h: 0.36, d: 0.7, ry: 0.0 },
  ];
  steps.forEach((st) => {
    const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(st.w, st.h, st.d), flagstoneMat);
    stepMesh.position.set(st.x, st.y, st.z);
    stepMesh.rotation.y = st.ry;
    stepMesh.castShadow = true;
    stepMesh.receiveShadow = true;
    group.add(stepMesh);
  });

  // 3. Cascading Tiered Waterfall at [-8.6, 0, 7.8] pouring down toward the pond
  const waterfallCliff = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 1.4), cliffStoneMat);
  waterfallCliff.position.set(-8.6, 1.1, 7.8);
  waterfallCliff.castShadow = true;
  waterfallCliff.receiveShadow = true;
  group.add(waterfallCliff);

  // Upper tiered rock shelf
  const upperShelf = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.4, 0.8), cliffStoneMat);
  upperShelf.position.set(-8.6, 1.3, 7.1);
  group.add(upperShelf);

  // Tier 1 water sheet
  const waterSheet1 = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.1), lagoonMat);
  waterSheet1.position.set(-8.6, 1.65, 7.3);
  waterSheet1.rotation.y = Math.PI;
  group.add(waterSheet1);

  // Tier 2 water cascade down to pond level
  const waterSheet2 = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.3), lagoonMat);
  waterSheet2.position.set(-8.6, 0.65, 6.7);
  waterSheet2.rotation.x = 0.28;
  waterSheet2.rotation.y = Math.PI;
  group.add(waterSheet2);

  // Foam pool and splash rings at the base of the waterfall
  const foamMat = new THREE.MeshBasicMaterial({ color: "#eefdff", transparent: true, opacity: 0.85 });
  const splashRing = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.85, 24), foamMat);
  splashRing.rotation.x = -Math.PI / 2;
  splashRing.position.set(-8.6, 0.04, 6.1);
  group.add(splashRing);

  scene.add(group);
  return group;
}

function createButterfly(scene: THREE.Scene, position: [number, number, number], colour: string, phase: number, drift: [number, number, number]) {
  const group = new THREE.Group(); group.position.set(...position); group.name = "meadow-butterfly";
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.12, 3, 5), new THREE.MeshPhysicalMaterial({ color: "#564d43", roughness: 0.35, clearcoat: 0.8 })); body.rotation.x = Math.PI / 2; group.add(body);
  const material = new THREE.MeshToonMaterial({ color: colour, side: THREE.DoubleSide });
  const wings = [-1, 1].map((side) => {
    const pivot = new THREE.Group(); pivot.position.x = side * 0.025;
    const wing = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), material); wing.scale.set(1.1, 0.12, 0.78); wing.position.x = side * 0.07; pivot.add(wing); group.add(pivot); return pivot;
  });
  scene.add(group); return { group, wings, phase, drift, home: new THREE.Vector3(...position) };
}


function createHomingReticle(scene: THREE.Scene) {
  const group = new THREE.Group();
  group.name = "homing-target-reticle";
  group.visible = false;

  const diamondGeom = new THREE.RingGeometry(0.38, 0.48, 4);
  const diamondMat = new THREE.MeshBasicMaterial({
    color: "#ffdd00",
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.95,
    depthTest: false,
  });
  const diamond = new THREE.Mesh(diamondGeom, diamondMat);
  diamond.rotation.z = Math.PI / 4;
  group.add(diamond);

  const innerPipGeom = new THREE.CircleGeometry(0.12, 16);
  const innerPipMat = new THREE.MeshBasicMaterial({
    color: "#005ea5",
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.92,
    depthTest: false,
  });
  const innerPip = new THREE.Mesh(innerPipGeom, innerPipMat);
  group.add(innerPip);

  group.renderOrder = 999;
  scene.add(group);

  return {
    group,
    diamond,
    update: (pos: [number, number, number], time: number, camera: THREE.Camera) => {
      group.position.set(pos[0], pos[1] + 0.35, pos[2]);
      group.quaternion.copy(camera.quaternion);
      diamond.rotation.z = Math.PI / 4 + time * 3.5;
      const pulse = 1 + Math.sin(time * 12) * 0.12;
      diamond.scale.set(pulse, pulse, 1);
    },
    show: () => { group.visible = true; },
    hide: () => { group.visible = false; },
    dispose: () => {
      scene.remove(group);
      diamondGeom.dispose();
      diamondMat.dispose();
      innerPipGeom.dispose();
      innerPipMat.dispose();
    },
  };
}

function addInstances(source: GLTF, scene: THREE.Scene, placements: Array<{ position: [number, number, number]; rotationY: number; scale: number }>) {
  source.scene.updateMatrixWorld(true);
  source.scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const instances = new THREE.InstancedMesh(object.geometry, object.material, placements.length);
    const matrix = new THREE.Matrix4(), base = object.matrixWorld.clone(), rotation = new THREE.Quaternion(), size = new THREE.Vector3(), position = new THREE.Vector3();
    placements.forEach((placement, index) => {
      position.set(...placement.position); rotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), placement.rotationY); size.setScalar(placement.scale);
      matrix.compose(position, rotation, size).multiply(base); instances.setMatrixAt(index, matrix);
    });
    instances.castShadow = true; instances.receiveShadow = true; instances.name = "seeded-flower-instances"; instances.computeBoundingSphere(); scene.add(instances);
  });
}

function convertToGlossyToyMaterial(mat: THREE.Material): THREE.Material {
  if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshToonMaterial) {
    const isGold = mat.color && mat.color.r > 0.8 && mat.color.g > 0.55 && mat.color.b < 0.35;
    const isFoliage = mat.color && mat.color.g > mat.color.r * 1.08 && mat.color.g > mat.color.b;
    const isWood = mat.color && mat.color.r > mat.color.g && mat.color.r > mat.color.b && mat.color.r < 0.75;

    return new THREE.MeshPhysicalMaterial({
      color: mat.color ? mat.color.clone() : new THREE.Color("#ffffff"),
      map: mat.map || null,
      roughness: isGold ? 0.16 : isFoliage ? 0.22 : isWood ? 0.32 : 0.28,
      metalness: isGold ? 0.7 : 0.02,
      clearcoat: isGold ? 1.0 : 0.92,
      clearcoatRoughness: isGold ? 0.08 : 0.12,
      reflectivity: 0.65,
      specularIntensity: 0.95,
      side: mat.side,
      transparent: mat.transparent,
      opacity: mat.opacity,
    });
  }
  return mat;
}

function upgradeToGlossyToy(root: THREE.Object3D) {
  root.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material = child.material.map(convertToGlossyToyMaterial);
        } else {
          child.material = convertToGlossyToyMaterial(child.material);
        }
      }
    }
  });
}

function addModel(source: GLTF, parent: THREE.Object3D, position: [number, number, number], scale: [number, number, number], yaw = 0) {
  const model = source.scene.clone(true);
  model.position.set(...position); model.scale.set(...scale); model.rotation.y = yaw;
  model.traverse((object) => { if (object instanceof THREE.Mesh) { object.castShadow = true; object.receiveShadow = true; } });
  parent.add(model); return model;
}

function addGroundModel(source: GLTF, parent: THREE.Object3D, x: number, groundY: number, z: number, scale: [number, number, number], yaw = 0) {
  const model = addModel(source, parent, [x, groundY, z], scale, yaw);
  model.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(model);
  model.position.y += groundY - bounds.min.y;
  model.updateMatrixWorld(true);
  return model;
}

function disposeResources(scene: THREE.Scene, characters: AnimatedCharacter[], gltfs: GLTF[]) {
  characters.forEach((character) => character.dispose());
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>();
  const collect = (root: THREE.Object3D) => root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    for (const item of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(item); Object.values(item).forEach((value) => { if (value instanceof THREE.Texture) textures.add(value); });
    }
  });
  collect(scene); gltfs.forEach((gltf) => collect(gltf.scene));
  geometries.forEach((item) => item.dispose()); materials.forEach((item) => item.dispose()); textures.forEach((item) => item.dispose());
}

export default function RiskReadinessGame3D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const joystickKnobRef = useRef<HTMLDivElement | null>(null);
  const joystickRef = useRef<{ active: boolean; pointerId: number | null }>({ active: false, pointerId: null });

  const phaseRef = useRef<Phase>("workshop");
  const selectedRef = useRef(0);
  const soundRef = useRef(false);
  const pressedRef = useRef(new Set<string>());
  const nearbyRef = useRef<string | null>(null);
  const targetLockRef = useRef<HomingLock | null>(null);
  const checkpointRef = useRef<[number, number, number]>(CHECKPOINT_START);
  const objectiveRef = useRef("Choose an explorer to begin");
  const guideMetRef = useRef(false);
  const objectiveCueRef = useRef<HTMLDivElement | null>(null);
  const snapshotRef = useRef<Snapshot>({
    phase: "workshop",
    player: PLAYER_START,
    grounded: true,
    checkpoint: CHECKPOINT_START,
    collected: 0,
    completedLessons: 0,
    objective: objectiveRef.current,
  });

  const [phase, setPhase] = useState<Phase>("workshop");
  const [selected, setSelected] = useState(0);
  const [tint, setTint] = useState("#ffffff");
  const [nearby, setNearby] = useState<string | null>(null);
  const [targetLock, setTargetLock] = useState<HomingLock | null>(null);
  const [activeLesson, setActiveLesson] = useState<string | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);
  const [collected, setCollected] = useState<string[]>([]);
  const [movementState, setMovementState] = useState<MovementState>("grounded");
  const [traversalBadge, setTraversalBadge] = useState<string | null>(null);
  const [dialogue, setDialogue] = useState({
    speaker: "Kaya, local coordinator",
    text: "The island service hub opens tomorrow. I’m checking that our new public service is ready. Follow the markers and help me make five practical cyber security decisions before the doors open.",
  });
  const [feedbackCorrect, setFeedbackCorrect] = useState(false);
  const [eventMessage, setEventMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [soundOn, setSoundOn] = useState(false);

  const reducedMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  const lesson = LESSONS.find((item) => item.id === activeLesson);
  const isComplete = phase === "complete";
  phaseRef.current = phase;
  selectedRef.current = selected;
  soundRef.current = soundOn;

  const nextLesson = LESSONS.find((item) => !completed.includes(item.id));
  const targetName = !guideMetRef.current ? "Talk to Kaya at the service hub" : nextLesson?.title ?? "Reach the recovery beacon";
  objectiveRef.current =
    phase === "workshop"
      ? "Choose an explorer to begin"
      : phase === "opening"
      ? "Talk to Kaya, then follow the trail"
      : phase === "paused"
      ? "Route paused"
      : isComplete
      ? "The recovery beacon is ready"
      : nearby
      ? nearby === "finish"
        ? "Enter the recovery beacon"
        : nearby === "guide"
        ? "Talk to Kaya"
        : "Press E to explore " + (LESSONS.find((item) => item.id === nearby)?.title ?? "the marker")
      : targetLock
      ? "Target lock: " + targetLock.target.name + " (Press Space or H to Dash)"
      : "Next: " + targetName;

  const showEvent = useCallback((message: string, kind: Sfx) => {
    setEventMessage(message);
    engineRef.current?.sfx(kind);
    window.setTimeout(() => setEventMessage((current) => (current === message ? "" : current)), 2300);
  }, []);

  const interact = useCallback(
    (id: string) => {
      if (id === "guide") {
        guideMetRef.current = true;
        setFeedbackCorrect(true);
        setActiveLesson(null);
        setDialogue({
          speaker: "Kaya, local coordinator",
          text: "Thanks for joining the opening-day check. Each marker is one practical decision for keeping the public service available and its information safer. The checkpoint flag will save your place. You can also run along stone retaining walls and homing dash towards beacons!",
        });
        setPhase("feedback");
        return;
      }
      if (id === "finish") {
        if (completed.length === LESSONS.length) {
          engineRef.current?.sfx("finish");
          setDialogue({
            speaker: "Recovery beacon",
            text: "You reached the end of the route and worked through all five cyber-risk decisions. These are useful starting points, not a security assessment or a guarantee against incidents.",
          });
          setPhase("complete");
        } else {
          showEvent("Complete the five trail markers before entering the recovery beacon.", "fall");
        }
        return;
      }
      const found = LESSONS.find((item) => item.id === id);
      if (!found || completed.includes(id)) return;
      setActiveLesson(id);
      setFeedbackCorrect(false);
      setDialogue({ speaker: "Trail marker | " + found.title, text: found.prompt });
      setPhase("question");
    },
    [completed, showEvent],
  );

  const callbacksRef = useRef<Callbacks>({
    phase,
    solved: completed,
    collected,
    nearby: () => {},
    lock: () => {},
    state: () => {},
    objective: objectiveRef.current,
  });

  callbacksRef.current = {
    phase,
    solved: completed,
    collected,
    objective: objectiveRef.current,
    nearby: (id) => {
      nearbyRef.current = id;
      setNearby((old) => (old === id ? old : id));
    },
    lock: (lock) => {
      targetLockRef.current = lock;
      setTargetLock(lock);
    },
    state: (st) => {
      setMovementState((old) => (old === st ? old : st));
    },
  };

  useEffect(() => {
    if (phase === "walking") return;
    engineRef.current?.pause();
    pressedRef.current.clear();
  }, [phase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "low-power" });
    } catch {
      setFailed(true);
      setLoading(false);
      return;
    }
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#8cd8ee");
    scene.fog = new THREE.Fog("#8cd8ee", 32, 85);
    const camera = new THREE.OrthographicCamera(-5.25, 5.25, 5.25, -5.25, 0.1, 90);
    camera.position.set(6.95, 3.25, 6.6);
    camera.lookAt(2.15, 0.85, 0);

    scene.add(new THREE.HemisphereLight("#ffffff", "#629968", 1.5));
    const sun = new THREE.DirectionalLight("#fff3d0", 2.45);
    sun.position.set(-8, 18, 11);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -32;
    sun.shadow.camera.right = 32;
    sun.shadow.camera.top = 28;
    sun.shadow.camera.bottom = -28;
    sun.shadow.bias = -0.00015;
    sun.shadow.normalBias = 0.025;
    scene.add(sun);
    const fill = new THREE.DirectionalLight("#a2ddf5", 0.85);
    fill.position.set(8, 7, -12);
    scene.add(fill);
    const rimLight = new THREE.DirectionalLight("#ffdeb6", 0.75);
    rimLight.position.set(12, 10, -14);
    scene.add(rimLight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 640 ? 1.1 : 1.4));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.14;

    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
    const tiltShiftPass = new ShaderPass(ZeldaTiltShiftShader);
    tiltShiftPass.uniforms.focusY.value = 0.48;
    tiltShiftPass.uniforms.focusBand.value = 0.42;
    tiltShiftPass.uniforms.falloff.value = 0.22;
    tiltShiftPass.uniforms.blurStrength.value = 2.2;
    composer.addPass(tiltShiftPass);
    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    const loader = new GLTFLoader();
    const modelFiles = [...STATIC_MODELS];
    const loadedGltfs: GLTF[] = [];
    const characters: (AuthoredCharacter | AnimatedCharacter)[] = [];
    const staticModels = new Map<string, GLTF>();
    const directions = new Map<string, [number, number]>();
    const velocity = { x: 0, z: 0 };
    const tokens: Array<{ id: string; model: THREE.Group; position: [number, number, number] }> = [];
    const dustParticles: DustParticle[] = [];
    const swayingFoliage: THREE.Object3D[] = [];
    const butterflies: Array<ReturnType<typeof createButterfly>> = [];
    const dustEmitter = new DustEmitter();
    const landingSpring = { x: 1, v: 0 };
    const currentLookAt = new THREE.Vector3(PLAYER_START[0] + ROUTE_FORWARD.x * 1.25, 1.8, PLAYER_START[2] + ROUTE_FORWARD.z * 1.25);
    let isGliding = false;

    let meadowGrass: ReturnType<typeof createMeadowGrass> | null = null;
    let meadowBirds: ReturnType<typeof createMeadowBirds> | null = null;
    let marker: TrailMarker | null = null;
    let homingReticle: ReturnType<typeof createHomingReticle> | null = null;
    let lagoonMaterial: ReturnType<typeof createZeldaLagoonMaterial> | null = null;
    let physics: RiskPhysics | null = null;
    let playerIndex = 0;
    let guideCharacter: (AuthoredCharacter | AnimatedCharacter) | null = null;
    let ready = false;
    let disposed = false;
    let elapsed = 0;
    let lastCheck = 0;
    let lastFrame = performance.now();
    let lastCheckpointId = "home";
    let audioContext: AudioContext | null = null;
    let previousMode: Phase = "workshop";
    let wasGrounded = true;

    // Sonic Lost World Movement States & Traversal Engine State
    let movementState: MovementState = "grounded";
    const wallRunState: WallRunState = {
      active: false,
      surface: null,
      duration: 0,
      speed: 0,
      directionSign: 1,
      wallDistance: 0.36,
      exitGraceTimer: 0,
    };
    let homingArcState: HomingArcState = {
      active: false,
      targetId: null,
      startPos: [0, 0, 0],
      targetPos: [0, 0, 0],
      elapsed: 0,
      totalDuration: 0.35,
    };

    const resize = () => {
      const w = Math.max(1, canvas.clientWidth);
      const h = Math.max(1, canvas.clientHeight);
      const aspect = w / h;
      const viewHeight = window.innerWidth < 640 ? 10 : 8.5;
      camera.left = -(viewHeight * aspect) / 2;
      camera.right = (viewHeight * aspect) / 2;
      camera.top = viewHeight / 2;
      camera.bottom = -viewHeight / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      composer.setSize(w, h);
      tiltShiftPass.uniforms.resolution.value.set(w * renderer.getPixelRatio(), h * renderer.getPixelRatio());
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const playSound = (kind: Sfx) => {
      if (!soundRef.current) return;
      try {
        audioContext ??= new AudioContext();
        if (audioContext.state === "suspended") void audioContext.resume();
        const notes =
          kind === "collect"
            ? [660, 880]
            : kind === "checkpoint"
            ? [523, 659, 784]
            : kind === "finish"
            ? [523, 659, 784, 988]
            : kind === "jump"
            ? [330, 440, 580]
            : [330, 220];
        let time = audioContext.currentTime;
        notes.forEach((frequency) => {
          const oscillator = audioContext!.createOscillator();
          const gain = audioContext!.createGain();
          oscillator.type = kind === "fall" ? "triangle" : "sine";
          oscillator.frequency.setValueAtTime(frequency, time);
          gain.gain.setValueAtTime(0.0001, time);
          gain.gain.exponentialRampToValueAtTime(kind === "fall" ? 0.03 : 0.045, time + 0.012);
          gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.13);
          oscillator.connect(gain);
          gain.connect(audioContext!.destination);
          oscillator.start(time);
          oscillator.stop(time + 0.14);
          time += 0.085;
        });
      } catch {
        /* Optional sound; text and visual feedback remain available. */
      }
    };

    const setCheckpoint = (id: string) => {
      if (!physics || id === lastCheckpointId) return;
      const platform = PLATFORMS.find((item) => item.id === id);
      if (!platform || platform.kind !== "checkpoint") return;
      lastCheckpointId = id;
      checkpointRef.current = [platform.x, platform.top, platform.z];
      showEvent("Checkpoint reached. You will restart here if you fall.", "checkpoint");
    };

    const resetPlayer = (message: string) => {
      if (!physics) return;
      movementState = "airborne";
      wallRunState.active = false;
      homingArcState.active = false;
      setTraversalBadge(null);
      physics.respawn(checkpointRef.current);
      velocity.x = 0;
      velocity.z = 0;
      directions.clear();
      pressedRef.current.clear();
      wasGrounded = false;
      landingSpring.x = 1;
      landingSpring.v = 0;
      characters[playerIndex]?.anchor.position.set(...checkpointRef.current);
      showEvent(message, "fall");
    };

    const setCharactersVisible = () => {
      characters.forEach((character, index) => {
        character.anchor.visible = index === playerIndex;
      });
      if (guideCharacter) guideCharacter.anchor.visible = phaseRef.current !== "workshop";
    };

    const executeHoming = () => {
      const lock = targetLockRef.current;
      if (!lock || !physics || phaseRef.current !== "walking") return;
      const player = characters[playerIndex];
      if (!player) return;

      const playerPos = player.anchor.position.toArray();
      homingArcState = startHomingArc(playerPos, lock.target.position);
      homingArcState.targetId = lock.target.id;
      movementState = "homing";
      setTraversalBadge("Homing Dash ✦");
      playSound("jump");
      showEvent("Homing dash locked!", "jump");
    };

    const setup = async () => {
      try {
        const loaded = await Promise.all(
          modelFiles.map((file) => loader.loadAsync(file.startsWith("/") ? file : ROOT + file)),
        );
        if (disposed) return;
        loadedGltfs.push(...loaded);
        loaded.forEach((gltf) => upgradeToGlossyToy(gltf.scene));
        loaded.forEach((gltf, index) => {
          if (index < STATIC_MODELS.length) staticModels.set(STATIC_MODELS[index], gltf);
        });
        const asset = (file: string) => staticModels.get(file)!;
        const placementErrors = validateEnvironmentLayout();
        if (placementErrors.length) throw new Error("Invalid environment placement: " + placementErrors.join("; "));

        lagoonMaterial = createZeldaLagoonMaterial();

        createMainlandLandscape(scene);
        createMeadowTrail(scene);
        createRiverAndBridge(scene, lagoonMaterial);
        createWaterfallAndOverlook(scene, lagoonMaterial);
        createHub(scene);
        createDistantHills(scene);
        homingReticle = createHomingReticle(scene);

        const pond = new THREE.Mesh(new THREE.CircleGeometry(1, 64), lagoonMaterial);
        pond.rotation.x = -Math.PI / 2;
        pond.scale.set(3.6, 1.8, 1);
        pond.position.set(-8.4, 0.025, 5.1);
        pond.receiveShadow = true;
        pond.name = "pond-clearing";
        scene.add(pond);

        const shoreline = new THREE.Mesh(new THREE.RingGeometry(0.92, 1.08, 64), new THREE.MeshStandardMaterial({ color: "#e8cf9f", roughness: 0.75, side: THREE.DoubleSide }));
        shoreline.rotation.x = -Math.PI / 2;
        shoreline.scale.set(3.75, 1.92, 1);
        shoreline.position.copy(pond.position);
        shoreline.position.y = 0.015;
        scene.add(shoreline);

        const treePerches: THREE.Vector3[] = [];

        // Handcrafted perimeter trees framing the miniature diorama horizon
        const scenicTreePlacements: Array<[number, number, number, number, number, string]> = [
          [-23.5, 0, 7.8, 0.95, 0.4, "tree2"],
          [-19.5, 0, -8.8, 1.05, -0.6, "tree1"],
          [-2.5, 0, -9.8, 1.0, 0.8, "tree3"],
          [9.2, 0, 5.2, 0.88, -0.3, "tree1"],
          [-28.0, 0, -3.8, 1.1, 1.2, "tree2"],
          [11.5, 0, -6.2, 0.92, -0.7, "tree3"],
          [-26.5, 0, 6.8, 0.98, 0.5, "tree1"],
          [-7.5, 0, -9.5, 1.0, -0.9, "tree2"],
        ];
        scenicTreePlacements.forEach(([tx, ty, tz, tScale, tYaw, variant], idx) => {
          const treeResult = createSculptedTree(variant, idx);
          treeResult.group.position.set(tx, ty, tz);
          treeResult.group.rotation.y = tYaw;
          treeResult.group.scale.setScalar(tScale);
          treeResult.group.name = `scenic-perimeter-tree-${tx}`;
          treeResult.group.userData.baseYaw = tYaw;
          treeResult.group.userData.windPhase = swayingFoliage.length * 1.71;
          scene.add(treeResult.group);
          swayingFoliage.push(treeResult.group);

          const perches = computeWorldPerches(treeResult.perches, [tx, ty, tz], tYaw, tScale);
          treePerches.push(...perches);
        });

        const scenicRockPlacements: Array<[number, number, number, number, number]> = [
          [-21.0, 0, 8.4, 0.85, 0.5],
          [-17.2, 0, -9.2, 0.9, -0.4],
          [-29.2, 0, -1.8, 1.0, 0.9],
          [8.0, 0, 6.8, 0.75, 1.4],
        ];
        scenicRockPlacements.forEach(([rx, ry, rz, rScale, rYaw]) => {
          const rock = addGroundModel(asset("rocks.glb"), scene, rx, ry, rz, [rScale, rScale, rScale], rYaw);
          rock.name = `scenic-perimeter-rock-${rx}`;
        });


        // Core environment props: sculpted trees, lush bushes, arching ferns, boulders, and flowers
        ENVIRONMENT_PROPS.forEach((prop, idx) => {
          if (prop.asset.startsWith("tree")) {
            const treeResult = createSculptedTree(prop.asset, idx);
            treeResult.group.position.set(prop.position[0], prop.position[1], prop.position[2]);
            treeResult.group.rotation.y = prop.rotationY;
            treeResult.group.scale.setScalar(prop.scale);
            treeResult.group.name = prop.id;
            treeResult.group.userData.baseYaw = prop.rotationY;
            treeResult.group.userData.windPhase = swayingFoliage.length * 1.71;
            scene.add(treeResult.group);
            swayingFoliage.push(treeResult.group);

            const perches = computeWorldPerches(treeResult.perches, prop.position, prop.rotationY, prop.scale);
            treePerches.push(...perches);
          } else if (prop.asset === "bush") {
            const shrub = createSculptedShrub(idx);
            shrub.position.set(prop.position[0], prop.position[1], prop.position[2]);
            shrub.rotation.y = prop.rotationY;
            shrub.scale.setScalar(prop.scale * 1.35);
            shrub.name = prop.id;
            shrub.userData.baseYaw = prop.rotationY;
            scene.add(shrub);
          } else if (prop.asset === "fern") {
            const fern = createSculptedFern(idx);
            fern.position.set(prop.position[0], prop.position[1], prop.position[2]);
            fern.rotation.y = prop.rotationY;
            fern.scale.setScalar(prop.scale * 1.35);
            fern.name = prop.id;
            fern.userData.baseYaw = prop.rotationY;
            scene.add(fern);
          } else {
            const file = prop.asset === "rocks" ? "rocks.glb" : "flowers.glb";
            const source = asset(file);
            const model = addGroundModel(source, scene, prop.position[0], prop.position[1], prop.position[2], [prop.scale, prop.scale, prop.scale], prop.rotationY);
            model.name = prop.id;
            model.userData.baseYaw = prop.rotationY;
          }
        });

        // Lush instanced diorama clover tufts
        meadowGrass = createMeadowGrass(scene, 620);
        // Wild birds naturally roosting on and flying between tree boughs
        meadowBirds = createMeadowBirds(scene, treePerches);

        const scatterRandom = createSeededRandom(LAYOUT_SEED);
        const flowerPlacements = Array.from({ length: 36 }, (_, index) => ({
          position: (index < 22
            ? [-7.2 + scatterRandom() * 4.6, 0, -7.8 + scatterRandom() * 2.1]
            : [-20 + scatterRandom() * 5.2, 0, 1.5 + scatterRandom() * 4.5]) as [number, number, number],
          rotationY: scatterRandom() * Math.PI * 2,
          scale: 0.24 + scatterRandom() * 0.2,
        }));
        addInstances(asset("flowers.glb"), scene, flowerPlacements);

        const critterRandom = createSeededRandom(LAYOUT_SEED + 91);
        const butterflyHomes: Array<[number, number, number, string]> = [[-5.1, 0.82, -6.2, "#e78f6f"], [-18, 0.8, 3.7, "#f2d274"], [-5.8, 0.76, -7.4, "#92bd9b"]];
        butterflyHomes.forEach(([x, y, z, colour]) =>
          butterflies.push(
            createButterfly(
              scene,
              [x + (critterRandom() - 0.5) * 0.7, y, z + (critterRandom() - 0.5) * 0.7],
              colour,
              critterRandom() * Math.PI * 2,
              [0.48 + critterRandom() * 0.38, 0.4 + critterRandom() * 0.34, 12 + critterRandom() * 4],
            ),
          ),
        );

        const checkpoint = PLATFORMS.find((platform) => platform.kind === "checkpoint")!;
        addGroundModel(asset("flag.glb"), scene, checkpoint.x + 0.95, checkpoint.top, checkpoint.z + 0.9, [0.9, 0.9, 0.9], 0.25);
        const finish = PLATFORMS.find((platform) => platform.id === "finish")!;
        addGroundModel(asset("chest.glb"), scene, finish.x + 1.6, finish.top, finish.z + 1, [1.2, 1.2, 1.2]);
        addGroundModel(asset("flag.glb"), scene, finish.x + 1.5, finish.top, finish.z - 1.4, [0.95, 0.95, 0.95], Math.PI / 2);

        physics = await createRiskPhysics(
          PLAYER_START,
          [
            WORLD_SURFACE,
            BRIDGE_SURFACE,
            { x: -14.5, z: 9.5, top: 1.85, halfX: 8.5, halfZ: 3.5 }, // Area C: Elevated ridge terrace
            { x: -5.2, z: 8.8, top: 2.3, halfX: 2.1, halfZ: 2.1 }, // Elevated scenic cliff overlook
          ],
          BARRIERS,
          [],
        );
        if (disposed) {
          physics.dispose();
          return;
        }

        // 1. Authored Protagonist: Grove Oracle with blonde pixie cut
        const protagonist = await loadAuthoredCharacter(scene, "oracle", {
          height: 1.62,
          baseTint: CHARACTER_TINTS[selectedRef.current ?? 0],
        });
        protagonist.anchor.position.set(...PLAYER_START);
        protagonist.model.userData.baseVisualScale = protagonist.model.scale.x;
        characters.push(protagonist);

        // 2. Authored Guide (Kaya): Relic Hunter (Lady Impa-derived)
        const guide = await loadAuthoredCharacter(scene, "hunter", {
          height: 1.58,
          baseTint: "#3ea28b",
        });
        guide.anchor.position.set(...GUIDE_START);
        guideCharacter = guide;

        if (!reducedMotion) {
          for (let index = 0; index < 14; index += 1) {
            const material = new THREE.MeshBasicMaterial({ color: "#fffdf5", transparent: true, opacity: 0, depthWrite: false });
            const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 7), material);
            mesh.visible = false;
            mesh.renderOrder = 2;
            scene.add(mesh);
            dustParticles.push({ mesh, age: 1, lifetime: 0.55, velocity: new THREE.Vector3() });
          }
        }

        marker = createTrailMarker(scene);
        const coin = asset("coin-gold.glb");
        Object.entries(TOKEN_POSITIONS).forEach(([id, position]) =>
          tokens.push({ id, position, model: addModel(coin, scene, position, [0.9, 0.9, 0.9]) }),
        );

        ready = true;
        setLoading(false);
      } catch (error) {
        console.error("The local Kenney game assets could not be loaded", error);
        setFailed(true);
        setLoading(false);
      }
    };
    void setup();

    renderer.setAnimationLoop(() => {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min((now - lastFrame) / 1000, 1 / 30);
      lastFrame = now;
      elapsed += dt;

      if (!ready || !physics) {
        renderer.render(scene, camera);
        return;
      }
      const mode = callbacksRef.current.phase;
      const player = characters[playerIndex];
      const guide = guideCharacter;
      if (!player) {
        renderer.render(scene, camera);
        return;
      }
      if (mode === "paused") {
        renderer.render(scene, camera);
        return;
      }
      setCharactersVisible();

      const nextPlatform =
        PLATFORMS.find((platform) => platform.lessonId === LESSONS[callbacksRef.current.solved.length]?.id) ??
        PLATFORMS.find((platform) => platform.id === "finish")!;
      const targetPosition =
        !guideMetRef.current && guide
          ? new THREE.Vector3(guide.anchor.position.x + SCREEN_RIGHT.x * 0.85, guide.anchor.position.y, guide.anchor.position.z + SCREEN_RIGHT.z * 0.85)
          : new THREE.Vector3(nextPlatform.x + SCREEN_RIGHT.x * 0.72, nextPlatform.top, nextPlatform.z + SCREEN_RIGHT.z * 0.72);

      if (marker) {
        marker.group.visible = mode === "walking";
        marker.group.position.set(targetPosition.x, targetPosition.y, targetPosition.z);
        // Statically oriented facing the approach trail - never swivels towards player
        marker.group.rotation.y = -0.42;
        marker.setStep(guideMetRef.current ? callbacksRef.current.solved.length + 1 : 0);
        marker.update(elapsed, reducedMotion);
      }

      if (objectiveCueRef.current && mode === "walking") {
        const projected = new THREE.Vector3(targetPosition.x, targetPosition.y + 1.4, targetPosition.z).project(camera);
        const cue = edgeIndicator(projected.x, projected.y, projected.z > 1, 0.18);
        objectiveCueRef.current.hidden = cue.onScreen;
        objectiveCueRef.current.style.left = `${50 + cue.x * 46}%`;
        objectiveCueRef.current.style.top = `${50 - cue.y * 42}%`;
        objectiveCueRef.current.style.transform = `translate(-50%, -50%) rotate(${-cue.angle}rad)`;
      } else if (objectiveCueRef.current) {
        objectiveCueRef.current.hidden = true;
      }

      if (mode === "workshop") {
        const mobile = window.innerWidth < 640;
        const focus = new THREE.Vector3(1.8, mobile ? -0.25 : 1.1, 2.8);
        player.anchor.position.set(0.2, 0.35, 3.3);
        player.anchor.scale.setScalar(mobile ? 0.82 : 1);
        player.anchor.rotation.y = Math.atan2(6.95 - 0.2, 6.6 - 3.3) + (reducedMotion ? 0 : Math.sin(elapsed * 0.35) * 0.08);
        player.play("idle");
        const follow = mobile ? 7.4 : 6.4;
        const desired = new THREE.Vector3(focus.x - ROUTE_FORWARD.x * follow, focus.y + 6.5, focus.z - ROUTE_FORWARD.z * follow);
        camera.position.lerp(desired, 1 - Math.exp(-3 * dt));
        camera.lookAt(focus);
      } else if (mode === "opening") {
        const mobile = window.innerWidth < 640;
        player.anchor.position.set(0, 0, 0);
        player.anchor.scale.setScalar(1);
        const guidePos = guide ? guide.anchor.position : new THREE.Vector3(0.5, 0, 1.35);
        player.anchor.rotation.y = Math.atan2(guidePos.x, guidePos.z);
        player.play("idle");
        if (guide) {
          guide.anchor.rotation.y = Math.atan2(-guidePos.x, -guidePos.z);
          guide.play("interact");
        }
        // Composed two-shot camera framing both characters with unobstructed faces
        const pPos = player.anchor.position;
        const midX = (pPos.x + guidePos.x) * 0.5;
        const midY = (pPos.y + guidePos.y) * 0.5;
        const midZ = (pPos.z + guidePos.z) * 0.5;

        const dx = guidePos.x - pPos.x;
        const dz = guidePos.z - pPos.z;
        const dist = Math.max(1.2, Math.hypot(dx, dz));

        let nx = -dz / dist;
        let nz = dx / dist;
        if (nz < 0) {
          nx = -nx;
          nz = -nz;
        }

        const camDist = mobile ? 3.6 : 3.2;
        const camY = midY + (mobile ? 1.48 : 1.36);
        const targetCamPos = new THREE.Vector3(midX + nx * camDist, camY, midZ + nz * camDist);
        const targetLookAt = new THREE.Vector3(midX, midY + (mobile ? 1.1 : 1.02), midZ);

        camera.position.lerp(targetCamPos, 1 - Math.exp(-4.5 * dt));
        currentLookAt.lerp(targetLookAt, 1 - Math.exp(-4.5 * dt));
        camera.lookAt(currentLookAt);
      } else {
        player.anchor.scale.setScalar(1);

        // Direction input resolution
        let screenX = 0;
        let screenBack = 0;
        directions.forEach(([x, z]) => {
          screenX += x;
          screenBack += z;
        });
        const magnitude = Math.hypot(screenX, screenBack);
        const scale = magnitude > 1 ? 1 / magnitude : 1;
        screenX *= scale;
        const screenForward = -screenBack * scale;

        // Sonic Lost World Locomotion & Acceleration Curves
        const isSprinting = magnitude > 0.85;
        const topTargetSpeed = isSprinting ? 6.2 : 4.4;
        const desiredX = (SCREEN_RIGHT.x * screenX + ROUTE_FORWARD.x * screenForward) * topTargetSpeed;
        const desiredZ = (SCREEN_RIGHT.z * screenX + ROUTE_FORWARD.z * screenForward) * topTargetSpeed;

        const groundedBefore = physics.isGrounded();

        // Target scanning for Homing Lock
        if (mode === "walking") {
          const facingYaw = player.anchor.rotation.y;
          const facingVector: [number, number] = [Math.sin(facingYaw), Math.cos(facingYaw)];

          const candidateTargets: HomingTarget[] = [];
          if (nextPlatform && !callbacksRef.current.solved.includes(nextPlatform.lessonId ?? "")) {
            candidateTargets.push({
              id: nextPlatform.lessonId ?? nextPlatform.id,
              name: nextPlatform.lessonId ? "Lesson Beacon: " + nextPlatform.lessonId : "Recovery Beacon",
              position: [nextPlatform.x, nextPlatform.top + 0.6, nextPlatform.z],
              kind: "lesson",
              active: true,
            });
          }
          for (const token of tokens) {
            if (!callbacksRef.current.collected.includes(token.id)) {
              candidateTargets.push({
                id: token.id,
                name: "Risk Token",
                position: token.position,
                kind: "token",
                active: true,
              });
            }
          }

          const lock = findBestHomingTarget(player.anchor.position.toArray(), facingVector, candidateTargets, groundedBefore);
          callbacksRef.current.lock(lock);
          if (lock && homingReticle) {
            homingReticle.show();
            homingReticle.update(lock.target.position, elapsed, camera);
          } else if (homingReticle) {
            homingReticle.hide();
          }
        }

        // ==========================================
        // TRAVERSAL STATE MACHINE
        // ==========================================
        if (movementState === "homing" && homingArcState.active) {
          const arc = stepHomingArc(homingArcState, dt);
          player.anchor.position.set(...arc.currentPos);
          physics.setPosition(arc.currentPos);
          player.anchor.rotation.y = arc.rotationY;
          player.play("homing", 18);
          player.update(dt, 18);

          if (arc.finished) {
            movementState = "airborne";
            setTraversalBadge(null);
            const targetId = homingArcState.targetId;
            if (targetId) {
              const matchedToken = tokens.find((t) => t.id === targetId);
              if (matchedToken && !callbacksRef.current.collected.includes(targetId)) {
                callbacksRef.current.collected.push(targetId);
                setCollected((old) => (old.includes(targetId) ? old : old.concat(targetId)));
                matchedToken.model.visible = false;
                showEvent("Risk token acquired via homing strike!", "collect");
              }
              const matchedPlatform = PLATFORMS.find((p) => p.lessonId === targetId || p.id === targetId);
              if (matchedPlatform) {
                interact(targetId);
              }
            }
            physics.setVerticalVelocity(5.2);
          }
        } else if (movementState === "wallrun" && wallRunState.active) {
          const run = stepWallRun(wallRunState, player.anchor.position.toArray(), dt);
          setTraversalBadge("Wall Run ⚡");

          if (run.continueRun) {
            player.anchor.position.set(...run.newPos);
            physics.setPosition(run.newPos);
            player.anchor.rotation.y = run.rotationY;
            player.play("wallrun", wallRunState.speed);
            player.update(dt, wallRunState.speed, wallRunState.surface?.normal, wallRunState.surface?.tangent);

            // Wall scrape dust
            if (!reducedMotion && Math.random() < 0.35) {
              const particle = dustParticles.find((item) => item.age >= item.lifetime);
              if (particle) {
                particle.age = 0;
                particle.lifetime = 0.45;
                particle.mesh.visible = true;
                particle.mesh.position.set(...run.newPos);
                particle.mesh.scale.setScalar(0.65);
                particle.velocity.set(
                  (wallRunState.surface?.normal[0] ?? 0) * 1.2,
                  1.1,
                  (wallRunState.surface?.normal[1] ?? 0) * 1.2,
                );
              }
            }
          } else {
            movementState = "airborne";
            setTraversalBadge(null);
            velocity.x = run.newVelocity[0];
            velocity.z = run.newVelocity[2];
            physics.setVerticalVelocity(run.newVelocity[1]);
          }
        } else {
          // Standard Grounded / Airborne Locomotion with Responsive Turning
          if (mode === "walking") {
            const accelerating = magnitude > 0.05;
            const response = groundedBefore ? (accelerating ? 20 : 17) : accelerating ? 8 : 2.5;
            const blend = 1 - Math.exp(-response * dt);
            velocity.x += (desiredX - velocity.x) * blend;
            velocity.z += (desiredZ - velocity.z) * blend;

            // Check Wall-Run Entry
            const entry = evaluateWallRunEntry(player.anchor.position.toArray(), [velocity.x, velocity.z], groundedBefore, WALL_RUN_SURFACES);
            if (entry.canEnter && entry.surface) {
              movementState = "wallrun";
              wallRunState.active = true;
              wallRunState.surface = entry.surface;
              wallRunState.directionSign = entry.directionSign;
              wallRunState.speed = Math.max(4.2, Math.hypot(velocity.x, velocity.z));
              wallRunState.duration = 0;
              playSound("jump");
              showEvent("Wall running!", "jump");
            }
          } else {
            velocity.x *= Math.exp(-18 * dt);
            velocity.z *= Math.exp(-18 * dt);
          }

          const position = physics.step(velocity.x, velocity.z, dt);
          player.anchor.position.set(...position);
          if (guide) guide.anchor.position.set(...GUIDE_START);

          const grounded = physics.isGrounded();
          const currentSpeed = Math.hypot(velocity.x, velocity.z);
          const moving = mode === "walking" && currentSpeed > 0.4 && grounded;

          if (!grounded) {
            if (movementState === "gliding") {
              // Gliding: cap vertical descent rate to gentle -1.6 m/s
              if (physics.verticalVelocity() < -1.6) {
                physics.setVerticalVelocity(-1.6);
              }
              // Responsive glide air steering
              const glideSpeed = 5.2;
              if (magnitude > 0.05) {
                const steerBlend = 1 - Math.exp(-12 * dt);
                velocity.x += (desiredX * (glideSpeed / 6.2) - velocity.x) * steerBlend;
                velocity.z += (desiredZ * (glideSpeed / 6.2) - velocity.z) * steerBlend;
              }
              setTraversalBadge("Gliding 🪽");
              player.play("glide", 1.0);
            } else if (movementState !== "homing" && movementState !== "wallrun") {
              movementState = "airborne";
              player.play(physics.verticalVelocity() > 0.12 ? "jump" : "fall", currentSpeed);
            }
          } else {
            if (movementState === "gliding") {
              showEvent("Soft landing.", "checkpoint");
            }
            movementState = "grounded";
            isGliding = false;
            setTraversalBadge(null);
            player.play(moving ? (currentSpeed > 5.0 ? "run" : "walk") : "idle", currentSpeed);
          }

          if (!wasGrounded && grounded && !reducedMotion) {
            landingSpring.x = 0.88;
            landingSpring.v = 0;
            // Soft landing dust puff
            for (let puff = 0; puff < 5; puff += 1) {
              const particle = dustParticles.find((item) => item.age >= item.lifetime);
              if (!particle) break;
              particle.age = 0;
              particle.lifetime = 0.55;
              particle.mesh.visible = true;
              particle.mesh.position.set(position[0] + (puff % 2 ? 0.18 : -0.18), position[1] + 0.04, position[2] + (puff > 2 ? 0.18 : -0.18));
              particle.mesh.scale.setScalar(0.85);
              particle.velocity.set((Math.random() - 0.5) * 1.1, 0.35, (Math.random() - 0.5) * 1.1);
            }
          }
          wasGrounded = grounded;

          if (currentSpeed > 0.18) {
            const yaw = Math.atan2(velocity.x, velocity.z);
            const turn = Math.atan2(Math.sin(yaw - player.anchor.rotation.y), Math.cos(yaw - player.anchor.rotation.y));
            player.anchor.rotation.y += turn * Math.min(1, dt * 12);
          }

          player.update(dt, currentSpeed);

          if (position[1] < -7) resetPlayer("You wandered beyond the island. Back to the last checkpoint.");
          else if (physics.hitHazard()) resetPlayer("The spike trap sent you back to your last checkpoint.");
        }

        if (guide) {
          guide.play(mode === "question" || mode === "feedback" ? "interact" : "idle");
          guide.anchor.rotation.y = Math.atan2(player.anchor.position.x - guide.anchor.position.x, player.anchor.position.z - guide.anchor.position.z);
          guide.update(dt);
        }

        // Objective and Token Collision Check
        if (elapsed - lastCheck > 0.14) {
          lastCheck = elapsed;
          let closest: string | null = null;
          let nearest = 1.65;
          const pos = player.anchor.position;

          for (const platform of PLATFORMS) {
            if (platform.lessonId && callbacksRef.current.solved.includes(platform.lessonId)) continue;
            if (platform.id === "finish" && callbacksRef.current.solved.length !== LESSONS.length) continue;
            if (!platform.lessonId && platform.id !== "finish") continue;
            const distance = Math.hypot(pos.x - platform.x, pos.z - platform.z);
            if (distance < nearest && Math.abs(pos.y - platform.top) < 1.3) {
              nearest = distance;
              closest = platform.lessonId ?? (platform.id === "finish" ? "finish" : null);
            }
          }

          const checkpoint = PLATFORMS.find((item) => item.id === "priority")!;
          if (
            Math.hypot(pos.x - checkpoint.x, pos.z - checkpoint.z) < 1.15 &&
            Math.abs(pos.y - checkpoint.top) < 0.28 &&
            movementState === "grounded" &&
            !callbacksRef.current.solved.includes("priority")
          ) {
            setCheckpoint("priority");
          }

          if (guide && Math.hypot(pos.x - guide.anchor.position.x, pos.z - guide.anchor.position.z) < 1.45 && mode === "walking") {
            closest = "guide";
          }
          callbacksRef.current.nearby(closest);

          for (const token of tokens) {
            if (callbacksRef.current.collected.includes(token.id)) continue;
            if (Math.hypot(pos.x - token.position[0], pos.z - token.position[2]) < 0.78 && Math.abs(pos.y - token.position[1]) < 1) {
              callbacksRef.current.collected.push(token.id);
              setCollected((old) => (old.includes(token.id) ? old : old.concat(token.id)));
              token.model.visible = false;
              showEvent("Risk token collected.", "collect");
            }
          }

          snapshotRef.current = {
            phase: mode,
            player: [pos.x, pos.y, pos.z],
            grounded: physics.isGrounded(),
            movementState,
            hasTargetLock: Boolean(targetLockRef.current),
            checkpoint: checkpointRef.current,
            collected: callbacksRef.current.collected.length,
            completedLessons: callbacksRef.current.solved.length,
            objective: callbacksRef.current.objective,
          };
        }

        // Camera Follow with dynamic look-ahead and cinematic dialogue framing
        const mobile = window.innerWidth < 640;
        const isKayaDialogue = Boolean(guide && mode === "feedback" && !activeLesson);

        if (isKayaDialogue && guide) {
          // Composed two-shot framing both characters with unobstructed faces
          const pPos = player.anchor.position;
          const gPos = guide.anchor.position;
          const midX = (pPos.x + gPos.x) * 0.5;
          const midY = (pPos.y + gPos.y) * 0.5;
          const midZ = (pPos.z + gPos.z) * 0.5;

          const dx = gPos.x - pPos.x;
          const dz = gPos.z - pPos.z;
          const dist = Math.max(1.2, Math.hypot(dx, dz));

          let nx = -dz / dist;
          let nz = dx / dist;
          if (nz < 0) {
            nx = -nx;
            nz = -nz;
          }

          const camDist = mobile ? 3.6 : 3.2;
          const camY = midY + (mobile ? 1.48 : 1.36);
          const targetCamPos = new THREE.Vector3(midX + nx * camDist, camY, midZ + nz * camDist);
          const targetLookAt = new THREE.Vector3(midX, midY + (mobile ? 1.1 : 1.02), midZ);

          camera.position.lerp(targetCamPos, 1 - Math.exp(-4.5 * dt));
          currentLookAt.lerp(targetLookAt, 1 - Math.exp(-4.5 * dt));
          camera.lookAt(currentLookAt);
        } else {
          // Dynamic exploration follow-camera
          const follow = mobile ? 7.4 : 6.4;
          const pos = player.anchor.position;
          const desired = new THREE.Vector3(pos.x - ROUTE_FORWARD.x * follow, pos.y + 6.8, pos.z - ROUTE_FORWARD.z * follow);
          if (previousMode === "workshop") {
            camera.position.copy(desired);
            currentLookAt.set(pos.x + ROUTE_FORWARD.x * 1.25, pos.y + (mobile ? 1.3 : 2.05), pos.z + ROUTE_FORWARD.z * 1.25);
          } else {
            camera.position.lerp(desired, 1 - Math.exp(-3.6 * dt));
            const targetLookAt = new THREE.Vector3(pos.x + ROUTE_FORWARD.x * 1.25, pos.y + (mobile ? 1.3 : 2.05), pos.z + ROUTE_FORWARD.z * 1.25);
            currentLookAt.lerp(targetLookAt, 1 - Math.exp(-4.0 * dt));
          }
          camera.lookAt(currentLookAt);
        }
      }

      if (!reducedMotion) {
        swayingFoliage.forEach((foliage) => {
          foliage.rotation.z = Math.sin(elapsed * 0.72 + Number(foliage.userData.windPhase)) * 0.012;
        });
        butterflies.forEach(({ group, wings, phase, drift, home }) => {
          const t = elapsed;
          const x = home.x + Math.sin(t * drift[0] + phase) * 0.42;
          const y = home.y + Math.sin(t * 1.7 + phase) * 0.14;
          const z = home.z + Math.cos(t * drift[1] + phase) * 0.35;
          group.position.set(x, y, z);

          // Align butterfly heading with flight trajectory tangent
          const dx = Math.cos(t * drift[0] + phase) * drift[0] * 0.42;
          const dz = -Math.sin(t * drift[1] + phase) * drift[1] * 0.35;
          group.rotation.y = Math.atan2(dx, dz);

          const flap = Math.sin(t * drift[2] + phase) * 0.62;
          wings[0].rotation.z = flap;
          wings[1].rotation.z = -flap;
        });
      }

      meadowGrass?.update(elapsed, player.anchor.position);
      meadowBirds?.update(elapsed, player.anchor.position, mode === "walking", reducedMotion);

      if (!reducedMotion) {
        tokens.forEach((token, index) => {
          if (token.model.visible) {
            token.model.rotation.y += dt * 1.5;
            token.model.position.y = token.position[1] + Math.sin(elapsed * 2.2 + index) * 0.07;
          }
        });
      }

      if (lagoonMaterial) {
        lagoonMaterial.uniforms.uTime.value = elapsed;
      }

      if (reducedMotion) {
        renderer.render(scene, camera);
      } else {
        composer.render();
      }
      previousMode = mode;
    });

    const clear = () => {
      directions.clear();
      velocity.x = 0;
      velocity.z = 0;
      physics?.releaseJump();
    };
    const blur = () => {
      clear();
      pressedRef.current.clear();
    };
    const visibility = () => {
      if (document.hidden) blur();
    };

    window.addEventListener("blur", blur);
    document.addEventListener("visibilitychange", visibility);

    engineRef.current = {
      start: () => {
        physics?.respawn(PLAYER_START);
        playerIndex = selectedRef.current;
        const active = characters[playerIndex];
        if (active) {
          active.anchor.position.set(...PLAYER_START);
          active.anchor.rotation.y = Math.atan2(ROUTE_FORWARD.x, ROUTE_FORWARD.z);
          active.model.userData.baseVisualScale = active.model.scale.x;
        }
        guideCharacter?.anchor.position.set(...GUIDE_START);
        guideMetRef.current = false;
        checkpointRef.current = CHECKPOINT_START;
        lastCheckpointId = "home";
        movementState = "grounded";
        wallRunState.active = false;
        homingArcState.active = false;
        setTraversalBadge(null);
        directions.clear();
        pressedRef.current.clear();
        wasGrounded = false;
        landingSpring.x = 1;
        landingSpring.v = 0;
        dustParticles.forEach((particle) => {
          particle.age = particle.lifetime;
          particle.mesh.visible = false;
        });
        nearbyRef.current = null;
        tokens.forEach((token) => {
          token.model.visible = true;
          token.model.position.set(...token.position);
        });
        setNearby(null);
        setCollected([]);
        setCompleted([]);
        setCharactersVisible();
      },
      move: (source, x, z) => {
        directions.set(source, [x, z]);
      },
      releaseMove: (source) => {
        directions.delete(source);
      },
      jump: () => {
        if (phaseRef.current !== "walking") return;

        // If currently in Wall-Run: Execute Wall Kick
        if (movementState === "wallrun" && wallRunState.active && wallRunState.surface) {
          const impulse = computeWallJumpImpulse(wallRunState.surface, wallRunState.directionSign);
          wallRunState.active = false;
          movementState = "airborne";
          velocity.x = impulse[0];
          velocity.z = impulse[2];
          physics?.setVerticalVelocity(impulse[1]);
          physics?.wallJump(impulse[1]);
          setTraversalBadge("Wall Kick ⚡");
          playSound("jump");
          showEvent("Wall kick!", "jump");
          return;
        }

        // If currently Airborne or Gliding with a valid Homing Target Lock: Execute Homing Attack
        if ((movementState === "airborne" || movementState === "gliding") && targetLockRef.current) {
          executeHoming();
          return;
        }

        // If currently Airborne and falling (or jump pressed in air): Deploy Gliding!
        if (movementState === "airborne" && physics && !physics.isGrounded()) {
          movementState = "gliding";
          isGliding = true;
          playSound("jump");
          showEvent("Gliding! 🪽", "jump");
          setTraversalBadge("Gliding 🪽");
          return;
        }

        // If currently Gliding and jump pressed again: Cancel Glide / Drop
        if (movementState === "gliding") {
          movementState = "airborne";
          isGliding = false;
          setTraversalBadge(null);
          return;
        }

        // Standard Jump
        if (physics?.jump()) {
          movementState = "airborne";
          isGliding = false;
          playSound("jump");
        }
      },
      releaseJump: () => {
        physics?.releaseJump();
      },
      homing: executeHoming,
      pause: clear,
      select: (index, colour) => {
        playerIndex = 0;
        const chosenColor = CHARACTER_TINTS[index] ?? colour;
        characters[0]?.setTint(chosenColor);
        guideCharacter?.anchor.position.set(...GUIDE_START);
        setCharactersVisible();
      },
      tint: (colour) => characters[0]?.setTint(colour),
      sound: (enabled) => {
        if (enabled) {
          try {
            audioContext ??= new AudioContext();
            void audioContext.resume();
          } catch {
            /* Optional audio. */
          }
        }
      },
      sfx: playSound,
      dispose: () => {
        disposed = true;
        renderer.setAnimationLoop(null);
        observer.disconnect();
        window.removeEventListener("blur", blur);
        document.removeEventListener("visibilitychange", visibility);
        physics?.dispose();
        meadowGrass?.dispose();
        homingReticle?.dispose();
        disposeResources(scene, guideCharacter ? [...characters, guideCharacter] : characters, loadedGltfs);
        audioContext?.close();
        composer.dispose();
        lagoonMaterial?.dispose();
        renderer.dispose();
        if (window.render_game_to_text) delete window.render_game_to_text;
      },
    };

    if (import.meta.env.DEV || new URLSearchParams(window.location.search).get("qa") === "1") {
      window.render_game_to_text = () =>
        JSON.stringify({
          ...snapshotRef.current,
          diagnostics: {
            drawCalls: renderer.info.render.calls,
            triangles: renderer.info.render.triangles,
            textures: renderer.info.memory.textures,
            birdVisible: Boolean(meadowBirds?.isFlying()),
            grassInstances: meadowGrass?.mesh.count ?? 0,
            movementState,
            wallRunActive: wallRunState.active,
            homingActive: homingArcState.active,
            reducedMotion,
          },
        });
    }

    return () => engineRef.current?.dispose();
  }, [reducedMotion, showEvent, interact]);

  const chooseCharacter = useCallback(
    (index: number) => {
      setSelected(index);
      engineRef.current?.select(index, tint);
    },
    [tint],
  );

  const chooseTint = useCallback((colour: string) => {
    setTint(colour);
    engineRef.current?.tint(colour);
  }, []);

  const enterCourse = useCallback(() => {
    engineRef.current?.start();
    setDialogue({
      speaker: "Kaya, local coordinator",
      text: "The island service hub opens tomorrow. I’m checking that our new public service is ready. Follow the markers and help me make five practical cyber security decisions before the doors open.",
    });
    setPhase("opening");
    requestAnimationFrame(() => frameRef.current?.focus({ preventScroll: true }));
  }, []);

  const answer = useCallback(
    (index: number) => {
      if (!lesson) return;
      const option = lesson.options[index];
      if (!option) return;
      setFeedbackCorrect(option.correct);
      setDialogue({ speaker: option.correct ? "Good choice" : "Take another look", text: option.feedback });
      if (option.correct) {
        setCompleted((old) => (old.includes(lesson.id) ? old : old.concat(lesson.id)));
        if (lesson.id === "priority") {
          const platform = PLATFORMS.find((item) => item.id === "priority")!;
          checkpointRef.current = [platform.x, platform.top, platform.z];
        }
      }
      setPhase("feedback");
    },
    [lesson],
  );

  const continueDialogue = useCallback(() => {
    if (phase === "opening") setPhase("walking");
    else if (phase === "feedback") {
      if (activeLesson && !feedbackCorrect) {
        const found = LESSONS.find((item) => item.id === activeLesson);
        if (found) setDialogue({ speaker: "Trail marker | " + found.title, text: found.prompt });
        setPhase("question");
      } else {
        setActiveLesson(null);
        setPhase("walking");
      }
    } else if (phase === "complete") {
      setCompleted([]);
      setCollected([]);
      setActiveLesson(null);
      setPhase("workshop");
      engineRef.current?.start();
    }
    requestAnimationFrame(() => frameRef.current?.focus({ preventScroll: true }));
  }, [activeLesson, feedbackCorrect, phase]);

  const pauseGame = () => {
    if (phase !== "walking") return;
    engineRef.current?.pause();
    setPhase("paused");
  };

  const resumeGame = () => {
    setPhase("walking");
    requestAnimationFrame(() => frameRef.current?.focus({ preventScroll: true }));
  };

  const leaveGame = () => {
    engineRef.current?.start();
    setActiveLesson(null);
    setEventMessage("");
    setDialogue({
      speaker: "Kaya, local coordinator",
      text: "The island service hub opens tomorrow. I’m checking that our new public service is ready. Follow the markers and help me make five practical cyber security decisions before the doors open.",
    });
    setPhase("workshop");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const key = event.key.toLowerCase();
    if (key === "escape") {
      if (phase === "walking") {
        event.preventDefault();
        pauseGame();
        return;
      }
      if (phase === "question") {
        setActiveLesson(null);
        setPhase("walking");
        return;
      }
    }
    if (event.target instanceof HTMLElement && event.target.closest("button")) return;
    if (phase !== "walking") {
      if (key === " " || key === "enter") {
        event.preventDefault();
        continueDialogue();
      }
      return;
    }

    if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(key)) {
      event.preventDefault();
      pressedRef.current.add(key);
      const x = Number(pressedRef.current.has("d") || pressedRef.current.has("arrowright")) - Number(pressedRef.current.has("a") || pressedRef.current.has("arrowleft"));
      const z = Number(pressedRef.current.has("s") || pressedRef.current.has("arrowdown")) - Number(pressedRef.current.has("w") || pressedRef.current.has("arrowup"));
      engineRef.current?.move("keyboard", x, z);
    } else if (key === " " && !event.repeat) {
      event.preventDefault();
      engineRef.current?.jump();
    } else if ((key === "h" || key === "q" || key === "j") && !event.repeat) {
      event.preventDefault();
      engineRef.current?.homing();
    } else if ((key === "e" || key === "enter") && nearby) {
      event.preventDefault();
      interact(nearby);
    }
  };

  const onKeyUp = (event: KeyboardEvent<HTMLDivElement>) => {
    const key = event.key.toLowerCase();
    if (key === " ") engineRef.current?.releaseJump();
    pressedRef.current.delete(key);
    if (phase !== "walking") return;
    const x = Number(pressedRef.current.has("d") || pressedRef.current.has("arrowright")) - Number(pressedRef.current.has("a") || pressedRef.current.has("arrowleft"));
    const z = Number(pressedRef.current.has("s") || pressedRef.current.has("arrowdown")) - Number(pressedRef.current.has("w") || pressedRef.current.has("arrowup"));
    engineRef.current?.move("keyboard", x, z);
  };

  // Virtual Analog Joystick
  const onJoystickDown = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    joystickRef.current = { active: true, pointerId: event.pointerId };
    updateJoystick(event);
  };

  const updateJoystick = (event: PointerEvent<HTMLDivElement>) => {
    if (!joystickRef.current.active) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rawX = event.clientX - centerX;
    const rawY = event.clientY - centerY;
    const maxRadius = 38;
    const dist = Math.hypot(rawX, rawY);
    const deadZone = 6;

    if (dist < deadZone) {
      if (joystickKnobRef.current) joystickKnobRef.current.style.transform = "translate(0px, 0px)";
      engineRef.current?.releaseMove("joystick");
      return;
    }

    const clampedDist = Math.min(dist, maxRadius);
    const normDist = (clampedDist - deadZone) / (maxRadius - deadZone);
    const dirX = rawX / dist;
    const dirY = rawY / dist;
    const moveX = dirX * normDist;
    const moveZ = dirY * normDist;

    if (joystickKnobRef.current) {
      joystickKnobRef.current.style.transform = `translate(${dirX * clampedDist}px, ${dirY * clampedDist}px)`;
    }
    engineRef.current?.move("joystick", moveX, moveZ);
  };

  const onJoystickUp = () => {
    joystickRef.current = { active: false, pointerId: null };
    if (joystickKnobRef.current) joystickKnobRef.current.style.transform = "translate(0px, 0px)";
    engineRef.current?.releaseMove("joystick");
  };

  const jumpTouch = {
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      engineRef.current?.jump();
    },
    onPointerUp: () => engineRef.current?.releaseJump(),
    onPointerCancel: () => engineRef.current?.releaseJump(),
    onLostPointerCapture: () => engineRef.current?.releaseJump(),
    onClick: (event: MouseEvent<HTMLButtonElement>) => {
      if (event.detail === 0) engineRef.current?.jump();
    },
  };

  const homingTouch = {
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      engineRef.current?.homing();
    },
  };

  const trapPauseFocus = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      resumeGame();
      return;
    }
    if (event.key !== "Tab") return;
    const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not([disabled])");
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  const actionLabel =
    nearby === "finish"
      ? "Enter the recovery beacon"
      : nearby === "guide"
      ? "Talk to Kaya"
      : nearby
      ? "Explore " + (LESSONS.find((item) => item.id === nearby)?.title ?? "trail marker")
      : "";

  return (
    <div className="risk-game__play">
      <div
        className={"risk-game__frame" + (phase === "walking" ? " risk-game__frame--exploring" : "")}
        ref={frameRef}
        tabIndex={0}
        role="group"
        aria-label="Secure the island office 3D cyber security exercise"
        aria-describedby="risk-game-instructions"
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
      >
        <canvas
          ref={canvasRef}
          className="risk-game__canvas"
          aria-label="Three-dimensional island garden with a winding trail, meadow, pond, woodland, Kaya, five cyber-risk markers, stone retaining wall-runs, and a recovery beacon."
        />

        {phase !== "workshop" && phase !== "paused" && (
          <div className="risk-game__topbar" aria-live="polite">
            <div className="risk-game__progress-copy">
              <strong>{isComplete ? "Route complete" : completed.length + " of 5 actions complete"}</strong>
              <span>
                {isComplete
                  ? "All five decisions complete"
                  : phase === "walking"
                  ? nearby
                    ? actionLabel
                    : "Next: " + targetName
                  : objectiveRef.current}
              </span>
            </div>
            <div className="risk-game__topbar-controls">
              {traversalBadge && <span className="risk-game__traversal-badge">{traversalBadge}</span>}
              <div className="risk-game__collectible-count" aria-label={collected.length + " of 5 tokens collected"}>
                <span aria-hidden="true">✦</span> {collected.length}/5
              </div>
              {phase === "walking" && (
                <button type="button" className="risk-game__sound" onClick={pauseGame}>
                  Pause
                </button>
              )}
              <button
                type="button"
                className="risk-game__sound"
                aria-pressed={soundOn}
                onClick={() => {
                  const next = !soundOn;
                  setSoundOn(next);
                  engineRef.current?.sound(next);
                }}
              >
                Sound {soundOn ? "on" : "off"}
              </button>
            </div>
          </div>
        )}

        {phase === "walking" && <div ref={objectiveCueRef} className="risk-game__objective-cue" aria-hidden="true">➤</div>}

        {loading && <div className="risk-game__loading" role="status">Loading the local character and island models…</div>}
        {failed && (
          <div className="risk-game__loading" role="status">
            The 3D scene could not start. The practical cyber security guidance remains available on this page.
          </div>
        )}

        {phase === "workshop" && !loading && !failed && (
          <section className="risk-game__workshop" aria-labelledby="risk-game-workshop-heading">
            <div className="risk-game__workshop-copy">
              <p className="risk-game__eyebrow">Character workshop</p>
              <h3 id="risk-game-workshop-heading">Choose your explorer</h3>
              <p>Pick a colour for your explorer. Kaya, the island coordinator, will guide you along the route.</p>
              <div className="risk-game__variant-list" role="group" aria-label="Choose your explorer’s colour">
                {CHARACTERS.map((choice, index) => (
                  <button
                    key={choice.id}
                    type="button"
                    className={"risk-game__variant" + (selected === index ? " is-selected" : "")}
                    aria-pressed={selected === index}
                    aria-label={choice.label + (selected === index ? ", selected" : "")}
                    onClick={() => chooseCharacter(index)}
                  >
                    <span aria-hidden="true" className={"risk-game__variant-dot risk-game__variant-dot--" + (index + 1)} />
                    {choice.label}
                  </button>
                ))}
              </div>
              <div className="risk-game__tints" role="group" aria-label="Choose a colour tint">
                <span>Colour tint</span>
                {TINTS.map((preset) => (
                  <button
                    key={preset.colour}
                    type="button"
                    className={"risk-game__tint" + (tint === preset.colour ? " is-selected" : "")}
                    aria-label={preset.label}
                    aria-pressed={tint === preset.colour}
                    onClick={() => chooseTint(preset.colour)}
                  >
                    <span aria-hidden="true" style={{ backgroundColor: preset.colour }} />
                  </button>
                ))}
              </div>
              <p className="risk-game__workshop-caption">
                {CHARACTERS[selected].label} · {TINTS.find((item) => item.colour === tint)?.label}
              </p>
              <button type="button" className="risk-game__primary" onClick={enterCourse}>
                Start the route <span aria-hidden="true">→</span>
              </button>
            </div>
          </section>
        )}

        {phase !== "walking" && phase !== "workshop" && phase !== "paused" && !failed && !loading && (
          <section className={"risk-game__dialogue risk-game__dialogue--" + phase} aria-labelledby="risk-game-speaker">
            <div className="risk-game__dialogue-content">
              <p className="risk-game__speaker" id="risk-game-speaker">
                {dialogue.speaker}
              </p>
              <p className="risk-game__dialogue-text">{dialogue.text}</p>
              {phase === "question" && lesson && (
                <div className="risk-game__choices" role="group" aria-label="Choose the safer action">
                  {lesson.options.map((option, index) => (
                    <button key={option.label} type="button" className="risk-game__choice" onClick={() => answer(index)}>
                      <span className="risk-game__choice-key" aria-hidden="true">
                        {index + 1}
                      </span>
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              )}
              {(phase === "opening" || phase === "feedback" || phase === "complete") && (
                <div className="risk-game__dialogue-actions">
                  <button type="button" className="risk-game__primary" onClick={continueDialogue}>
                    {phase === "opening"
                      ? "Explore the course"
                      : phase === "complete"
                      ? "Choose another explorer"
                      : feedbackCorrect
                      ? "Continue along the trail"
                      : "Try the choice again"}
                    <span aria-hidden="true"> →</span>
                  </button>
                  {phase === "complete" && (
                    <button
                      type="button"
                      className="risk-game__secondary"
                      onClick={() => {
                        setCompleted([]);
                        setCollected([]);
                        engineRef.current?.start();
                        setDialogue({
                          speaker: "Kaya, local coordinator",
                          text: "Welcome back. The service hub is ready for another readiness walk.",
                        });
                        setPhase("opening");
                      }}
                    >
                      Play the route again
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {phase === "paused" && (
          <section
            className="risk-game__pause"
            role="dialog"
            aria-modal="true"
            aria-labelledby="risk-game-pause-heading"
            onKeyDown={trapPauseFocus}
          >
            <p className="risk-game__eyebrow">Your progress is saved</p>
            <h3 id="risk-game-pause-heading">Route paused</h3>
            <p>Take a break. Resume when you are ready, or return to the character workshop.</p>
            <button type="button" className="risk-game__primary" autoFocus onClick={resumeGame}>
              Resume route
            </button>
            <button type="button" className="risk-game__secondary" onClick={leaveGame}>
              Return to character workshop
            </button>
          </section>
        )}

        {phase === "walking" && (
          <>
            <div className="risk-game__control-hint">
              <strong>Move</strong> arrows / WASD · <strong>Sprint</strong> hold direction · <strong>Wall Run</strong> run along stone walls · <strong>Wall Kick / Jump</strong> Space · <strong>Homing Dash</strong> Space in air with lock
            </div>
            {eventMessage && (
              <p className="risk-game__toast" role="status">
                {eventMessage}
              </p>
            )}
            {nearby && (
              <button className="risk-game__action" type="button" onClick={() => interact(nearby)}>
                {actionLabel}
                <span aria-hidden="true">↵</span>
              </button>
            )}
            {targetLock && (
              <button className="risk-game__homing-action" type="button" {...homingTouch} aria-label={"Homing dash toward " + targetLock.target.name}>
                ✦ Dash Target: {targetLock.target.name}
              </button>
            )}

            {/* Mobile Touch Analog Joystick */}
            <div
              className="risk-game__joystick-container"
              role="group"
              aria-label="Analog movement control"
              onPointerDown={onJoystickDown}
              onPointerMove={updateJoystick}
              onPointerUp={onJoystickUp}
              onPointerCancel={onJoystickUp}
              onLostPointerCapture={onJoystickUp}
            >
              <div ref={joystickKnobRef} className="risk-game__joystick-knob" />
            </div>

            <button type="button" className="risk-game__jump" {...jumpTouch}>
              {movementState === "wallrun"
                ? "Wall Kick"
                : movementState === "gliding"
                ? "Drop"
                : movementState === "airborne" && targetLock
                ? "Dash"
                : movementState === "airborne"
                ? "Glide"
                : "Jump"}
            </button>
          </>
        )}

        <span className="govuk-visually-hidden" id="risk-game-instructions">
          Choose an animated explorer and tint. Walk across the continuous ground using arrow keys or W, A, S, D; sprint by holding movement. Traverse stone retaining walls by running along them, and press Space to Wall-Kick. While airborne, target lock nearby beacons or risk tokens and press Space to execute a homing dash. Reach each marker, press E to interact, select an answer and continue. On touch screens use the analog joystick, Jump, and Dash buttons. The checkpoint flag saves your place near the middle of the route.
        </span>
      </div>
      <p className="govuk-body-s risk-game__screen-reader-status" aria-live="polite">
        {isComplete
          ? "All five cyber-risk actions are complete."
          : completed.length + " of five actions completed. Next objective: " + targetName + ". " + collected.length + " of five tokens collected."}
      </p>
    </div>
  );
}
