# Pixel-art experiment — bounded M4 comparison

## Baseline and boundary

Branch: `experiment/pixel-art`, created from verified M4 `9e07cfc2e742c9646a701ed84d788ce949c67431`. M4 evidence remains in `docs/M4_RESULTS.md`. Baseline mode is the default; `?visual=baseline` retains the M4 renderer options, lighting, Poisson shadows, materials, textures and decorative geometry. All experimental branches are disabled. This is neither M5 nor approval to replace M4.

No dependency, navigation, collision/LOS proxy, scene layout, controller, interaction range, AI, scoring, mission, audio or HUD structure changes. Both openings, authored cutaways, interiors, full camera range and animated humanoids remain. The experiment uses Babylon 9.27.1's existing drawing buffer and CSS upscaling, with no new rendering pipeline.

## Selected treatment

- World canvas: 640×360 at 1920×1080 CSS pixels, nearest/pixelated upscaling, antialiasing off. Three CSS pixels per world pixel; dimensions round independently on resize (455×256 at 1366×768). Non-integer display scale can give alternating physical pixel widths. HUD stays native-resolution HTML.
- Limestone paving with broad, low-contrast slab clusters and no fine aggregate; deep teal glass/water, olive vegetation, terracotta fascia, cool ambient fill and warmer direct light. The selective palette reuses existing material identities; other assets retain authored colours.
- Stronger player coat, dark legs, bottle label/marker contrast and entrance stone/paint accents. Brighter accents are presentation only and follow existing cutaway ownership.
- Hard 1024 shadow map replaces Poisson filtering only in pixel mode. No animation, camera, physics or navigation quantization.
- One refinement after inspecting 640×360 captures: wider decorative fountain/character marks and a non-pickable bottle highlight reduce dotted fragments. Original bottle pick geometry remains unchanged and regression-tested. Resolution stayed at the initial candidate; no preset search.

Picking uses the existing CSS-to-buffer conversion. Pixel mode holds Babylon hardware scaling at one to avoid a second implicit conversion. Pan deltas scale to the buffer before entering the unchanged camera. Baseline input remains on the M4 path.

## Comparison artifacts

Local, ignored output: `evidence/pixel-art/`. Bulky captures are intentionally not committed or pushed.

| View | Baseline | Pixel |
| --- | --- | --- |
| Square/SRAP wide | `baseline-wide.png` | `pixel-wide.png` |
| Player, patrol, bottle/fountain | `baseline-gameplay.png` | `pixel-gameplay.png` |
| Entrance and interior visibility | `baseline-entrance.png` | `pixel-entrance.png` |

Open `evidence/pixel-art/index.html` for paired images and movement clips. `comparison.json` records camera, actors, scene state, renderer and buffer. Captures are actual production output, not concept art. Wide view uses the initial camera (span 64); gameplay uses span 32 with player (-7,9), patrol (1,10); entrance uses span 26 with player (19,-10). The entrance intentionally shows the normal authored cutaway. Debug telemetry/placement makes pairs reproducible and exposes the same debug scene selector in both. No mission inventory is injected. Camera target/span and actor state match; M4's 1919×1079 rounding versus exact 640×360 introduces a very small aspect difference.

`motion/baseline.webm` and `motion/pixel.webm` are sequential Playwright recordings using its already-installed encoder; no video tools were installed. The route starts at (-12,9), walks toward (2,9), pans and zooms. The input sequence and endpoints match, but recordings are not frame-synchronized: final simulation time is 13.35 seconds baseline versus 15.22 seconds pixel because input delivery/capture pacing differs. Final camera targets differ by less than 0.006 world units from buffer rounding. Clips include repeated encoded frames and cannot establish exact frame pacing. Video recording is excluded from performance samples.

## Verification and performance

Production build passed. The existing 28 unit tests passed after the implementation; after refinement the focused art suite passed 3/3, including a new equality check on all baseline versus pixel bottle pick vertices/indices. No unchanged broad suite was repeated.

Production Chrome checks passed:
- M4's two focused square/startup checks in pixel mode at 1366×768: doorway keys in both directions, side exit/click return, obstacle paths, cancel/pause, recenter, HUD bounds, ordinary launch and local assets.
- New input check: resize 1920×1080 → 1366×768, emulated DPR 1.25, projected physical clicks near left/right screen edges, CSS-distance pan, Home and zoom endpoints 15/76. Fractional buffer aspect/pointer rounding permits 1.5 CSS pixels of pan projection tolerance; the largest observed failing over-strict assertion was 0.70 CSS pixels. Final picking/arrival checks pass.
- Baseline then pixel: the same live-clock M4 mission, ~2.7 minutes each, with equal three-second render warm-up, 23 travel samples each and physical input. Collection, keyboard/click handoff, sprint, pan/zoom, chase/search/escape, damage and lethal failure, recycling, both SRAP openings, success and fresh replay passed. No actor/inventory/damage injection in these mission checks. Both report zero runtime warnings/errors.

Environment: headed Chrome **153.0.8010.48**, Windows, **Intel UHD (0xA78B), ANGLE D3D11**, WebGL2; 1920×1080 CSS viewport. The original Intel UHD renderer is available. Comparison contexts use device scale factor 1 (reported DPR 1.0000000149); a separate input test emulates 125%, not a change to Windows settings. Baseline buffer is 1919×1079 from existing M4 rounding; pixel is 640×360. These are same-machine sequential measurements, with no concurrent game render or recording during timing.

| Matched live mission measurement | M4 baseline mode | Pixel mode |
| --- | ---: | ---: |
| Median of 23 segment medians | 18.9 ms / **52.9 FPS** | 12.0 ms / **83.3 FPS** |
| Segment median range | 18.2–22.6 ms | 11.8–12.2 ms |
| Segment p95 range | 39.1–49.7 ms | 20.0–32.4 ms |
| Lowest rolling 5-second rate | 41.8 FPS | 69.9 FPS |
| Worst sampled frame | 92.6 ms | 54.5 ms |
| Frames over 100 ms | 0 | 0 |
| Reported dropped simulation steps | 3 | 0 |
| Largest segment simulation p95 | 0.8 ms | 0.3 ms |

Pixel's representative reciprocal-median rate is about 58% higher in this run. This is measured, not an assumption from resolution alone. Baseline currently has lower frame rates in several segments and three reported drops unlike historical M4; that historical acceptance has not been rewritten. Capture boundaries can include a simulation step whose elapsed interval began before the first recorded frame, so drops and worst frame in a short sample need not correspond exactly.

The suspicious west-to-fountain approach (-33,16 → -15,2) was repeated **once per mode**, with three-second warm-up and 12 seconds of live-clock sampling. Baseline: median 21.7 ms (46.1 FPS), p95 49.8 ms, rolling minimum 36.4 FPS, worst 82.2 ms. Pixel: median 11.5 ms (87.0 FPS), p95 19.9 ms, rolling minimum 81.0 FPS, worst 52.2 ms. Both: zero >100 ms frames and zero dropped steps. Thus the current baseline's low rolling interval is reproducible, while the experiment does not inherit it; this does not justify changing frozen baseline gameplay or opening a separate optimization task. The repeat uses a fresh scene with debug placement at the segment start, so inventory/patrol history differs from the full mission, equally in both modes.

Raw evidence: `baseline-mission.json`, `pixel-mission.json`, consolidated `performance.json`, `suspicious-segment.json`, and `scaling-check.json` under `evidence/pixel-art/`. The isolated repeat script is saved beside the evidence. Video and screenshot activity are excluded from these samples.

## Technical result

**PASS for this bounded experiment.** Gameplay, input mapping, resizing, HUD and mission completion remain functional. The final pixel build passes the performance gate on this Intel UHD session. This is not a new all-hardware release acceptance, nor a claim that the M4 baseline now reproduces every historical timing result.

## Provisional visual assessment and adoption boundary

**WEAK as a convincing authored pixel-art direction; ready for user review as a bounded, playable experiment.** The coordinated warm/cool palette, broad paving, dark window recesses, stronger entrance and identifiable gold/green interactables do more than reduce resolution. At span 32 the player, patrol and bottle separate clearly; the HUD remains fully readable. However, the large plain roof/façade surfaces, smooth rounded foliage and simple block humanoids still read strongly as low-resolution 3D. This does not yet provide the crafted surface detail and environmental storytelling suggested by the tactical reference. No copied reference-game assets are used.

Motion assessment is provisional and based on sampled frames from both actual movement recordings, plus the live-clock mission/input evidence. At fixed camera, background and ground shadows remain stable in sampled movement; actor silhouettes/limbs change by discrete screen pixels while navigation stays continuous. Panning changes the staircase coverage of roof rims, fine floor/roof lines, thin detection-cone edges and fountain rings: visible crawling remains. The wider ring refinement improves continuity, but does not make fine features temporally invariant. No whole bottle disappeared in the inspected normal-distance samples; at the wide/default view the bottle body is only a few pixels and recognition depends heavily on its marker. Character separation remains usable, but subtle animation detail is lost. No large shadow flicker or camera jump was evident in the sampled frames; that is not a guarantee at every zoom or scale, and the encoded clips contain repeated frames. The unchanged high-resolution labels also remain visually distinct from the coarse world.

The bounded pass and its one refinement are finished. Keep 640×360 for this review; do not mask these asset/readability limitations through further resolution trials or shader tuning. A stronger result calls for deliberate asset authoring, not an unauthorized rendering rewrite.

Broader adoption needs authored silhouette/detail work on the reused humanoids, SRAP surfaces and vegetation, plus a deliberate minimum-size language for distant interactables, roof seams and ground markings. Those assets and a broader motion/zoom review are outside this experiment. This prototype is not evidence that Babylon or a hybrid approach cannot work; no engine replacement or sprite pipeline was attempted. Art-direction approval remains the user's decision.

## Reproduce

```powershell
git switch experiment/pixel-art
npm ci
npm run build
npm run preview -- --port 4176 --strictPort
```

Play (ordinary mission, no debug):
- M4 presentation: http://127.0.0.1:4176/?visual=baseline
- Experiment: http://127.0.0.1:4176/?visual=pixel

Focused checks and captures, with the server running:

```powershell
$env:TEST_URL='http://127.0.0.1:4176'
$env:BROWSER_CHANNEL='chrome'
$env:VISUAL_MODE='pixel'
npx playwright test tests/m4.spec.ts tests/pixel.spec.ts --headed
$env:M4_REALTIME='1'
$env:VISUAL_MODE='baseline'
npx playwright test tests/square.spec.ts --headed
Copy-Item test-results/acceptance.json evidence/pixel-art/baseline-mission.json
$env:VISUAL_MODE='pixel'
npx playwright test tests/square.spec.ts --headed
Copy-Item test-results/acceptance.json evidence/pixel-art/pixel-mission.json
Remove-Item Env:M4_REALTIME
node scripts/pixel-comparison.mjs
node scripts/pixel-motion.mjs
```

Run the two performance missions sequentially, without video capture or another game instance rendering alongside them. Existing Diagnostics supplies frame intervals, reciprocal median FPS, p95, worst frames, rolling 5-second FPS and simulation/drop counts. It is not a GPU benchmark. Travel samples exclude screenshots, startup and some stationary waits; short segments have no rolling statistic.
