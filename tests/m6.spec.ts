import {expect,test} from '@playwright/test';

test('M6 ambient life stays decorative, pauses and resets with the mission',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/?debug&scene=square&deterministic');
  await page.waitForFunction(()=>!!(window as any).__m0);
  const first=await page.evaluate(()=>{const m=(window as any).__m0;m.deterministic(true);m.pause(false);return m.snapshot();});
  expect(first.ambient.map((a:any)=>a.appearance)).toEqual(['commuter','shopper','visitor']);
  expect(first.pigeons).toHaveLength(4);
  const changed=await page.evaluate(()=>{
    const m=(window as any).__m0,home=m.definition().pigeons[0];
    m.place('player',home);m.advance(1);return m.advance(45);
  });
  expect(changed.pigeons[0].scatter||Math.hypot(changed.pigeons[0].x-first.pigeons[0].x,changed.pigeons[0].z-first.pigeons[0].z)>.3).toBe(true);
  expect(changed.health).toBe(100);expect(changed.bag).toBe(0);
  expect(changed.resources.navmeshes).toBe(first.resources.navmeshes);
  expect(changed.resources.meshes).toBe(first.resources.meshes);
  const paused=await page.evaluate(()=>{const m=(window as any).__m0;m.pause(true);const before=m.snapshot();const after=m.advance(120);return {before,after};});
  expect(paused.after.pigeons).toEqual(paused.before.pigeons);
  expect(paused.after.ambient).toEqual(paused.before.ambient);
  await page.screenshot({path:'test-results/m6-ambient.png'});
  await page.evaluate(async()=>{await (window as any).__m0.reset();});
  await page.waitForFunction(()=>!!(window as any).__m0);
  const replay=await page.evaluate(()=>(window as any).__m0.snapshot());
  expect(replay.ambient).toEqual(first.ambient);expect(replay.pigeons).toEqual(first.pigeons);
  expect(replay.resources).toEqual(first.resources);
  expect(errors).toEqual([]);
});
