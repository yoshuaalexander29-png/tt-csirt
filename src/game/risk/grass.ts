import * as THREE from "three";
import { createSeededRandom, LAYOUT_SEED } from "@/game/risk/level";

export type MeadowGrass = {
  mesh: THREE.InstancedMesh;
  update: (time: number, player?: THREE.Vector3) => void;
  dispose: () => void;
};

const TRAIL: Array<[number, number]> = [
  [0, 0],
  [-1.7, -1.2],
  [-4.2, -2.1],
  [-6.3, -3.3],
  [-8.4, -2.8],
  [-10.5, -1.1],
  [-12.5, -0.1],
  [-14.5, -1.2],
  [-17, -2.6],
  [-19.4, -3.5],
  [-21.8, -4],
  [-24.6, -3.2],
  [-27, -1.2],
];

const CLEARINGS: Array<[number, number, number]> = [
  [0, 0, 2.8], // Spawn
  [0.5, 1.35, 2.0], // Guide
  [3.2, 3.6, 2.6], // Hub
  [-4.2, -2.1, 2.2], // Lesson 1
  [-8.4, -2.8, 2.2], // Lesson 2
  [-12.5, -0.1, 2.4], // Lesson 3
  [-17, -2.6, 2.2], // Lesson 4
  [-21.8, -4, 2.4], // Lesson 5
  [-27, -1.2, 2.6], // Finish beacon
  [-8.4, 5.1, 4.3], // Pond
  [-14.75, -1.35, 2.5], // Bridge
];

function distanceToSegment(x: number, z: number, a: [number, number], b: [number, number]) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const length2 = dx * dx + dz * dz;
  const t = length2 ? THREE.MathUtils.clamp(((x - a[0]) * dx + (z - a[1]) * dz) / length2, 0, 1) : 0;
  return Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz);
}

/**
 * Creates a cute, rounded 3-lobed clover / grass clump geometry.
 * Inspired by the lush, rounded toy foliage in The Legend of Zelda: Echoes of Wisdom.
 */
function createRoundedTuftGeometry(): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const random = createSeededRandom(LAYOUT_SEED + 57);

  // 3 gently fanned rounded lobes
  const lobeAngles = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3];

  lobeAngles.forEach((baseAngle) => {
    const angle = baseAngle + (random() - 0.5) * 0.35;
    const dirX = Math.cos(angle);
    const dirZ = Math.sin(angle);
    const sideX = -dirZ;
    const sideZ = dirX;

    const stemHeight = 0.08 + random() * 0.04;
    const lobeRadius = 0.09 + random() * 0.035;
    const lobeCenterDist = 0.12 + random() * 0.03;
    const lobeCenterX = dirX * lobeCenterDist;
    const lobeCenterZ = dirZ * lobeCenterDist;
    const lobeCenterY = stemHeight + lobeRadius * 0.85;

    // Build a rounded fan lobe (5 vertices, 4 triangles)
    const segments = 6;
    for (let s = 0; s < segments; s++) {
      const a1 = (s / segments) * Math.PI;
      const a2 = ((s + 1) / segments) * Math.PI;

      const p1X = lobeCenterX + (Math.cos(a1) * sideX + Math.sin(a1) * dirX * 0.7) * lobeRadius;
      const p1Y = lobeCenterY + Math.sin(a1) * lobeRadius * 0.8;
      const p1Z = lobeCenterZ + (Math.cos(a1) * sideZ + Math.sin(a1) * dirZ * 0.7) * lobeRadius;

      const p2X = lobeCenterX + (Math.cos(a2) * sideX + Math.sin(a2) * dirX * 0.7) * lobeRadius;
      const p2Y = lobeCenterY + Math.sin(a2) * lobeRadius * 0.8;
      const p2Z = lobeCenterZ + (Math.cos(a2) * sideZ + Math.sin(a2) * dirZ * 0.7) * lobeRadius;

      // Base point
      positions.push(0, 0.02, 0);
      positions.push(p1X, p1Y, p1Z);
      positions.push(p2X, p2Y, p2Z);

      // Soft upward normals for pillowed look
      normals.push(0, 0.95, 0.3);
      normals.push(dirX * 0.3, 0.85, dirZ * 0.3);
      normals.push(dirX * 0.3, 0.85, dirZ * 0.3);

      // Backside for two-sided lighting
      positions.push(0, 0.02, 0);
      positions.push(p2X, p2Y, p2Z);
      positions.push(p1X, p1Y, p1Z);

      normals.push(0, -0.95, -0.3);
      normals.push(-dirX * 0.3, -0.85, -dirZ * 0.3);
      normals.push(-dirX * 0.3, -0.85, -dirZ * 0.3);
    }
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  return geometry;
}

/**
 * Creates sparse, stylized meadow grass tufts in organic pockets.
 * Replaces noisy blade carpets with clear, readable diorama terrain.
 */
export function createMeadowGrass(scene: THREE.Scene, count = 600): MeadowGrass {
  const geometry = createRoundedTuftGeometry();
  const material = new THREE.MeshToonMaterial({
    color: "#68a658",
    side: THREE.DoubleSide,
  });

  let timeUniform: { value: number } | undefined;
  let playerUniform: { value: THREE.Vector3 } | undefined;

  material.onBeforeCompile = (program) => {
    timeUniform = { value: 0 };
    playerUniform = { value: new THREE.Vector3() };
    program.uniforms.uMeadowTime = timeUniform;
    program.uniforms.uHeroPosition = playerUniform;
    program.vertexShader = program.vertexShader.replace(
      "#include <common>",
      "#include <common>\nuniform float uMeadowTime;\nuniform vec3 uHeroPosition;",
    );
    program.vertexShader = program.vertexShader.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
      float meadowPhase = dot(instanceMatrix[3].xyz, vec3(0.42, 0.0, 0.58));
      float meadowBreeze = sin(uMeadowTime * 1.25 + meadowPhase) * 0.04;
      float grassHeight = max(0.0, transformed.y);
      vec2 awayFromHero = instanceMatrix[3].xz - uHeroPosition.xz;
      float heroDistance = length(awayFromHero);
      float brushBend = (1.0 - smoothstep(0.25, 1.4, heroDistance)) * 0.28;
      vec2 heroPush = heroDistance > 0.001 ? normalize(awayFromHero) * brushBend : vec2(0.0);
      transformed.x += meadowBreeze * grassHeight * 0.3 + heroPush.x * grassHeight;
      transformed.z += cos(uMeadowTime * 0.95 + meadowPhase) * grassHeight * 0.06 + heroPush.y * grassHeight;`,
    );
  };
  material.customProgramCacheKey = () => "zelda-clover-tufts-v2";

  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.name = "zelda-sparse-clover-meadow-tufts";
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const random = createSeededRandom(LAYOUT_SEED + 2026);
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3();
  const rotation = new THREE.Quaternion();

  const palette = ["#62a554", "#71b562", "#84c473", "#59994c", "#94ce83"].map(
    (col) => new THREE.Color(col),
  );

  let placed = 0;
  let attempts = 0;

  // Clustered placement centres
  const clusterCentres: Array<{ x: number; z: number; radius: number }> = [
    { x: -5.5, z: -6.0, radius: 3.5 }, // Southwest flower meadow
    { x: -10.5, z: 3.8, radius: 2.8 }, // North meadow clearing
    { x: -18.5, z: 2.2, radius: 3.2 }, // Western highland plateau
    { x: -15.5, z: -6.8, radius: 3.0 }, // Southern woodland edge
    { x: -23.5, z: 2.0, radius: 2.6 }, // Overlook clearing
  ];

  while (placed < count && attempts < count * 25) {
    attempts += 1;

    // Pick a cluster centre for organic grouping
    const cluster = clusterCentres[Math.floor(random() * clusterCentres.length)];
    const angle = random() * Math.PI * 2;
    const dist = Math.sqrt(random()) * cluster.radius;
    const x = cluster.x + Math.cos(angle) * dist;
    const z = cluster.z + Math.sin(angle) * dist;

    // Stay strictly inside walkable island boundary
    const ellipse = ((x + 13) / 18) ** 2 + (z / 11.7) ** 2;
    if (ellipse > 0.94) continue;

    // Avoid the main trail
    if (TRAIL.some((point, index) => index > 0 && distanceToSegment(x, z, TRAIL[index - 1], point) < 1.7)) {
      continue;
    }

    // Avoid clearings
    if (CLEARINGS.some(([cx, cz, rad]) => Math.hypot(x - cx, z - cz) < rad)) {
      continue;
    }

    const yaw = random() * Math.PI * 2;
    const size = 0.85 + random() * 0.45;

    position.set(x, 0.035, z);
    scale.set(size, size, size);
    rotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);

    matrix.compose(position, rotation, scale);
    mesh.setMatrixAt(placed, matrix);
    mesh.setColorAt(placed, palette[Math.floor(random() * palette.length)]);
    placed += 1;
  }

  mesh.count = placed;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere();
  scene.add(mesh);

  return {
    mesh,
    update: (time, player) => {
      if (timeUniform) timeUniform.value = time;
      if (playerUniform && player) playerUniform.value.copy(player);
    },
    dispose: () => {
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
    },
  };
}
