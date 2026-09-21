import {Color3,Color4} from '@babylonjs/core/Maths/math.color';
import {Vector3,Matrix} from '@babylonjs/core/Maths/math.vector';
import {Engine} from '@babylonjs/core/Engines/engine';
import {DirectionalLight} from '@babylonjs/core/Lights/directionalLight';
import {ShadowGenerator} from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent';
import {WorldArt} from './art';
import {addGroundContact} from './contact';
import {Hero} from './hero';
import {Hostile} from './hostile';
import {loadCourt,courtProbe} from './slice';
import {HemisphericLight} from '@babylonjs/core/Lights/hemisphericLight';
import {Mesh} from '@babylonjs/core/Meshes/mesh';
import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder';
import {Ray} from '@babylonjs/core/Culling/ray';
import {Scene} from '@babylonjs/core/scene';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial';
import {MAIN_SCENE,SCENES as PROOF_SCENES,validateDefinition,type SceneDefinition,type Wall} from './definition';
import {SQUARE_SCENE} from './square';
import {RunState,PlayerController,ThreatController,InteractionSystem,AmbientWalker,type Vec} from './gameplay';
import {NavigationService} from './navigation';
import {InputAdapter,type InputAction} from './input';
import {PresentationCamera} from './camera';
import {FixedClock,Diagnostics} from './timing';
import {MissionHUD} from './presentation';
import './style.css';
const canvas=document.querySelector<HTMLCanvasElement>('#world')!;
const hud=document.querySelector<HTMLDivElement>('#hud')!;
const engine=new Engine(canvas,true,{stencil:true,preserveDrawingBuffer:true},false);
engine.setHardwareScalingLevel(window.devicePixelRatio || 1);
let runtime:SceneRuntime|undefined;
let generation=0;
let measurement:Diagnostics|undefined;
let measurementDropped=0;
let measurementLast=0;
const params=new URLSearchParams(location.search);
const debug=params.has('debug');
const SCENES=[...PROOF_SCENES,SQUARE_SCENE];
const vector=(v:Vec)=>new Vector3(v.x,v.y,v.z);
const inside=(p:Vec,z:{x:number;z:number;width:number;depth:number},margin=0)=>Math.abs(p.x-z.x)<=z.width/2+margin&&Math.abs(p.z-z.z)<=z.depth/2+margin;
class SceneRuntime {
 readonly scene=new Scene(engine);
 readonly clock=new FixedClock();
 readonly diagnostics=new Diagnostics();
 readonly walls:Mesh[]=[];
 readonly renderGroups=new Map<string,Mesh[]>();
 readonly hiddenGroups=new Set<string>();
 art!:WorldArt;
 hero!:Hero;
 hostile?:Hostile;
 readonly ambient:{walker:AmbientWalker;mesh:Mesh;previous:Vec}[]=[];
 readonly itemMeshes=new Map<string,Mesh>();
 readonly owned=new AbortController();
 nav!:NavigationService;
 run!:RunState;
 player!:PlayerController;
 threat!:ThreatController;
 interactions!:InteractionSystem;
 input!:InputAdapter;
 camera!:PresentationCamera;
 playerMesh!:Mesh;
 threatMesh!:Mesh;
 cone!:Mesh;
 previousPlayer!:Vec;
 previousThreat!:Vec;
 presentation?:MissionHUD;
 paused=false;
 hidden=false;
 message='Collect the bottle, recycle in SRAP, then leave.';
 last=0;
 nearest='';
 disposed=false;
 deterministic=debug&&params.has('deterministic');
 lastSimulation=0;
 private material(name:string,color:string){const m=new StandardMaterial(name,this.scene);m.diffuseColor=Color3.FromHexString(color);m.specularColor=Color3.Black();return m;}
 constructor(readonly definition:SceneDefinition){this.message=definition.mission?.briefing??this.message;}
 async init(){
  validateDefinition(this.definition);
  if(engine.webGLVersion!==2)throw new Error('WebGL2 is required. Enable hardware acceleration in a supported browser.');
  this.scene.useRightHandedSystem=true;this.art=new WorldArt(this.scene,this.renderGroups);this.scene.clearColor=Color4.FromHexString('#a5afa0ff');
  const light=new HemisphericLight('sky',new Vector3(.3,1,.2),this.scene);light.intensity=this.definition.id==='square'?.46:.65;light.diffuse=Color3.FromHexString(this.definition.id==='square'?'#dbe5f0':'#dce8e3');light.groundColor=Color3.FromHexString(this.definition.id==='square'?'#737975':'#8b826b');
  const sun=new DirectionalLight('afternoon sun',new Vector3(-.6,-1,.45),this.scene);sun.position.set(25,50,-30);sun.intensity=this.definition.id==='square'?.92:.7;sun.diffuse=Color3.FromHexString(this.definition.id==='square'?'#fff2df':'#fff0cf');
  const shadows=new ShadowGenerator(1024,sun);shadows.usePoissonSampling=true;shadows.bias=.002;shadows.normalBias=.03;shadows.setDarkness(.22);
  const groundMat=this.art.tiled('surrounding ground','#7e8975','#78836f',100);
  const floorMat=this.art.tiled('square stone','#b5ae96','#a49f8c',28);
  const wallMat=this.material('walls','#d4c6a4');
  const roofMat=this.material('roof','#456578');
  const palette=new Map<string,StandardMaterial>();
  const colored=(color:string|undefined,fallback:StandardMaterial)=>{if(!color)return fallback;let m=palette.get(color);if(!m){m=this.material(color,color);palette.set(color,m);}return m;};
  const shape=(name:string,w:Wall,height=w.height)=>{
   if(w.shape==='ellipse'){const m=MeshBuilder.CreateCylinder(name,{height,diameter:1,tessellation:32},this.scene);m.scaling.x=w.width;m.scaling.z=w.depth;return m;}
   return MeshBuilder.CreateBox(name,{width:w.width,depth:w.depth,height},this.scene);
  };
  const ground=MeshBuilder.CreateGround('visual-ground',{width:240,height:220},this.scene);ground.position.y=-.05;ground.material=groundMat;ground.receiveShadows=true;
  const proxies:Mesh[]=[];
  for(const floor of this.definition.floors){
   const m=MeshBuilder.CreateGround(floor.id,{width:floor.width,height:floor.depth},this.scene);m.position.set(floor.x,0,floor.z);m.material=this.definition.id==='square'?floorMat:colored(floor.color,floorMat);m.receiveShadows=true;proxies.push(m);
  }
  for(const w of this.definition.walls){
   const proxy=shape(`${w.id}:proxy`,w);
   proxy.position.set(w.x,w.height/2,w.z);proxy.isVisible=false;proxy.isPickable=false;proxies.push(proxy);this.walls.push(proxy);
   const render=proxy.clone(w.id)!;render.isVisible=true;render.isPickable=true;render.material=colored(w.color,wallMat);render.receiveShadows=true;shadows.addShadowCaster(render);
   if(w.cutaway){const list=this.renderGroups.get(w.cutaway)??[];list.push(render);this.renderGroups.set(w.cutaway,list);
    const baseHeight=w.cutawayBaseHeight??.2;const base=shape(`${w.id}:base`,w,baseHeight);base.position.set(w.x,baseHeight/2,w.z);base.material=render.material;
   }
  }
  for(const r of this.definition.roofs){
   const m=shape(r.id,r,.18);m.position.set(r.x,r.height,r.z);m.material=colored(r.color,roofMat);
   if(r.cutaway){const list=this.renderGroups.get(r.cutaway)??[];list.push(m);this.renderGroups.set(r.cutaway,list);}
  }
  for(const d of this.definition.details??[]){const m=shape(d.id,d);m.position.set(d.x,(d.elevation??0)+d.height/2,d.z);m.material=colored(d.color,wallMat);m.isPickable=false;}
  this.art.dress(this.definition);
  if(this.definition.id==='square'){await loadCourt(this.scene,this.renderGroups,shadows);addGroundContact(this.scene,this.definition);}
  for(const mesh of this.scene.meshes)if(mesh.name.startsWith('dressing:'))mesh.receiveShadows=true;
  for(const zone of this.definition.zones){
   if(zone.kind==='cutaway')continue;
   const color=zone.kind==='hiding'?'#82916b':zone.kind==='recycler'?'#729e8c':'#bcaa6b';
   const m=MeshBuilder.CreateGround(zone.id,{width:zone.width,height:zone.depth},this.scene);m.position.set(zone.x,.02,zone.z);m.material=this.material(zone.id,color);m.metadata={target:zone.kind==='recycler'?zone.id:undefined};
   const pts=[[-1,-1],[1,-1],[1,1],[-1,1],[-1,-1]].map(([x,z])=>new Vector3(zone.x+x*zone.width/2,.045,zone.z+z*zone.depth/2));
   MeshBuilder.CreateLines(`${zone.id}:outline`,{points:pts},this.scene).color=Color3.FromHexString(color);
  }
  this.nav=await NavigationService.create(proxies);
  this.run=new RunState(this.definition.items.map(i=>i.id),this.definition.mission?.requiredBottles);
  this.player=new PlayerController(this.nav,this.definition.playerStart,this.run);
  this.threat=new ThreatController(this.nav,this.definition.threatStart,this.definition.patrol,this.run);
  for(const point of [...this.definition.patrol,...this.definition.items.map(i=>i.point),...this.definition.zones.filter(z=>z.kind!=='cutaway').map(z=>({x:z.x,y:0,z:z.z}))])this.nav.path(this.player.agent,point);
  this.interactions=new InteractionSystem(this.run,[...this.definition.items.map(i=>({...i,kind:'item' as const})),...this.definition.zones.filter(z=>z.kind==='recycler').map(z=>({id:z.id,kind:'recycler' as const,point:{x:z.x,y:0,z:z.z}}))],this.los);
  for(const item of this.definition.items)this.itemMeshes.set(item.id,this.art.bottle(item.id,item.point));
  this.hero=await Hero.create(this.scene);this.playerMesh=this.hero.root;
  if(this.definition.id==='square'){this.hostile=await Hostile.create(this.scene);this.threatMesh=this.hostile.root;}
  else this.threatMesh=this.art.character('threat','hostile');
  shadows.addShadowCaster(this.playerMesh,true);shadows.addShadowCaster(this.threatMesh,true);
  for(const actor of this.definition.ambient??[]){
   const walker=new AmbientWalker(this.nav,actor.path,actor.speed);
   const mesh=this.art.character(actor.id,'civilian',actor.color);shadows.addShadowCaster(mesh,true);
   this.ambient.push({walker,mesh,previous:{...walker.position}});
  }
  const conePoints=[Vector3.Zero(),...Array.from({length:17},(_,i)=>{const a=-Math.PI/4+i*Math.PI/32;return new Vector3(Math.sin(a)*8,0,Math.cos(a)*8);}),Vector3.Zero()];
  this.cone=MeshBuilder.CreateLines('detection cone',{points:conePoints},this.scene);(this.cone as any).color=Color3.FromHexString('#efb564');this.cone.isPickable=false;
  this.previousPlayer={...this.player.position};this.previousThreat={...this.threat.position};
  this.camera=new PresentationCamera(this.scene,engine,this.definition.cameraBounds,this.player.position,this.definition.camera);
  this.input=new InputAdapter(canvas,a=>this.action(a));
  window.addEventListener('resize',()=>{engine.resize();this.camera.update();},{signal:this.owned.signal});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)this.pause();this.last=0;},{signal:this.owned.signal});
  this.mountHUD();this.render(1);await this.scene.whenReadyAsync();this.render(1);
 }
 los=(a:Vec,b:Vec)=>{
  const start=new Vector3(a.x,a.y+1.2,a.z),end=new Vector3(b.x,b.y+1.0,b.z),delta=end.subtract(start),length=delta.length();
  if(length<1e-6)return true;
  const ray=new Ray(start,delta.scale(1/length),length);
  return !this.walls.some(w=>{const hit=ray.intersectsMesh(w,false);return hit.hit&&hit.distance<length-.01;});
 };
 action(a:InputAction){
  if(a.type==='blur'){this.pause();return;}
  if(a.type==='cancel'){
   if(this.player.hasCommand){this.player.clearInput();this.input.clear();this.message='Command cancelled.';}
   else this.setPaused(!this.paused);
   return;
  }
  if(this.paused||!this.run.active)return;
  switch(a.type){
   case 'move':{const axes=this.camera.axes(a.x,a.z);this.player.setInput({...axes,sprint:a.sprint});break;}
   case 'interact':{const target=this.interactions.nearest(this.player.position);if(target)this.interactions.interact(target.id,this.player.position);break;}
   case 'recenter':this.camera.recenter(this.player.position);break;
   case 'pan':this.camera.pan(a.dx,a.dy);break;
   case 'zoom':this.camera.zoom(a.delta);break;
   case 'click':{
    const rect=canvas.getBoundingClientRect();const x=(a.clientX-rect.left)*engine.getRenderWidth()/rect.width,y=(a.clientY-rect.top)*engine.getRenderHeight()/rect.height;
    const pick=this.scene.pick(x,y,m=>m.isPickable&&m.isVisible);
    if(pick?.pickedPoint){const id=pick.pickedMesh?.metadata?.target;const target=this.interactions.targets.find(t=>t.id===id);const p=target?.point??pick.pickedPoint;
     this.message=this.player.command(p,target?.id)?'Moving…':'No complete walkable route to that point.';
    }break;
   }
  }
 }
 setPaused(value:boolean){this.paused=value;if(!value)canvas.focus({preventScroll:true});this.player.clearInput();this.input.clear();this.clock.reset();this.last=0;this.message=value?'Paused — resume with fresh input.':'Resumed.';this.updateHUD();}
 pause(){if(this.run?.active)this.setPaused(true);}
 tick(dt:number){
  if(this.paused||!this.run.active)return;
  this.previousPlayer={...this.player.position};this.previousThreat={...this.threat.position};
  this.run.tick(dt);this.player.step(dt);
  for(const actor of this.ambient){actor.previous={...actor.walker.position};actor.walker.step(dt);}
  this.hidden=!this.player.moving&&!this.player.sprinting&&this.definition.zones.some(z=>z.kind==='hiding'&&inside(this.player.position,z));
  this.threat.step(dt,this.player.position,this.hidden,this.los);
  const pending=this.player.pendingInteraction;
  if(pending&&this.interactions.interact(pending,this.player.position)){this.player.cancel();this.message='Interaction complete.';}
  if(this.definition.zones.some(z=>z.kind==='exit'&&inside(this.player.position,z)))this.run.exit();
  this.updateCutaways();
  if(!this.run.active){this.player.clearInput();this.input.clear();this.clock.reset();}
  this.hostile?.update(this.previousThreat,this.threat.position,this.run.activeTime,this.run.active,this.threat.state==='chase');
  this.hero.update(this.previousPlayer,this.player.position,this.run.activeTime,this.run.active,this.player.sprinting);
 }
 updateCutaways(){
  for(const [id,meshes] of this.renderGroups){
   const was=this.hiddenGroups.has(id);
   const hide=this.definition.zones.some(z=>z.kind==='cutaway'&&z.group===id&&inside(this.player.position,z,was?.35:0));
   if(hide)this.hiddenGroups.add(id);else this.hiddenGroups.delete(id);
   for(const m of meshes)m.isVisible=!hide;
  }
 }
 render(alpha:number){
  const interpolate=(mesh:Mesh,before:Vec,after:Vec)=>{mesh.position.set(before.x+(after.x-before.x)*alpha,after.y+.9,before.z+(after.z-before.z)*alpha);};
  interpolate(this.playerMesh,this.previousPlayer,this.player.position);interpolate(this.threatMesh,this.previousThreat,this.threat.position);
  for(const actor of this.ambient)interpolate(actor.mesh,actor.previous,actor.walker.position);
  const animate=(mesh:Mesh,before:Vec,after:Vec)=>this.art.animate(mesh,before,after,this.run.activeTime,!this.paused&&this.run.active);
  if(!this.hostile)animate(this.threatMesh,this.previousThreat,this.threat.position);
  for(const actor of this.ambient)animate(actor.mesh,actor.previous,actor.walker.position);
  this.cone.position.set(this.threat.position.x,.06,this.threat.position.z);this.cone.rotation.y=Math.atan2(this.threat.facing.x,this.threat.facing.z);
  for(const [id,m] of this.itemMeshes){m.setEnabled(this.run.items.get(id)==='available');m.rotation.y=Math.sin(this.run.activeTime*1.5)*.12;}
  (this.cone as any).color=Color3.FromHexString(this.threat.state==='chase'?'#c85b40':this.threat.suspicion>0?'#dfa94e':'#ad9870');
    this.updateHUD();this.scene.render();
  for(const zone of this.definition.zones.filter(z=>z.kind!=='cutaway')){
   const label=hud.querySelector<HTMLElement>(`[data-zone="${zone.id}"]`);if(!label)continue;
   const p=Vector3.Project(new Vector3(zone.x,.1,zone.z),Matrix.Identity(),this.scene.getTransformMatrix(),this.camera.camera.viewport.toGlobal(engine.getRenderWidth(),engine.getRenderHeight()));
   label.style.left=`${p.x*canvas.clientWidth/engine.getRenderWidth()}px`;label.style.top=`${p.y*canvas.clientHeight/engine.getRenderHeight()}px`;
  }
  for(const [i,label] of (this.definition.labels??[]).entries()){
   const element=hud.querySelector<HTMLElement>(`[data-landmark="${i}"]`)!;
   const p=Vector3.Project(vector(label.point),Matrix.Identity(),this.scene.getTransformMatrix(),this.camera.camera.viewport.toGlobal(engine.getRenderWidth(),engine.getRenderHeight()));
   element.style.left=`${p.x*canvas.clientWidth/engine.getRenderWidth()}px`;element.style.top=`${p.y*canvas.clientHeight/engine.getRenderHeight()}px`;
  }
 }
 frame(now:number){
  const elapsed=this.last?(now-this.last)/1000:0;this.last=now;
  if(document.hidden){this.clock.reset();return;}
  const previousDropped=this.clock.dropped;
  const start=performance.now();const alpha=this.deterministic||this.paused||!this.run.active?1:this.clock.advance(elapsed,dt=>this.tick(dt));
  const simulation=performance.now()-start;this.lastSimulation=simulation;
  if(elapsed>0&&!this.paused&&this.run.active)this.diagnostics.record(elapsed*1000,simulation);
  if(measurement)measurementDropped+=Math.max(0,this.clock.dropped-previousDropped);
  this.render(alpha);
 }
 mountHUD(){
  hud.innerHTML=`<header><strong>SRAP RUN <small></small></strong><div><button id="pause">Pause</button><button id="replay">Replay</button>${debug?'<select id="scene-select">'+SCENES.map((s,i)=>`<option value="${i}" ${s.id===this.definition.id?'selected':''}>${s.id}</option>`).join('')+'</select>':''}</div></header><section id="stats"></section><p id="objective"></p><p id="message"></p><footer>Click to move / collect · WASD or arrows · Shift sprint · E interact<br>Middle-drag pan · Wheel zoom · Home recenter · Esc cancel / pause<br><span>Green: stop to hide · Teal: recycling · Gold: final exit<br>Break sight behind buildings or hedges, then stop in shelter.</span></footer>`;
  hud.querySelector('small')!.textContent=this.definition.name;
  for(const z of this.definition.zones.filter(z=>z.kind!=='cutaway')){const label=document.createElement('span');label.className='zone-label';label.dataset.zone=z.id;label.textContent=z.label??(z.kind==='recycler'?'SRAP · RECYCLE':z.kind.toUpperCase());hud.append(label);}
  for(const [i,l] of (this.definition.labels??[]).entries()){const label=document.createElement('span');label.className='zone-label landmark';label.dataset.landmark=String(i);label.textContent=l.text;hud.append(label);}
  hud.querySelector('#pause')!.addEventListener('click',()=>this.setPaused(!this.paused),{signal:this.owned.signal});
  hud.querySelector('#replay')!.addEventListener('click',()=>void boot(this.definition),{signal:this.owned.signal});
  hud.querySelector('#scene-select')?.addEventListener('change',e=>void boot(SCENES[Number((e.target as HTMLSelectElement).value)]),{signal:this.owned.signal});
  this.presentation=new MissionHUD(hud);
 }
 updateHUD(){
  const stats=hud.querySelector('#stats');if(!stats||!this.run)return;
  const near=this.interactions.nearest(this.player.position);this.nearest=near?.id??'';
  const mission=this.definition.mission;
  const objective=this.run.phase==='collecting'?(this.run.bagCount<this.run.requiredBottles?`Collect bottles: ${this.run.bagCount}/${this.run.requiredBottles} · ${this.definition.items.length} bottles in the square`:(mission?.recycleObjective??'Recycle your bottles')):this.run.phase==='exiting'?(mission?.exitObjective??'Reach the exit'):(this.run.phase==='success'?'MISSION COMPLETE':'CAUGHT · RUN FAILED');
  this.presentation?.update({run:this.run,threat:this.threat.state,suspicion:this.threat.suspicion,paused:this.paused,hidden:this.hidden,objective,message:this.message,near:near?.id,moving:this.player.moving});
 }
 snapshot(){return {hostile:this.hostile?.snapshot(),hero:this.hero.snapshot(),ambient:this.ambient.map(a=>({id:a.mesh.name,position:{...a.walker.position}})),scene:this.definition.id,phase:this.run.phase,health:this.run.health,stamina:this.run.stamina,time:this.run.activeTime,bag:this.run.bagCount,recycled:this.run.recycledCount,player:{...this.player.position},threat:{...this.threat.position},state:this.threat.state,suspicion:this.threat.suspicion,lastSeen:this.threat.lastSeen,hidden:this.hidden,paused:this.paused,path:this.player.path.length,pending:this.player.pendingInteraction,cutaways:[...this.hiddenGroups],renderGroups:[...this.renderGroups].map(([id,meshes])=>({id,visible:meshes.map(m=>m.isVisible)})),resources:{skeletons:this.scene.skeletons.length,animationGroups:this.scene.animationGroups.length,meshes:this.scene.meshes.length,materials:this.scene.materials.length,navmeshes:NavigationService.activeInstances,inputAdapters:InputAdapter.activeAdapters,scenes:engine.scenes.length},camera:{span:this.camera.span,alpha:this.camera.camera.alpha,beta:this.camera.camera.beta,target:this.camera.camera.target.asArray()},drawingBuffer:[engine.getRenderWidth(),engine.getRenderHeight()],dpr:devicePixelRatio,renderer:engine.getGlInfo(),diagnostics:this.diagnostics.report(this.clock.dropped)};}
 dispose(){this.disposed=true;this.presentation?.dispose();this.owned.abort();this.input?.dispose();this.nav?.dispose();this.scene.dispose();}
}
// Keep the historical debug fixture available; ordinary launch opens the mission.
async function boot(definition:SceneDefinition=SCENES.find(s=>s.id===params.get('scene'))??(debug?MAIN_SCENE:SQUARE_SCENE)){
 const own=++generation;runtime?.dispose();runtime=undefined;if(debug)delete (window as any).__m0;hud.innerHTML='<section>Loading local navigation…</section>';
 const candidate=new SceneRuntime(definition);
 try{
  if(params.has('failNav'))throw new Error('Injected navigation load failure');
  await candidate.init();if(own!==generation){candidate.dispose();return;}runtime=candidate;
  if(debug)(window as any).__m0={screen:(p:Vec)=>{const v=Vector3.Project(vector(p),Matrix.Identity(),candidate.scene.getTransformMatrix(),candidate.camera.camera.viewport.toGlobal(engine.getRenderWidth(),engine.getRenderHeight()));const r=canvas.getBoundingClientRect();return {x:r.left+v.x*r.width/engine.getRenderWidth(),y:r.top+v.y*r.height/engine.getRenderHeight()};},capture:(start:boolean)=>{if(start){measurement=new Diagnostics();measurementDropped=0;measurementLast=0;}return measurement?.report(measurementDropped);},schedule:(hz:number,seconds:number)=>{candidate.clock.reset();for(let i=0;i<hz*seconds;i++)candidate.clock.advance(1/hz,dt=>candidate.tick(dt));candidate.render(1);return candidate.snapshot();},deterministic:(value:boolean)=>{candidate.deterministic=value;candidate.clock.reset();},snapshot:()=>candidate.snapshot(),courtProbe:(mode:string)=>courtProbe(candidate.scene,mode),artProbe:(family:'court'|'hostile',enabled:boolean)=>{if(family==='hostile')candidate.hostile?.root.setEnabled(enabled);else for(const m of candidate.scene.meshes)if(/^(fixed|srap):/.test(m.name))m.setEnabled(enabled);},command:(p:Vec,id?:string)=>candidate.player.command(p,id),advance:(steps:number)=>{for(let i=0;i<steps;i++)candidate.tick(1/60);candidate.render(1);return candidate.snapshot();},pause:(p:boolean)=>candidate.setPaused(p),action:(a:InputAction)=>candidate.action(a),reset:()=>boot(definition),scene:(index:number)=>boot(SCENES[index]),definition:()=>definition,los:candidate.los,probe:(start:Vec,target:Vec)=>{const a=candidate.nav.spawn(start);return candidate.nav.path(a,target);},place:(who:'player'|'threat',p:Vec)=>{const a=candidate.nav.spawn(p);const actor=who==='player'?candidate.player:candidate.threat;actor.agent.position=a.position;actor.agent.ref=a.ref;candidate.previousPlayer={...candidate.player.position};candidate.previousThreat={...candidate.threat.position};candidate.player.clearInput();},damage:(amount:number)=>candidate.run.damage(amount),collect:()=>candidate.run.collect(definition.items[0].id),recycle:()=>candidate.run.recycle(),diagnosticsReset:()=>{candidate.diagnostics.reset();candidate.clock.dropped=0;}};
 }catch(error){candidate.dispose();hud.innerHTML='<section role="alert"><strong>Navigation / scene unavailable</strong><p></p><button id="retry">Retry</button></section>';hud.querySelector('p')!.textContent=error instanceof Error?error.message:String(error);hud.querySelector('#retry')!.addEventListener('click',()=>{params.delete('failNav');void boot(definition);},{once:true});console.error(error);}
}
engine.runRenderLoop(()=>{const now=performance.now();runtime?.frame(now);if(measurement){if(measurementLast)measurement.record(now-measurementLast,runtime?.lastSimulation??0);measurementLast=now;}});
void boot();
