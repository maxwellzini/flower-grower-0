import type { OrganShape, Species } from '@flower-grower/core';
import { ROSE_LEAF_SHAPE } from '@flower-grower/core';

export const ROSE_PETAL_SHAPE: OrganShape = {
  length: 1,
  widthProfile: [0.18, 0.38, 0.62, 0.82, 0.95, 1.0, 1.0, 0.98, 0.94, 0.88],
  tip: 'notch', // authentic apical cleft/notch flanked by rounded lobes
  tipSharpness: 0.15,
  baseNarrow: 0.35,
  cupDepth: 0.38,
  curlTip: 0.25,
  reflex: 0.45,
  ruffle: 0.035,
  ruffleFreq: 3.5,
  midribBend: 0.04,
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
    'petal.count': { lo: 36, hi: 52 },
    'petal.length': { lo: 0.75, hi: 1.05 },
    'petal.width': { lo: 0.58, hi: 0.74 }, // realistic obcordate fan proportions
    'petal.cupDepth': { lo: 0.32, hi: 0.46 }, // deep spoon-shaped cradle
    'petal.curlTip': { lo: 0.25, hi: 0.42 },
    'petal.reflex': { lo: 0.36, hi: 0.52 }, // sculpted revolute margins
    'petal.midribBend': { lo: 0.0, hi: 0.04 },
    'flower.whorlLayers': { lo: 5, hi: 6 },
    'flower.whorlTilt': { lo: 0.22, hi: 0.36 },
    'flower.whorlRadius': { lo: 0.07, hi: 0.12 },
    'flower.headScale': { lo: 0.9, hi: 1.15 },
    'flower.sepalCount': { lo: 5, hi: 5 },
    'flower.floretCount': { lo: 0, hi: 0 }, // no disc florets in rose
    'leaf.count': { lo: 4, hi: 7 },
    'leaf.length': { lo: 0.45, hi: 0.7 },
    'leaf.width': { lo: 0.26, hi: 0.38 },
    'leaf.tilt': { lo: 0.55, hi: 0.8 },
    'growth.petalGrowDur': { lo: 1.0, hi: 1.4 },
    'growth.petalOpenDur': { lo: 1.4, hi: 1.9 },
    'color.petal': {
      light: [0.3, 0.56],
      chroma: [0.22, 0.34],
      hue: [350, 28], // From deep velvet ruby to fiery warm rose
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
