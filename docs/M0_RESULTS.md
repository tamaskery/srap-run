# M0 acceptance evidence

Date: 2026-09-21. **M0 CLOSED — FUNCTIONAL TECHNICAL PROOF COMPLETE. REPRESENTATIVE PERFORMANCE DEFERRED TO V1 STABILIZATION.** The user closed M0 on its functional evidence and superseded the old performance/commit gate. Historical measurements below remain unchanged; they are not representative performance certification and do not block M1. Raw evidence remains locally preserved in ignored `evidence/` and the recovery copy.

## Functional acceptance

Production preview, real bundled Babylon Navigation V2 / Recast (no navigation mocks): **28/28 Chrome and 28/28 Edge**. Unit tests: **22/22**. Raw results: `evidence/acceptance-chrome.json`, `evidence/acceptance-msedge.json`, `evidence/unit-tests.json`; root/subpath checks: `evidence/subpath.json`.

| Contract | Evidence / result |
| --- | --- |
| F01 | PASS: production WebGL2 boot, usable state, no unhandled errors, local requests, correct WASM MIME |
| F02 | PASS: root and `/srap-run/`; Chrome/Edge cold-cache refresh and real movement |
| F03 | PASS: injected failure and actual aborted WASM request; stopped error screen and successful Retry |
| F04 | PASS: detour around L, arrival <0.2 m, no obstacle crossing; physical mouse picking |
| F05 | PASS: real motor against thin wall/corner for 10 s at synthetic 30/60/120 Hz; straight/diagonal distance and floor-height checks |
| F06 | PASS: disconnected island/off-mesh commands rejected; invalid spawn reports error |
| F07 | PASS: twenty command/key/release sequences clear paths and pending interactions; physical keyboard/mouse check |
| F08 | PASS: doorway both directions by command and keyboard intent; sub-diameter gap blocks and route detours |
| F09 | PASS: real sprint exhaustion/recovery, release rearming, blur pause, fresh input, Resume focus; unit timing invariants |
| F10 | PASS: pan/zoom/recenter/resize, angle/footprint bounds, physical picking; visual camera inspection |
| F11 | PASS: ten hysteresis crossings, exact render restoration, retained LOS/nav barriers; roof and near façades leave interior route readable |
| F12 | PASS: facing/range/continuous suspicion and hidden-façade LOS; debug cone/state cue inspected |
| F13 | PASS: patrol/suspicious/chase/last-seen search/return/patrol and reacquisition; no live tracking after sight loss |
| F14 | PASS: unseen concealment, observed-entry pursuit/search, exit/sprint reveal and reacquisition |
| F15 | PASS: 20-point shared one-second damage cooldown, zero clamp and no through-wall damage at 30/60/120 Hz schedules |
| F16 | PASS: spam interaction cannot duplicate pickup/recycling; blocked segment rejected |
| F17 | PASS: early exit cannot win; positive recycle then exit succeeds; lethal contact wins same-step priority |
| F18 | PASS: ten alternating success/failure replays restore state/camera and stable measured scene/material/nav/input ownership |
| F19 | PASS: second data-only scene completes same loop; duplicate IDs and broken references rejected by validation tests |

Visual evidence: `evidence/cutaway.png`, `evidence/restored.png`, and Edge variants. Camera/route/actor, zone labels, cutaway restoration and detection cone were inspected at 1080p. Automated checks retain exact LOS/navigation behavior while render groups are hidden.

## Reproducible checks

- `npm test -- --reporter=json --outputFile=evidence/unit-tests.json`
- `npm run build`; `npm run preview -- --port 4173`
- `BROWSER_CHANNEL=chrome npm run test:e2e` and `BROWSER_CHANNEL=msedge npm run test:e2e` (set environment using the shell's syntax)
- `VITE_BASE=/srap-run/ npm run build -- --outDir dist-sub`; subpath preview on 4174; `node scripts/subpath.mjs`
- `BROWSER_CHANNEL=chrome node scripts/performance.mjs`, then `msedge`; run test browsers serially and obtain authorization before stopping unrelated GPU workloads

Sandbox ACLs prevented esbuild's config traversal and reading installed browser paths; those build/test commands were run with approved elevated execution. No global configuration was changed.

## Integration findings retained for regression

Recast core init takes a module factory; local Emscripten WASM is injected before creating Babylon's plugin. Exact contour vertices can fail `getPolyHeight`; a same-visited-polygon boundary projection is allowed only with 0.0001 m horizontal tolerance and unchanged displacement/height limits. Path following reaches vertices to 0.0001 m before advancing, preventing early corner skips. No global destination snap or teleport fallback exists.

Shift release is an input edge: it rearms sprint even when release/repress occur between fixed ticks. Resume focuses the canvas. The physical camera-picking harness renders a changed camera before projecting its next click. Float32 clearance assertions allow 0.00001 m rounding. The cutaway assertion remains exact and was updated from three to four members after adding the near side façade; its assertions were not weakened.

## Performance environment and results

See `evidence/environment.json`: Dell G15 5530, Intel Core i5-13450HX, 16 GB RAM, Windows 11 Pro 10.0.26200, AC connected, Balanced power scheme. Intel UHD driver 32.0.101.7085; Intel display reports 165 Hz. RTX 4050 is installed but is not the measured renderer. Actual browser renderer is ANGLE Intel UHD / Direct3D11 / WebGL2. DPR 1. Drawing buffer explicitly set and checked at 1920 × 1080; headed Chromium initially rounded it to 1919 × 1079, so that preflight was excluded before measurement.

Measured results (milliseconds except FPS/dropped counts):

| Browser / pass | Median | p95 | p99 | Worst | Min rolling 5 s FPS | >100 ms frames | Dropped steps | Simulation mean / p95 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Chrome 153.0.8010.48 baseline | 14.6 | 32.7 | 47.9 | 164.5 | 50.08 | 4 | 0 | 0.090 / 0.2 |
| Chrome after ten replays | 13.9 | 28.6 | 34.4 | 159.8 | 65.31 | 5 | 2 | 0.070 / 0.2 |
| Edge 153.0.4234.48 baseline | 18.5 | 47.1 | 64.9 | 110.7 | 29.76 | 2 | 7 | 0.114 / 0.3 |
| Edge after ten replays | 21.1 | 50.0 | 69.5 | 1128.0 | 0.96 | 21 | 1054 | 0.095 / 0.2 |

**Historical performance result: FAIL; representative evaluation is now deferred to M4.** Chrome exceeded the recurring-stall threshold. Edge failed p95/FPS and later throttled near one frame per second despite visible/focused page state. Untrimmed raw reports: `evidence/performance-chrome.json`, `evidence/performance-msedge.json`. Initial occluded Chrome samples remain in `evidence/performance-chrome-occluded.json`; none were silently removed from an accepted sample.

The test browser used Intel UHD, not RTX. There is a concrete external constraint: GPU counters showed a pre-existing Edge process (created September 20) using ~33% of the same 3D engine, a pre-existing Chrome process (September 18) ~26%, ChatGPT ~11%, and the M0 Edge test ~25%. See `evidence/gpu-contention.json` and `evidence/gpu-processes.json`. These unrelated workloads were not closed. The long-frame data and low simulation cost point toward rendering/presentation contention, but they do not prove every stall's cause. An uncontended foreground representative run remains **NOT RUN**.

A separate ten-replay probe found no >100 ms engine frames (worst 96.3 ms); asynchronous replay durations were ~150–180 ms with animation frames continuing. Thus a total reset duration is not itself evidence of a synchronous replay stall. Both full timed passes retained **37 meshes, 15 materials, one scene, one navmesh, one input adapter**, with no owned entity/resource growth.

Each browser's valid-resolution measurements used the same production app. The native-window-occlusion disabling flag was supplied only to the test browser process, and foreground focus requested; no global setting was changed. Edge still showed throttling, so the flag was not sufficient to establish stable presentation. The nominal 120 seconds of action dwell measured 121.1–122.2 seconds including asynchronous replay/control overhead. Both passes include those gaps. The initial 1919 × 1079 preflight was interrupted before accepted measurement; early harness runs interrupted for the Resume-focus correction were not claimed as evidence. Each valid run warms for 30 seconds, measures a repeatable 120-second movement/collection/interior/recycling/threat/replay sequence, then repeats after ten extra replays and a fresh warm-up. Capture persists across replay/loading, including frame gaps; it reports percentiles, worst frame, rolling five-second FPS, simulation mean/p95, >100 ms stalls, dropped simulation and resource counts. Inspector remains closed. Debug repositioning establishes repeatable scenarios; navigation, perception, interaction, rendering and replay execute the production systems.

## Delivery boundary

### Bounded performance follow-up, 2026-09-21 13:02 CEST

**Environment blocker; unchanged-application retest NOT RUN in either browser.** Before editing, all 56 tracked/project-owned untracked files were copied outside the repository to `C:\Users\tamas\Documents\ChatGPT\Srap-run-recovery-20260921-130125`, with SHA-256 verification, manifest, tracked patch, status and HEAD. Dependencies, build/cache output and secret-file patterns were excluded. Main/HEAD remains `511fd967181e7d4ccbe090a3650128f666b2e352`; origin remains `https://github.com/tamaskery/srap-run.git`.

Five fresh one-second GPU samples show the unrelated Edge process 27552 (created September 20) averaging **85.00%** on the same 3D engine, ChatGPT 39748 **11.13%**, and Chrome 13896 **2.17%**. No M0 browser was running. This substantial competing workload is distinct from ordinary desktop overhead and prevents a representative performance retest. Raw samples/process identities: `evidence/environment-preflight-20260921-1302.json`. AC remains connected, Balanced unchanged, Intel refresh 165 Hz and driver 32.0.101.7085 unchanged. No process was stopped except this follow-up's preview server; no machine/global settings changed.

Per the bounded stop rule, no timed run, diagnostic trace or correction/retest cycle was attempted in the blocked environment. Baseline/post-replay results above remain failed historical evidence, not fresh results. Native foreground, minimization and unobstructed-window checks remain **NOT VERIFIED** for a new run; the old harness's page focus/visibility and `bringToFront` do not establish those conditions. A future run must verify native window presentation throughout the automation/control workflow, log complete launch settings, use new output filenames, and retain all frames across replay. The existing harness currently overwrites its report names and enables a long-task observer; acceptance must preserve prior files and keep profiling separate.

**No production changes, harness changes or dependency changes.** Prior 22/22 unit and 28/28 per-browser functional evidence was inspected and reused; suites/build were not rerun for this environment-only follow-up. All 56 recovery manifest hashes still matched before documentation edits. `npm run preview -- --port 4173` started successfully and served the existing production bundle with HTTP 200 (`evidence/launch-check-20260921-1303.json`); the owned server was then stopped.

The historical preflight demonstrated substantial unrelated GPU activity, not an application defect or replay leak. Its requested follow-up is superseded: do not rerun M0 performance or diagnose the old stalls for M1.

The M0 implementation was retained uncommitted at `511fd96` at the time of this historical preflight. Before M1 edits, all 27 implementation/test/tool files matched the existing recovery copy. The subsequent M1 request explicitly authorizes preserving M0 together with the passing M1 baseline in a commit and push.

Current delivery: [M1 results](M1_RESULTS.md). Representative performance belongs to M4, after representative content exists.
