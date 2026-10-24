import type { OrganShape, Vec3 } from '../types.js';
import { clamp, crossVec3, normalizeVec3, subVec3 } from '../math.js';

export interface EvaluatedShapePoint {
  pos: Vec3;
  normal: Vec3;
}

/**
 * Samples width from the shape's widthProfile array at normalized parameter u in [0, 1].
 */
export function sampleWidthProfile(profile: readonly number[], u: number): number {
  const n = profile.length;
  if (n === 0) return 1.0;
  if (n === 1) return profile[0]!;

  const clampedU = clamp(u, 0, 1);
  const idx = clampedU * (n - 1);
  const i0 = Math.floor(idx);
  const i1 = Math.min(n - 1, i0 + 1);
  const frac = idx - i0;

  return (1 - frac) * profile[i0]! + frac * profile[i1]!;
}

/**
 * Evaluates the apex cap contour function Z_cap(v) for a given tip style and width v in [-1, 1].
 */
export function evalApexCap(
  tip: 'round' | 'point' | 'notch' | 'fringe',
  v: number,
  sharpness = 0.2,
): number {
  const v2 = v * v;
  if (tip === 'notch') {
    // Heart-shaped apical cleft flanked by two soft rounded lobes
    return 1.0 - 0.18 * v2 - 0.06 * Math.exp(-7.0 * v2);
  }
  if (tip === 'point') {
    return 1.0 - (0.2 + 0.3 * sharpness) * Math.pow(Math.abs(v), 1.6);
  }
  if (tip === 'fringe') {
    const wobble = 0.04 * Math.sin(v * 24.0);
    return 1.0 - 0.2 * v2 + wobble;
  }
  // 'round' (smooth elliptic dome cap spanning across the entire top margin)
  return 1.0 - 0.22 * v2;
}

/**
 * Evaluates the 3D position of a point on the organ surface in local frame.
 * u in [0, 1] along length (Z axis)
 * v in [-1, 1] across width (X axis)
 * openness in [0, 1] (1 = curled bud, 0 = fully open)
 */
export function evalShapePosition(
  shape: OrganShape,
  u: number,
  v: number,
  openness = 0,
): Vec3 {
  const clampedU = clamp(u, 0, 1);
  const clampedV = clamp(v, -1, 1);

  // 1. Width profile
  let w = sampleWidthProfile(shape.widthProfile, clampedU);

  // Base narrowing
  if (clampedU < 0.2) {
    const baseFactor = clampedU / 0.2;
    w *= 1.0 - shape.baseNarrow * (1.0 - baseFactor);
  }

  // Smooth apex contour
  const cap = evalApexCap(shape.tip, clampedV, shape.tipSharpness);
  let x = clampedV * w * 0.5;
  let z = clampedU * shape.length * cap;
  let y = 0.0;

  // 2. Base concavity / spoon bowl
  const cupFactor = Math.sin(Math.min(1.0, clampedU / 0.72) * Math.PI);
  y -= shape.cupDepth * (1.0 - clampedV * clampedV) * cupFactor;

  // Azimuthal cylindrical wrap
  // Petal edges wrap around the bud cylinder toward the center (+y in normal frame)
  const wrapR = 0.35;
  const phi = clamp(x / wrapR, -1.35, 1.35);
  x = wrapR * Math.sin(phi);
  y += wrapR * (1.0 - Math.cos(phi)) * (0.35 + shape.cupDepth * 0.65);

  // 3. Margin ruffles
  if (shape.ruffle > 0) {
    const marginFactor = Math.abs(clampedV);
    y +=
      shape.ruffle * marginFactor * Math.sin(clampedU * shape.ruffleFreq * Math.PI * 2);
  }

  // 4. Species-specific longitudinal & margin curvature:
  if (shape.midribBend > 0.15) {
    // Tulip goblet / arched leaf:
    const belly = Math.sin(clampedU * Math.PI);
    y -= shape.midribBend * belly * 0.42;

    if (clampedU > 0.52) {
      const inT = (clampedU - 0.52) / 0.48;
      y += shape.midribBend * 0.4 * inT * inT;
      z -= shape.midribBend * 0.12 * inT;
    }

    const keel = (1.0 - Math.abs(clampedV)) * 0.08 * Math.sin(clampedU * Math.PI);
    y -= keel;
  } else if (shape.reflex > 0.05) {
    // Rose petal revolute wings:
    if (clampedU > 0.38) {
      const archT = (clampedU - 0.38) / 0.62;
      const archAngle = shape.reflex * archT * archT * 1.8;
      y -= Math.sin(archAngle) * 0.42 * archT;
      z -= (1.0 - Math.cos(archAngle)) * 0.28 * archT;

      // Revolute wing roll:
      const wingT = Math.max(0, Math.min(1, (Math.abs(clampedV) - 0.35) / 0.65));
      const rollAngle = wingT * 1.6 * shape.reflex * archT;
      y -= Math.sin(rollAngle) * 0.28 * wingT * archT;
      x *= 1.0 - (1.0 - Math.cos(rollAngle)) * 0.24 * wingT;
    }
  } else {
    // Daisy / leaf:
    const midArc = Math.sin(clampedU * Math.PI);
    y -= shape.midribBend * midArc * 0.2;
    const furrow = -Math.abs(clampedV) * (1.0 - Math.abs(clampedV)) * 0.14 * midArc;
    y += furrow;

    if (shape.curlTip > 0.01 && clampedU > 0.65) {
      const curlT = (clampedU - 0.65) / 0.35;
      const curlAngle = shape.curlTip * curlT * curlT * 1.5;
      y -= Math.sin(curlAngle) * 0.2 * curlT;
      z -= (1.0 - Math.cos(curlAngle)) * 0.14 * curlT;
    }
  }

  // 6. Bud unfurling (openness)
  if (openness > 0) {
    // In bud phase, petals cup inward strongly and curl upward
    const budCup = openness * 0.4 * (1.0 - clampedV * clampedV);
    y += budCup;
    // Rotate towards closed position
    const budAngle = openness * 1.1 * clampedU;
    const origY = y;
    const origZ = z;
    y = origY * Math.cos(budAngle) - origZ * Math.sin(budAngle);
    z = origY * Math.sin(budAngle) + origZ * Math.cos(budAngle);
    x *= 1.0 - openness * 0.4;
  }

  return [x, y, z];
}

/**
 * Pure evaluation function returning position and normal in the organ's local frame.
 */
export function evalShape(
  shape: OrganShape,
  u: number,
  v: number,
  openness = 0,
): EvaluatedShapePoint {
  const eps = 1e-3;
  const p = evalShapePosition(shape, u, v, openness);

  const pU1 = evalShapePosition(shape, Math.min(1, u + eps), v, openness);
  const pU0 = evalShapePosition(shape, Math.max(0, u - eps), v, openness);

  const pV1 = evalShapePosition(shape, u, Math.min(1, v + eps), openness);
  const pV0 = evalShapePosition(shape, u, Math.max(-1, v - eps), openness);

  const du = subVec3(pU1, pU0);
  const dv = subVec3(pV1, pV0);

  // Normal is perpendicular to tangent along length (du) and across width (dv)
  let normal = normalizeVec3(crossVec3(dv, du));
  if (normal[0] === 0 && normal[1] === 0 && normal[2] === 0) {
    normal = [0, 1, 0];
  }

  return { pos: p, normal };
}
