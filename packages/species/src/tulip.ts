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
    'stem.height': { lo: 1.8, hi: 2.6 },
    'stem.baseRadius': { lo: 0.04, hi: 0.055 },
    'stem.tipRadius': { lo: 0.025, hi: 0.035 },
    'stem.growSpeed': { lo: 4.5, hi: 6.5 },
    'petal.count': { lo: 6, hi: 6 }, // 6 tepals
    'petal.length': { lo: 1.15, hi: 1.45 },
    'petal.width': { lo: 1.05, hi: 1.3 }, // broad overlapping tepals sealing the goblet
    'petal.cupDepth': { lo: 0.4, hi: 0.5 },
    'petal.curlTip': { lo: 0.0, hi: 0.0 },
    'petal.reflex': { lo: 0.0, hi: 0.0 },
    'petal.midribBend': { lo: 0.38, hi: 0.46 },
    'flower.whorlLayers': { lo: 2, hi: 2 }, // 3 inner + 3 outer
    'flower.whorlTilt': { lo: 1.25, hi: 1.34 }, // erect goblet
    'flower.whorlRadius': { lo: 0.045, hi: 0.065 }, // snug attachment directly at stem neck
    'flower.headScale': { lo: 0.95, hi: 1.05 },
    'flower.sepalCount': { lo: 0, hi: 0 }, // no calyx on tulip
    'flower.floretCount': { lo: 0, hi: 0 }, // no disc florets
    'growth.petalGrowDur': { lo: 1.0, hi: 1.4 },
    'growth.petalOpenDur': { lo: 1.3, hi: 1.8 },
    'color.petal': {
      light: [0.55, 0.76],
      chroma: [0.22, 0.3],
      hue: [28, 55], // Rich golden orange / scarlet
    },
  },
  petalShapes: [TULIP_PETAL_SHAPE],
};
