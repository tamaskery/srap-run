# G3 — production-art checkpoint

2026-09-22 · branch `codex/g3-production-art`.

**TECHNICAL: PASS · VISUAL: IMPROVED, STILL WEAK · PERFORMANCE: NEEDS WORK.**

Stopping condition: **RESOURCE LIMIT**, not target reached. Four coherent visual
iterations and narrow rendering probes improved the slice, but did not establish
the approved semi-realistic target or repeatable G1 performance parity. Further
small adjustments have poor expected return within this run's remaining budget.
No map-wide asset rollout, new playable content, purchase, push or deployment.
Further visual development remains high-value with deeper environment authoring;
no engine limitation or requirement to buy assets was demonstrated.

## Baseline

The checkout was not a committed G2 baseline: HEAD was M4 `9e07cfc`, with G1/G2
uncommitted. `6993284` checkpoints that implementation before G3. Original build
and matched captures: `evidence/g3/g2-dist` and `before-*.png`.
Pre-existing AGENTS.md edits and supplied untracked design-guide/reference files
remain outside the art commits. Nothing was overwritten, stashed or deleted from
that supplied work. PROJECT_STATE.md is updated for this milestone.

## Iterations

1. **Materials/structure:** opaque diffuse court materials, neutral sky fill,
   stronger sun separation, roof seams/fans and deeper glazing value bands.
   One feathered ambient-contact mesh grounds existing solids. An initial dark
   texture conversion was corrected: StandardMaterial requires gamma-space
   samples, so this import disables PBR's GPU sRGB decode.
2. **Vegetation:** taller crowns and visible trunks at the same anchors; open
   opaque leaf clusters replace smooth tree cores with fewer leaf triangles.
   No new trees, transparency stacks or wind system.
3. **SRAP/planters:** the fixed east wing gains the same roof/fascia/glazing
   treatment with its existing cutaway ownership. An overlapping planter skin
   produced bands and was removed. Final cladding uses independent UV buffers
   on the existing visible shells; navigation geometry remains unchanged.
4. **Surfaces:** one concrete scan replaces synthetic paving, at a 2.7 m repeat
   and 1.70 diffuse gain. The first dark/tightly scaled capture was rejected.
   Final paving and planter cladding add quiet variation without covering zones.

Asset production stays in the eastern court/SRAP slice. Shared lighting/contact
affects existing square solids; other asset families were not rolled out.

## Asset and licence

[Concrete Tiles 02](https://polyhaven.com/a/concrete_tiles_02), Charlotte Baglioni /
Poly Haven, [CC0](https://polyhaven.com/license), verified before integration.
One unchanged 1K diffuse JPEG; its MD5 matches the publisher's metadata. Full
provenance, hashes, adaptation and rebuild: [source card](../assets-source/g3/README.md).
No reference render is shipped. Other court artwork is original project work.
Hero and watcher retain their existing CC0 provenance and exact bytes.

| Court export | G2 | G3 |
| --- | ---: | ---: |
| Triangles | 37,122 | 22,710 (39% fewer) |
| GLB bytes | 3,525,128 | 2,633,216 (25% smaller) |
| Meshes / primitives | 15 / 17 | 20 / 22 |
| Material families | 15 | 15 |
| Colour textures | four 512² | three 512² + one 1024² |
| Estimated RGBA8 + mips | 5.33 MiB | 9.33 MiB |

The paving scan costs approximately 4 MiB more texture storage. Cutaway-specific
batches increase despite reduced triangles. Historical G2 court remains available;
normal gameplay loads only G3 court plus the unchanged hero/watcher.

## Rendering investigation

Original G2 render-only isolation, same camera/simulation: full 15.1/15.0 ms median,
no court casters 15.1, no receiving 14.4, diffuse materials 14.2, foliage hidden
14.1. Foliage and material/receiving work contributed; casters alone did not
explain the regression. These are diagnostic frame intervals, not GPU timings.

Selective leaf-receiving removal flattened the canopy without a sufficient
repeatable gain, so it was reverted. Freezing court transforms/materials gave
9.8 vs 9.8 ms; hiding paving saved only about 0.1 ms. No blanket freeze, shadow
removal, floor rewrite or speculative broad optimisation was retained.

### Final matched comparison

Chrome 153.0.8010.48, Intel UHD / ANGLE D3D11, headless, 1920×1080, DPR 1, span 64.
Existing procedure: 4 s warm-up, 12 s each idle/walk/sprint-exhaustion/court travel.
G1 control → saved G2 → G3, twice. No builds, tests or video during timing.

| Median interval, repeat 1 / 2 | G1 control | G2 | G3 |
| --- | --- | --- | --- |
| Idle | 10.0 / 11.8 ms | 12.0 / 12.0 ms | 12.4 / 11.1 ms |
| Walk | 10.0 / 11.3 ms | 13.3 / 11.9 ms | 12.6 / 11.2 ms |
| Sprint/exhaustion | 10.1 / 11.5 ms | 13.5 / 11.9 ms | 12.6 / 11.2 ms |
| Court | 9.8 / 11.3 ms | 12.6 / 11.5 ms | 12.3 / 10.8 ms |

G3 moving-phase medians are roughly 2–7% below G2; idle is mixed. G3 p95 ranges
15.8–16.3 ms in repeat 1 and 12.2–12.4 ms in repeat 2. **All 24 segments: zero
>100 ms frames and zero dropped simulation steps.** Control drift is substantial,
so a precise speedup is not established. G3 exceeds the approximate 10% G1 gate
in repeat 1; earlier G3 runs also exceeded it. Remaining cost is not fully isolated.

Local startup-to-ready: G1 1.185/.838 s, G2 .958/.744 s, G3 .888/.692 s. These are
warm-machine local observations, not cold/network certification. Headless results
do not replace historical headed M4 evidence or certify all hardware. Raw timing,
renderer, p95 and startup records: `evidence/g3/performance-final.json`.

## Verification

- Final build/TypeScript PASS; existing large-chunk warning remains.
- Final unit/asset checks: **33/33 PASS**, including opaque/embedded court assets,
  geometry budget, contact layering and existing rigs/gameplay.
- Production Chrome suite: **18/18 PASS**; after the final planter correction,
  **2/2 affected art and full alternate-mission/doorway/replay checks PASS**.
- Captured G2/G3 SceneDefinitions exactly equal. `square.ts`, gameplay, navigation,
  camera, input and hero source unchanged from `6993284`. Both actor GLB hashes
  unchanged. All item positions and gameplay openings preserved.
- Replay retains 255 meshes, 129 materials, two skeletons, six animation groups,
  one navmesh, input adapter and scene. These are lifecycle counts, not draw calls.
- No page errors in captures. Normal/wide/detail, 1366×768, greyscale, proxy and
  cutaway images plus final travel/sprint/pause/recenter/zoom video. Final stills
  confirm the planter overlap is gone and zone/doorway surfaces remain visible.

[Local gallery](../evidence/g3/index.html) ·
[Before](../evidence/g3/before-normal.png) · [After](../evidence/g3/slice-normal.png) ·
[Detail](../evidence/g3/slice-detail.png) · [Motion](../evidence/g3/slice-motion.webm).

Reproduce using `scripts/g3-review.mjs`, `g3-motion.mjs`, `g3-performance.mjs`.
Comparisons require preserved G1 at `evidence/g2/control-dist` and G2 at
`evidence/g3/g2-dist`. The browser suite is the G2 report's eight test files,
with production preview port 4195. Do not run capture/tests/builds during timing.
Debug-only isolation modes are in `g3-profile.mjs` and `courtProbe`.

## Remaining boundary

The scene still reads as a stylised prototype beside the supplied reference:
simple roofs/background façades, rounded shrubs, limited glass/crevice response,
abrupt paving-family boundary, primitive pavilions and Fókák sculpture. The hero
stays naturally scaled; facial details were not enlarged for tactical legibility.

Deferred: map-wide art, SRAP interior, pavilion/Fókák rebuild, surrounding façades,
BIF/background refinement and ambience. No pigeons, scooters, traffic or expanded
district. Next bounded work is deeper slice asset/material authoring and stable
residual-cost profiling before extending the family to the central square.
