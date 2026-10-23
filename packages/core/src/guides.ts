import type { GrowthGuide, Region, Vec3 } from './types.js';

export function guideFromPolyline(path: Vec3[], up: Vec3 = [0, 1, 0]): GrowthGuide {
  return {
    paths: [path],
    up,
  };
}

export function defaultGuide(): GrowthGuide {
  return {
    paths: [
      [
        [0, 0, 0],
        [0, 2, 0],
      ],
    ],
    up: [0, 1, 0],
  };
}

export function guideFromBox(min: Vec3, max: Vec3, up: Vec3 = [0, 1, 0]): GrowthGuide {
  const region: Region = { kind: 'box', min, max };
  return {
    paths: [],
    region,
    up,
  };
}

export function guideFromSphere(
  center: Vec3,
  radius: number,
  up: Vec3 = [0, 1, 0],
): GrowthGuide {
  const region: Region = { kind: 'sphere', center, radius };
  return {
    paths: [],
    region,
    up,
  };
}
