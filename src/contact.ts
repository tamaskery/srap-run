import {Mesh} from '@babylonjs/core/Meshes/mesh';
import {VertexData} from '@babylonjs/core/Meshes/mesh.vertexData';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial';
import {Color3} from '@babylonjs/core/Maths/math.color';
import type {Scene} from '@babylonjs/core/scene';
import type {SceneDefinition} from './definition';

/** Local ambient contact only, not a baked directional sun shadow.
 * Narrow feathered strips avoid a fullscreen pass and leave zone cues above them.
 * Derived from the existing solids, with no collision or picking ownership.
 */
export function addGroundContact(scene:Scene,definition:SceneDefinition){
 const positions:number[]=[],colors:number[]=[],indices:number[]=[];
 for(const wall of definition.walls){
  const segments=wall.shape==='ellipse'?32:4;
  const start=positions.length/3;
  for(const [spread,alpha] of [[0,.30],[.18,.15],[.7,0]]){
   for(let i=0;i<segments;i++){
    const a=i*Math.PI*2/segments;
    const x=wall.shape==='ellipse'?Math.cos(a):[1,1,-1,-1][i];
    const z=wall.shape==='ellipse'?Math.sin(a):[1,-1,-1,1][i];
    positions.push(wall.x+x*(wall.width/2+spread),.014,wall.z+z*(wall.depth/2+spread));
    colors.push(.10,.12,.14,alpha);
   }
  }
  for(let band=0;band<2;band++)for(let i=0;i<segments;i++){
   const a=start+band*segments+i,b=start+band*segments+(i+1)%segments;
   indices.push(a,b,a+segments,b,b+segments,a+segments);
  }
 }
 const mesh=new Mesh('ambient-contact',scene),data=new VertexData();
 data.positions=positions;data.colors=colors;data.indices=indices;
 data.normals=positions.map((_,i)=>i%3===1?1:0);data.applyToMesh(mesh);
 const material=new StandardMaterial('ambient-contact',scene);
 material.disableLighting=true;material.emissiveColor=Color3.White();
 material.backFaceCulling=false;material.alpha=.999;
 mesh.material=material;mesh.hasVertexAlpha=true;mesh.isPickable=false;
 mesh.freezeWorldMatrix();
 return mesh;
}
