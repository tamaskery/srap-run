# SRAP Run Project State

Repository: https://github.com/tamaskery/srap-run

## Current milestone

G3 resource-limited production-art checkpoint on codex/g3-production-art.
TECHNICAL PASS; VISUAL improved but still WEAK; PERFORMANCE NEEDS WORK.
The approved visual target and consistent G1 performance parity are not reached.
No map-wide asset rollout. Report: docs/G3_PRODUCTION_ART.md; local gallery:
evidence/g3/index.html. No push, deployment or purchase.

The supplied G1/G2 implementation was uncommitted on M4 9e07cfc; commit 6993284
preserves it before G3. Pre-existing AGENTS.md and supplied design/reference files
remain outside the art commits. Pixel work stays separate.

## Frozen decisions

- Babylon.js/TypeScript/Recast V2 WebGL2; pinned dependencies, local WASM.
- One Mester Árpád tér mission: five of eight, unlimited bag, one recycling trip,
  separate Ecseri exit; lethal damage wins; fresh replay.
- Same map, item positions, SRAP openings, collision/nav/LOS, player movement,
  threat/civilian behaviour, hiding, damage, controls and fixed camera.
- Budapest 2026; SRAP gameplay store; LIDR only on the specified red-roofed
  background store, grey commercial shell unbranded. Preserve BIF, three pavilions
  and Fókák as seals. Roads stay scenery. G1 hero/G2 watcher bytes unchanged.

## Architecture and art

square.ts owns gameplay data. WorldArt/slice.ts own presentation. G3 court loads
public/assets/g3/court.glb using opaque StandardMaterial with correct gamma-space
texture sampling. Fixed/SRAP batches retain cutaway ownership and cannot pick.
Planter visible clones have independent UV buffers; proxies remain untouched.
contact.ts adds one non-pickable feathered strip mesh below zone surfaces.
Scene disposal owns resources; no shared replay cache, dependency or postprocess.

G3 adds open leaf crowns at existing anchors, coherent SRAP wing/glazing/roof,
neutral sun/fill, contact grounding and CC0 Poly Haven paving. Source/licence and
rebuild: assets-source/g3/README.md. Export: 22,710 triangles, 2,633,216 bytes;
39% fewer triangles and 25% smaller than G2. Estimated colour-texture storage
rises from 5.33 to 9.33 MiB. Historical G2 court retained for reproduction.

## Verified baseline

- Final build/TypeScript PASS; 33/33 unit/asset checks PASS.
- 18/18 focused production Chrome checks PASS, then 2/2 affected checks after
  final planter correction. Full mission, doorways, threat, input, pause, cutaway
  and replay covered. Captured definitions equal G2; frozen source files unchanged.
- Replay: 255 meshes, 129 materials, two skeletons, six animation groups, one
  navmesh/input adapter/scene. No capture page errors. Normal/wide/detail,
  1366x768, greyscale/proxy/cutaway and motion evidence. Hero stays about 25 px.
- Final G1/G2/G3 comparison: Chrome 153/Intel UHD ANGLE, headless, span 64,
  4 s warm-up + 12 s idle/walk/sprint/court, two alternating repeats. G3 moving
  medians roughly 2-7% below G2; idle mixed. G3 12.3-12.6 then 10.8-11.2 ms;
  G1 9.8-10.1 then 11.3-11.8 ms. All 24 segments: zero >100 ms stalls/dropped
  steps. Control drift is material; G1 parity is not established. No all-hardware
  or headed-60-FPS claim. Reproduce: node scripts/g3-performance.mjs, with saved
  G1 evidence/g2/control-dist and G2 evidence/g3/g2-dist builds.

## Limitations and next bounded work

Assets/materials still fall short of the reference: simple pavilions, Fókák,
background façades, shrubs and roofs; abrupt paving-family boundary. Performance
exceeds the G1 review gate in some matched samples. Probes implicated court
material/receiving and foliage workload. Casters-only removal, static freezing
and paving masking did not justify production changes. Leaf self-shadow removal
was rejected and reverted. Remaining cost is not fully isolated.

Next: deeper slice asset/material authoring plus stable residual-cost profiling.
Extend to the central square only after technical, visual and performance gates
all pass. No ambience population or expanded playable scope in this milestone.
