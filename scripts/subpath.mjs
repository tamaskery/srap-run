import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
const reports=[];
for(const channel of ['chrome','msedge']){
 const browser=await chromium.launch({channel,headless:true});
 const context=await browser.newContext();const page=await context.newPage();const errors=[],requests=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>requests.push(r.url()));
 const session=await context.newCDPSession(page);await session.send('Network.enable');await session.send('Network.setCacheDisabled',{cacheDisabled:true});
 for(let refresh=0;refresh<2;refresh++){
  if(refresh)await page.reload();else await page.goto('http://127.0.0.1:4174/srap-run/?debug');
  await page.waitForFunction(()=>window.__m0);
  const result=await page.evaluate(()=>{const m=window.__m0;m.deterministic(true);m.pause(false);m.command({x:-7,y:0,z:-4});return m.advance(90);});
  if(Math.hypot(result.player.x+7,result.player.z+4)>.2)throw new Error('Subpath navigation failed');
 }
 const invalid=requests.filter(u=>!u.startsWith('http://127.0.0.1:4174/srap-run/'));
 if(errors.length||invalid.length)throw new Error(JSON.stringify({errors,invalid}));
 reports.push({channel,version:browser.version(),coldRefreshes:2,errors,requests});await browser.close();
}
await writeFile('evidence/subpath.json',JSON.stringify(reports,null,2));console.log('F02 PASS both browsers, cache disabled, local subpath assets and navigation');
