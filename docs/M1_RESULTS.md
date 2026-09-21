# M1 — Real square playable vertical slice

2026-09-21 · **M1 PASS**. M0 remains closed. No performance benchmark or historical GPU investigation was run.

## Playable world and mission

The default game opens the Mester Árpád tér greybox: a 76 × 40 m pedestrian space, southern SRAP shell/frontage, three rounded western pavilions, central Fókák fountain marker, eastern planted cover, the Ecseri approach, Üllői road and limited adjacent building masses including BIF Tower. Source: `references/proposed-square-map.png` plus the corrected relationships recorded in the research baseline. Shapes, proportions, heights and paths are authored gameplay approximations; this is not a survey or a finished visual reconstruction.

Start at the Ecseri approach → collect at least 5 of 8 bottles → evade one live patrol using distance, geometry and visible shelters → recycle once at SRAP → take the final leg to the Ecseri exit. The outer walks offer a longer, safer collection route; pavilion/fountain bottles shorten traversal but expose the player. Health depletion fails the run. Both outcomes support a fresh replay.

## Reuse and bounded extensions

The existing input adapter, player motor, Recast navigation service, patrol/perception/chase/search AI, LOS, concealment, health/stamina, interactions, fixed-step loop and disposable replay runtime are reused. `src/square.ts` supplies the new world and mission data. No scene-specific movement or AI branch was introduced.

Generic configuration now supports mission quota/text, material colors, elliptical footprints, presentation-only background/detail geometry, landmark labels, camera framing/heading and cutaway base heights. Store cutaways retain a permanent end wing and low mass; pavilions have separate groups. Collision/LOS proxies remain active through every cutaway.

A curved contour revealed a numerical movement rejection: a valid Recast surface result exceeded the requested 41.667 mm step by approximately 0.25 mm. Both displacement guards now use the existing 2 mm surface-validation tolerance. The 0.25 m requested-step cap, visited polygon validation, height limits, strict destination validation and no-global-snap rule remain intact. The square route and affected legacy navigation checks cover the correction.

## Verification

- `npm run build`: TypeScript check and production bundle PASS.
- `npm test -- src/square.test.ts src/definition.test.ts src/gameplay.test.ts`: **21/21 PASS**. Includes quota enforcement, one-time transfer, objective ordering and scene validation.
- Production Chrome, `npm run test:e2e -- tests/navigation.spec.ts tests/input-browser.spec.ts tests/square.spec.ts`: **8/8 PASS**. Seven affected legacy navigation/input checks plus one coherent mission scenario.
- The mission scenario uses physical mouse/keyboard input, actual bundled Recast and production controllers. A debug-only deterministic clock advances gameplay for repeatability; it does not teleport actors, inject damage/items, mock navigation or disable the threat.
- Mission evidence: load, keyboard and click movement, curved path traversal, blocked building destination/LOS, camera pan/zoom, authored cutaways, collection, premature exit rejection, live detection/chase/search/return, successful sprint escape into shelter, five-bottle recycling, final success, deliberate lethal contact, and two clean replays. Reset checks include player/threat positions, health/stamina, inventory/phase, concealment/cutaways, camera and resource ownership. No browser console/runtime errors.
- Visual review at **1920 × 1080**: player, traversable space, pavilions, fountain, garden cover, threat/cone and mission destinations readable. Cutaways retain recognizable masses. Screenshots are local in ignored `test-results/m1-*.png`.
- Final Git whitespace/diff check is part of baseline preservation. Raw reports and machine-specific evidence are excluded from source control.

Historical unchanged M0 evidence remains 22 unit and 28 functional browser checks per Chrome/Edge. Only affected checks were rerun. M1 makes no new Edge-wide or performance certification claim.

## Deferred

M2: deeper route/risk design, SRAP interior, ambient pedestrians/traffic and interactions. M3: production environment/character art, lighting, sound, ambience and final presentation. M4: representative performance, final browser/playtesting and V1 release. No M2 work is included or started.

## Launch

`npm run build`, then `npm run preview -- --port 4173`. Open http://127.0.0.1:4173/.

Click move/collect; WASD/arrows move; Shift sprint; E interact; middle-drag pan; wheel zoom; Home recenter; Escape cancel/pause; Replay starts fresh. Debug fixtures remain opt-in under `?debug`; ordinary launch opens only the authored square mission.
