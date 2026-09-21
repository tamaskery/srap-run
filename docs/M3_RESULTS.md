# M3 — Visual and game-feel production

M3 PASS. Started from clean main at fd506a2668b81a5a082e07d558540c47810bb8e5; local origin/main and remote main both matched. M0/M1/M2 were not reopened.

## Visual result

The square uses stone, olive, cream and terracotta, paving joints/bands/curbs, crossing markings and warm sun/cool fill with selective shadows. SRAP has storefront and service-elevation glazing, frames, fascia, roof/service signage, roof seams, a vent and entrance canopy. Its cutaway interior has tiled circulation, wall skirting and a dressed recycler. Rounded pavilions have glazing/ribs and layered roofs. The fountain has opaque water, ripples and bronze seals; shrubs/hedges, trees, benches and lamps establish scale. Background buildings have window/sill rhythms and cornices.

The fixed camera and layout remain. Service-side/roof signage identify SRAP from the gameplay view. Decorations are non-pickable and never enter collision/navigation/LOS. Foliage occupies existing solid garden/hedge footprints. Static details merge by material and cutaway ownership. Materials/primitive geometry are shared; locally generated textures are 128px paving and 512 × 128 signs. No external media or new dependencies.

## Characters, interactions, UI and audio

The player has a sand jacket, scarf, green rucksack and cream foot ring. The hostile has a dark uniform, cap, belt and red armband/ring. Civilians retain their two loops and clothing colors. Characters face movement with opposing arm/leg motion; pause/results stop locomotion. Green bottles have necks, caps, labels and gold rings; every component retains its interaction target.

The compact brass/olive HUD provides health/stamina meters, quota, recycled count, time, threat/concealment state, contextual prompts and terminal reports. Pickup counter pulses, damage flashes and alert-sensitive cone colors give feedback. Local Web Audio generates pickup, recycling, pursuit, damage, movement and result cues after a gesture, with mute and disposal. The sound button returns gameplay focus. Asset-based ambient sound is deferred.

## Gameplay preservation and verification

- npm run build: TypeScript and production bundle pass.
- npx vitest run src/art.test.ts: 2/2 presentation contract tests pass.
- With TEST_URL=http://127.0.0.1:4175 and BROWSER_CHANNEL=chrome, npx playwright test tests/square.spec.ts: 1/1 integrated production scenario passes at 1920 × 1080. Physical keyboard/mouse, real Recast/live patrol and existing deterministic clock; no teleports, inventory/damage injection or mocked navigation.
- Covers five pickups, keyboard/click travel, camera controls, cover/LOS, chase/search/return, sprint escape, entry/recycling/side exit, Ecseri success, lethal failure and fresh replay. Also checks civilian motion, mute/focus, quota/results, all SRAP cutaway detail visibility/restoration, stable resource ownership and no runtime/console errors.
- Desktop exterior/interior/results visually reviewed; ordinary non-debug launch inspected live. Local screenshots remain in ignored test-results. No historical broad QA or formal performance gate.
- Visual review corrected primitive handedness, texture wrap addressing and sign-facing orientation. The new sound-button focus issue was fixed. gameplay.ts, navigation.ts, input.ts, camera.ts and square.ts remain unchanged.
- Final diff/whitespace reviewed. No known blocking M3 regression remains.

## M4 boundary

Known usable-but-odd navigation feel, representative performance, final tuning, browser/release QA and V1 packaging remain M4. No ordinary-laptop frame-rate certification is claimed. Ambient sound sourcing and traffic remain deferred.

## Play

From the repository: npm run build, then npm run preview -- --port 4175 --strictPort. Open http://127.0.0.1:4175/ (the current preview is already running there).

Click move/collect; WASD/arrows move; Shift sprint; E interact; middle-drag pan; wheel zoom; Home recenter; Esc cancel/pause. Replay starts fresh. Sound toggles synthesized cues.
