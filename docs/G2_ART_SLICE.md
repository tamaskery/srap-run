# G2 — representative playable art slice

Date: 2026-09-21/22. Continues the existing non-pixel M4 + accepted G1 worktree.
No commit, push, deployment, asset purchase, dependency change or hero re-authoring.

## Decision

**TECHNICAL: PASS**

**VISUAL: WEAK**

**PERFORMANCE: NEEDS WORK**

This slice demonstrates successful authored environment/hostile integration, but
does **not** establish the requested final visual quality within the existing
relative performance envelope. Stop here; it is not an approval for a map-wide pass.

The actual span-64 gameplay composition improves on M4 in paving scale, SRAP bay
rhythm, foliage silhouettes and container diversity. It still reads as a stylised
prototype beside the approved contemporary tactical references. Dominant cause:
**asset quality and material/texturing**. Broad uniform surfaces and simple glazing
lack authored local contrast, convincing surface response and crevice information.
**Lighting/contact definition** is a secondary contributor. The foliage correction
breaks the original rounded masses, but does not produce reference-quality trees.
The close gameplay view also exposes these weaknesses: they cannot be attributed
solely to projected resolution. No Babylon architectural limit was demonstrated.

## Delivered scope

| Family | Result / boundary |
| --- | --- |
| Hero | G1 code and GLB unchanged; SHA-256 matches the G1 report |
| Hostile | One olive-coated watcher, cap and folded tote; retained CC0 Quaternius rig; idle/walk/run sampled from existing authoritative movement |
| Pickups | Green PET, amber long-neck bottle, silver/red can reused over the same eight IDs, positions and interaction ownership |
| Court | Paving only within x=-2..34, z=-23.5..16; nominal 1 x .5 m limestone slabs, perimeter band and two drainage details |
| Vegetation | One deciduous family at the two existing east tree anchors; existing ellipse planters and north hedge receive matching shrub treatment |
| Furnishings | Two existing wall-mounted benches receive slats and steel supports; existing peripheral lamps retained; no new population or route obstacles |
| SRAP | Recessed glazing rhythm, red fascia, stone coping, parapet, roof membrane and two rooftop units, with existing branding and open approaches |
| Lighting | Existing sun/fill and 1024 shadow map retained; authored elevated court pieces receive/cast into that lighting system; no new postprocessing |

Environment export: **37,122 triangles, 15 meshes / 17 primitives, 15 materials,
four embedded 512-square textures, 3.53 MB**. Hostile export: **6,132 triangles,
8 meshes / 14 primitives, 12 materials, 62 joints, 0.90 MB**. No rig/material-budget
compliance is claimed: the hostile exceeds the guide's proposed joints/materials.
The four court textures are approximately 5.33 MiB RGBA8 with mipmaps. This excludes
existing scene textures. Scene mesh/material counts are not GPU render submissions;
the proposed whole-scene draw-call/texture guardrails were not fully instrumented.

Editable Blender masters, source cards, hashes, licence and rebuild command:
[assets-source/g2/README.md](../assets-source/g2/README.md). Environment meshes and
textures are original task-authored work. The retained human source/animations are
CC0; no reference artwork is shipped as a game texture.

## Protected behavior and technical verification

`src/square.ts`, `gameplay.ts`, `navigation.ts`, `camera.ts`, `input.ts` and the
accepted `hero.ts` are unchanged. The G1 hero GLB hash remains
`D3F89F5FB2CB3FD2257795207366FD745FD2DBD287373CE53597D4BC4150A327`.
The captured M4, G1 control and G2 scene definitions compare exactly equal.
Art does not enter navmesh or LOS lists. Imported court/character meshes cannot
intercept picking. SRAP art follows the existing cutaway group; solid proxies stay.

- Final `npm run build` including TypeScript: PASS. Existing large-chunk warning remains.
- `npm test`: **32/32 PASS**, including in-place hostile clips, embedded court assets,
  cutaway ownership and deterministic three-variant item identity checks.
- Production Chrome focused regression suite: **18/18 PASS**. Includes boot/retry,
  real keyboard/click input, sprint, complete five-of-eight mission, recycling,
  exit, both SRAP approaches, threat/LOS/hiding, pause, failure and fresh replay.
- Final targeted verification after lowering paving below existing interior/zone
  markings: **4/4 PASS** (hostile integration, full mission, doorway/input and boot).
  Includes walk/run state and actual bone pose, exact pause freeze, cutaway and
  reset resource parity. G1 replay assertions now correctly
  expect **two skeletons / six animation groups** in the square.
- Repeated scene recreation retains **249 scene meshes, 128 materials, two skeletons,
  six animation groups, one navmesh, one input adapter and one scene**.
- 1920 x 1080 normal/wide/detail screenshots and 1366 x 768 checked. No page errors
  in the captures. Proxy overlay derives directly from the unchanged definition.

The original approximately 25 px normal-view hero height remains. Identity relies
on teal versus olive clothing, bag/cap silhouettes, locomotion and the existing
markers. Age and moustache remain close-view details. Container display heights
.65/.72/.45 m are recorded in the source card; characters were not enlarged.

## Matched steady-state performance

Saved production **G1 non-pixel control**, not the pixel experiment. Same machine,
Chrome **153.0.8010.48**, actual **Intel UHD / ANGLE D3D11**, headless, 1920 x 1080,
DPR 1, normal span 64 and unchanged population/clock. Alternating control/candidate
twice, four-second warm-up, 12 seconds per phase. Original G1 west-side idle/walk/
sprint-exhaustion procedure plus an east-court travel phase. Screenshots and video
were outside timing; no other browser tests ran during these samples.

| Phase | Control median, repeats (ms) | G2 median, repeats (ms) | Control p95 (ms) | G2 p95 (ms) |
| --- | --- | --- | --- | --- |
| Idle | 9.6 / 9.4 | 11.6 / 10.8 | 12.0 / 12.9 | 19.3 / 14.1 |
| Walk | 9.2 / 10.1 | 10.7 / 10.7 | 12.0 / 15.8 | 14.8 / 13.1 |
| Sprint/exhaustion | 9.9 / 9.2 | 11.2 / 10.8 | 16.4 / 11.0 | 14.0 / 12.4 |
| Court travel | 9.4 / 9.4 | 10.8 / 10.3 | 13.4 / 12.1 | 14.7 / 11.9 |

The repeatable median increase crosses the guide's approximate 10% review gate in
idle and sprint and in several other samples. p95 is noisier and not uniformly
worse. **Every segment: zero >100 ms frames and zero dropped simulation steps.**
Mean simulation cost: control .181–.268 ms; G2 .302–.451 ms. These are headless
frame intervals, not a new certification of the historical headed 52–54 FPS.

This full comparison preceded the final 2 cm paving-layer correction, which
restores the existing interior floor/wayfinding and hiding-zone surfaces above it.
Final idle/court confirmation is retained separately in `performance-final-surface.json`;
the geometry/material counts and all animation/gameplay paths are unchanged. Final
confirmation preserves the NEEDS WORK verdict, with no >100 ms frames or dropped steps:

| Final phase | Control median (ms) | G2 median (ms) | Control p95 (ms) | G2 p95 (ms) |
| --- | --- | --- | --- | --- |
| idle | 9.6 / 9.1 | 11.6 / 10.8 | 12.7 / 14.5 | 15.0 / 14.2 |
| court | 9.4 / 9.5 | 11.2 / 10.3 | 12.8 / 14.0 | 13.9 / 16.8 |

Only after measuring that regression, a bounded render-only isolation check ran:

| Same G2 simulation, 12-second samples | Median / p95 (ms) |
| --- | --- |
| Full court and hostile | 10.9 / 13.1 |
| Court meshes hidden | 9.2 / 11.9 |
| Hostile render hidden, animation still evaluated | 10.9 / 13.8 |
| Full repeat | 10.8 / 12.6 |

This points to the **court's rendering/shadow workload** as the dominant added
frame cost in this test, rather than the hostile's visible mesh. It does not isolate
triangles from material submissions or shadow passes. The hero pipeline was not
reopened. No speculative optimisation or broader art rollout followed: visual
quality is already below the gate, so this is sufficient evidence for the decision.

## Startup — separate from rendering

Local navigation-to-debug-ready wall time in the full comparison: control **1.171 / 1.431 s**, candidate
**1.339 / 1.435 s**. Final confirmation: control **1.212 / .839 s**, candidate
**1.785 / 1.523 s**. The additional cold asset/initialisation cost is visible in the
final samples; the small sample size and caching variance prevent a precise startup regression estimate. First visits and same-origin repeat visits are retained separately
in the raw data. These are local-server measurements with warm OS/driver caches,
not throttled-network or fully cold-device startup claims. G2 adds approximately
4.42 MB of runtime GLBs; original source/master PNG/Blend files are outside public.

## Evidence and reproduction

Local ignored gallery: [evidence/g2/index.html](../evidence/g2/index.html).
Full M4/control/G2 normal and wide gameplay views, detail view, proxy overlay,
grayscale, 1366 view, SRAP cutaway and motion clip are preserved there.
`performance.json`, `ablation.json`, `assets.json`, `definition-comparison.json`,
`browser-tests.log`, `final-slice-test.log`, `unit-tests.log` and `build.log` retain
the underlying results.

```powershell
$env:TEST_URL='http://127.0.0.1:4179'
$env:BROWSER_CHANNEL='chrome'
npx playwright test tests/hero.spec.ts tests/slice.spec.ts tests/boot.spec.ts tests/input-browser.spec.ts tests/m4.spec.ts tests/square.spec.ts tests/threat.spec.ts tests/world-depth.spec.ts
node scripts/g2-review.mjs
node scripts/g2-performance.mjs
node scripts/g2-ablation.mjs
node scripts/g2-motion.mjs
```

The performance/review scripts require the saved control at `evidence/g2/control-dist`
and M4 screenshot source at `evidence/g1/baseline-dist`. Do not run capture/tests or
builds concurrently with timed performance. The debug-only `artProbe` hook masks
rendering for diagnosis; ordinary gameplay never calls it.

Remaining limitations: flat material/contact response, incomplete final-intent
asset quality, potential fine-leaf aliasing at wide zoom, immediate clip transitions,
and measured court rendering cost. The functional and feasibility decision is
complete; this delivery does not claim visual approval or performance parity.
