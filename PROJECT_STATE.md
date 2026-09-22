# SRAP Run Project State

Repository: https://github.com/tamaskery/srap-run

## Current milestone

G4 final slice convergence completed under stopping condition B on
codex/g3-production-art, continuing committed G3 baseline 650aef9.
TECHNICAL PASS; PERFORMANCE PASS relative to G3; VISUAL STILL WEAK.
The representative slice is improved but is not approved as the map-production
art template. No map-wide rollout. Report and committed comparisons:
docs/G4_FINAL_SLICE.md and docs/art/g4/. Local gallery: evidence/g4/index.html.

Pre-existing AGENTS.md edits and untracked design-guide/reference files remain
outside the G4 checkpoint, untouched. No push, deployment or asset purchase.

## Frozen decisions

- Babylon.js/TypeScript/Recast V2 WebGL2; pinned dependencies and local WASM.
- One Mester Árpád tér mission: five of eight, unlimited bag, one recycling trip,
  separate Ecseri exit; lethal damage wins; fresh replay.
- Same map, item positions, SRAP openings, collision/nav/LOS, player movement,
  threat/civilian behaviour, hiding, damage, controls and fixed camera.
- Budapest 2026; SRAP gameplay store; LIDR only on the specified red-roofed
  background store, grey commercial shell unbranded. Preserve BIF, three pavilions
  and Fókák as seals. Roads stay scenery. Hero/watcher binaries unchanged.

## Architecture and art boundary

square.ts owns gameplay data. WorldArt/slice.ts/architecture.ts own presentation.
G3 court.glb, paving, trees, SRAP, lighting and contact strips remain unchanged.
G4 architecture.ts replaces only three pavilion render shells/canopies and the
visible north/south housing and unbranded commercial shell. Original proxies and
low cutaway bases remain; new art cannot pick and inherits existing cutaway IDs.

Six region batches share one opaque StandardMaterial and one original 1024² atlas
(~5.33 MiB extra estimated colour-texture memory including mips). Three pavilions:
1,596 triangles each. Background architecture does not cast or sample shadows;
pavilions retain selective casting/receiving. Opaque faces are culled normally.
Scene disposal owns resources; no shared replay cache, dependencies or postprocess.
Source/provenance/rebuild: assets-source/g4/README.md; all G4 artwork is original.

## Verified baseline

- Build/TypeScript PASS; 34/34 unit/asset checks PASS. Production Chrome suite
  19/19 PASS, followed by final 3/3 affected architecture/actor/full-mission checks.
- Captured G3/G4 definitions equal. Gameplay/navigation/camera/input/actor sources
  and existing public assets unchanged from 650aef9. Three cutaway owners,
  persistent solid LOS, doorway/input, pause, mission and replay verified.
- Replay retains 240 meshes, 126 materials, two skeletons, six animation groups,
  one navmesh/input adapter/scene. Capture page errors: none. Normal/wide/closer,
  greyscale/proxy, 1366x768, cutaway and gameplay motion evidence retained.
- Final alternating G3/G4 comparison: Chrome 153 / Intel UHD ANGLE, headless,
  1920x1080 DPR1 span64, 4 s warm-up, 12 s idle/walk/sprint/court, two repeats.
  G3 medians 10.0–10.4 ms; G4 10.4–11.0 ms (about 2–6% higher). p95 changes
  about -7% to +4%. All 16 segments: zero >100 ms stalls and zero dropped steps.
- Three replay travel medians: 10.2/10.3/10.3 ms; stable resources and no stalls,
  dropped steps or progressive degradation. Startup G3 1.209/1.524 s vs G4
  1.743/1.621 s; small warm-machine sample, not a cold-load certification.
- Reproduce: scripts/g4-review.mjs, g4-motion.mjs, g4-performance.mjs; saved G3
  build is evidence/g4/g3-dist. Do not run captures/tests/builds during timing.

## Limitation and continuation boundary

Single dominant visual limitation: generic architectural surface authoring.
Repeated clean atlas panels and uniform materials still lack the local surface,
recess and reflected-light information of site-specific baked/painted assets.
Further geometry-only detailing is not the next strategy. G4 stops here; a new
art strategy must be established before template approval or any map rollout.

Historical headed/G1 parity remains an unresolved measurement limitation, not
permission for a new broad profiling campaign. Final G4 figures establish only
this bounded G3 comparison, not exact parity or all-hardware/headed-60-FPS claims.
