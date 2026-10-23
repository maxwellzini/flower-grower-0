import type { GrowthGuide, RNG, Stem, StemNode, Vec3 } from '../types.js';
import { createNoise3D } from '../noise.js';
import { addVec3, distanceVec3, lerp, normalizeVec3, scaleVec3 } from '../math.js';

export interface StraightStemParams {
  height?: number;
  segments?: number;
  baseRadius?: number;
  tipRadius?: number;
  noiseAmp?: number;
  noiseFreq?: number;
  growSpeed?: number; // world units per second
  origin?: Vec3;
  direction?: Vec3;
}

export function straightStem(
  guide: GrowthGuide | undefined,
  params: StraightStemParams = {},
  rng: RNG,
): Stem[] {
  const height = params.height ?? 2.5;
  const segments = Math.max(4, params.segments ?? 16);
  const baseRadius = params.baseRadius ?? 0.045;
  const tipRadius = params.tipRadius ?? 0.025;
  const noiseAmp = params.noiseAmp ?? 0.08;
  const noiseFreq = params.noiseFreq ?? 0.8;
  const growSpeed = params.growSpeed ?? 5.5;

  let origin: Vec3 = params.origin ?? [0, 0, 0];
  let target: Vec3 = [0, height, 0];

  if (guide?.paths && guide.paths.length > 0 && guide.paths[0]!.length >= 2) {
    const path = guide.paths[0]!;
    origin = [...path[0]!];
    target = [...path[path.length - 1]!];
  }

  const dir = normalizeVec3([
    target[0] - origin[0],
    target[1] - origin[1],
    target[2] - origin[2],
  ]);
  const totalLength = distanceVec3(origin, target) || height;

  const noise = createNoise3D(rng.fork('stemNoise'));
  const nodes: StemNode[] = [];

  let accumulatedDist = 0;
  let prevPos = origin;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments; // 0..1
    const basePos = addVec3(origin, scaleVec3(dir, totalLength * t));

    // Apply gentle organic bend via 3D noise (zero at base to stay anchored)
    const factor = Math.sin(t * Math.PI * 0.85); // 0 at base, smooth max in middle-upper
    const nx = noise(t * noiseFreq, 0.5, 0.2) * noiseAmp * factor;
    const nz = noise(0.2, 0.5, t * noiseFreq) * noiseAmp * factor;

    const pos: Vec3 = [basePos[0] + nx, basePos[1], basePos[2] + nz];

    if (i > 0) {
      accumulatedDist += distanceVec3(prevPos, pos);
    }
    prevPos = pos;

    const birth = accumulatedDist / growSpeed;
    const radius = lerp(baseRadius, tipRadius, t);

    nodes.push({ pos, radius, birth });
  }

  const stem: Stem = {
    id: 0,
    parent: null,
    parentNode: null,
    nodes,
    kind: 'trunk',
  };

  return [stem];
}
