import { describe, expect, it } from 'vitest';
import { InteractionSystem, PlayerController, RunState, ThreatController, type Navigation, type Vec } from './gameplay';

const point = (x = 0, z = 0): Vec => ({ x, y: 0, z });
// Unit tests isolate controller policy; actual collision/path integration uses bundled Recast.
const freeNavigation = (): Navigation => ({
  spawn: position => ({ position: { ...position }, ref: 1 }),
  path: (_agent, target) => [{ ...target }],
  move: (agent, delta) => { agent.position = { x: agent.position.x + delta.x, y: 0, z: agent.position.z + delta.z }; return true; },
});
const steps = (count: number, callback: (dt: number) => void) => { for (let i = 0; i < count; i++) callback(1 / 60); };

describe('run invariants', () => {
  it('collects IDs and recycles only once, prevents early exit and gives damage priority', () => {
    const run = new RunState(['bottle', 'other']);
    expect(run.exit()).toBe(false);
    expect(run.recycle()).toBe(false);
    expect(run.collect('bottle')).toBe(true);
    expect(run.collect('bottle')).toBe(false);
    expect(run.recycle()).toBe(true);
    expect(run.bagCount).toBe(0);
    expect(run.recycledCount).toBe(1);
    expect(run.recycle()).toBe(false);
    expect(run.collect('other')).toBe(false);
    run.damage(100);
    expect(run.exit()).toBe(false);
    expect(run.phase).toBe('failure');
    const oldTime = run.activeTime;
    run.tick(10);
    expect(run.activeTime).toBe(oldTime);
  });
  it('allows alive exit and resets all run data with a new run', () => {
    const run = new RunState(['bottle']);
    run.collect('bottle'); run.recycle(); expect(run.exit()).toBe(true);
    const replay = new RunState(['bottle']);
    expect([replay.phase, replay.health, replay.stamina, replay.activeTime, replay.bagCount, replay.recycledCount])
      .toEqual(['collecting', 100, 100, 0, 0, 0]);
  });
  it('shares one contact cooldown and clamps health', () => {
    const run = new RunState([]);
    for (let second = 0; second < 5; second++) {
      expect(run.damage()).toBe(true);
      expect(run.damage()).toBe(false);
      steps(59, dt => run.tick(dt));
      expect(run.damage()).toBe(false);
      run.tick(1 / 60);
    }
    expect(run.health).toBe(0);
  });
});

describe('player commands and stamina', () => {
  it('normalizes diagonals and immediately cancels pending click commands', () => {
    const run = new RunState([]), player = new PlayerController(freeNavigation(), point(), run);
    for (let repetition = 0; repetition < 20; repetition++) {
      player.command(point(100, 100), 'bottle');
      player.setInput({ x: 1, z: 1, sprint: false });
      expect(player.hasCommand).toBe(false);
      expect(player.command(point(50))).toBe(false);
      player.step(1 / 60);
      const stoppedAt = { ...player.position };
      player.setInput({ x: 0, z: 0, sprint: false }); player.step(1 / 60);
      expect(player.position).toEqual(stoppedAt);
    }
    expect(Math.hypot(player.position.x, player.position.z)).toBeCloseTo(2.5 * 20 / 60);
    expect(player.command(point(50))).toBe(true);
    player.clearInput(); expect(player.hasCommand).toBe(false);
  });
  it('blocks on path query failure and replaces earlier commands', () => {
    const nav = freeNavigation(), player = new PlayerController(nav, point(), new RunState([]));
    player.command(point(5), 'item');
    nav.path = () => { throw new Error('Disconnected'); };
    expect(player.command(point(10))).toBe(false);
    expect(player.hasCommand).toBe(false);
    player.step(1 / 60); expect(player.position).toEqual(point());
  });
  it('exhausts after four seconds and requires release before recovered sprint', () => {
    const run = new RunState([]), player = new PlayerController(freeNavigation(), point(), run);
    player.setInput({ x: 1, z: 0, sprint: true });
    steps(240, dt => player.step(dt));
    expect(run.stamina).toBe(0); expect(player.position.x).toBeCloseTo(18);
    steps(60, dt => player.step(dt)); expect(run.stamina).toBeCloseTo(0);
    steps(60, dt => player.step(dt)); expect(run.stamina).toBeCloseTo(20);
    expect(player.sprinting).toBe(false);
    player.setInput({ x: 1, z: 0, sprint: false }); player.step(1 / 60);
    player.setInput({ x: 1, z: 0, sprint: true }); player.step(1 / 60);
    expect(player.sprinting).toBe(true);
  });
  it.each(['release', 'clear'] as const)('rearms exhausted sprint on %s between simulation steps', release => {
    const run = new RunState([]), player = new PlayerController(freeNavigation(), point(), run);
    player.setInput({ x: 1, z: 0, sprint: true });
    steps(360, dt => player.step(dt));
    expect(run.stamina).toBeCloseTo(20);
    expect(player.sprinting).toBe(false);
    const time = run.activeTime, stamina = run.stamina;
    if (release === 'clear') player.clearInput();
    else player.setInput({ x: 1, z: 0, sprint: false });
    player.setInput({ x: 1, z: 0, sprint: true });
    expect(run.stamina).toBe(stamina);
    expect(run.activeTime).toBe(time);
    const before = { ...player.position };
    player.step(1 / 60);
    expect(player.sprinting).toBe(true);
    expect(player.position.x - before.x).toBeCloseTo(4.5 / 60);
    expect(run.stamina).toBeCloseTo(stamina - 25 / 60);
  });
});

describe('interactions', () => {
  it('rejects distance/blocked segments and repeated transfer', () => {
    const run = new RunState(['bottle']);
    let clear = false;
    const interactions = new InteractionSystem(run, [
      { id: 'bottle', kind: 'item', point: point() }, { id: 'recycler', kind: 'recycler', point: point(3) },
    ], () => clear);
    expect(interactions.interact('bottle', point())).toBe(false);
    clear = true;
    expect(interactions.interact('bottle', point(2))).toBe(false);
    expect(interactions.nearest(point())?.id).toBe('bottle');
    expect(interactions.interact('bottle', point())).toBe(true);
    expect(interactions.interact('bottle', point())).toBe(false);
    expect(interactions.interact('recycler', point(3))).toBe(true);
    expect(interactions.interact('recycler', point(3))).toBe(false);
    expect(run.recycledCount).toBe(1);
  });
});

describe('threat perception and contact', () => {
  it('ignores players behind its cone and outside eight metres', () => {
    const nav = freeNavigation(); nav.move = () => false;
    const threat = new ThreatController(nav, point(), [point(0, 20)], new RunState([]));
    for (const player of [point(0, -4), point(5, 0), point(0, 8.1)]) {
      steps(120, dt => threat.step(dt, player, false, () => true));
      expect(threat.state).toBe('patrol'); expect(threat.suspicion).toBe(0);
    }
    steps(60, dt => threat.step(dt, point(0, 8), false, () => true));
    expect(threat.state).toBe('chase');
  });
  it('requires range, cone, clear LOS and one continuous second', () => {
    const run = new RunState([]), threat = new ThreatController(freeNavigation(), point(), [point(0, 20)], run);
    steps(30, dt => threat.step(dt, point(0, 6), false, () => true));
    expect(threat.state).toBe('suspicious');
    steps(6, dt => threat.step(dt, point(0, 6), false, () => false));
    steps(36, dt => threat.step(dt, point(0, 6), false, () => true));
    expect(threat.state).toBe('suspicious');
    steps(24, dt => threat.step(dt, point(0, 6), false, () => true));
    expect(threat.state).toBe('chase');
    const lastSeen = { ...threat.lastSeen! };
    steps(6, dt => threat.step(dt, point(15, 15), false, () => false));
    expect(threat.state).toBe('search'); expect(threat.lastSeen).toEqual(lastSeen);
    steps(600, dt => threat.step(dt, point(15, 15), false, () => false));
    expect(['return', 'patrol']).toContain(threat.state);
  });
  it('conceals unseen hiding but preserves observed entry search', () => {
    const run = new RunState([]), threat = new ThreatController(freeNavigation(), point(), [point(0, 20)], run);
    steps(60, dt => threat.step(dt, point(0, 4), true, () => true));
    expect(threat.lastSeen).toBe(null);
    steps(12, dt => threat.step(dt, point(0, 4), false, () => true));
    steps(6, dt => threat.step(dt, point(0, 4), true, () => true));
    expect(threat.state).toBe('search'); expect(threat.lastSeen).toEqual(point(0, 4));
  });
  it('never damages through walls and obeys cooldown during continuous contact', () => {
    const nav = freeNavigation(); nav.move = () => false;
    const run = new RunState([]), threat = new ThreatController(nav, point(), [point(0, 20)], run);
    steps(120, dt => { run.tick(dt); threat.step(dt, point(0.5), false, () => false); });
    expect(run.health).toBe(100);
    steps(120, dt => { run.tick(dt); threat.step(dt, point(0.5), false, () => true); });
    expect(run.health).toBe(60);
  });
});
