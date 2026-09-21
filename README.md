# SRAP Run — Mester Árpád tér

A playable browser stealth/collection mission built with Babylon.js, TypeScript and Recast Navigation V2.

## Play

```sh
npm ci
npm run build
npm run preview -- --port 4173
```

Open http://127.0.0.1:4173/. For development: `npm run dev -- --port 5173`, then http://127.0.0.1:5173/.

Start at the Ecseri approach. Collect at least **5 of 8 bottles**, recycle once at **SRAP**, then cross the square to the **Ecseri exit**. The outer walks are safer; the shorter pavilion/fountain route crosses a patrol. Sprint to gain distance, break sight around solid cover, and stop inside a green shelter. Staying in contact with the hostile NPC can kill you. Replay starts a fresh mission.

Click ground to move or a bottle/recycler to approach and interact. **WASD/arrows** move; **Shift** sprints; **E** interacts nearby; **Escape** cancels a command or pauses. **Middle-drag** pans, **wheel** zooms, **Home** recentres. Changing tab/window pauses the game; Resume accepts fresh input.

## Scope and architecture

The authored 76 × 44 m pedestrian square follows the major relationships in `references/proposed-square-map.png` and the research corrections: elongated square, southern SRAP frontage, western rounded pavilions, central Fókák fountain, eastern gardens, and adjoining road/building masses. Dimensions and heights are gameplay approximations, not a survey. SRAP has a playable cutaway interior, recycling bay and west side exit. M3 adds shared stylized environment art, animated humanoids, a compact HUD and synthesized feedback audio.

`src/square.ts` owns gameplay geometry, landmarks, bottles, patrol, shelters, cutaway regions, camera framing and mission text. `src/art.ts` adds non-colliding visual dressing; `src/presentation.ts` owns HUD/audio feedback. Shared input, movement, navigation, AI, interactions, health/stamina and replay consume that data. Cutaways retain physical proxies and authored building bases.

Node 24.19.0 / npm 11.17.0 were used. Dependencies are exact-pinned. WebGL2 is required; the Recast WASM is bundled locally. No backend, runtime CDN or external art download is required.

## Focused verification

```sh
npm test -- src/square.test.ts src/definition.test.ts src/gameplay.test.ts
npm run build
```

With preview running, in PowerShell:

```powershell
$env:BROWSER_CHANNEL = 'chrome'
npm run test:e2e -- tests/navigation.spec.ts tests/input-browser.spec.ts tests/square.spec.ts
```

The square test is one coherent mission and replay scenario using real browser input and production systems, with a controlled simulation clock. Reports/screenshots stay in ignored `test-results/`. Historical raw evidence stays in ignored `evidence/`.

Normal launch opens the square. `?debug&scene=square` enables diagnostic hooks; `?debug` preserves the original M0 fixture and scene selector. `&deterministic` freezes automatic ticking only in debug mode for the acceptance driver. These URLs are developer tools, not extra player missions.

M0 CLOSED — FUNCTIONAL TECHNICAL PROOF COMPLETE. REPRESENTATIVE PERFORMANCE DEFERRED TO V1 STABILIZATION (M4). Historical performance scripts are retained but are not an M1 gate. Current scope and results: [project state](PROJECT_STATE.md), [M3 results](docs/M3_RESULTS.md).
