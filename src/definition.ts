import type { Vec } from './gameplay';

export interface Floor { readonly id: string; readonly x: number; readonly z: number; readonly width: number; readonly depth: number; readonly color?: string }
export interface Wall extends Floor { readonly height: number; readonly cutaway?: string; readonly cutawayBaseHeight?: number; readonly shape?: 'box' | 'ellipse' }
/** Presentation only: never contributes navigation or LOS. Solid objects belong in walls. */
export interface Detail extends Wall { readonly elevation?: number }
export interface Zone extends Floor { readonly kind: 'hiding' | 'recycler' | 'exit' | 'cutaway'; readonly group?: string; readonly label?: string }
export interface SceneDefinition {
  readonly id: string;
  readonly name: string;
  readonly floors: readonly Floor[];
  readonly walls: readonly Wall[];
  readonly roofs: readonly Wall[];
  readonly zones: readonly Zone[];
  readonly items: readonly { readonly id: string; readonly point: Vec }[];
  readonly playerStart: Vec;
  readonly threatStart: Vec;
  readonly patrol: readonly Vec[];
  readonly cameraBounds: { readonly minX: number; readonly maxX: number; readonly minZ: number; readonly maxZ: number };
  readonly camera?: { readonly span: number; readonly maxSpan: number; readonly target: Vec; readonly alpha?: number };
  readonly mission?: { readonly requiredBottles: number; readonly briefing: string; readonly recycleObjective: string; readonly exitObjective: string };
  readonly details?: readonly Detail[];
  readonly ambient?: readonly { readonly id: string; readonly color: string; readonly speed: number; readonly path: readonly Vec[] }[];
  readonly labels?: readonly { readonly text: string; readonly point: Vec }[];
}

export const MAIN_SCENE: SceneDefinition = {
  id: 'main', name: '40 × 30 m proof',
  floors: [
    { id: 'main-floor', x: 0, z: 0, width: 40, depth: 30 },
    { id: 'island-floor', x: 27, z: 0, width: 5, depth: 5 },
  ],
  walls: [
    { id: 'l-upright', x: -3, z: 1, width: 1, depth: 10, height: 2.5 },
    { id: 'l-arm', x: 1, z: 6, width: 9, depth: 1, height: 2.5 },
    { id: 'thin-wall', x: -11, z: 0, width: 0.18, depth: 10, height: 2.5 },
    { id: 'room-back', x: 12, z: 12, width: 10, depth: 0.3, height: 4 },
    { id: 'room-left', x: 7, z: 7, width: 0.3, depth: 10, height: 4 },
    { id: 'room-right', x: 17, z: 7, width: 0.3, depth: 10, height: 4, cutaway: 'room' },
    { id: 'room-front-left', x: 9.125, z: 2, width: 4.25, depth: 0.3, height: 4, cutaway: 'room' },
    { id: 'room-front-right', x: 14.875, z: 2, width: 4.25, depth: 0.3, height: 4, cutaway: 'room' },
    { id: 'narrow-left', x: 8.8875, z: -10, width: 3.775, depth: 0.3, height: 2 },
    { id: 'narrow-right', x: 13.1125, z: -10, width: 3.775, depth: 0.3, height: 2 },
  ],
  roofs: [{ id: 'room-roof', x: 12, z: 7, width: 10, depth: 10, height: 4.1, cutaway: 'room' }],
  zones: [
    { id: 'hide', kind: 'hiding', x: -7, z: 4, width: 2.5, depth: 2.5 },
    { id: 'recycler', kind: 'recycler', x: 12, z: 10.5, width: 1, depth: 1 },
    { id: 'exit', kind: 'exit', x: 12, z: 0.5, width: 2, depth: 1.5 },
    { id: 'room-cutaway', kind: 'cutaway', x: 12, z: 6.5, width: 10.5, depth: 12, group: 'room' },
  ],
  items: [{ id: 'bottle', point: { x: 0, y: 0, z: 3 } }],
  playerStart: { x: -7, y: 0, z: -7 }, threatStart: { x: -7, y: 0, z: 9 },
  patrol: [{ x: -7, y: 0, z: 9 }, { x: 3, y: 0, z: 9 }, { x: 3, y: 0, z: -3 }, { x: -7, y: 0, z: -5 }],
  cameraBounds: { minX: -50, maxX: 50, minZ: -50, maxZ: 50 },
};

export const SECOND_SCENE: SceneDefinition = {
  id: 'small', name: '20 × 20 m alternate',
  floors: [{ id: 'small-floor', x: 0, z: 0, width: 20, depth: 20 }],
  walls: [{ id: 'small-obstacle', x: 0, z: 0, width: 1, depth: 8, height: 3, cutaway: 'small-cover' }],
  roofs: [{ id: 'small-roof', x: 5, z: 5, width: 4, depth: 4, height: 4, cutaway: 'small-cover' }],
  zones: [
    { id: 'small-hide', kind: 'hiding', x: -4, z: 4, width: 2, depth: 2 },
    { id: 'small-recycler', kind: 'recycler', x: 6, z: 6, width: 1, depth: 1 },
    { id: 'small-exit', kind: 'exit', x: 6, z: -6, width: 2, depth: 2 },
    { id: 'small-cutaway', kind: 'cutaway', x: 5, z: 5, width: 5, depth: 5, group: 'small-cover' },
  ],
  items: [{ id: 'small-bottle', point: { x: 4, y: 0, z: 0 } }],
  playerStart: { x: -6, y: 0, z: -6 }, threatStart: { x: -6, y: 0, z: 7 },
  patrol: [{ x: -6, y: 0, z: 7 }, { x: 6, y: 0, z: 7 }, { x: 6, y: 0, z: -3 }],
  cameraBounds: { minX: -50, maxX: 50, minZ: -50, maxZ: 50 },
};

export const SCENES = [MAIN_SCENE, SECOND_SCENE] as const;

/** Structural validation; reachability is checked against the built navmesh. */
export function validateDefinition(scene: SceneDefinition): void {
  const fail = (message: string): never => { throw new Error(`Scene ${scene.id}: ${message}`); };
  if (!scene.id?.trim() || !scene.name?.trim()) fail('id and name are required');
  const ids = new Set<string>();
  const finite = (value: number) => Number.isFinite(value);
  const point = (value: { x: number; z: number }, label: string) => {
    if (!finite(value.x) || !finite(value.z)) fail(`${label} has invalid coordinates`);
    if ('y' in value && (typeof value.y !== 'number' || !finite(value.y))) fail(`${label} has invalid height coordinate`);
  };
  for (const entry of [...scene.floors, ...scene.walls, ...scene.roofs, ...scene.zones, ...scene.items, ...(scene.details ?? [])]) {
    if (!entry.id.trim() || ids.has(entry.id)) fail(`invalid or duplicate id: ${entry.id}`);
    ids.add(entry.id);
    if ('point' in entry) point(entry.point, entry.id);
    else {
      point(entry, entry.id);
      if (!finite(entry.width) || !finite(entry.depth) || entry.width <= 0 || entry.depth <= 0) fail(`${entry.id} has invalid dimensions`);
      if ('height' in entry && (typeof entry.height !== 'number' || !finite(entry.height) || entry.height <= 0)) fail(`${entry.id} has invalid height`);
      if (entry.color !== undefined && !/^#[0-9a-f]{6}$/i.test(entry.color)) fail(`${entry.id} has invalid color`);
      if ('shape' in entry && entry.shape !== undefined && !['box', 'ellipse'].includes(entry.shape as string)) fail(`${entry.id} has invalid shape`);
      if ('elevation' in entry && !finite(entry.elevation as number)) fail(`${entry.id} has invalid elevation`);
    }
  }
  if (!scene.floors.length || !scene.patrol.length || !scene.items.length) fail('floor, patrol and item are required');
  point(scene.playerStart, 'player start'); point(scene.threatStart, 'threat start');
  scene.patrol.forEach((p, i) => point(p, `patrol ${i}`));
  const bounds = scene.cameraBounds;
  if (!Object.values(bounds).every(finite) || bounds.minX >= bounds.maxX || bounds.minZ >= bounds.maxZ) fail('invalid camera bounds');
  if (scene.mission && (!Number.isInteger(scene.mission.requiredBottles) || scene.mission.requiredBottles < 1 || scene.mission.requiredBottles > scene.items.length)) fail('invalid required bottle count');
  if (scene.camera) {
    point(scene.camera.target, 'camera target');
    if (!finite(scene.camera.span) || !finite(scene.camera.maxSpan) || scene.camera.span < 15 || scene.camera.maxSpan < scene.camera.span) fail('invalid camera span');
    if (scene.camera.alpha !== undefined && !finite(scene.camera.alpha)) fail('invalid camera heading');
  }
  scene.labels?.forEach(label => { point(label.point, 'label'); if (!label.text.trim()) fail('empty label'); });
  scene.ambient?.forEach(actor => {
    if (!actor.id.trim() || ids.has(actor.id)) fail('invalid or duplicate ambient id');
    ids.add(actor.id);
    if (!/^#[0-9a-f]{6}$/i.test(actor.color) || !finite(actor.speed) || actor.speed <= 0 || actor.speed > 2.5 || actor.path.length < 2) fail('invalid ambient actor');
    actor.path.forEach(p => point(p, actor.id));
  });
  for (const kind of ['recycler', 'exit', 'hiding'] as const) {
    if (!scene.zones.some(zone => zone.kind === kind)) fail(`missing ${kind} zone`);
  }
  const groups = new Set(scene.zones.filter(z => z.kind === 'cutaway').map(z => z.group));
  for (const zone of scene.zones) {
    if (!['hiding', 'recycler', 'exit', 'cutaway'].includes(zone.kind)) fail(`${zone.id} has invalid zone kind`);
    if (zone.kind === 'cutaway' && !zone.group?.trim()) fail(`${zone.id} needs a cutaway group`);
    if (zone.kind !== 'cutaway' && zone.group !== undefined) fail(`${zone.id} has an unexpected group reference`);
  }
  for (const mesh of [...scene.walls, ...scene.roofs]) {
    if (mesh.cutaway !== undefined && !groups.has(mesh.cutaway)) fail(`${mesh.id} references missing cutaway group ${mesh.cutaway}`);
    if (mesh.cutawayBaseHeight !== undefined && (!mesh.cutaway || !finite(mesh.cutawayBaseHeight) || mesh.cutawayBaseHeight <= 0 || mesh.cutawayBaseHeight > mesh.height)) fail(`${mesh.id} has invalid cutaway base`);
  }
  for (const group of groups) {
    if (![...scene.walls, ...scene.roofs].some(mesh => mesh.cutaway === group)) fail(`cutaway group ${group} has no render members`);
  }
}
