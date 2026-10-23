import type { OrganShape, Species } from '@flower-grower/core';

export const ROSE_PETAL_SHAPE: OrganShape = {
  length: 1,
  widthProfile: [0.25, 0.6, 0.9, 1.0, 0.98, 0.85, 0.5, 0.0],
  tip: 'round',
  tipSharpness: 0.15,
  baseNarrow: 0.35,
  cupDepth: 0.24,
  curlTip: 0.35,
  reflex: 0.26,
  ruffle: 0.03,
  ruffleFreq: 3.0,
  midribBend: -0.04,
  veinCount: 4,
  veinDepth: 0.015,
};

export const rose: Species = {
  id: 'rose',
  name: 'Rose',
  generator: 'straight',
  description:
    'Rosa garden hybrid with dense imbricated spiral whorls, reflexed petals, and velvety crimson tones.',
  ranges: {
    'stem.height': { lo: 1.6, hi: 2.4 },
    'stem.baseRadius': { lo: 0.045, hi: 0.065 },
    'stem.tipRadius': { lo: 0.025, hi: 0.035 },
    'petal.count': { lo: 32, hi: 52, bias: 'high' },
    'petal.length': { lo: 0.75, hi: 1.1 },
    'petal.width': { lo: 0.45, hi: 0.75 },
    'petal.cupDepth': { lo: 0.18, hi: 0.28 },
    'petal.curlTip': { lo: 0.25, hi: 0.45 },
    'petal.reflex': { lo: 0.2, hi: 0.35 },
    'petal.midribBend': { lo: -0.06, hi: -0.02 },
    'flower.whorlLayers': { lo: 4, hi: 6 },
    'flower.whorlTilt': { lo: 0.15, hi: 0.45 },
    'flower.whorlRadius': { lo: 0.06, hi: 0.14 },
    'flower.floretCount': { lo: 0, hi: 15 }, // minimal visible center, tightly wrapped
    'color.petal': {
      light: [0.42, 0.65],
      chroma: [0.18, 0.28],
      hue: [12, 28], // Crimson red
    },
  },
  petalShapes: [ROSE_PETAL_SHAPE],
};
