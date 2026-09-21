import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';

describe('authored hero export contract',()=>{
 it('ships one bounded rig, three in-place clips and no external resources',()=>{
  const bytes=readFileSync('public/assets/hero/hero.glb');
  const length=bytes.readUInt32LE(12);
  const gltf=JSON.parse(bytes.subarray(20,20+length).toString());
  const binary=bytes.subarray(28+length);
  expect(gltf.skins).toHaveLength(1);
  expect(gltf.skins[0].joints.length).toBeLessThanOrEqual(64);
  expect(gltf.animations.map((a:any)=>a.name).sort()).toEqual(['hero_idle','hero_sprint','hero_walk']);
  expect(gltf.buffers.every((b:any)=>!b.uri)).toBe(true);
  expect(gltf.images??[]).toHaveLength(0);
  let triangles=0;
  for(const mesh of gltf.meshes)for(const primitive of mesh.primitives){
   triangles+=gltf.accessors[primitive.indices].count/3;
   expect(primitive.attributes.JOINTS_0).toBeDefined();
   expect(primitive.attributes.JOINTS_1).toBeUndefined();
  }
  expect(triangles).toBeLessThan(7000);
  for(const clip of gltf.animations){
   const root=clip.channels.find((c:any)=>gltf.nodes[c.target.node].name==='Root'&&c.target.path==='translation');
   expect(root).toBeDefined();
   const accessor=gltf.accessors[clip.samplers[root.sampler].output];
   const view=gltf.bufferViews[accessor.bufferView];
   const values=new Float32Array(binary.buffer,binary.byteOffset+(view.byteOffset??0)+(accessor.byteOffset??0),accessor.count*3);
   for(let i=3;i<values.length;i++)expect(values[i]).toBeCloseTo(values[i%3],7);
  }
 });
});
