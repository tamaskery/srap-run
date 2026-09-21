import { expect, test } from '@playwright/test';

test('pixel canvas: display scaling, resize, edge picking and CSS-distance pan', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1.25 });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/?debug&scene=square&deterministic&visual=pixel');
  await page.waitForFunction(() => !!(window as any).__m0);
  const snap = () => page.evaluate(() => (window as any).__m0.snapshot());
  expect((await snap()).drawingBuffer).toEqual([640, 360]);
  expect((await snap()).dpr).toBe(1.25);
  await page.evaluate(() => (window as any).__m0.pause(false));
  for (const size of [{width:1920,height:1080},{width:1366,height:768}]) {
    await page.setViewportSize(size);
    await expect.poll(async () => (await snap()).drawingBuffer).toEqual([Math.round(size.width/3),Math.round(size.height/3)]);
    // Move a known walkable point near each edge using the existing pan control.
    // Placement only isolates input projection; the live mission covers gameplay.
    for (const fraction of [.06,.94]) {
      await page.evaluate(() => {const m=(window as any).__m0;m.place('player',{x:-32,y:0,z:-13});m.action({type:'zoom',delta:(32-m.snapshot().camera.span)/.02});m.action({type:'recenter'});m.advance(0);});
      const point={x:-32,y:.05,z:-8};
      const initial=await page.evaluate(p=>(window as any).__m0.screen(p),point);
      const dx=initial.x-size.width*fraction; // Existing pan convention moves the scene opposite the drag.
      await page.mouse.move(size.width/2,size.height/2);
      await page.mouse.down({button:'middle'});
      await page.mouse.move(size.width/2+dx,size.height/2);
      await page.mouse.up({button:'middle'});
      await page.evaluate(()=>(window as any).__m0.advance(0));
      const projected=await page.evaluate(p=>(window as any).__m0.screen(p),point);
      // Fractional buffer aspect and physical pointer rounding allow half a world pixel.
      expect(Math.abs(projected.x-size.width*fraction)).toBeLessThan(1.5);
      await page.mouse.click(projected.x,projected.y);
      expect((await snap()).path).toBeGreaterThan(0);
      await page.evaluate(()=>(window as any).__m0.advance(180));
      const s=await snap();
      expect(Math.hypot(s.player.x-point.x,s.player.z-point.z)).toBeLessThan(1.25);
    }
    for (const selector of ['header','#stats','#objective','footer']) {
      const box=await page.locator(selector).boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.y).toBeGreaterThanOrEqual(0);
      expect(box!.x+box!.width).toBeLessThanOrEqual(size.width);
      expect(box!.y+box!.height).toBeLessThanOrEqual(size.height);
    }
    await page.keyboard.press('Home');
    await page.mouse.wheel(0,-10000);
    await expect.poll(async ()=>(await snap()).camera.span).toBe(15);
    await page.mouse.wheel(0,10000);
    await expect.poll(async ()=>(await snap()).camera.span).toBe(76);
  }
  expect(errors).toEqual([]);
  await context.close();
});
