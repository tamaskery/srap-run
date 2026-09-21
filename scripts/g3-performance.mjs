import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
import {preview} from 'vite';
const baseline=await preview({configFile:false,build:{outDir:'evidence/g2/control-dist'},preview:{host:'127.0.0.1',port:4185,strictPort:true}});
const g2=await preview({configFile:false,build:{outDir:'evidence/g3/g2-dist'},preview:{host:'127.0.0.1',port:4186,strictPort:true}});
const hero=await preview({configFile:false,build:{outDir:'dist'},preview:{host:'127.0.0.1',port:4187,strictPort:true}});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--window-size=1920,1080','--disable-features=CalculateNativeWinOcclusion']});
const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
const results=[];const startup=[];
try{
 for(const [label,port] of [['control-1',4185],['g2-1',4186],['g3-1',4187],['control-2',4185],['g2-2',4186],['g3-2',4187]]){
  const start=performance.now();
  await page.goto(`http://127.0.0.1:${port}/?debug&scene=square`);
  await page.waitForFunction(()=>window.__m0);
  startup.push({label,ms:performance.now()-start});
  await page.bringToFront();
  await page.evaluate(()=>window.__m0.pause(false));
  await page.waitForTimeout(4000);
  const environment=await page.evaluate(()=>({userAgent:navigator.userAgent,visibility:document.visibilityState,...window.__m0.snapshot()}));
  for(const state of (process.env.G2_PHASES?.split(',')??['idle','walk','sprint','court'])){
   await page.evaluate(()=>{const m=window.__m0;m.place('player',{x:-32,y:0,z:-13});m.capture(true);});
   const cycles=state==='sprint'?3:2;
   for(let i=0;i<cycles;i++){
    await page.evaluate(state=>{const m=window.__m0;m.place('player',{x:state==='court'?32:-32,y:0,z:state==='court'?-6:-13});if(state!=='idle')m.command({x:state==='court'?32:-32,y:0,z:state==='court'?14:10});m.action({type:'move',x:0,z:0,sprint:state==='sprint'});},state);
    await page.waitForTimeout(12000/cycles);
   }
   const report=await page.evaluate(()=>({metrics:window.__m0.capture(false),snapshot:window.__m0.snapshot(),visibility:document.visibilityState,focused:document.hasFocus()}));
   results.push({label,state,environment,...report});
   await writeFile('evidence/g3/performance-final.json',JSON.stringify({browser:browser.version(),headless:true,startup,results},null,2));
   console.log(JSON.stringify({label,state,...report.metrics}));
  }
 }
}finally{await browser.close();baseline.httpServer.close();g2.httpServer.close();hero.httpServer.close();}
