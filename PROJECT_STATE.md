# SRAP Run Project State

Repository: https://github.com/tamaskery/srap-run

## Current milestone

G6 environment-density pass from baseline 0e12136, branch
codex/g3-production-art. Two substantial visual iterations complete.
TECHNICAL PASS; VISUAL WEAK against the semi-realistic target, despite a clear
span-64 density/composition improvement. PERFORMANCE PASS in an alternating
matched G5/G6 comparison. Committed matched
images and metrics: docs/art/g6. Raw capture/timing: evidence/g6.

Pre-existing AGENTS.md edits and supplied untracked design-guide/reference files
remain untouched and outside the checkpoint. No push, deployment or purchase.

## Frozen decisions

- Babylon.js/TypeScript/Recast V2 WebGL2, pinned dependencies and local WASM.
- Five of eight, unlimited bag, one recycling trip, separate Ecseri exit;
  lethal damage wins and fresh replay. No gameplay or map expansion.
- Same item positions, openings, collision/nav/LOS, movement/stamina, threats,
  hiding/damage, input, fixed camera and replay semantics.
- Budapest 2026; SRAP gameplay store; red-roofed LIDR; grey shell unbranded;
  preserve BIF, three pavilions and Fokak seals. Actors/public assets unchanged.

## Presentation boundary

square.ts owns gameplay data; art.ts/slice.ts/architecture.ts own presentation.
G5 surface-atlas.ts paints one original opaque 1024-square mipmapped atlas,
replacing G4's atlas at equal resolution. Shared zinc/felt/plaster/glass/window
regions serve G4 architecture and existing SRAP geometry. One extra material
shares the texture for store glazing. No added triangles or runtime textures.

Existing G3 CC0 paving now continues across the original square floor; interior
and gameplay zones remain above it. Six visible SRAP/cover shells have local
cladding and lower-wall values; their geometry is made unique before UV/colour
edits so hidden proxies retain original buffers. Scene disposal owns resources.
No new shadow passes, transparency, postprocessing, dependencies or lighting.
Source/provenance: assets-source/g5/README.md. Existing G3 court GLB unchanged.

G6 adds only presentation geometry: three opaque clustered foliage families
inside existing planting proxies; batched bench/bin, bicycle-rack, bollard and
information-board props; differentiated façade bay rhythms; and shallow SRAP
back-wall shelving/product blocks. Pavilion footprints, triangle guardrail and
cutaway ownership remain exact. Source/provenance: assets-source/g6/README.md.

## Verified baseline and acceptance

- Production build/typecheck PASS (existing bundle-size warning).
- G6 focused unit/asset checks 6/6; focused production Chrome regressions 8/8 PASS.
- Full alternate mission, doorway controls, LOS, SRAP/pavilion cutaways,
  actor pause, ordinary launch and replay exercised.
- Captured G4/G5 definitions equal; no capture page errors. Gameplay, navigation,
  camera, actor sources and all public asset bytes unchanged from b465c29.
- G6 replays retain 259 meshes, 146 materials, two skeletons, six animation groups,
  one navmesh/input adapter/scene. No progressive resource growth observed.
- Matched G5/G6 medians are identical at 9.5-9.8 ms across idle/walk/sprint/court;
  p95 differs by -0.3 to +0.2 ms. All 16 segments have zero stalls/dropped steps.
- Reproduce captures and timing with scripts/g6-review.mjs and
  scripts/g6-performance.mjs. Do not run captures/tests/builds while measuring.

## Remaining boundary

The span-64 composition is materially richer, but close vegetation silhouettes
remain stylised low-poly clusters without natural branch structure. Background
district depth and SRAP stock detail remain intentionally bounded. New ambience,
traffic, weather, actors and gameplay systems remain deferred. Headless timings
do not certify all hardware or resolve historical headed/G1 parity.
