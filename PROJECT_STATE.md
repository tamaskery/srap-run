# SRAP Run Project State

Repository: https://github.com/tamaskery/srap-run

## Current milestone

M1 PASS — real square playable vertical slice complete. One authored square mission is playable. See [M1 results](docs/M1_RESULTS.md).

M0 CLOSED — FUNCTIONAL TECHNICAL PROOF COMPLETE.
REPRESENTATIVE PERFORMANCE DEFERRED TO V1 STABILIZATION.

## Active roadmap (supersedes older granular plans)

- M1 — Real square playable vertical slice.
- M2 — World depth: route/risk depth, SRAP interior, ambient life and interactions.
- M3 — Visual and game-feel production: art, lighting, UI, sound and ambience.
- M4 — V1 stabilization: representative performance, browser QA and release.
- M5+ — More locations, missions and systems.

## Frozen decisions and boundaries

- Standalone single-player WebGL2 browser game; Babylon.js + TypeScript + Recast V2, pinned dependencies and local WASM.
- The default scene is the authored Mester Árpád tér greybox. Reference: `references/proposed-square-map.png`, corrected major relationships from the research baseline. Gameplay-adjusted dimensions; no survey/as-built claim.
- Five of eight equal-value bottles required; unlimited bag; one final recycling trip; no collection after recycling; a separate exit leg. Lethal damage takes priority. Fresh replay after either result.
- One existing hostile AI controller, authored patrol and two visible shelter regions. No combat, civilian/traffic systems, interior production or new framework.
- One static radius-aware navmesh and shared constrained movement. Cutaways affect rendering only; permanent building mass, collision and LOS remain.
- Fixed authored camera heading, orthographic pan/zoom/recenter. No free rotation.

## Architecture and retained integration findings

`square.ts` is content data. `definition.ts` validates geometry, scene presentation and mission configuration. Existing InputAdapter, PlayerController, ThreatController, InteractionSystem, RunState, NavigationService and disposable SceneRuntime remain the engine.

Generic additions: mission quota/text, material colors, elliptical footprints, presentation-only details/labels, authored camera framing/heading and cutaway base heights. Rounded Recast contours exposed a valid step approximately 0.25 mm beyond its requested length; displacement guards now use the same 2 mm surface tolerance as agent validation. The 0.25 m input-step cap, visited-polygon/height checks and no-global-snap rule remain intact.

## Verification and preservation

- M0 retained evidence: 22 unit tests; 28 Chrome and 28 Edge functional tests. No M0 benchmark rerun.
- M1: TypeScript and production build pass; 21 targeted unit tests pass; 8 production Chrome browser checks pass (7 affected navigation/input regressions plus one complete square mission scenario). Visual review at 1920 × 1080 passed. No benchmark was run.
- Existing recovery: `C:\Users\tamas\Documents\ChatGPT\Srap-run-recovery-20260921-130125`. All 27 original implementation/test/tool files matched before M1 edits; no redundant copy was made.
- Initial main/remote HEAD: `511fd967181e7d4ccbe090a3650128f666b2e352`. M0 source was uncommitted and is preserved alongside M1 for the authorized coherent baseline commit.

## Limitations and next bounded action

Greybox only: approximate geometry, simple actor/landmark shapes, no SRAP interior, traffic, civilians, sound or production art. Representative performance is deferred to M4; no performance certification is claimed.

M1 acceptance is complete. Preserve the coherent playable baseline in Git and stop. M2 requires a new request.
