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

  // Tip modulation based on tip style
  if (clampedU > 0.8) {
    const tipT = (clampedU - 0.8) / 0.2; // 0..1 at tip
    if (shape.tip === 'point') {
      w *= Math.pow(1.0 - tipT, 0.5 + shape.tipSharpness);
    } else if (shape.tip === 'round') {
      w *= Math.sqrt(Math.max(0, 1.0 - tipT * tipT));
    } else if (shape.tip === 'notch') {
      const centerCut = 1.0 - Math.exp(-Math.abs(clampedV) * 4.0) * tipT;
      w *= Math.sqrt(Math.max(0, 1.0 - tipT * tipT)) * centerCut;
    } else if (shape.tip === 'fringe') {
      const fringeWobble = 0.8 + 0.2 * Math.sin(clampedV * 24.0);
      w *= Math.sqrt(Math.max(0, 1.0 - tipT)) * fringeWobble;
    }
  }

  // Width position
  let x = clampedV * w * 0.5;
  let z = clampedU * shape.length;
  let y = 0;

  // 2. Lateral concavity (cup depth)
  y += shape.cupDepth * (1.0 - clampedV * clampedV) * Math.sin(clampedU * Math.PI);

  // 3. Margin ruffles
  if (shape.ruffle > 0) {
    const marginFactor = Math.abs(clampedV);
    y +=
      shape.ruffle * marginFactor * Math.sin(clampedU * shape.ruffleFreq * Math.PI * 2);
  }

  // 4. Longitudinal curvature: midrib bend and reflex
  y += shape.midribBend * Math.sin(clampedU * Math.PI * 0.9);
  y -= shape.reflex * clampedU * clampedU;

  // 5. Tip curl
  if (clampedU > 0.6) {
    const curlT = (clampedU - 0.6) / 0.4;
    const curlAngle = shape.curlTip * curlT * curlT;
    const dy = -Math.sin(curlAngle) * 0.3 * curlT;
    const dz = -(1.0 - Math.cos(curlAngle)) * 0.2 * curlT;
    y += dy;
    z += dz;
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
