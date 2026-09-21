import {test,expect} from '@playwright/test';

test('G1 actual clips respond to keys/clicks, freeze on pause and reset cleanly',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?debug&scene=square&deterministic');
 await page.waitForFunction(()=>!!(window as any).__m0);
 const snap=()=>page.evaluate(()=>(window as any).__m0.snapshot());
 const advance=(n:number)=>page.evaluate(n=>(window as any).__m0.advance(n),n);
 await page.evaluate(()=>{(window as any).__m0.pause(false);document.querySelector<HTMLCanvasElement>('canvas')!.focus();});
 const initial=await snap();expect(initial.hero.clip).toBe('hero_idle');
 await page.keyboard.down('KeyW');
 const walking=await advance(12);expect(walking.hero.clip).toBe('hero_walk');
 const walking2=await advance(8);expect(walking2.hero.pose).not.toEqual(walking.hero.pose);
 expect(walking.player).not.toEqual(initial.player);
 await page.keyboard.down('Shift');
 const running=await advance(12);expect(running.hero.clip).toBe('hero_sprint');
 expect(running.stamina).toBeLessThan(walking.stamina);
 await page.evaluate(()=>(window as any).__m0.pause(true));
 const paused=await snap();await advance(120);await page.waitForTimeout(100);
 expect((await snap()).hero).toEqual(paused.hero);
 expect((await snap()).player).toEqual(paused.player);
 await page.keyboard.up('Shift');await page.keyboard.up('KeyW');
 await page.evaluate(()=>(window as any).__m0.pause(false));
 expect((await advance(1)).hero.clip).toBe('hero_idle');
 const p=await page.evaluate(()=>(window as any).__m0.screen({x:-32,y:.05,z:-8}));
 await page.mouse.click(p.x,p.y);
 expect((await advance(10)).hero.clip).toBe('hero_walk');
 for(let i=0;i<12;i++)await advance(30);
 expect((await snap()).bag).toBe(1);
 for(let i=0;i<3;i++){
  await page.evaluate(()=>(window as any).__m0.reset());
  const reset=await snap();expect(reset.resources).toEqual(initial.resources);
  expect(reset.hero.clip).toBe('hero_idle');expect(reset.hero.pose).toEqual(initial.hero.pose);
  expect(reset.resources.skeletons).toBe(2);expect(reset.resources.animationGroups).toBe(6);
 }
 expect(errors).toEqual([]);
});
