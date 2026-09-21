# SRAP Run Project State

## Project

Standalone single-player browser stealth/collection game based on Mester Árpád tér, Budapest.
Repository: https://github.com/tamaskery/srap-run

## Current milestone

Research and architecture baseline complete. Documentation only; no application, dependencies, or runtime proof exists.
Rationale/sources: [Research baseline](docs/RESEARCH_BASELINE.md).
Next executable specification: [M0 technical proof](docs/M0_TECHNICAL_PROOF.md).

## Frozen product decisions

- One controllable character; elevated 3D camera; Chrome/Edge first; keyboard and mouse.
- Explore, collect equal-value bottles/cans, evade threats, recycle in SRAP, exit, result, replay.
- Unlimited bag; one final recycling transaction with any positive count; no further collection after recycling.
- Score prioritises recycled count, then health/time; no rarity/deposit tiers.
- One enterable building, fictional SRAP; all others are exterior shells.
- Playable square, immediate pedestrian circulation and SRAP; neighbours are visual context.
- One hostile pedestrian archetype in v1; ambient pedestrians separate from threat AI.

## Technical decisions

- Babylon.js + TypeScript + Vite for M0; WebGL2 baseline; no physics/UI framework.
- Verified Babylon 9.27.1 Navigation V2 source; matching Babylon packages and Recast 0.43.0 for M0, locked locally.
- Explicitly initialise/inject local Recast modules/WASM; no runtime CDN dependency.
- One static navmesh from gameplay proxies, including SRAP; shared constrained kinematic motor for keyboard/path movement.
- Orthographic camera, fixed scene-specific heading/pitch, pan/zoom; no rotation control.
- Typed TS scene definitions plus stable GLB node IDs; gameplay data separate from visuals.
- Plain HTML/CSS HUD; explicit run state and NPC state machine; no ECS framework/editor/backend.
- Blender -> GLB; restrained PBR, one sun/selective shadows, environment fill; profile before expanding art.
- OSM/municipal geometry plus gameplay-tuned manual modelling; proposed map is a hybrid reference.
- Authored roof/façade render groups, independent navigation and sight-blocking proxies.
- Background traffic follows paths outside playable carriageways; no vehicle physics/simulation.

## Architecture boundaries

- Device input -> actions/movement intent -> PlayerController -> NavigationService; controller owns player position.
- Core systems never import the Budapest scene or embed its coordinates.
- Scene content provides starts, routes, zones, assets, camera bounds and spawns.
- Run state owns collectible IDs/counts, health, stamina, phase and active elapsed time.
- Render visibility never changes navigation or NPC line of sight.
- No Scenario Builder, SCORM, Moodle or previous Three.js project dependency.

## Visual target

- `references/proposed-square-map.png`: conceptual map; correct material geographic discrepancies.
- `references/v1-aspiration.png`: achievable v1 target, user-confirmed despite filename.
- Both `references/v2-visual-target*.png` images: future aspirations only.
- No supplied real-area photograph. Municipal map and OSM inspected; not every as-built detail established.
- Readability/place identity take priority over density or photographic fidelity.

## Assumptions requiring prototype validation

- WASM packaging, continuous movement, doorway clearance, input switching: M0.
- Fixed camera, cutaways, hiding/detection, complete run/reset: M0.
- 1080p >=30 FPS: M0 functional baseline, then mandatory representative-art gate.
- Character retargeting/population, shadows, compression and map readability: later art/map validation.

## Out of scope

No multiplayer, accounts, save/resume, combat, gamepad requirement, editor, streaming, full supermarket or city simulation.
No purchases or game implementation in the research milestone.

## Known blockers / limitations

No product decision blocks M0. Runtime performance/package integration remain untested.
Reference laptop not yet recorded; M0 must identify hardware rather than claim universal laptop performance.
Marketplace candidates are not purchased or individually cleared for browser redistribution.
Detailed 2026 as-built geometry/map heights remain M1 checks, not M0 blockers.

## Next milestone

M0: primitive-only technical proof using the linked specification; do not start automatically from research.

## Next milestone acceptance

- All M0 functional acceptance rows pass in current Chrome and Edge.
- No tunnelling, duplicate interactions, stale paths or incomplete replay reset.
- Production preview loads local dependencies under root and subdirectory hosting.
- Recorded 1080p performance gate passes on identified integrated-GPU laptop, or M0 remains unpassed.
- No real map, purchased/polished assets, traffic, audio or combat added to M0.
