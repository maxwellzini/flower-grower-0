import type {
  ColorGene,
  GrowthGuide,
  Organ,
  OrganShape,
  OrganTip,
  Plant,
  PlantBounds,
  RNG,
  Vec3,
} from './types.js';
import { createRNG } from './rng.js';
import type { Genome } from './genome/schema.js';
import { sample, type Species } from './genome/operations.js';
import { straightStem } from './generators/straightStem.js';
import { phyllotaxis, whorls } from './organs/placement.js';
import { crossVec3, normalizeVec3 } from './math.js';

export interface GrowPlantOptions {
  species: Species;
  seed?: number;
  guide?: GrowthGuide;
  overrides?: Partial<Genome>;
}

export function growPlant(options: GrowPlantOptions): Plant {
  const seed = options.seed ?? 42;
  const rng: RNG = createRNG(seed);

  // 1. Sample genome from species
  const genomeRng = rng.fork('genome');
  const genome = sample(options.species, genomeRng);

  // Apply manual overrides if provided
  if (options.overrides) {
    for (const [k, v] of Object.entries(options.overrides)) {
      if (v !== undefined) {
        genome[k] = v;
      }
    }
  }

  const stemRng = rng.fork('stems');
  const flowerRng = rng.fork('flower');
  const petalRng = rng.fork('petals');

  // 2. Generate stems
  const stemHeight = Number(genome['stem.height'] ?? 2.2);
  const baseRadius = Number(genome['stem.baseRadius'] ?? 0.045);
  const tipRadius = Number(genome['stem.tipRadius'] ?? 0.022);
  const segments = Math.round(Number(genome['stem.segments'] ?? 18));
  const noiseAmp = Number(genome['stem.noiseAmp'] ?? 0.07);
  const growSpeed = Number(genome['stem.growSpeed'] ?? 1.5);

  const stems = straightStem(
    options.guide,
    {
      height: stemHeight,
      segments,
      baseRadius,
      tipRadius,
      noiseAmp,
      growSpeed,
    },
    stemRng,
  );

  const mainStem = stems[0]!;
  const tipNodeIndex = mainStem.nodes.length - 1;
  const tipNode = mainStem.nodes[tipNodeIndex]!;
  const stemTipPos = tipNode.pos;
  const stemFinishTime = tipNode.birth;

  // Shapes registry
  const shapes: OrganShape[] = [...options.species.petalShapes];
  if (shapes.length === 0) {
    // Default shape if none provided
    shapes.push({
      length: 1,
      widthProfile: [0.2, 0.5, 0.8, 1.0, 0.9, 0.6, 0.2, 0.0],
      tip: (genome['petal.tip'] as OrganTip | undefined) ?? 'round',
      tipSharpness: Number(genome['petal.tipSharpness'] ?? 0.3),
      baseNarrow: Number(genome['petal.baseNarrow'] ?? 0.2),
      cupDepth: Number(genome['petal.cupDepth'] ?? 0.08),
      curlTip: Number(genome['petal.curlTip'] ?? 0.15),
      reflex: Number(genome['petal.reflex'] ?? 0.05),
      ruffle: Number(genome['petal.ruffle'] ?? 0.02),
      ruffleFreq: 2.0,
      midribBend: 0.05,
      veinCount: 3,
      veinDepth: 0.01,
    });
  }

  const organs: Organ[] = [];
  let organId = 0;

  // 3. Flower Petals
  const petalCount = Math.round(Number(genome['petal.count'] ?? 21));
  const layers = Math.round(Number(genome['flower.whorlLayers'] ?? 2));
  const whorlTilt = Number(genome['flower.whorlTilt'] ?? 0.25);
  const whorlRadius = Number(genome['flower.whorlRadius'] ?? 0.08);
  const headScale = Number(genome['flower.headScale'] ?? 1.0);
  const petalLength = Number(genome['petal.length'] ?? 0.85);

  const petalPlacements = whorls({
    count: petalCount,
    layers,
    sizeFalloff: 0.92,
    tilt: whorlTilt,
    radius: whorlRadius,
  });

  const petalColor = (genome['color.petal'] as ColorGene | undefined) ?? {
    light: 0.95,
    chroma: 0.03,
    hue: 75,
  };
  const staggerAmount = Number(genome['growth.stagger'] ?? 0.12);
  const petalGrowDur = Number(genome['growth.petalGrowDur'] ?? 0.6);
  const petalOpenDur = Number(genome['growth.petalOpenDur'] ?? 0.8);

  for (const p of petalPlacements) {
    const angle = p.angle;
    const tilt = p.tilt;

    const origin: Vec3 = [
      stemTipPos[0] + p.offset[0] * headScale,
      stemTipPos[1] + p.offset[1] * headScale,
      stemTipPos[2] + p.offset[2] * headScale,
    ];

    const tangent = normalizeVec3([
      Math.cos(angle) * Math.cos(tilt),
      Math.sin(tilt),
      Math.sin(angle) * Math.cos(tilt),
    ]);

    const initialUp: Vec3 = [0, 1, 0];
    const binormal = normalizeVec3(crossVec3(initialUp, tangent));
    const normal = normalizeVec3(crossVec3(tangent, binormal));

    const stagger = petalRng.range(0.0, staggerAmount);
    const birth = stemFinishTime + stagger + p.layer * 0.08;

    organs.push({
      id: organId++,
      type: 'petal',
      stemId: mainStem.id,
      stemNode: tipNodeIndex,
      origin,
      tangent,
      normal,
      binormal,
      shape: 0,
      scale: petalLength * headScale * p.scale,
      rotation: 0,
      color: {
        light: petalColor.light,
        chroma: petalColor.chroma,
        hue: petalColor.hue + petalRng.range(-3, 3),
      },
      birth,
      growDuration: petalGrowDur,
      openDuration: petalOpenDur,
      openness0: 1.0,
      age: 0,
    });
  }

  // 4. Center Florets (disc)
  const floretCount = Math.round(Number(genome['flower.floretCount'] ?? 55));
  if (floretCount > 0) {
    const domeHeight = Number(genome['flower.centerDome'] ?? 0.04);
    const centerColor = (genome['color.center'] as ColorGene | undefined) ?? {
      light: 0.74,
      chroma: 0.16,
      hue: 82,
    };
    const centerPoints = phyllotaxis(floretCount, 0.022 * headScale);

    // Center floret shape
    shapes.push({
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
    });
    const centerShapeIdx = shapes.length - 1;

    for (const pt of centerPoints) {
      const origin: Vec3 = [
        stemTipPos[0] + pt.pos[0],
        stemTipPos[1] + 0.02 + Math.max(0, domeHeight - pt.radius * 0.3),
        stemTipPos[2] + pt.pos[2],
      ];

      const angle = pt.angle;
      const tangent: Vec3 = [Math.cos(angle), 0.2, Math.sin(angle)];
      const normal: Vec3 = [0, 1, 0];
      const binormal = normalizeVec3(crossVec3(normal, tangent));

      const birth = stemFinishTime + 0.15 + flowerRng.range(0.0, 0.2);

      organs.push({
        id: organId++,
        type: 'center',
        stemId: mainStem.id,
        stemNode: tipNodeIndex,
        origin,
        tangent,
        normal,
        binormal,
        shape: centerShapeIdx,
        scale: 0.05 * headScale,
        rotation: 0,
        color: {
          light: centerColor.light + flowerRng.range(-0.02, 0.02),
          chroma: centerColor.chroma + flowerRng.range(-0.01, 0.01),
          hue: centerColor.hue + flowerRng.range(-2, 2),
        },
        birth,
        growDuration: 0.35,
        openDuration: 0.2,
        openness0: 0.5,
        age: 0,
      });
    }
  }

  // 5. Compute max duration
  let maxEndTime = stemFinishTime;
  for (const o of organs) {
    const end = o.birth + o.growDuration + o.openDuration;
    if (end > maxEndTime) maxEndTime = end;
  }

  const bounds: PlantBounds = {
    min: [-1.2 * headScale, 0, -1.2 * headScale],
    max: [1.2 * headScale, stemHeight + 0.6 * headScale, 1.2 * headScale],
  };

  return {
    seed,
    speciesId: options.species.id,
    generatorVersion: 1,
    stems,
    organs,
    shapes,
    duration: maxEndTime,
    bounds,
  };
}
