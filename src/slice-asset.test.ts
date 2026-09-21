import {readFileSync} from 'node:fs';
import {expect,test} from 'vitest';

function glb(name:string){
 const bytes=readFileSync(`public/assets/g2/${name}.glb`),length=bytes.readUInt32LE(12);
 return {json:JSON.parse(bytes.subarray(20,20+length).toString()),binary:bytes.subarray(28+length)};
}
test('G2 hostile keeps one in-place rig and the proven idle/walk/run contract',()=>{
 const {json:g,binary}=glb('watcher');
 expect(g.skins).toHaveLength(1);expect(g.skins[0].joints.length).toBeLessThanOrEqual(64);
 expect(g.animations.map((a:any)=>a.name).sort()).toEqual(['hostile_idle','hostile_sprint','hostile_walk']);
 for(const clip of g.animations){
  const root=clip.channels.find((c:any)=>g.nodes[c.target.node].name==='Root'&&c.target.path==='translation');
  expect(root).toBeDefined();
  const a=g.accessors[clip.samplers[root.sampler].output],v=g.bufferViews[a.bufferView];
  const data=new Float32Array(binary.buffer,binary.byteOffset+(v.byteOffset??0)+(a.byteOffset??0),a.count*3);
  for(let i=3;i<data.length;i++)expect(data[i]).toBeCloseTo(data[i%3],7);
 }
});
test('court exports embedded surfaces and explicit fixed/SRAP cutaway ownership',()=>{
 const {json:g}=glb('court');
 expect(g.animations??[]).toHaveLength(0);expect(g.skins??[]).toHaveLength(0);
 expect(g.images).toHaveLength(4);expect(g.images.every((i:any)=>i.bufferView!==undefined&&!i.uri)).toBe(true);
 expect(g.nodes.filter((n:any)=>n.mesh!==undefined).every((n:any)=>/^(srap|fixed):/.test(n.name))).toBe(true);
 expect(g.nodes.some((n:any)=>n.name.startsWith('srap:'))).toBe(true);
});
