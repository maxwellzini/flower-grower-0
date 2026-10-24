# Plan 00 Tracker

Tracks progress against [plan00.md](plan00.md). Update the row for a
phase when you start it and when you finish it. Do not mark a phase
`Done` until every acceptance criterion in the plan is met.

**Status values:** `Not started`, `In progress`, `Blocked`,
`Awaiting review`, `Done`

**Review column:** `Yes` means the plan requires a human review before
moving on. Set the status to `Awaiting review` and ask the user.

| # | Phase | Status | Review | Started | Finished | Commit(s) | Notes |
|---|-------|--------|--------|---------|----------|-----------|-------|
| 1 | Scaffold | Done | No | 2026-10-23 | 2026-10-23 | ec97aa3 | |
| 2 | Core math | Done | No | 2026-10-23 | 2026-10-23 | 920370e | |
| 3 | Single flower, minimal render | Done | No | 2026-10-23 | 2026-10-23 | f72d718 | |
| 4 | Genome and species v1 | Done | Yes (contact sheet) | 2026-10-23 | 2026-10-23 | b1e6dd6, f408a18 | |
| 5 | Botanical style | Awaiting review | Yes (look) | 2026-10-24 | | 2509aef | |
| 6 | Vines and the trellis | Not started | No | | | | |
| 7 | Garden scale | Not started | No | | | | |
| 8 | Overlay and DOM guides | Not started | No | | | | |
| 9 | More generators and species | Not started | Yes (contact sheets) | | | | |
| 10 | Watercolor and realistic styles | Not started | Yes (look) | | | | |
| 11 | Optional workers and polish | Not started | No | | | | |

## Acceptance checklist detail

Tick items as they are verified. Add sub-items if a phase needs them.

### Phase 1: Scaffold
- [x] Monorepo, tooling and CI in place
- [x] ESLint boundary rules block three/DOM imports in core and species
- [x] `pnpm build && pnpm test` passes on the skeleton

### Phase 2: Core math
- [x] RNG determinism and fork independence tested
- [x] Curve frames are orthonormal (tested)
- [x] Plant types JSON round-trip (tested)
- [x] OKLCH conversion matches known values

### Phase 3: Single flower, minimal render
- [x] Daisy grows in the playground
- [x] Timeline scrubbing forward and back is exact

### Phase 4: Genome and species v1
- [x] `GENES` registry, sample, blend and mutate with bounds tests
- [x] Daisy, rose and tulip species
- [x] Contact sheet page with live 3D thumbnails
- [x] User feedback received on the contact sheet and incorporated

### Phase 5: Botanical style
- [x] Normal and depth pass, ink edges, veins, wrap diffuse
- [x] Looks right at the 3 test camera angles
- [ ] User review done
- [x] Petal transparency method decided (opaque depth pass with post-process edge softness)

### Phase 6: Vines and the trellis
- [ ] `vineWalker` follows an arbitrary drawn polyline
- [ ] Helical wrapping looks right from any camera angle
- [ ] Morning-glory species and trellis editor tab

### Phase 7: Garden scale
- [ ] 100 plants at 60 fps on the test machine
- [ ] Under 25 draw calls
- [ ] Pool usage stable over 10 minutes (retirement frees memory)

### Phase 8: Overlay and DOM guides
- [ ] Border, corner and between-elements demo works
- [ ] Scroll and resize stay aligned
- [ ] Text underneath stays selectable and clickable
- [ ] Alpha correct on light and dark backgrounds
- [ ] Reduced motion respected
- [ ] Web component shares one WebGL context

### Phase 9: More generators and species
- [ ] Space colonization and L-system generators
- [ ] Inflorescences, sunflower, lupine, fern
- [ ] Contact sheets reviewed

### Phase 10: Watercolor and realistic styles
- [ ] Watercolor style
- [ ] Realistic style
- [ ] Runtime style switching with no regeneration

### Phase 11: Optional workers and polish
- [ ] Web Worker generation
- [ ] Docs, examples and package READMEs
- [ ] `pnpm pack` output installs and runs in a fresh Vite project
