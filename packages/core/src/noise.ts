import type { RNG } from './types.js';

const F3 = 1.0 / 3.0;
const G3 = 1.0 / 6.0;

const GRAD3: [number, number, number][] = [
  [1, 1, 0],
  [-1, 1, 0],
  [1, -1, 0],
  [-1, -1, 0],
  [1, 0, 1],
  [-1, 0, 1],
  [1, 0, -1],
  [-1, 0, -1],
  [0, 1, 1],
  [0, -1, 1],
  [0, 1, -1],
  [0, -1, -1],
];

export interface Noise3D {
  (x: number, y: number, z: number): number;
  fbm(
    x: number,
    y: number,
    z: number,
    octaves?: number,
    lacunarity?: number,
    gain?: number,
  ): number;
}

/**
 * Creates a seeded 3D simplex noise generator.
 */
export function createNoise3D(rng: RNG): Noise3D {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    p[i] = i;
  }

  // Fisher-Yates shuffle using provided seeded RNG
  for (let i = 255; i > 0; i--) {
    const j = rng.int(0, i);
    const tmp = p[i]!;
    p[i] = p[j]!;
    p[j] = tmp;
  }

  const perm = new Uint8Array(512);
  const permMod12 = new Uint8Array(512);
  for (let i = 0; i < 512; i++) {
    const val = p[i & 255]!;
    perm[i] = val;
    permMod12[i] = val % 12;
  }

  function noise3D(x: number, y: number, z: number): number {
    // Skew the input space to determine which simplex cell we're in
    const s = (x + y + z) * F3;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const k = Math.floor(z + s);

    const t = (i + j + k) * G3;
    const X0 = i - t; // Unskew the cell origin back to (x,y,z) space
    const Y0 = j - t;
    const Z0 = k - t;

    const x0 = x - X0; // The x,y,z distances from the cell origin
    const y0 = y - Y0;
    const z0 = z - Z0;

    // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
    // Determine which simplex we are in.
    let i1: number, j1: number, k1: number; // Offsets for second corner
    let i2: number, j2: number, k2: number; // Offsets for third corner

    if (x0 >= y0) {
      if (y0 >= z0) {
        i1 = 1;
        j1 = 0;
        k1 = 0;
        i2 = 1;
        j2 = 1;
        k2 = 0;
      } else if (x0 >= z0) {
        i1 = 1;
        j1 = 0;
        k1 = 0;
        i2 = 1;
        j2 = 0;
        k2 = 1;
      } else {
        i1 = 0;
        j1 = 0;
        k1 = 1;
        i2 = 1;
        j2 = 0;
        k2 = 1;
      }
    } else {
      if (y0 < z0) {
        i1 = 0;
        j1 = 0;
        k1 = 1;
        i2 = 0;
        j2 = 1;
        k2 = 1;
      } else if (x0 < z0) {
        i1 = 0;
        j1 = 1;
        k1 = 0;
        i2 = 0;
        j2 = 1;
        k2 = 1;
      } else {
        i1 = 0;
        j1 = 1;
        k1 = 0;
        i2 = 1;
        j2 = 1;
        k2 = 0;
      }
    }

    const x1 = x0 - i1 + G3;
    const y1 = y0 - j1 + G3;
    const z1 = z0 - k1 + G3;

    const x2 = x0 - i2 + 2.0 * G3;
    const y2 = y0 - j2 + 2.0 * G3;
    const z2 = z0 - k2 + 2.0 * G3;

    const x3 = x0 - 1.0 + 3.0 * G3;
    const y3 = y0 - 1.0 + 3.0 * G3;
    const z3 = z0 - 1.0 + 3.0 * G3;

    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;

    let n0 = 0.0;
    let n1 = 0.0;
    let n2 = 0.0;
    let n3 = 0.0;

    let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
    if (t0 > 0) {
      const gi0 = permMod12[ii + perm[jj + perm[kk]!]!]!;
      const g0 = GRAD3[gi0]!;
      t0 *= t0;
      n0 = t0 * t0 * (g0[0] * x0 + g0[1] * y0 + g0[2] * z0);
    }

    let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    if (t1 > 0) {
      const gi1 = permMod12[ii + i1 + perm[jj + j1 + perm[kk + k1]!]!]!;
      const g1 = GRAD3[gi1]!;
      t1 *= t1;
      n1 = t1 * t1 * (g1[0] * x1 + g1[1] * y1 + g1[2] * z1);
    }

    let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    if (t2 > 0) {
      const gi2 = permMod12[ii + i2 + perm[jj + j2 + perm[kk + k2]!]!]!;
      const g2 = GRAD3[gi2]!;
      t2 *= t2;
      n2 = t2 * t2 * (g2[0] * x2 + g2[1] * y2 + g2[2] * z2);
    }

    let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
    if (t3 > 0) {
      const gi3 = permMod12[ii + 1 + perm[jj + 1 + perm[kk + 1]!]!]!;
      const g3 = GRAD3[gi3]!;
      t3 *= t3;
      n3 = t3 * t3 * (g3[0] * x3 + g3[1] * y3 + g3[2] * z3);
    }

    // Scaled to [-1, 1]
    return 32.0 * (n0 + n1 + n2 + n3);
  }

  function fbm(
    x: number,
    y: number,
    z: number,
    octaves = 3,
    lacunarity = 2.0,
    gain = 0.5,
  ): number {
    let sum = 0.0;
    let freq = 1.0;
    let amp = 1.0;
    let max = 0.0;

    for (let o = 0; o < octaves; o++) {
      sum += noise3D(x * freq, y * freq, z * freq) * amp;
      max += amp;
      freq *= lacunarity;
      amp *= gain;
    }

    return max > 0 ? sum / max : 0;
  }

  const fn = noise3D as Noise3D;
  fn.fbm = fbm;
  return fn;
}
