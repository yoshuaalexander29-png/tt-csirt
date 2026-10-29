import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { installPixieCut } from "./pixie-cut.ts";
import { installAdventurerOutfit, type AdventurerOutfitController } from "./adventurer-outfit.ts";
import type { AnimationStateName } from "./animation-clips.ts";
import { computeAnimationSpeed, computeProceduralBobAndTilt } from "./animation-clips.ts";

export type CharacterKind = "oracle" | "hunter";

export type AuthoredCharacter = {
  anchor: THREE.Group;
  mixer: THREE.AnimationMixer;
  model: THREE.Group;
  root: THREE.Object3D;
  kind: CharacterKind;
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

function createFbxLoadingManager(slug: "grove-oracle" | "relic-hunter"): THREE.LoadingManager {
  const manager = new THREE.LoadingManager();
  const base = `/models/${slug}`;
  manager.setURLModifier((url: string) => {
    const normalized = String(url).replace(/\\/g, "/").split(/[?#]/)[0];
    const file = normalized.split("/").pop();
    if (!file) return url;
    return `${base}/${encodeURIComponent(file)}`;
  });
  return manager;
}

function normalizeModel(root: THREE.Object3D, targetHeight = 1.7) {
  root.updateMatrixWorld(true);
  let box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  if (!Number.isFinite(size.y) || size.y < 1e-4) {
    throw new Error("Model bounds could not be measured.");
  }
  root.scale.setScalar(targetHeight / size.y);
  root.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  root.position.x -= center.x;
  root.position.y -= box.min.y;
  root.position.z -= center.z;
  root.updateMatrixWorld(true);
}

function tuneMaterials(root: THREE.Object3D) {
  root.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      const mesh = obj as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of mats) {
        if (!mat) continue;
        if ("roughness" in mat) {
          (mat as THREE.MeshStandardMaterial).roughness = 0.52;
        }
        if ("metalness" in mat) {
          (mat as THREE.MeshStandardMaterial).metalness = 0.05;
        }
        mat.needsUpdate = true;
      }
    }
  });
}

function collectBones(root: THREE.Object3D): Map<string, THREE.Bone> {
  const out = new Map<string, THREE.Bone>();
  root.traverse((obj) => {
    if ((obj as THREE.Bone).isBone && !out.has(obj.name)) {
      out.set(obj.name, obj as THREE.Bone);
    }
  });
  return out;
}

const sin = (t: number, cycles = 1) => Math.sin(t * Math.PI * 2 * cycles);

// Bone synonyms mapping Quaternius humanoid standard rig names, Mixamo names, and FBX prototype names
const BONE_SYNONYMS: Record<string, string[]> = {
  spine_a: ["spine_a", "spine_01", "spine", "Spine"],
  spine_b: ["spine_b", "spine_02", "spine_03", "chest", "Chest"],
  head: ["head", "Head", "head_SScaleOff"],
  n_hara: ["n_hara", "pelvis", "root", "Hips"],
  arm_L_a: ["arm_L_a", "upperarm_l", "Arm_L", "LeftArm"],
  arm_L_b: ["arm_L_b", "lowerarm_l", "ForeArm_L", "LeftForeArm"],
  hand_L: ["hand_L", "hand_l", "Hand_L", "LeftHand"],
  arm_R_a: ["arm_R_a", "upperarm_r", "Arm_R", "RightArm"],
  arm_R_b: ["arm_R_b", "lowerarm_r", "ForeArm_R", "RightForeArm"],
  hand_R: ["hand_R", "hand_r", "Hand_R", "RightHand"],
  leg_L_a: ["leg_L_a", "thigh_l", "UpLeg_L", "LeftUpLeg"],
  leg_L_b: ["leg_L_b", "calf_l", "Leg_L", "LeftLeg"],
  foot_L: ["foot_L", "foot_l", "Foot_L", "LeftFoot"],
  leg_R_a: ["leg_R_a", "thigh_r", "UpLeg_R", "RightUpLeg"],
  leg_R_b: ["leg_R_b", "calf_r", "Leg_R", "RightLeg"],
  foot_R: ["foot_R", "foot_r", "Foot_R", "RightFoot"],
  wing_L_a: ["wing_L_a", "wing_l", "clavicle_l", "GliderWing_Left"],
  wing_R_a: ["wing_R_a", "wing_r", "clavicle_r", "GliderWing_Right"],
  wingupper_L_a: ["wingupper_L_a", "wing_upper_l", "clavicle_l"],
  wingupper_R_a: ["wingupper_R_a", "wing_upper_r", "clavicle_r"],
};

function makeClip(
  root: THREE.Object3D,
  name: string,
  duration: number,
  poseFunctions: Record<string, (t: number, time: number) => [number, number, number]>,
  options: { bob?: number } = {},
): THREE.AnimationClip {
  const bones = collectBones(root);
  const times: number[] = [];
  const samples = Math.max(24, Math.ceil(duration * 30));
  for (let i = 0; i <= samples; i++) times.push((duration * i) / samples);

  const tracks: THREE.KeyframeTrack[] = [];

  for (const [boneTarget, poseFn] of Object.entries(poseFunctions)) {
    const targetBones: THREE.Bone[] = [];
    if (bones.has(boneTarget)) {
      targetBones.push(bones.get(boneTarget)!);
    }
    const synonyms = BONE_SYNONYMS[boneTarget] || [];
    for (const syn of synonyms) {
      if (bones.has(syn) && !targetBones.includes(bones.get(syn)!)) {
        targetBones.push(bones.get(syn)!);
      }
    }

    for (const bone of targetBones) {
      const baseQ = bone.quaternion.clone();
      const values: number[] = [];
      for (let i = 0; i < times.length; i++) {
        const t = times[i] / duration;
        const e = poseFn(t, times[i]);
        const offset = new THREE.Quaternion().setFromEuler(new THREE.Euler(e[0], e[1], e[2], "XYZ"));
        const q = baseQ.clone().multiply(offset).normalize();
        values.push(q.x, q.y, q.z, q.w);
      }
      tracks.push(new THREE.QuaternionKeyframeTrack(`${bone.name}.quaternion`, times, values));
    }
  }

  const torso = bones.get("n_hara") || bones.get("pelvis") || bones.get("root");
  if (torso && options.bob) {
    const baseY = torso.position.y;
    const vals: number[] = [];
    for (const t of times) {
      vals.push(torso.position.x, baseY + options.bob * Math.sin(t * 2 * Math.PI), torso.position.z);
    }
    tracks.push(new THREE.VectorKeyframeTrack(`${torso.name}.position`, times, vals));
  }

  return new THREE.AnimationClip(name, duration, tracks);
}

export function buildClips(root: THREE.Object3D, kind: CharacterKind): Record<string, THREE.AnimationClip> {
  const clips: Record<string, THREE.AnimationClip> = {};

  if (kind === "oracle") {
    // Protagonist (Blonde Girl Adventurer)
    clips.idle = makeClip(
      root,
      "idle",
      3.2,
      {
        spine_a: (t) => [0, 0, 0.025 * sin(t)],
        spine_b: (t) => [0.018 * sin(t + 0.12), 0.025 * sin(t), 0],
        head: (t) => [0, 0.018 * sin(t + 0.1), 0.014 * sin(t + 0.2)],
        arm_L_a: (t) => [0, 0, 0.025 * sin(t + 0.25)],
        arm_R_a: (t) => [0, 0, -0.025 * sin(t + 0.25)],
        wing_L_a: (t) => [0.08 * sin(t * 1.5), 0, 0.15 * sin(t * 1.5)],
        wing_R_a: (t) => [-0.08 * sin(t * 1.5), 0, -0.15 * sin(t * 1.5)],
        wingupper_L_a: (t) => [0.1 * sin(t * 1.5), 0, 0.12 * sin(t * 1.5)],
        wingupper_R_a: (t) => [-0.1 * sin(t * 1.5), 0, -0.12 * sin(t * 1.5)],
      },
      { bob: 0.015 },
    );

    clips.walk = makeClip(
      root,
      "walk",
      0.95,
      {
        leg_L_a: (t) => [0.42 * sin(t), 0, 0],
        leg_R_a: (t) => [-0.42 * sin(t), 0, 0],
        leg_L_b: (t) => [Math.max(0, -sin(t)) * 0.42, 0, 0],
        leg_R_b: (t) => [Math.max(0, sin(t)) * 0.42, 0, 0],
        arm_L_a: (t) => [-0.32 * sin(t), 0, 0.03],
        arm_R_a: (t) => [0.32 * sin(t), 0, -0.03],
        spine_a: (t) => [0, 0, 0.035 * sin(t)],
        spine_b: (t) => [0.025 * sin(t), 0, 0],
        head: (t) => [0, 0.015 * sin(t), 0],
        wing_L_a: (t) => [0.12 * sin(t), 0, 0.22 * sin(t)],
        wing_R_a: (t) => [-0.12 * sin(t), 0, -0.22 * sin(t)],
      },
      { bob: 0.032 },
    );

    clips.run = makeClip(
      root,
      "run",
      0.65,
      {
        leg_L_a: (t) => [0.65 * sin(t), 0, 0],
        leg_R_a: (t) => [-0.65 * sin(t), 0, 0],
        leg_L_b: (t) => [Math.max(0, -sin(t)) * 0.62, 0, 0],
        leg_R_b: (t) => [Math.max(0, sin(t)) * 0.62, 0, 0],
        arm_L_a: (t) => [-0.52 * sin(t), 0, 0.08],
        arm_R_a: (t) => [0.52 * sin(t), 0, -0.08],
        spine_a: (t) => [0.18 + 0.04 * sin(t), 0, 0.04 * sin(t)],
        spine_b: () => [0.08, 0, 0],
        head: () => [0.06, 0, 0],
        wing_L_a: (t) => [0.18 * sin(t), 0, 0.35 * sin(t)],
        wing_R_a: (t) => [-0.18 * sin(t), 0, -0.35 * sin(t)],
      },
      { bob: 0.05 },
    );

    clips.jump = makeClip(root, "jump", 0.6, {
      leg_L_a: () => [0.35, 0, 0.06],
      leg_R_a: () => [0.28, 0, -0.06],
      leg_L_b: () => [0.42, 0, 0],
      leg_R_b: () => [0.36, 0, 0],
      arm_L_a: () => [-0.35, 0, 0.38],
      arm_R_a: () => [-0.35, 0, -0.38],
      wing_L_a: () => [0.32, 0, 0.52],
      wing_R_a: () => [-0.32, 0, -0.52],
      wingupper_L_a: () => [0.4, 0, 0.35],
      wingupper_R_a: () => [-0.4, 0, -0.35],
      spine_a: () => [-0.08, 0, 0],
    });

    clips.fall = makeClip(root, "fall", 0.7, {
      leg_L_a: () => [-0.12, 0, 0.04],
      leg_R_a: () => [-0.12, 0, -0.04],
      arm_L_a: () => [-0.22, 0, 0.45],
      arm_R_a: () => [-0.22, 0, -0.45],
      wing_L_a: (t) => [0.25 * sin(t * 3), 0, 0.55 * sin(t * 3)],
      wing_R_a: (t) => [-0.25 * sin(t * 3), 0, -0.55 * sin(t * 3)],
      wingupper_L_a: (t) => [0.3 * sin(t * 3), 0, 0.3 * sin(t * 3)],
      wingupper_R_a: (t) => [-0.3 * sin(t * 3), 0, -0.3 * sin(t * 3)],
    });

    clips.glide = makeClip(root, "glide", 1.2, {
      spine_a: () => [0.26, 0, 0],
      spine_b: () => [0.12, 0, 0],
      head: () => [-0.15, 0, 0],
      arm_L_a: () => [-0.28, 0, 0.55],
      arm_R_a: () => [-0.28, 0, -0.55],
      arm_L_b: () => [-0.12, 0, 0],
      arm_R_b: () => [-0.12, 0, 0],
      leg_L_a: () => [-0.24, 0, 0.06],
      leg_R_a: () => [-0.2, 0, -0.06],
      wing_L_a: (t) => [0.24 + 0.04 * sin(t), 0, 0.62 + 0.06 * sin(t)],
      wing_R_a: (t) => [-0.24 - 0.04 * sin(t), 0, -0.62 - 0.06 * sin(t)],
      wingupper_L_a: (t) => [0.38 + 0.05 * sin(t), 0, 0.32 + 0.04 * sin(t)],
      wingupper_R_a: (t) => [-0.38 - 0.05 * sin(t), 0, -0.32 - 0.04 * sin(t)],
    });

    clips.interact = makeClip(root, "interact", 1.9, {
      spine_a: (t) => [0.08 * Math.sin(Math.PI * t), 0, 0.04 * Math.sin(Math.PI * t)],
      spine_b: (t) => [-0.1 * Math.sin(Math.PI * t), 0, 0.04 * Math.sin(Math.PI * t)],
      head: (t) => [0.05 * Math.sin(Math.PI * t), 0.08 * Math.sin(Math.PI * t), 0],
      arm_L_a: (t) => [-0.3 - 0.75 * Math.sin(Math.PI * t), 0, 0.3 + 0.15 * Math.sin(Math.PI * t)],
      arm_L_b: (t) => [-0.2 - 0.5 * Math.sin(Math.PI * t), 0, 0],
      arm_R_a: (t) => [-0.25 - 0.65 * Math.sin(Math.PI * t), 0, -0.3 - 0.15 * Math.sin(Math.PI * t)],
      arm_R_b: (t) => [-0.18 - 0.35 * Math.sin(Math.PI * t), 0, 0],
      wing_L_a: (t) => [0.25 * Math.sin(Math.PI * t), 0, 0.35 * Math.sin(Math.PI * t)],
      wing_R_a: (t) => [-0.25 * Math.sin(Math.PI * t), 0, -0.35 * Math.sin(Math.PI * t)],
      wingupper_L_a: (t) => [0.3 * Math.sin(Math.PI * t), 0, 0.2 * Math.sin(Math.PI * t)],
      wingupper_R_a: (t) => [-0.3 * Math.sin(Math.PI * t), 0, -0.2 * Math.sin(Math.PI * t)],
    });

    clips.wallrun = makeClip(root, "wallrun", 0.65, {
      leg_L_a: (t) => [0.55 * sin(t), 0, 0.12],
      leg_R_a: (t) => [-0.55 * sin(t), 0, 0.12],
      leg_L_b: (t) => [Math.max(0, -sin(t)) * 0.55, 0, 0],
      leg_R_b: (t) => [Math.max(0, sin(t)) * 0.55, 0, 0],
      arm_L_a: (t) => [-0.4 * sin(t), 0, 0.2],
      arm_R_a: (t) => [0.4 * sin(t), 0, -0.2],
      spine_a: () => [0.15, 0, 0.22],
    });

    clips.homing = makeClip(root, "homing", 0.4, {
      spine_a: () => [-0.35, 0, 0],
      arm_L_a: () => [0.35, 0, 0.2],
      arm_R_a: () => [0.35, 0, -0.2],
      leg_L_a: () => [-0.3, 0, 0],
      leg_R_a: () => [-0.3, 0, 0],
      wing_L_a: () => [0.45, 0, 0.65],
      wing_R_a: () => [-0.45, 0, -0.65],
    });
  } else {
    // Kaya (Local Coordinator)
    clips.idle = makeClip(
      root,
      "idle",
      3.2,
      {
        spine_a: (t) => [0, 0, 0.02 * sin(t)],
        spine_b: (t) => [0.015 * sin(t + 0.1), 0.02 * sin(t), 0],
        head: (t) => [0, 0.015 * sin(t + 0.1), 0.01 * sin(t + 0.2)],
        arm_L_a: (t) => [0, 0, 0.02 * sin(t + 0.25)],
        arm_R_a: (t) => [0, 0, -0.02 * sin(t + 0.25)],
      },
      { bob: 0.01 },
    );

    clips.walk = makeClip(
      root,
      "walk",
      1.0,
      {
        leg_L_a: (t) => [0.38 * sin(t), 0, 0],
        leg_R_a: (t) => [-0.38 * sin(t), 0, 0],
        leg_L_b: (t) => [Math.max(0, -sin(t)) * 0.38, 0, 0],
        leg_R_b: (t) => [Math.max(0, sin(t)) * 0.38, 0, 0],
        arm_L_a: (t) => [-0.28 * sin(t), 0, 0.02],
        arm_R_a: (t) => [0.28 * sin(t), 0, -0.02],
        spine_a: (t) => [0, 0, 0.03 * sin(t)],
      },
      { bob: 0.028 },
    );

    clips.interact = makeClip(root, "interact", 1.8, {
      spine_a: (t) => [0.06 * Math.sin(t * Math.PI), 0, 0.06 * Math.sin(t * Math.PI)],
      spine_b: (t) => [0.14 * Math.sin(t * Math.PI), 0.04 * Math.sin(t * Math.PI), 0.05 * Math.sin(t * Math.PI)],
      head: (t) => [0.08 * Math.sin(t * Math.PI), 0.1 * Math.sin(t * Math.PI), -0.06 * Math.sin(t * Math.PI)],
      arm_R_a: (t) => [0.12 + 0.62 * Math.sin(Math.PI * t), 0.05 * Math.sin(Math.PI * t), -0.18 - 0.24 * Math.sin(Math.PI * t)],
      arm_R_b: (t) => [-0.15 - 0.55 * Math.sin(Math.PI * t), 0, 0.08],
      arm_L_a: (t) => [0.05 + 0.28 * Math.sin(Math.PI * t), 0, -0.1],
      arm_L_b: (t) => [-0.25 * Math.sin(Math.PI * t), 0, 0],
    });
  }

  return clips;
}

export async function loadAuthoredCharacter(
  scene: THREE.Scene,
  kind: CharacterKind,
  options: {
    height?: number;
    baseTint?: string;
  } = {},
): Promise<AuthoredCharacter> {
  const targetHeight = options.height ?? (kind === "oracle" ? 1.62 : 1.58);
  let root: THREE.Object3D;
  let authoredClips: THREE.AnimationClip[] = [];

  // 1. Load authored character FBX model (Grove Oracle GreatFairy.fbx or Relic Hunter Impa.fbx)
  const slug = kind === "oracle" ? "grove-oracle" : "relic-hunter";
  const fbxName = kind === "oracle" ? "GreatFairy.fbx" : "Impa.fbx";
  const fbxLoader = new FBXLoader(createFbxLoadingManager(slug));
  root = await fbxLoader.loadAsync(`/models/${slug}/${fbxName}`);

  normalizeModel(root, targetHeight);
  tuneMaterials(root);

  const anchor = new THREE.Group();
  anchor.name = kind === "oracle" ? "Protagonist_BlondeAdventurer" : "Coordinator_Kaya";

  const model = new THREE.Group();
  model.name = "Character_Model_Holder";
  model.add(root);
  anchor.add(model);

  // 2. Install character-specific hair and adventure outfit
  let outfitController: AdventurerOutfitController | null = null;

  if (kind === "oracle") {
    // Protagonist: Blonde pixie cut + adventure accessories (belt, satchel, capelet, deployable glider wings)
    installPixieCut(root, model);
    outfitController = installAdventurerOutfit(root, "oracle");
  } else {
    // Kaya: Coordinator accessories (headband, auburn bob, public service medallion, bracers)
    outfitController = installAdventurerOutfit(root, "hunter");
  }

  // Soft contact grounding shadow disk
  const contact = new THREE.Mesh(
    new THREE.CircleGeometry(0.38, 24),
    new THREE.MeshBasicMaterial({ color: "#233d32", transparent: true, opacity: 0.22, depthWrite: false }),
  );
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = 0.015;
  contact.renderOrder = 1;
  anchor.add(contact);

  scene.add(anchor);

  // 3. Animation system: blend authored UAL1 clips + synthesized locomotion/traversal clips
  const proceduralClips = buildClips(root, kind);
  const mixer = new THREE.AnimationMixer(root);
  const actions = new Map<string, THREE.AnimationAction>();

  // Register procedural clips
  for (const [key, clip] of Object.entries(proceduralClips)) {
    actions.set(key, mixer.clipAction(clip));
  }

  // Overlay authored clips from UAL1 library if present
  if (authoredClips.length > 0) {
    for (const clip of authoredClips) {
      const cName = clip.name.toLowerCase();
      if (cName.includes("idle_loop") || cName === "idle") {
        actions.set("idle", mixer.clipAction(clip));
      } else if (cName.includes("walk_loop") || cName === "walk") {
        actions.set("walk", mixer.clipAction(clip));
      } else if (cName.includes("jog_fwd") || cName.includes("run")) {
        actions.set("run", mixer.clipAction(clip));
      } else if (cName.includes("interact") && kind === "oracle") {
        actions.set("interact", mixer.clipAction(clip));
      } else if (cName.includes("idle_talking") && kind === "hunter") {
        actions.set("interact", mixer.clipAction(clip));
      }
    }
  }

  let activeAction: THREE.AnimationAction | null = null;
  let currentActionName: AnimationStateName = "idle";
  let clock = 0;
  let moveSpeed = 0;

  const play = (name: AnimationStateName, speed = 0) => {
    moveSpeed = speed;
    currentActionName = name;

    // Control deployable glider wings
    if (outfitController) {
      outfitController.setGliding(name === "glide");
    }

    const clipName = actions.has(name) ? name : actions.has("idle") ? "idle" : undefined;
    const next = clipName ? actions.get(clipName) ?? null : null;
    const playbackSpeed = computeAnimationSpeed(name, speed);

    if (next === activeAction) {
      if (activeAction) activeAction.timeScale = playbackSpeed;
      return;
    }

    activeAction?.fadeOut(0.14);
    if (next) {
      next.reset().fadeIn(0.14).play();
      next.timeScale = playbackSpeed;
      activeAction = next;
    } else {
      activeAction = null;
    }
  };

  // Start with idle
  play("idle");

  // Tint handler for clothing
  const tintMaterials: THREE.MeshStandardMaterial[] = [];
  root.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      const mesh = obj as THREE.Mesh;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of mats) {
        if (!mat) continue;
        const matName = (mat.name || "").toLowerCase();
        const objName = (mesh.name || "").toLowerCase();
        if (
          matName.includes("body") ||
          matName.includes("cloth") ||
          matName.includes("superhero") ||
          objName.includes("body") ||
          objName.includes("dress")
        ) {
          tintMaterials.push(mat as THREE.MeshStandardMaterial);
        }
      }
    }
  });

  const setTint = (colour: string) => {
    const tintColor = new THREE.Color(colour);
    for (const mat of tintMaterials) {
      if ("color" in mat) {
        mat.color.copy(tintColor);
      }
    }
  };

  if (options.baseTint) {
    setTint(options.baseTint);
  }

  return {
    anchor,
    mixer,
    model,
    root,
    kind,
    play,
    update: (
      delta: number,
      currentSpeed = moveSpeed,
      wallNormal?: [number, number],
      wallForward?: [number, number],
    ) => {
      clock += delta;
      mixer.update(delta);

      if (outfitController) {
        outfitController.update(delta, clock);
      }

      if (activeAction) {
        activeAction.timeScale = computeAnimationSpeed(currentActionName, currentSpeed);
      }

      const procedural = computeProceduralBobAndTilt(
        currentActionName,
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
      outfitController?.dispose();
      contact.geometry.dispose();
      (contact.material as THREE.Material).dispose();
    },
  };
}
