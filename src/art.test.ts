import { afterEach, expect, test } from 'vitest';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine';
import { Scene } from '@babylonjs/core/scene';
import { WorldArt } from './art';

const engine = new NullEngine();
let scene: Scene;
afterEach(() => scene.dispose());
test('character dressing cannot intercept commands and animation freezes on pause', () => {
  scene = new Scene(engine);
  const art = new WorldArt(scene, new Map());
  const player = art.character('player', 'player');
  expect(player.getChildMeshes().every(m => !m.isPickable)).toBe(true);
  art.animate(player, { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, .1, true);
  expect(player.rotation.y).toBeCloseTo(Math.PI / 2);
  expect(player.metadata.legs[0].rotation.x).not.toBe(0);
  art.animate(player, { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, .2, false);
  expect(player.metadata.legs[0].rotation.x).toBeCloseTo(0);
});
test('every bottle component keeps the same interaction target and hides with its pickup', () => {
  scene = new Scene(engine);
  const art = new WorldArt(scene, new Map());
  const bottle = art.bottle('pickup', { x: 2, y: 0, z: 3 });
  expect([bottle, ...bottle.getChildMeshes()].every(m => m.metadata.target === 'pickup')).toBe(true);
  bottle.setEnabled(false);
  expect(bottle.getChildMeshes().every(m => !m.isEnabled())).toBe(true);
});
test('the eight stable pickup IDs reuse exactly three shapes without moving targets',()=>{
  scene=new Scene(engine);const art=new WorldArt(scene,new Map());
  const ids=['arrival-bottle','pavilion-back-bottle','pavilion-shortcut-bottle','fountain-bottle','crossing-bottle','east-walk-bottle','garden-corner-bottle','south-walk-bottle'];
  const variants=new Set();
  for(const id of ids){
    const mesh=art.bottle(id,{x:2,y:0,z:3});variants.add(mesh.metadata.variant);
    expect(mesh.position.x).toBe(2);expect(mesh.position.z).toBe(3);
    expect([mesh,...mesh.getChildMeshes()].every(m=>m.metadata.target===id)).toBe(true);
  }
  expect(variants.size).toBe(3);
});
