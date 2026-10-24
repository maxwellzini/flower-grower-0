import type { Species } from '@flower-grower/core';
import {
  CALYX_BRACT_SHAPE,
  MORNING_GLORY_COROLLA_SHAPE,
  MORNING_GLORY_LEAF_SHAPE,
} from '@flower-grower/core';

export const morningGlory: Species = {
  id: 'morning-glory',
  name: 'Morning Glory',
  generator: 'vine',
  description:
    'Vigorous twining climbing vine (Ipomoea tricolor) with flared trumpet-shaped flowers in vibrant celestial blue and lush cordate leaves.',
  ranges: {
    'stem.height': { lo: 2.5, hi: 4.5 },
    'stem.baseRadius': { lo: 0.025, hi: 0.045 },
    'stem.tipRadius': { lo: 0.012, hi: 0.022 },
    'stem.noiseAmp': { lo: 0.04, hi: 0.12 },
    'stem.growSpeed': { lo: 3.5, hi: 5.5 },
    'vine.helixRadius': { lo: 0.05, hi: 0.16 },
    'vine.helixPitch': { lo: 0.35, hi: 0.65 },
    'vine.wFollow': { lo: 0.7, hi: 0.95 },
    'vine.wStick': { lo: 0.35, hi: 0.65 },
    'vine.wWander': { lo: 0.05, hi: 0.12 },
    'vine.stepLength': { lo: 0.04, hi: 0.08 },
    'vine.pBranch': { lo: 0.1, hi: 0.3 },
    'vine.flowerDensity': { lo: 0.15, hi: 0.35 },
    'petal.count': { lo: 5, hi: 5 }, // 5-lobed sympetalous trumpet corolla
    'petal.length': { lo: 0.45, hi: 0.75 },
    'petal.width': { lo: 0.35, hi: 0.55 },
    'petal.cupDepth': { lo: 0.35, hi: 0.55 },
    'petal.curlTip': { lo: 0.08, hi: 0.2 },
    'petal.reflex': { lo: 0.1, hi: 0.28 },
    'petal.midribBend': { lo: 0.15, hi: 0.32 },
    'flower.headScale': { lo: 0.85, hi: 1.25 },
    'flower.floretCount': { lo: 5, hi: 5 }, // Stamen throat centers
    'flower.centerDome': { lo: 0.02, hi: 0.04 },
    'flower.sepalCount': { lo: 5, hi: 5 },
    'leaf.count': { lo: 12, hi: 28 },
    'leaf.length': { lo: 0.35, hi: 0.65 },
    'leaf.width': { lo: 0.32, hi: 0.58 },
    'leaf.tilt': { lo: 0.4, hi: 0.8 },
    'color.petal': {
      light: [0.45, 0.65],
      chroma: [0.18, 0.28],
      hue: [245, 295], // Celestial blue to vibrant violet-blue
    },
    'color.center': {
      light: [0.88, 0.98],
      chroma: [0.08, 0.16],
      hue: [80, 105], // Luminous creamy-yellow throat
    },
    'color.leaf': {
      light: [0.35, 0.46],
      chroma: [0.14, 0.22],
      hue: [130, 146], // Deep rich vine foliage green
    },
  },
  petalShapes: [MORNING_GLORY_COROLLA_SHAPE],
  leafShapes: [MORNING_GLORY_LEAF_SHAPE, CALYX_BRACT_SHAPE],
};
