# Species Authoring Guide

This guide documents the creation of plant archetypes and species definitions in `@flower-grower/species`.

## Concepts

1. **Genome & Gene Ranges**: Numerical and categorical gene ranges sampled through a seeded PRNG.
2. **Correlations**: Pure constraint transforms that prevent unnatural or conflicting proportions (e.g., more petals requiring narrower petals).
3. **Organ Shapes**: Parametric cross-sections, widths, and curls defining petals, sepals, and leaves.
4. **Placement Rules**: Phyllotaxis, whorls, and inflorescence layouts controlling organ distribution.

## Species Reference Notes

### Daisy (*Bellis perennis*)
- **Botanical Archetype:** Asteraceae composite flower head.
- **Traits:** Single central receptacle disc with tightly packed 55–89 disc florets organized according to the golden angle ($\sim 137.5^\circ$). Surrounded by 13 to 34 elongated ray florets (petals) in one or two whorls with a gentle lateral cup and subtle curl at the apex.
- **Growth:** Upright scapose stem with subtle organic curvature. Ray florets unfurl outward from the bud while disc florets expand convexly.

### Rose (*Rosa sp.*)
- **Botanical Archetype:** Rosaceae double-flower hybrid.
- **Traits:** Dense, imbricated multi-layered spiral whorls (4 to 6 layers) of 32 to 52 broad petals. Petals feature prominent lateral concavity (cupping) and reflexed outer margins that roll backward as the bloom matures.
- **Growth:** Sturdier stem with a tight, rounded bud phase opening gradually into a rich layered blossom.

### Tulip (*Tulipa gesneriana*)
- **Botanical Archetype:** Liliaceae cup-shaped flower.
- **Traits:** 6 distinct petaloid tepals in two distinct alternating whorls of three (three outer tepals overlapping three inner tepals). Deeply cupped lateral curvature creating an erect goblet silhouette with pointed tips and no visible disc florets.
- **Growth:** Tall erect stem; tepals remain close together at the base while flaring gently outward at the rim.
