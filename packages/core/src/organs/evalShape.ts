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

  // 2. Base concavity / spoon bowl
  const cupFactor = Math.sin(Math.min(1.0, clampedU / 0.72) * Math.PI);
  y -= shape.cupDepth * (1.0 - clampedV * clampedV) * cupFactor;

  // Azimuthal wrap around cylinder
  z -= 0.3 * (clampedV * clampedV) * (w * w) * (0.2 + shape.cupDepth);

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
    y -= shape.midribBend * belly * 0.38;

    if (clampedU > 0.52) {
      const inT = (clampedU - 0.52) / 0.48;
      y += shape.midribBend * 0.36 * inT * inT;
      z -= shape.midribBend * 0.14 * inT;
    }

    const keel = (1.0 - Math.abs(clampedV)) * 0.12 * Math.sin(clampedU * Math.PI);
    y -= keel;
  } else if (shape.reflex > 0.05) {
    // Rose petal revolute wings and recurved apex:
    if (clampedU > 0.35) {
      const archT = (clampedU - 0.35) / 0.65;
      const archAngle = shape.reflex * archT * archT * 2.2;
      y -= Math.sin(archAngle) * 0.45 * archT;
      z -= (1.0 - Math.cos(archAngle)) * 0.32 * archT;

      // Revolute wing roll:
      const wingT = Math.max(0, Math.min(1, (Math.abs(clampedV) - 0.38) / 0.62));
      const rollAngle = wingT * 1.8 * shape.reflex * archT;
      y -= Math.sin(rollAngle) * 0.26 * wingT * archT;
      x *= 1.0 - (1.0 - Math.cos(rollAngle)) * 0.32 * wingT;

      // Recurved apex quill:
      const apexCenter =
        (1.0 - Math.min(1.0, Math.abs(clampedV) / 0.38)) *
        Math.max(0.0, (clampedU - 0.68) / 0.32);
      const apexCurl = shape.reflex * 0.24 * apexCenter;
      y -= apexCurl * 1.3;
      z -= apexCurl * 0.7;
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
