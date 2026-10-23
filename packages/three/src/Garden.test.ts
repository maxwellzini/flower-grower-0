import { describe, expect, it } from 'vitest';
import { growDaisy } from '@flower-grower/core';
import { Garden } from './Garden.js';
import { buildStemBufferGeometry } from './geometry/stemGeometry.js';
import { buildInstancedPetalGeometry } from './geometry/petalGeometry.js';

describe('Three.js Garden and Geometry Builders', () => {
  it('builds stem buffer geometry with required vertex attributes', () => {
    const daisy = growDaisy({ seed: 1 });
    const geom = buildStemBufferGeometry(daisy.stems);

    expect(geom.getAttribute('position')).toBeDefined();
    expect(geom.getAttribute('normal')).toBeDefined();
    expect(geom.getAttribute('aAxis')).toBeDefined();
    expect(geom.getAttribute('aBirth')).toBeDefined();
    expect(geom.getAttribute('aGrowSpan')).toBeDefined();
    expect(geom.getAttribute('aRadiusScale')).toBeDefined();
    expect(geom.getAttribute('aU')).toBeDefined();
    expect(geom.getIndex()).toBeDefined();
  });

  it('builds instanced petal geometry with instance attributes', () => {
    const daisy = growDaisy({ seed: 1 });
    const petalOrgans = daisy.organs.filter((o) => o.shape === 0);
    const geom = buildInstancedPetalGeometry(petalOrgans, daisy.shapes[0]!);

    expect(geom.instanceCount).toBe(petalOrgans.length);
    expect(geom.getAttribute('iOrigin')).toBeDefined();
    expect(geom.getAttribute('iTangent')).toBeDefined();
    expect(geom.getAttribute('iNormal')).toBeDefined();
    expect(geom.getAttribute('iBinormal')).toBeDefined();
    expect(geom.getAttribute('iColor')).toBeDefined();
    expect(geom.getAttribute('iGrowthParams')).toBeDefined();
    expect(geom.getAttribute('iShapeParams')).toBeDefined();
    expect(geom.getAttribute('iCurveParams')).toBeDefined();
  });

  it('adds and scrubs plant in Garden scene', () => {
    const garden = new Garden();
    const daisy = growDaisy({ seed: 1 });
    const handle = garden.add(daisy);

    expect(garden.scene.children.length).toBe(1);
    expect(handle.duration).toBeCloseTo(daisy.duration, 2);

    garden.setTime(1.5);
    expect(garden.getTime()).toBe(1.5);

    // Scrub backward
    garden.setTime(0.5);
    expect(garden.getTime()).toBe(0.5);

    garden.remove(handle);
    expect(garden.scene.children.length).toBe(0);

    garden.dispose();
  });
});
