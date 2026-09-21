# M2 — World depth

## Scope

The original five-of-eight mission remains: collect, recycle once, reach Ecseri; death still fails the run. M0 is closed and M1 remains the baseline (main at bfa4b61). M3/M4 work has not started.

SRAP is now a continuous walkable interior on the same floor/navmesh: four-metre front opening, circulation space, a screened recycling bay and a three-metre west side opening. A solid recycling machine grounds the interaction. The west opening provides an alternate return toward Ecseri. No doors, loading transitions or new interaction framework are needed. The fixed camera uses the existing cutaway mechanism; walls retain their collision/LOS proxies when hidden and the shell restores outside its approach region.

## Authored route choices

Bottle positions and the single patrol loop were reviewed and retained: their existing spacing already provides useful alternatives. Added crossing cover and the two interior openings change the available approach/escape choices without increasing the enemy count.

| Pickups | Tradeoff |
| --- | --- |
| Arrival, pavilion back, south walk | Sheltered perimeter options; detours cost walking time. |
| Pavilion shortcut, fountain | Short central traversal near the live patrol; pavilion corners break sight. |
| Crossing | Patrol-adjacent exposed pickup with a new solid wall and tightly adjacent stopping shelter. Time the crossing, wait in cover or spend stamina to escape. |
| Garden corner, east walk | Longer eastern loop; gardens/hedge block sight and shelter offers recovery. |

Two tested sets of five use all eight authored locations between them: arrival/back/shortcut/fountain/garden and arrival/south/garden/east/crossing. Neither test injects inventory, teleports actors, disables threats or mocks navigation. Sprint escape and waiting in cover use the existing stamina and concealment rules.

## Lightweight life and architecture

Two colored capsule pedestrians walk authored perimeter loops and pause at waypoints. Mesh geometry is shared by cloning the existing capsule. A small AmbientWalker uses the existing path-following helper and static navigation; it has no perception, damage, collision blocking or mission effects. Scene configuration validates actor IDs, paths, color and speed; setup verifies complete navmesh legs. Runtime ownership supplies pause, terminal freeze, disposal and clean replay without an additional reset system.

Changes otherwise remain authored scene content. Player, hostile AI, interaction rules, navigation and camera controller implementations are unchanged.

## Verification

- TypeScript and production bundle: npm run build PASS.
- Unit tests: npm test, 26/26 PASS, including ambient loop/recreation and scene validation.
- Production Chrome: tests/square.spec.ts and tests/world-depth.spec.ts, 2/2 PASS. Two complete sets of five use all eight pickups between them. Checks cover front/side traversal, physical keyboard entry/exit, click travel, under-quota rejection, click recycling, live patrol/chase/search/return, sprint stamina, waiting in visible cover, solid navigation/LOS through cutaways, success/failure and fresh replay.
- Ambient actors move during play, stop on pause/result and reset with identical resource ownership. No browser runtime errors; the main mission also checks console errors.
- Visual review at 1920 × 1080: closed exterior and revealed interior, player/recycler, entrances, threat and route cover are readable. Local screenshots: test-results/m2-start.png, m2-recycled.png, m2-interior.png and mission outcome images.
- Final diff/whitespace review passed. No navigation/hostile-controller rewrite, benchmark or broad historical suite rerun.

The cutaway approach region was extended north/east after real mouse tests showed the roof intercepting valid approach clicks. Geometry remains solid for navigation and LOS. M2 acceptance is complete.

## Limits

Greybox gameplay geometry only. Traffic is deferred; two pedestrians provide the intended ambient activity. Production art, lighting, sound and visual/game-feel production belong to M3. Existing usable-but-imperfect navigation feel and representative performance/browser release coverage remain M4 work. No performance benchmark or broad historical QA cycle was run.

## Play locally

Run npm run build, then npm run preview. Ordinary launch opens the square. Click move/collect; WASD/arrows move; Shift sprint; E interact; middle-drag pan; wheel zoom; Home recenter; Replay starts fresh.
