import {Color3} from '@babylonjs/core/Maths/math.color';
import {Mesh} from '@babylonjs/core/Meshes/mesh';
import {VertexData} from '@babylonjs/core/Meshes/mesh.vertexData';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial';
import {architecturalSurface} from './surface-atlas';
import type {Scene} from '@babylonjs/core/scene';
import type {ShadowGenerator} from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import type {SceneDefinition, Wall} from './definition';

type Point = [number, number, number];
type Region = [number, number, number, number];
const WHITE:Region=[8,8,8,8], ROOF:Region=[8,72,496,280], FELT:Region=[8,296,496,496];
const GLASS:Region=[520,8,1016,496], PLASTER:Region=[8,520,496,1016];
const WINDOW:Region=[520,520,1016,1016];

/** One opaque atlas shared by the slice's architectural kit. Original artwork;
 * small joints and reflection/curtain information stay in texture space. */
function atlas(scene:Scene){
 const t=architecturalSurface(scene);
 const m=new StandardMaterial('g4:architecture',scene);m.diffuseTexture=t;
 // Closed outward-facing architecture does not need a second back-face pass.
 m.specularColor=Color3.Black();m.backFaceCulling=true;
 return m;
}

/** Geometry goes directly into one buffer per ownership region, not one mesh
 * per pane/balcony. Vertex colours supply the kit's restrained palette. */
export class ArchitectureBatch {
 positions:number[]=[];indices:number[]=[];uvs:number[]=[];colors:number[]=[];
 quad(points:Point[],color:string,region:Region=WHITE){
  const start=this.positions.length/3,c=Color3.FromHexString(color);
  for(let i=0;i<4;i++){
   this.positions.push(...points[i]);this.colors.push(c.r,c.g,c.b,1);
   const u=i===1||i===2?region[2]:region[0],v=i<2?region[3]:region[1];
   this.uvs.push(u/1024,1-v/1024);
  }
  this.indices.push(start,start+1,start+2,start,start+2,start+3);
 }
 box(x:number,y:number,z:number,w:number,h:number,d:number,color:string,region:Region=WHITE){
  const a=x-w/2,b=x+w/2,l=y-h/2,t=y+h/2,f=z-d/2,k=z+d/2;
  this.quad([[a,l,f],[b,l,f],[b,t,f],[a,t,f]],color,region);
  this.quad([[b,l,k],[a,l,k],[a,t,k],[b,t,k]],color,region);
  this.quad([[a,l,k],[a,l,f],[a,t,f],[a,t,k]],color,region);
  this.quad([[b,l,f],[b,l,k],[b,t,k],[b,t,f]],color,region);
  this.quad([[a,t,f],[b,t,f],[b,t,k],[a,t,k]],color,region);
  this.quad([[a,l,k],[b,l,k],[b,l,f],[a,l,f]],color,region);
 }
 ellipse(w:Wall,profile:[number,number][],color:string,roof=false){
  for(let j=0;j<profile.length-1;j++)for(let i=0;i<64;i++){
   const points:Point[]=[];
   for(const [k,n] of [[j,i],[j,i+1],[j+1,i+1],[j+1,i]]){
    const [radius,y]=profile[k],a=n*Math.PI/32;
    points.push([w.x+Math.cos(a)*w.width/2*radius,y,w.z+Math.sin(a)*w.depth/2*radius]);
   }
   const start=this.uvs.length;this.quad(points,color);
   if(roof)for(let n=0;n<4;n++){
    this.uvs[start+n*2]=(ROOF[0]+(points[n][0]-w.x+w.width/2)/w.width*(ROOF[2]-ROOF[0]))/1024;
    this.uvs[start+n*2+1]=1-(ROOF[1]+(points[n][2]-w.z+w.depth/2)/w.depth*(ROOF[3]-ROOF[1]))/1024;
   }
  }
 }
 mesh(name:string,scene:Scene,material:StandardMaterial){
  const m=new Mesh(name,scene),v=new VertexData();
  v.positions=this.positions;v.indices=this.indices;v.colors=this.colors;v.uvs=this.uvs;
  const normals:number[]=[];VertexData.ComputeNormals(this.positions,this.indices,normals);v.normals=normals;
  v.applyToMesh(m);m.material=material;m.isPickable=false;m.receiveShadows=true;
  return m;
 }
}

export function pavilionGeometry(w:Wall,roof:Wall){
 const a=new ArchitectureBatch();
 // Exact wall and canopy extents. The permanent 0.8 m proxy-derived base remains.
 a.ellipse(w,[[1,.79],[1,1.02]],'#56605d');

 // Opaque curved glass panels meet the existing solid; every fourth bay is a
 // bronze service panel. Unequal wall axes retain the three pavilion proportions.
 for(let i=0;i<32;i++){
  const t0=i*Math.PI/16,t1=(i+1)*Math.PI/16;
  const point=(t:number,y:number):Point=>[w.x+Math.cos(t)*(w.width/2+.012),y,w.z+Math.sin(t)*(w.depth/2+.012)];
  const solid=i===6||i===7||i===22||i===23;
  a.quad([point(t0,1.02),point(t1,1.02),point(t1,3.13),point(t0,3.13)],solid?'#887a63':i%3?'#dae0da':'#a7b8b6',solid?PLASTER:GLASS);
  if(i%2===0){
   const [x,,z]=point(t0,0);a.box(x,1.94,z,.12,2.42,.12,'#a7a997');
  }
 }
 a.ellipse(w,[[1,2.73],[1,2.8]],'#9ba799');
 a.ellipse(roof,[[.97,3.13],[1,3.22],[1,3.35]],'#475454');
 a.ellipse(roof,[[1,3.35],[1,3.52],[.97,3.58],[.92,3.58]],'#dfdac8');
 a.ellipse(roof,[[.92,3.58],[.70,3.82],[.28,3.98],[0,4.02]],'#d4d8d0',true);
 // Low rooflight and its folded flashing replace the arbitrary central button.
 a.box(w.x,4.01,w.z,3.25,.14,1.2,'#465356');
 a.box(w.x,4.12,w.z,2.9,.15,.92,'#6e8689',GLASS);
 for(const x of [-1.5,0,1.5])a.box(w.x+x,4.22,w.z,.08,.07,1.02,'#adb8b0');
 return a;
}

function facadeGeometry(b:Wall){
 const a=new ArchitectureBatch(),front=b.z-b.depth/2,commercial=b.height<6;
 // Only the housing and unbranded commercial shells visible in the slice.
 a.box(b.x,b.height/2,b.z,b.width+.035,b.height,b.depth+.035,b.id==='north-housing'?'#fff3d9':'#e7e8da',PLASTER);
 a.box(b.x,.43,b.z,b.width+.09,.86,b.depth+.09,'#777e78');
 a.box(b.x,b.height+.10,b.z,b.width,.18,b.depth,'#e1dfd2',FELT);
 for(let x=b.x-b.width/2+6;x<b.x+b.width/2;x+=6)
  a.box(x,b.height+.2,b.z,.045,.025,b.depth-.4,'#626e68');
 for(const z of [b.z-b.depth/2,b.z+b.depth/2]){
  a.box(b.x,b.height+.26,z,b.width+.2,.34,.20,'#c9c8b8');
  a.box(b.x,b.height-.27,z,b.width+.12,.16,.18,'#9faaa2');
 }
 for(const x of [b.x-b.width/2,b.x+b.width/2])a.box(x,b.height+.26,b.z,.20,.34,b.depth,'#c9c8b8');
 const bays=Math.floor(b.width/3.2),step=b.width/bays;
 for(let bay=0;bay<bays;bay++){
  const x=b.x-b.width/2+step*(bay+.5),balcony=!commercial&&(bay%5===1||bay%5===2);
  if(bay%5===4)a.box(x,b.height/2,front-.07,step-.06,b.height-.6,.10,bay%2?'#c8c1ac':'#bbc3b9',PLASTER);
  for(let floor=0;floor<(commercial?1:3);floor++){
   const y=(commercial?1.7:1.45)+floor*2.55;
   if(y+1>b.height-.35)continue;
   a.box(x,y,front-.11,1.86,1.88,.12,'#636e6a');
   const tone=['#d1d4c7','#ffffff','#e6ded0','#b9c8c5'][(bay+floor*3)%4];
   const window:Region=(bay+floor)%3===0?[WINDOW[2],WINDOW[1],WINDOW[0],WINDOW[3]]:WINDOW;
   a.quad([[x-.84,y-.82,front-.18],[x+.84,y-.82,front-.18],[x+.84,y+.82,front-.18],[x-.84,y+.82,front-.18]],tone,commercial?GLASS:window);
   a.box(x,y-.94,front-.22,2.02,.12,.38,'#d4d3c3');
   if(balcony&&floor>0){
    a.box(x,y-.99,front-.52,2.38,.17,1.03,'#cdcbbb');
    a.box(x,y-.60,front-.99,2.25,.67,.10,'#7c8a86');
    a.box(x,y-.25,front-.99,2.35,.06,.13,'#d1d2c6');
    for(const side of [-1,1])a.box(x+side*1.11,y-.61,front-.55,.08,.7,.85,'#89958c');
   }
  }
  if(bay%5===4||(commercial&&bay===1)){
   a.box(x,1.22,front-.24,1.75,2.44,.10,'#344747',GLASS);
   a.box(x,2.58,front-.61,2.5,.13,1.15,'#abb6aa');
   a.box(x,.12,front-.42,2.4,.24,.68,'#929c92');
  }
 }
 // Readable end elevation; no otherwise invisible back-face window rollout.
 const end=b.x-b.width/2-.025;
 for(const z of [b.z-2.5,b.z+2.5])for(const y of [1.6,4.15,6.7]){
  if(y+.72>b.height-.5)continue;
  a.quad([[end,y-.72,z+.65],[end,y-.72,z-.65],[end,y+.72,z-.65],[end,y+.72,z+.65]],'#eef0e3',WINDOW);
 }
 for(const offset of [-.28,.22]){
  const x=b.x+b.width*offset;
  a.box(x,b.height+.44,b.z+.8,2.5,.72,1.5,'#8a9186');
  a.box(x,b.height+.85,b.z+.8,2.72,.14,1.7,'#bac0b4');
 }
 return a;
}

export function addSliceArchitecture(scene:Scene,definition:SceneDefinition,groups:Map<string,Mesh[]>,shadows:ShadowGenerator){
 if(definition.id!=='square')return;
 const material=atlas(scene);
 const replace=(name:string)=>{
  const old=scene.getMeshByName(name);
  if(old instanceof Mesh){
   for(const [key,list] of groups)groups.set(key,list.filter(m=>m!==old));
   shadows.removeShadowCaster(old);old.dispose();
  }
 };
 for(const w of definition.walls.filter(w=>w.id.includes('pavilion'))){
  const roof=definition.roofs.find(r=>r.cutaway===w.cutaway)!;
  replace(w.id);replace(roof.id);
  const mesh=pavilionGeometry(w,roof).mesh(`g4:${w.id}`,scene,material);
  const group=groups.get(w.cutaway!)??[];group.push(mesh);groups.set(w.cutaway!,group);
  shadows.addShadowCaster(mesh);
 }
 for(const b of definition.details?.filter(b=>['north-housing','south-housing','lidl-background'].includes(b.id))??[]){
  replace(b.id);facadeGeometry(b).mesh(`g4:${b.id}`,scene,material).receiveShadows=false;
  // Preserve the original scenic shells: no caster bounds or unused shadow sampling.
 }
}
