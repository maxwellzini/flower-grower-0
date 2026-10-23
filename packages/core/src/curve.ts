import type { Vec3 } from './types.js';
import {
  clamp,
  crossVec3,
  dotVec3,
  lengthVec3,
  normalizeVec3,
  scaleVec3,
  subVec3,
} from './math.js';

export interface CurveFrame {
  origin: Vec3;
  tangent: Vec3;
  normal: Vec3;
  binormal: Vec3;
}

/**
 * Evaluates a 3D Catmull-Rom spline segment at parameter t in [0, 1].
 */
export function catmullRomPoint(p0: Vec3, p1: Vec3, p2: Vec3, p3: Vec3, t: number): Vec3 {
  const t2 = t * t;
  const t3 = t2 * t;

  const v0 = (-t3 + 2 * t2 - t) * 0.5;
  const v1 = (3 * t3 - 5 * t2 + 2) * 0.5;
  const v2 = (-3 * t3 + 4 * t2 + t) * 0.5;
  const v3 = (t3 - t2) * 0.5;

  return [
    p0[0] * v0 + p1[0] * v1 + p2[0] * v2 + p3[0] * v3,
    p0[1] * v0 + p1[1] * v1 + p2[1] * v2 + p3[1] * v3,
    p0[2] * v0 + p1[2] * v1 + p2[2] * v2 + p3[2] * v3,
  ];
}

/**
 * Evaluates the tangent of a 3D Catmull-Rom spline segment at parameter t in [0, 1].
 */
export function catmullRomTangent(
  p0: Vec3,
  p1: Vec3,
  p2: Vec3,
  p3: Vec3,
  t: number,
): Vec3 {
  const t2 = t * t;

  const v0 = (-3 * t2 + 4 * t - 1) * 0.5;
  const v1 = (9 * t2 - 10 * t) * 0.5;
  const v2 = (-9 * t2 + 8 * t + 1) * 0.5;
  const v3 = (3 * t2 - 2 * t) * 0.5;

  const raw: Vec3 = [
    p0[0] * v0 + p1[0] * v1 + p2[0] * v2 + p3[0] * v3,
    p0[1] * v0 + p1[1] * v1 + p2[1] * v2 + p3[1] * v3,
    p0[2] * v0 + p1[2] * v1 + p2[2] * v2 + p3[2] * v3,
  ];
  return normalizeVec3(raw);
}

/**
 * Samples a Catmull-Rom spline along control points.
 */
export function sampleCatmullRom(
  controlPoints: readonly Vec3[],
  samplesPerSegment = 10,
  closed = false,
): Vec3[] {
  const n = controlPoints.length;
  if (n === 0) return [];
  if (n === 1) return [[...controlPoints[0]!]];
  if (n === 2) {
    const res: Vec3[] = [];
    const p0 = controlPoints[0]!;
    const p1 = controlPoints[1]!;
    for (let i = 0; i <= samplesPerSegment; i++) {
      const t = i / samplesPerSegment;
      res.push([
        p0[0] + (p1[0] - p0[0]) * t,
        p0[1] + (p1[1] - p0[1]) * t,
        p0[2] + (p1[2] - p0[2]) * t,
      ]);
    }
    return res;
  }

  const result: Vec3[] = [];
  const segments = closed ? n : n - 1;

  for (let i = 0; i < segments; i++) {
    const p1 = controlPoints[i]!;
    const p2 = controlPoints[(i + 1) % n]!;
    const p0: Vec3 = closed
      ? (controlPoints[(i - 1 + n) % n]! as Vec3)
      : i === 0
        ? [2 * p1[0] - p2[0], 2 * p1[1] - p2[1], 2 * p1[2] - p2[2]]
        : (controlPoints[i - 1]! as Vec3);
    const p3: Vec3 = closed
      ? (controlPoints[(i + 2) % n]! as Vec3)
      : i + 2 >= n
        ? [2 * p2[0] - p1[0], 2 * p2[1] - p1[1], 2 * p2[2] - p1[2]]
        : (controlPoints[i + 2]! as Vec3);

    const count = i === segments - 1 ? samplesPerSegment + 1 : samplesPerSegment;
    for (let s = 0; s < count; s++) {
      const t = s / samplesPerSegment;
      result.push(catmullRomPoint(p0, p1, p2, p3, t));
    }
  }

  return result;
}

/**
 * Rotate vector v around unit axis k by angle theta (Rodrigues' formula).
 */
function rotateAroundAxis(v: Vec3, k: Vec3, theta: number): Vec3 {
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const kDotV = dotVec3(k, v);
  const kCrossV = crossVec3(k, v);

  return [
    v[0] * cosT + kCrossV[0] * sinT + k[0] * kDotV * (1 - cosT),
    v[1] * cosT + kCrossV[1] * sinT + k[1] * kDotV * (1 - cosT),
    v[2] * cosT + kCrossV[2] * sinT + k[2] * kDotV * (1 - cosT),
  ];
}

/**
 * Computes parallel-transport (rotation-minimizing / Bishop) frames
 * along a polyline to completely prevent Frenet-frame flipping.
 */
export function computeParallelTransportFrames(
  points: readonly Vec3[],
  initialUp: Vec3 = [0, 1, 0],
): CurveFrame[] {
  const count = points.length;
  if (count < 2) {
    if (count === 1) {
      return [
        {
          origin: [...points[0]!],
          tangent: [0, 1, 0],
          normal: [1, 0, 0],
          binormal: [0, 0, 1],
        },
      ];
    }
    return [];
  }

  // 1. Compute tangents at every node
  const tangents: Vec3[] = new Array(count);
  for (let i = 0; i < count; i++) {
    let t: Vec3;
    if (i === 0) {
      t = subVec3(points[1]!, points[0]!);
    } else if (i === count - 1) {
      t = subVec3(points[count - 1]!, points[count - 2]!);
    } else {
      t = subVec3(points[i + 1]!, points[i - 1]!);
    }
    tangents[i] = normalizeVec3(t);
  }

  const frames: CurveFrame[] = new Array(count);

  // 2. Initial frame at index 0
  const t0 = tangents[0]!;
  let up = normalizeVec3(initialUp);
  if (Math.abs(dotVec3(t0, up)) > 0.99) {
    // Choose an alternate up vector if tangent is nearly aligned
    up = Math.abs(t0[0]) < 0.9 ? [1, 0, 0] : [0, 0, 1];
  }
  let n0 = normalizeVec3(crossVec3(up, t0));
  const b0 = normalizeVec3(crossVec3(t0, n0));
  n0 = normalizeVec3(crossVec3(b0, t0));

  frames[0] = {
    origin: [...points[0]!],
    tangent: t0,
    normal: n0,
    binormal: b0,
  };

  // 3. Parallel transport frames along the polyline
  for (let i = 1; i < count; i++) {
    const prevT = frames[i - 1]!.tangent;
    const currT = tangents[i]!;
    const prevN = frames[i - 1]!.normal;
    const prevB = frames[i - 1]!.binormal;

    const rotAxis = crossVec3(prevT, currT);
    const rotAxisLen = lengthVec3(rotAxis);

    let currN: Vec3;
    let currB: Vec3;

    if (rotAxisLen < 1e-6) {
      currN = prevN;
      currB = prevB;
    } else {
      const k = normalizeVec3(rotAxis);
      const dotVal = clamp(dotVec3(prevT, currT), -1, 1);
      const theta = Math.acos(dotVal);
      currN = rotateAroundAxis(prevN, k, theta);
      currB = rotateAroundAxis(prevB, k, theta);
    }

    // Re-orthogonalize using Gram-Schmidt to maintain pure orthonormality
    currN = subVec3(currN, scaleVec3(currT, dotVec3(currT, currN)));
    currN = normalizeVec3(currN);
    currB = normalizeVec3(crossVec3(currT, currN));

    frames[i] = {
      origin: [...points[i]!],
      tangent: currT,
      normal: currN,
      binormal: currB,
    };
  }

  return frames;
}

/**
 * Validates that a frame is orthonormal within a given tolerance.
 */
export function isFrameOrthonormal(frame: CurveFrame, eps = 1e-4): boolean {
  const { tangent: t, normal: n, binormal: b } = frame;

  // Length checks
  if (Math.abs(lengthVec3(t) - 1) > eps) return false;
  if (Math.abs(lengthVec3(n) - 1) > eps) return false;
  if (Math.abs(lengthVec3(b) - 1) > eps) return false;

  // Orthogonality checks
  if (Math.abs(dotVec3(t, n)) > eps) return false;
  if (Math.abs(dotVec3(n, b)) > eps) return false;
  if (Math.abs(dotVec3(t, b)) > eps) return false;

  // Right-handed orientation check: cross(t, n) === b
  const cross = crossVec3(t, n);
  if (Math.abs(dotVec3(cross, b) - 1) > eps) return false;

  return true;
}
