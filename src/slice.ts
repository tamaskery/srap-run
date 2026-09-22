import {LoadAssetContainerAsync} from '@babylonjs/core/Loading/sceneLoader';
import type {Scene} from '@babylonjs/core/scene';
import {Mesh} from '@babylonjs/core/Meshes/mesh';
import type {ShadowGenerator} from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial';
import {PBRMaterial} from '@babylonjs/core/Materials/PBR/pbrMaterial';
import {Color3} from '@babylonjs/core/Maths/math.color';
import {VertexBuffer} from '@babylonjs/core/Buffers/buffer';
import {Vector3} from '@babylonjs/core/Maths/math.vector';

/** Reuse the architecture atlas on the existing SRAP buffers. UV authoring only;
 * geometry, cutaway ownership and the source GLB remain unchanged. */
function finishStoreSurfaces(scene:Scene){
 const family=scene.getMaterialByName('g4:architecture') as StandardMaterial;
 const glass=new StandardMaterial('g5:store-glazing',scene);
 glass.diffuseTexture=family.diffuseTexture;
 glass.specularColor=new Color3(.10,.12,.11);glass.specularPower=48;
 for(const mesh of scene.meshes){
  if(!(mesh instanceof Mesh)||!/^(fixed|srap):/.test(mesh.name))continue;
  const roof=mesh.name.endsWith(':roof-felt'),plaster=mesh.name.endsWith(':plaster'),pane=mesh.name.endsWith(':smoked glazing');
  if(!roof&&!plaster&&!pane)continue;
  mesh.computeWorldMatrix(true);
  const p=mesh.getVerticesData(VertexBuffer.PositionKind)!;const uv:number[]=[];
  for(let i=0;i<p.length;i+=3){
   const w=Vector3.TransformCoordinates(new Vector3(p[i],p[i+1],p[i+2]),mesh.getWorldMatrix());
   if(roof)uv.push((8+Math.max(0,Math.min(1,w.x/34))*488)/1024,1-(296+Math.max(0,Math.min(1,(w.z+22)/10))*200)/1024);
   else if(plaster)uv.push((8+((w.x%8+8)%8)/8*488)/1024,1-(520+(1-Math.max(0,Math.min(1,w.y/6)))*496)/1024);
   else uv.push((520+((w.x%2.8+2.8)%2.8)/2.8*496)/1024,1-(8+(1-Math.max(0,Math.min(1,(w.y-1.2)/2.6)))*488)/1024);
  }
  mesh.setVerticesData(VertexBuffer.UVKind,uv);mesh.material=pane?glass:family;
 }
 const reflection=scene.getMaterialByName('court:soft reflected sky');
 if(reflection instanceof StandardMaterial)reflection.diffuseColor=Color3.FromHexString('#718983');
 // Existing visible shells receive cladding, never their shared hidden proxies.
 // Top faces are muted stone/soil; local lower-wall tint integrates the bases.
 for(const id of ['srap-west-front','srap-west-back','srap-east-wing','west-planter','south-garden-wall','crossing-cover']){
  const mesh=scene.getMeshByName(id);if(!(mesh instanceof Mesh))continue;
  mesh.makeGeometryUnique();mesh.computeWorldMatrix(true);
  const p=mesh.getVerticesData(VertexBuffer.PositionKind)!,n=mesh.getVerticesData(VertexBuffer.NormalKind)!;
  const uv:number[]=[],colors:number[]=[];
  const box=mesh.getBoundingInfo().boundingBox,height=box.maximumWorld.y;
  for(let i=0;i<p.length;i+=3){
   const w=Vector3.TransformCoordinates(new Vector3(p[i],p[i+1],p[i+2]),mesh.getWorldMatrix());
   const horizontal=Math.abs(n[i])>.5?w.z:w.x;
   uv.push((8+((horizontal%6+6)%6)/6*488)/1024,1-(520+(1-Math.max(0,Math.min(1,w.y/height)))*496)/1024);
   const top=n[i+1]>.5,gain=top?.70:(w.y<.1?.74:1);
   colors.push(gain,gain,gain*.96,1);
  }
  mesh.setVerticesData(VertexBuffer.UVKind,uv);mesh.setVerticesData(VertexBuffer.ColorKind,colors);mesh.material=family;
 }
}

/** The court uses opaque diffuse surfaces; no environment reflections or metals.
 * Load its colour textures without GPU sRGB decode: StandardMaterial expects
 * gamma-space diffuse samples, unlike glTF PBR. Actor PBR imports are untouched.
 */
export function courtDiffuse(scene:Scene){
 const converted=new Map<PBRMaterial,StandardMaterial>();
 for(const mesh of scene.meshes){
  if(!/^(fixed|srap):/.test(mesh.name)||!(mesh.material instanceof PBRMaterial))continue;
  const source=mesh.material;
  let material=converted.get(source);
  if(!material){
   material=new StandardMaterial(`court:${source.name}`,scene);
   material.diffuseColor=source.albedoColor.toGammaSpace();
   material.diffuseTexture=source.albedoTexture;
   if(source.name==='limestone'&&material.diffuseTexture)material.diffuseTexture.level=1.70;
   material.specularColor=Color3.Black();
   material.backFaceCulling=source.backFaceCulling;
   material.twoSidedLighting=true;
   converted.set(source,material);
  }
  mesh.material=material;
 }
 // The replacement owns the existing textures; release only unused PBR wrappers.
 for(const source of converted.keys())if(!scene.meshes.some(m=>m.material===source))source.dispose(false,false);
}

/** Debug-only render isolation; ordinary gameplay never invokes this. */
export function courtProbe(scene:Scene,mode:string){
 const court=scene.meshes.filter(m=>/^(fixed|srap):/.test(m.name));
 if(mode==='diffuse')courtDiffuse(scene);
 if(mode==='no-receive')for(const m of court)m.receiveShadows=false;
 if(mode==='no-cast')for(const light of scene.lights){
  const map=light.getShadowGenerator()?.getShadowMap();
  if(map?.renderList)map.renderList=map.renderList.filter(m=>!court.includes(m));
 }
 if(mode==='no-foliage')for(const m of court)if(/foliage|leaf/.test(m.name))m.setEnabled(false);
 if(mode==='static')for(const m of court){m.freezeWorldMatrix();m.material?.freeze();}
 if(mode==='no-paving')for(const m of court)if(m.name==='fixed:limestone')m.setEnabled(false);
 return court.map(m=>({name:m.name,vertices:m.getTotalVertices(),triangles:m.getTotalIndices()/3,submeshes:m.subMeshes?.length,material:m.material?.getClassName(),receive:m.receiveShadows}));
}

/** Authored art only; never contributes to picking, navmesh or LOS. */
export async function loadCourt(scene:Scene,groups:Map<string,Mesh[]>,shadows:ShadowGenerator){
 const asset=await LoadAssetContainerAsync(`${import.meta.env.BASE_URL}assets/g3/court.glb`,scene,{pluginOptions:{gltf:{useSRGBBuffers:false}}});
 asset.addAllToScene();
 courtDiffuse(scene);
 finishStoreSurfaces(scene);
 // Extend the already licensed paving family through the existing square. UVs
 // match the imported east court in world metres, eliminating its hard border.
 const pavement=scene.getMeshByName('square-pavement');
 if(pavement instanceof Mesh){
  pavement.material=scene.getMaterialByName('court:limestone');
  const p=pavement.getVerticesData(VertexBuffer.PositionKind)!;const uv:number[]=[];
  for(let i=0;i<p.length;i+=3)uv.push((p[i]+pavement.position.x)/2.7,-(p[i+2]+pavement.position.z)/2.7);
  pavement.setVerticesData(VertexBuffer.UVKind,uv);
 }
 // Existing solid cover keeps its exact footprint/height; only its surface changes.
 for(const id of ['east-garden','east-grove']){
  const shell=scene.getMeshByName(id);
  if(shell instanceof Mesh){
   shell.material=scene.getMaterialByName('court:limestone');
   // Only the visible clone's UVs change. Keep the shared navigation proxy's
   // vertex/index buffers intact and avoid a second, overlapping curved skin.
   const uv=Array.from(shell.getVerticesData(VertexBuffer.UVKind)??[]);
   const a=shell.scaling.x/2,b=shell.scaling.z/2;
   const circumference=Math.PI*(3*(a+b)-Math.sqrt((3*a+b)*(a+3*b)));
   const height=shell.getBoundingInfo().boundingBox.extendSize.y*2;
   for(let i=0;i<uv.length;i+=2){uv[i]*=circumference/2.7;uv[i+1]*=height/2.7;}
   shell.makeGeometryUnique();shell.setVerticesData(VertexBuffer.UVKind,uv);
  }
 }
 for(const mesh of asset.meshes){
  mesh.isPickable=false;
  // Keep canopy self-shadowing: its measured removal did not justify the loss.
  mesh.receiveShadows=true;
  if(!(mesh instanceof Mesh)||!mesh.getTotalVertices())continue;
  if(mesh.name.startsWith('srap:')){
   const group=groups.get('srap')??[];group.push(mesh);groups.set('srap',group);
  }
  // Ground doesn't cast; everything elevated supplies the existing sun's shadows.
  if(!mesh.name.includes('limestone'))shadows.addShadowCaster(mesh);
 }
}
