import {expect,test} from 'vitest';
import {pavilionGeometry} from './architecture';
import {SQUARE_SCENE} from './square';

test('pavilion kit stays inside authored canopies and preserves the permanent low base',()=>{
 const before=JSON.stringify(SQUARE_SCENE);
 for(const wall of SQUARE_SCENE.walls.filter(w=>w.id.includes('pavilion'))){
  const roof=SQUARE_SCENE.roofs.find(r=>r.cutaway===wall.cutaway)!;
  const data=pavilionGeometry(wall,roof);
  for(let i=0;i<data.positions.length;i+=3){
   const [x,y,z]=data.positions.slice(i,i+3);
   expect(((x-wall.x)/(roof.width/2))**2+((z-wall.z)/(roof.depth/2))**2).toBeLessThanOrEqual(1.000001);
   expect(y).toBeGreaterThanOrEqual(.73);expect(y).toBeLessThan(4.3);
  }
  expect(data.positions.every(Number.isFinite)).toBe(true);
  expect(data.indices.every(i=>i>=0&&i<data.positions.length/3)).toBe(true);
  expect(data.uvs.length).toBe(data.positions.length/3*2);
  expect(data.colors.length).toBe(data.positions.length/3*4);
  expect(data.indices.length/3).toBeLessThan(1600);
 }
 expect(JSON.stringify(SQUARE_SCENE)).toBe(before);
});
