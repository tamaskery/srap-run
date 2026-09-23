import type {RunState, ThreatState} from './gameplay';
export interface HUDFrame {
  run:RunState; threat:ThreatState; suspicion:number; paused:boolean; hidden:boolean;
  objective:string; message:string; near?:string; moving?:boolean; interior?:boolean;
}
/** Locally synthesized cues; optional audio never owns game timing. */
export class RunAudio {
  private context?:AudioContext;
  private master?:GainNode;
  private ambience?:GainNode;
  private city?:AudioBufferSourceNode;
  private nextCityCue=6;
  private cityCueIndex=0;
  private lastStep=0;
  private paused=false;
  private interior=false;
  private disposed=false;
  muted=false;
  async unlock(){
    if(this.disposed)return;
    try {
      if(!this.context){
        const context=this.context=new AudioContext();
        this.master=context.createGain();this.master.gain.value=this.muted||this.paused?0:.22;this.master.connect(context.destination);
        // A short, seeded noise bed becomes distant traffic after filtering. One looping source per run.
        const buffer=context.createBuffer(1,context.sampleRate*3,context.sampleRate);
        const data=buffer.getChannelData(0);let seed=19026;
        for(let i=0;i<data.length;i++){seed=(1664525*seed+1013904223)>>>0;data[i]=(seed/2147483648-1)*.25;}
        const city=this.city=context.createBufferSource(),filter=context.createBiquadFilter();
        this.ambience=context.createGain();city.buffer=buffer;city.loop=true;filter.type='lowpass';filter.frequency.value=190;
        this.ambience.gain.value=.12;city.connect(filter);filter.connect(this.ambience);this.ambience.connect(this.master);city.start();
      }
      if(this.context.state==='suspended')await this.context.resume();
    } catch { /* Denied audio must leave the game playable. */ }
  }
  private volume(){if(this.master&&this.context)this.master.gain.setTargetAtTime(this.muted||this.paused?0:.22,this.context.currentTime,.035);}
  toggle(){this.muted=!this.muted;this.volume();return this.muted;}
  setPaused(value:boolean){if(this.paused===value)return;this.paused=value;this.volume();}
  update(time:number,interior:boolean,active:boolean){
    if(this.interior!==interior){this.interior=interior;if(this.ambience&&this.context)this.ambience.gain.setTargetAtTime(interior?.055:.12,this.context.currentTime,.25);}
    if(!active||this.paused||time<this.nextCityCue)return;
    const cues=['bird','traffic','bird','tram'] as const;
    this.cue(cues[this.cityCueIndex++%cues.length]);
    this.nextCityCue=time+11+(this.cityCueIndex*7%9);
  }
  cue(kind:'pickup'|'recycle'|'suspicion'|'damage'|'chase'|'success'|'failure'|'step'|'bird'|'traffic'|'tram'){
    const context=this.context,master=this.master;
    if(this.disposed||this.muted||!context||!master||context.state!=='running')return;
    const notes:Record<typeof kind,number[]>={pickup:[640,920],recycle:[170,230,310,520],suspicion:[440],damage:[105,65],chase:[220,330],success:[392,494,587,784],failure:[220,165,110],step:[72],bird:[1750,2240,1910],traffic:[85,73],tram:[410,620,410]};
    try {
      notes[kind].forEach((frequency,i)=>{
        const oscillator=context.createOscillator(),gain=context.createGain();
        const ambient=kind==='bird'||kind==='traffic'||kind==='tram';
        const start=context.currentTime+i*(kind==='recycle'?.16:ambient?.22:.105),duration=kind==='step'?.045:kind==='traffic'?.8:kind==='tram'?.45:kind==='recycle'?.24:kind==='success'?.22:.14;
        oscillator.type=kind==='damage'||kind==='step'||kind==='traffic'||kind==='recycle'?'triangle':'sine';oscillator.frequency.setValueAtTime(frequency,start);
        if(kind==='traffic')oscillator.frequency.exponentialRampToValueAtTime(frequency*.7,start+duration);
        if(kind==='tram')oscillator.frequency.exponentialRampToValueAtTime(frequency*.85,start+duration);
        gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(kind==='step'?.055:ambient?.035:kind==='suspicion'?.09:.28,start+(ambient?.07:.009));gain.gain.exponentialRampToValueAtTime(.001,start+duration);
        oscillator.connect(gain);gain.connect(master);oscillator.start(start);oscillator.stop(start+duration+.01);
        oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
      });
    } catch { /* Scene disposal can race a final frame. */ }
  }
  step(time:number){if(time-this.lastStep>.38){this.cue('step');this.lastStep=time;}}
  dispose(){this.disposed=true;try{this.city?.stop();}catch{/* Audio may never have unlocked. */}this.city?.disconnect();this.master?.disconnect();void this.context?.close().catch(()=>{});}
}
/** Mount once; update existing nodes from authoritative gameplay state. */
export class MissionHUD {
  readonly audio=new RunAudio();
  private readonly owned=new AbortController();
  private readonly nodes=new Map<string,HTMLElement>();
  private previous?:{bag:number;recycled:number;health:number;phase:string;threat:string};
  private eventUntil=0;
  constructor(private readonly root:HTMLElement){
    root.querySelector('#stats')!.innerHTML='<div class="status-heading"><span id="run-status"></span><time id="run-time"></time></div><div class="vital"><span>Health</span><span class="meter"><i id="health-fill"></i></span><b id="health-value"></b></div><div class="vital"><span>Stamina</span><span class="meter stamina"><i id="stamina-fill"></i></span><b id="stamina-value"></b></div><div class="supplies"><span>BOTTLES <b id="bag-value"></b></span><span>RECYCLED <b id="recycled-value"></b></span></div><div id="threat-status"></div>';
    const result=document.createElement('div');result.id='run-result';result.hidden=true;result.setAttribute('role','status');result.innerHTML='<span class="result-eyebrow">SRAP RUN · FIELD REPORT</span><h1 id="result-title"></h1><p id="result-summary"></p><span class="result-hint">Use Replay to start a fresh run.</span>';root.append(result);
    const event=document.createElement('div');event.id='event-cue';event.hidden=true;root.append(event);
    const sound=document.createElement('button');sound.id='sound';sound.type='button';sound.textContent='Sound on';sound.setAttribute('aria-label','Mute sound');sound.setAttribute('aria-pressed','false');root.querySelector('header > div')?.prepend(sound);
    sound.addEventListener('click',()=>{void this.audio.unlock();const muted=this.audio.toggle();sound.textContent=muted?'Sound off':'Sound on';sound.setAttribute('aria-pressed',String(muted));sound.setAttribute('aria-label',muted?'Unmute sound':'Mute sound');root.ownerDocument.querySelector<HTMLElement>('#world')?.focus({preventScroll:true});},{signal:this.owned.signal});
    for(const event of ['pointerdown','keydown'])window.addEventListener(event,()=>void this.audio.unlock(),{signal:this.owned.signal});
    root.querySelector('#message')?.setAttribute('role','status');
    root.querySelectorAll<HTMLElement>('[id]').forEach(node=>this.nodes.set(node.id,node));
  }
  private text(id:string,value:string){const node=this.nodes.get(id);if(node&&node.textContent!==value)node.textContent=value;}
  update(frame:HUDFrame){
    const {run}=frame;
    this.audio.setPaused(frame.paused);this.audio.update(run.activeTime,!!frame.interior,run.active);
    this.text('run-status',frame.paused?'PAUSED':frame.hidden?'CONCEALED':run.phase==='exiting'?'TO ECSERI':run.active?(frame.interior?'IN SRAP':'IN THE SQUARE'):run.phase==='success'?'COMPLETE':'RUN ENDED');
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
      if(run.bagCount>before.bag){this.audio.cue('pickup');this.nodes.get('bag-value')!.animate([{color:'#fff2b4',transform:'scale(1.2)'},{color:'#d7c28d',transform:'scale(1)'}],{duration:350});this.showEvent(run.bagCount>=run.requiredBottles?'Bag ready · return to SRAP':`Bottle collected · ${run.bagCount} / ${run.requiredBottles}`,run.activeTime);}
      if(run.recycledCount>before.recycled){this.audio.cue('recycle');this.showEvent(`${run.recycledCount} recycled · head for Ecseri`,run.activeTime,3.4);}
      if(frame.threat==='suspicious'&&before.threat==='patrol')this.audio.cue('suspicion');
      if(frame.threat==='chase'&&before.threat!=='chase')this.audio.cue('chase');
      if(run.phase!==before.phase&&!run.active)this.audio.cue(run.phase==='success'?'success':'failure');
    }
    if(frame.moving&&run.active&&!frame.paused)this.audio.step(run.activeTime);
    this.nodes.get('event-cue')!.hidden=!run.active||run.activeTime>=this.eventUntil;
    this.previous={bag:run.bagCount,recycled:run.recycledCount,health:run.health,phase:run.phase,threat:frame.threat};
  }
  private showEvent(message:string,time:number,duration=2){this.text('event-cue',message);this.eventUntil=time+duration;this.nodes.get('event-cue')!.hidden=false;}
  dispose(){this.owned.abort();this.audio.dispose();}
}
