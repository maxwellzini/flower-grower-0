import type {
  ColorGene,
  GrowthGuide,
  Organ,
  OrganShape,
  OrganTip,
  Plant,
  PlantBounds,
  RNG,
  Stem,
  StemNode,
  Vec3,
} from './types.js';
import { createRNG } from './rng.js';
import type { Genome } from './genome/schema.js';
import { sample, type Species } from './genome/operations.js';
import { straightStem } from './generators/straightStem.js';
import { vineWalker } from './generators/vineWalker.js';
import {
  leafArrangement,
  type LeafArrangementType,
  phyllotaxis,
  ranunculusSpiral,
  roseSpiral,
  tulipWhorls,
  whorls,
} from './organs/placement.js';
import { addVec3, cleanZero, crossVec3, normalizeVec3, scaleVec3 } from './math.js';

function computeStemFrameAtNode(
  nodes: readonly StemNode[],
  index: number,
): { dir: Vec3; perp1: Vec3; perp2: Vec3 } {
  const pPrev = index > 0 ? nodes[index - 1]!.pos : nodes[index]!.pos;
  const pNext = index < nodes.length - 1 ? nodes[index + 1]!.pos : nodes[index]!.pos;
  const dir = normalizeVec3([
    pNext[0] - pPrev[0],
    pNext[1] - pPrev[1],
    pNext[2] - pPrev[2],
  ]);

  const upRef: Vec3 = Math.abs(dir[1]) < 0.92 ? [0, 1, 0] : [1, 0, 0];
  const perp1 = normalizeVec3(crossVec3(dir, upRef));
  const perp2 = normalizeVec3(crossVec3(dir, perp1));
  return { dir, perp1, perp2 };
}

function assembleVine(params: {
  seed: number;
  species: Species;
  genome: Genome;
  stems: Stem[];
  shapes: OrganShape[];
  leafRng: RNG;
  flowerRng: RNG;
  petalRng: RNG;
}): Plant {
  const { seed, species, genome, stems, shapes, leafRng, flowerRng, petalRng } = params;
  const organs: Organ[] = [];
  let organId = 0;

  const leafColor = (genome['color.leaf'] as ColorGene | undefined) ?? {
    light: 0.38,
    chroma: 0.16,
    hue: 135,
  };
  const petalColor = (genome['color.petal'] as ColorGene | undefined) ?? {
    light: 0.55,
    chroma: 0.22,
    hue: 265,
  };
  const centerColor = (genome['color.center'] as ColorGene | undefined) ?? {
    light: 0.92,
    chroma: 0.12,
    hue: 95,
  };

  const leafLen = Number(genome['leaf.length'] ?? 0.45);
  const leafWid = Number(genome['leaf.width'] ?? 0.42);
  const petalLen = Number(genome['petal.length'] ?? 0.55);
  const petalWid = Number(genome['petal.width'] ?? 0.45);
  const headScale = Number(genome['flower.headScale'] ?? 1.0);
  const flowerDensity = Number(genome['vine.flowerDensity'] ?? 0.25);

  const minCoord: Vec3 = [Infinity, Infinity, Infinity];
  const maxCoord: Vec3 = [-Infinity, -Infinity, -Infinity];

  function updateBounds(pos: Vec3): void {
    minCoord[0] = Math.min(minCoord[0], pos[0]);
    minCoord[1] = Math.min(minCoord[1], pos[1]);
    minCoord[2] = Math.min(minCoord[2], pos[2]);
    maxCoord[0] = Math.max(maxCoord[0], pos[0]);
    maxCoord[1] = Math.max(maxCoord[1], pos[1]);
    maxCoord[2] = Math.max(maxCoord[2], pos[2]);
  }

  for (const stem of stems) {
    const isMain = stem.kind === 'vine';
    const stepInterval = isMain ? 3 : 2;

    for (let i = 2; i < stem.nodes.length - 1; i++) {
      const node = stem.nodes[i]!;
      updateBounds(node.pos);

      // Frame at node
      const { dir, perp1, perp2 } = computeStemFrameAtNode(stem.nodes, i);
      const angle = (i * 2.39996) % (Math.PI * 2);
      const outVec = normalizeVec3(
        addVec3(scaleVec3(perp1, Math.cos(angle)), scaleVec3(perp2, Math.sin(angle))),
      );

      // 1. Attach foliage (heart-shaped cordate leaves)
      if (i % stepInterval === 0) {
        const leafOrigin = addVec3(node.pos, scaleVec3(outVec, node.radius * 0.9));
        updateBounds(leafOrigin);

        const leafTangent = normalizeVec3(addVec3(outVec, scaleVec3(dir, 0.2)));
        const leafNormal = normalizeVec3(crossVec3(dir, outVec));
        const leafBinormal = crossVec3(leafTangent, leafNormal);

        const stagger = leafRng.range(0.0, 0.15);
        organs.push({
          id: organId++,
          type: 'leaf',
          stemId: stem.id,
          stemNode: i,
          origin: leafOrigin,
          tangent: leafTangent,
          normal: leafNormal,
          binormal: leafBinormal,
          shape: 1, // leaf shape
          scale: leafLen * leafRng.range(0.85, 1.15),
          rotation: angle,
          color: {
            light: leafColor.light + leafRng.range(-0.02, 0.02),
            chroma: leafColor.chroma,
            hue: leafColor.hue + leafRng.range(-3, 3),
          },
          birth: node.birth + 0.15 + stagger,
          growDuration: 0.5,
          openDuration: 0.4,
          openness0: 0.8,
          age: 0,
          width: leafWid,
        });
      }

      // 2. Attach trumpet flowers at eligible nodes along the vine
      const isFlowerNode = isMain
        ? (i >= 8 && i % 8 === 0 && flowerRng.next() < flowerDensity * 3.5)
        : (i === Math.floor(stem.nodes.length * 0.6) && flowerRng.next() < 0.6);

      if (isFlowerNode) {
        const flowerOrigin = addVec3(node.pos, scaleVec3(outVec, 0.1));
        const flowerDir = normalizeVec3(addVec3(outVec, [0, 0.4, 0]));
        const fUp: Vec3 = Math.abs(flowerDir[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
        const fNormal = normalizeVec3(crossVec3(flowerDir, fUp));
        const fBinormal = crossVec3(flowerDir, fNormal);

        const fStagger = flowerRng.range(0.0, 0.2);
        const fBirth = node.birth + 0.25 + fStagger;

        // Placements tailored to the climbing species
        const petalCount = Math.max(3, Math.round(Number(genome['petal.count'] ?? 5)));
        const whorlTilt = Number(genome['flower.whorlTilt'] ?? 0.38);

        let placements: { angle: number; tilt: number; scale: number }[] = [];
        if (species.id === 'rose' || species.id === 'peony') {
          placements = roseSpiral({
            count: petalCount,
            radius: 0.04 * headScale,
            tilt: whorlTilt,
            baseAngle: flowerRng.range(0, Math.PI * 2),
          });
        } else if (species.id === 'ranunculus') {
          placements = ranunculusSpiral({
            count: petalCount,
            radius: 0.04 * headScale,
            tilt: whorlTilt,
            baseAngle: flowerRng.range(0, Math.PI * 2),
          });
        } else if (species.id === 'tulip') {
          placements = tulipWhorls({
            radius: 0.04 * headScale,
            tilt: 1.3,
            baseAngle: flowerRng.range(0, Math.PI * 2),
          });
        } else if (species.id === 'daisy') {
          placements = whorls({
            count: petalCount,
            layers: 2,
            sizeFalloff: 0.92,
            tilt: 0.25,
            radius: 0.06 * headScale,
          });
        } else {
          // Morning glory or trumpet/funnel corolla lobes
          for (let k = 0; k < petalCount; k++) {
            placements.push({
              angle: (k * Math.PI * 2) / petalCount,
              tilt: whorlTilt,
              scale: 1.0,
            });
          }
        }

        for (const p of placements) {
          const lobeAngle = p.angle;
          const tilt = p.tilt;
          const cosA = Math.cos(lobeAngle);
          const sinA = Math.sin(lobeAngle);

          const radialDir = addVec3(scaleVec3(fNormal, cosA), scaleVec3(fBinormal, sinA));
          const cosTilt = Math.cos(tilt);
          const sinTilt = Math.sin(tilt);

          const lobeTangent = normalizeVec3(addVec3(scaleVec3(flowerDir, cosTilt), scaleVec3(radialDir, sinTilt)));
          const lobeNormal = normalizeVec3(crossVec3(radialDir, flowerDir));
          const lobeBinormal = crossVec3(lobeTangent, lobeNormal);

          organs.push({
            id: organId++,
            type: 'petal',
            stemId: stem.id,
            stemNode: i,
            origin: flowerOrigin,
            tangent: lobeTangent,
            normal: lobeNormal,
            binormal: lobeBinormal,
            shape: 0,
            scale: petalLen * headScale * (p.scale ?? 1.0),
            rotation: lobeAngle,
            color: {
              light: petalColor.light + petalRng.range(-0.02, 0.02),
              chroma: petalColor.chroma,
              hue: petalColor.hue + petalRng.range(-4, 4),
            },
            birth: fBirth,
            growDuration: 0.55,
            openDuration: 0.65,
            openness0: 1.0,
            age: 0,
            width: petalWid * headScale * (p.scale ?? 1.0),
          });
        }

        // Calyx sepals
        const sepalCount = Math.round(
          Number(genome['flower.sepalCount'] ?? (species.id === 'tulip' ? 0 : 5)),
        );
        for (let s = 0; s < sepalCount; s++) {
          const sepalAngle = (s * Math.PI * 2) / Math.max(1, sepalCount) + 0.35;
          const sRad = addVec3(scaleVec3(fNormal, Math.cos(sepalAngle)), scaleVec3(fBinormal, Math.sin(sepalAngle)));
          const sTangent = normalizeVec3(addVec3(scaleVec3(flowerDir, 0.7), scaleVec3(sRad, 0.3)));
          const sNormal = normalizeVec3(crossVec3(sRad, flowerDir));
          const sBinormal = crossVec3(sTangent, sNormal);

          organs.push({
            id: organId++,
            type: 'sepal',
            stemId: stem.id,
            stemNode: i,
            origin: flowerOrigin,
            tangent: sTangent,
            normal: sNormal,
            binormal: sBinormal,
            shape: 2, // sepal shape
            scale: petalLen * 0.38 * headScale,
            rotation: sepalAngle,
            color: { light: 0.32, chroma: 0.16, hue: 130 },
            birth: fBirth - 0.1,
            growDuration: 0.35,
            openDuration: 0.2,
            openness0: 0.2,
            age: 0,
          });
        }

        // Center / stamen throat
        const floretCount = Math.round(Number(genome['flower.floretCount'] ?? 0));
        if (floretCount > 0) {
          organs.push({
            id: organId++,
            type: 'center',
            stemId: stem.id,
            stemNode: i,
            origin: addVec3(flowerOrigin, scaleVec3(flowerDir, 0.05)),
            tangent: flowerDir,
            normal: fNormal,
            binormal: fBinormal,
            shape: 3,
            scale: 0.045 * headScale,
            rotation: 0,
            color: centerColor,
            birth: fBirth + 0.1,
            growDuration: 0.3,
            openDuration: 0.2,
            openness0: 0.5,
            age: 0,
          });
        }
      }
    }
  }

  let maxEndTime = 0;
  for (const o of organs) {
    const end = o.birth + o.growDuration + o.openDuration;
    if (end > maxEndTime) maxEndTime = end;
  }
  for (const s of stems) {
    const lastNode = s.nodes[s.nodes.length - 1];
    if (lastNode && lastNode.birth > maxEndTime) maxEndTime = lastNode.birth;
  }

  const bounds: PlantBounds = {
    min: [minCoord[0] - 0.5, Math.min(0, minCoord[1] - 0.2), minCoord[2] - 0.5],
    max: [maxCoord[0] + 0.5, maxCoord[1] + 0.5, maxCoord[2] + 0.5],
  };

  return {
    seed,
    speciesId: species.id,
    genome,
    generatorVersion: 1,
    stems,
    organs,
    shapes,
    duration: Math.max(1.0, maxEndTime),
    bounds,
  };
}

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
  const leafRng = rng.fork('leaves');

  // 2. Generate stems
  const stemHeight = Number(genome['stem.height'] ?? 2.2);
  const baseRadius = Number(genome['stem.baseRadius'] ?? 0.045);
  const tipRadius = Number(genome['stem.tipRadius'] ?? 0.022);
  const segments = Math.round(Number(genome['stem.segments'] ?? 18));
  const noiseAmp = Number(genome['stem.noiseAmp'] ?? 0.07);
  const growSpeed = Number(genome['stem.growSpeed'] ?? 5.5);

  const isVine = Boolean(
    (options.guide?.paths &&
      options.guide.paths.length > 0 &&
      options.guide.paths[0]!.length >= 2) ||
      options.species.generator === 'vine',
  );
  const stems = isVine
    ? vineWalker(
        options.guide,
        {
          helixRadius: Number(genome['vine.helixRadius'] ?? 0.08),
          helixPitch: Number(genome['vine.helixPitch'] ?? 0.48),
          wFollow: Number(genome['vine.wFollow'] ?? 0.85),
          wStick: Number(genome['vine.wStick'] ?? 0.45),
          wWander: Number(genome['vine.wWander'] ?? 0.08),
          stepLength: Number(genome['vine.stepLength'] ?? 0.06),
          pBranch: Number(genome['vine.pBranch'] ?? 0.15),
          baseRadius: Number(genome['stem.baseRadius'] ?? 0.035),
          tipRadius: Number(genome['stem.tipRadius'] ?? 0.016),
          growSpeed: Number(genome['stem.growSpeed'] ?? 4.5),
        },
        stemRng,
      )
    : straightStem(
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
  const basePetalShape: OrganShape = options.species.petalShapes[0] ?? {
    length: 1,
    widthProfile: [0.15, 0.28, 0.5, 0.72, 0.88, 0.98, 1.0, 0.96, 0.88, 0.76],
    tip: (genome['petal.tip'] as OrganTip | undefined) ?? 'round',
    tipSharpness: Number(genome['petal.tipSharpness'] ?? 0.15),
    baseNarrow: Number(genome['petal.baseNarrow'] ?? 0.3),
    cupDepth: Number(genome['petal.cupDepth'] ?? 0.12),
    curlTip: Number(genome['petal.curlTip'] ?? 0.15),
    reflex: Number(genome['petal.reflex'] ?? 0.05),
    ruffle: Number(genome['petal.ruffle'] ?? 0.02),
    ruffleFreq: 2.0,
    midribBend: Number(genome['petal.midribBend'] ?? 0.05),
    veinCount: 3,
    veinDepth: 0.01,
  };

  const shapes: OrganShape[] = [
    // Shape 0: Petal
    {
      ...basePetalShape,
      cupDepth: Number(genome['petal.cupDepth'] ?? basePetalShape.cupDepth),
      curlTip: Number(genome['petal.curlTip'] ?? basePetalShape.curlTip),
      reflex: Number(genome['petal.reflex'] ?? basePetalShape.reflex),
      midribBend: Number(genome['petal.midribBend'] ?? basePetalShape.midribBend),
    },
    // Shape 1: Leaf
    options.species.leafShapes?.[0] ?? {
      length: 1,
      widthProfile: [0.12, 0.35, 0.65, 0.88, 0.98, 1.0, 0.92, 0.78, 0.52, 0.22, 0.0],
      tip: 'point',
      tipSharpness: 0.5,
      baseNarrow: 0.45,
      cupDepth: 0.14,
      curlTip: 0.18,
      reflex: 0.08,
      ruffle: 0.035,
      ruffleFreq: 5.0,
      midribBend: 0.3,
      veinCount: 5,
      veinDepth: 0.02,
    },
    // Shape 2: Calyx Sepal / Involucre Bract
    {
      length: 1,
      widthProfile: [0.22, 0.6, 0.88, 1.0, 0.85, 0.58, 0.28, 0.0],
      tip: 'point',
      tipSharpness: 0.7,
      baseNarrow: 0.22,
      cupDepth: 0.22,
      curlTip: 0.18,
      reflex: 0.5,
      ruffle: 0.0,
      ruffleFreq: 0.0,
      midribBend: 0.12,
      veinCount: 1,
      veinDepth: 0.01,
    },
    // Shape 3: Center floret (disc)
    {
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
    },
    // Shape 4: Receptacle / Hypanthium cup
    {
      length: 1,
      widthProfile: [0.45, 0.8, 0.98, 1.0, 0.95, 0.75, 0.4, 0.0],
      tip: 'round',
      tipSharpness: 0.1,
      baseNarrow: 0.35,
      cupDepth: 0.45,
      curlTip: 0.0,
      reflex: 0.0,
      ruffle: 0.0,
      ruffleFreq: 0.0,
      midribBend: 0.0,
      veinCount: 0,
      veinDepth: 0.0,
    },
  ];

  if (isVine) {
    return assembleVine({
      seed,
      species: options.species,
      genome,
      stems,
      shapes,
      leafRng,
      flowerRng,
      petalRng,
    });
  }

  const petalShapeIdx = 0;
  const leafShapeIdx = 1;
  const sepalShapeIdx = 2;
  const centerShapeIdx = 3;
  const hipShapeIdx = 4;

  const organs: Organ[] = [];
  let organId = 0;

  // 3. Cauline Foliage / Stem Leaves
  const leafCount = Math.round(Number(genome['leaf.count'] ?? 0));
  if (leafCount > 0 && mainStem.nodes.length >= 4) {
    const leafLength = Number(genome['leaf.length'] ?? 0.7);
    const leafWidth = Number(genome['leaf.width'] ?? 0.35);
    const leafTilt = Number(genome['leaf.tilt'] ?? 0.65);
    const leafArrangementType =
      (genome['leaf.arrangement'] as LeafArrangementType | undefined) ??
      (options.species.id === 'tulip' || options.species.id === 'daisy' ? 'basal' : 'alternate');

    const leafColor = (genome['color.leaf'] as ColorGene | undefined) ?? {
      light: 0.38,
      chroma: 0.14,
      hue: 135,
    };

    const leafPlacements = leafArrangement({
      nodeCount: mainStem.nodes.length,
      count: leafCount,
      arrangement: leafArrangementType,
      startFrac: leafArrangementType === 'basal' ? 0.08 : 0.2,
      endFrac: leafArrangementType === 'basal' ? 0.38 : 0.75,
      tilt: leafTilt,
      baseAngle: leafRng.range(0, Math.PI * 2),
    });

    for (const lp of leafPlacements) {
      const node = mainStem.nodes[lp.nodeIndex]!;
      const frame = computeStemFrameAtNode(mainStem.nodes, lp.nodeIndex);

      const cosAngle = Math.cos(lp.angle);
      const sinAngle = Math.sin(lp.angle);
      const radial: Vec3 = [
        frame.perp1[0] * cosAngle + frame.perp2[0] * sinAngle,
        frame.perp1[1] * cosAngle + frame.perp2[1] * sinAngle,
        frame.perp1[2] * cosAngle + frame.perp2[2] * sinAngle,
      ];

      // Tangent points outward and tilts downward/upward
      const tilt = lp.tilt;
      const cosTilt = Math.cos(tilt);
      const sinTilt = Math.sin(tilt);

      const tangent: Vec3 = normalizeVec3([
        radial[0] * sinTilt + frame.dir[0] * cosTilt,
        radial[1] * sinTilt + frame.dir[1] * cosTilt,
        radial[2] * sinTilt + frame.dir[2] * cosTilt,
      ]);

      const normal: Vec3 = normalizeVec3([
        frame.dir[0] * sinTilt - radial[0] * cosTilt,
        frame.dir[1] * sinTilt - radial[1] * cosTilt,
        frame.dir[2] * sinTilt - radial[2] * cosTilt,
      ]);

      const binormal = normalizeVec3(crossVec3(normal, tangent));

      const origin: Vec3 = [
        node.pos[0] + radial[0] * node.radius * 0.95,
        node.pos[1] + radial[1] * node.radius * 0.95,
        node.pos[2] + radial[2] * node.radius * 0.95,
      ];

      const leafBirth = node.birth + 0.05 + leafRng.range(0.0, 0.1);
      const leafScale = leafLength * lp.scale;

      organs.push({
        id: organId++,
        type: 'leaf',
        stemId: mainStem.id,
        stemNode: lp.nodeIndex,
        origin,
        tangent,
        normal,
        binormal,
        shape: leafShapeIdx,
        scale: leafScale,
        rotation: lp.tilt,
        color: {
          light: leafColor.light + leafRng.range(-0.02, 0.02),
          chroma: leafColor.chroma + leafRng.range(-0.01, 0.01),
          hue: leafColor.hue + leafRng.range(-3, 3),
        },
        birth: leafBirth,
        growDuration: 1.2,
        openDuration: 0.8,
        openness0: 0.4,
        age: 1.0,
        width: leafWidth * lp.scale,
      });
    }
  }

  // 4. Botanical Receptacle & Calyx Attachment
  const sepalColor = (genome['color.stem'] as ColorGene | undefined) ?? {
    light: 0.38,
    chroma: 0.14,
    hue: 135,
  };

  const sepalCount = Math.round(Number(genome['flower.sepalCount'] ?? 0));
  const headScale = Number(genome['flower.headScale'] ?? 1.0);
  const petalLength = Number(genome['petal.length'] ?? 0.85);
  const petalGrowDur = Number(genome['growth.petalGrowDur'] ?? 1.1);
  const petalOpenDur = Number(genome['growth.petalOpenDur'] ?? 1.5);

  if (
    options.species.id === 'rose' ||
    options.species.id === 'peony' ||
    options.species.id === 'ranunculus'
  ) {
    // A. Swollen Hypanthium (rose hip) urn bridging stem neck to petals
    const hipCount = 5;
    for (let h = 0; h < hipCount; h++) {
      const angle = (h * 2 * Math.PI) / hipCount;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const origin: Vec3 = [
        stemTipPos[0] + cosA * 0.025 * headScale,
        stemTipPos[1] - 0.035 * headScale,
        stemTipPos[2] + sinA * 0.025 * headScale,
      ];
      const tangent: Vec3 = [cleanZero(cosA * 0.4), 0.9, cleanZero(sinA * 0.4)];
      const normal: Vec3 = [cleanZero(-cosA), 0.2, cleanZero(-sinA)];
      const binormal = normalizeVec3(crossVec3(normal, tangent));

      organs.push({
        id: organId++,
        type: 'sepal',
        stemId: mainStem.id,
        stemNode: tipNodeIndex,
        origin,
        tangent: normalizeVec3(tangent),
        normal: normalizeVec3(normal),
        binormal,
        shape: hipShapeIdx,
        scale: 0.14 * headScale,
        rotation: 0.1,
        color: {
          light: sepalColor.light * 0.9,
          chroma: sepalColor.chroma * 1.1,
          hue: sepalColor.hue - 5,
        },
        birth: stemFinishTime,
        growDuration: petalGrowDur * 0.6,
        openDuration: 0.1,
        openness0: 0.0,
        age: 1.0,
        width: 0.32,
      });
    }

    // B. Reflexed laciniate calyx sepals
    for (let i = 0; i < sepalCount; i++) {
      const angle = (i * 2 * Math.PI) / sepalCount + 0.18;
      const tilt = -0.42; // reflexed downward
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);
      const cosTilt = Math.cos(tilt);
      const sinTilt = Math.sin(tilt);

      const origin: Vec3 = [
        stemTipPos[0] + cosAngle * 0.04 * headScale,
        stemTipPos[1] - 0.02 * headScale,
        stemTipPos[2] + sinAngle * 0.04 * headScale,
      ];

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

      organs.push({
        id: organId++,
        type: 'sepal',
        stemId: mainStem.id,
        stemNode: tipNodeIndex,
        origin,
        tangent,
        normal,
        binormal,
        shape: sepalShapeIdx,
        scale: petalLength * 0.72 * headScale,
        rotation: tilt,
        color: sepalColor,
        birth: stemFinishTime,
        growDuration: petalGrowDur * 0.65,
        openDuration: petalOpenDur * 0.6,
        openness0: 0.7,
        age: 1.0,
        width: 0.28,
      });
    }
  } else if (sepalCount > 0) {
    // Daisy Involucre: ring of phyllary bracts supporting the flower disc
    const bractRadius = 0.065 * headScale;
    for (let i = 0; i < sepalCount; i++) {
      const angle = (i * 2 * Math.PI) / sepalCount;
      const tilt = -0.18; // cupping tightly beneath the head
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);
      const cosTilt = Math.cos(tilt);
      const sinTilt = Math.sin(tilt);

      const origin: Vec3 = [
        stemTipPos[0] + cosAngle * bractRadius,
        stemTipPos[1] - 0.012,
        stemTipPos[2] + sinAngle * bractRadius,
      ];

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

      organs.push({
        id: organId++,
        type: 'sepal',
        stemId: mainStem.id,
        stemNode: tipNodeIndex,
        origin,
        tangent,
        normal,
        binormal,
        shape: sepalShapeIdx,
        scale: petalLength * 0.35 * headScale,
        rotation: tilt,
        color: {
          light: sepalColor.light * 0.95,
          chroma: sepalColor.chroma * 1.1,
          hue: sepalColor.hue - 8,
        },
        birth: stemFinishTime,
        growDuration: petalGrowDur * 0.5,
        openDuration: 0.2,
        openness0: 0.2,
        age: 1.0,
        width: 0.35,
      });
    }
  }

  // 5. Flower Petals
  const petalCount = Math.round(Number(genome['petal.count'] ?? 21));
  const layers = Math.round(Number(genome['flower.whorlLayers'] ?? 2));
  const whorlTilt = Number(genome['flower.whorlTilt'] ?? 0.25);
  const whorlRadius = Number(genome['flower.whorlRadius'] ?? 0.08);
  const petalWidth = Number(genome['petal.width'] ?? 0.45);

  let petalPlacements;
  if (options.species.id === 'rose' || options.species.id === 'peony') {
    petalPlacements = roseSpiral({
      count: petalCount,
      radius: whorlRadius,
      tilt: whorlTilt,
      baseAngle: petalRng.range(0, Math.PI * 2),
    });
  } else if (options.species.id === 'ranunculus') {
    petalPlacements = ranunculusSpiral({
      count: petalCount,
      radius: whorlRadius,
      tilt: whorlTilt,
      baseAngle: petalRng.range(0, Math.PI * 2),
    });
  } else if (options.species.id === 'tulip') {
    petalPlacements = tulipWhorls({
      radius: whorlRadius,
      tilt: whorlTilt,
      baseAngle: petalRng.range(0, Math.PI * 2),
    });
  } else {
    petalPlacements = whorls({
      count: petalCount,
      layers,
      sizeFalloff: 0.92,
      tilt: whorlTilt,
      radius: whorlRadius,
    });
  }

  const petalColor = (genome['color.petal'] as ColorGene | undefined) ?? {
    light: 0.95,
    chroma: 0.03,
    hue: 75,
  };
  const staggerAmount = Number(genome['growth.stagger'] ?? 0.16);

  for (const p of petalPlacements) {
    const angle = p.angle;
    const tilt = p.tilt;
    const yaw = p.yaw ?? 0;

    const origin: Vec3 = [
      stemTipPos[0] + p.offset[0] * headScale,
      stemTipPos[1] + p.offset[1] * headScale,
      stemTipPos[2] + p.offset[2] * headScale,
    ];

    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);
    const cosYaw = Math.cos(yaw);
    const sinYaw = Math.sin(yaw);

    // Heading in XZ plane
    const hX = cosAngle * cosYaw - sinAngle * sinYaw;
    const hZ = sinAngle * cosYaw + cosAngle * sinYaw;

    // Transverse width in XZ plane (binormal)
    const wX = -cosAngle * sinYaw - sinAngle * cosYaw;
    const wZ = -sinAngle * sinYaw + cosAngle * cosYaw;

    const cosTilt = Math.cos(tilt);
    const sinTilt = Math.sin(tilt);

    const tangent: Vec3 = [
      cleanZero(hX * cosTilt),
      cleanZero(sinTilt),
      cleanZero(hZ * cosTilt),
    ];
    const normal: Vec3 = [
      cleanZero(-hX * sinTilt),
      cleanZero(cosTilt),
      cleanZero(-hZ * sinTilt),
    ];
    const binormal: Vec3 = [cleanZero(wX), 0, cleanZero(wZ)];

    const stagger = petalRng.range(0.0, staggerAmount);
    const birth = stemFinishTime + stagger + p.layer * 0.08;
    const layerFrac = layers > 1 ? p.layer / (layers - 1) : 0;
    const reflexFactor = Math.max(0.0, 1.0 - layerFrac * 1.35);

    organs.push({
      id: organId++,
      type: 'petal',
      stemId: mainStem.id,
      stemNode: tipNodeIndex,
      origin,
      tangent,
      normal,
      binormal,
      shape: petalShapeIdx,
      scale: petalLength * headScale * p.scale,
      rotation: tilt,
      color: {
        light: petalColor.light,
        chroma: petalColor.chroma,
        hue: petalColor.hue + petalRng.range(-3, 3),
      },
      birth,
      growDuration: petalGrowDur,
      openDuration: petalOpenDur,
      openness0: 1.0,
      age: reflexFactor,
      width: petalWidth * p.scale,
    });
  }

  // 6. Center Florets (disc)
  const floretCount = Math.round(Number(genome['flower.floretCount'] ?? 55));
  if (floretCount > 0) {
    const domeHeight = Number(genome['flower.centerDome'] ?? 0.04);
    const centerColor = (genome['color.center'] as ColorGene | undefined) ?? {
      light: 0.74,
      chroma: 0.16,
      hue: 82,
    };
    const floretRadiusScaling =
      options.species.id === 'ranunculus' ? 0.006 * headScale : 0.022 * headScale;
    const centerPoints = phyllotaxis(floretCount, floretRadiusScaling);

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
      const floretScale =
        options.species.id === 'ranunculus' ? 0.035 * headScale : 0.05 * headScale;

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
        scale: floretScale,
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

  // 7. Compute max duration and bounds
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
    genome,
    generatorVersion: 1,
    stems,
    organs,
    shapes,
    duration: maxEndTime,
    bounds,
  };
}
