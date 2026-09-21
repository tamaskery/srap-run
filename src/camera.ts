import {ArcRotateCamera} from '@babylonjs/core/Cameras/arcRotateCamera';
import {Camera} from '@babylonjs/core/Cameras/camera';
import {Vector3} from '@babylonjs/core/Maths/math.vector';
import type {Engine} from '@babylonjs/core/Engines/engine';
import type {Scene} from '@babylonjs/core/scene';
import type { SceneDefinition } from './definition';
import type { Vec } from './gameplay';
export class PresentationCamera {
 readonly camera: ArcRotateCamera;
 span=25;
 private target:Vector3;
 constructor(scene:Scene,private engine:Engine,private bounds:SceneDefinition['cameraBounds'],start:Vec,private config?:SceneDefinition['camera']){
  this.span=config?.span??25;
  const target=config?.target??start;
  this.target=new Vector3(target.x,0,target.z);
  this.camera=new ArcRotateCamera('camera',config?.alpha??-Math.PI/4,Math.PI/4,120,this.target,scene);
  this.camera.mode=Camera.ORTHOGRAPHIC_CAMERA;
  this.camera.minZ=.1;this.camera.maxZ=250; this.update();
 }
 update(){
  const aspect=this.engine.getRenderWidth()/this.engine.getRenderHeight();
  const halfH=this.span/2,halfW=halfH*aspect;
  // Ground intersection of a 45 degree diagonal orthographic frustum.
  const extent=(halfW+halfH/Math.cos(Math.PI/4))/Math.sqrt(2);
  const b=this.bounds;
  this.target.x=Math.max(b.minX+extent,Math.min(b.maxX-extent,this.target.x));
  this.target.z=Math.max(b.minZ+extent,Math.min(b.maxZ-extent,this.target.z));
  this.camera.orthoLeft=-halfW;this.camera.orthoRight=halfW;
  this.camera.orthoTop=halfH;this.camera.orthoBottom=-halfH;
  this.camera.setTarget(this.target);
 }
 axes(x:number,z:number):Vec{
  const f=this.camera.getForwardRay().direction;const n=Math.hypot(f.x,f.z);
  return {x:(f.z*x+f.x*z)/n,y:0,z:(-f.x*x+f.z*z)/n};
 }
 pan(dx:number,dy:number){const d=this.axes(-dx,dy/Math.cos(Math.PI/4));const scale=this.span/this.engine.getRenderHeight();this.target.addInPlace(new Vector3(d.x*scale,0,d.z*scale));this.update();}
 zoom(delta:number){this.span=Math.max(15,Math.min(this.config?.maxSpan??35,this.span+delta*.02));this.update();}
 recenter(point:Vec){this.target.set(point.x,0,point.z);this.update();}
}
