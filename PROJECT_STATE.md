# SRAP Run Project State

Repository: https://github.com/tamaskery/srap-run

## Current milestone

M2 PASS — world depth implemented and verified locally on the main bfa4b61 baseline. Changes are uncommitted. See docs/M2_RESULTS.md for scope, route tradeoffs and acceptance evidence.

M0 CLOSED — functional technical proof complete. M1 PASS — real square playable vertical slice complete. Do not reopen either milestone.

## Active roadmap

- M2 — World depth: complete.
- M3 — Visual and game-feel production: not started.
- M4 — V1 stabilization: navigation feel, representative performance, browser QA and release.
- M5+ — Post-V1 expansion.

## Frozen decisions and boundaries

- Standalone single-player WebGL2; Babylon.js + TypeScript + Recast V2, pinned dependencies and local WASM.
- One authored Mester Árpád tér mission: five of eight bottles, one final recycling trip, separate Ecseri exit leg. Lethal damage takes priority; replay starts fresh.
- Continuous SRAP interior with front entrance, circulation, screened recycling bay and west side exit. Existing controller/navmesh/interactions/cutaways handle both interior and square.
- One unchanged hostile AI and authored patrol. Visible geometry supplies LOS breaks; three adjacent shelter regions reuse existing stationary concealment.
- Two authored ambient pedestrian loops; no hostile perception or mission effects. No traffic, dialogue, inventory or new interaction framework.
- Fixed orthographic camera heading, pan/zoom/recenter; no rotation. Cutaways change rendering only; wall collision and LOS remain.
- Greybox geometry; no production art, sound or advanced lighting.

## Architecture and retained findings

square.ts is authored content; definition.ts validates it. InputAdapter, PlayerController, ThreatController, InteractionSystem, RunState, NavigationService and disposable SceneRuntime remain the engine. The small AmbientWalker reuses the path-following helper and shares runtime pause/result/disposal/reset ownership.

SRAP cutaway coverage includes north/east approach space: shrinking it to the doorway caused the roof to intercept legitimate floor clicks. Its back wall and internal screen retain solid proxies when revealed.

Existing navigation keeps radius-aware static geometry, a 0.25 m input-step cap, visited-polygon/height checks and no global snapping. The inherited 2 mm numerical surface tolerance remains unchanged.

## Verified baseline

- npm run build: TypeScript and production bundle PASS.
- npm test: 26 unit tests PASS.
- Production Chrome, tests/square.spec.ts and tests/world-depth.spec.ts: 2 complete M2 scenarios PASS. Physical input, real Recast, live threats and a deterministic clock; no teleport/inventory/damage injection.
- Two distinct sets of five cover all eight pickups. Verified keyboard/click entrances, indoor quota/recycling, LOS/collision through cutaways, sprint/cover/waiting, successful exit, lethal failure, ambient pause/result freeze and full replays with stable resources.
- Exterior/interior visual review at 1920 × 1080 PASS. No performance benchmark or new broad Edge certification.
- Retained historical evidence: docs/M1_RESULTS.md; M0 22 unit and 28 browser tests per Chrome/Edge. These historical suites were not re-proved in M2.

## Limits and next bounded action

M2 acceptance is complete. Stop; M3 requires a new request. Existing slightly odd but usable navigation feel remains explicitly deferred to M4 alongside representative performance and final browser release checks. Traffic is deferred. No commit, push or deployment was requested or performed.
