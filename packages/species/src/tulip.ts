import type { OrganShape, Species } from '@flower-grower/core';

export const TULIP_PETAL_SHAPE: OrganShape = {
  length: 1,
  widthProfile: [0.2, 0.55, 0.85, 1.0, 0.95, 0.75, 0.35, 0.0],
  tip: 'point',
  tipSharpness: 0.25,
  baseNarrow: 0.25,
  cupDepth: 0.42, // Deep goblet cup wrapping around center
  curlTip: 0.0,
  reflex: 0.0,
  ruffle: 0.0,
  ruffleFreq: 1.0,
  midribBend: 0.38, // Inward curving goblet profile
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
    'petal.length': { lo: 0.9, hi: 1.35 },
    'petal.width': { lo: 0.45, hi: 0.65 },
    'petal.cupDepth': { lo: 0.35, hi: 0.45 },
    'petal.curlTip': { lo: 0.0, hi: 0.0 },
    'petal.reflex': { lo: 0.0, hi: 0.0 },
    'petal.midribBend': { lo: 0.32, hi: 0.44 },
    'flower.whorlLayers': { lo: 2, hi: 2 }, // 3 inner + 3 outer
    'flower.whorlTilt': { lo: 1.15, hi: 1.28 },
    'flower.whorlRadius': { lo: 0.05, hi: 0.09 },
    'flower.floretCount': { lo: 0, hi: 0 }, // no disc florets
    'color.petal': {
      light: [0.55, 0.82],
      chroma: [0.18, 0.26],
      hue: [35, 65], // Golden yellow / orange
    },
  },
  petalShapes: [TULIP_PETAL_SHAPE],
};
