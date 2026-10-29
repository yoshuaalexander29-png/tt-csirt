import * as THREE from "three";
import { clone as cloneSkeleton } from "three/addons/utils/SkeletonUtils.js";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";
import {
  type AnimationStateName,
  findMatchingClip,
  computeAnimationSpeed,
  computeProceduralBobAndTilt,
} from "./animation-clips";

export {
  loadAuthoredCharacter,
  type AuthoredCharacter,
  type CharacterKind,
} from "./characterLoader";

export type AnimatedCharacter = {
  anchor: THREE.Group;
  mixer: THREE.AnimationMixer;
  model: THREE.Group;
  play: (name: AnimationStateName, speed?: number) => void;
  update: (
    delta: number,
    currentSpeed?: number,
    wallNormal?: [number, number],
    wallForward?: [number, number],
  ) => void;
  setTint: (colour: string) => void;
  dispose: () => void;
};

type CharacterOptions = {
  atlas?: THREE.Texture;
  baseTint?: string;
  height?: number;
  tintTarget?: string;
};

export function createCharacter(
  scene: THREE.Scene,
  source: GLTF,
  options: CharacterOptions = {},
): AnimatedCharacter {
  const anchor = new THREE.Group();
  const model = new THREE.Group();
  const rig = cloneSkeleton(source.scene);
  const ownedMaterials = new Set<THREE.Material>();
  const tintMaterials: THREE.MeshStandardMaterial[] = [];
  const chosenTint = new THREE.Color(options.baseTint ?? "#ffffff");

  rig.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.castShadow = true;
    object.receiveShadow = true;
    if (object.material) {
      const mat = (Array.isArray(object.material) ? object.material[0] : object.material) as THREE.MeshStandardMaterial;
      if (mat) {
        mat.roughness = 0.55;
        mat.metalness = 0.05;
        tintMaterials.push(mat);
        ownedMaterials.add(mat);
      }
    }
  });

  const bounds = new THREE.Box3().setFromObject(rig);
  const modelHeight = Math.max(0.001, bounds.max.y - bounds.min.y);
  const scale = (options.height ?? 1.55) / modelHeight;
  rig.scale.setScalar(scale);
  rig.position.y = -bounds.min.y * scale;
  model.add(rig);
  anchor.add(model);

  const contact = new THREE.Mesh(
    new THREE.CircleGeometry(0.35, 24),
    new THREE.MeshBasicMaterial({ color: "#233d32", transparent: true, opacity: 0.22, depthWrite: false }),
  );
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = 0.012;
  contact.renderOrder = 1;
  anchor.add(contact);
  scene.add(anchor);

  const mixer = new THREE.AnimationMixer(rig);
  const actions = new Map<string, THREE.AnimationAction>();
  const ALL_STATES: AnimationStateName[] = [
    "idle",
    "walk",
    "run",
    "jump",
    "fall",
    "glide",
    "interact",
    "wallrun",
    "homing",
  ];

  for (const name of ALL_STATES) {
    const clip = findMatchingClip(source.animations, name);
    if (clip && !actions.has(clip.name)) {
      actions.set(clip.name, mixer.clipAction(clip, rig));
    }
  }

  let activeAction: THREE.AnimationAction | null = null;
  let actionName: AnimationStateName = "idle";
  let clock = 0;
  let moveSpeed = 0;

  const play = (name: AnimationStateName, speed = 0) => {
    moveSpeed = speed;
    actionName = name;
    const clip = findMatchingClip(source.animations, name);
    const next = clip ? actions.get(clip.name) ?? null : null;
    const playbackSpeed = computeAnimationSpeed(name, speed);

    if (next === activeAction) {
      if (activeAction) activeAction.timeScale = playbackSpeed;
      return;
    }

    activeAction?.fadeOut(0.12);
    if (next) {
      next.reset().fadeIn(0.12).play();
      next.timeScale = playbackSpeed;
      activeAction = next;
    } else {
      activeAction = null;
    }
  };

  const setTint = (colour: string) => {
    chosenTint.set(colour);
    for (const mat of tintMaterials) {
      if ("color" in mat) mat.color.copy(chosenTint);
    }
  };
  setTint(options.baseTint ?? "#39887e");

  return {
    anchor,
    mixer,
    model,
    play,
    update: (
      delta: number,
      currentSpeed = moveSpeed,
      wallNormal?: [number, number],
      wallForward?: [number, number],
    ) => {
      clock += delta;
      mixer.update(delta);

      if (activeAction) {
        activeAction.timeScale = computeAnimationSpeed(actionName, currentSpeed);
      }

      const procedural = computeProceduralBobAndTilt(
        actionName,
        clock,
        currentSpeed,
        wallNormal,
        wallForward,
      );

      model.position.y = procedural.bob;
      model.rotation.z = procedural.roll;
      model.rotation.x = procedural.pitch;
    },
    setTint,
    dispose: () => {
      scene.remove(anchor);
      mixer.stopAllAction();
      ownedMaterials.forEach((material) => material.dispose());
      contact.geometry.dispose();
      (contact.material as THREE.Material).dispose();
    },
  };
}
