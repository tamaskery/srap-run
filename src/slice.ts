import {LoadAssetContainerAsync} from '@babylonjs/core/Loading/sceneLoader';
import type {Scene} from '@babylonjs/core/scene';
import {Mesh} from '@babylonjs/core/Meshes/mesh';
import type {ShadowGenerator} from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial';
import {PBRMaterial} from '@babylonjs/core/Materials/PBR/pbrMaterial';
import {Color3} from '@babylonjs/core/Maths/math.color';
import {VertexBuffer} from '@babylonjs/core/Buffers/buffer';

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
