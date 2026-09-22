import {test,expect} from '@playwright/test';

test('G4 pavilion cutaways preserve solid cover and all new art survives repeated replay',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?debug&scene=square&deterministic');
 await page.waitForFunction(()=>!!(window as any).__m0);
 const baseline=await page.evaluate(()=>(window as any).__m0.snapshot());
 for(let replay=0;replay<3;replay++){
  for(const [group,x,z] of [['pavilions',-29,5],['north-pavilion',-23,15],['south-pavilion',-9,-3]] as const){
   const state=await page.evaluate(({x,z})=>{const m=(window as any).__m0;m.pause(false);m.place('player',{x,y:0,z});return m.advance(1);},{x,z});
   expect(state.renderGroups.find((g:any)=>g.id===group).visible.every((v:boolean)=>!v)).toBe(true);
  }
  expect(await page.evaluate(()=>(window as any).__m0.los({x:-30,y:0,z:-3},{x:-14,y:0,z:-3}))).toBe(false);
  const visible=await page.evaluate(()=>{const m=(window as any).__m0;m.place('player',{x:32,y:0,z:14});return m.advance(1);});
  for(const group of ['pavilions','north-pavilion','south-pavilion'])
   expect(visible.renderGroups.find((g:any)=>g.id===group).visible.every((v:boolean)=>v)).toBe(true);
  await page.evaluate(()=>(window as any).__m0.reset());
  expect((await page.evaluate(()=>(window as any).__m0.snapshot())).resources).toEqual(baseline.resources);
 }
 expect(errors).toEqual([]);
});
