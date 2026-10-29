import * as THREE from "three";

/**
 * Replaces the Great Fairy's oversized updo hair meshes with a custom,
 * charming blonde pixie cut that follows the head bone during animations.
 *
 * Authored in holder space, then mapped to the head bone's local space via an
 * inverse transformation matrix to preserve exact alignment throughout locomotion.
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

export function installPixieCut(root: THREE.Object3D, holder: THREE.Object3D): boolean {
  root.updateMatrixWorld(true);
  holder.updateMatrixWorld(true);

  const bones = collectBones(root);
  const headBone = bones.get("head") || bones.get("head_SScaleOff") || bones.get("Head");
  if (!headBone) {
    console.warn("Pixie cut skipped: no head bone found.");
    return false;
  }

  // Use the deformed head/face detail meshes as a scale and placement reference
  const faceMeshes: THREE.Mesh[] = [];
  root.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      const name = obj.name.toLowerCase();
      if (/head.*mi_(eye|mouth)/i.test(obj.name) || /eye|eyebrow|face|head/i.test(name)) {
        faceMeshes.push(obj as THREE.Mesh);
      }
    }
  });

  const faceBox = new THREE.Box3();
  const localVertex = new THREE.Vector3();
  for (const mesh of faceMeshes) {
    mesh.updateWorldMatrix(true, false);
    const pos = mesh.geometry?.getAttribute("position");
    if (!pos) continue;
    for (let i = 0; i < pos.count; i++) {
      if ((mesh as any).isSkinnedMesh && typeof (mesh as any).getVertexPosition === "function") {
        (mesh as any).getVertexPosition(i, localVertex);
      } else {
        localVertex.fromBufferAttribute(pos, i);
      }
      mesh.localToWorld(localVertex);
      holder.worldToLocal(localVertex);
      faceBox.expandByPoint(localVertex);
    }
  }

  let center: THREE.Vector3;
  let rx: number;
  let ry: number;
  let rz: number;
  let hairlineY: number;
  let capCenterY: number;
  let capCenterZ: number;
  let fringeFrontZ: number;

  if (!faceBox.isEmpty()) {
    const faceSize = faceBox.getSize(new THREE.Vector3());
    center = faceBox.getCenter(new THREE.Vector3());
    rx = Math.max(faceSize.x * 0.6, 0.14);
    ry = Math.max(faceSize.y * 0.56, 0.15);
    rz = Math.max(faceSize.x * 0.49, faceSize.z * 0.85, 0.13);
    hairlineY = faceBox.max.y + faceSize.y * 0.08;
    capCenterY = hairlineY + ry * 0.29;
    capCenterZ = faceBox.max.z - rz * 0.78;
    fringeFrontZ = faceBox.max.z + Math.max(0.008, faceSize.z * 0.035);
  } else {
    // Robust fallback using head bone world position
    const headWorld = new THREE.Vector3();
    headBone.getWorldPosition(headWorld);
    holder.worldToLocal(headWorld);
    center = headWorld.clone();
    rx = 0.14;
    ry = 0.16;
    rz = 0.14;
    hairlineY = center.y + 0.04;
    capCenterY = center.y + 0.08;
    capCenterZ = center.z - 0.02;
    fringeFrontZ = center.z + 0.12;
  }
  const hairGroup = new THREE.Group();
  hairGroup.name = "Protagonist_BlondePixieCut";

  // 1. Scalp cap with vertical color gradient (warm honey base to bright golden highlight)
  const capGeometry = new THREE.SphereGeometry(1, 32, 18, 0, Math.PI * 2, 0, 2.06);
  capGeometry.scale(rx, ry, rz);
  capGeometry.translate(center.x, capCenterY, capCenterZ);
  const capPos = capGeometry.getAttribute("position");
  const colors: number[] = [];
  const baseColor = new THREE.Color("#9c6827");
  const highlightColor = new THREE.Color("#ffe79e");
  for (let i = 0; i < capPos.count; i++) {
    const t = THREE.MathUtils.clamp((capPos.getY(i) - (capCenterY - ry)) / (2 * ry), 0, 1);
    const color = baseColor.clone().lerp(highlightColor, 0.12 + 0.42 * t);
    colors.push(color.r, color.g, color.b);
  }
  capGeometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  capGeometry.computeVertexNormals();

  const capMaterial = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    vertexColors: true,
    roughness: 0.48,
    metalness: 0.03,
    side: THREE.DoubleSide,
  });
  const cap = new THREE.Mesh(capGeometry, capMaterial);
  cap.name = "PixieCut_ScalpCap";
  cap.castShadow = true;
  cap.receiveShadow = true;
  hairGroup.add(cap);

  // 2. Charming side locks framing the cheeks and ears
  const lockMaterial = new THREE.MeshStandardMaterial({ color: "#cda03e", roughness: 0.46, metalness: 0.02 });
  const lockHighlight = new THREE.MeshStandardMaterial({ color: "#ffe79a", roughness: 0.4, metalness: 0.015 });
  for (const side of [-1, 1]) {
    const lockGeo = new THREE.SphereGeometry(1, 18, 12);
    lockGeo.scale(rx * 0.26, ry * 0.52, rz * 0.34);
    lockGeo.translate(
      center.x + side * rx * 0.7,
      hairlineY - ry * 0.37,
      capCenterZ + rz * 0.26
    );
    const lock = new THREE.Mesh(lockGeo, lockMaterial);
    lock.name = side < 0 ? "PixieCut_LeftLock" : "PixieCut_RightLock";
    lock.castShadow = true;
    lock.receiveShadow = true;
    hairGroup.add(lock);

    // Subtle highlight strand along each side lock
    const highlightGeo = new THREE.SphereGeometry(1, 12, 8);
    highlightGeo.scale(rx * 0.08, ry * 0.34, rz * 0.12);
    highlightGeo.translate(
      center.x + side * rx * 0.73 - side * rx * 0.045,
      hairlineY - ry * 0.3,
      capCenterZ + rz * 0.52
    );
    const highlight = new THREE.Mesh(highlightGeo, lockHighlight);
    highlight.name = "PixieCut_SideHighlight";
    hairGroup.add(highlight);
  }

  // 3. Sculpted front fringe (swept bangs with soft bevel)
  const fringeShape = new THREE.Shape();
  fringeShape.moveTo(center.x - rx * 0.82, hairlineY + ry * 0.12);
  fringeShape.bezierCurveTo(
    center.x - rx * 0.3, hairlineY + ry * 0.38,
    center.x + rx * 0.18, hairlineY + ry * 0.2,
    center.x + rx * 0.82, hairlineY - ry * 0.08
  );
  fringeShape.bezierCurveTo(
    center.x + rx * 0.55, hairlineY - ry * 0.44,
    center.x + rx * 0.2, hairlineY - ry * 0.32,
    center.x - rx * 0.06, hairlineY - ry * 0.27
  );
  fringeShape.bezierCurveTo(
    center.x - rx * 0.43, hairlineY - ry * 0.36,
    center.x - rx * 0.61, hairlineY - ry * 0.14,
    center.x - rx * 0.82, hairlineY - ry * 0.2
  );
  fringeShape.closePath();

  const fringeGeometry = new THREE.ExtrudeGeometry(fringeShape, {
    depth: Math.max(0.025, rz * 0.18),
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: Math.max(0.006, rx * 0.018),
    bevelThickness: Math.max(0.006, rz * 0.018),
    curveSegments: 8,
  });
  fringeGeometry.translate(0, 0, fringeFrontZ);
  fringeGeometry.computeVertexNormals();

  const fringe = new THREE.Mesh(
    fringeGeometry,
    new THREE.MeshStandardMaterial({
      color: "#e8b852",
      roughness: 0.42,
      metalness: 0.02,
      side: THREE.DoubleSide,
    })
  );
  fringe.name = "PixieCut_SweptFringe";
  fringe.castShadow = true;
  fringe.receiveShadow = true;
  hairGroup.add(fringe);

  // 4. Subtle asymmetric swept strand for lively silhouette
  const strandCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(center.x + rx * 0.02, hairlineY + ry * 0.24, fringeFrontZ + rz * 0.04),
    new THREE.Vector3(center.x + rx * 0.34, hairlineY + ry * 0.18, fringeFrontZ + rz * 0.07),
    new THREE.Vector3(center.x + rx * 0.59, hairlineY - ry * 0.05, fringeFrontZ + rz * 0.04),
    new THREE.Vector3(center.x + rx * 0.66, hairlineY - ry * 0.16, fringeFrontZ + rz * 0.02),
  ]);
  const strand = new THREE.Mesh(
    new THREE.TubeGeometry(strandCurve, 16, Math.max(0.006, rx * 0.025), 6, false),
    new THREE.MeshStandardMaterial({ color: "#fff0b8", roughness: 0.36, metalness: 0.01 })
  );
  strand.name = "PixieCut_SweptHighlightStrand";
  hairGroup.add(strand);

  // 5. Hide the original bulky fairy hair meshes cleanly
  let replacedCount = 0;
  root.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh && /(?:hair_low__MI_hair|tophair_low__MI_hair)/i.test(obj.name)) {
      obj.visible = false;
      replacedCount++;
    }
  });

  // 6. Parent the hairstyle to the head bone with world-to-local compensation matrix
  holder.updateMatrixWorld(true);
  headBone.updateWorldMatrix(true, false);
  const holderToHead = new THREE.Matrix4()
    .copy(headBone.matrixWorld)
    .invert()
    .multiply(holder.matrixWorld);

  hairGroup.matrix.copy(holderToHead);
  hairGroup.matrixAutoUpdate = false;
  headBone.add(hairGroup);
  hairGroup.matrixWorldNeedsUpdate = true;
  root.updateMatrixWorld(true);

  return true;
}
