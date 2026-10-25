import type { OrganShape, Species } from '@flower-grower/core';
import { ROSE_LEAF_SHAPE } from '@flower-grower/core';

export const PEONY_PETAL_SHAPE: OrganShape = {
  length: 1,
  widthProfile: [0.22, 0.46, 0.72, 0.9, 0.98, 1.0, 1.0, 0.98, 0.95, 0.9],
  tip: 'round',
  tipSharpness: 0.1,
  baseNarrow: 0.35,
  cupDepth: 0.12,
  curlTip: 0.15,
  reflex: 0.28,
  ruffle: 0.075, // heavily ruffled, fluttering crinkled margins
  ruffleFreq: 5.5,
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
    'stem.height': { lo: 1.5, hi: 2.1 },
    'stem.baseRadius': { lo: 0.055, hi: 0.072 },
    'stem.tipRadius': { lo: 0.034, hi: 0.046 },
    'stem.noiseAmp': { lo: 0.06, hi: 0.15 },
    'stem.growSpeed': { lo: 4.5, hi: 6.5 },
    'petal.count': { lo: 75, hi: 105 },
    'petal.length': { lo: 1.05, hi: 1.35 },
    'petal.width': { lo: 0.82, hi: 0.98 },
    'petal.cupDepth': { lo: 0.04, hi: 0.20 },
    'petal.curlTip': { lo: 0.12, hi: 0.22 },
    'petal.reflex': { lo: 0.26, hi: 0.40 },
    'petal.midribBend': { lo: 0.02, hi: 0.08 },
    'flower.whorlLayers': { lo: 6, hi: 7 },
    'flower.whorlTilt': { lo: 0.38, hi: 0.52 }, // wide open romantic double bowl
    'flower.whorlRadius': { lo: 0.11, hi: 0.16 },
    'flower.headScale': { lo: 1.35, hi: 1.65 }, // massive 1.5x scale distinct from rose
    'flower.sepalCount': { lo: 5, hi: 5 },
    'flower.floretCount': { lo: 0, hi: 0 },
    'leaf.count': { lo: 4, hi: 6 },
    'leaf.length': { lo: 0.55, hi: 0.8 },
    'leaf.width': { lo: 0.3, hi: 0.44 },
    'leaf.tilt': { lo: 0.6, hi: 0.85 },
    'growth.petalGrowDur': { lo: 1.1, hi: 1.5 },
    'growth.petalOpenDur': { lo: 1.5, hi: 2.0 },
    'color.petal': {
      light: [0.75, 0.92],
      chroma: [0.05, 0.15],
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
