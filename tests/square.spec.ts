import { expect, test } from '@playwright/test';

test('M1 square: one authored mission, escape, recycling, success, failure and fresh replay', async ({ page }) => {
  test.setTimeout(180000);
  await page.setViewportSize({ width: 1920, height: 1080 });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  // Debug only supplies telemetry, projection and a deterministic clock. No actor
  // placement, inventory injection, damage injection or navigation mocking.
  await page.goto('/?debug&scene=square&deterministic');
  await page.waitForFunction(() => !!(window as any).__m0);
  const prepare = async () => page.evaluate(() => {
    const m = (window as any).__m0; m.deterministic(true); m.pause(false); return m.snapshot();
  });
  await page.screenshot({ path: 'test-results/m1-start.png' });
  const baseline = await prepare();
  expect(baseline.scene).toBe('square');
  const states = new Set<string>();
  const snapshot = () => page.evaluate(() => (window as any).__m0.snapshot());
  const advance = async (frames = 30) => {
    const s = await page.evaluate(n => (window as any).__m0.advance(n), frames);
    states.add(s.state); return s;
  };
  const click = async (x: number, z: number, y = .05) => {
    const p = await page.evaluate(point => (window as any).__m0.screen(point), { x, y, z });
    expect(p.x).toBeGreaterThan(0); expect(p.x).toBeLessThan(1920);
    expect(p.y).toBeGreaterThan(0); expect(p.y).toBeLessThan(1080);
    await page.mouse.click(p.x, p.y);
  };
  const travel = async (x: number, z: number, item = false) => {
    await click(x, z, item ? .45 : .05);
    let s = await snapshot();
    const approach = s.pending !== null;
    expect(s.path, `click route to ${x},${z}`).toBeGreaterThan(0);
    for (let i = 0; i < 140 && s.path; i++) s = await advance();
    expect(s.phase, `travel ${x},${z}`).not.toBe('failure');
    if (s.phase === 'success') {
      const exit = await page.evaluate(() => (window as any).__m0.definition().zones.find((z:any) => z.kind === 'exit'));
      expect(Math.abs(s.player.x - exit.x)).toBeLessThanOrEqual(exit.width / 2);
      expect(Math.abs(s.player.z - exit.z)).toBeLessThanOrEqual(exit.depth / 2);
    } else expect(Math.hypot(s.player.x - x, s.player.z - z), JSON.stringify({target:{x,z},player:s.player,path:s.path})).toBeLessThan(approach ? 1.25 : .3);
    return s;
  };
  // Physical keyboard, release, then mouse all feed the same controller.
  await page.keyboard.down('KeyD'); await advance(30); await page.keyboard.up('KeyD');
  expect((await snapshot()).player).not.toEqual(baseline.player);
  await travel(-32, -8, true);
  expect((await snapshot()).bag).toBe(1);
  await page.mouse.move(900, 500); await page.mouse.wheel(0, 120); await advance(0);
  expect((await snapshot()).camera.span).toBeGreaterThan(baseline.camera.span);
  await page.mouse.wheel(0, -120); await advance(0);
  await page.mouse.down({button:'middle'}); await page.mouse.move(950, 530); await page.mouse.up({button:'middle'}); await advance(0);
  expect((await snapshot()).camera.target).not.toEqual(baseline.camera.target);
  await page.mouse.down({button:'middle'}); await page.mouse.move(900, 500); await page.mouse.up({button:'middle'}); await advance(0);
  await travel(-30, 4);
  expect((await advance(1)).hidden).toBe(true);
  expect((await snapshot()).cutaways).toContain('pavilions');
  // Render cutaways must retain solid navigation and LOS blockers.
  const solid = await page.evaluate(() => {
    const m = (window as any).__m0;
    return { rejected: !m.command({ x: -22, y: 0, z: -3 }),
      blocked: !m.los({ x: -29, y: 0, z: -3 }, { x: -15, y: 0, z: -3 }) };
  });
  expect(solid).toEqual({ rejected: true, blocked: true });
  await travel(-31, 11, true);
  await travel(-33, 16);
  expect((await snapshot()).phase).toBe('collecting');
  await travel(-15, 2, true);
  await travel(-5, 9, true);
  // Expose the player on the patrol crossing, then use the eastern shelter.
  await travel(2, 9);
  for (let i = 0; i < 100 && !states.has('chase'); i++) await advance(15);
  expect(states.has('chase')).toBe(true);
  await page.keyboard.down('ShiftLeft');
  await travel(19, 11);
  await page.keyboard.up('ShiftLeft');
  for (let i = 0; i < 100 && (await snapshot()).state !== 'patrol'; i++) await advance(30);
  expect(states.has('search')).toBe(true);
  expect(states.has('return')).toBe(true);
  expect((await snapshot()).state).toBe('patrol');
  expect((await snapshot()).hidden).toBe(true);
  await page.screenshot({ path: 'test-results/m1-escaped.png' });
  await travel(32, 11);
  await travel(31, -5, true);
  expect((await snapshot()).bag).toBe(5);
  await expect(page.locator('#objective')).toContainText('SRAP recycler');
  await travel(23, -10);
  expect((await snapshot()).cutaways).toContain('srap');
  await page.keyboard.press('KeyE'); await advance(1);
  expect((await snapshot()).recycled).toBe(5);
  expect((await snapshot()).phase).toBe('exiting');
  await expect(page.locator('#objective')).toContainText('Ecseri exit');
  await page.screenshot({ path: 'test-results/m1-recycled.png' });
  await travel(-1, -15);
  await travel(-30, -10);
  await travel(-33, 16);
  expect((await snapshot()).phase).toBe('success');
  await page.screenshot({ path: 'test-results/m1-success.png' });
  await page.getByRole('button', { name: 'Replay' }).click();
  await page.waitForFunction(() => !!(window as any).__m0);
  const replay = await prepare();
  for (const key of ['phase', 'health', 'stamina', 'bag', 'recycled', 'player', 'threat', 'state', 'hidden', 'cutaways', 'camera', 'resources']) expect(replay[key], key).toEqual(baseline[key]);
  // A second attempt deliberately walks into the same live patrol and stays.
  await travel(-30, 4);
  await travel(-15, 2);
  await travel(2, 9);
  for (let i = 0; i < 180 && (await snapshot()).phase !== 'failure'; i++) await advance(30);
  expect((await snapshot()).phase).toBe('failure');
  expect((await snapshot()).health).toBe(0);
  await page.screenshot({ path: 'test-results/m1-failure.png' });
  await page.getByRole('button', { name: 'Replay' }).click();
  await page.waitForFunction(() => !!(window as any).__m0);
  const fresh = await prepare();
  expect(fresh.health).toBe(100); expect(fresh.bag).toBe(0); expect(fresh.phase).toBe('collecting');
  expect(fresh.camera).toEqual(baseline.camera); expect(fresh.resources).toEqual(baseline.resources);
  expect(errors).toEqual([]);
});
