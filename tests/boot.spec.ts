import {test,expect} from '@playwright/test';
test('F01 local production boot with clean console and real WASM',async({page,baseURL})=>{
 const errors:string[]=[];const external:string[]=[];let wasm=false;
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(!r.url().startsWith(baseURL!)&&!r.url().startsWith('data:'))external.push(r.url());});
 page.on('response',r=>{if(r.url().endsWith('.wasm')){wasm=true;expect(r.headers()['content-type']).toContain('application/wasm');}});
 await page.goto('/?debug');await page.waitForFunction(()=>!!(window as any).__m0);
 const s=await page.evaluate(()=>(window as any).__m0.snapshot());
 expect(s.phase).toBe('collecting');expect(wasm).toBe(true);expect(errors).toEqual([]);expect(external).toEqual([]);
});
test('F03 failed local WASM request stops the world and Retry recovers',async({page})=>{
 await page.route('**/*.wasm',r=>r.abort());await page.goto('/?debug');
 await expect(page.getByRole('alert')).toBeVisible();
 expect(await page.evaluate(()=>!!(window as any).__m0)).toBe(false);
 await page.unroute('**/*.wasm');await page.getByRole('button',{name:'Retry'}).click();
 await page.waitForFunction(()=>!!(window as any).__m0);expect(await page.evaluate(()=>(window as any).__m0.snapshot().phase)).toBe('collecting');
});
