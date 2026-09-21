import {LoadAssetContainerAsync} from '@babylonjs/core/Loading/sceneLoader';
import type {Scene} from '@babylonjs/core/scene';
import {Mesh} from '@babylonjs/core/Meshes/mesh';
import type {ShadowGenerator} from '@babylonjs/core/Lights/Shadows/shadowGenerator';

/** Authored art only; never contributes to picking, navmesh or LOS. */
export async function loadCourt(scene:Scene,groups:Map<string,Mesh[]>,shadows:ShadowGenerator){
 const asset=await LoadAssetContainerAsync(`${import.meta.env.BASE_URL}assets/g2/court.glb`,scene);
 asset.addAllToScene();
 // Existing solid cover keeps its exact footprint/height; only its surface changes.
 for(const id of ['east-garden','east-grove']){
  const shell=scene.getMeshByName(id);if(shell)shell.material=scene.getMaterialByName('plaster');
 }
 for(const mesh of asset.meshes){
  mesh.isPickable=false;mesh.receiveShadows=true;
  if(!(mesh instanceof Mesh)||!mesh.getTotalVertices())continue;
  if(mesh.name.startsWith('srap:')){
   const group=groups.get('srap')??[];group.push(mesh);groups.set('srap',group);
  }
  // Ground doesn't cast; everything elevated supplies the existing sun's shadows.
  if(!mesh.name.includes('limestone'))shadows.addShadowCaster(mesh);
 }
}
