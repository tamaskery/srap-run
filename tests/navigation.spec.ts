import { expect, test, type Page } from '@playwright/test';

async function load(page: Page) {
  await page.goto('/?debug');
  await page.waitForFunction(() => !!(window as any).__m0);
  await page.evaluate(() => {
    const api = (window as any).__m0;
    api.deterministic(true); api.pause(false);
    api.place('threat', { x: 27, y: 0, z: 0 });
  });
}

test('F05 real surface motor blocks thin wall and inner corner at 30/60/120 Hz', async ({ page }) => {
  await load(page);
  const results = await page.evaluate(() => {
    const api = (window as any).__m0;
    const drive = (x: number, z: number) => api.action({ type: 'move', x: (x + z) / Math.SQRT2, z: (-x + z) / Math.SQRT2, sprint: false });
    return [30, 60, 120].map(hz => {
      api.place('player', { x: -13, y: 0, z: 0 }); drive(1, 0);
      const wall = api.schedule(hz, 10).player;
      api.place('player', { x: -1, y: 0, z: 4 }); drive(-1, 1);
      const corner = api.schedule(hz, 10).player;
      api.place('player', { x: -17, y: 0, z: -12 }); drive(1, 0);
      const walk = api.schedule(hz, 5).player;
      api.place('player', { x: -17, y: 0, z: -12 }); drive(1, 1);
      const diagonal = api.schedule(hz, 5).player;
      return { hz, wall, corner, walk, diagonal, dropped: api.snapshot().diagnostics.dropped };
    });
  });
  for (const r of results) {
    expect(r.wall.x).toBeGreaterThan(-12);
    expect(r.wall.x).toBeLessThanOrEqual(-11.38);
    expect(Math.abs(r.wall.z)).toBeLessThan(0.01);
    expect(r.corner.x).toBeGreaterThanOrEqual(-2.21);
    expect(r.corner.x).toBeLessThan(-1.8);
    expect(r.corner.z).toBeLessThanOrEqual(5.21);
    expect(r.corner.z).toBeGreaterThan(4.8);
    expect(Math.hypot(r.walk.x + 17, r.walk.z + 12)).toBeCloseTo(12.5, 1);
    expect(Math.hypot(r.diagonal.x + 17, r.diagonal.z + 12)).toBeCloseTo(12.5, 1);
    for (const p of [r.wall, r.corner, r.walk, r.diagonal]) expect(Math.abs(p.y)).toBeLessThan(0.11);
    expect(r.dropped).toBe(0);
  }
  expect(Math.max(...results.map(r => r.walk.x)) - Math.min(...results.map(r => r.walk.x))).toBeLessThan(0.1);
});

test('F08 doorway traverses both directions by command and keys; narrow opening blocks', async ({ page }) => {
  await load(page);
  const result = await page.evaluate(() => {
    const api = (window as any).__m0;
    const runs = [];
    for (const mode of ['command', 'keys']) for (const direction of [1, -1]) {
      const start = { x: 12, y: 0, z: direction === 1 ? 0 : 4 };
      const target = { x: 12, y: 0, z: direction === 1 ? 4 : 0 };
      api.place('player', start);
      let accepted = true;
      if (mode === 'command') accepted = api.command(target);
      else api.action({ type: 'move', x: direction / Math.SQRT2, z: direction / Math.SQRT2, sprint: false });
      runs.push({ mode, direction, accepted, end: api.advance(96).player, target });
    }
    api.place('player', { x: 11, y: 0, z: -12 });
    api.action({ type: 'move', x: 1 / Math.SQRT2, z: 1 / Math.SQRT2, sprint: false });
    const narrow = api.advance(600).player;
    const detour = api.probe({ x: 11, y: 0, z: -12 }, { x: 11, y: 0, z: -8 });
    return { runs, narrow, detour };
  });
  for (const r of result.runs) {
    expect(r.accepted).toBe(true);
    expect(Math.hypot(r.end.x - r.target.x, r.end.z - r.target.z)).toBeLessThan(0.2);
  }
  // Recast coordinates are float32; allow rounding at the exact clearance edge.
  expect(result.narrow.z).toBeLessThanOrEqual(-10.4 + 1e-5);
  expect(result.narrow.z).toBeGreaterThan(-11);
  expect(Math.abs(result.narrow.x - 11)).toBeLessThan(0.05);
  expect(result.detour.some((p: { x: number }) => p.x < 6.8 || p.x > 15.2)).toBe(true);
});

test('F10 orthographic pan zoom resize clamp the ground footprint and Home recentres', async ({ page }) => {
  await load(page);
  const before = await page.evaluate(() => (window as any).__m0.snapshot());
  for (const sign of [-1, 1]) {
    const snap = await page.evaluate(sign => {
      const api = (window as any).__m0;
      api.action({ type: 'zoom', delta: sign * 100000 });
      api.action({ type: 'pan', dx: sign * 100000, dy: sign * 100000 });
      return api.snapshot();
    }, sign);
    expect(snap.camera.span).toBe(sign === -1 ? 15 : 35);
    expect(snap.camera.alpha).toBeCloseTo(before.camera.alpha, 8);
    expect(snap.camera.beta).toBeCloseTo(before.camera.beta, 8);
    const extent = (snap.camera.span / 2 * snap.drawingBuffer[0] / snap.drawingBuffer[1] + snap.camera.span / 2 / Math.cos(Math.PI / 4)) / Math.SQRT2;
    expect(Math.abs(snap.camera.target[0]) + extent).toBeLessThanOrEqual(50.0001);
    expect(Math.abs(snap.camera.target[2]) + extent).toBeLessThanOrEqual(50.0001);
  }
  await page.setViewportSize({ width: 1000, height: 800 });
  await page.keyboard.press('Home');
  const after = await page.evaluate(() => (window as any).__m0.snapshot());
  expect(after.camera.target[0]).toBeCloseTo(after.player.x, 5);
  expect(after.camera.target[2]).toBeCloseTo(after.player.z, 5);
  expect(after.camera.alpha).toBeCloseTo(before.camera.alpha, 8);
  expect(after.camera.beta).toBeCloseTo(before.camera.beta, 8);
});

test('F11 repeated cutaway boundary crossings retain wall LOS and navigation barriers', async ({ page }) => {
  await load(page);
  const result = await page.evaluate(() => {
    const api = (window as any).__m0;
    const snapshots = [], rendered = [];
    for (let i = 0; i < 10; i++) {
      const states = [];
      // Cutaway begins at z=.5, remains hidden through its .35m hysteresis margin.
      for (const z of [0, 0.6, 0.4, 0.2, 0]) {
        api.place('player', { x: 12, y: 0, z });
        const snap = api.advance(1);
        states.push(snap.cutaways.includes('room'));
        rendered.push(snap.renderGroups.find((group: { id: string }) => group.id === 'room').visible);
      }
      snapshots.push(states);
    }
    api.place('player', { x: 12, y: 0, z: 4 });
    const hidden = api.advance(1).cutaways;
    const throughWall = api.los({ x: 10, y: 0, z: 1 }, { x: 10, y: 0, z: 3 });
    const throughDoor = api.los({ x: 12, y: 0, z: 1 }, { x: 12, y: 0, z: 3 });
    const route = api.probe({ x: 10, y: 0, z: 0 }, { x: 10, y: 0, z: 4 });
    return { snapshots, rendered, hidden, throughWall, throughDoor, route };
  });
  expect(result.snapshots).toEqual(Array.from({ length: 10 }, () => [false, true, true, true, false]));
  for (let i = 0; i < result.rendered.length; i++) expect(result.rendered[i]).toEqual([0, 4].includes(i % 5) ? [true, true, true, true] : [false, false, false, false]);
  expect(result.hidden).toContain('room');
  expect(result.throughWall).toBe(false); expect(result.throughDoor).toBe(true);
  expect(result.route.some((p: { x: number }) => p.x > 11.4)).toBe(true);
});
