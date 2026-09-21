# M0 Technical Proof

Status: specification only. No M0 code or performance tests exist. Rationale: [Research baseline](RESEARCH_BASELINE.md).

## Objective and boundaries

Prove the smallest complete loop and risky integration points using primitives. This is not a Budapest visual prototype or proof of final-art laptop performance.

Include engine boot, orthographic camera/pan/zoom, both movement inputs, intent abstraction, navmesh, one patrol/threat, suspicion/chase/contact/search/return, health/stamina, hiding, one collectible, bag count, recycling, exit/success, failure/replay, cutaway probe, DOM HUD and frame-time diagnostics.

Exclude real map, polished/premade assets, shopping, animated asset pipeline, multiple hostile archetypes, traffic, audio, full supermarket, combat, save/resume, accounts, gamepad, editor, streaming and WebGPU tests.

## Implementation sequence

1. When M0 is authorised, create minimal TypeScript/Vite application. Pin Babylon core/addons to **9.27.1**, Recast core/generators/WASM to **0.43.0**, and commit lockfile. Use a stable Vite/TypeScript pairing compatible with recorded local Node LTS. Focused test tools: Vitest and Playwright. No UI framework, physics or GLB loader needed for primitives.
2. Boot WebGL2 with one right-handed, Y-up metre convention. Generate primitive/proxy scene from data. Show loading/error/retry states. Initialise local Recast before injecting into `CreateNavigationPluginAsync`; serve WASM locally with base-aware URLs. Avoid default unpkg loading.
3. Build NavigationService and one constrained motor against thin-wall, L-obstacle and disconnected-island fixtures. Then attach keyboard/click adapters.
4. Add fixed orthographic camera/DOM HUD and independent roof/façade render groups versus LOS/navigation proxies.
5. Add one threat/hiding zone, collectible/recycle/exit states, health/stamina and replay.
6. Add second tiny configuration, focused automated scenarios, production-preview checks and measured performance run. Resolve failures before declaring M0 complete.

Simulation: fixed 60 Hz, at most five catch-up steps per frame, render interpolation. Hidden tabs do not accumulate time. Sustained dropped catch-up is a performance failure, not something an FPS counter should conceal.

## Primitive fixture

Main scene: **40 x 30 m** flat playable area, L-shaped obstacle, thin wall, disconnected floor island and small SRAP room with one open doorway. A **100 x 100 m** visual ground plane supplies the camera envelope but is excluded from navigation generation. Roof/near-wall render groups are separate from invisible navigation/LOS proxies. Place the collectible so a detour is required, recycling at the room's far side, exit just outside its doorway.

Capsule player/threat, cylinder collectible, box walls, zone outlines and text labels. Threat patrol includes exposed and occluded segments; hiding zone is near exposure. Debug scenarios may reposition the same actor/item; no ambient population system. Dimensions are test choices, not v1 map/budget commitments.

Second definition: **20 x 20 m** playable area with the same padded visual ground, different start, obstacle, route and objective locations. Same primitive types/core controllers. Developer-only scene selector, no map browser/editor.

## Ownership and contracts

| Boundary | Contract |
| --- | --- |
| SceneDefinition | Immutable IDs, primitive/proxy placement, starts/spawns/routes/zones/camera; no gameplay callbacks |
| InputAdapter | Actions and normalised axes; no device codes in gameplay |
| PlayerController | Movement mode/path arbitration; sole owner of player position |
| NavigationService | Validate start, complete path query, incremental step from current polygon; explicit failure, no teleport fallback |
| RunState | Phase, health/stamina, active time, collectible ID state and counts; inventory not inferred from meshes |
| ThreatController | Perception and last-seen location; shared navigation |
| InteractionSystem | Range/clear approach before RunState change |

Use `navMeshQuery.moveAlongSurface` with a valid current polygon. Check success/visited polygons, update reference and floor height, bound displacement, and block safely on query failure. Never globally snap the destination across obstacles. Do not use default zero polygon references. `moveAlongWithVelocity` takes displacement despite its name; any use must multiply speed by timestep.

### Initial fixture constants

These values make tests reproducible; they are not final balance.

| Parameter | Value |
| --- | --- |
| Player radius/height | 0.3 m / 1.8 m; navmesh accounts for radius |
| Walk/sprint | 2.5 / 4.5 m/s, normalised diagonals |
| Health/stamina | 100 / 100 |
| Sprint drain/recovery | 25/s; recover 20/s after 1 s not sprinting; after exhaustion require Shift release/repress |
| Threat patrol/chase | 1.8 / 3.4 m/s |
| Detection | 8 m; 90-degree horizontal cone; eye-to-body LOS |
| Suspicion | 1 s continuous exposure to chase; decays to zero over 1 s without sight |
| Perception/repath | 10 Hz / maximum 4 Hz; motor stays 60 Hz |
| Contact | <=0.7 m centre distance and clear LOS; 20 damage; shared player cooldown 1 s |
| Search | Go to last-seen point, search 3 s without reacquisition, return to patrol |
| Interaction | <=1.2 m from interaction point, clear segment |
| Doorway | 1.5 m clear; additional test opening narrower than 0.6 m |
| Camera | 45-degree elevation, diagonal heading; orthographic vertical span 15-35 m; clamp ground footprint to bounds |

## Controls and run rules

- Left ground click replaces path; interactable click queues approach-and-interact. New command replaces old.
- WASD/arrows cancel path/pending interaction immediately; release stops without resumption. Ignore world clicks while movement keys are held. Shift requests sprint in either mode.
- E interacts once per press with highlighted nearest valid target. Middle-drag pans, wheel zooms, Home recentres. Escape cancels active command, otherwise pauses.
- Blur, hidden tab, menu and terminal phase clear input; resume needs fresh commands. UI consumes clicks.
- Hiding activates when stopped/non-sprinting in its zone. Unseen entry conceals; a threat observing entry retains last-seen search. Leaving/sprinting reveals. Display hiding state.
- Start `collecting`. Item ID transitions available -> carried once. Positive recycling transfers count once, empties bag, changes phase to `exiting`; no more collection/recycling.
- Crossing configured exit alive in `exiting` succeeds. Early exit does not. Health zero fails; failure takes priority if both happen in one tick.
- Results show recycled count, remaining health and active time; no weighted economy. Replay recreates run entities and resets camera, input, paths, counts, timers, perception and cutaways.

## Functional acceptance

Every row is required in current Chrome and Edge. Automated evidence can cover deterministic behaviour; manual inspection is required for readability.

| ID | Scenario | PASS | FAIL examples |
| --- | --- | --- | --- |
| F01 | Boot production preview | Start usable, no unhandled errors, expected local requests only | Missing WASM, runtime CDN, blank screen |
| F02 | Serve root and `/srap-run/`; cold-cache refresh | Both boot/navigate with correct MIME/base URLs | Root-only URL or cached CDN masks dependency |
| F03 | Inject navigation load failure | Clear error/retry; game stopped until ready | Half-interactive world or silent fallback |
| F04 | Click across L obstacle | Goes around, arrives within 0.2 m | Corner clipping, teleport |
| F05 | Keyboard into thin wall/corners for 10 s under synthetic 30/60/120 Hz render schedules; browser check at supported refresh | No crossing; ground height correct; unobstructed 5 s walk distances agree within 0.1 m | Snap through wall, frame-dependent/diagonal speed |
| F06 | Island/off-mesh target and invalid spawn | Reject target with feedback; invalid scene reports error | Partial route labelled success, island jump |
| F07 | Click -> keyboard -> release -> new click, 20 repetitions | Immediate cancellation, no stale interaction/path | Path fights keys or resumes after release |
| F08 | Doorway both directions/both inputs; narrow opening | Valid door traversable; sub-diameter door blocked | Different clearance or wall jitter |
| F09 | Exhaust/recover stamina; blur/pause while moving | Constants respected; no stuck keys/time/damage | Infinite sprint, hidden-tab damage |
| F10 | Pan/zoom/recentre/resize at bounds | Fixed angle, valid view coverage, visible actor/route | Accidental rotation, wrong picking or distortion |
| F11 | Repeated cutaway crossings and tall-building occlusion | Route visible, no boundary flicker, groups restore | Invisible route, permanently missing roof |
| F12 | Facing away/toward/behind wall | Cue matches cone/range/suspicion; hidden visual wall still blocks LOS | Detection through cutaway, unexplained instant chase |
| F13 | Patrol -> chase -> search -> return and reacquisition | Last-seen rather than live position after LOS loss; bounded search | Omniscient tracking, endless chase/freeze |
| F14 | Hiding entered unseen versus observed | Unseen concealed, observed retains search, exit reveals | Universal invulnerability or invisible sprint |
| F15 | Continuous contact at varied render caps and through wall | Exactly 20 per allowed cooldown, no through-wall damage; zero clamp | Per-frame/double damage |
| F16 | Spam E/click at item/recycler; interact through wall | One pickup/transfer; invalid interaction rejected | Duplicate counts or remote interaction |
| F17 | Zero-count exit; recycle then exit; die at exit | Early exit no win, positive recycle/exit wins, simultaneous death fails | Success without recycling/at zero health |
| F18 | Replay after both outcomes, 10 times | Fresh state; no accumulating actors/listeners/navmeshes | Stale state or leaked scene ownership |
| F19 | Second configuration; duplicate ID/broken reference | Same core works; invalid definition errors useful | Scene-specific controller edits or unchecked references |

## Verification method and performance gate

Vitest: input arbitration, cooldown/time and run-state invariants. Playwright: real bundled navmesh/input for collision/path, duplicate interaction, success/failure and replay. Do not mock path results in integration tests. Manual Chrome/Edge checks cover cutaway/camera/detection readability. Tests must verify behaviour, not mirror implementation fields.

Record machine model, CPU, integrated GPU, RAM, Windows/browser versions, power mode, WebGL renderer, actual drawing-buffer size, refresh rate and DPR. Use hardware acceleration, plugged-in laptop and ordinary background load; report conditions without changing global settings. Test production build at **1920 x 1080 drawing buffer**, not just a 1080p desktop with an oversized high-DPI canvas.

Warm up 30 s, then perform a repeatable 120 s loop containing movement, chase, cutaway entry, interaction and replay. Both browsers; Inspector closed, lightweight diagnostics enabled. Report median/p95/p99 frame interval, worst frame, minimum rolling 5 s FPS, simulation time and dropped catch-up. Repeat after ten replays for sustained growth; exact heap return is not required, but owned resource/entity counts must not accumulate.

**Performance PASS:** minimum rolling 5 s FPS >=30; p95 frame interval <=34 ms (measurement tolerance around 33.3 ms); no recurring >100 ms stalls after warmup and no sustained dropped simulation steps. Disclose isolated OS interruptions and repeat affected run, never silently trim. 60 FPS is desirable, not mandatory. Do not derive final population/polygon budgets from primitives.

If representative integrated-GPU hardware is unavailable, record functional results and performance **NOT RUN**, leaving overall M0 unpassed. Gaming-GPU or lower internal-resolution results are supplemental. Representative-art/animated-character performance remains a separate later gate even after M0 passes.

## Completion and handover

M0 passes only with evidence for F01-F19 and performance, with no caused regressions unresolved. An unrun/inconclusive required check is not a pass. Record exact package versions, commands and evidence at implementation time; this specification claims none of those checks ran.

Update PROJECT_STATE.md with measured baseline and next bounded milestone. Stop at the proof; no map reconstruction or asset production during M0 cleanup.
