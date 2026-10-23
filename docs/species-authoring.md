# Species Authoring Guide

This guide documents the creation of plant archetypes and species definitions in `@flower-grower/species`.

## Concepts

1. **Genome & Gene Ranges**: Numerical and categorical gene ranges sampled through a seeded PRNG.
2. **Correlations**: Pure constraint transforms that prevent unnatural or conflicting proportions (e.g., more petals requiring narrower petals).
3. **Organ Shapes**: Parametric cross-sections, widths, and curls defining petals, sepals, and leaves.
4. **Placement Rules**: Phyllotaxis, whorls, and inflorescence layouts controlling organ distribution.
