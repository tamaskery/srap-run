import { expect, test, type Page } from '@playwright/test';

async function load(page: Page) {
  await page.goto('/?debug');
  await page.waitForFunction(() => !!(window as any).__m0);
  await page.evaluate(() => {
    const api = (window as any).__m0;
    api.deterministic(true); api.pause(false);
    api.place('player', { x: 27, y: 0, z: 0 });
    api.place('threat', { x: -7, y: 0, z: -3 });
    // Let the real patrol query establish facing after debug repositioning.
    api.advance(30);
  });
}

for (const scenario of [
  { name: 'facing toward', player: { x: -7, y: 0, z: 1 }, detected: true },
  { name: 'facing away', player: { x: -7, y: 0, z: -4 }, detected: false },
  { name: 'outside eight metre range', player: { x: -7, y: 0, z: 12 }, detected: false },
]) {
  test(`F12 perception ${scenario.name}`, async ({ page }) => {
    await load(page);
    const result = await page.evaluate(player => {
      const api = (window as any).__m0;
      api.place('player', player);
      return api.advance(6);
    }, scenario.player);
    expect(result.hidden).toBe(false);
    expect(result.suspicion > 0).toBe(scenario.detected);
    expect(result.state).toBe(scenario.detected ? 'suspicious' : 'patrol');
  });
}

test('F12 hidden room facade still blocks eye-to-body LOS', async ({ page }) => {
  await load(page);
  const result = await page.evaluate(() => {
    const api = (window as any).__m0;
    api.place('player', { x: 9, y: 0, z: 3 });
    api.place('threat', { x: 9, y: 0, z: 0 });
    const snapshot = api.advance(6);
    return { snapshot, clear: api.los(snapshot.threat, snapshot.player) };
  });
  expect(result.snapshot.cutaways).toContain('room');
  expect(result.snapshot.renderGroups.find((g: any) => g.id === 'room').visible.every((v: boolean) => !v)).toBe(true);
  expect(result.clear).toBe(false);
  expect(result.snapshot.suspicion).toBe(0);
});

test('F13 chase searches last seen position and returns rather than tracking unseen player', async ({ page }) => {
  await load(page);
  const result = await page.evaluate(() => {
    const api = (window as any).__m0;
    api.place('player', { x: -7, y: 0, z: 1 });
    const chase = api.advance(60);
    api.place('player', { x: 27, y: 0, z: 0 });
    const search = api.advance(6);
    const trail = [];
    // Include the 3 s search and the walk around the L back to the patrol route.
    for (let i = 0; i < 200; i++) trail.push(api.advance(6));
    return { chase, search, trail };
  });
  expect(result.chase.state).toBe('chase');
  expect(result.search.state).toBe('search');
  expect(result.search.lastSeen).toEqual(result.chase.lastSeen);
  expect(result.trail.every((s: any) => s.lastSeen.x === result.chase.lastSeen.x && s.lastSeen.z === result.chase.lastSeen.z)).toBe(true);
  expect(result.trail.some((s: any) => s.state === 'return')).toBe(true);
  expect(result.trail.some((s: any) => s.state === 'patrol')).toBe(true);
});

test('F14 unseen hiding conceals, leaving reveals and observed entry retains search', async ({ page }) => {
  await load(page);
  const result = await page.evaluate(() => {
    const api = (window as any).__m0;
    api.place('player', { x: -7, y: 0, z: 4 });
    const unseen = api.advance(6);
    api.place('player', { x: -7, y: 0, z: 2.5 });
    const exposed = api.advance(6);
    api.place('player', { x: -7, y: 0, z: 4 });
    const observedEntry = api.advance(6);
    api.place('player', { x: -7, y: 0, z: 2.5 });
    const reacquired = api.advance(6);
    return { unseen, exposed, observedEntry, reacquired };
  });
  expect(result.unseen.hidden).toBe(true);
  expect(result.unseen.suspicion).toBe(0);
  expect(result.unseen.lastSeen).toBeNull();
  expect(result.exposed.hidden).toBe(false);
  expect(result.exposed.suspicion).toBeGreaterThan(0);
  expect(result.observedEntry.hidden).toBe(true);
  expect(result.observedEntry.state).toBe('search');
  expect(result.observedEntry.lastSeen).toEqual(result.exposed.lastSeen);
  expect(result.reacquired.hidden).toBe(false);
  expect(result.reacquired.state).toBe('chase');
});
test('F14 sprinting inside cover reveals before leaving the hiding zone',async({page})=>{
 await load(page);
 const result=await page.evaluate(()=>{const m=(window as any).__m0;m.place('player',{x:-7,y:0,z:4});const hidden=m.advance(1);m.action({type:'move',x:1,z:0,sprint:true});const sprint=m.advance(3);return {hidden,sprint};});
 expect(result.hidden.hidden).toBe(true);expect(result.sprint.hidden).toBe(false);
 expect(Math.abs(result.sprint.player.x+7)).toBeLessThan(1.25);expect(Math.abs(result.sprint.player.z-4)).toBeLessThan(1.25);
 expect(result.sprint.stamina).toBeLessThan(100);
});
