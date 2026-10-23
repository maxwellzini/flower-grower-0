import type { OrganShape, Species } from '@flower-grower/core';

export const ROSE_PETAL_SHAPE: OrganShape = {
  length: 1,
  widthProfile: [0.2, 0.55, 0.85, 1.0, 0.98, 0.9, 0.7, 0.35, 0.0],
  tip: 'round',
  tipSharpness: 0.15,
  baseNarrow: 0.22,
  cupDepth: 0.28,
  curlTip: 0.35,
  reflex: 0.32,
  ruffle: 0.03,
  ruffleFreq: 3.0,
  midribBend: 0.02,
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
    'petal.count': { lo: 38, hi: 55, bias: 'high' },
    'petal.length': { lo: 0.8, hi: 1.15 },
    'petal.width': { lo: 0.65, hi: 0.95 },
    'petal.cupDepth': { lo: 0.22, hi: 0.32 },
    'petal.curlTip': { lo: 0.25, hi: 0.45 },
    'petal.reflex': { lo: 0.25, hi: 0.4 },
    'petal.midribBend': { lo: 0.0, hi: 0.05 },
    'flower.whorlLayers': { lo: 5, hi: 6 },
    'flower.whorlTilt': { lo: 0.22, hi: 0.35 },
    'flower.whorlRadius': { lo: 0.14, hi: 0.22 },
    'flower.floretCount': { lo: 0, hi: 0 }, // no disc florets in rose
    'color.petal': {
      light: [0.36, 0.52],
      chroma: [0.22, 0.32],
      hue: [10, 24], // Deep velvety crimson
    },
  },
  petalShapes: [ROSE_PETAL_SHAPE],
};
