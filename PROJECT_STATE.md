# SRAP Run Project State

## Current milestone

M5 game-feel pass on branch `codex/m5-game-feel`. G6 (`63a0ff0`) is the accepted production visual baseline. G7-G10 were experimental visual investigations and are rejected for production. They tested additional procedural/detail passes, surface and material authoring, hybrid/2.5D work, generated-image assets, and authored Blender 3D assets. None improved the whole frame enough at the existing span-64 gameplay scale to justify rollout. Their evidence may remain documented, but is not roadmap work.

Do not reopen the visual architecture, replace G6 art, change camera projection or scale, or repeat those experiments unless explicitly requested.

## Frozen decisions

- Babylon.js/TypeScript/Recast V2 WebGL2, pinned dependencies and local WASM.
- Five of eight bottles, unlimited carrying, one recycling trip, separate Ecseri exit, lethal damage priority, fresh replay.
- Preserve map and playable geometry, bottle positions, entrances, navigation, LOS/hiding, hostile chase/damage, fixed orthographic camera and G6 art.
- Square gameplay data belongs in `square.ts`; presentation belongs in `art.ts`, `slice.ts`, `architecture.ts` and `presentation.ts`.

## Verified baseline

G6 build/typecheck, focused unit/asset checks, full mission and replay, cutaways, navigation and performance comparisons passed at `63a0ff0`. Matched G5/G6 frame times were essentially unchanged, with no stalls or dropped steps in the documented segments. See `docs/art/g6` and `scripts/g6-performance.mjs` for reproducible evidence.

## M5 checkpoint

Original synthesized traffic, transport and bird cues share one low-volume city bed and per-run audio ownership. Pickup and recycling confirmations, suspicion cue and objective status improve mission feedback. No art assets, gameplay rules, actor counts or external audio changed. Production build/typecheck, 17 focused unit tests, M5 browser check and complete mission browser test passed in Chrome, including pause/mute, replay cleanup and zero page errors. A bounded four-second Intel UHD browser check with audio unlocked recorded 259 meshes, two civilians, 11.9 ms median frame time, zero >100 ms stalls and zero dropped steps. Existing build-size warning remains.
