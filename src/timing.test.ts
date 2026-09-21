import {describe,it,expect} from 'vitest';
import {FixedClock,Diagnostics} from './timing';
describe('fixed simulation',()=>{
 it('advances identical distance under 30/60/120Hz rendering',()=>{
  const distances=[30,60,120].map(hz=>{const clock=new FixedClock();let x=0;for(let i=0;i<hz*5;i++)clock.advance(1/hz,dt=>x+=2.5*dt);return x;});
  distances.forEach(x=>expect(x).toBeCloseTo(12.5,8));
 });
 it('caps catch-up and reports dropped steps',()=>{const clock=new FixedClock();let ticks=0;clock.advance(1,()=>ticks++);expect(ticks).toBe(5);expect(clock.dropped).toBeGreaterThanOrEqual(54);clock.reset();expect(clock.accumulator).toBe(0);});
 it('reports rolling performance instead of hiding long frames',()=>{const d=new Diagnostics();for(let i=0;i<600;i++)d.record(1000/60,1);d.record(200,1);expect(d.report(3).worst).toBe(200);expect(d.report(3).dropped).toBe(3);expect(d.report(3).minRolling5sFPS).toBeLessThan(60);});
});
