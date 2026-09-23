# SRAP Run Project State

## Current milestone

M6 ambient-life pass on branch `codex/m6-ambient-life`, based on accepted M5 (`d603f8c`). G6 (`63a0ff0`) is the frozen production visual baseline. G7-G10 were rejected visual investigations; their evidence is not roadmap work.

Do not reopen the visual architecture, replace G6 art, change camera projection or scale, or repeat those experiments unless explicitly requested.

## Frozen decisions

- Babylon.js/TypeScript/Recast V2 WebGL2, pinned dependencies and local WASM.
- Five of eight bottles, unlimited carrying, one recycling trip, separate Ecseri exit, lethal damage priority, fresh replay.
- Preserve map and playable geometry, bottle positions, entrances, navigation, LOS/hiding, hostile chase/damage, fixed orthographic camera and G6 art.
- Square gameplay data belongs in `square.ts`; presentation belongs in `art.ts`, `slice.ts`, `architecture.ts` and `presentation.ts`.

## Current layout and controls correction

The user identified the pavilion/garden location mixup in G6 and requested regular screen-relative WASD. Three pavilion solids, roofs, and cutaway zones are now in the former northeast planting area; two planted islands and the hedge occupy the former pavilion area. G3 source geometry and G6 foliage follow the new planting positions. W/A/S/D and arrow keys now project up/left/down/right on screen. This is the explicit, bounded exception to the frozen G6 layout. Bottle positions, SRAP entrances, mission rules, and camera projection stay as before.
Verified with production build/typecheck, 14 focused unit tests, eight-direction browser movement check, pavilion cutaways, both doorway/navigation scenarios, and the full mission/replay browser scenario in Chrome. The existing bundle-size warning remains.

## Verified baseline

G6 build/typecheck, focused unit/asset checks, full mission and replay, cutaways, navigation and performance comparisons passed at `63a0ff0`. Matched G5/G6 frame times were essentially unchanged, with no stalls or dropped steps in the documented segments. See `docs/art/g6` and `scripts/g6-performance.mjs` for reproducible evidence.

## M5 checkpoint

Original synthesized traffic, transport and bird cues share one low-volume city bed and per-run audio ownership. Pickup and recycling confirmations, suspicion cue and objective status improve mission feedback. No art assets, gameplay rules, actor counts or external audio changed. Production build/typecheck, 17 focused unit tests, M5 browser check and complete mission browser test passed in Chrome, including pause/mute, replay cleanup and zero page errors. A bounded four-second Intel UHD browser check with audio unlocked recorded 259 meshes, two civilians, 11.9 ms median frame time, zero >100 ms stalls and zero dropped steps. Existing build-size warning remains.

## M6 checkpoint

Three civilian silhouettes now use ordinary clothing and accessories on authored safe routes; the single rigged threat and hero are unchanged. Four small decorative pigeons peck, drift and scatter from the player, with no nav, LOS, interaction or damage authority. All new geometry is original code in `src/art.ts` and `src/ambient-life.ts`; no external assets or dependencies. Scooter and visual traffic were deferred as lower-return additions.

A sequential 1280x720 Intel UHD Chrome sanity pair, audio unlocked, measured M5/M6 medians 6.2/6.5 ms and p95 7.6/7.8 ms over four seconds each. M6 has 282 meshes versus M5's 259, with zero >100 ms stalls and dropped steps in both samples. See `docs/art/m6/README.md` for provenance and scope.
Production build/typecheck, 24 focused unit tests, full square mission, M5 audio/mute and M6 pause/replay browser checks passed with zero page errors. The existing Vite bundle-size warning remains.
