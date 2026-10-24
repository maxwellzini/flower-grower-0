import type { OrganShape, Species } from '@flower-grower/core';

export const TULIP_PETAL_SHAPE: OrganShape = {
  length: 1,
  widthProfile: [0.22, 0.58, 0.86, 0.98, 1.0, 0.98, 0.92, 0.82, 0.52, 0.0],
  tip: 'round',
  tipSharpness: 0.15,
  baseNarrow: 0.22,
  cupDepth: 0.45, // Deep concave shell
  curlTip: 0.0,
  reflex: 0.0,
  ruffle: 0.0,
  ruffleFreq: 1.0,
  midribBend: 0.42, // Classic outward belly bow + inward rim clasp
  veinCount: 5,
  veinDepth: 0.02,
};

export const tulip: Species = {
  id: 'tulip',
  name: 'Tulip',
  generator: 'straight',
  description:
    'Tulipa gesneriana with an erect cupped goblet formed of 6 broad tepals in two whorls.',
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
    'growth.petalGrowDur': { lo: 1.0, hi: 1.4 },
    'growth.petalOpenDur': { lo: 1.3, hi: 1.8 },
    'color.petal': {
      light: [0.45, 0.78],
      chroma: [0.22, 0.35],
      hue: [18, 62], // Rich amber golden orange to fiery scarlet
    },
  },
  petalShapes: [TULIP_PETAL_SHAPE],
};
