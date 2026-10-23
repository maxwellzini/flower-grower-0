import type { OrganShape, Species } from '@flower-grower/core';

export const ROSE_PETAL_SHAPE: OrganShape = {
  length: 1,
  widthProfile: [0.16, 0.52, 0.84, 0.98, 1.0, 0.98, 0.94, 0.82, 0.45, 0.0],
  tip: 'round',
  tipSharpness: 0.15,
  baseNarrow: 0.18,
  cupDepth: 0.32,
  curlTip: 0.35,
  reflex: 0.38,
  ruffle: 0.04,
  ruffleFreq: 3.0,
  midribBend: 0.02,
  veinCount: 5,
  veinDepth: 0.015,
};

export const rose: Species = {
  id: 'rose',
  name: 'Rose',
  generator: 'straight',
  description:
    'Rosa garden hybrid with dense imbricated spiral whorls, reflexed outer petals, and velvety crimson tones.',
  ranges: {
    'stem.height': { lo: 1.6, hi: 2.2 },
    'stem.baseRadius': { lo: 0.045, hi: 0.065 },
    'stem.tipRadius': { lo: 0.028, hi: 0.038 },
    'stem.growSpeed': { lo: 4.5, hi: 6.5 },
    'petal.count': { lo: 42, hi: 56, bias: 'high' },
    'petal.length': { lo: 0.9, hi: 1.2 },
    'petal.width': { lo: 0.85, hi: 1.15 },
    'petal.cupDepth': { lo: 0.28, hi: 0.38 },
    'petal.curlTip': { lo: 0.25, hi: 0.45 },
    'petal.reflex': { lo: 0.32, hi: 0.46 },
    'petal.midribBend': { lo: 0.0, hi: 0.04 },
    'flower.whorlLayers': { lo: 5, hi: 6 },
    'flower.whorlTilt': { lo: 0.22, hi: 0.35 },
    'flower.whorlRadius': { lo: 0.09, hi: 0.14 },
    'flower.headScale': { lo: 0.95, hi: 1.05 },
    'flower.sepalCount': { lo: 5, hi: 5 },
    'flower.floretCount': { lo: 0, hi: 0 }, // no disc florets in rose
    'growth.petalGrowDur': { lo: 1.0, hi: 1.4 },
    'growth.petalOpenDur': { lo: 1.4, hi: 1.9 },
    'color.petal': {
      light: [0.34, 0.48],
      chroma: [0.24, 0.32],
      hue: [10, 24], // Deep velvety crimson
    },
  },
  petalShapes: [ROSE_PETAL_SHAPE],
};
