import {chromium} from 'playwright';
import {preview} from 'vite';
import {writeFile} from 'node:fs/promises';
const servers=[];
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const errors=[];
const definitions={};
try{
 for(const [name,path,port] of [['before','evidence/g4/g3-dist',4191],['slice','dist',4190]]){
  servers.push(await preview({configFile:false,build:{outDir:path},preview:{host:'127.0.0.1',port,strictPort:true}}));
  const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
  page.on('pageerror',e=>errors.push({name,error:e.message}));
  await page.goto(`http://127.0.0.1:${port}/?debug&scene=square&deterministic`);
  await page.waitForFunction(()=>window.__m0,null,{timeout:60000});
  definitions[name]=await page.evaluate(()=>window.__m0.definition());
  await page.evaluate(()=>{const m=window.__m0;m.pause(false);m.place('player',{x:5,y:0,z:12});m.advance(1);});
  for(const [label,span] of [['normal',64],['wide',76],['detail',32]]){
   await page.evaluate(span=>{const m=window.__m0;m.action({type:'zoom',delta:(span-m.snapshot().camera.span)/.02});m.advance(0);},span);
   await page.waitForTimeout(250);await page.screenshot({path:`evidence/g4/${name}-${label}.png`});
   if(name==='slice'&&label==='normal'){
    await page.evaluate(()=>{
     const m=window.__m0,ns='http://www.w3.org/2000/svg';const svg=document.createElementNS(ns,'svg');
     svg.id='proxy-review';svg.setAttribute('width',String(innerWidth));svg.setAttribute('height',String(innerHeight));
     svg.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:999';
     for(const w of m.definition().walls){
      const corners=w.shape==='ellipse'?Array.from({length:33},(_,i)=>[Math.cos(i*Math.PI/16)*w.width/2,Math.sin(i*Math.PI/16)*w.depth/2]):[[-w.width/2,-w.depth/2],[w.width/2,-w.depth/2],[w.width/2,w.depth/2],[-w.width/2,w.depth/2],[-w.width/2,-w.depth/2]];
      const line=document.createElementNS(ns,'polyline');line.setAttribute('points',corners.map(([x,z])=>{const p=m.screen({x:w.x+x,y:w.height,z:w.z+z});return `${p.x},${p.y}`;}).join(' '));line.setAttribute('fill','none');line.setAttribute('stroke','#00ffcc');line.setAttribute('stroke-width','1.5');svg.appendChild(line);
     }document.body.appendChild(svg);
    });
    await page.screenshot({path:'evidence/g4/proxy-overlay.png'});
    await page.evaluate(()=>{document.querySelector('#proxy-review').remove();document.body.style.filter='grayscale(1)';});
    await page.screenshot({path:'evidence/g4/slice-greyscale.png'});await page.evaluate(()=>document.body.style.filter='');
   }
  }
  if(name==='slice'){
   await page.evaluate(()=>{const m=window.__m0;m.action({type:'zoom',delta:(64-m.snapshot().camera.span)/.02});m.place('player',{x:19,y:0,z:-10});m.advance(1);});
   await page.screenshot({path:'evidence/g4/slice-cutaway.png'});
   await page.setViewportSize({width:1366,height:768});await page.screenshot({path:'evidence/g4/slice-1366.png'});
   await writeFile('evidence/g4/snapshot.json',JSON.stringify(await page.evaluate(()=>window.__m0.snapshot()),null,2));
  }
  await page.setViewportSize({width:1920,height:1080});
  await page.evaluate(()=>{const m=window.__m0;m.place('player',{x:-30,y:0,z:-10});m.action({type:'zoom',delta:(32-m.snapshot().camera.span)/.02});m.action({type:'recenter'});m.advance(1);});
  await page.waitForTimeout(250);
  await page.screenshot({path:`evidence/g4/${name}-pavilions.png`});
  await page.close();
 }
 await writeFile('evidence/g4/capture-errors.json',JSON.stringify(errors));
 await writeFile('evidence/g4/definition-comparison.json',JSON.stringify({beforeEqualsSlice:JSON.stringify(definitions.before)===JSON.stringify(definitions.slice)},null,2));
}finally{await browser.close();for(const s of servers)s.httpServer.close();}
