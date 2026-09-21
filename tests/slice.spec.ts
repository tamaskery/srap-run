import {test,expect} from '@playwright/test';

test('G2 hostile follows existing state, freezes and resets with the court',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?debug&scene=square&deterministic');
 await page.waitForFunction(()=>!!(window as any).__m0);
 const initial=await page.evaluate(()=>(window as any).__m0.snapshot());
 const walk=await page.evaluate(()=>{const m=(window as any).__m0;m.pause(false);return m.advance(20);});
 expect(walk.hostile.clip).toBe('hostile_walk');expect(walk.hostile.pose).not.toEqual(initial.hostile.pose);
 await page.evaluate(()=>(window as any).__m0.pause(true));
 const paused=await page.evaluate(()=>(window as any).__m0.snapshot());
 await page.waitForTimeout(150);
 expect((await page.evaluate(()=>(window as any).__m0.advance(60))).hostile).toEqual(paused.hostile);
 const cut=await page.evaluate(()=>{const m=(window as any).__m0;m.pause(false);m.place('player',{x:19,y:0,z:-10});return m.advance(1);});
 expect(cut.renderGroups.find((g:any)=>g.id==='srap').visible.every((v:boolean)=>!v)).toBe(true);
 await page.evaluate(()=>(window as any).__m0.reset());
 const fresh=await page.evaluate(()=>(window as any).__m0.snapshot());
 expect(fresh.resources).toEqual(initial.resources);expect(fresh.hostile).toEqual(initial.hostile);
 const chase=await page.evaluate(()=>{const m=(window as any).__m0;m.pause(false);m.place('player',{x:6,y:0,z:10});return m.advance(75);});
 expect(chase.state).toBe('chase');expect(chase.hostile.clip).toBe('hostile_sprint');
 expect(errors).toEqual([]);
});
