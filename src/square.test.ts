import { describe, expect, it } from 'vitest';
import { validateDefinition } from './definition';
import { SQUARE_SCENE } from './square';
import { RunState, InteractionSystem } from './gameplay';

describe('square mission contract', () => {
  it('validates the authored map and rejects impossible quotas and invalid shapes', () => {
    expect(() => validateDefinition(SQUARE_SCENE)).not.toThrow();
    expect(() => validateDefinition({ ...SQUARE_SCENE, mission: { ...SQUARE_SCENE.mission!, requiredBottles: 9 } })).toThrow(/bottle count/);
    expect(() => validateDefinition({ ...SQUARE_SCENE, walls: [{ ...SQUARE_SCENE.walls[0], shape: 'triangle' as 'box' }] })).toThrow(/shape/);
  });
  it('blocks an under-quota final trip, then transfers once and gates exit', () => {
    const run = new RunState(SQUARE_SCENE.items.map(i => i.id), 5);
    const p = { x: 0, y: 0, z: 0 };
    const interactions = new InteractionSystem(run, [{ id: 'recycler', kind: 'recycler', point: p }], () => true);
    expect(run.exit()).toBe(false);
    for (const item of SQUARE_SCENE.items.slice(0, 4)) run.collect(item.id);
    expect(interactions.interact('recycler', p)).toBe(false);
    expect(run.recycle()).toBe(false);
    expect(run.bagCount).toBe(4);
    run.collect(SQUARE_SCENE.items[4].id);
    expect(interactions.interact('recycler', p)).toBe(true);
    expect(run.bagCount).toBe(0);
    expect(run.recycledCount).toBe(5);
    expect(run.collect(SQUARE_SCENE.items[5].id)).toBe(false);
    expect(run.recycle()).toBe(false);
    expect(run.exit()).toBe(true);
  });
});
