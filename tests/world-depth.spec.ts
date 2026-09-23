import { expect, test } from '@playwright/test';

test('M2 alternate five: cover, keyboard doorway, interior interaction, ambient pause and replay', async ({ page }) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 1920, height: 1080 });
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/?debug&scene=square&deterministic');
  await page.waitForFunction(() => !!(window as any).__m0);
  await page.evaluate(() => (window as any).__m0.pause(false));
  const snapshot = () => page.evaluate(() => (window as any).__m0.snapshot());
  const advance = (n = 30) => page.evaluate(n => (window as any).__m0.advance(n), n);
  const baseline = await snapshot();
  const travel = async (x: number, z: number, item = false) => {
    const screen = await page.evaluate(p => (window as any).__m0.screen(p), { x, y: item ? .45 : .05, z });
    await page.mouse.click(screen.x, screen.y);
    let s = await snapshot();
    expect(s.path, 'route to ' + x + ',' + z).toBeGreaterThan(0);
    for (let i = 0; i < 160 && s.path; i++) s = await advance();
    expect(s.phase).not.toBe('failure');
    expect(s.path).toBe(0);
    if (s.phase !== 'success') expect(Math.hypot(s.player.x - x, s.player.z - z)).toBeLessThan(item ? 1.25 : .3);
    return s;
  };
  await travel(-32, -8, true);
  await travel(-30, -15);
  await travel(-1, -15, true);
  // Visit the bay below quota; entering does not recycle automatically.
  await travel(-2, -16.5);
  await travel(2, -16.5);
  await travel(21, -19);
  await travel(26, -19);
  const shell = await page.evaluate(() => {
    const m = (window as any).__m0;
    let solid = false;
    try { m.probe({x:19,y:0,z:-15}, {x:23,y:0,z:-14.5}); } catch { solid = true; }
    return { solid, screenBlocks: !m.los({x:19,y:0,z:-15}, {x:26,y:0,z:-15}),
      frontBlocks: !m.los({x:10,y:0,z:-10}, {x:10,y:0,z:-15}) };
  });
  expect(shell).toEqual({solid:true, screenBlocks:true, frontBlocks:true});
  await page.keyboard.press('KeyE');
  expect((await advance(1)).phase).toBe('collecting');
  expect((await snapshot()).bag).toBe(2);
  await travel(19, -15);
  // W+D follows world +z with this fixed camera: walk out the front doorway.
  await page.keyboard.down('KeyW'); await page.keyboard.down('KeyD');
  await advance(120);
  await page.keyboard.up('KeyW'); await page.keyboard.up('KeyD');
  let s = await snapshot();
  expect(Math.abs(s.player.x - 19)).toBeLessThan(.3); expect(s.player.z).toBeGreaterThan(-11);
  // Return across the same opening using keyboard before leaving with a click.
  await page.keyboard.down('KeyS'); await page.keyboard.down('KeyA');
  await advance(120);
  await page.keyboard.up('KeyS'); await page.keyboard.up('KeyA');
  expect((await snapshot()).player.z).toBeLessThan(-14);
  await travel(19, -10);
  await travel(31, -5, true);
  await travel(33, 11);
  await travel(32, 14, true);
  await travel(33, -3);
  await travel(19, -4);
  await page.keyboard.down('ShiftLeft');
  await travel(3, -3, true);
  expect((await snapshot()).stamina).toBeLessThan(100);
  await travel(3, -1.5);
  await page.keyboard.up('ShiftLeft');
  s = await advance(1);
  expect(s.bag).toBe(5); expect(s.hidden).toBe(true);
  // Visible wall blocks sight; the exposed end of the crossing stays visible.
  const cover = await page.evaluate(() => {
    const m = (window as any).__m0;
    return [m.los({x:3,y:0,z:3},{x:3,y:0,z:-1.5}), m.los({x:7,y:0,z:3},{x:7,y:0,z:-1.5})];
  });
  expect(cover).toEqual([false, true]);
  await advance(600); // Waiting in cover lets the live patrol pass.
  expect((await snapshot()).phase).toBe('collecting');
  expect((await snapshot()).ambient).not.toEqual(baseline.ambient);
  await page.evaluate(() => (window as any).__m0.pause(true));
  const paused = await snapshot();
  expect((await advance(180)).ambient).toEqual(paused.ambient);
  await page.evaluate(() => (window as any).__m0.pause(false));
  await travel(3, -9);
  await travel(19, -10);
  await travel(19, -15);
  await travel(21, -19);
  // Clicking the zone approaches and uses the same interior interaction.
  const recycler = await page.evaluate(() => (window as any).__m0.screen({x:26,y:.05,z:-19}));
  await page.mouse.click(recycler.x, recycler.y);
  for(let i=0;i<100 && (await snapshot()).phase==='collecting';i++) await advance();
  expect((await snapshot()).recycled).toBe(5);
  await page.screenshot({path:'test-results/m2-interior.png'});
  await travel(2, -16.5);
  await travel(-5, -16.5);
  expect((await snapshot()).cutaways).not.toContain('srap');
  await travel(-30, -10);
  await travel(-33, 16);
  expect((await snapshot()).phase).toBe('success');
  const ended = await snapshot();
  expect((await advance(180)).ambient).toEqual(ended.ambient);
  await page.getByRole('button', {name:'Replay'}).click();
  await page.waitForFunction(() => !!(window as any).__m0);
  const fresh = await snapshot();
  for(const key of ['ambient','player','threat','camera','resources','cutaways','bag','recycled','health','stamina']) expect(fresh[key],key).toEqual(baseline[key]);
  expect(errors).toEqual([]);
});
