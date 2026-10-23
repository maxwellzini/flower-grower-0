import { describe, expect, it } from 'vitest';
import type { Vec3 } from './types.js';
import {
  catmullRomPoint,
  computeParallelTransportFrames,
  isFrameOrthonormal,
  sampleCatmullRom,
} from './curve.js';

describe('Curve frames and parallel transport', () => {
  it('evaluates catmullRomPoint at boundary endpoints', () => {
    const p0: Vec3 = [-1, 0, 0];
    const p1: Vec3 = [0, 0, 0];
    const p2: Vec3 = [1, 0, 0];
    const p3: Vec3 = [2, 0, 0];

    const start = catmullRomPoint(p0, p1, p2, p3, 0);
    expect(start[0]).toBeCloseTo(0, 5);
    const end = catmullRomPoint(p0, p1, p2, p3, 1);
    expect(end[0]).toBeCloseTo(1, 5);
  });

  it('samples Catmull-Rom splines smoothly', () => {
    const cps: Vec3[] = [
      [0, 0, 0],
      [0, 5, 0],
      [5, 10, 0],
      [10, 15, 5],
    ];
    const sampled = sampleCatmullRom(cps, 10);
    expect(sampled.length).toBe(31);
    expect(sampled[0]).toEqual([0, 0, 0]);
  });

  it('guarantees all parallel-transport frames along a 3D helix are strictly orthonormal', () => {
    // Generate a 3D helical polyline
    const helixPoints: Vec3[] = [];
    const count = 100;
    for (let i = 0; i < count; i++) {
      const theta = (i / count) * Math.PI * 4;
      const x = Math.cos(theta) * 2;
      const y = i * 0.1;
      const z = Math.sin(theta) * 2;
      helixPoints.push([x, y, z]);
    }

    const frames = computeParallelTransportFrames(helixPoints, [0, 1, 0]);
    expect(frames.length).toBe(count);

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i]!;
      expect(isFrameOrthonormal(frame, 1e-4)).toBe(true);
    }
  });

  it('handles sharp turns without frame degeneration or flipping', () => {
    const sharpPoints: Vec3[] = [
      [0, 0, 0],
      [0, 10, 0],
      [10, 10, 0],
      [10, 10, 10],
      [0, 10, 10],
    ];

    const frames = computeParallelTransportFrames(sharpPoints);
    expect(frames.length).toBe(sharpPoints.length);

    for (const frame of frames) {
      expect(isFrameOrthonormal(frame, 1e-4)).toBe(true);
    }
  });
});
