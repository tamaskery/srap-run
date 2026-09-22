# SRAP Run Project State

Repository: https://github.com/tamaskery/srap-run

## Current milestone

G5 surface pass, baseline b465c29, branch codex/g3-production-art.
Three substantial visual iterations complete; stopped at the authorised budget
checkpoint. TECHNICAL PASS; VISUAL WEAK against the semi-realistic target.
PERFORMANCE PASS in the bounded G4 comparison. One initial stall sample did not
reproduce in court-only confirmation; retained/disclosed in docs/G5_SURFACE_PASS.md.
Committed matched images: docs/art/g5. Raw capture/timing/video: evidence/g5.

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

## Verified baseline and acceptance

- Production build/typecheck PASS (existing bundle-size warning).
- 34/34 unit/asset tests; 8/8 focused production Chrome regressions PASS.
- Full alternate mission, doorway controls, LOS, SRAP/pavilion cutaways,
  actor pause, ordinary launch and replay exercised.
- Captured G4/G5 definitions equal; no capture page errors. Gameplay, navigation,
  camera, actor sources and all public asset bytes unchanged from b465c29.
- Replays retain 240 meshes, 127 materials, two skeletons, six animation groups,
  one navmesh/input adapter/scene. No progressive resource growth observed.
- Reproduce with scripts/g5-review.mjs, g5-motion.mjs, g5-verify.mjs and separately
  g5-performance.mjs. Saved G4 build: evidence/g5/g4-dist. Do not run browser
  captures/tests or builds while measuring performance.

## Remaining boundary

Surface coherence is improved; target still not achieved. Architecture remains
repetitive, western vegetation primitive, interior plain and pavilion fronts dark.
Further site-specific art has high expected value; additional blanket noise does
not. BIF/background, richer interior, foliage silhouettes and furniture remain
untouched at this checkpoint. New ambience/gameplay systems remain deferred.

The next bounded visual task needs authoring beyond repeating this surface pass;
no extra work is authorised by this state file. Headless timings do not certify
all hardware or resolve historical headed/G1 parity.
