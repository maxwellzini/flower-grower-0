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
  yaw?: number;
}

export function whorls(options: WhorlOptions): WhorlPetalPlacement[] {
  const { count, layers = 1, sizeFalloff = 0.9, tilt = 0.35, radius = 0.1 } = options;

  const placements: WhorlPetalPlacement[] = [];

  if (layers <= 1) {
    for (let i = 0; i < count; i++) {
      const angle = (i * 2 * Math.PI) / count;
      const x = radius * Math.cos(angle);
      const z = radius * Math.sin(angle);
      placements.push({
        layer: 0,
        indexInLayer: i,
        totalIndex: i,
        angle,
        tilt,
        scale: 1.0,
        offset: [x, 0, z],
      });
    }
    return placements;
  }

  if (layers === 2) {
    const petalsPerLayer = Math.ceil(count / 2);
    let totalIndex = 0;
    for (let l = 0; l < 2; l++) {
      const layerScale = Math.pow(sizeFalloff, l);
      const layerRadius = radius * (1.0 - l * 0.18);
      const layerTilt = tilt + l * 0.08;
      const angleOffset = (l * Math.PI) / petalsPerLayer;

      for (let i = 0; i < petalsPerLayer && totalIndex < count; i++) {
        const angle = angleOffset + (i * 2 * Math.PI) / petalsPerLayer;
        const x = layerRadius * Math.cos(angle);
        const z = layerRadius * Math.sin(angle);
        const y = l * 0.015;

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

  // Multi-layer flowers (e.g. roses with 3-6 layers)
  // Outer layer has the most petals; inner layers have fewer petals forming the spiral core
  const weights: number[] = [];
  let totalWeight = 0;
  for (let l = 0; l < layers; l++) {
    const w = layers - l * 0.65;
    weights.push(w);
    totalWeight += w;
  }

  const countsPerLayer: number[] = [];
  let assigned = 0;
  for (let l = 0; l < layers; l++) {
    if (l === layers - 1) {
      countsPerLayer.push(Math.max(3, count - assigned));
    } else {
      const c = Math.max(3, Math.round((weights[l]! / totalWeight) * count));
      countsPerLayer.push(c);
      assigned += c;
    }
  }

  let totalIndex = 0;
  for (let l = 0; l < layers; l++) {
    const layerCount = countsPerLayer[l]!;
    const layerFrac = l / (layers - 1); // 0 at outer, 1 at innermost core
    const layerScale = Math.pow(sizeFalloff, l);
    const layerRadius = radius * (1.0 - layerFrac * 0.72);
    const layerTilt = tilt + (1.32 - tilt) * Math.pow(layerFrac, 0.75);
    const y = l * 0.016; // elevated convex receptacle dome
    const angleOffset = (l * 2.39996) % (2 * Math.PI); // golden angle ~137.5 deg stagger

    for (let i = 0; i < layerCount && totalIndex < count; i++) {
      const angle = angleOffset + (i * 2 * Math.PI) / layerCount;
      const x = layerRadius * Math.cos(angle);
      const z = layerRadius * Math.sin(angle);

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

export interface RoseSpiralOptions {
  count: number;
  radius?: number;
  tilt?: number;
  baseAngle?: number;
}

/**
 * Procedural spiral phyllotaxis arrangement for garden roses.
 * Petals emerge continuously along a golden angle spiral from a tight central
 * upright bud core to outer flared, reflexed guard petals, with tangential swirl yaw.
 */
export function roseSpiral(options: RoseSpiralOptions): WhorlPetalPlacement[] {
  const { count, radius = 0.11, tilt = 0.36, baseAngle = 0 } = options;

  const placements: WhorlPetalPlacement[] = [];
  const goldenAngle = 2.3999632; // ~137.507764 degrees
  const innerRadius = 0.018;
  const domeHeight = 0.038;

  for (let i = 0; i < count; i++) {
    const t = count > 1 ? i / (count - 1) : 0;
    const angle = baseAngle + i * goldenAngle;
    const r = innerRadius + (radius - innerRadius) * Math.pow(t, 0.65);
    const x = r * Math.cos(angle);
    const z = r * Math.sin(angle);
    const y = (1.0 - Math.pow(t, 0.85)) * domeHeight;

    const scale = 0.38 + 0.62 * Math.pow(t, 0.7);
    const petalTilt = 1.45 + (tilt - 1.45) * Math.pow(t, 0.82);
    const yaw = 0.72 * Math.pow(1.0 - t, 1.25);
    const layer = Math.min(4, Math.floor(t * 5));

    placements.push({
      layer,
      indexInLayer: i,
      totalIndex: i,
      angle,
      tilt: petalTilt,
      scale,
      offset: [x, y, z],
      yaw,
    });
  }

  return placements;
}

export interface RanunculusSpiralOptions {
  count: number;
  radius?: number;
  tilt?: number;
  baseAngle?: number;
}

/**
 * Procedural spiral phyllotaxis arrangement for Ranunculus (Persian Buttercups).
 * Produces a distinctive globular, incurved multi-layered blossom where 80-120
 * thin cupped petals pack tightly into an incurved sphere around a button center.
 */
export function ranunculusSpiral(
  options: RanunculusSpiralOptions,
): WhorlPetalPlacement[] {
  const { count, radius = 0.095, tilt = 1.12, baseAngle = 0 } = options;

  const placements: WhorlPetalPlacement[] = [];
  const goldenAngle = 2.3999632; // ~137.507764 degrees
  const innerRadius = 0.012;
  const domeHeight = 0.032;

  for (let i = 0; i < count; i++) {
    const t = count > 1 ? i / (count - 1) : 0;
    const angle = baseAngle + i * goldenAngle;
    const r = innerRadius + (radius - innerRadius) * Math.pow(t, 0.58);
    const x = r * Math.cos(angle);
    const z = r * Math.sin(angle);
    const y = (1.0 - Math.pow(t, 0.8)) * domeHeight;

    const scale = 0.28 + 0.72 * Math.pow(t, 0.65);
    const petalTilt = 1.45 + (tilt - 1.45) * Math.pow(t, 0.75);
    const yaw = 0.55 * Math.pow(1.0 - t, 1.4);
    const layer = Math.min(5, Math.floor(t * 6));

    placements.push({
      layer,
      indexInLayer: i,
      totalIndex: i,
      angle,
      tilt: petalTilt,
      scale,
      offset: [x, y, z],
      yaw,
    });
  }

  return placements;
}

export interface TulipWhorlOptions {
  radius?: number;
  tilt?: number;
  baseAngle?: number;
}

/**
 * Classical 3+3 trimerous alternating whorl for tulips.
 * 3 inner tepals form an erect chalice core; 3 outer tepals are shifted by 60 degrees
 * to clasp directly over the seams between the inner tepals.
 */
export function tulipWhorls(options: TulipWhorlOptions = {}): WhorlPetalPlacement[] {
  const { radius = 0.048, tilt = 1.32, baseAngle = 0 } = options;

  const placements: WhorlPetalPlacement[] = [];

  // Inner whorl: 3 tepals at 0, 120, 240 deg, slightly higher, snugger radius
  const innerRadius = radius * 0.86;
  const innerTilt = tilt + 0.05;
  const innerScale = 0.96;
  const innerY = 0.012;

  for (let i = 0; i < 3; i++) {
    const angle = baseAngle + (i * 2 * Math.PI) / 3;
    const x = innerRadius * Math.cos(angle);
    const z = innerRadius * Math.sin(angle);

    placements.push({
      layer: 1,
      indexInLayer: i,
      totalIndex: i,
      angle,
      tilt: innerTilt,
      scale: innerScale,
      offset: [x, innerY, z],
      yaw: 0.0,
    });
  }

  // Outer whorl: 3 tepals shifted by 60 deg, bridging the inner gaps
  const outerRadius = radius * 1.15;
  const outerTilt = tilt - 0.04;
  const outerScale = 1.04;
  const outerY = 0.0;

  for (let i = 0; i < 3; i++) {
    const angle = baseAngle + (i * 2 * Math.PI) / 3 + Math.PI / 3;
    const x = outerRadius * Math.cos(angle);
    const z = outerRadius * Math.sin(angle);

    placements.push({
      layer: 0,
      indexInLayer: i,
      totalIndex: 3 + i,
      angle,
      tilt: outerTilt,
      scale: outerScale,
      offset: [x, outerY, z],
      yaw: 0.0,
    });
  }

  return placements;
}

export type LeafArrangementType = 'alternate' | 'opposite' | 'spiral' | 'basal';

export interface LeafArrangementOptions {
  nodeCount: number;
  count: number;
  arrangement?: LeafArrangementType;
  startFrac?: number;
  endFrac?: number;
  tilt?: number;
  baseAngle?: number;
}

export interface StemLeafPlacement {
  index: number;
  nodeIndex: number;
  angle: number;
  tilt: number;
  scale: number;
}

/**
 * Calculates node attachments and spatial orientations for cauline leaves along a stem.
 */
export function leafArrangement(options: LeafArrangementOptions): StemLeafPlacement[] {
  const {
    nodeCount,
    count,
    arrangement = 'alternate',
    startFrac = 0.15,
    endFrac = 0.75,
    tilt = 0.65,
    baseAngle = 0.2,
  } = options;

  if (count <= 0 || nodeCount < 3) return [];

  const placements: StemLeafPlacement[] = [];
  const minNode = Math.max(1, Math.floor(nodeCount * startFrac));
  const maxNode = Math.min(nodeCount - 2, Math.floor(nodeCount * endFrac));
  const availableNodes = Math.max(1, maxNode - minNode);

  if (arrangement === 'basal') {
    const basalNodes = Math.min(count, Math.max(1, Math.floor(nodeCount * 0.35)));
    for (let i = 0; i < count; i++) {
      const frac = count > 1 ? i / (count - 1) : 0;
      const nodeIndex = minNode + Math.round(frac * basalNodes);
      const angle = baseAngle + i * 2.39996; // Golden angle ~137.5 deg
      const scale = 1.0 - frac * 0.25;
      const leafTilt = tilt + (1.0 - frac) * 0.18;

      placements.push({
        index: i,
        nodeIndex: Math.min(nodeCount - 2, nodeIndex),
        angle,
        tilt: leafTilt,
        scale,
      });
    }
    return placements;
  }

  if (arrangement === 'opposite') {
    const pairs = Math.ceil(count / 2);
    let total = 0;
    for (let p = 0; p < pairs && total < count; p++) {
      const frac = pairs > 1 ? p / (pairs - 1) : 0.5;
      const nodeIndex = Math.round(minNode + frac * availableNodes);
      const pairAngle = baseAngle + p * (Math.PI * 0.5);
      const scale = 1.0 - frac * 0.2;

      placements.push({
        index: total++,
        nodeIndex,
        angle: pairAngle,
        tilt,
        scale,
      });

      if (total < count) {
        placements.push({
          index: total++,
          nodeIndex,
          angle: pairAngle + Math.PI,
          tilt,
          scale,
        });
      }
    }
    return placements;
  }

  const angleStep = arrangement === 'alternate' ? Math.PI * 0.95 : 2.39996;
  for (let i = 0; i < count; i++) {
    const frac = count > 1 ? i / (count - 1) : 0.5;
    const nodeIndex = Math.round(minNode + frac * availableNodes);
    const angle = baseAngle + i * angleStep;
    const scale = 1.0 - frac * 0.25;
    const leafTilt = tilt + Math.sin(frac * Math.PI) * 0.15;

    placements.push({
      index: i,
      nodeIndex,
      angle,
      tilt: leafTilt,
      scale,
    });
  }

  return placements;
}

