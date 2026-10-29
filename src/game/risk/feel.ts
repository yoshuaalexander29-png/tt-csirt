import * as THREE from "three";

export type SpringState = { x: number; v: number };

export function stepSpring(state: SpringState, target: number, frequencyHz: number, damping: number, delta: number) {
  const omega = 2 * Math.PI * frequencyHz;
  const steps = Math.max(1, Math.ceil(delta / (1 / 120)));
  const step = delta / steps;
  for (let index = 0; index < steps; index += 1) {
    state.v += (omega * omega * (target - state.x) - 2 * damping * omega * state.v) * step;
    state.x += state.v * step;
  }
  return state.x;
}

export function squashScale(vertical: number) {
  const horizontal = 1 / Math.sqrt(vertical);
  return { x: horizontal, y: vertical, z: horizontal };
}

export function edgeIndicator(x: number, y: number, behind = false, margin = 0.08) {
  if (behind) { x = -x; y = -y; }
  const limit = 1 - margin;
  if (!behind && Math.abs(x) <= limit && Math.abs(y) <= limit) return { onScreen: true, x, y, angle: 0 };
  const scale = Math.min(limit / Math.max(Math.abs(x), 1e-6), limit / Math.max(Math.abs(y), 1e-6));
  x *= scale; y *= scale;
  return { onScreen: false, x, y, angle: Math.atan2(y, x) };
}

export class DustEmitter {
  private distance = 0;
  private readonly spacing: number;
  private readonly minSpeed: number;
  constructor(spacing = 0.35, minSpeed = 2) { this.spacing = spacing; this.minSpeed = minSpeed; }
  update(speed: number, delta: number) {
    if (speed < this.minSpeed) { this.distance = 0; return 0; }
    this.distance += speed * delta;
    const count = Math.floor(this.distance / this.spacing);
    this.distance -= count * this.spacing;
    return count;
  }
}

export type DustParticle = { mesh: THREE.Mesh; age: number; lifetime: number; velocity: THREE.Vector3 };
