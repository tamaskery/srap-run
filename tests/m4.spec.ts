import { expect, test } from '@playwright/test';

test('WASD and arrows move in their on-screen directions', async ({ page }) => {
  await page.goto('/?debug&scene=square&deterministic');
  await page.waitForFunction(() => !!(window as any).__m0);
  const directions = [
    ['KeyW', 0, -1], ['KeyA', -1, 0], ['KeyS', 0, 1], ['KeyD', 1, 0],
    ['ArrowUp', 0, -1], ['ArrowLeft', -1, 0], ['ArrowDown', 0, 1], ['ArrowRight', 1, 0],
  ] as const;
  for (const [key, dx, dy] of directions) {
    const before = await page.evaluate(() => {
      const m = (window as any).__m0;
      m.pause(false);
      m.place('threat', { x: 36, y: 0, z: -22 });
      m.place('player', { x: -5, y: 0, z: 14 });
      const p = m.snapshot().player;
      return m.screen({ ...p, y: 0 });
    });
    await page.keyboard.down(key);
    const player = await page.evaluate(() => (window as any).__m0.advance(30).player);
    await page.keyboard.up(key);
    const after = await page.evaluate(p => (window as any).__m0.screen({ ...p, y: 0 }), player);
    if (dx) expect((after.x - before.x) * dx, key).toBeGreaterThan(5);
    if (dy) expect((after.y - before.y) * dy, key).toBeGreaterThan(5);
  }
});

test('M4 square: doorway keys, obstacle routes, stop/cancel, recenter and smaller viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/?debug&scene=square&deterministic');
  await page.waitForFunction(() => !!(window as any).__m0);
  await page.evaluate(() => { const m = (window as any).__m0; m.pause(false); });
  const snap = () => page.evaluate(() => (window as any).__m0.snapshot());
  const advance = (n: number) => page.evaluate(n => (window as any).__m0.advance(n), n);
  const click = async (x: number, z: number) => {
    const p = await page.evaluate(p => (window as any).__m0.screen(p), { x, y: .05, z });
    await page.mouse.click(p.x, p.y);
  };
  const travel = async (x: number, z: number) => {
    // Isolate surface navigation from patrol timing; the mission test covers live AI.
    await page.evaluate(() => (window as any).__m0.place('threat', { x: 36, y: 0, z: -22 }));
    await click(x, z);
    let s = await snap();
    const approach = s.pending !== null;
    expect(s.path, `accepted ${x},${z}`).toBeGreaterThan(0);
    for (let i = 0; i < 100 && s.path; i++) s = await advance(30);
    expect(Math.hypot(s.player.x - x, s.player.z - z), `arrived ${x},${z}`).toBeLessThan(approach ? 1.25 : .3);
    expect(s.path).toBe(0);
    expect((await advance(30)).player).toEqual(s.player);
  };
  // Pavilions, fountain contour, crossing cover and the road-side walk.
  for (const [x,z] of [[-30,4],[-31,14],[-15,2],[-10,4],[-5,9],[0,4],[-5,-1],[3,-1.5],[7,1],[8,18],[32,18],[32,11],[31,-5],[19,-10]]) await travel(x,z);
  // Camera-relative diagonals produce world -Z through the actual SRAP doorway.
  await page.keyboard.down('KeyS'); await page.keyboard.down('KeyA');
  await advance(120); await page.keyboard.up('KeyS'); await page.keyboard.up('KeyA');
  expect(Math.abs((await snap()).player.z + 15)).toBeLessThan(.3);
  expect(Math.abs((await snap()).player.x - 19)).toBeLessThan(.3);
  await page.keyboard.down('ArrowUp'); await page.keyboard.down('ArrowRight');
  await advance(120); await page.keyboard.up('ArrowUp'); await page.keyboard.up('ArrowRight');
  expect(Math.abs((await snap()).player.z + 10)).toBeLessThan(.3);
  await travel(19,-15); await travel(19,-19); await travel(2,-16.5);
  await page.keyboard.down('KeyD'); await page.keyboard.down('KeyS');
  await advance(120); await page.keyboard.up('KeyD'); await page.keyboard.up('KeyS');
  expect(Math.abs((await snap()).player.x + 3)).toBeLessThan(.3);
  await travel(2,-16.5); await travel(19,-19);
  await page.screenshot({ path: 'test-results/m4-small-interior.png' });
  await click(19,-10);
  expect((await snap()).path).toBeGreaterThan(0);
  await page.keyboard.press('Escape');
  const cancelled = await snap();
  expect(cancelled.path).toBe(0); expect(cancelled.paused).toBe(false);
  expect((await advance(60)).player).toEqual(cancelled.player);
  await page.keyboard.press('Escape'); expect((await snap()).paused).toBe(true);
  expect((await advance(60)).time).toBeCloseTo(cancelled.time + 1, 6);
  await page.keyboard.press('Escape'); expect((await snap()).paused).toBe(false);
  await page.keyboard.press('Home'); await advance(0);
  const centered = await snap();
  expect(centered.camera.target[0]).toBeCloseTo(centered.player.x, 4);
  expect(centered.camera.target[2]).toBeCloseTo(centered.player.z, 4);
  for (const selector of ['header', '#stats', '#objective', '#message', 'footer']) {
    const box = await page.locator(selector).boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(1366);
    expect(box!.y + box!.height).toBeLessThanOrEqual(768);
  }
  expect(errors).toEqual([]);
});

test('M4 ordinary launch: small viewport, local assets and usable controls', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await page.goto('/');
  await expect(page.locator('#health-value')).toHaveText('100');
  expect(await page.evaluate(() => !!(window as any).__m0)).toBe(false);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Resume', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await page.keyboard.down('ArrowUp'); await page.waitForTimeout(500); await page.keyboard.up('ArrowUp');
  await page.screenshot({ path: 'test-results/m4-small-launch.png' });
  expect(errors).toEqual([]);
});
