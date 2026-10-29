import * as THREE from "three";

export type SculptedVegetationResult = {
  group: THREE.Group;
  height: number;
  trunkRadius: number;
  perches: THREE.Vector3[];
};

// Cohesive diorama materials with Zelda: Echoes of Wisdom matte toy lacquer and soft subsurface luster
// Controlled roughness (0.54 - 0.65) completely eliminates the oily plastic specular highlights
const barkMaterial = new THREE.MeshPhysicalMaterial({
  color: "#6e4526",
  roughness: 0.54,
  metalness: 0.02,
  clearcoat: 0.06,
  clearcoatRoughness: 0.35,
});

const foliagePrimaryMaterial = new THREE.MeshPhysicalMaterial({
  color: "#56b44a",
  roughness: 0.58,
  metalness: 0.0,
  clearcoat: 0.05,
  clearcoatRoughness: 0.4,
  sheen: 0.12,
  sheenRoughness: 0.45,
});

const foliageHighlightMaterial = new THREE.MeshPhysicalMaterial({
  color: "#6fc956",
  roughness: 0.54,
  metalness: 0.0,
  clearcoat: 0.06,
  clearcoatRoughness: 0.35,
  sheen: 0.15,
});

const foliageDeepMaterial = new THREE.MeshPhysicalMaterial({
  color: "#3b8c34",
  roughness: 0.62,
  metalness: 0.0,
  clearcoat: 0.04,
  clearcoatRoughness: 0.45,
});

// Warm autumn accent foliage palettes inspired by Nintendo Switch Zelda art
const foliageAutumnAmber = new THREE.MeshPhysicalMaterial({
  color: "#d8852c",
  roughness: 0.56,
  metalness: 0.0,
  clearcoat: 0.06,
  sheen: 0.15,
});

const foliageAutumnGold = new THREE.MeshPhysicalMaterial({
  color: "#e8af36",
  roughness: 0.54,
  metalness: 0.0,
  clearcoat: 0.06,
  sheen: 0.18,
});

const foliageAutumnRust = new THREE.MeshPhysicalMaterial({
  color: "#be4f34",
  roughness: 0.58,
  metalness: 0.0,
  clearcoat: 0.05,
});

const berryMaterial = new THREE.MeshPhysicalMaterial({
  color: "#e84e40",
  roughness: 0.32,
  metalness: 0.02,
  clearcoat: 0.4,
  clearcoatRoughness: 0.2,
});

const appleMaterial = new THREE.MeshPhysicalMaterial({
  color: "#d83838",
  roughness: 0.36,
  metalness: 0.02,
  clearcoat: 0.35,
  clearcoatRoughness: 0.22,
});

const fernFrondMaterial = new THREE.MeshPhysicalMaterial({
  color: "#46a858",
  roughness: 0.52,
  metalness: 0.0,
  clearcoat: 0.05,
  clearcoatRoughness: 0.35,
  side: THREE.DoubleSide,
});

/**
 * Creates a broad, lush oak/apple tree with organic branching,
 * grounded subterranean root flare, and bulbous cloud-like foliage lobes.
 */
function createBroadTree(seed = 0): SculptedVegetationResult {
  const group = new THREE.Group();
  group.name = "sculpted-broad-tree";

  const isAutumn = (seed % 3) === 2;
  const primMat = isAutumn ? foliageAutumnAmber : foliagePrimaryMaterial;
  const highMat = isAutumn ? foliageAutumnGold : foliageHighlightMaterial;
  const deepMat = isAutumn ? foliageAutumnRust : foliageDeepMaterial;

  // Root flare base extending deep into the ground (y = -0.25 to 0.55) so it is 100% grounded
  const rootGeom = new THREE.CylinderGeometry(0.36, 0.58, 1.4, 10);
  const root = new THREE.Mesh(rootGeom, barkMaterial);
  root.position.y = 0.45;
  root.castShadow = true;
  root.receiveShadow = true;
  group.add(root);

  // Main trunk
  const trunkGeom = new THREE.CylinderGeometry(0.26, 0.34, 1.8, 10);
  const trunk = new THREE.Mesh(trunkGeom, barkMaterial);
  trunk.position.y = 1.8;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  group.add(trunk);

  // Left branch fork
  const leftBranchGeom = new THREE.CylinderGeometry(0.14, 0.22, 1.3, 8);
  const leftBranch = new THREE.Mesh(leftBranchGeom, barkMaterial);
  leftBranch.position.set(-0.38, 2.6, 0.1);
  leftBranch.rotation.z = 0.52;
  leftBranch.rotation.y = 0.2;
  leftBranch.castShadow = true;
  group.add(leftBranch);

  // Right branch fork
  const rightBranchGeom = new THREE.CylinderGeometry(0.13, 0.2, 1.2, 8);
  const rightBranch = new THREE.Mesh(rightBranchGeom, barkMaterial);
  rightBranch.position.set(0.35, 2.5, -0.15);
  rightBranch.rotation.z = -0.48;
  rightBranch.rotation.y = -0.3;
  rightBranch.castShadow = true;
  group.add(rightBranch);

  // Canopy group with multi-lobed cloud geometry
  const canopy = new THREE.Group();
  canopy.name = "broad-canopy";

  // Central main cloud mass
  const centerSphere = new THREE.Mesh(
    new THREE.SphereGeometry(1.22, 14, 10),
    primMat,
  );
  centerSphere.position.set(0, 3.5, 0);
  centerSphere.scale.set(1.15, 0.95, 1.1);
  centerSphere.castShadow = true;
  centerSphere.receiveShadow = true;
  canopy.add(centerSphere);

  // Top highlight dome
  const topDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.78, 12, 9),
    highMat,
  );
  topDome.position.set(0.05, 4.35, -0.05);
  topDome.scale.set(1.05, 0.85, 1.05);
  topDome.castShadow = true;
  canopy.add(topDome);

  // 4 surrounding puffy clouds
  const lobes: Array<{ pos: [number, number, number]; r: number; mat: THREE.Material }> = [
    { pos: [-0.92, 3.25, 0.25], r: 0.92, mat: highMat },
    { pos: [0.86, 3.15, -0.3], r: 0.86, mat: primMat },
    { pos: [0.22, 3.3, 0.85], r: 0.84, mat: deepMat },
    { pos: [-0.28, 3.35, -0.82], r: 0.82, mat: primMat },
  ];

  lobes.forEach(({ pos, r, mat }) => {
    const lobe = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 9), mat);
    lobe.position.set(...pos);
    lobe.scale.set(1.05, 0.92, 1.05);
    lobe.castShadow = true;
    lobe.receiveShadow = true;
    canopy.add(lobe);
  });

  // A couple of glossy red apples nestled on the canopy edge
  const applePositions: Array<[number, number, number]> = [
    [-0.85, 2.7, 0.55],
    [0.75, 2.65, -0.45],
    [0.35, 2.75, 0.85],
  ];
  applePositions.forEach((pos) => {
    const apple = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 7), appleMaterial);
    apple.position.set(...pos);
    apple.castShadow = true;
    canopy.add(apple);
  });

  group.add(canopy);

  // Bird perches placed on top of canopy crown in clear open sunlight (as seen in Echoes of Wisdom)
  const perches = [
    new THREE.Vector3(0.05, 5.08, -0.05),
    new THREE.Vector3(-0.85, 4.22, 0.22),
  ];

  return {
    group,
    height: 4.8,
    trunkRadius: 0.35,
    perches,
  };
}

/**
 * Creates a conical tiered cedar/pine tree with scalloped canopy cushions.
 */
function createPineTree(seed = 0): SculptedVegetationResult {
  const group = new THREE.Group();
  group.name = "sculpted-pine-tree";

  // Tapered trunk
  const trunkGeom = new THREE.CylinderGeometry(0.18, 0.44, 4.2, 10);
  const trunk = new THREE.Mesh(trunkGeom, barkMaterial);
  trunk.position.y = 2.1;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  group.add(trunk);

  const canopy = new THREE.Group();
  canopy.name = "pine-canopy";

  // Helper to build a tiered cushion with soft rounded scalloped rim
  function createTier(y: number, radius: number, height: number, material: THREE.Material) {
    const tier = new THREE.Group();
    tier.position.y = y;

    // Main cone dome
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(radius, height, 12, 1, false),
      material,
    );
    cone.position.y = height * 0.45;
    cone.castShadow = true;
    cone.receiveShadow = true;
    tier.add(cone);

    // Rounded rim bulbs along the circumference for the Link's Awakening toy feel
    const rimCount = 6;
    const bulbRadius = radius * 0.28;
    for (let i = 0; i < rimCount; i++) {
      const angle = (i / rimCount) * Math.PI * 2;
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(bulbRadius, 8, 6), material);
      bulb.position.set(
        Math.cos(angle) * (radius * 0.88),
        0.08,
        Math.sin(angle) * (radius * 0.88),
      );
      bulb.scale.set(1.1, 0.8, 1.1);
      bulb.castShadow = true;
      tier.add(bulb);
    }
    return tier;
  }

  // Tier 1 (bottom skirt)
  canopy.add(createTier(1.7, 1.48, 1.15, foliageDeepMaterial));
  // Tier 2 (middle)
  canopy.add(createTier(2.65, 1.2, 1.05, foliagePrimaryMaterial));
  // Tier 3 (upper)
  canopy.add(createTier(3.55, 0.88, 0.95, foliageHighlightMaterial));
  // Tier 4 (crown cap)
  const topCap = new THREE.Mesh(
    new THREE.ConeGeometry(0.52, 0.85, 10),
    foliageHighlightMaterial,
  );
  topCap.position.y = 4.75;
  topCap.castShadow = true;
  canopy.add(topCap);

  group.add(canopy);

  // Perches situated atop the pine crown in open daylight
  const perches = [
    new THREE.Vector3(0, 5.25, 0),
    new THREE.Vector3(0.85, 2.85, 0.25),
  ];

  return {
    group,
    height: 5.1,
    trunkRadius: 0.36,
    perches,
  };
}

/**
 * Creates a high-crown canopy grove tree with curved boughs and two elevated cloud canopies.
 */
function createCanopyTree(seed = 0): SculptedVegetationResult {
  const group = new THREE.Group();
  group.name = "sculpted-canopy-tree";

  // Base trunk with solid subterranean root flare
  const rootGeom = new THREE.CylinderGeometry(0.32, 0.52, 1.4, 10);
  const root = new THREE.Mesh(rootGeom, barkMaterial);
  root.position.y = 0.5;
  root.castShadow = true;
  root.receiveShadow = true;
  group.add(root);

  // Curved sweeping trunk reaching into two major boughs
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1.1, 0),
    new THREE.Vector3(-0.1, 1.9, 0.05),
    new THREE.Vector3(-0.25, 2.6, 0.1),
  ]);
  const curveGeom = new THREE.TubeGeometry(curve, 8, 0.22, 8, false);
  const sweepingTrunk = new THREE.Mesh(curveGeom, barkMaterial);
  sweepingTrunk.castShadow = true;
  group.add(sweepingTrunk);

  // Main high bough (left)
  const leftBoughGeom = new THREE.CylinderGeometry(0.12, 0.2, 1.3, 8);
  const leftBough = new THREE.Mesh(leftBoughGeom, barkMaterial);
  leftBough.position.set(-0.52, 3.1, 0.18);
  leftBough.rotation.z = 0.55;
  leftBough.castShadow = true;
  group.add(leftBough);

  // Secondary bough (right)
  const rightBoughGeom = new THREE.CylinderGeometry(0.12, 0.18, 1.4, 8);
  const rightBough = new THREE.Mesh(rightBoughGeom, barkMaterial);
  rightBough.position.set(0.35, 2.65, -0.2);
  rightBough.rotation.z = -0.65;
  rightBough.castShadow = true;
  group.add(rightBough);

  const canopy = new THREE.Group();
  canopy.name = "canopy-clouds";

  // Higher canopy mass on left
  const highCrown = new THREE.Mesh(
    new THREE.SphereGeometry(1.12, 13, 9),
    foliageHighlightMaterial,
  );
  highCrown.position.set(-0.75, 3.8, 0.25);
  highCrown.scale.set(1.15, 0.9, 1.1);
  highCrown.castShadow = true;
  highCrown.receiveShadow = true;
  canopy.add(highCrown);

  const highAccent = new THREE.Mesh(
    new THREE.SphereGeometry(0.72, 10, 8),
    foliagePrimaryMaterial,
  );
  highAccent.position.set(-0.4, 4.25, 0.1);
  highAccent.castShadow = true;
  canopy.add(highAccent);

  // Lower canopy mass on right
  const lowCrown = new THREE.Mesh(
    new THREE.SphereGeometry(0.95, 12, 9),
    foliagePrimaryMaterial,
  );
  lowCrown.position.set(0.78, 3.25, -0.32);
  lowCrown.scale.set(1.1, 0.88, 1.05);
  lowCrown.castShadow = true;
  lowCrown.receiveShadow = true;
  canopy.add(lowCrown);

  const lowAccent = new THREE.Mesh(
    new THREE.SphereGeometry(0.65, 10, 7),
    foliageDeepMaterial,
  );
  lowAccent.position.set(0.95, 3.7, -0.15);
  lowAccent.castShadow = true;
  canopy.add(lowAccent);

  group.add(canopy);

  // Perches situated atop the high and lower canopy crowns in open daylight
  const perches = [
    new THREE.Vector3(-0.75, 4.88, 0.25),
    new THREE.Vector3(0.85, 4.35, -0.2),
  ];

  return {
    group,
    height: 4.8,
    trunkRadius: 0.34,
    perches,
  };
}

/**
 * Main tree generator supporting "tree1" (broad oak), "tree2" (scalloped pine),
 * and "tree3" (high-crown canopy).
 */
export function createSculptedTree(variant: string, seed = 0): SculptedVegetationResult {
  if (variant === "tree2" || variant === "pine") {
    return createPineTree(seed);
  }
  if (variant === "tree3" || variant === "canopy") {
    return createCanopyTree(seed);
  }
  return createBroadTree(seed);
}

/**
 * Creates an organic, rounded shrub with berry accents.
 */
export function createSculptedShrub(seed = 0): THREE.Group {
  const group = new THREE.Group();
  group.name = "sculpted-shrub";

  // Stem stub
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.16, 0.35, 7),
    barkMaterial,
  );
  stem.position.y = 0.17;
  group.add(stem);

  // Main bush volume: cluster of 5 rounded overlapping spheres
  const center = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 10, 8),
    foliagePrimaryMaterial,
  );
  center.position.set(0, 0.52, 0);
  center.scale.set(1.1, 0.9, 1.1);
  center.castShadow = true;
  center.receiveShadow = true;
  group.add(center);

  const sideLobes: Array<{ pos: [number, number, number]; r: number; mat: THREE.Material }> = [
    { pos: [-0.34, 0.42, 0.22], r: 0.38, mat: foliageHighlightMaterial },
    { pos: [0.32, 0.4, -0.24], r: 0.36, mat: foliageDeepMaterial },
    { pos: [0.22, 0.44, 0.3], r: 0.35, mat: foliagePrimaryMaterial },
    { pos: [-0.26, 0.41, -0.28], r: 0.34, mat: foliageHighlightMaterial },
  ];

  sideLobes.forEach(({ pos, r, mat }) => {
    const lobe = new THREE.Mesh(new THREE.SphereGeometry(r, 9, 7), mat);
    lobe.position.set(...pos);
    lobe.castShadow = true;
    lobe.receiveShadow = true;
    group.add(lobe);
  });

  // Cluster of shiny little berries
  const berries: Array<[number, number, number]> = [
    [-0.22, 0.72, 0.25],
    [0.18, 0.78, -0.15],
    [0.28, 0.65, 0.28],
    [-0.05, 0.85, 0.05],
  ];
  berries.forEach((pos) => {
    const berry = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 6), berryMaterial);
    berry.position.set(...pos);
    berry.castShadow = true;
    group.add(berry);
  });

  return group;
}

/**
 * Creates an arching diorama fern with 6 fanned fronds radiating from a central core.
 */
export function createSculptedFern(seed = 0): THREE.Group {
  const group = new THREE.Group();
  group.name = "sculpted-fern";

  // Central bulb core
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 8, 6),
    foliageDeepMaterial,
  );
  core.position.y = 0.12;
  core.scale.set(1, 0.65, 1);
  group.add(core);

  // 6 radiating arching fronds
  const frondCount = 6;
  for (let i = 0; i < frondCount; i++) {
    const baseAngle = (i / frondCount) * Math.PI * 2;
    const frondGroup = new THREE.Group();
    frondGroup.rotation.y = baseAngle;

    // Build curved frond with 4 leaflets along an outward arch
    const frondLength = 0.68;
    const segments = 4;
    for (let s = 1; s <= segments; s++) {
      const t = s / segments;
      const reach = t * frondLength;
      // Arch curve: starts rising, peaks at t=0.6, curves gently back down
      const y = Math.sin(t * Math.PI * 0.75) * 0.32;
      const scale = 1.0 - t * 0.35;

      const leaflet = new THREE.Mesh(
        new THREE.SphereGeometry(0.14 * scale, 7, 5),
        s % 2 === 0 ? foliageHighlightMaterial : fernFrondMaterial,
      );
      leaflet.position.set(reach, y, 0);
      leaflet.scale.set(1.4, 0.25, 0.8);
      leaflet.rotation.z = -0.35 + t * 0.6;
      leaflet.castShadow = true;
      frondGroup.add(leaflet);
    }

    group.add(frondGroup);
  }

  return group;
}

/**
 * Transforms local perches of a tree into world coordinates given the tree's
 * position, yaw rotation, and scale.
 */
export function computeWorldPerches(
  localPerches: THREE.Vector3[],
  position: [number, number, number],
  rotationY: number,
  scale: number,
): THREE.Vector3[] {
  const rotY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotationY);
  return localPerches.map((local) => {
    const world = local.clone().multiplyScalar(scale);
    world.applyQuaternion(rotY);
    world.x += position[0];
    world.y += position[1];
    world.z += position[2];
    return world;
  });
}
