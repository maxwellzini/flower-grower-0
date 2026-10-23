import type { RNG } from './types.js';

/**
 * FNV-1a 32-bit hash of a string label.
 */
function fnv1a(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Creates a seeded pseudo-random number generator using Mulberry32.
 * Includes support for labeled child forks using FNV-1a hash mixing.
 */
export function createRNG(seed: number): RNG {
  // Ensure non-zero positive 32-bit integer state
  let state = seed >>> 0 || 1337;

  function next(): number {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function range(a: number, b: number): number {
    return a + next() * (b - a);
  }

  function int(a: number, b: number): number {
    const min = Math.ceil(a);
    const max = Math.floor(b);
    return Math.floor(min + next() * (max - min + 1));
  }

  function pick<T>(arr: readonly T[]): T {
    if (arr.length === 0) {
      throw new Error('Cannot pick from an empty array');
    }
    const idx = Math.floor(next() * arr.length);
    return arr[idx]!;
  }

  // Box-Muller transform for gaussian distribution
  let hasSpare = false;
  let spare = 0;

  function gaussian(mean = 0, sd = 1): number {
    if (hasSpare) {
      hasSpare = false;
      return mean + spare * sd;
    }

    let u = 0;
    let v = 0;
    let s = 0;
    do {
      u = next() * 2 - 1;
      v = next() * 2 - 1;
      s = u * u + v * v;
    } while (s >= 1 || s === 0);

    const mul = Math.sqrt((-2 * Math.log(s)) / s);
    spare = v * mul;
    hasSpare = true;
    return mean + u * mul * sd;
  }

  function fork(label: string): RNG {
    const labelHash = fnv1a(label);
    // Mix current state with label hash to seed the child generator
    const childSeed = (state ^ Math.imul(labelHash, 0x9e3779b9)) >>> 0;
    return createRNG(childSeed);
  }

  return {
    next,
    range,
    int,
    pick,
    gaussian,
    fork,
  };
}
