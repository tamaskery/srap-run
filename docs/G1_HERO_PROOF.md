# G1 — hero visual and pipeline proof

Date: 2026-09-21. Branch: `codex/g1-hero-proof`, created directly from verified **non-pixel M4 `9e07cfc`**. The pixel experiment remains on its original branch. Existing user edits to AGENTS.md and untracked design/reference files were preserved.

## Verdict

**TECHNICAL: PASS** for this bounded import/animation proof.

**VISUAL: WEAK**. The authored civilian is a clear improvement over the primitive player, with slim proportions, moustache, teal clothing, neutral trainers and a compact canvas recycling backpack. The stylised face still reads younger than approximately 40, and facial identity is faint at normal/wide framing. This is sufficient evidence that the technical path works, not approval to roll this art quality out to other characters.

## Delivered asset and integration

Free **Casual Character by Quaternius**, including its animations, adapted from the CC0 Ultimate Modular Men pack. [Author's pack](https://quaternius.com/packs/ultimatemodularcharacters.html), [specific model](https://poly.pizza/m/kZ3DmIoGip), [CC0 terms](https://creativecommons.org/publicdomain/zero/1.0/). No purchase or paid service. Full provenance, source/export hashes and reproduction command: `assets-source/hero/README.md`. Unmodified GLB and editable Blender master are retained outside the public bundle.

Runtime GLB: 933,492 bytes, 6,460 triangles, one 62-joint skeleton, 11 meshes / 18 primitives, 12 flat PBR materials, no textures. It exceeds the guide's proposed 35–55-joint / atlas targets; this is disclosed, not silently treated as the final production budget. Only idle-neutral, walk and run are exported. Root translation remains constant in all three clips; the asset regression check enforces it.

`src/hero.ts` loads the local asset using approved `@babylonjs/loaders@9.27.1` (glTF 2 loader only). The player controller retains its transform, collision and input ownership. Visual facing follows achieved movement; clip selection follows displacement and authoritative sprint state. The existing fixed simulation tick samples the paused animation group, so wall-clock rendering cannot move a pose during pause. Walk/run phase follows travelled distance (source stance estimates: 1.7 / 2.1 metres per cycle). All rig, mesh, material and animation resources belong to the current scene, with no cross-replay cache or observer.

Production source changes are confined to the new hero module and narrow creation/update/diagnostic hooks in `src/main.ts`, plus the approved package and asset. `src/square.ts`, gameplay, navigation, camera, input, mission logic, other art, items and map geometry are unchanged from M4.

## Verification

Final production `npm run build` (includes TypeScript check): PASS. `npm test`: **29/29 PASS**, including the exported asset contract. Build emits a size warning: main JS 1,977.90 kB / 467.44 kB gzip, versus M4's 1,763.98 / 415.31 kB; the GLB is additional. No warning was suppressed.

Final production Chrome checks: **9/9 PASS**:

```powershell
$env:TEST_URL='http://127.0.0.1:4177'
$env:BROWSER_CHANNEL='chrome'
npx playwright test tests/hero.spec.ts tests/boot.spec.ts tests/input-browser.spec.ts tests/m4.spec.ts tests/square.spec.ts
```

These cover boot and failure recovery; physical WASD/arrows/click movement and picking; walk/sprint selection with actual bone-pose changes; sprint depletion; exact pose and position freeze while paused; fresh input after resume; bottle collection; threat chase/escape/damage; SRAP doorway navigation and recycling; success/failure and replay. Three additional hero resets preserve identical resources: **253 scene meshes, 112 materials, one skeleton, three animation groups, one navmesh, one input adapter, one scene**. M4 has 245 scene meshes. No page errors in the hero check or captures.

Close game captures and walk/run samples show feet at the ground and the existing directional shadow, with the backpack attached during movement. The imported source retains small gait imperfections; distance sampling reduces speed mismatch but is not foot locking. Animation transitions are immediate, without a blend tree or foot IK.

## Matched performance

Saved production M4 build compared to final production hero build, alternating baseline/hero twice. Same machine, **Chrome 153.0.8010.48, Intel UHD / ANGLE D3D11**, 1920 × 1080, device scale 1, normal non-pixel camera span 64. Four seconds warm-up, then 12 seconds each of idle, walk and sprint/exhaustion per build per repeat. Sprint observations include the unchanged stamina-driven return to walk. Total measured duration approximately 144 seconds. Reproduce with `node scripts/g1-performance.mjs` after providing the saved M4 build at `evidence/g1/baseline-dist` and candidate at `dist`.

| Phase | M4 median frame interval, repeats | Hero median frame interval, repeats |
| --- | --- | --- |
| Idle | 9.1 / 9.1 ms | 9.0 / 9.1 ms |
| Walk | 9.5 / 9.3 ms | 9.0 / 8.9 ms |
| Sprint / exhaustion | 9.1 / 8.8 ms | 9.2 / 9.0 ms |

Every accepted segment had **zero >100 ms frames and zero dropped simulation steps**. Hero mean simulation time 0.160–0.218 ms versus M4 0.092–0.107 ms. No material frame-time regression in these samples; differences of this size are run variance, not evidence of a speed improvement. Hero minimum rolling five-second rates were 103.5–111.3 FPS, baseline 99.2–110.4 FPS.

**Measurement limit:** this accepted comparison uses headless Chrome with the actual Intel renderer. The attempted headed run entered approximately 1,006 ms frame intervals in both baseline and candidate despite reporting visible/focused at sample boundaries. That run is retained as inconclusive (`performance-headed-inconclusive.json`). It does not establish a new gameplay regression or reproduce the historical headed M4 52–54 FPS result. No locked-60, long-duration, or all-hardware claim is made.

## Actual-game evidence

Local ignored review artefacts in `evidence/g1/`:

- `index.html`: review page with original full-frame captures and motion video.
- `hero-close.png`, `hero-normal.png`, `hero-wide.png`: existing camera spans **15 / 64 / 76**, 1920 × 1080, near the mission start. Camera controls were used without changing camera code or limits.
- `hero-walk-0..3.png`, `hero-sprint-0..3.png`: distinct sampled poses in the actual square.
- `hero-motion.webm`: short real-time walk/run/pause/resume capture.
- `performance.json`, `browser-tests.json`, `build.log`, `unit-tests.log`: measurement and verification records.

Approximate visible standing height is 107 px at close, 25 px at normal, 21 px at wide in these captures. The proposed 36–56 px normal-view target is therefore not achieved with the preserved camera and natural body scale. The moustache is present but cannot carry identity at those distances; teal top, bag silhouette and the unchanged ground marker do most of the work.

G1 stops here. No hostile, bottle, building, bird, scooter or other art upgrade was made. The remaining visual weakness is an explicit result of the proof, not an unreported technical pass.
