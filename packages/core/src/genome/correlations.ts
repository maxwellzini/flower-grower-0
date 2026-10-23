import type { Genome } from './schema.js';
import { GENES } from './schema.js';
import { clamp } from '../math.js';

export type Correlation = (genome: Genome) => Genome;

/**
 * Standard botanical correlations ensuring natural proportions.
 */
export const defaultCorrelations: Correlation[] = [
  // 1. More petals -> narrower petals
  (genome: Genome): Genome => {
    const count = Number(genome['petal.count'] ?? 21);
    const baseWidth = Number(genome['petal.width'] ?? 0.28);
    // If petal count is high, scale width down so they overlap naturally
    const countFactor = Math.sqrt(21 / Math.max(5, count));
    const newWidth = clamp(
      baseWidth * countFactor,
      GENES['petal.width'].min,
      GENES['petal.width'].max,
    );
    return { ...genome, 'petal.width': newWidth };
  },

  // 2. Larger head -> thicker stem tip (peduncle)
  (genome: Genome): Genome => {
    const headScale = Number(genome['flower.headScale'] ?? 1.0);
    const tipRadius = Number(genome['stem.tipRadius'] ?? 0.022);
    const adjustedTip = clamp(
      tipRadius * Math.pow(headScale, 0.6),
      GENES['stem.tipRadius'].min,
      GENES['stem.tipRadius'].max,
    );
    return { ...genome, 'stem.tipRadius': adjustedTip };
  },

  // 3. Lower leaf count -> larger leaves
  (genome: Genome): Genome => {
    const leafCount = Number(genome['leaf.count'] ?? 6);
    const leafLength = Number(genome['leaf.length'] ?? 0.7);
    if (leafCount > 0 && leafCount <= 4) {
      const adjustedLength = clamp(
        leafLength * 1.3,
        GENES['leaf.length'].min,
        GENES['leaf.length'].max,
      );
      return { ...genome, 'leaf.length': adjustedLength };
    }
    return genome;
  },
];

export function applyCorrelations(
  genome: Genome,
  correlations: readonly Correlation[],
): Genome {
  let result = { ...genome };
  for (const fn of correlations) {
    result = fn(result);
  }
  return result;
}
