import {expect,test} from 'vitest';
import {NullEngine} from '@babylonjs/core/Engines/nullEngine';
import {Scene} from '@babylonjs/core/scene';
import {VertexBuffer} from '@babylonjs/core/Buffers/buffer';
import {addGroundContact} from './contact';
import {SQUARE_SCENE} from './square';

test('contact strips preserve the solid layout and stay below interaction surfaces',()=>{
 const engine=new NullEngine(),scene=new Scene(engine);
 try{
  const before=JSON.stringify(SQUARE_SCENE);
  const mesh=addGroundContact(scene,SQUARE_SCENE);
  expect(JSON.stringify(SQUARE_SCENE)).toBe(before);
  expect(mesh.isPickable).toBe(false);
  expect(mesh.getTotalIndices()).toBeGreaterThan(0);
  const positions=mesh.getVerticesData(VertexBuffer.PositionKind)!;
  for(let i=1;i<positions.length;i+=3){expect(positions[i]).toBeGreaterThan(.008);expect(positions[i]).toBeLessThan(.02);}
  const colors=mesh.getVerticesData(VertexBuffer.ColorKind)!;
  expect(colors.filter((_,i)=>i%4===3)).toContain(0);
  expect(mesh.getTotalIndices()/3).toBeLessThan(1200);
 }finally{scene.dispose();engine.dispose();}
});
