import * as THREE from "three";

/**
 * Procedural adventurer outfit and coordinator accessories for the RiskReadiness characters.
 *
 * Adds charming fantasy-adventurer details:
 * - Protagonist (Blonde Adventurer):
 *   - Practical traveler belt with antique brass buckle
 *   - Crossbody leather explorer satchel with brass stud
 *   - Cozy shoulder capelet/cowl with gold leaf brooch pin
 *   - Deployable glider wings that flare smoothly during gliding
 *   - Soft leather traveler boot cuffs
 * - Coordinator (Kaya):
 *   - Rich auburn coordinator bob hairstyle (giving her a distinct silhouette)
 *   - Burnished bronze field coordinator headband
 *   - Public service sash and bronze crest medallion
 *   - Leather wrist bracers
 */

function collectBones(root: THREE.Object3D): Map<string, THREE.Bone> {
  const out = new Map<string, THREE.Bone>();
  root.traverse((obj) => {
    if ((obj as THREE.Bone).isBone && !out.has(obj.name)) {
      out.set(obj.name, obj as THREE.Bone);
    }
  });
  return out;
}

export type AdventurerOutfitController = {
  setGliding: (gliding: boolean) => void;
  update: (delta: number, elapsed: number) => void;
  dispose: () => void;
};

export function installAdventurerOutfit(
  root: THREE.Object3D,
  kind: "oracle" | "hunter",
): AdventurerOutfitController {
  const bones = collectBones(root);

  // Bone resolver supporting Quaternius humanoid names, Mixamo names, and FBX names
  const findBone = (...names: string[]): THREE.Bone | null => {
    for (const name of names) {
      const b = bones.get(name);
      if (b) return b;
      for (const [key, val] of bones.entries()) {
        if (key.toLowerCase() === name.toLowerCase()) return val;
      }
    }
    return null;
  };

  const headBone = findBone("Head", "head", "head_SScaleOff");
  const neckBone = findBone("neck_01", "neck", "Neck");
  const chestBone = findBone("spine_03", "spine_02", "spine_b", "Chest", "Spine2");
  const waistBone = findBone("spine_01", "spine_a", "Spine", "pelvis", "n_hara");
  const hipsBone = findBone("pelvis", "n_hara", "Hips", "root");
  const armLBone = findBone("lowerarm_l", "arm_L_b", "LeftForeArm");
  const armRBone = findBone("lowerarm_r", "arm_R_b", "RightForeArm");

  const disposables: Array<{ geometry?: THREE.BufferGeometry; material?: THREE.Material | THREE.Material[] }> = [];

  // Helper to attach geometry directly to a bone in its local coordinate space
  const attachToBone = (bone: THREE.Bone | null, mesh: THREE.Mesh | THREE.Group) => {
    if (!bone) return;
    bone.add(mesh);
  };

  let wingLeftGroup: THREE.Group | null = null;
  let wingRightGroup: THREE.Group | null = null;
  let currentGlideLerp = 0;
  let isGlidingState = false;

  if (kind === "oracle") {
    // =========================================================================
    // PROTAGONIST: BLONDE ADVENTURER OUTFIT
    // =========================================================================

    // 1. Leather Travel Belt & Brass Buckle on waist bone
    if (waistBone) {
      const beltGroup = new THREE.Group();
      beltGroup.name = "Adventurer_WaistBelt";

      const beltGeo = new THREE.CylinderGeometry(0.24, 0.23, 0.08, 20);
      const beltMat = new THREE.MeshStandardMaterial({
        color: "#4e331c",
        roughness: 0.65,
        metalness: 0.1,
      });
      disposables.push({ geometry: beltGeo, material: beltMat });
      const belt = new THREE.Mesh(beltGeo, beltMat);
      belt.castShadow = true;
      beltGroup.add(belt);

      // Antique brass belt buckle
      const buckleGeo = new THREE.BoxGeometry(0.09, 0.09, 0.03);
      const brassMat = new THREE.MeshStandardMaterial({
        color: "#d8a846",
        roughness: 0.32,
        metalness: 0.75,
      });
      disposables.push({ geometry: buckleGeo, material: brassMat });
      const buckle = new THREE.Mesh(buckleGeo, brassMat);
      buckle.position.set(0, 0, 0.235);
      buckle.castShadow = true;
      beltGroup.add(buckle);

      // Belt prong / tongue
      const tongueGeo = new THREE.BoxGeometry(0.02, 0.07, 0.02);
      disposables.push({ geometry: tongueGeo });
      const tongue = new THREE.Mesh(tongueGeo, brassMat);
      tongue.position.set(0, 0, 0.245);
      beltGroup.add(tongue);

      attachToBone(waistBone, beltGroup);
    }

    // 2. Crossbody Traveler Satchel on hip bone
    if (hipsBone || waistBone) {
      const satchelHolder = hipsBone || waistBone!;
      const satchelGroup = new THREE.Group();
      satchelGroup.name = "Adventurer_TravelSatchel";

      // Leather satchel pouch
      const pouchGeo = new THREE.BoxGeometry(0.16, 0.18, 0.09);
      const leatherMat = new THREE.MeshStandardMaterial({
        color: "#5b381b",
        roughness: 0.68,
        metalness: 0.08,
      });
      disposables.push({ geometry: pouchGeo, material: leatherMat });
      const pouch = new THREE.Mesh(pouchGeo, leatherMat);
      pouch.castShadow = true;
      pouch.receiveShadow = true;

      // Satchel flap
      const flapGeo = new THREE.BoxGeometry(0.17, 0.10, 0.098);
      const flapMat = new THREE.MeshStandardMaterial({
        color: "#462912",
        roughness: 0.62,
        metalness: 0.08,
      });
      disposables.push({ geometry: flapGeo, material: flapMat });
      const flap = new THREE.Mesh(flapGeo, flapMat);
      flap.position.set(0, 0.05, 0.005);
      flap.castShadow = true;

      // Brass button stud
      const studGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.012, 12);
      const brassMat = new THREE.MeshStandardMaterial({
        color: "#e2b34c",
        roughness: 0.35,
        metalness: 0.8,
      });
      studGeo.rotateX(Math.PI / 2);
      disposables.push({ geometry: studGeo, material: brassMat });
      const stud = new THREE.Mesh(studGeo, brassMat);
      stud.position.set(0, 0.01, 0.056);

      // Diagonal leather shoulder strap
      const strapGeo = new THREE.TorusGeometry(0.28, 0.015, 8, 24, Math.PI);
      strapGeo.rotateZ(Math.PI / 3);
      disposables.push({ geometry: strapGeo });
      const strap = new THREE.Mesh(strapGeo, leatherMat);
      strap.position.set(-0.06, 0.22, 0);

      satchelGroup.add(pouch, flap, stud, strap);
      satchelGroup.position.set(-0.24, 0.02, 0.06);
      satchelGroup.rotation.set(0.1, 0.15, -0.18);
      attachToBone(satchelHolder, satchelGroup);
    }

    // 3. Traveler Shoulder Capelet / Cowl on chest/neck bone
    const capeletBone = chestBone || neckBone;
    if (capeletBone) {
      const capeletGroup = new THREE.Group();
      capeletGroup.name = "Adventurer_Capelet";

      const cowlGeo = new THREE.CylinderGeometry(0.22, 0.32, 0.16, 20, 1, true);
      const cowlMat = new THREE.MeshStandardMaterial({
        color: "#28615a",
        roughness: 0.72,
        metalness: 0.05,
        side: THREE.DoubleSide,
      });
      disposables.push({ geometry: cowlGeo, material: cowlMat });
      const cowl = new THREE.Mesh(cowlGeo, cowlMat);
      cowl.position.set(0, -0.04, 0);
      cowl.castShadow = true;
      cowl.receiveShadow = true;
      capeletGroup.add(cowl);

      // Gold leaf brooch fastening
      const broochGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.015, 16);
      broochGeo.rotateX(Math.PI / 2);
      const broochMat = new THREE.MeshStandardMaterial({
        color: "#e8bd52",
        roughness: 0.32,
        metalness: 0.82,
      });
      disposables.push({ geometry: broochGeo, material: broochMat });
      const brooch = new THREE.Mesh(broochGeo, broochMat);
      brooch.position.set(0, 0.01, 0.24);
      capeletGroup.add(brooch);

      // Trailing capelet back drape
      const backCapeGeo = new THREE.PlaneGeometry(0.32, 0.38, 4, 4);
      backCapeGeo.rotateY(Math.PI);
      disposables.push({ geometry: backCapeGeo });
      const backCape = new THREE.Mesh(backCapeGeo, cowlMat);
      backCape.position.set(0, -0.22, -0.17);
      backCape.rotation.x = -0.15;
      backCape.castShadow = true;
      capeletGroup.add(backCape);

      attachToBone(capeletBone, capeletGroup);
    }

    // 4. Deployable Aerodynamic Glider Wings attached behind the shoulders
    if (capeletBone) {
      const gliderAnchor = new THREE.Group();
      gliderAnchor.name = "Adventurer_GliderWingsAnchor";
      gliderAnchor.position.set(0, 0.02, -0.18);

      const wingMat = new THREE.MeshStandardMaterial({
        color: "#e6f5f0",
        emissive: "#1d6e64",
        emissiveIntensity: 0.25,
        roughness: 0.45,
        metalness: 0.12,
        transparent: true,
        opacity: 0.92,
        side: THREE.DoubleSide,
      });
      const wingRibMat = new THREE.MeshStandardMaterial({
        color: "#c2933d",
        roughness: 0.35,
        metalness: 0.65,
      });
      disposables.push({ material: [wingMat, wingRibMat] });

      // Create articulated left and right wing sails
      const buildWing = (side: number) => {
        const wing = new THREE.Group();
        wing.name = side < 0 ? "GliderWing_Left" : "GliderWing_Right";

        // Wing spar
        const sparCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(side * 0.28, 0.12, -0.05),
          new THREE.Vector3(side * 0.58, 0.04, -0.12),
        ]);
        const sparGeo = new THREE.TubeGeometry(sparCurve, 12, 0.014, 6, false);
        disposables.push({ geometry: sparGeo });
        const spar = new THREE.Mesh(sparGeo, wingRibMat);
        spar.castShadow = true;
        wing.add(spar);

        // Aerodynamic sail membrane
        const sailShape = new THREE.Shape();
        sailShape.moveTo(0, 0);
        sailShape.lineTo(side * 0.28, 0.12);
        sailShape.lineTo(side * 0.58, 0.04);
        sailShape.quadraticCurveTo(side * 0.42, -0.18, side * 0.22, -0.22);
        sailShape.quadraticCurveTo(side * 0.08, -0.16, 0, -0.06);
        sailShape.closePath();

        const sailGeo = new THREE.ShapeGeometry(sailShape, 6);
        disposables.push({ geometry: sailGeo });
        const sail = new THREE.Mesh(sailGeo, wingMat);
        sail.position.z = -0.01;
        sail.castShadow = true;
        sail.receiveShadow = true;
        wing.add(sail);

        return wing;
      };

      wingLeftGroup = buildWing(-1);
      wingRightGroup = buildWing(1);

      // Start folded down behind the back
      wingLeftGroup.rotation.set(-0.9, -0.3, 0.6);
      wingLeftGroup.scale.setScalar(0.25);
      wingRightGroup.rotation.set(-0.9, 0.3, -0.6);
      wingRightGroup.scale.setScalar(0.25);

      gliderAnchor.add(wingLeftGroup, wingRightGroup);
      attachToBone(capeletBone, gliderAnchor);
    }
  } else {
    // =========================================================================
    // KAYA: COORDINATOR ACCESSORIES & DISTINCT SILHOUETTE
    // =========================================================================

    // 1. Field Coordinator Burnished Headband & Insignia on head bone
    if (headBone) {
      const headbandGroup = new THREE.Group();
      headbandGroup.name = "Coordinator_Headband";

      const bandGeo = new THREE.TorusGeometry(0.16, 0.014, 8, 24);
      bandGeo.rotateX(Math.PI / 2);
      const goldMat = new THREE.MeshStandardMaterial({
        color: "#d4af37",
        roughness: 0.32,
        metalness: 0.8,
      });
      disposables.push({ geometry: bandGeo, material: goldMat });
      const band = new THREE.Mesh(bandGeo, goldMat);
      band.position.set(0, 0.08, 0.01);
      headbandGroup.add(band);

      // Coordinator front insignia crest
      const crestGeo = new THREE.BoxGeometry(0.038, 0.048, 0.018);
      disposables.push({ geometry: crestGeo });
      const crest = new THREE.Mesh(crestGeo, goldMat);
      crest.position.set(0, 0.08, 0.165);
      headbandGroup.add(crest);

      // 2. Distinct Auburn / Chestnut Bob Hairstyle for Kaya
      const hairMat = new THREE.MeshStandardMaterial({
        color: "#783420",
        roughness: 0.52,
        metalness: 0.03,
      });
      const hairHighlightMat = new THREE.MeshStandardMaterial({
        color: "#a44e34",
        roughness: 0.45,
        metalness: 0.03,
      });
      disposables.push({ material: [hairMat, hairHighlightMat] });

      // Sculpted auburn hair volume
      const bobCapGeo = new THREE.SphereGeometry(0.18, 20, 16, 0, Math.PI * 2, 0, 2.1);
      bobCapGeo.scale(1.05, 1.0, 1.12);
      disposables.push({ geometry: bobCapGeo });
      const bobCap = new THREE.Mesh(bobCapGeo, hairMat);
      bobCap.position.set(0, 0.06, -0.01);
      bobCap.castShadow = true;
      headbandGroup.add(bobCap);

      // Side bob flaps framing Kaya's cheeks
      for (const side of [-1, 1]) {
        const sideBobGeo = new THREE.SphereGeometry(0.07, 12, 10);
        sideBobGeo.scale(0.7, 1.6, 0.9);
        disposables.push({ geometry: sideBobGeo });
        const sideBob = new THREE.Mesh(sideBobGeo, hairMat);
        sideBob.position.set(side * 0.14, 0.01, 0.04);
        headbandGroup.add(sideBob);

        const highlightStrand = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), hairHighlightMat);
        highlightStrand.scale.set(0.4, 1.4, 0.6);
        highlightStrand.position.set(side * 0.155, 0.03, 0.07);
        headbandGroup.add(highlightStrand);
      }

      attachToBone(headBone, headbandGroup);
    }

    // 2. Public Service Coordinator Medallion & Sash on chest bone
    if (chestBone) {
      const sashGroup = new THREE.Group();
      sashGroup.name = "Coordinator_PublicServiceSash";

      const sashGeo = new THREE.TorusGeometry(0.24, 0.02, 6, 20, Math.PI * 1.3);
      sashGeo.rotateZ(Math.PI / 4);
      const sashMat = new THREE.MeshStandardMaterial({
        color: "#c96d52",
        roughness: 0.65,
        metalness: 0.05,
      });
      disposables.push({ geometry: sashGeo, material: sashMat });
      const sash = new THREE.Mesh(sashGeo, sashMat);
      sash.position.set(0, 0, 0);
      sashGroup.add(sash);

      // Public service bronze seal medallion
      const sealGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.014, 20);
      sealGeo.rotateX(Math.PI / 2);
      const bronzeMat = new THREE.MeshStandardMaterial({
        color: "#d89e42",
        roughness: 0.32,
        metalness: 0.78,
      });
      disposables.push({ geometry: sealGeo, material: bronzeMat });
      const seal = new THREE.Mesh(sealGeo, bronzeMat);
      seal.position.set(0.08, -0.05, 0.22);
      seal.castShadow = true;
      sashGroup.add(seal);

      attachToBone(chestBone, sashGroup);
    }

    // 3. Coordinator Leather Bracers
    const addBracer = (bone: THREE.Bone | null, side: number) => {
      if (!bone) return;
      const bracerGeo = new THREE.CylinderGeometry(0.055, 0.048, 0.10, 16);
      const bracerMat = new THREE.MeshStandardMaterial({
        color: "#4e3621",
        roughness: 0.58,
        metalness: 0.15,
      });
      disposables.push({ geometry: bracerGeo, material: bracerMat });
      const bracer = new THREE.Mesh(bracerGeo, bracerMat);
      bracer.position.set(0, -0.02, 0);
      bone.add(bracer);
    };
    addBracer(armLBone, -1);
    addBracer(armRBone, 1);
  }

  return {
    setGliding: (gliding: boolean) => {
      isGlidingState = gliding;
    },
    update: (delta: number, elapsed: number) => {
      if (!wingLeftGroup || !wingRightGroup) return;

      const targetLerp = isGlidingState ? 1 : 0;
      currentGlideLerp = THREE.MathUtils.lerp(currentGlideLerp, targetLerp, 1 - Math.exp(-8 * delta));

      if (currentGlideLerp < 0.01) {
        wingLeftGroup.visible = false;
        wingRightGroup.visible = false;
        return;
      }

      wingLeftGroup.visible = true;
      wingRightGroup.visible = true;

      // Subtle aerodynamic flapping breeze while gliding
      const flutter = Math.sin(elapsed * 7) * 0.06;

      // Unfold wings from folded tuck to wide 1.1m aerodynamic span
      const rx = THREE.MathUtils.lerp(-0.9, -0.1 + flutter, currentGlideLerp);
      const ryL = THREE.MathUtils.lerp(-0.3, 0.15, currentGlideLerp);
      const ryR = THREE.MathUtils.lerp(0.3, -0.15, currentGlideLerp);
      const rzL = THREE.MathUtils.lerp(0.6, 0.08 - flutter * 0.5, currentGlideLerp);
      const rzR = THREE.MathUtils.lerp(-0.6, -0.08 + flutter * 0.5, currentGlideLerp);
      const scale = THREE.MathUtils.lerp(0.25, 1.0, currentGlideLerp);

      wingLeftGroup.rotation.set(rx, ryL, rzL);
      wingLeftGroup.scale.setScalar(scale);

      wingRightGroup.rotation.set(rx, ryR, rzR);
      wingRightGroup.scale.setScalar(scale);
    },
    dispose: () => {
      for (const item of disposables) {
        item.geometry?.dispose();
        if (item.material) {
          if (Array.isArray(item.material)) {
            item.material.forEach((m) => m.dispose());
          } else {
            item.material.dispose();
          }
        }
      }
    },
  };
}
