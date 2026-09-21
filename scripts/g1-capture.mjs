import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:4177/?debug&scene=square&deterministic');
await page.waitForFunction(()=>window.__m0,{},{timeout:60000});
await page.evaluate(()=>{const m=window.__m0;m.pause(false);m.command({x:-34,y:0,z:-15});m.advance(40);m.action({type:'cancel'});m.action({type:'recenter'});m.advance(1);});
for(const [label,span] of [['normal',64],['close',15],['wide',76]]){
 await page.evaluate(span=>{const m=window.__m0;m.action({type:'zoom',delta:(span-m.snapshot().camera.span)/.02});m.advance(0);},span);
 await page.waitForTimeout(300);
 await page.screenshot({path:`evidence/g1/hero-${label}.png`});
}
await page.evaluate(()=>{const m=window.__m0;m.action({type:'zoom',delta:(15-m.snapshot().camera.span)/.02});m.action({type:'recenter'});});
for(const [label,sprint] of [['walk',false],['sprint',true]]){
 await page.evaluate(sprint=>{const m=window.__m0;m.place('player',{x:-32,y:0,z:-13});m.command({x:-34,y:0,z:-15});m.action({type:'move',x:0,z:0,sprint});},sprint);
 for(let i=0;i<4;i++){
  await page.evaluate(()=>(window.__m0.advance(4)));
  await page.screenshot({path:`evidence/g1/hero-${label}-${i}.png`});
 }
}
console.log(JSON.stringify({errors,snapshot:await page.evaluate(()=>window.__m0.snapshot())}));
await browser.close();
