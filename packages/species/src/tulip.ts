import type { OrganShape, Species } from '@flower-grower/core';
import { TULIP_LEAF_SHAPE } from '@flower-grower/core';

export const TULIP_PETAL_SHAPE: OrganShape = {
  length: 1,
  widthProfile: [0.18, 0.52, 0.82, 0.96, 1.0, 0.98, 0.9, 0.76, 0.45, 0.0],
  tip: 'point',
  tipSharpness: 0.22,
  baseNarrow: 0.28,
  cupDepth: 0.52, // Deep concave shell
  curlTip: 0.0,
  reflex: 0.0,
  ruffle: 0.0,
  ruffleFreq: 1.0,
  midribBend: 0.48, // Classic outward belly bow + inward rim clasp
  veinCount: 5,
  veinDepth: 0.02,
};

export const tulip: Species = {
  id: 'tulip',
  name: 'Tulip',
  generator: 'straight',
  description:
    'Tulipa gesneriana with an erect cupped goblet formed of 6 broad tepals in two whorls and glaucous basal strap leaves.',
  ranges: {
    'stem.height': { lo: 1.6, hi: 2.8 },
    'stem.baseRadius': { lo: 0.04, hi: 0.055 },
    'stem.tipRadius': { lo: 0.025, hi: 0.035 },
    'stem.noiseAmp': { lo: 0.05, hi: 0.16 },
    'stem.growSpeed': { lo: 4.5, hi: 6.5 },
    'petal.count': { lo: 6, hi: 6 }, // 6 tepals
    'petal.length': { lo: 1.1, hi: 1.55 },
    'petal.width': { lo: 1.0, hi: 1.4 }, // broad overlapping tepals sealing the goblet
    'petal.cupDepth': { lo: 0.35, hi: 0.55 },
    'petal.curlTip': { lo: 0.0, hi: 0.0 },
    'petal.reflex': { lo: 0.0, hi: 0.0 },
    'petal.midribBend': { lo: 0.35, hi: 0.5 },
    'flower.whorlLayers': { lo: 2, hi: 2 }, // 3 inner + 3 outer
    'flower.whorlTilt': { lo: 1.2, hi: 1.36 }, // erect goblet
    'flower.whorlRadius': { lo: 0.04, hi: 0.07 }, // snug attachment directly at stem neck
    'flower.headScale': { lo: 0.88, hi: 1.25 },
    'flower.sepalCount': { lo: 0, hi: 0 }, // no calyx on tulip
    'flower.floretCount': { lo: 0, hi: 0 }, // no disc florets
    'leaf.count': { lo: 2, hi: 3 },
    'leaf.length': { lo: 1.2, hi: 1.8 },
    'leaf.width': { lo: 0.5, hi: 0.8 },
    'leaf.tilt': { lo: 0.45, hi: 0.75 },
    'growth.petalGrowDur': { lo: 1.0, hi: 1.4 },
    'growth.petalOpenDur': { lo: 1.3, hi: 1.8 },
    'color.petal': {
      light: [0.45, 0.78],
      chroma: [0.22, 0.35],
      hue: [18, 62], // Rich amber golden orange to fiery scarlet
    },
    'color.leaf': {
      light: [0.38, 0.52],
      chroma: [0.06, 0.14],
      hue: [135, 155], // Glaucous blue-green
    },
  },
  petalShapes: [TULIP_PETAL_SHAPE],
  leafShapes: [TULIP_LEAF_SHAPE],
};
