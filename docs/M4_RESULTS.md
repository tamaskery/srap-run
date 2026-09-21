# M4 — Navigation, performance and release QA

M4 PASS. Audited the M3 baseline at 88ea788 on 2026-09-21. Production code, Recast V2, gameplay and visual treatment are unchanged. No reproducible release-blocking defect was found; no speculative tuning or art work was performed.

## Navigation and controls

The real-time production mission uses physical mouse/keyboard input and the live patrol, without actor placement, inventory injection, damage injection or navigation mocks. It completes collection, pursuit/escape, SRAP entry, recycling, the side exit, success, lethal failure on a second run and fresh replay. Click and keyboard movement, sprint, pan and zoom remain functional throughout.

Additional square checks at 1366 × 768 exercise pavilion and fountain routes, both sides of crossing cover, the road-side pedestrian walk, SRAP doorway traversal in both directions using WASD/arrows, side-exit keyboard traversal and click return, stable stopping, Esc command cancellation versus pause/resume, and Home recenter. These isolate navigation by relocating the threat; the separate mission test retains live AI. Existing surface tests confirm thin-wall/corner collision, doorway clearance, normalized movement at 30/60/120 Hz, camera clamping, cutaway barriers, keyboard/click handoff, sprint exhaustion/recovery and fresh input after resume.

No snag, oscillation, soft lock, unexpected shortcut or replay path failure remained in these routes. Roofs and off-mesh space remain non-walkable; use visible approaches to enter SRAP before its cutaway opens. The road itself is background scenery, not an expanded playable map. Physical floor clicks allow 0.3 m for screen-pixel projection; collectible approaches intentionally stop within 1.2 m. Tests assert completed paths and no subsequent drift.

## Performance gate

- Windows laptop: Intel Core i5-13450HX; Chrome 153, headed, production Vite preview, WebGL2/D3D11.
- Actual renderer: Intel UHD Graphics via ANGLE. The installed RTX 4050 was not used.
- Viewport: 1920 × 1080 CSS pixels; reported drawing buffer 1919 × 1079 (browser/device scaling rounding).
- Complete live-clock scenario: 2.7 minutes; 23 measured travel segments spanning both mission attempts. Existing Diagnostics instrumentation records render-loop intervals and simulation cost. No production instrumentation was added.

| Measurement | Result |
| --- | --- |
| Typical segment median interval | 18.4–19.3 ms, approximately 52–54 FPS |
| Fountain approach median / lowest rolling 5 s | 22.9 ms / 42.1 FPS |
| Sprint escape median / p95 | 19.9 ms / 45.5 ms |
| Interior and side-exit medians | 18.5–19.3 ms |
| Other measured rolling 5 s minima | 46.1–48.1 FPS |
| Segment p95 range | 38.5–50.7 ms |
| Worst measured travel frame | 74.8 ms |
| Travel frames over 100 ms / dropped simulation steps | 0 / 0 |
| Simulation p95 | 0.2–0.6 ms |
| Runtime console warnings / errors | 0 / 0 |

The below-45 fountain segment triggered investigation. Three isolated 12-second live-clock repetitions of that approach produced 18.7 ms medians, minimum rolling 5-second rates of 47.0, 46.5 and 47.0 FPS, worst frames of 51.1–57.5 ms, and zero dropped steps or >100 ms stalls. The low segment did not recur. Simulation cost stayed small, so there is no evidence justifying navigation-loop optimization. Chase/interior controls remained responsive and the second mission showed no progressive degradation.

Conclusion: acceptable on this development laptop's integrated GPU, though not a locked 60 FPS. These are measured frame intervals under browser automation, not a GPU benchmark or certification of every laptop. Short segments cannot produce a five-second rolling statistic. Per-travel sampling excludes screenshots, startup and some stationary waits; success transition is included. Reported representative FPS is reciprocal median frame time, not an arithmetic average FPS.

## Release QA and reproducibility

- `npm run build`: TypeScript and production bundle PASS.
- `npm test`: 28/28 unit tests PASS.
- Final `npx tsc --noEmit`: PASS after test changes.
- Chrome: `tests/boot.spec.ts`, `tests/input-browser.spec.ts`, `tests/navigation.spec.ts`: 9/9 focused checks PASS, including real local WASM and failure/retry recovery.
- Chrome: `tests/m4.spec.ts`: 2/2 PASS, including ordinary non-debug startup, no missing assets, usable controls and smaller-viewport checks.
- Chrome: `tests/square.spec.ts`: PASS with both deterministic and real-time clocks. Mission HUD, prompts, mute, reports, damage, escape, success/failure, repeated replay and resource/state reset checked.
- Exterior/interior at 1920 × 1080 and smaller viewport imagery visually inspected. M3 art remains intact. No uncaught exceptions, repeated errors, missing assets or release-blocking layout failure found.

PowerShell reproduction, after `npm run build` and `npm run preview -- --port 4175 --strictPort`:

```powershell
$env:TEST_URL='http://127.0.0.1:4175'
$env:BROWSER_CHANNEL='chrome'
npx playwright test tests/m4.spec.ts tests/navigation.spec.ts tests/input-browser.spec.ts tests/boot.spec.ts
$env:M4_REALTIME='1'
npx playwright test tests/square.spec.ts --headed
Remove-Item Env:M4_REALTIME
```

The real-time test attaches browser, renderer, viewport, segment timings and runtime messages as JSON in the Playwright report. Screenshots, raw reports and one-off investigation scripts are ignored local artifacts, not release files. Changes are limited to release tests and milestone documentation. No dependencies or production assets changed.

## Frozen boundary

M4 closes the functional V1 baseline. Pixel-art/Commandos-style comparison, ambient soundscape and traffic remain separate work; none was started. No M5 work is authorized by this result.
