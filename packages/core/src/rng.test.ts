import { describe, expect, it } from 'vitest';
import { createRNG } from './rng.js';

describe('RNG determinism and fork independence', () => {
  it('produces identical sequences for the same seed', () => {
    const rng1 = createRNG(12345);
    const rng2 = createRNG(12345);

    const seq1 = Array.from({ length: 50 }, () => rng1.next());
    const seq2 = Array.from({ length: 50 }, () => rng2.next());

    expect(seq1).toEqual(seq2);
  });

  it('produces different sequences for different seeds', () => {
    const rng1 = createRNG(12345);
    const rng2 = createRNG(67890);

    const seq1 = Array.from({ length: 10 }, () => rng1.next());
    const seq2 = Array.from({ length: 10 }, () => rng2.next());

    expect(seq1).not.toEqual(seq2);
  });

  it('provides range, int, pick, and gaussian operations within expected bounds', () => {
    const rng = createRNG(42);

    for (let i = 0; i < 100; i++) {
      const r = rng.range(5, 15);
      expect(r).toBeGreaterThanOrEqual(5);
      expect(r).toBeLessThan(15);

      const n = rng.int(1, 6);
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(6);
      expect(Number.isInteger(n)).toBe(true);
    }

    const arr = ['rose', 'daisy', 'tulip', 'sunflower'] as const;
    const picked = rng.pick(arr);
    expect(arr).toContain(picked);

    const samples = Array.from({ length: 1000 }, () => rng.gaussian(10, 2));
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    expect(mean).toBeGreaterThan(9.5);
    expect(mean).toBeLessThan(10.5);
  });

  it('guarantees fork independence so random calls in one fork do not alter another fork', () => {
    // Sequence A: forks stems, generates 10 stem values; then forks petals, generates 10 petal values
    const rootA = createRNG(999);
    const stemsA = rootA.fork('stems');
    const petalsA = rootA.fork('petals');

    const stemsSeqA = Array.from({ length: 10 }, () => stemsA.next());
    const petalsSeqA = Array.from({ length: 10 }, () => petalsA.next());

    // Sequence B: does additional extra calls on stemsB, but petalsB must yield the exact same sequence!
    const rootB = createRNG(999);
    const stemsB = rootB.fork('stems');
    const petalsB = rootB.fork('petals');

    // Extra random calls on stemsB
    for (let i = 0; i < 50; i++) {
      stemsB.next();
    }

    const petalsSeqB = Array.from({ length: 10 }, () => petalsB.next());

    expect(petalsSeqA).toEqual(petalsSeqB);
    expect(stemsSeqA.length).toBe(10);
  });
});
