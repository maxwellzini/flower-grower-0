import type { Vec3 } from '../types.js';
import { degToRad } from '../math.js';

export interface PhyllotaxisPoint {
  index: number;
  pos: Vec3;
  angle: number;
  radius: number;
}

export function phyllotaxis(
  count: number,
  scaling = 0.05,
  goldenAngleDeg = 137.507764,
): PhyllotaxisPoint[] {
  const points: PhyllotaxisPoint[] = [];
  const goldenAngleRad = degToRad(goldenAngleDeg);

  for (let i = 0; i < count; i++) {
    const angle = i * goldenAngleRad;
    const radius = scaling * Math.sqrt(i);
    const x = radius * Math.cos(angle);
    const z = radius * Math.sin(angle);
    points.push({
      index: i,
      pos: [x, 0, z],
      angle,
      radius,
    });
  }

  return points;
}

export interface WhorlOptions {
  count: number;
  layers?: number;
  sizeFalloff?: number;
  tilt?: number; // radians tilting upward/outward
  radius?: number;
}

export interface WhorlPetalPlacement {
  layer: number;
  indexInLayer: number;
  totalIndex: number;
  angle: number;
  tilt: number;
  scale: number;
  offset: Vec3;
}

export function whorls(options: WhorlOptions): WhorlPetalPlacement[] {
  const { count, layers = 1, sizeFalloff = 0.9, tilt = 0.35, radius = 0.1 } = options;

  const placements: WhorlPetalPlacement[] = [];
  const petalsPerLayer = Math.ceil(count / layers);

  let totalIndex = 0;
  for (let l = 0; l < layers; l++) {
    const layerScale = Math.pow(sizeFalloff, l);
    const layerRadius = radius * (1 - l * 0.15);
    const layerTilt = tilt + l * 0.1;
    // Stagger angle between layers for natural overlap
    const angleOffset = (l * Math.PI) / petalsPerLayer;

    for (let i = 0; i < petalsPerLayer && totalIndex < count; i++) {
      const angle = angleOffset + (i * 2 * Math.PI) / petalsPerLayer;
      const x = layerRadius * Math.cos(angle);
      const z = layerRadius * Math.sin(angle);
      const y = -l * 0.02;

      placements.push({
        layer: l,
        indexInLayer: i,
        totalIndex,
        angle,
        tilt: layerTilt,
        scale: layerScale,
        offset: [x, y, z],
      });
      totalIndex++;
    }
  }

  return placements;
}
