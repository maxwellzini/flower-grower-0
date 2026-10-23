# Flower Grower: Implementation Plan

Audience: an implementing agent with limited context. Follow phases in order. Do not skip acceptance criteria. When a decision is not specified, choose the simplest option and record it in `docs/decisions.md`.

The workspace `d:\Libraries\Documents\repos\flower-grower-0` is currently **empty**.

---

## 0. Decisions already made (do not revisit)

| Topic | Decision |
|---|---|
| Purpose | Published open-source library plus a browser playground/editor |
| Language | TypeScript (strict) |
| Core | Framework-agnostic and **three.js-free**. Pure data in, pure data out. |
| Renderer | three.js, **WebGL2**, three as a **peer dependency**. No fallback for non-WebGL2 browsers. |
| Dimensionality | **3D-native.** "2D mode" is an orthographic camera on a transparent canvas, not a separate pipeline. |
| Look | Stylized = **botanical illustration** (ink linework, soft color) and **watercolor**. Also a **realistic-lite** style. NOT toon/cel-shaded. |
| Styles | Swappable layer, separate from geometry. Ship `botanical` and `watercolor` first, `realistic` later. |
| Overlay | Must be able to overlay onto DOM content (transparent canvas that follows elements). |
| Scale | Dozens to ~100 plants, growing progressively while idle, with an adjustable and adaptive budget. |
| Determinism | Same seed gives the same plant. **Never call `Math.random` in core.** |
| Growth animation | Plants are generated as a static graph with per-element birth times. Animation is a pure function of time `t`. |

---

## 1. Tooling and repo layout

**Package manager:** pnpm workspaces. **Build:** Vite (library mode) per package plus `tsc --emitDeclarationOnly` for types. **Tests:** Vitest. **Lint/format:** ESLint + Prettier. **Versioning/publish:** Changesets.

Before pinning versions, run `pnpm view <pkg> version` for each dependency and use the current stable. Verify three.js API usage against the installed version's docs. It changes often.

```
flower-grower-0/
├─ package.json                 (private root, scripts)
├─ pnpm-workspace.yaml
├─ tsconfig.base.json           (strict, ES2022, moduleResolution bundler)
├─ .changeset/
├─ docs/
│  ├─ decisions.md
│  ├─ architecture.md
│  └─ species-authoring.md
├─ packages/
│  ├─ core/        @flower-grower/core       (no deps except tiny utils)
│  ├─ three/       @flower-grower/three      (peer: three; depends on core)
│  ├─ dom/         @flower-grower/dom        (guide helpers + overlay; depends on core, three)
│  ├─ element/     @flower-grower/element    (web component <flower-grower>)
│  └─ species/     @flower-grower/species    (archetype presets, data only; depends on core)
└─ apps/
   └─ playground/  (Vite app; private; uses all packages)
```

Rules:
- `core` and `species` must import **nothing** from three or the DOM. Add an ESLint `no-restricted-imports` rule enforcing this.
- All packages export ESM, with `exports` maps and `sideEffects: false`.
- Public API goes through each package's `src/index.ts` only.

---

## 2. Core data model (`packages/core`)

Define these types first in `src/types.ts`. Everything else depends on them.

```ts
type Vec3 = [number, number, number];

interface RNG {            // seeded PRNG (mulberry32 or sfc32)
  next(): number;          // [0,1)
  range(a: number, b: number): number;
  int(a: number, b: number): number; // inclusive
  pick<T>(arr: readonly T[]): T;
  gaussian(mean?: number, sd?: number): number;
  fork(label: string): RNG; // derives an independent child stream
}
```
**Use `rng.fork(label)` for every subsystem** (stems, petals, color, and so on). Then adding a random call in one subsystem does not change the output of the others.

```ts
// A branch/stem/vine is a chain of nodes.
interface StemNode {
  pos: Vec3;
  radius: number;          // final radius
  birth: number;           // seconds from plant start when tip reaches this node
}
interface Stem {
  id: number;
  parent: number | null;   // parent stem id
  parentNode: number | null;
  nodes: StemNode[];       // >= 2
  kind: 'trunk' | 'branch' | 'vine' | 'tendril' | 'peduncle';
}

type OrganType = 'petal' | 'sepal' | 'leaf' | 'stamen' | 'pistil' | 'center' | 'bud' | 'seedhead';

interface Organ {
  id: number;
  type: OrganType;
  stemId: number;
  stemNode: number;        // attachment node index
  // Local frame at the attachment point (orthonormal)
  origin: Vec3; tangent: Vec3; normal: Vec3; binormal: Vec3;
  shape: ShapeId;          // index into Plant.shapes
  scale: number;           // final size in world units
  rotation: number;        // roll about its own axis, radians
  color: ColorGene;        // see §5
  birth: number;           // seconds
  growDuration: number;    // seconds to reach full size
  openDuration: number;    // seconds to unfurl (petals/leaves), 0 for none
  openness0: number;       // initial curl in 0..1 (1 = fully curled/closed)
  age: number;             // phase-in-life 0..1, for per-organ variation
}

interface Plant {
  seed: number;
  speciesId: string;
  stems: Stem[];
  organs: Organ[];
  shapes: OrganShape[];    // deduplicated shape definitions
  duration: number;        // total seconds until fully grown
  bounds: { min: Vec3; max: Vec3 };
}
```

`OrganShape` describes parametric petal/leaf geometry (see §4.2). Keep it small and serialisable: only numbers and short arrays. **A `Plant` must be JSON-serialisable** (`JSON.stringify` round-trips with no loss). Add a test for this.

### Utilities to write in core
- `rng.ts`: mulberry32 plus `fork` (hash the label with FNV-1a and mix with the state).
- `noise.ts`: 3D simplex noise, seeded (write a small implementation or use `simplex-noise`, wrapping it so it takes our RNG).
- `curve.ts`: Catmull-Rom sampling in 3D, `tangentAt`, and **parallel-transport frames** (rotation-minimising frames) along a polyline. This avoids Frenet-frame flipping.
- `math.ts`: vec3 ops (plain functions on tuples, with no classes), lerp, clamp, smoothstep, easings.
- `color.ts`: OKLCH to sRGB conversion, gradient sampling.

**Acceptance:** unit tests for RNG determinism and independence of forks, curve frame orthonormality, JSON round-trip, and OKLCH conversion against known values.

---

## 3. Growth guides (where plants grow) (`core` + `dom`)

```ts
interface GrowthGuide {
  paths: Vec3[][];           // polylines (world units) vines follow
  attractors?: Vec3[];       // points space colonization grows toward
  region?: Region;           // sphere | box | polygon-extruded; used for area fill
  obstacles?: Region[];
  up?: Vec3;                 // default [0,1,0]
}
```

**Core builders (pure geometry):** `guideFromPolyline`, `guideFromBox`, `guideFromSphere`, `guideFromCurve3`, and `scatterAttractors(region, count, rng)`.

**DOM builders (`packages/dom`):** these read layout and map CSS pixels to world units through the overlay's coordinate mapping (§7).
- `guideFromElementBorder(el, { inset, side?: 'all'|'top'|…, cornerRadius: 'auto' })`
- `guideFromElementCorners(el, { corners: ['tl','br'], size })`, which gives an L-shaped path plus a region for embellishing image corners
- `guideBetween(elA, elB)`, which gives a curved path plus an attractor field for the gap
- `guideFromSVGPath(pathEl | d)`, using `getPointAtLength`

**Acceptance:** snapshot tests with a fake rect (no real DOM needed for the math), and a visual check in the playground.

---

## 4. Generators (`packages/core/src/generators`)

Each generator has this signature and returns **stems only** (organs are attached later by the plant assembler):

```ts
type StemGenerator = (guide: GrowthGuide, params: any, rng: RNG) => Stem[];
```

### 4.1 Stem generators
1. **`vineWalker`** (build first). A tendril head moves along a guide path.
   - Heading each step = normalize(`pathTangent*wFollow + toPath*wStick + noise*wWander + upBias*wUp`).
   - Add a **helical offset** around the path (radius and pitch are genes), so it wraps around.
   - Per-step budget decreases ("vigor"). Branch with probability `pBranch` when vigor is above a threshold, spawning a child with lower vigor.
   - Output nodes at roughly constant arc spacing (`stepLength` gene). Assign `birth` = distance travelled / `growSpeed` + parent's birth at the fork.
2. **`spaceColonization`**. Standard algorithm: attractors, an influence radius, a kill radius, and a step length. Use a **uniform spatial hash grid** for nearest-node lookup. Do not use O(n·m) brute force. Cap the iterations. The output tree is converted to stems, one per branch chain.
3. **`lsystem`**. A parametric stochastic L-system with an interpreter for `F + - & ^ \ / [ ]` that emits 3D stems. Rules are data in the species file. Apply the tropism vector (gravity or light) per step.
4. **`straightStem`**. A single stem with a gentle noise curve, used for single flowers like a daisy or tulip.

### 4.2 Organ shapes and placement (`organs/`)

**Petal/leaf shape** (`OrganShape`):
```ts
interface OrganShape {
  length: 1;                       // normalised
  widthProfile: number[];          // 8–12 control values, width at t=0..1 (Catmull-Rom)
  tip: 'round'|'point'|'notch'|'fringe';
  tipSharpness: number;
  baseNarrow: number;              // 0..1
  cupDepth: number;                // lateral bend (concavity)
  curlTip: number;                 // longitudinal curl at the tip, radians
  reflex: number;                  // backward bend
  ruffle: number; ruffleFreq: number;
  midribBend: number;
  veinCount: number; veinDepth: number;
  lobes?: { count: number; depth: number };  // leaves
}
```
Provide a pure function `evalShape(shape, u, v, openness)` returning a `Vec3` and normal in the organ's local frame, where `u` runs along the length and `v` across the width (-1..1). **Both the CPU (tests, export) and the shader implement this same math.** Write it once in a GLSL/TSL snippet and once in TS and cross-test them (see §6.5 tests).

**Placement functions:**
- `phyllotaxis(count, goldenAngle=137.507764°)` for radial layout
- `whorls({count, layers, sizeFalloff, tilt})`
- `leafArrangement('alternate'|'opposite'|'whorled'|'spiral', spacing)`
- `inflorescence('single'|'raceme'|'spike'|'umbel'|'corymb'|'panicle', ...)` positions flower heads (peduncle stems) along a parent stem

### 4.3 Plant assembler (`assemble.ts`)
`growPlant({ species, seed, guide, overrides }) => Plant`:
1. Sample a **genome** (§5) from the species with `rng.fork('genome')`.
2. Run the stem generator with the guide.
3. Walk stems, attach **leaves** per the leaf arrangement.
4. At terminal and designated nodes, attach a **flower head** (petal whorls, a center, sepals, and optionally buds).
5. Assign birth and open timings. Order: stems extend, then buds appear, then buds swell, then petals unfurl, with small randomised staggers.
6. Compute `duration` and `bounds`.

**Acceptance:**
- Deterministic: `growPlant(x)` run twice deep-equals.
- Property tests: no NaN, all frames orthonormal, all `birth` values are non-decreasing along a stem, and the organ count is under the species cap.

---

## 5. Genome and species system (`core/genome`, `packages/species`)

### 5.1 Gene schema
```ts
type Gene =
  | { kind: 'float'; min: number; max: number; }
  | { kind: 'int'; min: number; max: number; }
  | { kind: 'choice'; options: string[]; }
  | { kind: 'color'; /* OKLCH */ hue: [number, number]; chroma: [number, number]; light: [number, number]; };

type GeneRange<T> = { lo: T; hi: T; bias?: 'low'|'mid'|'high' };   // bias shapes the sampling
```
One central **`GENES` registry** lists every gene with its name, type, absolute bounds, and description. The playground auto-generates sliders from it. The registry is the **single source of truth**. Never hard-code gene names elsewhere.

Group the genes: `stem.*`, `leaf.*`, `petal.*`, `flower.*`, `layout.*`, `color.*`, `growth.*`, `style.*`. Aim for 40 to 60 total.

### 5.2 Species archetype
```ts
interface Species {
  id: string; name: string;
  generator: 'vine'|'colonize'|'lsystem'|'straight';
  ranges: Record<GeneName, GeneRange<any>>;
  correlations: Correlation[];     // constraints between genes
  petalShapes: OrganShapeTemplate[];  // each shape has its own ranges
  paletteRules: PaletteRule[];
}
```

### 5.3 Operations (all pure)
- `sample(species, rng) => Genome`: samples each gene from its range, then applies correlations.
- `blend(a: Genome|Species, b, t)`: interpolates numeric genes and picks categorical ones.
- `mutate(genome, amount, rng)`: Gaussian perturbation, clamped to the absolute bounds.
- `crossover(a, b, rng)`: per-gene-group random choice.
- Correlation examples (implement as small functions `(genome) => genome`): more petals mean narrower petals, a larger head means a thicker peduncle, and a lower leaf count means larger leaves. Clamp afterwards.

### 5.4 Initial species set (data files in `packages/species`)
Build in this order, since each adds a new capability:
1. **daisy**: single whorl, phyllotaxis center, straight stem. Petal count is Fibonacci-flavoured (13/21/34).
2. **rose**: many tight layered whorls with curled tips (curl and cup genes), compound leaves, and a branching stem.
3. **tulip**: cupped 6-petal flower, long strap leaves at the base.
4. **sunflower**: huge phyllotaxis seed disc and a large leaf.
5. **morning-glory / clematis**: **vine** generator with a trumpet or star flower. This is the trellis demo species.
6. **lupine / foxglove**: raceme inflorescence.
7. **fern or ivy**: a foliage-only species (no flowers), used to fill space.

Each species ships with a `reference.md` note (a few lines on the real-world traits it imitates) in `docs/species-authoring.md`.

**Acceptance:** a "contact sheet" script/page renders 24 seeds per species. The playground has this view. The human reviews it and tunes the ranges. **Do not mark a species done without that review.** Stop and ask the user for feedback at this point.

---

## 6. Three.js renderer (`packages/three`)

### 6.1 Principles
- **Growth is computed in shaders** from `uTime` and per-vertex or per-instance `birth` attributes. The CPU does not touch geometry per frame.
- All plants share a few **big buffers**. Target **under 20 draw calls** for the whole garden.
- Use three's `onBeforeCompile` or `ShaderMaterial` with GLSL for WebGL2. **Do not use TSL or WebGPU in v1.** (Keep the shader code modular so a port is possible.)
- The renderer reads `Plant` objects only. It must never reach back into generators.

### 6.2 Public classes
```ts
class Garden {
  constructor(opts: { renderer?: WebGLRenderer; canvas?: HTMLCanvasElement; style?: StyleName|Style;
                      budget?: BudgetOptions; transparent?: boolean; });
  readonly scene: Scene;
  add(plant: Plant, opts?: { transform?: Matrix4; startTime?: number }): PlantHandle;
  remove(handle: PlantHandle, opts?: { wilt?: boolean }): void;
  setStyle(style: StyleName|Style): void;
  setBudget(b: Partial<BudgetOptions>): void;
  update(dt?: number): void;      // advance clock, run scheduler, upload dirty buffer ranges
  render(camera: Camera): void;
  dispose(): void;
}
```
Also export `GardenProps`-free helpers: `createGardenCanvas`, and `PlantHandle { id, bounds, progress, setTime(t), pause(), reverse() }`.

### 6.3 Geometry buffers
**Stems:** a single pooled `BufferGeometry`. Each stem is a tube with `radialSegments` (default 6, LOD down to 3) and one ring per node. Per-vertex attributes: `position` (the final grown position), `aBirth`, `aRadiusScale`, `aStemId`, `aAxis` (the centerline point, so the shader can shrink the vertex toward it), and `aU` (arc-length along the stem for texture and stroke use).
- Vertex shader: `growth = clamp((uTime - aBirth)/aGrowSpan, 0, 1)`. Collapse vertices to `aAxis` when `growth=0`, and scale the radius with an ease. Vertices whose ring has not yet been reached collapse onto the last reached ring, so the tip appears to advance.

**Petals and leaves:** an `InstancedBufferGeometry` per **shape family**, with a base mesh that is a grid (for example 12x8 for petals, with an LOD that drops to 6x4). It is a unit grid with `uv`. Per-instance attributes: `iOrigin`, `iFrame` (a quaternion), `iScale`, `iBirth`, `iGrow`, `iOpenDur`, `iOpen0`, `iRotation`, `iColorA`, `iColorB`, `iShapeParams0..N` (packed shape params in vec4s), and `iSeed`.
- Vertex shader: evaluates `evalShape(...)` with `openness = mix(iOpen0, 0, ease((uTime - iBirth - iGrow)/iOpenDur))`, then size growth, then wind.
- This avoids a draw call per shape: pack shape params per instance rather than one geometry per shape.

**Small organs** (stamens, seeds on the disc): instanced tiny meshes (a simple lathe or a billboard quad).

### 6.4 Buffer management
- `BufferPool` allocates slot ranges in fixed-capacity typed arrays. It supports `alloc(count)`, `free(range)` and a free-list with coalescing.
- Uploads use `BufferAttribute.addUpdateRange` plus `needsUpdate` (or the current three equivalent) for the dirty ranges only.
- Capacity grows by doubling (reallocate and copy) on overflow, then the geometry is rebuilt. Do this rarely and log a warning in dev mode.

### 6.5 Shader and shape parity tests
Port `evalShape` to GLSL as a string constant. Test by running the TS version and a minimal headless GL render (or simply a pure TS mirror of the GLSL, line by line, with a comment saying "keep in sync"). At minimum, add a **visual regression screenshot** per shape using Playwright in CI.

### 6.6 Styles (`styles/`)
```ts
interface Style {
  name: string;
  materialHooks: { stem: ShaderChunks; petal: ShaderChunks; leaf: ShaderChunks };
  post?: PostPass[];           // optional EffectComposer passes
  uniforms: Record<string, any>;
  background?: 'transparent'|'paper';
}
```
Implement each style as shader chunks injected into the shared materials. A style swap replaces the chunks and recompiles. It does not rebuild geometry.

**`botanical` (botanical illustration), the reference style, built first:**
- Fill: soft, slightly desaturated colour with a base-to-tip gradient and **per-organ colour variation** (from `iSeed`).
- Light: a simple wrap-diffuse (half-Lambert) that never goes fully dark, plus a faint warm rim.
- Linework: a **post-process edge pass** using **depth plus normal** (Sobel or Roberts cross) drawn in a dark sepia ink. Use a separate **normal+depth render target** (MRT, or a second pass with an override material). Add a line wobble by displacing the sample UV with low-frequency noise. Vary the line width by depth.
- Veins: draw in the fragment shader from the UV (midrib plus lateral veins from `veinCount`) as thin darker lines.
- Optional hatching: a screen-space hatch texture whose density depends on (1 - diffuse). Make it a toggle.
- Background: transparent by default, with an optional paper texture.

**`watercolor`:**
- Pigment layers: colour banding in 2 to 3 soft steps with a noise-warped threshold.
- **Edge darkening** where the pigment pools (computed from the normal and depth edge, as in the edge pass but a wide soft band).
- Paper grain: multiply a tiling grain texture (generate it procedurally into a `DataTexture` at init, with no external assets).
- Wet-edge bleed: a low-res blur of the colour buffer, mixed in near the silhouettes.
- Slight alpha falloff at the petal edges.

**`realistic` (later, phase 9):** translucent petals (a thickness term, fake subsurface via a back-lit wrap), soft shadows, and an env map. Use alpha-to-coverage or a dithered alpha.

**Transparency:** avoid sorted alpha blending. Use `alphaToCoverage` (needs MSAA) or screen-door dithering, and document the choice. Silhouette and edge softness come from the post pass.

### 6.7 Growth scheduler and budget (`scheduler.ts`)
```ts
interface BudgetOptions {
  maxPlants: number;            // hard cap
  maxInstances: number;         // soft cap: total petal+leaf instances
  maxStemVertices: number;
  generateMsPerFrame: number;   // default 2
  adaptive: boolean;            // lower detail/limits when frame time is high
  targetFrameMs: number;        // default 16.6
  onFull: 'wilt-oldest' | 'stop' | 'recycle-random';
  idleSpawn?: { enabled: boolean; intervalMs: [number, number]; species: string[]; guideProvider: () => GrowthGuide };
}
```
Behaviour:
1. **Time-sliced generation.** `growPlant` is split into resumable steps (an iterator or generator function that yields after each stem or organ group). The scheduler runs steps until `generateMsPerFrame` is used up, then continues next frame. Uploads happen once per frame.
2. **Progressive growth.** Plants can keep spawning (idle spawn) so the scene keeps evolving until the budget is hit.
3. **Retirement.** When over budget, select a victim (the oldest by default). Run its **wilt** animation (the `uWilt` per-plant attribute going 0 to 1: petals droop and fall, stems desaturate and shrink). When wilting completes, `BufferPool.free` the ranges.
4. **Adaptive mode.** An exponential moving average of frame time. If it is above target for N frames, reduce `maxInstances` by 10% and the LOD tier. If it is well below target for several seconds, restore it. Hysteresis is required to avoid oscillation.
5. **LOD tiers:** 0 = full, 1 = fewer petal segments and 4 radial segments, 2 = no veins and 3 radial segments. Pick the tier per plant by camera distance, and update an attribute rather than regenerating geometry.
6. Per-plant **frustum culling** using bounding spheres, by skipping the upload and setting a `visible` flag. Because the geometry is merged, the use of **`drawRange`** per plant is not possible. Instead, order the pool ranges so a distance-sorted compaction is unnecessary, and just accept GPU culling for off-screen vertices in v1. **Do not over-engineer culling in v1.**

**Optional (phase 8):** run `growPlant` in a **Web Worker** (it is pure and JSON-serialisable by design). Send the result back as a transferable typed-array form.

### 6.8 Idle motion
A shared vertex-shader wind: `offset = noise3(pos*freq + uTime*speed) * amp * heightFactor`, applied to the stems and organs and weighted by the distance from the root (`aU`), so the base stays still. Petals add a flutter proportional to their openness. All parameters are uniforms, and the style can scale them.

---

## 7. Overlay mode (`packages/dom`)

**Goal:** plants grow over page content, with a transparent canvas, following element layout.

```ts
class Overlay {
  constructor(opts: { container?: HTMLElement; mode: 'page'|'element'; zIndex?: number;
                      pointerEvents?: 'none'; style?: StyleName; budget?: BudgetOptions; });
  readonly garden: Garden;
  growOn(target: Element | GrowthGuide, opts: GrowOptions): PlantHandle[];
  growBetween(a: Element, b: Element, opts: GrowOptions): PlantHandle[];
  refresh(): void;          // re-measure; called automatically
  destroy(): void;
}
```

Implementation requirements:
1. One **fixed-position, full-viewport, transparent canvas** (`mode: 'page'`), `pointer-events: none`, with an **orthographic camera** where 1 world unit = 1 CSS pixel. `renderer.setPixelRatio(min(devicePixelRatio, 2))`. Set `alpha: true`, `premultipliedAlpha: true`, and a clear colour alpha of 0. Make sure the post-process passes **preserve alpha** (this is a known pitfall: edge and blur passes must output premultiplied alpha, and the `paper` background must be disabled).
2. **Scroll sync:** convert page coordinates to viewport coordinates each frame (`getBoundingClientRect`), or use a page-sized canvas for `absolute` mode. Offer both, defaulting to the viewport canvas with the camera translated by scroll. Do not stack many canvases.
3. **Layout tracking:** `ResizeObserver` on targets, plus `IntersectionObserver` to pause growth when off-screen, and a `window` resize and scroll listener (passive). Re-derive the guide on change and **re-anchor** the existing plants by transform where possible (translate with the element). If the element size changes, regrow it progressively rather than snapping.
4. `mode: 'element'` creates a canvas sized to one container (for example, image corners).
5. **Depth in 2D mode:** because the camera is orthographic, plants need a z range so that overlapping parts sort correctly with the depth buffer. Keep the guide's z in a small band (±50 units).
6. Respect `prefers-reduced-motion`: skip the growth animation (jump to `t = duration`) and disable wind. Provide an option to override.
7. A perspective camera option (`camera: 'ortho' | 'perspective'`) plus `Overlay.setCamera()` for 3D demos.

**Acceptance:** a demo page with a card whose border grows vines, an image with corner embellishments, and two buttons with a vine between them. Scrolling and resizing keep them aligned. The text underneath stays selectable.

---

## 8. Web component (`packages/element`)

```html
<flower-grower species="morning-glory" seed="42" trellis="border"
               duration="6000" style-name="botanical" idle></flower-grower>
```
- Attributes: `species`, `seed`, `trellis` (`border`|`corners`|`selector:<css>`|`svg:<path-id>`), `style-name`, `duration`, `density`, `autoplay`, `max-plants`, `idle`.
- Properties: `.player` (play, pause, seek), `.guide` (settable), and events `growthend` and `ready`.
- Lazy-load three (`import()`) when connected. Use Shadow DOM for the canvas. Clean up on `disconnectedCallback`.
- Several elements on one page **must share one WebGL context** (a singleton `Overlay` per page, registered with a ref count), because browsers cap contexts at about 16.

---

## 9. Playground / editor (`apps/playground`)

Vite plus vanilla TypeScript, with a small UI library only if really needed (**Tweakpane** for controls). Pages or tabs:

1. **Flower lab:** the 3D viewport (OrbitControls) with the selected species and seed, and a seed field with prev/next/random. Auto-generated sliders from the `GENES` registry (grouped, collapsible, with range lock). Style dropdown plus style parameters. A timeline scrubber (0 to `duration`) with play/pause/loop and speed. Buttons: **mutate**, **blend with…**, **randomise**, **save/load JSON** (a genome plus seed), and **export Plant JSON**. A 'lock gene' checkbox so that mutate leaves certain genes alone.
2. **Contact sheet:** a grid of N seeds for a species (static, fully grown), with click-to-open in the lab. Includes a "Fibonacci petal check" and other debugging overlays.
3. **Trellis editor:** a 2D canvas (the overlay in ortho mode) where the user **draws polylines, picks element borders, or drops attractors**. The guide is previewed live, and the editor sets the species, density, and so on. It can export the guide JSON and a code snippet.
4. **Garden stress test:** controls for the budget (`maxPlants`, `maxInstances`, adaptive on/off, idle-spawn interval), a live stats panel (FPS, frame ms, plants, instances, draw calls from `renderer.info`, pool usage, generation ms), and a button that spawns 100 plants.
5. **Overlay demo:** the page from §7 acceptance.
6. **Export:** a "copy code" snippet showing the library calls that reproduce the current setup, plus a PNG snapshot (with transparency).

State management: a single plain `AppState` object with a tiny event emitter. Persist to `localStorage` and the URL hash (seed, species, genome overrides, style) so that links are shareable.

---

## 10. Public API summary (what ships)

```ts
// @flower-grower/core
growPlant, sample, blend, mutate, crossover, GENES, createRNG, guideFrom*
// @flower-grower/species
species: Record<string, Species>, daisy, rose, ...
// @flower-grower/three
Garden, styles (botanical, watercolor, realistic), BudgetOptions
// @flower-grower/dom
Overlay, guideFromElementBorder, guideFromElementCorners, guideBetween, guideFromSVGPath
// @flower-grower/element
registers <flower-grower>
```

Quick-start (put it in the README):
```ts
import { growPlant } from '@flower-grower/core';
import { rose } from '@flower-grower/species';
import { Overlay, guideFromElementBorder } from '@flower-grower/dom';

const overlay = new Overlay({ mode: 'page', style: 'botanical' });
overlay.growOn(document.querySelector('.card')!, { species: rose, seed: 7, density: 0.6 });
```

---

## 11. Testing strategy

- **Unit (Vitest):** RNG, curves, frames, colour, genome sampling bounds, blend/mutate bounds, guide builders, the pool allocator (fuzz test: random alloc/free sequences never overlap), and the scheduler (fake clock; budget respected; adaptive hysteresis).
- **Property tests (fast-check optional):** every species, 200 seeds: no NaN or Infinity, organ count under the cap, and a JSON round trip.
- **Golden files:** for a few seed/species pairs, store a hash of the serialised `Plant`. Changes require an intentional update. Warn when generator code changes break old seeds, and note it in the changeset (**seed stability is a public API promise**). Add a `generatorVersion` field to `Plant`.
- **Visual (Playwright):** screenshots of a fixed-seed scene per species and style at fixed times (`t=0.3`, `t=1`). Use a tolerance threshold.
- **Perf (manual plus scripted):** the stress test page records the average frame ms with 100 plants. Target: **60 fps on a mid-range laptop iGPU at 1080p with ~100 plants, and under 25 draw calls**.

---

## 12. Phases and acceptance criteria

Implement strictly in this order. After each phase, run lint, typecheck, and tests, and commit.

| # | Phase | Deliverable | Acceptance |
|---|---|---|---|
| 1 | **Scaffold** | The monorepo, tooling, CI (lint, test, build), and ESLint boundary rules | `pnpm build && pnpm test` passes on an empty skeleton |
| 2 | **Core math** | RNG, noise, curves and frames, colour, and the types in §2 | Unit tests pass (§2 acceptance) |
| 3 | **Single flower, minimal render** | `straightStem`, the petal shape, daisy assembly, and a bare three.js viewer with the instanced petals plus tube stems, basic Lambert material, and **GPU growth animation** | A daisy grows in the playground with a timeline scrubber. Scrubbing back and forth is exact. |
| 4 | **Genome and species v1** | `GENES`, `sample/blend/mutate`, daisy, rose, tulip, and the contact sheet | **Stop and get user feedback** on the contact sheet before continuing |
| 5 | **Botanical style** | The normal+depth pass, ink edges, veins, wrap diffuse, and the paper option | A daisy and a rose look like illustrations at the 3 test camera angles. User review. |
| 6 | **Vines and the trellis** | `vineWalker`, the polyline guide, the morning-glory species, and the trellis editor tab | A vine climbs an arbitrary drawn polyline and flowers. It works in 3D (helical wrapping) and from any camera angle. |
| 7 | **Garden scale** | Buffer pool, scheduler (time-sliced generation, idle spawn, wilt/retire, adaptive budget), the stats panel, and wind | 100 plants at 60 fps on the test machine. Retirement frees memory (the pool usage graph is stable over 10 minutes). |
| 8 | **Overlay and DOM guides** | `Overlay`, the border/corner/between guides, scroll and resize sync, alpha-correct post, reduced motion, and the web component | The §7 acceptance demo works, and the text underneath stays selectable and clickable. |
| 9 | **More generators and species** | `spaceColonization`, `lsystem`, inflorescences, sunflower, lupine, and fern | The contact sheets are reviewed. |
| 10 | **Watercolor and realistic styles** | The watercolor shader and the realistic style | Style switching at runtime has no regeneration. |
| 11 | **Optional workers and polish** | Web Worker generation, docs site, examples, package READMEs, and changesets | `pnpm pack` produces installable packages, and a fresh Vite project can install and run the quick-start. |

---

## 13. Pitfalls and rules for the implementing agent

1. **No `Math.random` or `Date.now` in `core`.** Time is always an input. Lint it (`no-restricted-properties`).
2. **Never use Frenet frames** for tubes or organ orientation. Use parallel transport.
3. **Avoid per-frame allocations** in the render loop (no `new Vector3` in `update`). Reuse temporaries.
4. **Do not create more than one WebGL context per page.** Share one through the overlay singleton.
5. **Post-process alpha** must be premultiplied and preserved in overlay mode. Test against both a white and a dark page background.
6. **Dispose** geometries, materials, render targets, and textures in `dispose()`. Add a test using `renderer.info.memory` before and after create/destroy cycles.
7. **Check the three.js version docs** before using any API. Names such as `addUpdateRange`, MRT, and the `WebGLRenderTarget` options have changed between releases.
8. **Keep shaders in separate `.glsl.ts` string modules** with clear sections (growth, shape, wind, style hooks, so each style injects without copy-pasting).
9. **Seed stability:** any change that alters the output for an existing seed must bump `generatorVersion` and add a changeset note.
10. **Do not hard-code gene names** outside the `GENES` registry and species files.
11. **Keep the public API small.** Anything not listed in §10 stays internal.
12. When blocked or uncertain about the visual quality (petal shape, colour, line quality), **stop and ask the user** rather than guessing. These are judgement calls for a human.
13. Write `docs/decisions.md` entries as you go (date, decision, reason).

---

## 14. Open items to confirm with the user during implementation

- Final package names and npm scope (`@flower-grower/*` is a placeholder).
- License (MIT is the default suggestion).
- Whether MSAA plus alpha-to-coverage is acceptable for petals, versus a fully dithered approach (decide in phase 5 after seeing both).
- Minimum browser targets (assumed: the last 2 versions of evergreen browsers with WebGL2).
