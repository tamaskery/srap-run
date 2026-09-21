# SRAP Run Project State

Repository: https://github.com/tamaskery/srap-run

## Current milestone

M4 PASS — navigation, laptop performance and bounded production Chrome release QA on M3 baseline 88ea788. See docs/M4_RESULTS.md. M0–M3 remain closed. M4 changes only tests and documentation; production gameplay and visuals are frozen.

## Frozen decisions and boundaries

- Standalone single-player WebGL2; Babylon.js + TypeScript + Recast V2, pinned dependencies and local WASM.
- One Mester Árpád tér mission: five of eight bottles, one recycling trip, separate Ecseri exit; lethal damage takes priority and replay starts fresh.
- Authored layout, both SRAP openings, collision/nav/LOS proxies, hostile AI, civilian loops and hiding rules remain intact. Roads are background scenery.
- Fixed orthographic heading with pan/zoom/recenter; rendering cutaways retain solid proxies. Use visible approaches before SRAP's cutaway opens.
- M3 stone/olive/terracotta materials, humanoids, compact HUD and synthesized audio are unchanged. No downloaded assets or new dependencies.

## Architecture

square.ts owns authored gameplay data. WorldArt adds presentation-only geometry, shared materials/textures, character rigs and bottles. Dressing merges by material and cutaway group and never enters navigation/LOS or intercepts clicks. Create WorldArt after right-handed scene setup; tiled textures use wrap addressing.

MissionHUD/RunAudio observe authoritative state. HUD mounts once; audio unlocks on input, supports mute and disposes with the scene. SceneRuntime owns gameplay/cutaway/reset. Existing Diagnostics measures render intervals and simulation cost; M4_REALTIME=1 runs the mission test with the normal clock and attaches timings.

## Verified baseline

- npm run build and final npx tsc --noEmit PASS; npm test 28/28 PASS.
- Production Chrome: 9 focused boot/input/navigation checks, 2 M4 square/startup checks, complete mission with deterministic and real-time clocks PASS.
- 1920 × 1080 mission and 1366 × 768 layout checked. Collection, chase/escape, damage, SRAP recycling, both openings, success/failure and fresh replay work; no runtime errors or warnings in the real-time mission.
- i5-13450HX laptop, actual Intel UHD/ANGLE renderer, headed Chrome 153: typical 52–54 FPS from median frame intervals. One 42.1 FPS five-second fountain segment did not recur in three 12-second checks (46.5–47.0 FPS minima). No measured >100 ms travel stalls or dropped steps; no progressive degradation. Not a locked-60 or all-hardware claim.
- Reproduce with production preview port 4175, TEST_URL=http://127.0.0.1:4175 and BROWSER_CHANNEL=chrome; commands and measurement limits in docs/M4_RESULTS.md.

## Limits and next bounded task

M4 complete; stop. Current functional/visual baseline is frozen for a separately requested art-direction comparison. Pixel-art/Commandos hybrid exploration, ambient soundscape and traffic remain deferred. No known release blocker remains in the audited V1 routes.
