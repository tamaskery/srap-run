import {DynamicTexture} from '@babylonjs/core/Materials/Textures/dynamicTexture';
import type {Scene} from '@babylonjs/core/scene';

/** Original painted surface family. Fixed seed, opaque, mipmapped; no image
 * references are sampled. Broad value shapes survive the tactical camera. */
export function architecturalSurface(scene:Scene){
 const t=new DynamicTexture('g5:architectural-surface',1024,scene,true),c=t.getContext();
 let seed=2026;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 c.fillStyle='#ffffff';c.fillRect(0,0,1024,1024);
 c.save();c.beginPath();c.rect(0,64,512,448);c.clip();
 c.fillStyle='#a2a49b';c.fillRect(0,64,512,448);
 // Zinc sheets: quiet panel differences, folded seams and broad oxidation.
 for(let x=0;x<512;x+=48){
  const value=146+Math.floor(random()*8);
  c.fillStyle=`rgb(${value},${value+3},${value-3})`;c.fillRect(x,64,48,448);
  c.fillStyle='#4f5a553c';c.fillRect(x,64,2,448);
  c.fillStyle='#e0dfc55c';c.fillRect(x+2,64,2,448);
 }
 for(let i=0;i<65;i++){
  const x=random()*512,y=64+random()*448,r=18+random()*76;
  const g=c.createRadialGradient(x,y,1,x,y,r);
  g.addColorStop(0,i%3?'#3c44330a':'#ece4c40d');g.addColorStop(1,'#77776900');
  c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);
 }
 // Roof perimeter accumulation is local AO, not a conflicting sun shadow.
 for(const [x,y,w,h] of [[8,72,488,424]]){
  const g=c.createLinearGradient(0,y,0,y+h);g.addColorStop(0,'#28322b52');g.addColorStop(.09,'#28322b00');g.addColorStop(.88,'#28322b00');g.addColorStop(1,'#28322b42');c.fillStyle=g;c.fillRect(x,y,w,h);
 }
 c.restore();
 // A second roof strip gives broad flat roofs felt rather than giant zinc sheets.
 c.fillStyle='#858980';c.fillRect(0,288,512,224);
 for(let row=0;row<4;row++)for(let col=0;col<8;col++){
  const x=col*64,y=288+row*56,v=128+Math.floor(random()*10);
  c.fillStyle=`rgb(${v},${v+3},${v-3})`;c.fillRect(x+1,y+1,63,55);
  c.fillStyle='#323d3025';c.fillRect(x,y,1,56);c.fillRect(x,y,64,1);
 }
 for(let i=0;i<12000;i++){
  c.fillStyle=i%2?'#ebe4c012':'#222c2410';c.fillRect(random()*512,288+random()*224,1.5,1.5);
 }
 // Small repaired membrane panels, not universal damage or random graffiti.
 for(const [x,y,w,h] of [[92,340,38,24],[332,429,56,32],[413,306,35,19]]){
  c.fillStyle='#666e6230';c.fillRect(x,y,w,h);c.fillStyle='#c2c3ad25';c.fillRect(x,y,w,1);
 }
 const felt=c.createLinearGradient(0,296,0,496);felt.addColorStop(0,'#25352b32');felt.addColorStop(.12,'#25352b00');felt.addColorStop(.87,'#25352b00');felt.addColorStop(1,'#25352b30');c.fillStyle=felt;c.fillRect(0,288,512,224);
 c.save();c.beginPath();c.rect(0,512,512,512);c.clip();
 c.fillStyle='#ded7c5';c.fillRect(0,512,512,512);
 for(let i=0;i<80;i++){
  const x=random()*512,y=512+random()*512,r=22+random()*85;
  const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,i%3?'#726e5710':'#fff5d91b');g.addColorStop(1,'#77776600');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);
 }
 const wall=c.createLinearGradient(0,520,0,1016);
 wall.addColorStop(0,'#373c343b');wall.addColorStop(.10,'#373c3400');wall.addColorStop(.68,'#373c3400');wall.addColorStop(1,'#4e514249');c.fillStyle=wall;c.fillRect(0,512,512,512);
 for(let i=0;i<45;i++){
  const x=random()*512,h=20+random()*95;
  const g=c.createLinearGradient(0,1016-h,0,1016);g.addColorStop(0,'#69695200');g.addColorStop(1,'#69695220');c.fillStyle=g;c.fillRect(x,1016-h,2+random()*6,h);
 }
 c.restore();
 const glass=c.createLinearGradient(0,8,0,496);
 glass.addColorStop(0,'#aebbb7');glass.addColorStop(.28,'#8faaa9');glass.addColorStop(.49,'#657e7b');glass.addColorStop(.51,'#526d68');glass.addColorStop(1,'#344d49');
 c.fillStyle=glass;c.fillRect(512,0,512,512);
 // Unequal reflected buildings/foliage, softened values rather than mirror lines.
 for(let i=0;i<9;i++){
  const x=520+i*59,y=150+random()*110;
  c.fillStyle=i%3?'#c7cbb128':'#263e3833';c.fillRect(x,y,34+random()*29,474-y);
 }
 c.fillStyle='#dbe0c525';c.beginPath();c.moveTo(520,45);c.lineTo(690,45);c.lineTo(1016,230);c.lineTo(1016,282);c.fill();
 const edge=c.createLinearGradient(520,0,1016,0);edge.addColorStop(0,'#122b3266');edge.addColorStop(.055,'#122b3200');edge.addColorStop(.94,'#122b3200');edge.addColorStop(1,'#122b3266');c.fillStyle=edge;c.fillRect(512,0,512,512);
 c.fillStyle='#243a37';c.fillRect(512,479,512,33);
 // Apartment reveal, fabric folds and sill bounce; one module with palette variants.
 c.fillStyle='#3e4a43';c.fillRect(512,512,512,512);
 c.fillStyle='#c9c7b8';c.fillRect(530,531,473,471);
 c.fillStyle='#728681';c.fillRect(545,548,443,435);
 c.fillStyle='#354e4c';c.fillRect(545,730,443,253);
 for(const [left,width] of [[551,102],[905,77]]){
  c.fillStyle='#b6b5a5';c.fillRect(left,554,width,420);
  for(let x=left;x<left+width;x+=17){const g=c.createLinearGradient(x,0,x+17,0);g.addColorStop(0,'#ffffff28');g.addColorStop(1,'#333f382d');c.fillStyle=g;c.fillRect(x,554,17,420);}
 }
 c.fillStyle='#c0c5b7';c.fillRect(758,542,13,444);c.fillRect(542,717,450,12);
 c.fillStyle='#172e3b42';c.fillRect(545,548,443,20);
 c.fillStyle='#e4ddc3';c.fillRect(530,995,473,7);
 t.update();return t;
}
