import {chromium} from 'playwright';
import {preview} from 'vite';
import {mkdir,writeFile} from 'node:fs/promises';

const output=process.env.G6_OUTPUT??'evidence/g6/final';
await mkdir(output,{recursive:true});
const server=await preview({configFile:false,build:{outDir:'dist'},preview:{host:'127.0.0.1',port:4190,strictPort:true}});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const errors=[];
try{
 const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4190/?debug&scene=square&deterministic');
 await page.waitForFunction(()=>window.__m0,null,{timeout:60000});
 await page.evaluate(()=>{const m=window.__m0;m.pause(false);m.place('player',{x:5,y:0,z:12});m.advance(1);});
 for(const [label,span] of [['normal',64],['wide',76]]){
  await page.evaluate(span=>{const m=window.__m0;m.action({type:'zoom',delta:(span-m.snapshot().camera.span)/.02});m.advance(0);},span);
  await page.waitForTimeout(250);await page.screenshot({path:`${output}/${label}.png`});
 }
 await page.evaluate(()=>{const m=window.__m0;m.place('player',{x:19,y:0,z:-10});m.action({type:'zoom',delta:(64-m.snapshot().camera.span)/.02});m.advance(1);});
 await page.waitForTimeout(250);await page.screenshot({path:`${output}/srap-cutaway.png`});
 await page.evaluate(()=>{const m=window.__m0;m.place('player',{x:-30,y:0,z:-10});m.action({type:'zoom',delta:(32-m.snapshot().camera.span)/.02});m.action({type:'recenter'});m.advance(1);});
 await page.waitForTimeout(250);await page.screenshot({path:`${output}/pavilions.png`});
 await writeFile(`${output}/snapshot.json`,JSON.stringify(await page.evaluate(()=>window.__m0.snapshot()),null,2));
 await writeFile(`${output}/capture-errors.json`,JSON.stringify(errors));
}finally{await browser.close();server.httpServer.close();}
