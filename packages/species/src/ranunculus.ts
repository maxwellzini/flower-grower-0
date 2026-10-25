import type { OrganShape, Species } from '@flower-grower/core';
import { ROSE_LEAF_SHAPE } from '@flower-grower/core';

export const RANUNCULUS_PETAL_SHAPE: OrganShape = {
  length: 1,
  widthProfile: [0.2, 0.52, 0.82, 0.96, 1.0, 1.0, 0.98, 0.92, 0.82, 0.64],
  tip: 'round',
  tipSharpness: 0.1,
  baseNarrow: 0.35,
  cupDepth: 0.12,
  curlTip: 0.0,
  reflex: 0.0,
  ruffle: 0.015,
  ruffleFreq: 2.5,
  midribBend: 0.22,
  veinCount: 5,
  veinDepth: 0.015,
};

export const ranunculus: Species = {
  id: 'ranunculus',
  name: 'Ranunculus',
  generator: 'straight',
  description:
    'Ranunculus asiaticus (Persian Buttercup) with a magnificent spherical incurved flower head of 80-120 paper-thin petals around a green button center.',
  ranges: {
    'stem.height': { lo: 1.2, hi: 1.6 },
    'stem.baseRadius': { lo: 0.036, hi: 0.046 },
    'stem.tipRadius': { lo: 0.02, hi: 0.028 },
    'stem.noiseAmp': { lo: 0.05, hi: 0.12 },
    'stem.growSpeed': { lo: 4.5, hi: 6.5 },
    'petal.count': { lo: 90, hi: 125 },
    'petal.length': { lo: 0.58, hi: 0.78 },
    'petal.width': { lo: 0.72, hi: 0.88 }, // nearly circular spoon
    'petal.cupDepth': { lo: 0.05, hi: 0.22 },
    'petal.curlTip': { lo: 0.0, hi: 0.0 },
    'petal.reflex': { lo: 0.0, hi: 0.0 },
    'petal.midribBend': { lo: 0.16, hi: 0.28 },
    'flower.whorlLayers': { lo: 7, hi: 8 },
    'flower.whorlTilt': { lo: 1.12, hi: 1.24 }, // erect incurved spherical chalice
    'flower.whorlRadius': { lo: 0.075, hi: 0.10 },
    'flower.headScale': { lo: 0.85, hi: 1.05 }, // compact dense sphere
    'flower.sepalCount': { lo: 5, hi: 5 },
    'flower.floretCount': { lo: 30, hi: 45 }, // prominent green button eye!
    'flower.centerDome': { lo: 0.018, hi: 0.028 },
    'leaf.count': { lo: 3, hi: 5 },
    'leaf.length': { lo: 0.4, hi: 0.6 },
    'leaf.width': { lo: 0.22, hi: 0.32 },
    'leaf.tilt': { lo: 0.6, hi: 0.85 },
    'growth.petalGrowDur': { lo: 1.0, hi: 1.4 },
    'growth.petalOpenDur': { lo: 1.4, hi: 1.9 },
    'color.petal': {
      light: [0.64, 0.86],
      chroma: [0.28, 0.40],
      hue: [32, 65], // Brilliant buttercup gold and radiant tangerine
    },
    'color.center': {
      light: [0.32, 0.46],
      chroma: [0.12, 0.2],
      hue: [118, 136], // Olive green button eye
    },
    'color.leaf': {
      light: [0.28, 0.4],
      chroma: [0.08, 0.16],
      hue: [125, 142],
    },
  },
  petalShapes: [RANUNCULUS_PETAL_SHAPE],
  leafShapes: [ROSE_LEAF_SHAPE],
};
