import { describe, expect, it } from 'vitest';
import { growPlant } from '@flower-grower/core';
import { daisy } from './daisy.js';
import { peony } from './peony.js';
import { ranunculus } from './ranunculus.js';
import { rose } from './rose.js';
import { tulip } from './tulip.js';
import { SPECIES_REGISTRY } from './index.js';

describe('Species Archetypes and Plant Assembly', () => {
  it('registers all initial species in SPECIES_REGISTRY', () => {
    expect(SPECIES_REGISTRY['daisy']).toBe(daisy);
    expect(SPECIES_REGISTRY['peony']).toBe(peony);
    expect(SPECIES_REGISTRY['ranunculus']).toBe(ranunculus);
    expect(SPECIES_REGISTRY['rose']).toBe(rose);
    expect(SPECIES_REGISTRY['tulip']).toBe(tulip);
  });

  const speciesList = [daisy, peony, ranunculus, rose, tulip];

  for (const sp of speciesList) {
    it(`grows valid deterministic plants across seeds for species "${sp.id}"`, () => {
      for (const seed of [1, 42, 108, 777]) {
        const plant1 = growPlant({ species: sp, seed });
        const plant2 = growPlant({ species: sp, seed });

        expect(plant1).toEqual(plant2);
        expect(plant1.stems.length).toBeGreaterThan(0);
        expect(plant1.organs.length).toBeGreaterThan(0);
        expect(plant1.duration).toBeGreaterThan(0);

        // Verify numeric validity (no NaN or Infinity)
        for (const stem of plant1.stems) {
          for (const node of stem.nodes) {
            expect(Number.isFinite(node.pos[0])).toBe(true);
            expect(Number.isFinite(node.pos[1])).toBe(true);
            expect(Number.isFinite(node.pos[2])).toBe(true);
            expect(Number.isFinite(node.radius)).toBe(true);
            expect(Number.isFinite(node.birth)).toBe(true);
          }
        }

        for (const organ of plant1.organs) {
          expect(Number.isFinite(organ.origin[0])).toBe(true);
          expect(Number.isFinite(organ.origin[1])).toBe(true);
          expect(Number.isFinite(organ.origin[2])).toBe(true);
          expect(Number.isFinite(organ.scale)).toBe(true);
          expect(Number.isFinite(organ.birth)).toBe(true);
        }

        // JSON round trip
        const json = JSON.stringify(plant1);
        expect(JSON.parse(json)).toEqual(plant1);
      }
    });
  }

  it('generates distinctive species morphologies', () => {
    const d = growPlant({ species: daisy, seed: 10 });
    const r = growPlant({ species: rose, seed: 10 });
    const t = growPlant({ species: tulip, seed: 10 });

    // Tulip has exactly 6 tepals
    const tulipPetals = t.organs.filter((o) => o.type === 'petal');
    expect(tulipPetals.length).toBe(6);
    for (const p of tulipPetals) {
      expect(p.rotation).toBeGreaterThan(1.0);
      expect(p.tangent[1]).toBeGreaterThan(0.8);
    }

    // Rose has many layered petals (>= 30)
    const rosePetals = r.organs.filter((o) => o.type === 'petal');
    expect(rosePetals.length).toBeGreaterThanOrEqual(30);

    // Daisy has central disc florets
    const daisyFlorets = d.organs.filter((o) => o.type === 'center');
    expect(daisyFlorets.length).toBeGreaterThan(40);

    // Peony has voluminous ruffled petals (>= 60)
    const p = growPlant({ species: peony, seed: 10 });
    const peonyPetals = p.organs.filter((o) => o.type === 'petal');
    expect(peonyPetals.length).toBeGreaterThanOrEqual(60);

    // Ranunculus has dense incurved petals (>= 75) plus a compact green button center
    const ran = growPlant({ species: ranunculus, seed: 10 });
    const ranPetals = ran.organs.filter((o) => o.type === 'petal');
    const ranButton = ran.organs.filter((o) => o.type === 'center');
    expect(ranPetals.length).toBeGreaterThanOrEqual(75);
    expect(ranButton.length).toBeGreaterThanOrEqual(20);
  });
});
