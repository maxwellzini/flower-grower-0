import type {
  GrowthGuide,
  Organ,
  OrganShape,
  Plant,
  PlantBounds,
  RNG,
  Vec3,
} from './types.js';
import { createRNG } from './rng.js';
import { straightStem } from './generators/straightStem.js';
import { phyllotaxis, whorls } from './organs/placement.js';
import { cleanZero, crossVec3, normalizeVec3 } from './math.js';

export const DAISY_PETAL_SHAPE: OrganShape = {
  length: 1,
  widthProfile: [0.15, 0.28, 0.5, 0.72, 0.88, 0.98, 1.0, 0.96, 0.88, 0.76],
  tip: 'round',
  tipSharpness: 0.15,
  baseNarrow: 0.35,
  cupDepth: 0.12,
  curlTip: 0.16,
  reflex: 0.06,
  ruffle: 0.025,
  ruffleFreq: 2.5,
  midribBend: 0.08,
  veinCount: 3,
  veinDepth: 0.015,
};

export const DAISY_LEAF_SHAPE: OrganShape = {
  length: 1,
  widthProfile: [0.08, 0.16, 0.28, 0.48, 0.72, 0.92, 1.0, 0.94, 0.72, 0.35, 0.0],
  tip: 'round',
  tipSharpness: 0.2,
  baseNarrow: 0.65,
  cupDepth: 0.14,
  curlTip: 0.18,
  reflex: 0.08,
  ruffle: 0.04,
  ruffleFreq: 4.0,
  midribBend: 0.28,
  veinCount: 5,
  veinDepth: 0.015,
};

export const ROSE_LEAF_SHAPE: OrganShape = {
  length: 1,
  widthProfile: [0.12, 0.35, 0.65, 0.88, 0.98, 1.0, 0.92, 0.78, 0.52, 0.22, 0.0],
  tip: 'point',
  tipSharpness: 0.55,
  baseNarrow: 0.45,
  cupDepth: 0.15,
  curlTip: 0.22,
  reflex: 0.12,
  ruffle: 0.035,
  ruffleFreq: 6.0,
  midribBend: 0.32,
  veinCount: 7,
  veinDepth: 0.02,
};

export const TULIP_LEAF_SHAPE: OrganShape = {
  length: 1,
  widthProfile: [0.25, 0.55, 0.82, 0.95, 1.0, 0.96, 0.88, 0.74, 0.52, 0.25, 0.0],
  tip: 'point',
  tipSharpness: 0.4,
  baseNarrow: 0.25,
  cupDepth: 0.38,
  curlTip: 0.05,
  reflex: 0.0,
  ruffle: 0.0,
  ruffleFreq: 1.0,
  midribBend: 0.45,
  veinCount: 9,
  veinDepth: 0.025,
};

export const CALYX_BRACT_SHAPE: OrganShape = {
  length: 1,
  widthProfile: [0.25, 0.65, 0.92, 1.0, 0.88, 0.62, 0.3, 0.0],
  tip: 'point',
  tipSharpness: 0.6,
  baseNarrow: 0.2,
  cupDepth: 0.22,
  curlTip: 0.15,
  reflex: 0.45,
  ruffle: 0.0,
  ruffleFreq: 0.0,
  midribBend: 0.1,
  veinCount: 1,
  veinDepth: 0.01,
};

export const ROSE_HIP_SHAPE: OrganShape = {
  length: 1,
  widthProfile: [0.4, 0.75, 0.95, 1.0, 0.95, 0.8, 0.55, 0.0],
  tip: 'round',
  tipSharpness: 0.1,
  baseNarrow: 0.3,
  cupDepth: 0.4,
  curlTip: 0.0,
  reflex: 0.0,
  ruffle: 0.0,
  ruffleFreq: 0.0,
  midribBend: 0.0,
  veinCount: 0,
  veinDepth: 0.0,
};

export const MORNING_GLORY_COROLLA_SHAPE: OrganShape = {
  length: 1,
  widthProfile: [0.18, 0.26, 0.4, 0.6, 0.82, 0.96, 1.0, 0.95, 0.85, 0.65],
  tip: 'round',
  tipSharpness: 0.2,
  baseNarrow: 0.82,
  cupDepth: 0.48,
  curlTip: 0.12,
  reflex: 0.18,
  ruffle: 0.05,
  ruffleFreq: 5.0,
  midribBend: 0.22,
  veinCount: 5,
  veinDepth: 0.02,
};

export const MORNING_GLORY_LEAF_SHAPE: OrganShape = {
  length: 1,
  widthProfile: [0.38, 0.72, 0.96, 1.0, 0.88, 0.72, 0.52, 0.28, 0.0],
  tip: 'point',
  tipSharpness: 0.5,
  baseNarrow: 0.12,
  cupDepth: 0.14,
  curlTip: 0.15,
  reflex: 0.06,
  ruffle: 0.03,
  ruffleFreq: 3.5,
  midribBend: 0.25,
  veinCount: 7,
  veinDepth: 0.015,
};

export const DAISY_CENTER_SHAPE: OrganShape = {
  length: 1,
  widthProfile: [0.5, 0.9, 1.0, 0.9, 0.5],
  tip: 'round',
  tipSharpness: 0.1,
  baseNarrow: 0.1,
  cupDepth: 0.2,
  curlTip: 0.0,
  reflex: 0.0,
  ruffle: 0.0,
  ruffleFreq: 0.0,
  midribBend: 0.0,
  veinCount: 0,
  veinDepth: 0.0,
};

export interface GrowDaisyOptions {
  seed?: number;
  guide?: GrowthGuide;
  height?: number;
  petalCount?: number;
}

export function growDaisy(options: GrowDaisyOptions = {}): Plant {
  const seed = options.seed ?? 42;
  const rng: RNG = createRNG(seed);
  const stemRng = rng.fork('stems');
  const flowerRng = rng.fork('flower');
  const petalRng = rng.fork('petals');

  const height = options.height ?? 2.2;
  const petalCount = options.petalCount ?? 21; // Fibonacci count

  // 1. Generate Stem
  const stems = straightStem(
    options.guide,
    {
      height,
      segments: 18,
      baseRadius: 0.04,
      tipRadius: 0.022,
      noiseAmp: 0.06,
      growSpeed: 1.4,
    },
    stemRng,
  );

  const mainStem = stems[0]!;
  const tipNodeIndex = mainStem.nodes.length - 1;
  const tipNode = mainStem.nodes[tipNodeIndex]!;
  const stemTipPos = tipNode.pos;
  const stemFinishTime = tipNode.birth; // seconds when tip is reached

  const organs: Organ[] = [];
  const shapes: OrganShape[] = [DAISY_PETAL_SHAPE, DAISY_CENTER_SHAPE];

  // 2. Generate Petals
  const petalPlacements = whorls({
    count: petalCount,
    layers: 2,
    sizeFalloff: 0.95,
    tilt: 0.25,
    radius: 0.08,
  });

  let organId = 0;

  for (const p of petalPlacements) {
    const angle = p.angle;
    const tilt = p.tilt;

    // Origin at the attachment ring
    const origin: Vec3 = [
      stemTipPos[0] + p.offset[0],
      stemTipPos[1] + p.offset[1],
      stemTipPos[2] + p.offset[2],
    ];

    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);
    const cosTilt = Math.cos(tilt);
    const sinTilt = Math.sin(tilt);

    // Orthonormal basis: length (tangent), surface normal (normal), circumferential width (binormal)
    const tangent: Vec3 = [
      cleanZero(cosAngle * cosTilt),
      cleanZero(sinTilt),
      cleanZero(sinAngle * cosTilt),
    ];
    const normal: Vec3 = [
      cleanZero(-cosAngle * sinTilt),
      cleanZero(cosTilt),
      cleanZero(-sinAngle * sinTilt),
    ];
    const binormal: Vec3 = [cleanZero(-sinAngle), 0, cleanZero(cosAngle)];

    // Stagger petal unfurl timings
    const stagger = petalRng.range(0.0, 0.15);
    const birth = stemFinishTime + stagger;
    const growDuration = 0.6;
    const openDuration = 0.8;

    organs.push({
      id: organId++,
      type: 'petal',
      stemId: mainStem.id,
      stemNode: tipNodeIndex,
      origin,
      tangent,
      normal,
      binormal,
      shape: 0, // DAISY_PETAL_SHAPE
      scale: 0.7 * p.scale,
      rotation: tilt,
      color: {
        light: 0.96,
        chroma: 0.03,
        hue: 75 + petalRng.range(-5, 5),
      },
      birth,
      growDuration,
      openDuration,
      openness0: 1.0,
      age: 0,
    });
  }

  // 3. Flower disc center florets via phyllotaxis
  const floretCount = 55;
  const centerPoints = phyllotaxis(floretCount, 0.022);

  for (const pt of centerPoints) {
    const origin: Vec3 = [
      stemTipPos[0] + pt.pos[0],
      stemTipPos[1] + 0.03 + Math.max(0, 0.04 - pt.radius * 0.4), // slight convex dome
      stemTipPos[2] + pt.pos[2],
    ];

    const angle = pt.angle;
    const tangent: Vec3 = [Math.cos(angle), 0.2, Math.sin(angle)];
    const normal: Vec3 = [0, 1, 0];
    const binormal = normalizeVec3(crossVec3(normal, tangent));

    const stagger = flowerRng.range(0.0, 0.25);
    const birth = stemFinishTime + 0.2 + stagger;

    organs.push({
      id: organId++,
      type: 'center',
      stemId: mainStem.id,
      stemNode: tipNodeIndex,
      origin,
      tangent,
      normal,
      binormal,
      shape: 1, // DAISY_CENTER_SHAPE
      scale: 0.05,
      rotation: 0,
      color: {
        light: 0.74 + flowerRng.range(-0.03, 0.03),
        chroma: 0.16 + flowerRng.range(-0.02, 0.02),
        hue: 82 + flowerRng.range(-3, 3),
      },
      birth,
      growDuration: 0.4,
      openDuration: 0.2,
      openness0: 0.5,
      age: 0,
    });
  }

  // Compute total duration until fully grown
  let maxEndTime = stemFinishTime;
  for (const o of organs) {
    const endTime = o.birth + o.growDuration + o.openDuration;
    if (endTime > maxEndTime) {
      maxEndTime = endTime;
    }
  }

  // Compute bounding box
  const bounds: PlantBounds = {
    min: [-0.8, 0, -0.8],
    max: [0.8, height + 0.5, 0.8],
  };

  return {
    seed,
    speciesId: 'daisy',
    generatorVersion: 1,
    stems,
    organs,
    shapes,
    duration: maxEndTime,
    bounds,
  };
}
