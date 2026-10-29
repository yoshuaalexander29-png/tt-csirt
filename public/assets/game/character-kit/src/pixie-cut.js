import * as THREE from 'three';

/**
 * Replace the Great Fairy's long/updo hair meshes with a small custom pixie cut.
 * Geometry is generated in holder space, then parented to the head bone with a
 * compensating matrix so its initial world position is preserved and it follows
 * the head during runtime AnimationMixer clips.
 */
function collectBones(root) {
  const out = new Map();
  root.traverse((obj) => { if (obj.isBone && !out.has(obj.name)) out.set(obj.name, obj); });
  return out;
}

export function installPixieCut(root, holder) {
  root.updateMatrixWorld(true);
  holder.updateMatrixWorld(true);

  const bones = collectBones(root);
  const headBone = bones.get('head') || bones.get('head_SScaleOff');
  if (!headBone) {
    console.warn('Pixie cut skipped: no head bone found.');
    return false;
  }

  // Use the deformed head/face detail meshes as a scale and placement reference.
  const faceMeshes = [];
  root.traverse((obj) => {
    if (obj.isMesh && /head.*MI_(eye|mouth)/i.test(obj.name)) faceMeshes.push(obj);
  });
  if (!faceMeshes.length) {
    console.warn('Pixie cut skipped: no head detail meshes found.');
    return false;
  }

  const faceBox = new THREE.Box3();
  const localVertex = new THREE.Vector3();
  for (const mesh of faceMeshes) {
    mesh.updateWorldMatrix(true, false);
    const pos = mesh.geometry?.getAttribute('position');
    if (!pos) continue;
    for (let i = 0; i < pos.count; i++) {
      if (mesh.isSkinnedMesh && typeof mesh.getVertexPosition === 'function') {
        mesh.getVertexPosition(i, localVertex);
      } else {
        localVertex.fromBufferAttribute(pos, i);
      }
      mesh.localToWorld(localVertex);
      holder.worldToLocal(localVertex);
      faceBox.expandByPoint(localVertex);
    }
  }
  if (faceBox.isEmpty()) {
    console.warn('Pixie cut skipped: head bounds were empty.');
    return false;
  }

  const faceSize = faceBox.getSize(new THREE.Vector3());
  const center = faceBox.getCenter(new THREE.Vector3());
  const rx = Math.max(faceSize.x * 0.60, 0.16);
  const ry = Math.max(faceSize.y * 0.56, 0.15);
  const rz = Math.max(faceSize.x * 0.49, faceSize.z * 0.85, 0.13);
  const hairlineY = faceBox.max.y + faceSize.y * 0.08;
  const capCenterY = hairlineY + ry * 0.29;
  // The front of this model faces +Z in the Three.js scene.
  const capCenterZ = faceBox.max.z - rz * 0.78;
  const fringeFrontZ = faceBox.max.z + Math.max(0.008, faceSize.z * 0.035);

  const hairGroup = new THREE.Group();
  hairGroup.name = 'GroveOracle_PixieCut_Geometry';

  const capGeometry = new THREE.SphereGeometry(1, 32, 18, 0, Math.PI * 2, 0, 2.06);
  capGeometry.scale(rx, ry, rz);
  capGeometry.translate(center.x, capCenterY, capCenterZ);
  // Subtle top-to-bottom color variation gives the new geometry more dimension.
  const capPos = capGeometry.getAttribute('position');
  const colors = [];
  const baseColor = new THREE.Color(0x8b5b20);
  const highlightColor = new THREE.Color(0xffe3a0);
  for (let i = 0; i < capPos.count; i++) {
    const t = THREE.MathUtils.clamp((capPos.getY(i) - (capCenterY - ry)) / (2 * ry), 0, 1);
    const color = baseColor.clone().lerp(highlightColor, 0.10 + 0.36 * t);
    colors.push(color.r, color.g, color.b);
  }
  capGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  capGeometry.computeVertexNormals();
  const capMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff, vertexColors: true, roughness: 0.52, metalness: 0.035,
    side: THREE.DoubleSide
  });
  const cap = new THREE.Mesh(capGeometry, capMaterial);
  cap.name = 'PixieCut_ShortScalp';
  cap.castShadow = true;
  cap.receiveShadow = true;
  hairGroup.add(cap);

  // Side locks end around the ears, instead of trailing down the back.
  const lockMaterial = new THREE.MeshStandardMaterial({ color: 0xc18a32, roughness: 0.48, metalness: 0.015 });
  const lockHighlight = new THREE.MeshStandardMaterial({ color: 0xffdc82, roughness: 0.42, metalness: 0.015 });
  for (const side of [-1, 1]) {
    const lockGeo = new THREE.SphereGeometry(1, 18, 12);
    lockGeo.scale(rx * 0.255, ry * 0.52, rz * 0.34);
    lockGeo.translate(
      center.x + side * rx * 0.70,
      hairlineY - ry * 0.37,
      capCenterZ + rz * 0.26
    );
    const lock = new THREE.Mesh(lockGeo, lockMaterial);
    lock.name = side < 0 ? 'PixieCut_LeftSideLock' : 'PixieCut_RightSideLock';
    lock.castShadow = true;
    lock.receiveShadow = true;
    hairGroup.add(lock);

    // Small tapered highlight sliver along each side lock.
    const highlightGeo = new THREE.SphereGeometry(1, 12, 8);
    highlightGeo.scale(rx * 0.075, ry * 0.34, rz * 0.12);
    highlightGeo.translate(
      center.x + side * rx * 0.73 - side * rx * 0.045,
      hairlineY - ry * 0.30,
      capCenterZ + rz * 0.52
    );
    const highlight = new THREE.Mesh(highlightGeo, lockHighlight);
    highlight.name = 'PixieCut_SideHighlight';
    hairGroup.add(highlight);
  }

  // Sculpted front fringe: a shallow, beveled sheet that reads as swept hair.
  const fringeShape = new THREE.Shape();
  fringeShape.moveTo(center.x - rx * 0.82, hairlineY + ry * 0.12);
  fringeShape.bezierCurveTo(
    center.x - rx * 0.30, hairlineY + ry * 0.38,
    center.x + rx * 0.18, hairlineY + ry * 0.20,
    center.x + rx * 0.82, hairlineY - ry * 0.08
  );
  fringeShape.bezierCurveTo(
    center.x + rx * 0.55, hairlineY - ry * 0.44,
    center.x + rx * 0.20, hairlineY - ry * 0.32,
    center.x - rx * 0.06, hairlineY - ry * 0.27
  );
  fringeShape.bezierCurveTo(
    center.x - rx * 0.43, hairlineY - ry * 0.36,
    center.x - rx * 0.61, hairlineY - ry * 0.14,
    center.x - rx * 0.82, hairlineY - ry * 0.20
  );
  fringeShape.closePath();
  const fringeGeometry = new THREE.ExtrudeGeometry(fringeShape, {
    depth: Math.max(0.025, rz * 0.18),
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: Math.max(0.006, rx * 0.018),
    bevelThickness: Math.max(0.006, rz * 0.018),
    curveSegments: 8
  });
  fringeGeometry.translate(0, 0, fringeFrontZ);
  fringeGeometry.computeVertexNormals();
  const fringe = new THREE.Mesh(fringeGeometry, new THREE.MeshStandardMaterial({
    color: 0xe0ad4c, roughness: 0.43, metalness: 0.015, side: THREE.DoubleSide
  }));
  fringe.name = 'PixieCut_SweptFringe';
  fringe.castShadow = true;
  fringe.receiveShadow = true;
  hairGroup.add(fringe);

  // A short swept strand gives the silhouette a little asymmetry.
  const strandCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(center.x + rx * 0.02, hairlineY + ry * 0.24, fringeFrontZ + rz * 0.04),
    new THREE.Vector3(center.x + rx * 0.34, hairlineY + ry * 0.18, fringeFrontZ + rz * 0.07),
    new THREE.Vector3(center.x + rx * 0.59, hairlineY - ry * 0.05, fringeFrontZ + rz * 0.04),
    new THREE.Vector3(center.x + rx * 0.66, hairlineY - ry * 0.16, fringeFrontZ + rz * 0.02)
  ]);
  const strand = new THREE.Mesh(
    new THREE.TubeGeometry(strandCurve, 16, Math.max(0.006, rx * 0.025), 6, false),
    new THREE.MeshStandardMaterial({ color: 0xffefb0, roughness: 0.38, metalness: 0.01 })
  );
  strand.name = 'PixieCut_SweptHighlight';
  hairGroup.add(strand);

  // Swap the original updo/long-hair meshes only after the replacement is built.
  let replacedCount = 0;
  root.traverse((obj) => {
    if (obj.isMesh && /(?:hair_low__MI_hair|tophair_low__MI_hair)/i.test(obj.name)) {
      obj.visible = false;
      replacedCount++;
    }
  });
  if (!replacedCount) {
    console.warn('Pixie cut added, but no source hair meshes were matched for hiding.');
  }

  // Geometry points are authored in holder space. This matrix maps that space
  // into the head bone's local space while preserving the original placement.
  holder.updateMatrixWorld(true);
  headBone.updateWorldMatrix(true, false);
  const holderToHead = new THREE.Matrix4()
    .copy(headBone.matrixWorld).invert()
    .multiply(holder.matrixWorld);
  hairGroup.matrix.copy(holderToHead);
  hairGroup.matrixAutoUpdate = false;
  headBone.add(hairGroup);
  hairGroup.matrixWorldNeedsUpdate = true;
  root.updateMatrixWorld(true);
  console.info(`Grove Oracle blonde pixie cut installed (${replacedCount} original hair meshes replaced).`);
  return true;
}

