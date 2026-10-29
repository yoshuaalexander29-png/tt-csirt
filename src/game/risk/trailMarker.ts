import * as THREE from "three";

export type TrailMarker = { group: THREE.Group; setStep: (step: number) => void; update: (time: number, reducedMotion: boolean) => void };

function makeSignTexture() {
  const canvas = document.createElement("canvas"); canvas.width = 128; canvas.height = 96;
  const context = canvas.getContext("2d");
  if (context) {
    context.fillStyle = "#fff1d3"; context.fillRect(0, 0, 128, 96);
    context.strokeStyle = "#9b613d"; context.lineWidth = 6; context.strokeRect(4, 4, 120, 88);
    context.fillStyle = "#624b3b"; context.font = "700 58px system-ui, sans-serif"; context.textAlign = "center"; context.textBaseline = "middle"; context.fillText("1", 64, 48);
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}

export function createTrailMarker(scene: THREE.Scene): TrailMarker {
  const group = new THREE.Group(); group.name = "kenney-style-trail-signpost";
  const wood = new THREE.MeshStandardMaterial({ color: "#8a593f", roughness: 0.9 });
  const lightWood = new THREE.MeshStandardMaterial({ color: "#cf9760", roughness: 0.9 });
  const cream = new THREE.MeshStandardMaterial({ color: "#fff1d3", roughness: 1 });
  const gold = new THREE.MeshToonMaterial({ color: "#e7ae4f" });
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.08, 1.08, 7), wood); post.position.y = 0.54; post.castShadow = true; group.add(post);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.58, 0.1), wood); frame.position.set(0, 1.03, 0.02); frame.castShadow = true; group.add(frame);
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.48, 0.035), cream); board.position.set(0, 1.03, 0.085); group.add(board);
  const texture = makeSignTexture();
  const number = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.36), new THREE.MeshBasicMaterial({ map: texture, transparent: false })); number.position.set(0, 1.03, 0.108); group.add(number);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.08, 0.16), lightWood); cap.position.set(0, 1.36, 0.01); cap.castShadow = true; group.add(cap);
  const badge = new THREE.Mesh(new THREE.OctahedronGeometry(0.105, 0), gold); badge.position.set(0, 1.53, 0.02); group.add(badge);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.032, 6, 24), new THREE.MeshBasicMaterial({ color: "#e8b55e", transparent: true, opacity: 0.68, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.035; group.add(ring);
  scene.add(group);

  return {
    group,
    setStep: (step) => {
      const context = texture.image instanceof HTMLCanvasElement ? texture.image.getContext("2d") : null;
      if (!context) return;
      context.fillStyle = "#fff1d3"; context.fillRect(0, 0, 128, 96); context.strokeStyle = "#9b613d"; context.lineWidth = 6; context.strokeRect(4, 4, 120, 88);
      context.fillStyle = "#624b3b"; context.font = "700 58px system-ui, sans-serif"; context.textAlign = "center"; context.textBaseline = "middle"; context.fillText(step > 0 ? String(Math.min(step, 5)) : "•", 64, 48); texture.needsUpdate = true;
    },
    update: (time, reducedMotion) => {
      if (!reducedMotion) { group.children[1].rotation.z = Math.sin(time * 1.5) * 0.018; badge.rotation.y = time * 0.35; }
      ring.scale.setScalar(reducedMotion ? 1 : 1 + Math.sin(time * 1.7) * 0.035);
    },
  };
}
