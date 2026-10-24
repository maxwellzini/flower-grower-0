import type { OrganShape, Species } from '@flower-grower/core';
import { ROSE_LEAF_SHAPE } from '@flower-grower/core';

export const PEONY_PETAL_SHAPE: OrganShape = {
  length: 1,
  widthProfile: [0.22, 0.46, 0.72, 0.9, 0.98, 1.0, 1.0, 0.98, 0.95, 0.9],
  tip: 'round',
  tipSharpness: 0.1,
  baseNarrow: 0.35,
  cupDepth: 0.36,
  curlTip: 0.15,
  reflex: 0.28,
  ruffle: 0.055, // distinctively wavy, undulating crinkled margins
  ruffleFreq: 4.5,
  midribBend: 0.06,
  veinCount: 5,
  veinDepth: 0.015,
};

export const peony: Species = {
  id: 'peony',
  name: 'Peony',
  generator: 'straight',
  description:
    'Lush Paeonia lactiflora with voluminous, heavily ruffled double blooms in romantic blush, coral, and creamy peach tones.',
  ranges: {
    'stem.height': { lo: 1.6, hi: 2.3 },
    'stem.baseRadius': { lo: 0.048, hi: 0.068 },
    'stem.tipRadius': { lo: 0.03, hi: 0.042 },
    'stem.noiseAmp': { lo: 0.05, hi: 0.14 },
    'stem.growSpeed': { lo: 4.5, hi: 6.5 },
    'petal.count': { lo: 65, hi: 95 },
    'petal.length': { lo: 0.95, hi: 1.25 },
    'petal.width': { lo: 0.78, hi: 0.96 },
    'petal.cupDepth': { lo: 0.3, hi: 0.42 },
    'petal.curlTip': { lo: 0.12, hi: 0.22 },
    'petal.reflex': { lo: 0.24, hi: 0.38 },
    'petal.midribBend': { lo: 0.02, hi: 0.08 },
    'flower.whorlLayers': { lo: 6, hi: 7 },
    'flower.whorlTilt': { lo: 0.32, hi: 0.46 },
    'flower.whorlRadius': { lo: 0.1, hi: 0.15 },
    'flower.headScale': { lo: 1.0, hi: 1.25 },
    'flower.sepalCount': { lo: 5, hi: 5 },
    'flower.floretCount': { lo: 0, hi: 0 },
    'leaf.count': { lo: 4, hi: 6 },
    'leaf.length': { lo: 0.5, hi: 0.75 },
    'leaf.width': { lo: 0.28, hi: 0.4 },
    'leaf.tilt': { lo: 0.6, hi: 0.85 },
    'growth.petalGrowDur': { lo: 1.1, hi: 1.5 },
    'growth.petalOpenDur': { lo: 1.5, hi: 2.0 },
    'color.petal': {
      light: [0.72, 0.9],
      chroma: [0.06, 0.18],
      hue: [340, 24], // Romantic blush pink, soft coral, and peachy cream
    },
    'color.leaf': {
      light: [0.26, 0.38],
      chroma: [0.1, 0.18],
      hue: [125, 142],
    },
  },
  petalShapes: [PEONY_PETAL_SHAPE],
  leafShapes: [ROSE_LEAF_SHAPE],
};
