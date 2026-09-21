import type {RunState, ThreatState} from './gameplay';
export interface HUDFrame {
  run:RunState; threat:ThreatState; suspicion:number; paused:boolean; hidden:boolean;
  objective:string; message:string; near?:string; moving?:boolean;
}
/** Locally synthesized cues; optional audio never owns game timing. */
export class RunAudio {
  private context?:AudioContext;
  private master?:GainNode;
  private disposed=false;
  muted=false;
  async unlock(){
    if(this.disposed)return;
    try {
      if(!this.context){this.context=new AudioContext();this.master=this.context.createGain();this.master.gain.value=this.muted?0:.22;this.master.connect(this.context.destination);}
      if(this.context.state==='suspended')await this.context.resume();
    } catch { /* Denied audio must leave the game playable. */ }
  }
  toggle(){this.muted=!this.muted;if(this.master)this.master.gain.value=this.muted?0:.22;return this.muted;}
  cue(kind:'pickup'|'recycle'|'damage'|'chase'|'success'|'failure'|'step'){
    const context=this.context,master=this.master;
    if(this.disposed||this.muted||!context||!master||context.state!=='running')return;
    const notes:Record<typeof kind,number[]>={pickup:[780,1040],recycle:[330,440,660],damage:[105,65],chase:[220,330],success:[392,494,587,784],failure:[220,165,110],step:[72]};
    try {
      notes[kind].forEach((frequency,i)=>{
        const oscillator=context.createOscillator(),gain=context.createGain();
        const start=context.currentTime+i*.105,duration=kind==='step'?.045:kind==='success'?.22:.14;
        oscillator.type=kind==='damage'||kind==='step'?'triangle':'sine';oscillator.frequency.setValueAtTime(frequency,start);
        gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(kind==='step'?.065:.32,start+.009);gain.gain.exponentialRampToValueAtTime(.001,start+duration);
        oscillator.connect(gain);gain.connect(master);oscillator.start(start);oscillator.stop(start+duration+.01);
        oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
      });
    } catch { /* Scene disposal can race a final frame. */ }
  }
  dispose(){this.disposed=true;this.master?.disconnect();void this.context?.close().catch(()=>{});}
}
/** Mount once; update existing nodes from authoritative gameplay state. */
export class MissionHUD {
  readonly audio=new RunAudio();
  private readonly owned=new AbortController();
  private readonly nodes=new Map<string,HTMLElement>();
  private previous?:{bag:number;recycled:number;health:number;phase:string;threat:string};
  private lastStep=0;
  constructor(private readonly root:HTMLElement){
    root.querySelector('#stats')!.innerHTML='<div class="status-heading"><span id="run-status"></span><time id="run-time"></time></div><div class="vital"><span>Health</span><span class="meter"><i id="health-fill"></i></span><b id="health-value"></b></div><div class="vital"><span>Stamina</span><span class="meter stamina"><i id="stamina-fill"></i></span><b id="stamina-value"></b></div><div class="supplies"><span>BOTTLES <b id="bag-value"></b></span><span>RECYCLED <b id="recycled-value"></b></span></div><div id="threat-status"></div>';
    const result=document.createElement('div');result.id='run-result';result.hidden=true;result.setAttribute('role','status');result.innerHTML='<span class="result-eyebrow">SRAP RUN · FIELD REPORT</span><h1 id="result-title"></h1><p id="result-summary"></p><span class="result-hint">Use Replay to start a fresh run.</span>';root.append(result);
    const sound=document.createElement('button');sound.id='sound';sound.type='button';sound.textContent='Sound on';sound.setAttribute('aria-label','Mute sound');sound.setAttribute('aria-pressed','false');root.querySelector('header > div')?.prepend(sound);
    sound.addEventListener('click',()=>{void this.audio.unlock();const muted=this.audio.toggle();sound.textContent=muted?'Sound off':'Sound on';sound.setAttribute('aria-pressed',String(muted));sound.setAttribute('aria-label',muted?'Unmute sound':'Mute sound');root.ownerDocument.querySelector<HTMLElement>('#world')?.focus({preventScroll:true});},{signal:this.owned.signal});
    for(const event of ['pointerdown','keydown'])window.addEventListener(event,()=>void this.audio.unlock(),{signal:this.owned.signal});
    root.querySelector('#message')?.setAttribute('role','status');
    root.querySelectorAll<HTMLElement>('[id]').forEach(node=>this.nodes.set(node.id,node));
  }
  private text(id:string,value:string){const node=this.nodes.get(id);if(node&&node.textContent!==value)node.textContent=value;}
  update(frame:HUDFrame){
    const {run}=frame;
    this.text('run-status',frame.paused?'PAUSED':frame.hidden?'CONCEALED':run.active?'IN THE SQUARE':run.phase==='success'?'COMPLETE':'RUN ENDED');
    this.text('run-time',`${Math.floor(run.activeTime/60)}:${String(Math.floor(run.activeTime%60)).padStart(2,'0')}`);
    for(const [kind,value] of [['health',run.health],['stamina',run.stamina]] as const){this.text(`${kind}-value`,String(Math.ceil(value)));this.nodes.get(`${kind}-fill`)!.style.transform=`scaleX(${Math.max(0,Math.min(1,value/100))})`;}
    this.text('bag-value',`${run.bagCount} / ${run.requiredBottles}`);this.text('recycled-value',String(run.recycledCount));
    const threatText:Record<ThreatState,string>={patrol:'Patrol nearby',suspicious:'Suspicion rising',chase:'Pursuit · break line of sight',search:'Searching your last position',return:'Patrol returning'};
    this.text('threat-status',`${frame.hidden?'Hidden · ':''}${threatText[frame.threat]}${frame.threat==='suspicious'?` · ${Math.round(frame.suspicion*100)}%`:''}`);
    this.root.dataset.threat=frame.threat;this.root.dataset.phase=run.phase;
    this.text('objective',frame.objective);
    const near=frame.near?(frame.near.toLowerCase().includes('recycl')?'E · Recycle bottles at SRAP':'E · Pick up bottle'):'';
    this.text('message',run.active?(near||frame.message):`${run.phase==='success'?'Run complete':'Run failed'} — recycled ${run.recycledCount}, health ${run.health}, active time ${run.activeTime.toFixed(1)}s. Replay starts fresh.`);
    this.text('pause',frame.paused?'Resume':'Pause');
    this.nodes.get('run-result')!.hidden=run.active;
    this.text('result-title',run.phase==='success'?'MISSION COMPLETE':'CAUGHT');
    this.text('result-summary',`${run.recycledCount} bottles recycled · ${run.health} health · ${run.activeTime.toFixed(1)}s`);
    const before=this.previous;
    if(before){
      if(run.health<before.health){this.audio.cue('damage');this.root.animate([{boxShadow:'inset 0 0 100px #a5312c88'},{boxShadow:'inset 0 0 0 transparent'}],{duration:450});}
      if(run.bagCount>before.bag){this.audio.cue('pickup');this.nodes.get('bag-value')!.animate([{color:'#fff2b4',transform:'scale(1.2)'},{color:'#d7c28d',transform:'scale(1)'}],{duration:350});}
      if(run.recycledCount>before.recycled)this.audio.cue('recycle');
      if(frame.threat==='chase'&&before.threat!=='chase')this.audio.cue('chase');
      if(run.phase!==before.phase&&!run.active)this.audio.cue(run.phase==='success'?'success':'failure');
    }
    if(frame.moving&&run.active&&!frame.paused&&run.activeTime-this.lastStep>.38){this.audio.cue('step');this.lastStep=run.activeTime;}
    this.previous={bag:run.bagCount,recycled:run.recycledCount,health:run.health,phase:run.phase,threat:frame.threat};
  }
  dispose(){this.owned.abort();this.audio.dispose();}
}
