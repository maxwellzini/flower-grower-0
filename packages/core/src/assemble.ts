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
  widthProfile: [0.15, 0.38, 0.68, 0.88, 1.0, 0.96, 0.82, 0.58, 0.25, 0.0],
  tip: 'round',
  tipSharpness: 0.25,
  baseNarrow: 0.22,
  cupDepth: 0.06,
  curlTip: 0.12,
  reflex: 0.05,
  ruffle: 0.02,
  ruffleFreq: 2.0,
  midribBend: 0.04,
  veinCount: 3,
  veinDepth: 0.01,
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
