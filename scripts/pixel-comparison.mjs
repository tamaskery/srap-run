import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const root = 'evidence/pixel-art';
await mkdir(root, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: false, args: ['--enable-webgl', '--ignore-gpu-blocklist', '--disable-features=CalculateNativeWinOcclusion'] });
const records = [];
for (const mode of ['baseline', 'pixel']) {
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(`http://127.0.0.1:4176/?debug&scene=square&deterministic&visual=${mode}`);
  await page.waitForFunction(() => window.__m0);
  await page.evaluate(() => { const m=window.__m0; m.pause(false); m.advance(0); });
  await page.screenshot({ path: `${root}/${mode}-wide.png` });
  const wide = await page.evaluate(() => window.__m0.snapshot());
  await page.evaluate(() => {
    const m=window.__m0; m.place('player',{x:-7,y:0,z:9}); m.place('threat',{x:1,y:0,z:10});
    m.action({type:'recenter'}); m.action({type:'zoom',delta:-1600}); m.advance(0);
  });
  await page.screenshot({ path: `${root}/${mode}-gameplay.png` });
  const gameplay = await page.evaluate(() => window.__m0.snapshot());
  await page.evaluate(() => {
    const m=window.__m0; m.place('player',{x:19,y:0,z:-10}); m.action({type:'recenter'});
    m.action({type:'zoom',delta:-300}); m.advance(1);
  });
  await page.screenshot({ path: `${root}/${mode}-entrance.png` });
  const entrance = await page.evaluate(() => window.__m0.snapshot());
  records.push({mode,wide,gameplay,entrance,errors});
  await context.close();
}
for (const view of ['wide','gameplay','entrance']) {
  for (const field of ['camera','player','threat','ambient','phase','bag','cutaways','time']) {
    assert.deepEqual(records[0][view][field],records[1][view][field],`${view}: ${field}`);
  }
}
await writeFile(`${root}/comparison.json`, JSON.stringify({browser:browser.version(),records},null,2));
await browser.close();
console.log('Three production screenshot pairs saved.');
