import type { GrowthGuide, RNG, Stem, StemNode, Vec3 } from '../types.js';
import { createNoise3D } from '../noise.js';
import {
  addVec3,
  cleanZero,
  crossVec3,
  distanceVec3,
  dotVec3,
  lerp,
  normalizeVec3,
  scaleVec3,
  subVec3,
} from '../math.js';

export interface VineWalkerParams {
  helixRadius?: number; // Distance from guide centerline (world units)
  helixPitch?: number; // Polyline arc distance per 360-deg turn
  wFollow?: number; // Weight of tangent following
  wStick?: number; // Weight of pull towards the helical centerline
  wWander?: number; // Organic noise wander
  stepLength?: number; // Distance between consecutive nodes
  pBranch?: number; // Probability of branching at eligible nodes
  baseRadius?: number; // Stem radius at origin
  tipRadius?: number; // Stem radius at tip
  growSpeed?: number; // Growth speed in units/second
  maxVigor?: number; // Total length budget
}

interface PolylineSample {
  pos: Vec3;
  tangent: Vec3;
}

class PolylineTracker {
  readonly points: readonly Vec3[];
  readonly cumLengths: number[];
  readonly totalLength: number;

  constructor(points: readonly Vec3[]) {
    this.points = points.length >= 2 ? points : [[0, 0, 0], [0, 3.0, 0]];
    this.cumLengths = [0];
    let sum = 0;
    for (let i = 1; i < this.points.length; i++) {
      const segLen = distanceVec3(this.points[i - 1]!, this.points[i]!);
      sum += Math.max(0.0001, segLen);
      this.cumLengths.push(sum);
    }
    this.totalLength = Math.max(0.01, sum);
  }

  sample(s: number): PolylineSample {
    const clampedS = Math.max(0, Math.min(s, this.totalLength));
    // Find segment
    let segIdx = 0;
    for (let i = 1; i < this.cumLengths.length; i++) {
      if (this.cumLengths[i]! >= clampedS) {
        segIdx = i - 1;
        break;
      }
    }

    const s0 = this.cumLengths[segIdx]!;
    const s1 = this.cumLengths[segIdx + 1]!;
    const p0 = this.points[segIdx]!;
    const p1 = this.points[segIdx + 1]!;
    const t = s1 > s0 ? (clampedS - s0) / (s1 - s0) : 0;

    const pos: Vec3 = [
      lerp(p0[0], p1[0], t),
      lerp(p0[1], p1[1], t),
      lerp(p0[2], p1[2], t),
    ];

    const tangent = normalizeVec3(subVec3(p1, p0));
    return { pos, tangent };
  }
}

/**
 * Computes a smooth continuous orthonormal reference frame along a 3D tangent
 * avoiding gimbal discontinuities.
 */
function computeOrthonormalBasis(tangent: Vec3, prevNormal?: Vec3): { normal: Vec3; binormal: Vec3 } {
  let normal: Vec3;
  if (prevNormal) {
    // Project prevNormal onto the plane perpendicular to tangent (Bishop parallel transport)
    const projected = subVec3(prevNormal, scaleVec3(tangent, dotVec3(prevNormal, tangent)));
    const len = Math.hypot(projected[0], projected[1], projected[2]);
    if (len > 0.001) {
      normal = normalizeVec3(projected);
    } else {
      const upRef: Vec3 = Math.abs(tangent[1]) < 0.92 ? [0, 1, 0] : [1, 0, 0];
      normal = normalizeVec3(crossVec3(tangent, upRef));
    }
  } else {
    const upRef: Vec3 = Math.abs(tangent[1]) < 0.92 ? [0, 1, 0] : [1, 0, 0];
    normal = normalizeVec3(crossVec3(tangent, upRef));
  }

  const binormal = normalizeVec3(crossVec3(tangent, normal));
  return { normal, binormal };
}

export function vineWalker(
  guide: GrowthGuide | undefined,
  params: VineWalkerParams = {},
  rng: RNG,
): Stem[] {
  const helixRadius = params.helixRadius ?? 0.08;
  const helixPitch = Math.max(0.1, params.helixPitch ?? 0.45);
  const wFollow = params.wFollow ?? 0.85;
  const wStick = params.wStick ?? 0.45;
  const wWander = params.wWander ?? 0.08;
  const stepLength = Math.max(0.015, params.stepLength ?? 0.05);
  const pBranch = params.pBranch ?? 0.15;
  const baseRadius = params.baseRadius ?? 0.038;
  const tipRadius = params.tipRadius ?? 0.016;
  const growSpeed = params.growSpeed ?? 4.2;

  const paths = guide?.paths && guide.paths.length > 0 && guide.paths[0]!.length >= 2
    ? guide.paths
    : [[[0, 0, 0], [0, 1.2, 0], [0, 2.4, 0], [0, 3.2, 0]] as Vec3[]];

  const noise = createNoise3D(rng.fork('vineNoise'));
  const stems: Stem[] = [];
  let nextStemId = 0;

  for (let pIdx = 0; pIdx < paths.length; pIdx++) {
    const polyline = new PolylineTracker(paths[pIdx]!);
    const totalPathLength = polyline.totalLength;
    const initialVigor = Math.min(totalPathLength * 1.35, params.maxVigor ?? 5.5);

    const mainStemId = nextStemId++;
    const mainNodes: StemNode[] = [];
    const mainStem: Stem = {
      id: mainStemId,
      parent: null,
      parentNode: null,
      nodes: mainNodes,
      kind: 'vine',
    };
    stems.push(mainStem);

    let arcS = 0;
    let accumulatedDist = 0;
    let vigor = initialVigor;
    const initialPhase = rng.range(0, Math.PI * 2);

    let prevNormal: Vec3 | undefined;
    let currentPos: Vec3 | null = null;

    while (arcS <= totalPathLength && vigor > 0) {
      const sample = polyline.sample(arcS);
      const { normal, binormal } = computeOrthonormalBasis(sample.tangent, prevNormal);
      prevNormal = normal;

      // Helical angle around guide path
      const theta = (arcS / helixPitch) * Math.PI * 2 + initialPhase;
      const cosTh = Math.cos(theta);
      const sinTh = Math.sin(theta);

      // Helical offset vector perpendicular to the polyline tangent
      const radialVec = addVec3(scaleVec3(normal, cosTh), scaleVec3(binormal, sinTh));
      const targetHelicalPos = addVec3(sample.pos, scaleVec3(radialVec, helixRadius));

      // Organic wander perturbation
      const nx = noise(arcS * 1.5, 0.4, 0.2) * wWander;
      const ny = noise(0.2, arcS * 1.5, 0.6) * (wWander * 0.5);
      const nz = noise(0.5, 0.3, arcS * 1.5) * wWander;
      const targetPosWithNoise: Vec3 = [
        targetHelicalPos[0] + nx,
        targetHelicalPos[1] + ny,
        targetHelicalPos[2] + nz,
      ];

      if (currentPos === null) {
        currentPos = targetPosWithNoise;
      } else {
        // Steer heading: combination of tangent, pull to helical target, and organic noise
        const toTarget = subVec3(targetPosWithNoise, currentPos);
        const heading = normalizeVec3(
          addVec3(
            scaleVec3(sample.tangent, wFollow),
            scaleVec3(toTarget, wStick),
          ),
        );
        currentPos = addVec3(currentPos, scaleVec3(heading, stepLength));
      }

      const progress = Math.min(1.0, arcS / totalPathLength);
      const radius = lerp(baseRadius, tipRadius, progress);
      const birth = accumulatedDist / growSpeed;

      const nodeIndex = mainNodes.length;
      mainNodes.push({
        pos: [cleanZero(currentPos[0]), cleanZero(currentPos[1]), cleanZero(currentPos[2])],
        radius,
        birth,
      });

      // Branching logic: spawn lateral twining branch tendril
      if (
        nodeIndex > 4 &&
        nodeIndex < 80 &&
        nodeIndex % 6 === 0 &&
        vigor > 1.2 &&
        rng.next() < pBranch &&
        stems.length < 8
      ) {
        const branchStemId = nextStemId++;
        const branchNodes: StemNode[] = [];
        const branchStem: Stem = {
          id: branchStemId,
          parent: mainStemId,
          parentNode: nodeIndex,
          nodes: branchNodes,
          kind: 'tendril',
        };
        stems.push(branchStem);

        // Branch shoots outward and twines
        const branchPhase = theta + rng.range(0.8, 1.8);
        const branchLength = rng.range(0.4, 1.1);
        const branchSteps = Math.floor(branchLength / stepLength);
        let bPos: Vec3 = [...currentPos];
        let bDist = 0;

        for (let b = 0; b <= branchSteps; b++) {
          const bt = b / branchSteps;
          const bTheta = branchPhase + bt * Math.PI * 3;
          const bRad = helixRadius * (1.2 - bt * 0.5);
          const bRadialVec = addVec3(
            scaleVec3(normal, Math.cos(bTheta) * bRad),
            scaleVec3(binormal, Math.sin(bTheta) * bRad),
          );
          const bDir = normalizeVec3(addVec3(sample.tangent, bRadialVec));
          bPos = addVec3(bPos, scaleVec3(bDir, stepLength));
          bDist += stepLength;

          branchNodes.push({
            pos: [cleanZero(bPos[0]), cleanZero(bPos[1]), cleanZero(bPos[2])],
            radius: lerp(radius * 0.75, tipRadius * 0.6, bt),
            birth: birth + bDist / (growSpeed * 1.1),
          });
        }
      }

      accumulatedDist += stepLength;
      arcS += stepLength;
      vigor -= stepLength;
    }
  }

  return stems;
}
