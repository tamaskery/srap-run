import { expect, test, type Page } from '@playwright/test';

async function ready(page: Page) {
  await page.waitForFunction(() => !!(window as any).__m0);
  await page.evaluate(() => { const api = (window as any).__m0; api.deterministic(true); api.pause(false); });
}
async function load(page: Page) { await page.goto('/?debug'); await ready(page); }
async function isolateThreat(page: Page) {
  await page.evaluate(() => (window as any).__m0.place('threat', { x: 27, y: 0, z: 0 }));
}

test('F03 injected navigation failure stops boot and Retry recovers', async ({ page }) => {
  await page.goto('/?debug&failNav');
  await expect(page.getByRole('alert')).toContainText('Injected navigation load failure');
  expect(await page.evaluate(() => !!(window as any).__m0)).toBe(false);
  await page.getByRole('button', { name: 'Retry' }).click();
  await ready(page);
  await expect(page.locator('#stats')).toContainText('COLLECTING');
});

test('F04 real bundled navigation takes a detour around the L obstacle', async ({ page }) => {
  await load(page); await isolateThreat(page);
  const result = await page.evaluate(() => {
    const api = (window as any).__m0;
    const start = { x: -7, y: 0, z: 0 }, target = { x: 0, y: 0, z: 3 };
    api.place('player', start);
    const route = api.probe(start, target);
    const accepted = api.command(target);
    let clipped = false;
    for (let i = 0; i < 600; i++) {
      const p = api.advance(1).player;
      if (p.x > -3.5 && p.x < -2.5 && p.z > -4 && p.z < 6) clipped = true;
    }
    return { accepted, route, clipped, end: api.snapshot().player };
  });
  expect(result.accepted).toBe(true);
  expect(result.route.length).toBeGreaterThan(2);
  expect(result.clipped).toBe(false);
  expect(Math.hypot(result.end.x, result.end.z - 3)).toBeLessThan(0.2);
});

test('F06 disconnected, off-mesh targets and invalid starts are rejected', async ({ page }) => {
  await load(page);
  const result = await page.evaluate(() => {
    const api = (window as any).__m0, before = api.snapshot().player;
    const island = api.command({ x: 27, y: 0, z: 0 });
    const offmesh = api.command({ x: 80, y: 0, z: 80 });
    let invalid = false;
    try { api.probe({ x: 80, y: 0, z: 80 }, before); } catch { invalid = true; }
    return { island, offmesh, invalid, before, after: api.snapshot().player };
  });
  expect(result.island).toBe(false); expect(result.offmesh).toBe(false); expect(result.invalid).toBe(true);
  expect(result.after).toEqual(result.before);
});

test('F07 twenty click-key-release sequences discard pending interactions', async ({ page }) => {
  await load(page); await isolateThreat(page);
  const outcomes = await page.evaluate(() => {
    const api = (window as any).__m0;
    return Array.from({ length: 20 }, () => {
      api.place('player', { x: -7, y: 0, z: -7 });
      const initial = api.command({ x: 0, y: 0, z: 3 }, 'bottle');
      api.action({ type: 'move', x: 1, z: 0, sprint: false });
      const cancelled = api.snapshot();
      const ignored = api.command({ x: 0, y: 0, z: 3 }, 'bottle');
      api.advance(10);
      api.action({ type: 'move', x: 0, z: 0, sprint: false });
      const stopped = api.snapshot().player;
      const later = api.advance(30).player;
      const fresh = api.command({ x: -7, y: 0, z: -7 });
      return { initial, pending: cancelled.pending, path: cancelled.path, ignored, stopped, later, fresh };
    });
  });
  for (const outcome of outcomes) {
    expect(outcome.initial).toBe(true); expect(outcome.pending).toBeNull(); expect(outcome.path).toBe(0);
    expect(outcome.ignored).toBe(false); expect(outcome.later).toEqual(outcome.stopped); expect(outcome.fresh).toBe(true);
  }
});

test('F09 blur pauses active time and clears movement until fresh input', async ({ page }) => {
  await load(page); await isolateThreat(page);
  const result = await page.evaluate(() => {
    const api = (window as any).__m0;
    api.action({ type: 'move', x: 1, z: 0, sprint: true }); api.advance(30);
    window.dispatchEvent(new Event('blur'));
    const paused = api.snapshot(), later = api.advance(300);
    api.pause(false); const resumed = api.advance(30);
    return { paused, later, resumed };
  });
  expect(result.paused.paused).toBe(true);
  expect(result.later.time).toBe(result.paused.time); expect(result.later.health).toBe(result.paused.health);
  expect(result.later.player).toEqual(result.paused.player); expect(result.resumed.player).toEqual(result.paused.player);
});

test('F15 contact uses one-second cooldown and proxy walls block LOS', async ({ page }) => {
  await load(page);
  const result = await page.evaluate(() => {
    const api = (window as any).__m0, p = { x: -7, y: 0, z: -7 };
    api.place('player', p);
    for (let i = 0; i < 120; i++) { api.place('threat', p); api.advance(1); }
    const contactHealth = api.snapshot().health;
    api.place('player', { x: -11.7, y: 0, z: 0 }); api.place('threat', { x: -10.3, y: 0, z: 0 });
    const blocked = !api.los(api.snapshot().player, api.snapshot().threat);
    for (let i = 0; i < 120; i++) { api.place('threat', { x: -10.3, y: 0, z: 0 }); api.advance(1); }
    return { contactHealth, blocked, afterWall: api.snapshot().health };
  });
  expect(result.contactHealth).toBe(60); expect(result.blocked).toBe(true); expect(result.afterWall).toBe(60);
});

test('F16 F17 production interactions transfer once and require recycling before exit', async ({ page }) => {
  await load(page); await isolateThreat(page);
  const result = await page.evaluate(() => {
    const api = (window as any).__m0, definition = api.definition();
    const exit = definition.zones.find((z: any) => z.kind === 'exit');
    const recycler = definition.zones.find((z: any) => z.kind === 'recycler');
    api.place('player', { x: exit.x, y: 0, z: exit.z }); const early = api.advance(1).phase;
    api.action({ type: 'interact' }); const remoteBag = api.snapshot().bag;
    api.place('player', definition.items[0].point);
    for (let i = 0; i < 20; i++) api.action({ type: 'interact' });
    const picked = api.snapshot();
    api.place('player', { x: recycler.x, y: 0, z: recycler.z });
    for (let i = 0; i < 20; i++) api.action({ type: 'interact' });
    const recycled = api.snapshot();
    api.place('player', { x: exit.x, y: 0, z: exit.z }); const completed = api.advance(1);
    return { early, remoteBag, picked, recycled, completed };
  });
  expect(result.early).toBe('collecting'); expect(result.remoteBag).toBe(0); expect(result.picked.bag).toBe(1);
  expect(result.recycled.bag).toBe(0); expect(result.recycled.recycled).toBe(1); expect(result.recycled.phase).toBe('exiting');
  expect(result.completed.phase).toBe('success');
});

test('F17 simultaneous lethal contact and exit resolves as failure', async ({ page }) => {
  await load(page); await isolateThreat(page);
  const result = await page.evaluate(() => {
    const api = (window as any).__m0, definition = api.definition();
    api.place('player', definition.items[0].point); api.action({ type: 'interact' });
    const recycler = definition.zones.find((z: any) => z.kind === 'recycler');
    api.place('player', { x: recycler.x, y: 0, z: recycler.z }); api.action({ type: 'interact' });
    api.damage(80); api.advance(60);
    const exit = definition.zones.find((z: any) => z.kind === 'exit'), p = { x: exit.x, y: 0, z: exit.z };
    api.place('player', p); api.place('threat', p);
    return api.advance(1);
  });
  expect(result.health).toBe(0); expect(result.phase).toBe('failure');
});

test('F18 ten replays reset run and owned resource counts', async ({ page }) => {
  await load(page);
  const baseline = await page.evaluate(() => (window as any).__m0.snapshot());
  for (let i = 0; i < 10; i++) {
    const terminal = await page.evaluate(async iteration => {
      const api = (window as any).__m0;
      if (iteration % 2 === 0) api.damage(100);
      else {
        const definition = api.definition();
        api.place('threat', { x: 27, y: 0, z: 0 });
        api.place('player', definition.items[0].point); api.action({ type: 'interact' });
        const recycler = definition.zones.find((z: any) => z.kind === 'recycler');
        api.place('player', { x: recycler.x, y: 0, z: recycler.z }); api.action({ type: 'interact' });
        const exit = definition.zones.find((z: any) => z.kind === 'exit');
        api.place('player', { x: exit.x, y: 0, z: exit.z }); api.advance(1);
      }
      const phase = api.snapshot().phase;
      await api.reset();
      return phase;
    }, i);
    expect(terminal).toBe(i % 2 === 0 ? 'failure' : 'success');
    await ready(page);
    const state = await page.evaluate(() => (window as any).__m0.snapshot());
    expect(state.phase).toBe('collecting'); expect(state.health).toBe(100); expect(state.stamina).toBe(100);
    expect(state.bag).toBe(0); expect(state.recycled).toBe(0); expect(state.path).toBe(0); expect(state.pending).toBeNull();
    expect(state.resources).toEqual(baseline.resources); expect(state.camera).toEqual(baseline.camera);
  }
});

test('F19 alternate definition uses the same approach-interact-exit flow', async ({ page }) => {
  await load(page);
  await page.evaluate(async () => { await (window as any).__m0.scene(1); }); await ready(page);
  const result = await page.evaluate(() => {
    const api = (window as any).__m0, definition = api.definition();
    api.place('threat', { x: -8, y: 0, z: 8 });
    api.place('player', definition.items[0].point); api.action({ type: 'interact' });
    const recycler = definition.zones.find((z: any) => z.kind === 'recycler');
    api.place('player', { x: recycler.x, y: 0, z: recycler.z }); api.action({ type: 'interact' });
    const exit = definition.zones.find((z: any) => z.kind === 'exit');
    const accepted = api.command({ x: exit.x, y: 0, z: exit.z });
    return { accepted, state: api.advance(360) };
  });
  expect(result.accepted).toBe(true); expect(result.state.scene).toBe('small'); expect(result.state.phase).toBe('success');
});
test('F15 continuous contact damage agrees at 30/60/120 Hz render schedules',async({page})=>{
 const health=[];
 for(const hz of [30,60,120]){
  await load(page);
  health.push(await page.evaluate(hz=>{const m=(window as any).__m0;m.place('threat',{x:-7,y:0,z:-7});m.place('player',{x:-7,y:0,z:-6.5});return m.schedule(hz,2).health;},hz));
 }
 expect(health).toEqual([60,60,60]);
});
test('F16 an in-range collectible across the real thin-wall proxy cannot be taken',async({page})=>{
 await load(page);await isolateThreat(page);
 const result=await page.evaluate(()=>{
  const m=(window as any).__m0;
  // Authorized debug fixture: reposition the same interaction point; do not mock LOS or nav.
  const item=m.definition().items[0];Object.assign(item.point,{x:-11.6,y:0,z:0});
  m.place('player',{x:-10.5,y:0,z:0});m.action({type:'interact'});const blocked=m.snapshot().bag;
  m.place('player',{x:-11.7,y:0,z:0});m.action({type:'interact'});return {blocked,clear:m.snapshot().bag};
 });
 expect(result.blocked).toBe(0);expect(result.clear).toBe(1);
});
