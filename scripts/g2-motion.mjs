import {chromium} from 'playwright';
import {preview} from 'vite';
const server=await preview({configFile:false,build:{outDir:'dist'},preview:{host:'127.0.0.1',port:4188,strictPort:true}});
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1920,height:1080},recordVideo:{dir:'evidence/g2/video',size:{width:1920,height:1080}}});
const page=await context.newPage();
try{
 await page.goto('http://127.0.0.1:4188/?debug&scene=square');
 await page.waitForFunction(()=>window.__m0);
 await page.evaluate(()=>{const m=window.__m0;m.pause(false);m.place('player',{x:32,y:0,z:-6});});
 await page.waitForTimeout(1000);
 await page.evaluate(()=>window.__m0.command({x:32,y:0,z:14}));
 await page.waitForTimeout(2500);
 await page.evaluate(()=>{const m=window.__m0;m.command({x:31,y:0,z:-5});m.action({type:'move',x:0,z:0,sprint:true});});
 await page.waitForTimeout(1500);
 await page.evaluate(()=>window.__m0.pause(true));
 await page.waitForTimeout(1200);
 await page.evaluate(()=>window.__m0.pause(false));
 await page.waitForTimeout(1000);
 await page.evaluate(()=>{const m=window.__m0;m.command({x:32,y:0,z:10});});
 await page.waitForTimeout(1600);
 await page.evaluate(()=>{const m=window.__m0;m.pause(false);m.place('player',{x:3,y:0,z:11});m.action({type:'recenter'});m.action({type:'zoom',delta:(15-m.snapshot().camera.span)/.02});});
 await page.waitForTimeout(200);await page.screenshot({path:'evidence/g2/actors-close.png'});
}finally{
 await context.close();await page.video().saveAs('evidence/g2/slice-motion.webm');
 await browser.close();server.httpServer.close();
}
