import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import type { Scene } from '@babylonjs/core/scene';
import type { SceneDefinition } from './definition';
import type { Vec } from './gameplay';

// Presentation only. Decorations never enter the navigation or LOS proxy lists.
// Static details are merged by shared material AND cutaway ownership.
export class WorldArt {
  private materials = new Map<string, StandardMaterial>();
  private batches = new Map<string, { meshes: Mesh[]; group?: string }>();
  private boxTemplate: Mesh;
  private ballTemplate: Mesh;
  private cylinderTemplate: Mesh;
  constructor(private scene: Scene, private groups: Map<string, Mesh[]>) {
    this.boxTemplate = MeshBuilder.CreateBox('art-box', {}, scene);
    this.ballTemplate = MeshBuilder.CreateSphere('art-crown', { segments: 2, diameter: 1 }, scene);
    this.cylinderTemplate = MeshBuilder.CreateCylinder('art-cylinder', { tessellation: 16, diameter: 1, height: 1 }, scene);
    for (const m of [this.boxTemplate, this.ballTemplate, this.cylinderTemplate]) { m.isVisible = false; m.isPickable = false; }
  }
  material(color: string) {
    let m = this.materials.get(color);
    if (!m) {
      m = new StandardMaterial(`art:${color}`, this.scene);
      m.diffuseColor = Color3.FromHexString(color); m.specularColor = Color3.Black();
      this.materials.set(color, m);
    }
    return m;
  }
  tiled(name: string, base: string, joint: string, repeat: number) {
    const m = new StandardMaterial(name, this.scene);
    m.specularColor = Color3.Black();
    m.diffuseColor = Color3.White();
    const texture = new DynamicTexture(name, 128, this.scene, true);
    const c = texture.getContext(); c.fillStyle = base; c.fillRect(0, 0, 128, 128);
    c.strokeStyle = joint; c.lineWidth = 2;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(128, 0); c.moveTo(0, 64); c.lineTo(128, 64);
    c.moveTo(0, 0); c.lineTo(0, 64); c.moveTo(64, 64); c.lineTo(64, 128); c.stroke();
    // Deterministic aggregate, deliberately low contrast at gameplay distance.
    for (let i = 0; i < 120; i++) { c.fillStyle = i % 2 ? '#ffffff0a' : '#00000008'; c.fillRect((i * 47) % 128, (i * 71) % 128, 2, 2); }
    texture.update(); texture.wrapU = texture.wrapV = Texture.WRAP_ADDRESSMODE;
    texture.uScale = repeat; texture.vScale = repeat; m.diffuseTexture = texture;
    return m;
  }
  private part(name: string, pos: number[], size: number[], color: string, group?: string, shape = 'box') {
    const template = shape === 'ball' ? this.ballTemplate : shape === 'cylinder' ? this.cylinderTemplate : this.boxTemplate;
    const m = template.clone(name)!; m.isVisible = true; m.isPickable = false;
    m.position.set(pos[0], pos[1], pos[2]); m.scaling.set(size[0], size[1], size[2]); m.material = this.material(color);
    const key = `${color}/${group ?? ''}`;
    const batch = this.batches.get(key) ?? { meshes: [], group }; batch.meshes.push(m); this.batches.set(key, batch);
    return m;
  }
  private sign(text: string, x: number, y: number, z: number, width: number, height: number, group?: string) {
    const t = new DynamicTexture(`sign:${text}`, { width: 512, height: 128 }, this.scene, true);
    const c = t.getContext(); c.fillStyle = '#843b32'; c.fillRect(0, 0, 512, 128);
    c.fillStyle = '#eee3c5'; c.font = 'bold 62px Georgia'; c.fillText(text, (512 - c.measureText(text).width) / 2, 86); t.update();
    const mat = new StandardMaterial(`sign:${text}`, this.scene); mat.diffuseTexture = t; mat.specularColor = Color3.Black(); mat.backFaceCulling = false; mat.twoSidedLighting = true;
    const m = MeshBuilder.CreatePlane(text, { width, height }, this.scene); m.position.set(x, y, z); m.rotation.y = Math.PI; m.material = mat; m.isPickable = false;
    if (group) { const list = this.groups.get(group) ?? []; list.push(m); this.groups.set(group, list); }
    return m;
  }
  dress(definition: SceneDefinition) {
    if (definition.id !== 'square') return;
    const p = this.part.bind(this);
    // Inlaid pedestrian bands and curb edges leave the authored floor untouched.
    for (const z of [-23.7, 21.7]) p('square-curb', [0, .06, z], [76, .12, .35], '#d0c8b2');
    for (const x of [-37.7, 37.7]) p('square-curb', [x, .06, -1], [.35, .12, 46], '#d0c8b2');
    for (const z of [-10, 18.5]) p('paving-band', [0, .018, z], [75, .025, .32], '#8b8877');
    for (const x of [-28.5, 6]) p('paving-band', [x, .018, -1], [.28, .025, 43], '#8b8877');
    for (let i = 0; i < 7; i++) p('crosswalk', [-35 + i * 1.1, -.011, 27], [.65, .018, 7], '#c9c5b0');
    // G2 SRAP shell is authored in court.glb; signs and the clear entry remain.
    p('entrance-lintel', [19, 4.5, -12], [4, 1.1, .8], '#934c3e', 'srap');
    p('entrance-canopy', [19, 3.85, -11.1], [4.8, .18, 2.2], '#b7aa8c', 'srap');
    this.sign('S R A P', 9, 4.6, -11.48, 10, .8, 'srap').rotation.y = 0;
    this.sign('RECYCLING', 25, 4.6, -11.48, 5.5, .7, 'srap').rotation.y = 0;
    this.sign('S R A P', 14, 4.6, -22.46, 9, .8, 'srap');
    this.sign('SRAP', -.32, 4.5, -19.5, 3.1, .8, 'srap').rotation.y = -Math.PI / 2;
    // Interior stays dressed when the entire outside shell cuts away.
    for (let x = 2; x < 28; x += 2) p('floor-grout', [x, .022, -17], [.035, .015, 9.3], '#a49c89');
    for (const z of [-20, -18, -16, -14]) p('floor-grout', [14, .022, z], [27.3, .015, .035], '#a49c89');
    p('interior-skirt', [14, .28, -21.68], [27.3, .5, .12], '#65796b');
    p('machine-frame', [26, 1.1, -20.34], [1.3, 1.3, .12], '#d0cbb7');
    p('machine-mouth', [26, 1.32, -20.25], [.64, .48, .12], '#263b39');
    p('machine-display', [26.4, 1.65, -20.24], [.21, .16, .03], '#9bb58a');
    p('machine-tray', [26, .52, -20.14], [1.2, .15, .34], '#586d66');
    this.sign('RETURN / 05', 25.9, 2.4, -21.6, 2.4, .6).rotation.y = 0;
    // Shallow back-wall shelving adds aisle rhythm and product colour without
    // creating a supermarket simulation or occupying the protected routes.
    for(const [x,width] of [[4.2,6.2],[11.2,6.4],[17.9,5.8]] as const){
      p('shelf-shadow',[x,1.35,-21.46],[width,2.45,.18],'#273432');
      for(const y of [.46,1.12,1.78,2.42])p('shelf-edge',[x,y,-21.20],[width,.10,.52],'#59645e');
      for(let i=0;i<Math.floor(width/.72);i++){
        const tones=['#b46d4c','#d0b75f','#6c8d75','#c8c0a3'];
        p('product-block',[x-width/2+.48+i*.72,.77+(i%3)*.64,-21.12],[.48,.38,.18],tones[(i+Math.round(x))%tones.length]);
      }
    }
    p('recycling-stripe',[22.72,1.48,-14.5],[.06,1.85,4.45],'#398b79');
    p('recycling-header',[22.64,2.18,-14.5],[.12,.34,3.5],'#d5cfb8');
    // Water and bronze seals; no transparency or water simulation.
    p('fountain-water', [-5, .57, 4], [5.4, .055, 5.4], '#648f8c', undefined, 'cylinder');
    for (const [x, y, z, scale] of [[-5.3, 1.65, 4, 1], [-4.6, 1.43, 4.1, .8]]) {
      p('seal-body', [x, y, z], [.72 * scale, 1.1 * scale, 1.2 * scale], '#4f6359', undefined, 'ball');
      p('seal-head', [x, y + .62 * scale, z + .38], [.52 * scale, .56 * scale, .64 * scale], '#4f6359', undefined, 'ball');
      p('seal-flipper', [x - .4 * scale, y - .32, z + .1], [.65 * scale, .16, .42], '#4f6359', undefined, 'ball');
    }
    for (let i = 0; i < 3; i++) {
      const ring = MeshBuilder.CreateTorus('water-ripple', { diameter: 2.8 + i * .8, thickness: .026, tessellation: 40 }, this.scene);
      ring.position.set(-5, .61, 4); ring.material = this.material('#a3bbb0'); ring.isPickable = false;
    }
    // Three low-poly foliage families use clustered opaque crowns. Every cluster
    // remains inside an existing solid planter/hedge footprint, so the richer
    // silhouette never advertises new cover or changes navigation/LOS.
    const crown = (name:string, x:number, y:number, z:number, sx:number, sy:number, sz:number, tone:number) =>
      p(name, [x, y, z], [sx, sy, sz], ['#4e633f', '#657949', '#7f8d52'][tone % 3], undefined, 'ball');
    const tree = (family:'broad'|'narrow', x:number, z:number, scale:number, phase:number) => {
      p(`${family}-tree-trunk`, [x, 2.05 * scale, z], [.28 * scale, 4.1 * scale, .28 * scale], '#665741', undefined, 'cylinder');
      if (family === 'narrow') {
        for (let i = 0; i < 4; i++) crown('narrow-tree-crown', x + Math.sin(phase + i * 2.1) * .32, 3.25 + i * .72, z + Math.cos(phase + i * 1.7) * .22, 1.45 * scale, 1.7 * scale, 1.25 * scale, i + phase);
      } else {
        const clusters = [[0, 0, 0, 2.2, 1.65, 1.9], [-1.15, .18, .15, 1.55, 1.25, 1.45], [.95, .42, -.25, 1.65, 1.38, 1.5], [-.2, 1.05, .2, 1.65, 1.25, 1.55]];
        for (let i = 0; i < clusters.length; i++) { const [dx,dy,dz,sx,sy,sz]=clusters[i]; crown('broad-tree-crown',x+dx*scale,4.45*scale+dy*scale,z+dz*scale,sx*scale,sy*scale,sz*scale,i+phase); }
      }
    };
    const shrubPatch = (x:number, z:number, radius:number, phase:number) => {
      for(let i=0;i<3;i++){const a=phase+i*2.15,r=radius*(i===2?.28:.52);crown('layered-shrub',x+Math.cos(a)*r,.72+(i%2)*.18,z+Math.sin(a)*r,radius*.72,.72+(i%2)*.16,radius*.62,i+phase);}
    };
    // West planter: a broad park-tree composition with visible lower trunk and
    // layered planting. East authored gardens receive only infill within their
    // existing solids, complementing rather than replacing the imported trees.
    tree('broad', -33, 4, .78, 0);
    shrubPatch(-33, 2.55, .72, 1); shrubPatch(-33, 5.55, .68, 2);
    tree('narrow', 26.2, 6.1, .72, 1);
    for(const [x,z,r,phase] of [[11.8,4.5,.72,0],[14.1,6.2,.68,1],[16.2,4.6,.7,2],[24.4,3.6,.72,1],[27.7,8.2,.7,2]] as const) shrubPatch(x,z,r,phase);
    // Broken top rhythm on the long north hedge; individual crowns stay within
    // its 1.2 m depth and preserve the existing continuous gameplay proxy.
    for(let i=0;i<15;i++)crown('hedge-crown',6.7+i*1.32,1.72+(i%4===0?.18:0),14+(i%2?.08:-.08),.82+(i%3)*.08,.72+(i%4)*.06,.52,i);
    // A compact shared streetscape set punctuates long paving runs. Placement
    // hugs walls, planting or the perimeter and stays clear of bottles, entries,
    // patrol crossings and the pavilion cutaway footprints.
    const oriented = (name:string,x:number,y:number,z:number,w:number,h:number,d:number,color:string,angle=0) => {
      const m=p(name,[x,y,z],[w,h,d],color);m.rotation.y=angle;return m;
    };
    const bench=(x:number,z:number,angle=0)=>{
      oriented('bench-seat',x,.48,z,2.35,.14,.58,'#80684d',angle);
      oriented('bench-back',x,.91,z+.34*Math.cos(angle),2.35,.68,.12,'#80684d',angle);
      for(const side of [-.82,.82])oriented('bench-leg',x+side*Math.cos(angle),.24,z-side*Math.sin(angle),.11,.46,.48,'#414b48',angle);
    };
    const bin=(x:number,z:number)=>{p('street-bin',[x,.47,z],[.48,.82,.48],'#465652');p('street-bin-cap',[x,.92,z],[.56,.12,.56],'#9b927b');p('street-bin-slot',[x,.71,z-.25],[.28,.15,.035],'#202c2b');};
    bench(7.4,12.1);bin(9,12.2);
    bench(-16.2,16.8);bin(-14.6,16.8);
    bench(29.7,10.9,Math.PI/2);bin(29.7,9.3);
    // SRAP bicycle stands and threshold bollards are deliberately off-axis from
    // the door opening. Coarse geometry remains readable without subpixel bars.
    for(let i=0;i<3;i++){
      const x=27.7+i*.72;
      p('cycle-rack-leg',[x,.27,-10.72],[.08,.54,.08],'#697673');
      p('cycle-rack-rail',[x,.57,-10.72],[.08,.08,.72],'#89938c');
    }
    for(const x of [16.2,21.8]){p('entry-bollard',[x,.48,-10.78],[.22,.86,.22],'#4b5753','srap','cylinder');p('entry-bollard-cap',[x,.94,-10.78],[.28,.10,.28],'#b6ae96','srap','cylinder');}
    // One civic information board anchors the northern edge without implying an
    // interaction. Its back faces the road and its feet sit outside main travel.
    for(const x of [-1.05,1.05])p('info-board-post',[2+x,1.05,17.7],[.10,2.1,.10],'#44524f');
    p('info-board',[2,1.55,17.68],[2.45,1.25,.14],'#64716a');
    p('info-board-face',[2,1.58,17.58],[2.15,.92,.025],'#c8c2a9');
    for (const [x, z] of [[-38, -16], [-38, 17], [38, 17], [38, -15]]) {
      p('lamp-post', [x, 2.2, z], [.12, 4.4, .12], '#485b50');
      p('lamp-collar', [x, .22, z], [.32, .44, .32], '#485b50');
      p('lamp-lantern', [x, 4.45, z], [.45, .65, .45], '#ddd4ae');
      p('lamp-cap', [x, 4.83, z], [.58, .12, .58], '#485b50');
    }
    // Background facades are a single merged batch per material, not window draws.
    for (const b of definition.details?.filter(d => /tower|posta-shell/.test(d.id)) ?? []) {
      p('building-cornice', [b.x, b.height - .15, b.z], [b.width + .4, .28, b.depth + .4], '#d2c5a8');
      p('building-roof', [b.x, b.height + .08, b.z], [b.width, .22, b.depth], '#697269');
      for (let x = b.x - b.width / 2 + 1.5; x < b.x + b.width / 2 - .5; x += 2.8) {
        for (let y = 1.7; y < b.height - 1; y += 2.7) {
          for (const sign of [-1, 1]) {
            p('window', [x, y, b.z + sign * (b.depth / 2 + .035)], [1.15, 1.45, .08], '#516765');
            p('window-sill', [x, y - .76, b.z + sign * (b.depth / 2 + .09)], [1.4, .12, .24], '#c9bca1');
          }
        }
      }
    }
    for (const { meshes, group } of this.batches.values()) {
      const merged = Mesh.MergeMeshes(meshes, true, true)!; merged.name = `dressing:${group ?? 'fixed'}`; merged.isPickable = false;
      if (group) { const list = this.groups.get(group) ?? []; list.push(merged); this.groups.set(group, list); }
    }
    this.batches.clear();
  }
  character(name: string, role: 'player' | 'hostile' | 'civilian', color?: string, appearance: 'commuter' | 'shopper' | 'visitor' = 'commuter') {
    const root = new Mesh(name, this.scene); root.isPickable = false;
    const piece = (label: string, pos: number[], size: number[], tint: string, round = false) => {
      const m = (round ? this.ballTemplate : this.boxTemplate).clone(`${name}:${label}`)!;
      m.isVisible = true; m.isPickable = false; m.parent = root; m.position.set(...pos as [number, number, number]); m.scaling.set(...size as [number, number, number]); m.material = this.material(tint); return m;
    };
    const jacket = role === 'player' ? '#d8b66b' : role === 'hostile' ? '#594e48' : color ?? '#788285';
    const civilian = role === 'civilian';
    const torso = civilian && appearance === 'shopper' ? [.72, .66, .43] : civilian && appearance === 'visitor' ? [.53, .91, .35] : [.64, .72, .38];
    piece('coat', [0, .15, 0], torso, jacket);
    const head = piece('head', [0, .77, .015], [.4, .45, .4], '#d1ad85', true);
    piece('hair', [0, .94, -.05], [.42, .14, .36], '#584a3d');
    const trousers = civilian && appearance === 'shopper' ? '#4d5961' : civilian && appearance === 'visitor' ? '#514d46' : '#3e4c49';
    const legs = [-1, 1].map(side => piece('leg', [side * .17, -.49, 0], [.24, .62, .28], trousers));
    const arms = [-1, 1].map(side => piece('arm', [side * .43, .08, 0], [.2, .66, .24], jacket));
    for (const side of [-1, 1]) piece('boot', [side * .17, -.82, .07], [.26, .18, .43], '#343d38');
    if (role === 'player') { piece('rucksack', [0, .25, -.3], [.5, .58, .22], '#667b70'); piece('scarf', [0, .48, .23], [.52, .15, .1], '#eee0b5'); }
    if (role === 'hostile') { piece('cap', [0, 1, .04], [.53, .16, .55], '#383f3a'); piece('armband', [-.44, .15, .01], [.22, .17, .27], '#ba6046'); piece('belt', [0, -.11, .04], [.67, .11, .4], '#282f2c'); }
    if (civilian && appearance === 'commuter') { piece('backpack', [0, .2, -.3], [.54, .68, .24], '#394b57'); piece('cap', [0, 1.01, .03], [.47, .14, .48], '#384b58'); }
    if (civilian && appearance === 'shopper') { piece('vest', [0, .23, .24], [.57, .52, .07], '#765943'); piece('bag', [.57, -.17, .04], [.29, .43, .3], '#c5b99a'); piece('bag-handle', [.57, .11, .04], [.07, .22, .07], '#93876b'); }
    if (civilian && appearance === 'visitor') { piece('scarf', [0, .52, .2], [.52, .14, .1], '#c1c3ae'); piece('shoulder-bag', [-.43, -.16, -.1], [.29, .38, .24], '#626c53'); }
    const marker = MeshBuilder.CreateTorus(`${name}:foot-ring`, { diameter: role === 'player' ? 1.3 : 1.05, thickness: .055, tessellation: 24 }, this.scene);
    marker.parent = root; marker.position.y = -.86; marker.isPickable = false; marker.material = this.material(role === 'player' ? '#f3df98' : role === 'hostile' ? '#ba6046' : '#899380');
    root.metadata = { legs, arms, head, appearance, phase: [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 11, moving: false };
    return root;
  }
  animate(mesh: Mesh, before: Vec, after: Vec, time: number, active: boolean) {
    const dx = after.x - before.x, dz = after.z - before.z;
    const moving = active && Math.hypot(dx, dz) > .0001;
    if (moving) mesh.rotation.y = Math.atan2(dx, dz);
    const { legs, arms, head, phase } = mesh.metadata as { legs: Mesh[]; arms: Mesh[]; head: Mesh; phase: number };
    const stride = moving ? Math.sin(time * 11 + phase) * .55 : 0;
    legs.forEach((leg, i) => leg.rotation.x = stride * (i ? 1 : -1));
    arms.forEach((arm, i) => arm.rotation.x = stride * (i ? -1 : 1));
    if (active) head.rotation.y = moving ? 0 : Math.sin(time * .8 + phase) * .17;
  }
  bottle(id: string, point: Vec) {
    const variants:Record<string,number>={'arrival-bottle':0,'pavilion-back-bottle':1,'pavilion-shortcut-bottle':2,'fountain-bottle':0,'crossing-bottle':1,'east-walk-bottle':2,'garden-corner-bottle':0,'south-walk-bottle':2};
    const variant=variants[id]??0;
    // Three authored turned profiles: green PET, amber long-neck, silver can.
    // Shared ~2x presentation scale, smaller than the former metre-high bottle.
    const profiles=[[[.12,0],[.18,.04],[.18,.38],[.16,.46],[.07,.54],[.07,.64]],[[.11,0],[.13,.04],[.13,.35],[.065,.44],[.055,.68],[.055,.71]],[[.14,0],[.17,.025],[.17,.39],[.145,.43],[.14,.45]]];
    const profile=profiles[variant];
    const m = MeshBuilder.CreateLathe(id, {shape:profile.map(([x,y])=>new Vector3(x,y,0)),tessellation:12,cap:Mesh.CAP_ALL},this.scene);
    m.position.set(point.x,.05,point.z); m.material=this.material(['#497557','#795436','#a4aba5'][variant]);m.metadata={target:id,variant};
    const parts:readonly (readonly [string,number,number,number,string])[]=variant===2
      ? [['label',.23,.23,.344,'#9d513f'],['rim',.435,.025,.30,'#d2d4c7']]
      : [['cap',variant===0?.65:.72,.045,variant===0?.15:.13,variant===0?'#617e94':'#b7a37a'],['label',.25,.17,variant===0?.365:.265,'#e0d5b9']];
    for (const [label, y, height, diameter, color] of parts) {
      const part = MeshBuilder.CreateCylinder(`${id}:${label}`, { height, diameter, tessellation: 12 }, this.scene); part.parent = m; part.position.y = y; part.material = this.material(color); part.metadata = { target: id };
    }
    const ring = MeshBuilder.CreateTorus(`${id}:marker`, { diameter: 1.4, thickness: .075, tessellation: 24 }, this.scene);
    ring.parent = m; ring.position.y = 0; ring.material = this.material('#e5ca84'); ring.metadata = { target: id };
    return m;
  }
}
