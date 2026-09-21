import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
const channel=process.env.BROWSER_CHANNEL||'chrome';
const browser=await chromium.launch({channel,headless:false,args:['--enable-webgl','--ignore-gpu-blocklist','--window-size=1920,1080','--disable-features=CalculateNativeWinOcclusion']});
const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
await page.bringToFront();
await page.goto('http://127.0.0.1:4173/?debug');await page.waitForFunction(()=>window.__m0);
await page.evaluate(()=>{const canvas=document.querySelector('canvas');canvas.width=1920;canvas.height=1080;window.__m0.pause(false);});
const environment=await page.evaluate(()=>({userAgent:navigator.userAgent,visibility:document.visibilityState,focused:document.hasFocus(),...window.__m0.snapshot()}));
if(environment.drawingBuffer[0]!==1920||environment.drawingBuffer[1]!==1080)throw new Error('Drawing buffer must be exactly 1920x1080');
console.log(JSON.stringify({channel,version:browser.version(),renderer:environment.renderer,drawingBuffer:environment.drawingBuffer}));
await page.evaluate(()=>{
 window.__perfPhase='warm-up';window.__longFrames=[];window.__longTasks=[];
 let last=performance.now();const frame=now=>{if(now-last>100)window.__longFrames.push({now,ms:now-last,phase:window.__perfPhase,visibility:document.visibilityState,focused:document.hasFocus()});last=now;requestAnimationFrame(frame);};requestAnimationFrame(frame);
 new PerformanceObserver(list=>{for(const e of list.getEntries())window.__longTasks.push({start:e.startTime,duration:e.duration,phase:window.__perfPhase});}).observe({type:'longtask',buffered:true});
});
const events=[];
async function record(label){events.push({label,...await page.evaluate(()=>({visibility:document.visibilityState,focused:document.hasFocus(),...window.__m0.snapshot()}))});}
async function sequence(seconds){
 for(let cycle=0;cycle<seconds/30;cycle++){
  await page.bringToFront();
  await page.evaluate(()=>{window.__perfPhase='collection';const m=window.__m0;m.pause(false);m.place('player',{x:-7,y:0,z:-7});m.command({x:0,y:0,z:3},'bottle');});
  await page.waitForTimeout(8000);await record('collection');
  await page.evaluate(()=>{window.__perfPhase='room';const m=window.__m0;m.place('player',{x:12,y:0,z:0});m.command({x:12,y:0,z:10.5},'recycler');});
  await page.waitForTimeout(6000);await record('room-or-threat');
  await page.evaluate(()=>{window.__perfPhase='threat';const m=window.__m0;m.place('player',{x:-7,y:0,z:-3});m.place('threat',{x:-7,y:0,z:-6});m.command({x:-7,y:0,z:4});});
  await page.waitForTimeout(6000);await record('room-or-threat');
  await page.evaluate(()=>{window.__perfPhase='replay';return window.__m0.reset();});await page.waitForFunction(()=>window.__m0);
  await page.evaluate(()=>{window.__perfPhase='replay-movement';window.__m0.pause(false);window.__m0.command({x:8,y:0,z:-5});});
  await page.waitForTimeout(10000);await record('replay-movement');
 }
}
await sequence(30);
const reports=[];
for(let pass=0;pass<2;pass++){
 if(pass){for(let i=0;i<10;i++){await page.evaluate(()=>{window.__perfPhase='replay';return window.__m0.reset();});await page.waitForFunction(()=>window.__m0);}await sequence(30);}
 await page.evaluate(()=>window.__m0.capture(true));
 const start=Date.now();await sequence(120);
 reports.push(await page.evaluate(()=>({metrics:window.__m0.capture(false),resources:window.__m0.snapshot().resources})));
 console.log('pass',pass,JSON.stringify(reports.at(-1)),'wallSeconds',(Date.now()-start)/1000);
}
await writeFile(`evidence/performance-${channel}.json`,JSON.stringify({channel,browserVersion:browser.version(),environment,reports,events,longFrameEvidence:await page.evaluate(()=>({frames:window.__longFrames,tasks:window.__longTasks})),occlusionControl:'CalculateNativeWinOcclusion disabled; foreground tab requested each cycle'},null,2));
await page.screenshot({path:`evidence/performance-${channel}.png`});
await browser.close();
