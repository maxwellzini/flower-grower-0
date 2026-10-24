import type { OrganShape, Species } from '@flower-grower/core';
import { ROSE_LEAF_SHAPE } from '@flower-grower/core';

export const RANUNCULUS_PETAL_SHAPE: OrganShape = {
  length: 1,
  widthProfile: [0.2, 0.52, 0.82, 0.96, 1.0, 1.0, 0.98, 0.92, 0.82, 0.64],
  tip: 'round',
  tipSharpness: 0.1,
  baseNarrow: 0.35,
  cupDepth: 0.5, // Deep incurved shell
  curlTip: 0.0,
  reflex: 0.0,
  ruffle: 0.015,
  ruffleFreq: 2.5,
  midribBend: 0.38, // Inward clasping rim
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
    'stem.height': { lo: 1.5, hi: 2.3 },
    'stem.baseRadius': { lo: 0.04, hi: 0.054 },
    'stem.tipRadius': { lo: 0.024, hi: 0.034 },
    'stem.noiseAmp': { lo: 0.04, hi: 0.12 },
    'stem.growSpeed': { lo: 4.5, hi: 6.5 },
    'petal.count': { lo: 80, hi: 120 },
    'petal.length': { lo: 0.65, hi: 0.88 },
    'petal.width': { lo: 0.72, hi: 0.88 }, // nearly circular spoon
    'petal.cupDepth': { lo: 0.44, hi: 0.56 }, // very deep bowl
    'petal.curlTip': { lo: 0.0, hi: 0.0 },
    'petal.reflex': { lo: 0.0, hi: 0.0 },
    'petal.midribBend': { lo: 0.32, hi: 0.44 },
    'flower.whorlLayers': { lo: 6, hi: 8 },
    'flower.whorlTilt': { lo: 1.08, hi: 1.2 }, // erect incurved spherical chalice
    'flower.whorlRadius': { lo: 0.08, hi: 0.11 },
    'flower.headScale': { lo: 0.9, hi: 1.15 },
    'flower.sepalCount': { lo: 5, hi: 5 },
    'flower.floretCount': { lo: 28, hi: 42 }, // prominent green button eye!
    'flower.centerDome': { lo: 0.018, hi: 0.028 },
    'leaf.count': { lo: 3, hi: 5 },
    'leaf.length': { lo: 0.45, hi: 0.68 },
    'leaf.width': { lo: 0.24, hi: 0.36 },
    'leaf.tilt': { lo: 0.6, hi: 0.85 },
    'growth.petalGrowDur': { lo: 1.0, hi: 1.4 },
    'growth.petalOpenDur': { lo: 1.4, hi: 1.9 },
    'color.petal': {
      light: [0.58, 0.84],
      chroma: [0.22, 0.36],
      hue: [28, 68], // Rich marigold, buttercup yellow, and warm tangerine orange
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
