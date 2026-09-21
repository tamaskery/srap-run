import { Color3 } from '@babylonjs/core/Maths/math.color';
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
    // SRAP's terracotta fascia, repeated window bays, stone base and clerestory.
    for (const [x, width] of [[8.5, 17], [24.5, 7]]) {
      p('srap-plinth', [x, .36, -11.7], [width, .7, .14], '#847d6b', 'srap');
      p('srap-fascia', [x, 4.4, -11.66], [width, .95, .2], '#934c3e', 'srap');
      p('srap-cornice', [x, 5.7, -11.62], [width, .18, .3], '#e1d4b5', 'srap');
    }
    for (const x of [2, 5, 8, 11, 14, 23, 26, 30, 33]) {
      const group = x < 28 ? 'srap' : undefined;
      p('shop-window-frame', [x, 2.4, -11.67], [2.5, 2.7, .12], '#ddd1b1', group);
      p('shop-window', [x, 2.4, -11.57], [2.25, 2.45, .08], '#405957', group);
      p('window-mullion', [x, 2.4, -11.5], [.09, 2.45, .09], '#b9b19a', group);
      p('window-reflection', [x, 3.24, -11.51], [2.2, .18, .02], '#708682', group);
    }
    p('entrance-lintel', [19, 4.5, -12], [4, 1.1, .8], '#934c3e', 'srap');
    p('entrance-canopy', [19, 3.85, -11.1], [4.8, .18, 2.2], '#b7aa8c', 'srap');
    this.sign('S R A P', 9, 4.43, -11.48, 10, .9, 'srap').rotation.y = 0;
    this.sign('RECYCLING', 25, 4.43, -11.48, 5.5, .8, 'srap').rotation.y = 0;
    // The fixed camera looks across the service elevation and roof first.
    // Carry the shop identity around that visible side rather than rotating play.
    p('service-plinth', [14, .4, -22.31], [28, .8, .14], '#847d6b', 'srap');
    p('service-fascia', [14, 4.5, -22.31], [28, .95, .14], '#934c3e', 'srap');
    p('service-cornice', [14, 5.7, -22.31], [28, .18, .25], '#e1d4b5', 'srap');
    for (let x = 2; x < 28; x += 3) {
      p('service-window-frame', [x, 3.15, -22.3], [2.4, 1.1, .12], '#ddd1b1', 'srap');
      p('service-window', [x, 3.15, -22.39], [2.16, .86, .06], '#405957', 'srap');
      p('service-pier', [x - 1.4, 2.2, -22.32], [.18, 4, .15], '#b0a68c', 'srap');
    }
    this.sign('S R A P', 14, 4.5, -22.42, 9, .85, 'srap');
    const roofSign = this.sign('S R A P', 17, 6.3, -17, 10, 2.5, 'srap');
    roofSign.rotation.set(-Math.PI / 2, 0, 0);
    this.sign('SRAP', -.32, 4.5, -19.5, 3.1, .8, 'srap').rotation.y = -Math.PI / 2;
    for (let x = 2; x < 33; x += 4) p('roof-seam', [x, 6.26, -17], [.07, .05, 10], '#525c55', 'srap');
    p('roof-vent', [10, 6.7, -18], [4, .9, 2], '#969d90', 'srap');
    // Interior stays dressed when the entire outside shell cuts away.
    for (let x = 2; x < 28; x += 2) p('floor-grout', [x, .022, -17], [.035, .015, 9.3], '#a49c89');
    for (const z of [-20, -18, -16, -14]) p('floor-grout', [14, .022, z], [27.3, .015, .035], '#a49c89');
    p('interior-skirt', [14, .28, -21.68], [27.3, .5, .12], '#65796b');
    p('machine-frame', [26, 1.1, -20.34], [1.3, 1.3, .12], '#d0cbb7');
    p('machine-mouth', [26, 1.32, -20.25], [.64, .48, .12], '#263b39');
    p('machine-display', [26.4, 1.65, -20.24], [.21, .16, .03], '#9bb58a');
    p('machine-tray', [26, .52, -20.14], [1.2, .15, .34], '#586d66');
    this.sign('RETURN / 05', 25.9, 2.4, -21.6, 2.4, .6).rotation.y = 0;
    // Rounded kiosks: glazing and ribs track the exact solid ellipse footprint.
    for (const w of definition.walls.filter(w => w.id.includes('pavilion'))) {
      p('kiosk-glazing', [w.x, 1.9, w.z], [w.width + .04, 1.5, w.depth + .04], '#49625e', w.cutaway, 'cylinder');
      for (let i = 0; i < 12; i++) {
        const a = i * Math.PI / 6;
        p('kiosk-rib', [w.x + Math.cos(a) * w.width / 2, 1.9, w.z + Math.sin(a) * w.depth / 2], [.13, 2.1, .13], '#b9ad8c', w.cutaway);
      }
      p('kiosk-roof-cap', [w.x, 3.62, w.z], [w.width - 1, .35, w.depth - 1], '#68796b', w.cutaway, 'cylinder');
      p('kiosk-finial', [w.x, 3.91, w.z], [1.1, .3, 1.1], '#405950', w.cutaway, 'cylinder');
    }
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
    // All foliage sits inside existing solid garden/hedge footprints.
    for (const w of definition.walls.filter(w => /garden|grove|hedge|planter/.test(w.id) && !w.id.includes('wall'))) {
      const count = Math.max(2, Math.floor(w.width / 2));
      for (let i = 0; i < count; i++) {
        const x = w.x + (i / Math.max(1, count - 1) - .5) * Math.max(0, w.width - 2);
        p('hedge-crown', [x, w.height, w.z], [Math.min(2.5, w.width), .9, Math.min(w.depth, 2.6)], i % 2 ? '#71804b' : '#556b43', undefined, 'ball');
      }
      if (w.shape === 'ellipse') {
        for (const side of [-1, 1]) {
          for (let i = 0; i < 3; i++) {
            p('garden-shrub', [w.x + (i - 1) * w.width * .23, w.height - .2, w.z + side * w.depth * .2], [w.width * .42, 1.35, w.depth * .57], (i + side) % 2 ? '#6c814d' : '#576e44', undefined, 'ball');
          }
        }
      }
    }
    for (const [x, z, scale] of [[13, 5, 1], [26, 6, 1.1], [-33, 4, .7]]) {
      p('tree-trunk', [x, 2, z], [.33, 4, .33], '#76634b', undefined, 'cylinder');
      p('tree-crown', [x, 4.7, z], [3.9 * scale, 3.3 * scale, 3.5 * scale], '#5b7046', undefined, 'ball');
      p('tree-crown-light', [x - .6, 5.65, z - .3], [2.9 * scale, 2 * scale, 2.7 * scale], '#7c8c50', undefined, 'ball');
    }
    // Benches sit on solid low wall/planter edges, never across a walkable route.
    for (const [x, z] of [[11, -7], [3, 0]]) {
      p('bench-seat', [x, 1.66, z], [2.6, .12, .58], '#9b784e');
      p('bench-back', [x, 1.95, z + .25], [2.6, .5, .12], '#9b784e');
    }
    for (const [x, z] of [[-38, -16], [-38, 17], [38, 17], [38, -15]]) {
      p('lamp-post', [x, 2.2, z], [.12, 4.4, .12], '#485b50');
      p('lamp-collar', [x, .22, z], [.32, .44, .32], '#485b50');
      p('lamp-lantern', [x, 4.45, z], [.45, .65, .45], '#ddd4ae');
      p('lamp-cap', [x, 4.83, z], [.58, .12, .58], '#485b50');
    }
    // Background facades are a single merged batch per material, not window draws.
    for (const b of definition.details?.filter(d => /housing|tower|posta-shell|lidl-background/.test(d.id)) ?? []) {
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
  character(name: string, role: 'player' | 'hostile' | 'civilian', color?: string) {
    const root = new Mesh(name, this.scene); root.isPickable = false;
    const piece = (label: string, pos: number[], size: number[], tint: string, round = false) => {
      const m = (round ? this.ballTemplate : this.boxTemplate).clone(`${name}:${label}`)!;
      m.isVisible = true; m.isPickable = false; m.parent = root; m.position.set(...pos as [number, number, number]); m.scaling.set(...size as [number, number, number]); m.material = this.material(tint); return m;
    };
    const jacket = role === 'player' ? '#d8b66b' : role === 'hostile' ? '#594e48' : color ?? '#788285';
    piece('coat', [0, .15, 0], [.64, .72, .38], jacket);
    piece('head', [0, .77, .015], [.4, .45, .4], '#d1ad85', true);
    piece('hair', [0, .94, -.05], [.42, .14, .36], '#584a3d');
    const legs = [-1, 1].map(side => piece('leg', [side * .17, -.49, 0], [.24, .62, .28], '#3e4c49'));
    const arms = [-1, 1].map(side => piece('arm', [side * .43, .08, 0], [.2, .66, .24], jacket));
    for (const side of [-1, 1]) piece('boot', [side * .17, -.82, .07], [.26, .18, .43], '#343d38');
    if (role === 'player') { piece('rucksack', [0, .25, -.3], [.5, .58, .22], '#667b70'); piece('scarf', [0, .48, .23], [.52, .15, .1], '#eee0b5'); }
    if (role === 'hostile') { piece('cap', [0, 1, .04], [.53, .16, .55], '#383f3a'); piece('armband', [-.44, .15, .01], [.22, .17, .27], '#ba6046'); piece('belt', [0, -.11, .04], [.67, .11, .4], '#282f2c'); }
    const marker = MeshBuilder.CreateTorus(`${name}:foot-ring`, { diameter: role === 'player' ? 1.3 : 1.05, thickness: .055, tessellation: 24 }, this.scene);
    marker.parent = root; marker.position.y = -.86; marker.isPickable = false; marker.material = this.material(role === 'player' ? '#f3df98' : role === 'hostile' ? '#ba6046' : '#899380');
    root.metadata = { legs, arms, phase: 0, moving: false };
    return root;
  }
  animate(mesh: Mesh, before: Vec, after: Vec, time: number, active: boolean) {
    const dx = after.x - before.x, dz = after.z - before.z;
    const moving = active && Math.hypot(dx, dz) > .0001;
    if (moving) mesh.rotation.y = Math.atan2(dx, dz);
    const { legs, arms } = mesh.metadata as { legs: Mesh[]; arms: Mesh[] };
    const stride = moving ? Math.sin(time * 11) * .55 : 0;
    legs.forEach((leg, i) => leg.rotation.x = stride * (i ? 1 : -1));
    arms.forEach((arm, i) => arm.rotation.x = stride * (i ? -1 : 1));
  }
  bottle(id: string, point: Vec) {
    const m = MeshBuilder.CreateCylinder(id, { height: .66, diameter: .38, tessellation: 12 }, this.scene);
    m.position.set(point.x, .45, point.z); m.material = this.material('#497e63'); m.metadata = { target: id };
    for (const [label, y, height, diameter, color] of [['neck', .42, .3, .18, '#497e63'], ['cap', .6, .08, .2, '#cfb982'], ['label', 0, .24, .391, '#e0d5ac']] as const) {
      const part = MeshBuilder.CreateCylinder(`${id}:${label}`, { height, diameter, tessellation: 12 }, this.scene); part.parent = m; part.position.y = y; part.material = this.material(color); part.metadata = { target: id };
    }
    const ring = MeshBuilder.CreateTorus(`${id}:marker`, { diameter: 1.4, thickness: .075, tessellation: 24 }, this.scene);
    ring.parent = m; ring.position.y = -.4; ring.material = this.material('#e5ca84'); ring.metadata = { target: id };
    return m;
  }
}
