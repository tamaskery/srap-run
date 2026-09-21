import {test,expect} from '@playwright/test';
test('F04/F07/F10 physical click, keyboard switch and camera picking',async({page})=>{
 await page.goto('/?debug');await page.waitForFunction(()=>!!(window as any).__m0);
 await page.evaluate(()=>{const m=(window as any).__m0;m.deterministic(true);m.pause(false);});
 const screen=await page.evaluate(()=>(window as any).__m0.screen({x:-7,y:0,z:-4}));
 await page.mouse.click(screen.x,screen.y);
 const moved=await page.evaluate(()=>(window as any).__m0.advance(90));
 expect(Math.hypot(moved.player.x+7,moved.player.z+4)).toBeLessThan(.2);
 await page.keyboard.down('KeyD');await page.evaluate(()=>(window as any).__m0.advance(10));await page.keyboard.up('KeyD');
 const stop=await page.evaluate(()=>(window as any).__m0.snapshot().player);
 const after=await page.evaluate(()=>(window as any).__m0.advance(30));expect(after.player).toEqual(stop);
 await page.mouse.move(600,400);await page.mouse.down({button:'middle'});await page.mouse.move(700,450);await page.mouse.up({button:'middle'});await page.mouse.wheel(0,-300);
 await page.keyboard.press('Home');
 // Project the next physical click after presenting the changed camera.
 await page.evaluate(()=>(window as any).__m0.advance(0));
 const next=await page.evaluate(()=>(window as any).__m0.screen({x:-6,y:0,z:-5}));await page.mouse.click(next.x,next.y);
 const arrived=await page.evaluate(()=>(window as any).__m0.advance(120));expect(Math.hypot(arrived.player.x+6,arrived.player.z+5)).toBeLessThan(.2);
});
test('F09 real sprint exhausts, recovers and requires release before reuse',async({page})=>{
 await page.goto('/?debug');await page.waitForFunction(()=>!!(window as any).__m0);
 const result=await page.evaluate(()=>{
  const m=(window as any).__m0;m.deterministic(true);m.pause(false);m.place('threat',{x:27,y:0,z:0});m.place('player',{x:-17,y:0,z:-12});m.command({x:17,y:0,z:-12});m.action({type:'move',x:0,z:0,sprint:true});
  const exhausted=m.advance(240);const recovered=m.advance(180);const before=m.snapshot().player;m.advance(60);const held=m.snapshot();
  m.action({type:'move',x:0,z:0,sprint:false});m.action({type:'move',x:0,z:0,sprint:true});const reused=m.advance(30);
  return {exhausted,recovered,before,held,reused};
 });
 expect(result.exhausted.stamina).toBe(0);expect(result.exhausted.player.x).toBeCloseTo(1,2);
 expect(result.recovered.stamina).toBeCloseTo(40,3);expect(result.held.player.x-result.before.x).toBeCloseTo(2.5,2);
 expect(result.reused.stamina).toBeLessThan(result.held.stamina);
});
test('F09 Resume button accepts fresh keyboard input',async({page})=>{
 await page.goto('/?debug');await page.waitForFunction(()=>!!(window as any).__m0);
 await page.evaluate(()=>{const m=(window as any).__m0;m.deterministic(true);m.pause(false);});
 await page.getByRole('button',{name:'Pause',exact:true}).click();await page.getByRole('button',{name:'Resume',exact:true}).click();
 const before=await page.evaluate(()=>(window as any).__m0.snapshot().player);
 await page.keyboard.down('KeyD');const after=await page.evaluate(()=>(window as any).__m0.advance(30).player);await page.keyboard.up('KeyD');
 expect(Math.hypot(after.x-before.x,after.z-before.z)).toBeGreaterThan(1);
});
