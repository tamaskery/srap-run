# SRAP Run V1 release checkpoint

Verified game commit: `5d680c8fde068581b5f5d86754b91ed57ec5b294`.
Production distributable: `dist/` (fresh `npm run build`, ignored by Git).

## Scope

V1 freezes the G6 visual baseline, M5 mission feedback and audio, M6 modest ambient life, and the committed pavilion placement and screen-relative keyboard correction. No new gameplay or visual scope was added during this gate. The pavilion and control correction passed a human playtest before this release gate.

## Verification (2026-09-23)

- `npm run build`: TypeScript and Vite production build passed. The existing large chunk warning remains.
- `npx vitest run --configLoader runner`: 35/35 tests passed. The runner option avoids this environment's esbuild config loading access error.
- Production Chrome browser gate: the complete five-bottle mission passed through live chase, SRAP recycling, Ecseri exit, success, failure, and fresh replay. WASD and arrows moved in all eight expected screen directions. Pavilion cutaways, SRAP doorway and interior, collision routes, HUD objectives, pause/resume, mute, and replay audio ownership passed.
- Two legacy `tests/navigation.spec.ts` cases use input vectors tied to the previous camera mapping and fail after the intentional control correction. A direct check with the corrected vectors reached both doorway targets, stopped at the wall and narrow opening, and dropped zero simulation steps. The current square navigation test passed unchanged.
- Four-second representative production Chrome/Intel UHD sample at 1280×720: 282 meshes, 7.0 ms median and 9.7 ms p95 frame time, zero frames over 100 ms, zero dropped simulation steps. This is within the documented healthy M5/M6 range (M6 median 6.5 ms, p95 7.8 ms in a matched earlier sample); no clear regression was observed.

## Accepted limitations

- The G6 visual baseline is frozen; rejected G7–G10 visual experiments are outside V1.
- Vite reports the previously accepted large chunk warning.
- The two old navigation cases need their camera-direction fixtures updated before they can pass unchanged.
