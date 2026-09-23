import {Mesh} from '@babylonjs/core/Meshes/mesh';
import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder';
import {VertexBuffer} from '@babylonjs/core/Buffers/buffer';
import type {Scene} from '@babylonjs/core/scene';
import type {Vec} from './gameplay';
import type {WorldArt} from './art';

interface Bird {
  mesh:Mesh; home:Vec; x:number; z:number; phase:number;
  scatter:number; cooldown:number; dx:number; dz:number;
}

/** One small coloured mesh per decorative bird; no nav, LOS, collision or interaction owner. */
export class PigeonFlock {
  private readonly birds:Bird[]=[];
  private time=0;
  constructor(scene:Scene,art:WorldArt,homes:readonly Vec[]){
    const material=art.material('#ffffff');
    const pieces:Mesh[]=[];
    const add=(mesh:Mesh,color:string,position:[number,number,number],size:[number,number,number])=>{
      mesh.position.set(...position);mesh.scaling.set(...size);mesh.material=material;mesh.isPickable=false;
      const count=mesh.getVerticesData(VertexBuffer.PositionKind)!.length/3;
      const channels=[1,3,5].map(offset=>parseInt(color.slice(offset,offset+2),16)/255);
      const colors=new Float32Array(count*4);
      for(let i=0;i<count;i++)colors.set([...channels,1],i*4);
      mesh.setVerticesData(VertexBuffer.ColorKind,colors,false);
      pieces.push(mesh);
    };
    add(MeshBuilder.CreateSphere('pigeon-body',{diameter:1,segments:5},scene),'#777e82',[0,0,0],[.38,.25,.47]);
    add(MeshBuilder.CreateSphere('pigeon-head',{diameter:1,segments:5},scene),'#7e8588',[0,.17,.22],[.20,.20,.20]);
    for(const side of [-1,1])add(MeshBuilder.CreateBox('pigeon-wing',{},scene),'#424d58',[side*.2,.025,-.02],[.19,.045,.32]);
    add(MeshBuilder.CreateBox('pigeon-beak',{},scene),'#b5a278',[0,.13,.36],[.09,.055,.12]);
    const template=Mesh.MergeMeshes(pieces,true,true,undefined,false,false)!;
    template.name='pigeon:template';template.isVisible=false;template.isPickable=false;
    homes.forEach((home,i)=>{
      const mesh=template.clone(`pigeon:${i}`)!;mesh.isVisible=true;mesh.isPickable=false;
      mesh.position.set(home.x,.19,home.z);
      this.birds.push({mesh,home,x:home.x,z:home.z,phase:i*1.7,scatter:0,cooldown:i*.6,dx:0,dz:0});
    });
  }
  step(dt:number,player:Vec){
    this.time+=dt;
    for(const bird of this.birds){
      bird.cooldown=Math.max(0,bird.cooldown-dt);
      const fromPlayer=Math.hypot(bird.x-player.x,bird.z-player.z);
      if(fromPlayer<2.4&&bird.cooldown===0){
        if(fromPlayer<.01){bird.dx=Math.cos(bird.phase+1);bird.dz=Math.sin(bird.phase+1);}
        else{bird.dx=(bird.x-player.x)/fromPlayer;bird.dz=(bird.z-player.z)/fromPlayer;}
        bird.scatter=.7;bird.cooldown=4;
      }
      if(bird.scatter>0){
        bird.scatter=Math.max(0,bird.scatter-dt);
        if(Math.hypot(bird.x-bird.home.x,bird.z-bird.home.z)<2.1){bird.x+=bird.dx*dt*2.6;bird.z+=bird.dz*dt*2.6;}
        bird.mesh.rotation.y=Math.atan2(bird.dx,bird.dz);
      }else{
        const targetX=bird.home.x+Math.sin(this.time*.38+bird.phase)*.35;
        const targetZ=bird.home.z+Math.cos(this.time*.33+bird.phase)*.28;
        bird.x+=(targetX-bird.x)*Math.min(1,dt*.45);
        bird.z+=(targetZ-bird.z)*Math.min(1,dt*.45);
        bird.mesh.rotation.y=Math.sin(this.time*.6+bird.phase)*.45;
      }
      bird.mesh.rotation.x=bird.scatter>0?-.12:Math.max(0,Math.sin(this.time*2.8+bird.phase))*.12;
      bird.mesh.rotation.z=bird.scatter>0?Math.sin(this.time*32+bird.phase)*.12:0;
      bird.mesh.position.set(bird.x,.19+(bird.scatter>0?.08:0)+Math.sin(this.time*5+bird.phase)*.012,bird.z);
    }
  }
  snapshot(){return this.birds.map(bird=>({id:bird.mesh.name,x:bird.x,z:bird.z,scatter:bird.scatter>0}));}
}
