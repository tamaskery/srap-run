# SRAP Run Project State

Repository: https://github.com/tamaskery/srap-run

## Current milestone

M3 PASS — visual and game-feel production on the verified clean main baseline fd506a2668b81a5a082e07d558540c47810bb8e5. See docs/M3_RESULTS.md. M0, M1 and M2 remain closed.

## Frozen decisions and boundaries

- Standalone single-player WebGL2; Babylon.js + TypeScript + Recast V2, pinned dependencies and local WASM.
- One Mester Árpád tér mission: five of eight bottles, one recycling trip, separate Ecseri exit; lethal damage takes priority and replay starts fresh.
- Existing layout, both SRAP openings, collision/nav/LOS proxies, hostile AI, two civilian loops, hiding rules and movement are unchanged.
- Fixed orthographic heading with pan/zoom/recenter. Rendering-only cutaways retain solid proxies; SRAP approach coverage includes north/east space to prevent roof interception of valid floor clicks.
- Grounded stone/olive/terracotta art, low-poly humanoids, compact brass/olive HUD and synthesized audio. No downloaded media or new dependencies.

## Architecture

square.ts remains authored gameplay data. WorldArt (art.ts) adds presentation-only geometry, shared materials, generated textures, simple character rigs and bottles. Static dressing is merged by material AND cutaway group; it never enters navigation/LOS or intercepts clicks. Create WorldArt after setting right-handed scene mode. Tiled textures explicitly use wrap addressing.

MissionHUD/RunAudio (presentation.ts) observe authoritative state. HUD mounts once; audio unlocks on input, supports mute, and disposes with the scene. SceneRuntime retains gameplay/cutaway/reset ownership. One directional sun/1024 shadow map and hemispheric fill; original solid structures and characters cast shadows.

## Verified baseline

- npm run build: TypeScript and production bundle pass.
- npx vitest run src/art.test.ts: 2 focused tests pass (character picking/facing/pause and bottle interaction ownership/hiding).
- Production Chrome, tests/square.spec.ts: one integrated M3 mission scenario passes at 1920 × 1080 with physical input, real Recast/live patrol and a deterministic clock. Collection, sprint escape/search/return, cover, indoor recycling, side exit, success, lethal failure and fresh replay work. Civilian movement, mute/focus, HUD feedback, all SRAP cutaway meshes/restoration and resource reset checked; no runtime/console errors.
- Exterior, interior and results visually reviewed; ordinary non-debug launch inspected live. No historical full suites or formal benchmark rerun.

## Limits and next bounded task

M3 complete; stop. M4 requires its own request: known usable-but-odd navigation feel, representative laptop performance, final tuning, browser/release QA and packaging. Full ambient sound assets/bed and traffic remain deferred. Audio is synthesized feedback, not a sourced soundscape. No formal performance or broad browser certification is claimed.
