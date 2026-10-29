import * as THREE from "three";
import { createSeededRandom, LAYOUT_SEED } from "@/game/risk/level";

type Bird = {
  group: THREE.Group;
  wings: THREE.Group[];
  perches: THREE.Vector3[];
  perch: number;
  perchYaw: number;
  nextFlight: number;
  path: THREE.CatmullRomCurve3 | null;
  startedAt: number;
  duration: number;
  destination: number;
};

export type MeadowBirds = {
  update: (time: number, player: THREE.Vector3, active: boolean, reducedMotion: boolean) => void;
  isFlying: () => boolean;
};

// Authentic Zelda: Echoes of Wisdom songbird perches sitting proudly atop upper tree crowns
const DEFAULT_PERCHES: Array<[number, number, number]> = [
  [-2.2, 3.75, 4.8],
  [-4.2, 4.05, 5.4],
  [-11.4, 3.85, -7.7],
  [-13.8, 4.15, -7.3],
  [-19.3, 4.25, -8.6],
  [-23.5, 3.95, -8.0],
];

function createBird(scene: THREE.Scene, variant: number): Omit<Bird, "perches" | "perch" | "perchYaw" | "nextFlight" | "path" | "startedAt" | "duration" | "destination"> {
  const group = new THREE.Group();
  group.name = `meadow-bird-${variant + 1}`;

  // Vibrant, delightful songbird color schemes from Echoes of Wisdom
  // Variant 0: Cerulean bluebird with golden breast
  // Variant 1: Emerald parakeet with amber breast
  // Variant 2: Warm robin / finch with peach breast
  const plumageColors = ["#2678c7", "#2e9a56", "#d95f38"];
  const breastColors = ["#ffcc33", "#ffdb4d", "#f7ba72"];

  const plumage = new THREE.MeshPhysicalMaterial({
    color: plumageColors[variant % plumageColors.length],
    roughness: 0.45,
    metalness: 0.02,
    clearcoat: 0.1,
  });
  const breastMat = new THREE.MeshPhysicalMaterial({
    color: breastColors[variant % breastColors.length],
    roughness: 0.48,
    metalness: 0.0,
    clearcoat: 0.08,
  });
  const cream = new THREE.MeshPhysicalMaterial({
    color: "#fffcf2",
    roughness: 0.42,
    metalness: 0.0,
  });
  const beakMat = new THREE.MeshPhysicalMaterial({
    color: "#ff9922",
    roughness: 0.32,
    metalness: 0.05,
    clearcoat: 0.25,
  });

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), plumage);
  body.scale.set(0.88, 0.86, 1.45);
  group.add(body);

  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.082, 10, 8), breastMat);
  chest.position.set(0, -0.022, 0.058);
  chest.scale.set(0.85, 0.84, 1.05);
  group.add(chest);

  const throat = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), cream);
  throat.position.set(0, 0.038, 0.11);
  group.add(throat);

  const head = new THREE.Group();
  head.position.set(0, 0.058, 0.135);
  group.add(head);

  const face = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), plumage);
  head.add(face);

  [-1, 1].forEach((side) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), new THREE.MeshBasicMaterial({ color: "#1a1618" }));
    eye.position.set(side * 0.046, 0.018, 0.056);
    head.add(eye);

    // Cute eye catchlight dot
    const catchlight = new THREE.Mesh(new THREE.SphereGeometry(0.006, 4, 4), new THREE.MeshBasicMaterial({ color: "#ffffff" }));
    catchlight.position.set(side * 0.048 + 0.003, 0.022, 0.064);
    head.add(catchlight);
  });

  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.085, 6), beakMat);
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, -0.004, 0.11);
  head.add(beak);

  const wings = [-1, 1].map((side) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.082, 0.028, -0.025);
    group.add(pivot);

    const wing = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 7), plumage);
    wing.scale.set(1.48, 0.22, 0.72);
    wing.position.x = side * 0.06;
    pivot.add(wing);
    return pivot;
  });

  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.19, 6), plumage);
  tail.rotation.x = -Math.PI / 2;
  tail.position.set(0, -0.012, -0.175);
  group.add(tail);

  const feet = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.09, 5), beakMat);
  feet.rotation.z = Math.PI / 2;
  feet.position.set(0, -0.098, 0.015);
  group.add(feet);

  scene.add(group);
  return { group, wings };
}

export function createMeadowBirds(scene: THREE.Scene, customPerches?: THREE.Vector3[]): MeadowBirds {
  const random = createSeededRandom(LAYOUT_SEED + 86);
  const perches = customPerches && customPerches.length >= 3
    ? customPerches
    : DEFAULT_PERCHES.map((point) => new THREE.Vector3(...point));
  let wasActive = false;

  const birds: Bird[] = [0, 1, 2].map((variant) => {
    const visual = createBird(scene, variant);
    const perch = variant % perches.length;
    const perchYaw = random() * Math.PI * 2;
    visual.group.position.copy(perches[perch]);
    visual.group.rotation.set(0, perchYaw, 0);
    return {
      ...visual,
      perches,
      perch,
      perchYaw,
      destination: perch,
      nextFlight: 3.5 + random() * 2,
      path: null,
      startedAt: 0,
      duration: 1.6 + random() * 0.5,
    };
  });

  return {
    update: (time, player, active, reducedMotion) => {
      if (active && !wasActive) birds.forEach((bird) => { bird.nextFlight = time + 2 + random() * 7; });
      wasActive = active;

      for (const bird of birds) {
        if (!bird.path && active && !reducedMotion && time >= bird.nextFlight && player.distanceTo(bird.perches[bird.perch]) < 18) {
          // Reserve vacant perches: only select destinations not occupied or targeted by another bird
          const availableIndices = perches
            .map((_, i) => i)
            .filter((idx) => idx !== bird.perch && !birds.some((b) => b !== bird && (b.perch === idx || (b.path !== null && b.destination === idx))));

          if (availableIndices.length > 0) {
            bird.destination = availableIndices[Math.floor(random() * availableIndices.length)];
            const start = bird.perches[bird.perch];
            const end = bird.perches[bird.destination];
            const distance = start.distanceTo(end);

            // Flight trajectory flies UP into clear open airspace (y = +1.8 to +2.5m above canopies)
            // ensuring birds are never clipping through trunks or interior foliage
            bird.path = new THREE.CatmullRomCurve3([
              start.clone(),
              start.clone().lerp(end, 0.28).add(new THREE.Vector3(0, 1.65 + random() * 0.6, 0)),
              start.clone().lerp(end, 0.72).add(new THREE.Vector3(0, 1.45 + random() * 0.5, 0)),
              end.clone(),
            ]);
            bird.startedAt = time;
            bird.duration = 2.4 + distance * 0.18 + random() * 1.0;
          } else {
            bird.nextFlight = time + 2.5 + random() * 2;
          }
        }

        if (bird.path) {
          const progress = THREE.MathUtils.clamp((time - bird.startedAt) / bird.duration, 0, 1);
          const easing = progress * progress * (3 - 2 * progress);
          bird.group.position.copy(bird.path.getPoint(easing));
          const tangent = bird.path.getTangent(easing);
          bird.group.rotation.y = Math.atan2(tangent.x, tangent.z);
          // Natural wing flapping with brief gliding stretches
          const flap = Math.sin((time - bird.startedAt) * 18) * 0.75;
          bird.wings[0].rotation.z = flap;
          bird.wings[1].rotation.z = -flap;

          if (progress === 1) {
            bird.perch = bird.destination;
            bird.path = null;
            bird.group.position.copy(bird.perches[bird.perch]);
            bird.perchYaw = random() * Math.PI * 2;
            bird.group.rotation.set(0, bird.perchYaw, 0);
            bird.nextFlight = time + 7 + random() * 8;
          }
        } else {
          bird.group.position.copy(bird.perches[bird.perch]);
          bird.group.position.y += reducedMotion ? 0 : Math.sin(time * 2.3 + bird.perch) * 0.014;
          // Maintain the natural landing yaw orientation, with subtle life breathing head shift
          bird.group.rotation.y = bird.perchYaw + (reducedMotion ? 0 : Math.sin(time * 0.7 + bird.perch) * 0.05);
          bird.wings.forEach((wing) => { wing.rotation.z *= 0.84; });
        }
      }
    },
    isFlying: () => birds.some((bird) => Boolean(bird.path)),
  };
}
