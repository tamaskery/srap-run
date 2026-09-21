export class FixedClock {
  readonly step = 1 / 60;
  accumulator = 0;
  dropped = 0;
  advance(seconds: number, tick: (dt: number) => void): number {
    this.accumulator += Math.max(0, seconds);
    let count = 0;
    while (this.accumulator + 1e-9 >= this.step && count < 5) {
      tick(this.step); this.accumulator -= this.step; count++;
    }
    if (this.accumulator >= this.step) {
      const skipped = Math.floor(this.accumulator / this.step);
      this.dropped += skipped; this.accumulator -= skipped * this.step;
    }
    return Math.max(0, this.accumulator / this.step);
  }
  reset() { this.accumulator = 0; }
}
export class Diagnostics {
  frames: number[] = [];
  simulation: number[] = [];
  record(interval: number, simulation: number) {
    this.frames.push(interval); this.simulation.push(simulation);
    if (this.frames.length > 36000) { this.frames.shift(); this.simulation.shift(); }
  }
  reset() { this.frames = []; this.simulation = []; }
  report(dropped: number) {
    const sorted = [...this.frames].sort((a,b)=>a-b);
    const percentile = (p:number) => sorted[Math.min(sorted.length-1,Math.floor(sorted.length*p))] ?? 0;
    let sum=0, left=0, minFPS=Infinity;
    this.frames.forEach((value,right)=>{
      sum+=value;
      while(left<right && sum-this.frames[left]>=5000) sum-=this.frames[left++];
      if(sum>=5000) minFPS=Math.min(minFPS, (right-left+1)*1000/sum);
    });
    const simSorted=[...this.simulation].sort((a,b)=>a-b);
    return { stallsOver100ms:this.frames.filter(v=>v>100).length,simulationP95:simSorted[Math.floor(simSorted.length*.95)]??0,samples: sorted.length, median:percentile(.5), p95:percentile(.95), p99:percentile(.99), worst:percentile(1), minRolling5sFPS:Number.isFinite(minFPS)?minFPS:null, simulationMean:this.simulation.reduce((a,b)=>a+b,0)/(this.simulation.length||1), dropped };
  }
}
