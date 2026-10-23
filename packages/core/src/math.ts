import type { Vec3 } from './types.js';

export function cleanZero(n: number): number {
  return n === 0 ? 0 : n;
}

export function vec3(x = 0, y = 0, z = 0): Vec3 {
  return [cleanZero(x), cleanZero(y), cleanZero(z)];
}

export function cloneVec3(v: Vec3): Vec3 {
  return [cleanZero(v[0]), cleanZero(v[1]), cleanZero(v[2])];
}

export function addVec3(a: Vec3, b: Vec3): Vec3 {
  return [cleanZero(a[0] + b[0]), cleanZero(a[1] + b[1]), cleanZero(a[2] + b[2])];
}

export function subVec3(a: Vec3, b: Vec3): Vec3 {
  return [cleanZero(a[0] - b[0]), cleanZero(a[1] - b[1]), cleanZero(a[2] - b[2])];
}

export function scaleVec3(v: Vec3, s: number): Vec3 {
  return [cleanZero(v[0] * s), cleanZero(v[1] * s), cleanZero(v[2] * s)];
}

export function dotVec3(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function crossVec3(a: Vec3, b: Vec3): Vec3 {
  return [
    cleanZero(a[1] * b[2] - a[2] * b[1]),
    cleanZero(a[2] * b[0] - a[0] * b[2]),
    cleanZero(a[0] * b[1] - a[1] * b[0]),
  ];
}

export function lengthSqVec3(v: Vec3): number {
  return v[0] * v[0] + v[1] * v[1] + v[2] * v[2];
}

export function lengthVec3(v: Vec3): number {
  return Math.hypot(v[0], v[1], v[2]);
}

export function distanceVec3(a: Vec3, b: Vec3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

export function distanceSqVec3(a: Vec3, b: Vec3): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return dx * dx + dy * dy + dz * dz;
}

export function normalizeVec3(v: Vec3): Vec3 {
  const len = Math.hypot(v[0], v[1], v[2]);
  if (len === 0) return [0, 0, 0];
  const inv = 1 / len;
  return [cleanZero(v[0] * inv), cleanZero(v[1] * inv), cleanZero(v[2] * inv)];
}

export function lerpVec3(a: Vec3, b: Vec3, t: number): Vec3 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export function smootherstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  if (inMax === inMin) return outMin;
  const t = (value - inMin) / (inMax - inMin);
  return outMin + t * (outMax - outMin);
}

export function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function radToDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}

// Easings (pure functions of t in [0, 1])
export function easeInQuad(t: number): number {
  return t * t;
}

export function easeOutQuad(t: number): number {
  return t * (2 - t);
}

export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export function easeInCubic(t: number): number {
  return t * t * t;
}

export function easeOutCubic(t: number): number {
  const f = t - 1;
  return f * f * f + 1;
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
}

export function easeOutBack(t: number, s = 1.70158): number {
  const f = t - 1;
  return f * f * ((s + 1) * f + s) + 1;
}
