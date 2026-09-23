import {expect,test} from '@playwright/test';

test('M5 feedback follows the five-bottle mission and audio is owned by each replay',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{
    (window as any).__audioSources={started:0,stopped:0};
    const start=AudioBufferSourceNode.prototype.start,stop=AudioBufferSourceNode.prototype.stop;
    AudioBufferSourceNode.prototype.start=function(...args){(window as any).__audioSources.started++;return start.apply(this,args);};
    AudioBufferSourceNode.prototype.stop=function(...args){(window as any).__audioSources.stopped++;return stop.apply(this,args);};
  });
  await page.goto('/?debug&scene=square&deterministic');
  await page.waitForFunction(()=>!!(window as any).__m0);
  await page.keyboard.press('KeyQ');
  await expect.poll(()=>page.evaluate(()=>(window as any).__audioSources.started)).toBe(1);
  const feedback=await page.evaluate(()=>{
    const m=(window as any).__m0;m.deterministic(true);m.pause(false);
    m.place('threat',{x:36,y:0,z:-22});
    const items=m.definition().items;
    for(let i=0;i<5;i++){m.place('player',items[i].point);m.action({type:'interact'});m.advance(1);}
    return {bag:m.snapshot().bag,cue:document.querySelector('#event-cue')?.textContent,objective:document.querySelector('#objective')?.textContent};
  });
  expect(feedback.bag).toBe(5);expect(feedback.cue).toContain('Bag ready');expect(feedback.objective).toContain('SRAP recycler');
  const recycled=await page.evaluate(()=>{
    const m=(window as any).__m0,r=m.definition().zones.find((z:any)=>z.kind==='recycler');
    m.place('player',{x:r.x,y:0,z:r.z});m.action({type:'interact'});m.advance(1);
    return {state:m.snapshot(),cue:document.querySelector('#event-cue')?.textContent,objective:document.querySelector('#objective')?.textContent};
  });
  expect(recycled.state.phase).toBe('exiting');expect(recycled.state.recycled).toBe(5);
  expect(recycled.cue).toContain('5 recycled');expect(recycled.objective).toContain('Ecseri exit');
  await page.getByRole('button',{name:'Mute sound'}).click();
  await expect(page.getByRole('button',{name:'Unmute sound'})).toBeVisible();
  await page.getByRole('button',{name:'Pause',exact:true}).click();
  await expect(page.getByRole('button',{name:'Resume',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Resume',exact:true}).click();
  await page.getByRole('button',{name:'Replay'}).click();
  await page.waitForFunction(()=>!!(window as any).__m0);
  expect(await page.evaluate(()=>(window as any).__audioSources.stopped)).toBe(1);
  await page.keyboard.press('KeyQ');
  await expect.poll(()=>page.evaluate(()=>(window as any).__audioSources.started)).toBe(2);
  expect(await page.evaluate(()=>(window as any).__m0.snapshot().ambient.length)).toBe(3);
  expect(errors).toEqual([]);
});
