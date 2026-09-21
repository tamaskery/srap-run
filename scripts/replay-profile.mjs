import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:false,args:['--disable-features=CalculateNativeWinOcclusion']});
const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});await page.bringToFront();
await page.goto('http://127.0.0.1:4173/?debug');await page.waitForFunction(()=>window.__m0);
await page.evaluate(()=>{const c=document.querySelector('canvas');c.width=1920;c.height=1080;window.__gaps=[];let last=performance.now();const loop=now=>{if(now-last>70)window.__gaps.push({now,ms:now-last,ready:!!window.__m0,visibility:document.visibilityState,focus:document.hasFocus()});last=now;requestAnimationFrame(loop);};requestAnimationFrame(loop);});
await page.waitForTimeout(5000);
await page.evaluate(()=>window.__m0.capture(true));
const replays=[];
for(let i=0;i<10;i++){
 await page.bringToFront();
 replays.push(await page.evaluate(async()=>{const start=performance.now();await window.__m0.reset();return {start,end:performance.now()};}));
 await page.waitForTimeout(1500);
}
const gaps=await page.evaluate(()=>window.__gaps);
const engineMetrics=await page.evaluate(()=>window.__m0.capture(false));console.log('engineMetrics',JSON.stringify(engineMetrics));console.log(JSON.stringify({replays,gaps}));await writeFile('evidence/replay-profile.json',JSON.stringify({replays,gaps},null,2));await browser.close();
