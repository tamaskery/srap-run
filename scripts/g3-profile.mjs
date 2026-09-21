import {chromium} from 'playwright';
import {preview} from 'vite';
import {writeFile} from 'node:fs/promises';
const server=await preview({configFile:false,build:{outDir:'dist'},preview:{host:'127.0.0.1',port:4188,strictPort:true}});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
const results=[];
try{
 await page.goto('http://127.0.0.1:4188/?debug&scene=square');await page.waitForFunction(()=>window.__m0);
 await page.evaluate(()=>window.__m0.pause(false));await page.waitForTimeout(4000);
 for(const label of (process.env.G3_MODES?.split(',')??['full','no-cast','no-receive','diffuse','no-foliage','full-repeat'])){
 await page.reload();await page.waitForFunction(()=>window.__m0);await page.evaluate(()=>window.__m0.pause(false));
  const inventory=await page.evaluate(label=>window.__m0.courtProbe(label),label);
  await page.waitForTimeout(1500);await page.evaluate(()=>window.__m0.capture(true));
  await page.waitForTimeout(12000);
  results.push({label,inventory,metrics:await page.evaluate(()=>window.__m0.capture(false))});
 }
 await writeFile(process.env.G3_OUTPUT??'evidence/g3/profile.json',JSON.stringify({note:'Render-only masking; hostile animation still evaluated, unchanged camera/population/simulation.',results},null,2));
}finally{await browser.close();server.httpServer.close();}
