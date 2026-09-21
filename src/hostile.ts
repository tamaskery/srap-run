import {Mesh} from '@babylonjs/core/Meshes/mesh';
import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial';
import {Color3} from '@babylonjs/core/Maths/math.color';
import {LoadAssetContainerAsync} from '@babylonjs/core/Loading/sceneLoader';
import '@babylonjs/loaders/glTF/2.0/glTFLoader';
import type {AnimationGroup} from '@babylonjs/core/Animations/animationGroup';
import type {Scene} from '@babylonjs/core/scene';
import type {Vec} from './gameplay';

/** A visual child only. The motor remains the sole owner of position/collision. */
export class Hostile {
 private clip!:AnimationGroup;
 private elapsed=0;
 private lastTime=0;
 private state='hostile_idle';
 private constructor(readonly root:Mesh,private readonly clips:Map<string,AnimationGroup>){
  this.select('hostile_idle');
 }
 static async create(scene:Scene){
  const asset=await LoadAssetContainerAsync(`${import.meta.env.BASE_URL}assets/g2/watcher.glb`,scene);
  const clips=new Map(asset.animationGroups.map(g=>[g.name,g]));
  for(const name of ['hostile_idle','hostile_walk','hostile_sprint'])if(!clips.has(name)){
   asset.dispose();throw new Error(`Hostile is missing ${name}`);
  }
  asset.addAllToScene();
  const root=new Mesh('threat',scene);root.isPickable=false;
  // Source feet at zero; existing interpolated actor centre is ground + .9.
  for(const node of asset.rootNodes){node.parent=root;if(node instanceof Mesh)node.position.y=-.8986;}
  for(const mesh of asset.meshes){mesh.isPickable=false;mesh.receiveShadows=true;}
  const marker=MeshBuilder.CreateTorus('threat:foot-ring',{diameter:1.05,thickness:.055,tessellation:24},scene);
  marker.parent=root;marker.position.y=-.86;marker.isPickable=false;
  const material=new StandardMaterial('hostile:marker',scene);material.diffuseColor=Color3.FromHexString('#ba6046');material.specularColor=Color3.Black();marker.material=material;
  // All resources belong to this scene; no cross-replay cache or observers.
  return new Hostile(root,clips);
 }
 private select(name:string){
  this.clip?.stop();this.state=name;this.elapsed=0;
  this.clip=this.clips.get(name)!;this.clip.start(true);this.clip.pause();this.clip.goToFrame(this.clip.from);
 }
 update(before:Vec,after:Vec,time:number,active:boolean,sprinting:boolean){
  const dt=Math.max(0,time-this.lastTime);this.lastTime=time;
  if(!active)return;
  const dx=after.x-before.x,dz=after.z-before.z;
  const moving=Math.hypot(dx,dz)>.0001;
  const state=moving?(sprinting?'hostile_sprint':'hostile_walk'):'hostile_idle';
  if(state!==this.state)this.select(state);
  if(moving)this.root.rotation.y=Math.atan2(dx,dz);
  const fps=this.clip.targetedAnimations[0].animation.framePerSecond;
  const duration=this.clip.to-this.clip.from;
  // Stance-foot travel measured in the source clips: 1.7 m / walk cycle,
  // 2.1 m / run cycle. Sample from achieved distance, including blocked motion.
  this.elapsed+=moving?Math.hypot(dx,dz)/(sprinting?2.1:1.7)*duration/fps:dt;
  this.clip.goToFrame(this.clip.from+(this.elapsed*fps)%duration);
 }
 snapshot(){return {clip:this.state,frame:this.clip.from+(this.elapsed*this.clip.targetedAnimations[0].animation.framePerSecond)%(this.clip.to-this.clip.from),pose:this.root.getChildTransformNodes().filter(n=>['UpperLeg.L','UpperArm.R','Head'].includes(n.name)).map(n=>({name:n.name,rotation:n.rotationQuaternion?.asArray()}))};}
}

