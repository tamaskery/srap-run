# SRAP Run Research Baseline

This is the historical research snapshot. The current accelerated roadmap and acceptance status are in [PROJECT_STATE.md](../PROJECT_STATE.md). M0 is closed on functional evidence; representative performance is deferred to M4. Older milestone sequencing and performance prerequisites below are superseded by that roadmap.

Research date: 2026-09-21. Documentation only; no working-game or performance evidence exists. Recommendations are engineering/design judgments grounded in the sources below. **DECISION** freezes direction; **PROTOTYPE VALIDATION** requires an empirical check; **DEFER** excludes immediate work.

## Executive decisions

| Area | Decision | Confidence | Prototype validation needed? |
| --- | --- | --- | --- |
| Engine | Babylon.js + TypeScript; WebGL2 | High | M0 packaging/boot, not a bake-off |
| Navigation | Recast V2; static navmesh, shared constrained motor | Medium-high | M0 walls/doorway/input switching |
| Input | Small intent layer; keyboard overrides click path | High | M0 focus/interaction tests |
| Camera | Orthographic, fixed heading/pitch, pan/zoom | Medium-high | M0 readability, then art |
| Occlusion | Authored render cutaways; independent proxies | Medium-high | M0 visibility/LOS tests |
| Scenes | Typed TS definitions + GLB node IDs | High | M0 second tiny configuration |
| Map basis | Proposed 3D map + OSM/municipal geometry hybrid | High direction; medium detail | M1 as-built/recognisability check |
| Characters | Humanoid rig family, in-place clips, separate ambient/threat updates | Medium | Later character/population proof |
| Traffic | Authored background paths outside playable roads | High | Later art/traffic test |
| Visual pipeline | Restrained PBR, GLB, selective sun shadows | Medium-high | Representative-art performance gate |
| Assets | Premade generic content; custom place identity | High direction | Individual licensing/import checks |
| Run | Unlimited bag, one final recycling trip then exit | High; user-confirmed | M0 complete loop |
| Performance | 1080p, stable 30 FPS minimum objective | Unproven | M0 primitives, then mandatory art gate |

## Engine decision

**DECISION: conventional Babylon.js (`@babylonjs/core`), not Babylon Lite.** Use TypeScript and Vite when M0 is authorised. Stable **9.27.1** and its Navigation V2 source were verified; pin matching Babylon packages and Recast **0.43.0** for the proof. Nothing is installed in this milestone [E1, N1].

| Project need | Babylon.js | Three.js | Standalone PlayCanvas |
| --- | --- | --- | --- |
| Browser/TypeScript | npm ES modules, TS codebase | npm modules, TS ecosystem/types | npm, full TS declarations; editor optional |
| Rendering | WebGL/WebGPU, PBR, shadows, instances/LOD | WebGL/WebGPU paths, sufficient quality | WebGL2/WebGPU, PBR/batching |
| Camera/picking | ArcRotateCamera, orthographic mode, scene picking | Orthographic/PerspectiveCamera, Raycaster/controls | Camera/entity systems and picking |
| Navigation | Official V2 adapter; game motor still ours | Recast adapter available; integration/motor ours | Recast adapter available; integration/motor ours |
| Animation/GLB | Loaders, animation groups, asset containers | GLTFLoader, AnimationMixer; explicit ownership | GLB assets/animation components |
| Collision/physics | Native collision choices, optional Havok | External physics/custom constraints | Collision/rigidbody integration options |
| HUD/lifecycle | GUI available; select DOM/explicit lifecycle | Straightforward DOM; compose lifecycle | UI/ECS available; DOM possible |
| Diagnostics | Inspector, Sandbox, Playground, Spector.js | Renderer diagnostics/examples; more integration choices | Profiler/tools and engine workflow |
| SRAP engineering risk | Lowest expected integration uncertainty | More glue without a needed custom-rendering advantage | Credible close alternative; editor/ECS strengths not required |

All three are viable mature open-source choices; none supplies SRAP rules or guarantees laptop performance. Recast supports both Three.js and PlayCanvas [N2]. PlayCanvas does not require a hosted editor/account for standalone engine use [E3].

The deciding judgment is Babylon's combination of supported navigation adapter, animation/asset lifecycle and visual inspection workflow for this small code-first game. It reduces integration conventions to establish/debug. Feature count alone does not justify it: omit physics, GUI editor, large-world systems and WebGPU-only effects. Three.js's rendering freedom does not address a current need. PlayCanvas remains credible, but a bake-off has insufficient expected value. Reopen only for a reproduced blocker [E1-E3].

## Technical architecture

**DECISION.** One application, one active scene, ordinary modules/classes with explicit ownership; no generic engine or ECS framework.

| Boundary | Responsibility / minimum interface |
| --- | --- |
| InputAdapter | Device-independent MoveAxes, MoveTo, Interact, Sprint, Cancel, Pause; camera commands separate |
| PlayerController | Intent/path arbitration, stamina, desired displacement; owns player transform |
| NavigationService | `findPath(start,target)`, `step(position,polygonRef,displacement)`, spawn validation; hides Recast types |
| Perception/ThreatController | Range/facing/LOS/suspicion; patrol/chase/search; reuses navigation |
| InteractionSystem | Stable target IDs, range and clear approach; semantic events |
| RunState | Health/stamina, item IDs, bag/recycled counts, active time, collecting/exiting/success/failure |
| SceneDefinition/SceneRuntime | Immutable content; owns loaded assets/proxies and resettable entities |
| Presentation | Camera, mesh/animation sync, cutaways, DOM HUD; observes state |

Fixed 60 Hz simulation, bounded catch-up and render interpolation; slower scheduled perception/path requests. Pause active time/simulation on menu or hidden tab; clear input on blur. Avoid one render callback per actor. Recreate run-owned state/entities for replay.

Use WebGL2 with an explicit unsupported-renderer message. WebGPU is a later measured option. Static builds serve local WASM/decoders through base-aware URLs and correct MIME types, with no runtime CDN/backend. HTML/CSS handles HUD/results/menu; later audio can use Babylon's Web Audio engine after a user gesture [E1].

## Camera

**DECISION: orthographic, fixed heading/pitch.** Start around 45-degree elevation with a diagonal map heading. Scene configuration owns final heading. Wheel changes orthographic extent; middle-drag pans along the ground; Home recentres. Clamp the viewed ground footprint to scene bounds. No edge scrolling or player-controlled rotation in v1. Keyboard movement uses camera-relative ground axes.

| Projection | SRAP implication |
| --- | --- |
| Orthographic | Stable screen size and tactical distances; classic feel; lighting/overlap must convey depth |
| Ordinary perspective | Strong depth, but foreground buildings dominate and distant characters shrink |
| Long-focal-length perspective | Attractive compromise, but distance/FOV tuning and screen-scale variation add no proven gameplay benefit |

The image cannot prove its original projection. Orthographic is our production/readability choice. Projection alone is not an important optimisation; visible coverage, shadows and pixel work matter more. Fixed orientation simplifies cutaway/silhouette validation. **PROTOTYPE VALIDATION:** distinguish player, threat, collectible and route at zoom limits and through the doorway before art production.

## Navigation / movement

**DECISION.** Babylon Navigation V2/Recast, not legacy V1 `recast-detour`. Stable source exposes `CreateNavigationPluginAsync({instance})`, `navMeshQuery`, path and constrained movement APIs. The default factory uses unpkg; instead initialise pinned local Recast core, combine core/generator exports and inject them. The injected branch does not call `init()` itself [N1].

One radius-eroded static navmesh covers exterior and SRAP, built from gameplay floor/obstacle proxies rather than decorative meshes. Join floors at the open doorway. No moving doors, jumps, stairs, off-mesh links or rebaking in v1. Runtime generation suffices for M0; later export/load navmesh data if map startup profiling warrants it.

Both control modes produce per-step displacement for one motor. Maintain a valid current polygon reference. Use `navMeshQuery.moveAlongSurface` from that polygon, check status/visited polygons, update polygon reference and floor height, and fail closed on query failure. Bound/subdivide unusually large movement. Never implement walking by independently projecting the desired destination to the globally closest point: this can cross walls or disconnected islands.

API trap: `moveAlongWithVelocity` adds its vector directly to position; it needs **velocity times timestep**, despite its name. Prefer explicit queries for continuity/error handling. Do not call `moveAlong` with its default zero polygon reference [N1].

Pick ground/navigation surfaces, not roofs. Reject distant off-mesh clicks and incomplete/unreachable paths with visible feedback. Recompute on new targets; hostile pursuit repaths on a modest timer or meaningful displacement, not every frame. Ambient routes use authored safe lanes and brief yielding without global crowd simulation. Actors need not physically block one another; contact damage is a separate proximity-plus-LOS rule.

**DEFER:** DetourCrowd, tile-cache dynamic obstacles and worker generation. V2 has crowd support [N1-N2], but few threats and non-blocking ambience do not justify another position owner. Future moving blockers remain behind NavigationService. **PROTOTYPE VALIDATION:** thin walls, corners, disconnected areas, clearance and alternating controls are M0 gates.

## Input architecture

**DECISION.** DOM pointer/keyboard handlers and a small input-state object; no input framework.

- Left ground click: replace path. Left interactable click: approach authored point, then interact once in range.
- WASD/arrows: normalised camera-relative movement. Nonzero movement cancels path/pending interaction immediately; releasing keys never resumes them. Ignore world clicks while movement keys are held.
- Shift requests sprint for either movement mode; exhausted stamina falls back to walk. E interacts once with highlighted nearest valid target. No Space binding initially.
- Escape cancels active command, otherwise opens pause/menu. Resume requires fresh intent. Home recentres.
- Capture game keys/wheel only while focused. UI consumes pointer events; blur releases held state.

Logic consumes intent, not device codes. Future gamepad needs another adapter, not a prebuilt gamepad/rebinding framework.

## Scene portability

**DECISION: typed TS configuration + stable GLB node references.** TS provides checks without a second JSON schema/loader. GLB holds art and named spatial/proxy nodes; configuration holds gameplay rules/references. glTF extras may carry IDs, not the sole mission definition or executable behaviour.

`SceneDefinition`: ID/name; assets; start; navigation source; camera preset/bounds; collectible IDs/positions; ambient/threat spawns/routes; hiding zones; entrance/interior/recycling/exit zones; cutaway groups; optional traffic paths. Use metres, Y-up and one documented right-handed runtime convention; set Babylon handedness once and test import. No unused editor/versioning framework.

Only define v1 content fields and a small fixed objective-zone union. Load-time checks cover unique IDs, references, start/objective reachability and clearance. No fuzzy mesh-name matching. Preserve named proxies/cutaways during asset optimisation. A second tiny M0 definition must work without controller edits or Budapest-specific branches.

## Map reconstruction

**DECISION: hybrid basis; medium confidence in fine detail.** All four supplied images were inspected. `proposed-square-map.png` supplies primary composition; `v1-aspiration.png` is the user-confirmed achievable target; both `v2-visual-target*.png` files are aspirations. No real-area photograph was supplied. Preserve filenames; none is survey data.

OSM node **14087875678** locates the square at **47.4707301, 19.1104107**. A live bounded extract (longitude 19.106-19.115, latitude 47.468-47.474) was inspected on the research date, including road ways and footprints [G1]. PDF page 5 of the 2025 municipal naming proposal was rendered/visually inspected: parcel **38299/3** runs along Üllői út between Ecseri út and Dési Huber utca, with the supermarket behind it [G2]. The 2022 programme is an earlier design brief, not as-built evidence; a September 2026 agenda references the completed square's pavilion 2/B, reinforcing caution with old imagery [G3].

| Proposed feature | Evidence / discrepancy | Production decision |
| --- | --- | --- |
| Broad square, supermarket behind | Useful relationship, but cadastral parcel is more elongated/shallow | Retain hierarchy; use real proportions, widen selected paths for play |
| Large top road labelled Ceglédi út | OSM distinguishes continuous Üllői from Ceglédi branch and Ecseri approach | Correct names, orientation and junction connectivity; do not trace image road graph |
| Lidl at dramatic junction | OSM way 339986132 is farther north/back | Background massing in correct relationship, not core gameplay |
| BIF Tower across road | Real landmark; way 341376484 tags 14 storeys/42 m | Preserve silhouette/location; height tag requires later confirmation |
| Standing human statue | OSM node 14087875618 identifies Fókák, a seal sculpture, installed in 2026 | Use simplified recognisable fountain/animal landmark |
| Rounded pavilions/planting | Pavilion existence supported; exact current outlines/count/planting not established by old image | Retain design language provisionally; confirm in M1 |
| Supermarket shell | OSM way 265244195 identifies Spar, Üllői út 147 | Retain footprint/placement, customise SRAP façade and interior |

Pipeline: bounded OSM export -> BlenderGIS footprint/road import -> local metric origin -> manual cleanup/simplification and landmark labels -> gameplay greybox -> custom SRAP/hero silhouettes -> reusable neighbouring shells -> separate GLB art/navigation proxies. BlenderGIS supports geographic import [G4]; verify selected Blender compatibility once. If importer fails, use the small footprint dataset as a manual dimensional guide, rather than building another tool. Centre lines are not curb polygons; heights/interiors need interpretation.

Pure manual reconstruction wastes reliable layout information. Broad procedural generation or premium GIS setup adds cleanup without sufficient value for one square. Core comprises square, immediate pedestrian circulation and SRAP; moderate-detail neighbours and simplified perimeter provide continuity. Main carriageways stay outside v1 navigation. Do not reconstruct the map in M0.

OSM is ODbL data: provide contributor attribution/licence link, preserve provenance, and separately identify any distributed adapted geographic database and its share-alike/source obligations. Do not assume a game asset export removes those obligations or makes every game asset/code ODbL. Municipal drawings are evidence, not permission to redistribute their imagery; link rather than bundle them. Do not trace proprietary tiles/photos without suitable rights [G5].

## Buildings / interior visibility

**DECISION.** Continuous SRAP space with permanently open doorway. Authored roof/near-façade render groups disappear inside a visibility zone; restore with a hysteresis margin. Prefer clean removal to alpha-blended transparent walls. Retain low wall bases to communicate boundaries. No scene load or full shop simulation.

Outside, authored occlusion volumes remove the necessary façade/roof group for covered routes. A player marker aids location but cannot replace route visibility. Hide render groups only, never parent nodes owning LOS/navigation proxies. Adjust shadow casters with cutaway appearance so a removed roof does not black out the room.

**PROTOTYPE VALIDATION:** no flicker, routes visible, wall LOS still blocks detection, shelves block invalid interactions. **DEFER:** general transparency, stencil silhouettes and clipping shaders unless authored groups fail.

## NPC / animation architecture

**DECISION.** One hostile pedestrian archetype, appearance independent of hostility. Patrol -> suspicious -> chase -> contact/damage -> search -> return. Suspicion requires range/facing/LOS; loss of sight ends direct tracking. Chase remembers last-seen position, searches for a bounded period, returns. Show readable suspicion state and a cone on hover/debug. No squad tactics or ambient perception.

Hiding is an authored zone: stopped/non-sprinting player is concealed unless that threat observed entry. Observed entry preserves last-seen pursuit/search until it gives up. Leaving/sprinting reveals the player. Keep hidden and occluded separate; no leaf-level cover, continuous illumination or general sound propagation. Contact requires proximity/LOS and a damage cooldown, not combat simulation.

Ambient actors follow safe walk/idle routes and ignore the player. Threat logic persists offscreen; ambient animation/update frequency can reduce outside relevant view. Start with animated clones sharing geometry/materials. Thin instances are not a free solution for independently posed skeletons [V2]. Add animation throttling/character LOD after profiling.

Pipeline: compatible humanoid family -> idle/walk/run clips -> retarget/clean once in Blender -> in-place GLB clips -> speed-driven blends. Chase reuses run; no attack clip needed. Prefer modest game-ready body/clothing silhouettes and few materials over facial rigs/hair cards; do not lock triangle budgets. Mixamo supports humanoid rigging and game use, not pigeon rigging [A1]. Share skeleton/rest pose across variants to control retargeting cost.

Difficulty changes reaction delay, detection reach, pursuit persistence/speed, route exposure and stamina recovery. Easy offers longer warnings/recovery windows; hard tightens patrol timing without omniscient vision. Keep hiding rules consistent and escape paths viable. Exact counts/timing are playtest data. **PROTOTYPE VALIDATION:** one threat/hiding in M0; animation population later.

## Traffic

**DECISION.** Authored lane polylines/rounded sampled curves with distance-based movement and tangent heading. Recycle vehicles offcamera; maintain simple same-lane gaps. Shared stop/reservation flag only where visible routes must intersect; avoid such intersections in first pass.

No vehicle navmesh, physics, tyre model or pedestrian collision. Main roads are non-walkable background; parked cars may have static proxies. Later rider threats need steering/turning rules separate from pedestrians; birds need their own rig/motion. **DEFER:** traffic implementation until after M0, hostile scooters/pigeons to later versions.

## Visual pipeline

**DECISION.** Softened/painted PBR: broad colour masses, restrained roughness/normal detail, coherent palette, strong silhouettes. Believable roof/entrance/window rhythm, not modelled window interiors. One daylight direction, environment fill, selective shadows and local material AO. Do not double-bake sun shadows into albedo.

- Realtime sun shadows for core buildings/actors and selected nearby vegetation; tight useful-view coverage. Simple SRAP fill after cutaway. No cascades without measured need.
- Bake local AO/detail first. Full scene lightmaps add UV/authoring coordination; defer until shadow cost justifies them. Preserve later lighting variants by separating light from base colour.
- Shared material families, trim sheets/atlases, texture sizes based on projected detail. No unique material per window/product or blanket 4K textures.
- Simple trunks/canopies and alpha-tested foliage with controlled overlap; no per-leaf animation. Test a few composed trees before multiplying shadowed foliage.
- Keep editable Blender sources separate. Apply scale, check axes/pivots, export needed meshes/skins/clips and preserve named proxies/cutaways. Validate GLB in Sandbox and game camera.
- First inspect/prune/deduplicate/resize with glTF Transform. Preferred texture path: KTX2/Basis, UASTC for sensitive normals/detail and ETC1S where colour quality permits. Meshopt is the preferred geometry/animation compression candidate; measure delivery/decode cost. Draco is an asset-specific alternative, not a default additional layer [V1].

Compression does not eliminate draw calls/skinning. Check decoder hosting, quality and load timing before shipping. **DEFER:** SSAO, bloom, realtime GI, reflections and custom post-processing. Composition does not require them. **PROTOTYPE VALIDATION:** representative art, animated actor and shadows before production expansion.

## Asset strategy / licensing

**DECISION.** Premade generic content; custom SRAP, square, fountain/pavilions and distinctive building silhouettes. Future asset ledger records author/URL/date, exact licence and acquisition evidence, attribution, redistribution conditions, originals and modifications. No production asset purchases/downloads occurred here.

| Source | Free/paid | Suitability | Browser redistribution implication |
| --- | --- | --- | --- |
| Mixamo [A1] | Free Adobe ID | Humanoid characters, idle/walk/run | FAQ permits royalty-free games, not unrestricted raw-library redistribution. Verify selected-file terms; keep source library out of public repo |
| Poly Haven [A2] | Free CC0 | Materials, lighting, selected vegetation/props | CC0 permits redistribution; service/API terms separate; resize and retain provenance |
| Kenney [A3] | Free CC0 asset pages | Generic vehicles/buildings/urban props, temporary content | Raw redistribution allowed; simpler style than final target |
| Fab [A4] | Free/paid per listing | Pedestrians, European urban props/buildings, vehicles, shelves, scooters/birds | Standard licence permits incorporated projects across compatible engines, prohibits standalone redistribution; exact listing/full terms still need review |

Public browser builds deliver fetchable assets. Compression/obfuscation is not rights protection. Public source repositories are separate distribution from incorporated games. Prefer CC0/compatible openly redistributable assets where raw-delivery permission is uncertain; otherwise obtain suitable publisher clarification before use. No individual paid asset is cleared here. Avoid editorial-only licences and reference-only/engine-locked formats.

Three feasibility examples, not purchases: an animated pigeon listing offers Blender/FBX/GLB and clips, but retargeting/texture cost remain untested; an electric scooter offers Blender/FBX as a single mesh, so rider/steering is extra work; a supermarket set offers FBX/GLB while another checked set is Unreal-only with Blueprint controls, adding avoidable conversion work [A5]. Choose by rights, raw format, style and import proof rather than “game-ready” labels.

SRAP's fictional name does not automatically clear copied logos, packaging or artwork. Make distinct signage/materials and generic neighbouring business signs. Reference images are design inputs, not runtime textures.

## Performance strategy

**PROTOTYPE VALIDATION.** Target 1920x1080, stable >=30 FPS, 60 desirable, on an identified contemporary Windows integrated-GPU laptop. Record CPU/GPU/RAM, power, browser, backend, actual drawing-buffer size and DPR. No performance claim yet.

Measure CPU simulation/path/perception, draw calls, active meshes/materials, skeleton cost, frame-time percentiles, loading/decode and transferred bytes. Use Inspector/Spector diagnostically, disable heavy tools for timings; report unavailable GPU timers honestly [E1].

Optimise the measured bottleneck: shared materials/static instances, sensible spatial merges, core/near/perimeter groups, fewer shadow casters/foliage overlaps. Thin instances cull as a group, so avoid a city-wide batch; their collision checks are not per-instance navigation proxies [V2]. Measure animated population separately from static counts.

Load a bounded scene with progress/error feedback; dispose resources between scenes. **DEFER:** neighbourhood streaming/chunk scheduler. Quality tiers can reduce ambience/shadows/effects, never hostile logic or collectibles. Lower internal resolution must be reported, not called native 1080p. Freeze budgets only after representative art; primitive speed proves integration, not final graphics.

## Relevant game-design lessons

Bounded study of publisher/developer descriptions, not hands-on playtesting. Adaptations are design inferences, not copied missions/UI [D1-D5].

| Reference | Useful lesson | SRAP adaptation |
| --- | --- | --- |
| Commandos | Observe movement and plan from tactical camera | Readable patrol rhythms/safe observation; no squad synchronisation |
| Desperados III | Multiple approaches, difficulty and replay challenges | Risky collection clusters with safer alternatives; route mastery |
| Shadow Tactics | Avoidance, environmental routes, distractions | Clear cover/warnings; no vertical traversal or specialist roster |
| Serial Cleaner | Collect/clean while avoiding patrols, reusable challenge levels | Collection competes with exposure; clear exit/results loop |
| The Marvellous Miss Take | Nonviolent collection/escape, mouse controls, variable guard routes | Strong single-character precedent; defer random patrol complexity until fairness proven |

| Idea | Scope | Decision |
| --- | --- | --- |
| Bottle micro-puzzles | V1 | Equal-value items near sight lines/cover/alternative approaches |
| Safe/risky routes | V1 | Exposure versus time; no valuable-item tiers |
| Hiding | V1 | Explicit zones and observed-entry rule |
| Distractions | V1.5 / V2 | Later one readable action, no inventory economy |
| Controlled randomisation | V1.5 / V2 | Seeded authored variants checked for reachability, no surprise mid-run spikes |
| Bag capacity | DEFER | User confirmed unlimited bag |
| Repeated trips | DEFER | User confirmed one final trip |
| More missions on same map | V1.5 / V2 | Reuse geometry with different placements/routes/objective data |

Indoor continuity follows our cutaway/navmesh design, not an asserted common implementation in these games. Results show count, health, active time and clean-sweep status. Rank count first, then health/time so a fast one-bottle run cannot dominate a substantial collection. Weighted score coefficients/bonus amount are later tuning, not M0 prerequisites.

## V1 scope recommendation

**DECISION: feasible as a bounded small game; visual performance remains conditional.** Full panorama is not playable scope.

| Cost pressure | Smallest preserving reduction |
| --- | --- |
| Full neighbourhood | Square, pedestrian circulation, SRAP; neighbouring shells |
| Many NPCs | Modest ambience, fewer threats; cap from measurement |
| Traffic | Background only, no crossing objective/vehicle damage |
| Reconstruction | Major relationships, simplified secondary geometry |
| Interior | Entrance, short shelf route, far-side recycler, exit; no shop simulation |
| Art | Coherent asset family; representative art gate before multiplication |
| Hiding | Authored zones/LOS, no light/noise simulation |
| Dual input | Both from M0 through one motor |
| Performance | Measured laptop; reduce optional rendering before expanding map |

Include health/stamina, walk/sprint, collection, hiding, detection/chase, recycling, exit, results/replay; authored spawns/routes first. Positive recycling empties bag and enters `exiting`; collection/recycling then stop. Cross exit alive to finish. Health zero fails, including exit travel; failure wins if simultaneous with success. No combat, multiplayer, accounts, save/resume or gamepad requirement.

## V1.5 / V2 candidates

**DEFER.** More missions/scenes, richer art, larger playable area, night presets, improved interiors, distractions, birds/riders and combat.

Avoid concrete traps now: Budapest coordinates in core; render visibility controlling collision; root-motion-owned navigation; mission data only in GLB; permanent sun lighting in base colours; scene-specific controller branches. Separate movement policy from threat state for riders/birds. Future combat can use damage/interaction boundaries without adding weapons now. Asset grouping permits expansion without building streaming early.

## Key risks

- Integration: M0 validates pinned local WASM, polygon continuity and query failures.
- Readability: fixed camera/cutaways may hide paths; test tall primitives before art.
- Production: reference density is not a cheap shopping list; prove one coherent art slice.
- Geography: recent redevelopment creates dated-source disagreements; label confidence.
- Licensing: incorporated games and public raw assets differ; selected-file clearance required later.
- Performance: no laptop/art measurements; no guarantee of final visual fidelity yet.

## Prototype validation requirements

**PROTOTYPE VALIDATION.** Next task is only [M0_TECHNICAL_PROOF.md](M0_TECHNICAL_PROOF.md), with explicit functional/performance tests.

Later milestones are named only to place dependencies: **M1 map greybox** checks corrected landmark relationships and routes; **representative-art gate** checks character family, trees, hero façade/cutaway, GLB optimisation and laptop frame times before broader production; then bounded v1 content. No map/shopping in M0 and no later milestone starts automatically.

## User decisions still required

**DECISION: none blocks M0.** Reference roles, unlimited bag and single final trip confirmed. Identify test laptop in M0; lack of hardware limits empirical acceptance, not engine choice. Asset budget, population, scoring coefficients and fine as-built details are later content/tuning decisions.

## Sources

Primary sources checked 2026-09-21; source inspection is not runtime testing.

- **E1** [Babylon specifications](https://www.babylonjs.com/specifications/), [9.27.1 release](https://github.com/BabylonJS/Babylon.js/releases/tag/9.27.1): rendering/assets/diagnostics capabilities, not benchmarks.
- **E2** [Three.js reference](https://threejs.org/docs/): cameras, raycasting, animation, loaders/renderers.
- **E3** [PlayCanvas engine](https://developer.playcanvas.com/user-manual/engine/), [graphics](https://developer.playcanvas.com/user-manual/graphics/): standalone npm/TS and rendering.
- **N1** Babylon 9.27.1: [factory](https://github.com/BabylonJS/Babylon.js/blob/9.27.1/packages/dev/addons/src/navigation/factory/factory.single-thread.ts), [initialisation](https://github.com/BabylonJS/Babylon.js/blob/9.27.1/packages/dev/addons/src/navigation/factory/common.ts), [query methods](https://github.com/BabylonJS/Babylon.js/blob/9.27.1/packages/dev/addons/src/navigation/plugin/RecastNavigationJSPlugin.ts), [crowd](https://github.com/BabylonJS/Babylon.js/blob/9.27.1/packages/dev/addons/src/navigation/plugin/RecastJSCrowd.ts). Stable API inspected, not executed.
- **N2** [Recast Navigation JS](https://github.com/isaac-mason/recast-navigation-js): navmesh/crowd/obstacle support and engine integrations.
- **G1** OSM [square](https://www.openstreetmap.org/node/14087875678), [supermarket](https://www.openstreetmap.org/way/265244195), [Lidl](https://www.openstreetmap.org/way/339986132), [BIF Tower](https://www.openstreetmap.org/way/341376484), [Fókák](https://www.openstreetmap.org/node/14087875618), [bounded API extract](https://api.openstreetmap.org/api/0.6/map?bbox=19.106,47.468,19.115,47.474). Contributor data, not survey-certified.
- **G2** [Municipal naming proposal](https://www.ferencvaros.hu/wp-content/uploads/2025/09/11-KT-VB-KB-RONK-149-Kozterulet-elnevezese-nehai-Mester-Arpadrol.pdf), PDF page 5 visually inspected.
- **G3** [2022 redevelopment programme](https://www.ferencvaros.hu/wp-content/uploads/2022/01/Sz_25_22_M02.pdf), [September 2026 agenda](https://www.ferencvaros.hu/idopontok/ulesek/2026-09-17-kepviselo-testulet/): context/pavilion reference, not exact as-built geometry.
- **G4** [BlenderGIS](https://github.com/domlysz/BlenderGIS): geographic import.
- **G5** [OSM copyright/licence](https://www.openstreetmap.org/copyright): ODbL/attribution.
- **V1** [glTF Transform CLI](https://gltf-transform.dev/cli): inspection, pruning, resizing and compression.
- **V2** [Official thin-instance documentation](https://github.com/BabylonJS/Documentation/blob/master/content/features/featuresDeepDive/mesh/copies/thinInstances.md): group culling and collision limitations.
- **A1** [Mixamo FAQ](https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html): game use/humanoid restrictions, not blanket raw redistribution.
- **A2** [Poly Haven licence](https://polyhaven.com/license); **A3** [Kenney FAQ](https://kenney.nl/support): CC0 sources.
- **A4** [Fab licence summary](https://www.fab.com/eula): incorporation versus standalone distribution. Accessible page is explicitly non-binding; retain full applicable terms/selected licence before acquisition.
- **A5** Feasibility listings: [animated pigeon](https://www.fab.com/listings/e95704e3-27b0-4d32-be3a-651d3025c066), [scooter](https://www.fab.com/listings/adb5f269-89a4-4f9c-9810-4409d3f07d23), [FBX/GLB supermarket props](https://www.fab.com/listings/fda39d0c-7d71-41c0-b057-c1c93aba985a), [Unreal-only comparison](https://www.fab.com/listings/5be918f1-8732-4a62-bfbd-1a3b9646ca87). Not purchases/import proof/licence approvals.
- **D1** [Commandos](https://store.steampowered.com/app/6800/Commandos_Behind_Enemy_Lines/); **D2** [Desperados III](https://desperados3.thqnordic.com/); **D3** [Shadow Tactics](https://store.steampowered.com/app/418240/Shadow_Tactics_Blades_of_the_Shogun/); **D4** [Serial Cleaner](https://store.steampowered.com/app/522210/Serial_Cleaner/); **D5** [The Marvellous Miss Take](https://store.steampowered.com/app/327310/The_Marvellous_Miss_Take/): developer/publisher descriptions.
