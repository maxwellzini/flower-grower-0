import type { OrganShape, Species } from '@flower-grower/core';

export const TULIP_PETAL_SHAPE: OrganShape = {
  length: 1,
  widthProfile: [0.25, 0.65, 0.9, 1.0, 0.96, 0.88, 0.65, 0.35, 0.0],
  tip: 'round',
  tipSharpness: 0.15,
  baseNarrow: 0.28,
  cupDepth: 0.42, // Deep concave spoon cup
  curlTip: 0.0,
  reflex: 0.0,
  ruffle: 0.0,
  ruffleFreq: 1.0,
  midribBend: 0.38, // Outward belly bow + inward rim taper
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
    'stem.height': { lo: 1.8, hi: 2.8 },
    'stem.baseRadius': { lo: 0.04, hi: 0.06 },
    'stem.tipRadius': { lo: 0.022, hi: 0.032 },
    'petal.count': { lo: 6, hi: 6 }, // 6 tepals
    'petal.length': { lo: 1.1, hi: 1.45 },
    'petal.width': { lo: 0.65, hi: 0.85 },
    'petal.cupDepth': { lo: 0.36, hi: 0.48 },
    'petal.curlTip': { lo: 0.0, hi: 0.0 },
    'petal.reflex': { lo: 0.0, hi: 0.0 },
    'petal.midribBend': { lo: 0.32, hi: 0.42 },
    'flower.whorlLayers': { lo: 2, hi: 2 }, // 3 inner + 3 outer
    'flower.whorlTilt': { lo: 1.22, hi: 1.34 },
    'flower.whorlRadius': { lo: 0.12, hi: 0.16 },
    'flower.floretCount': { lo: 0, hi: 0 }, // no disc florets
    'color.petal': {
      light: [0.55, 0.78],
      chroma: [0.2, 0.28],
      hue: [30, 55], // Rich golden orange / scarlet
    },
  },
  petalShapes: [TULIP_PETAL_SHAPE],
};
