# Architecture Overview

`flower-grower` is designed around a pure, deterministic generative pipeline separated cleanly from WebGL rendering and DOM layout.

## Package Structure

- **`@flower-grower/core`**: Pure TypeScript algorithms for plant graph generation, parametric geometry math, color conversions (OKLCH), curve parallel transport frames, and seeded PRNG. Has zero dependencies on Three.js or DOM.
- **`@flower-grower/three`**: WebGL2 rendering layer using Three.js as a peer dependency. Converts `Plant` data models into instanced buffer geometries and tube stem meshes. Growth animation is driven via vertex shaders with per-instance and per-vertex birth timings.
- **`@flower-grower/dom`**: Layout observers and guides converting DOM element bounds, borders, and corners into 3D growth paths and attractor fields.
- **`@flower-grower/element`**: Custom HTML element `<flower-grower>` encapsulating growth playback with shared WebGL contexts.
- **`@flower-grower/species`**: Pre-configured archetypes (Daisy, Rose, Tulip, Vine, etc.) with gene bounds, organ templates, and correlation constraints.
- **`apps/playground`**: Interactive development lab, contact sheet inspection, trellis editor, and performance benchmarking.
