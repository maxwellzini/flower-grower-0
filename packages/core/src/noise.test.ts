import { describe, expect, it } from 'vitest';
import { createRNG } from './rng.js';
import { createNoise3D } from './noise.js';

describe('3D Simplex Noise', () => {
  it('generates deterministic noise from a seeded RNG', () => {
    const rng1 = createRNG(777);
    const noise1 = createNoise3D(rng1);

    const rng2 = createRNG(777);
    const noise2 = createNoise3D(rng2);

    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) {
        for (let z = 0; z < 5; z++) {
          const val1 = noise1(x * 0.1, y * 0.1, z * 0.1);
          const val2 = noise2(x * 0.1, y * 0.1, z * 0.1);
          expect(val1).toBe(val2);
          expect(val1).toBeGreaterThanOrEqual(-1.5);
          expect(val1).toBeLessThanOrEqual(1.5);
        }
      }
    }
  });

  it('computes fractal Brownian motion (fbm)', () => {
    const rng = createRNG(101);
    const noise = createNoise3D(rng);

    const val = noise.fbm(1.2, 3.4, 5.6, 4);
    expect(Number.isFinite(val)).toBe(true);
  });
});
