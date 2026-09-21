import { describe, expect, it } from 'vitest';
import { MAIN_SCENE, SCENES, validateDefinition } from './definition';
import { InputAdapter, type InputAction } from './input';

describe('scene definitions', () => {
  it('accepts both independent fixtures', () => { for (const scene of SCENES) expect(() => validateDefinition(scene)).not.toThrow(); });
  it('rejects globally duplicate ids', () => {
    expect(() => validateDefinition({ ...MAIN_SCENE, items: [{ id: MAIN_SCENE.walls[0].id, point: { x: 0, y: 0, z: 0 } }] })).toThrow(/duplicate id/);
  });
  it('rejects broken render group references', () => {
    expect(() => validateDefinition({ ...MAIN_SCENE, roofs: [{ ...MAIN_SCENE.roofs[0], cutaway: 'missing' }] })).toThrow(/missing cutaway group/);
  });
  it('rejects nonfinite spawns and degenerate footprints', () => {
    expect(() => validateDefinition({ ...MAIN_SCENE, playerStart: { x: NaN, y: 0, z: 0 } })).toThrow(/player start/);
    expect(() => validateDefinition({ ...MAIN_SCENE, floors: [{ ...MAIN_SCENE.floors[0], width: 0 }] })).toThrow(/dimensions/);
  });
});

// Minimal event surface verifies adapter ownership and arbitration without a browser substitute.
function inputFixture() {
  const window = new EventTarget();
  const document = Object.assign(new EventTarget(), { defaultView: window, hidden: false });
  const canvas = Object.assign(new EventTarget(), { ownerDocument: document, hasPointerCapture: () => false });
  const actions: InputAction[] = [];
  const input = new InputAdapter(canvas as unknown as HTMLElement, action => actions.push(action));
  const fire = (target: EventTarget, type: string, fields: Record<string, unknown> = {}) => {
    target.dispatchEvent(Object.assign(new Event(type, { cancelable: true }), fields));
  };
  return { window, document, canvas, actions, input, fire };
}

describe('input adapter', () => {
  it('normalizes diagonals, ignores held-key world clicks, and stops on release', () => {
    const f = inputFixture();
    f.fire(f.window, 'keydown', { code: 'KeyW' });
    f.fire(f.window, 'keydown', { code: 'KeyD' });
    expect(f.actions.at(-1)).toEqual({ type: 'move', x: 1 / Math.sqrt(2), z: 1 / Math.sqrt(2), sprint: false });
    f.fire(f.canvas, 'click', { button: 0, clientX: 50, clientY: 60 });
    expect(f.actions.some(a => a.type === 'click')).toBe(false);
    f.fire(f.window, 'keyup', { code: 'KeyW' }); f.fire(f.window, 'keyup', { code: 'KeyD' });
    expect(f.actions.at(-1)).toEqual({ type: 'move', x: 0, z: 0, sprint: false });
    f.fire(f.canvas, 'click', { button: 0, clientX: 50, clientY: 60 });
    expect(f.actions.at(-1)).toEqual({ type: 'click', clientX: 50, clientY: 60 });
    f.input.dispose();
  });
  it('interacts once per press and requires fresh commands after blur', () => {
    const f = inputFixture();
    f.fire(f.window, 'keydown', { code: 'KeyE' }); f.fire(f.window, 'keydown', { code: 'KeyE', repeat: true });
    expect(f.actions.filter(a => a.type === 'interact')).toHaveLength(1);
    f.fire(f.window, 'keydown', { code: 'KeyW' });
    f.fire(f.window, 'blur');
    expect(f.actions.slice(-2)).toEqual([{ type: 'move', x: 0, z: 0, sprint: false }, { type: 'blur' }]);
    f.fire(f.window, 'keydown', { code: 'KeyW', repeat: true });
    expect(f.actions.at(-1)).toEqual({ type: 'blur' });
    f.input.dispose();
    const count = f.actions.length;
    f.fire(f.window, 'keydown', { code: 'KeyE' });
    expect(f.actions).toHaveLength(count);
  });
});
