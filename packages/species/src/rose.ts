import type { OrganShape, Species } from '@flower-grower/core';
import { ROSE_LEAF_SHAPE } from '@flower-grower/core';

export const ROSE_PETAL_SHAPE: OrganShape = {
  length: 1,
  widthProfile: [0.24, 0.45, 0.68, 0.86, 0.96, 1.0, 1.0, 0.98, 0.96, 0.92],
  tip: 'notch', // authentic heart-shaped apical cleft flanked by two soft rounded lobes
  tipSharpness: 0.1,
  baseNarrow: 0.35,
  cupDepth: 0.32,
  curlTip: 0.18,
  reflex: 0.35,
  ruffle: 0.025,
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
    'Rosa garden hybrid with dense imbricated spiral whorls, revolute reflexed outer wings, velvety crimson tones, and compound serrated foliage.',
  ranges: {
    'stem.height': { lo: 1.5, hi: 2.4 },
    'stem.baseRadius': { lo: 0.042, hi: 0.06 },
    'stem.tipRadius': { lo: 0.026, hi: 0.035 },
    'stem.noiseAmp': { lo: 0.06, hi: 0.16 },
    'stem.growSpeed': { lo: 4.5, hi: 6.5 },
    'petal.count': { lo: 38, hi: 54 },
    'petal.length': { lo: 0.85, hi: 1.15 },
    'petal.width': { lo: 0.76, hi: 0.94 }, // authentic broad fan/obcordate proportions
    'petal.cupDepth': { lo: 0.28, hi: 0.38 }, // deep spoon-shaped cradle
    'petal.curlTip': { lo: 0.15, hi: 0.25 },
    'petal.reflex': { lo: 0.38, hi: 0.54 }, // sculpted revolute margins
    'petal.midribBend': { lo: 0.0, hi: 0.03 },
    'flower.whorlLayers': { lo: 5, hi: 6 },
    'flower.whorlTilt': { lo: 0.28, hi: 0.40 },
    'flower.whorlRadius': { lo: 0.09, hi: 0.13 },
    'flower.headScale': { lo: 0.95, hi: 1.15 },
    'flower.sepalCount': { lo: 5, hi: 5 },
    'flower.floretCount': { lo: 0, hi: 0 }, // no disc florets in rose
    'leaf.count': { lo: 4, hi: 7 },
    'leaf.length': { lo: 0.45, hi: 0.65 },
    'leaf.width': { lo: 0.26, hi: 0.38 },
    'leaf.tilt': { lo: 0.55, hi: 0.8 },
    'growth.petalGrowDur': { lo: 1.0, hi: 1.4 },
    'growth.petalOpenDur': { lo: 1.4, hi: 1.9 },
    'color.petal': {
      light: [0.26, 0.48],
      chroma: [0.26, 0.38],
      hue: [346, 18], // Deep velvety crimson to fiery scarlet
    },
    'color.leaf': {
      light: [0.28, 0.42],
      chroma: [0.1, 0.18],
      hue: [125, 145],
    },
  },
  petalShapes: [ROSE_PETAL_SHAPE],
  leafShapes: [ROSE_LEAF_SHAPE],
};
