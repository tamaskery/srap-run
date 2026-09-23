export interface Vec { x: number; y: number; z: number }
export interface NavAgent { position: Vec; ref: number }
export interface Navigation {
  spawn(point: Vec): NavAgent;
  path(agent: NavAgent, target: Vec): Vec[];
  move(agent: NavAgent, delta: Vec): boolean;
}
export type LineOfSight = (from: Vec, to: Vec) => boolean;
export const distance = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.z - b.z);
const copy = (v: Vec): Vec => ({ ...v });
export type Phase = 'collecting' | 'exiting' | 'success' | 'failure';

export class RunState {
  phase: Phase = 'collecting';
  health = 100;
  stamina = 100;
  activeTime = 0;
  bagCount = 0;
  recycledCount = 0;
  readonly items: Map<string, 'available' | 'carried' | 'recycled'>;
  private damageCooldown = 0;
  private recoveryDelay = 0;
  private exhausted = false;
  constructor(itemIds: readonly string[], readonly requiredBottles = 1) {
    if (new Set(itemIds).size !== itemIds.length) throw new Error('Duplicate collectible ID');
    if (!Number.isInteger(requiredBottles) || requiredBottles < 1) throw new Error('Invalid required bottle count');
    this.items = new Map(itemIds.map(id => [id, 'available']));
  }
  get active() { return this.phase === 'collecting' || this.phase === 'exiting'; }
  tick(dt: number) {
    if (!this.active) return;
    this.activeTime += dt;
    this.damageCooldown = Math.max(0, this.damageCooldown - dt);
  }
  /** Called once per simulation step by the player motor. */
  sprint(dt: number, requested: boolean, moving: boolean): boolean {
    if (!requested) this.releaseSprint();
    const sprinting = requested && moving && !this.exhausted && this.stamina > 0;
    if (sprinting) {
      this.stamina = Math.max(0, this.stamina - 25 * dt);
      this.recoveryDelay = 1;
      if (this.stamina < 1e-8) { this.stamina = 0; this.exhausted = true; }
    } else {
      const recoverTime = Math.max(0, dt - this.recoveryDelay);
      this.recoveryDelay = Math.max(0, this.recoveryDelay - dt);
      this.stamina = Math.min(100, this.stamina + 20 * recoverTime);
    }
    return sprinting;
  }
  /** Preserve release edges even when release/repress happens between simulation steps. */
  releaseSprint() { this.exhausted = false; }
  damage(amount = 20): boolean {
    if (!this.active || this.damageCooldown > 1e-8) return false;
    this.health = Math.max(0, this.health - Math.max(0, amount));
    this.damageCooldown = 1;
    if (this.health === 0) this.phase = 'failure';
    return true;
  }
  collect(id: string): boolean {
    if (this.phase !== 'collecting' || this.items.get(id) !== 'available') return false;
    this.items.set(id, 'carried'); this.bagCount++; return true;
  }
  recycle(): boolean {
    if (this.phase !== 'collecting' || this.bagCount < this.requiredBottles) return false;
    this.recycledCount += this.bagCount; this.bagCount = 0;
    for (const [id, state] of this.items) if (state === 'carried') this.items.set(id, 'recycled');
    this.phase = 'exiting'; return true;
  }
  /** Resolve after damage in the current tick, so death takes priority. */
  exit(): boolean {
    if (this.phase !== 'exiting' || this.health <= 0) return false;
    this.phase = 'success'; return true;
  }
}

function follow(nav: Navigation, agent: NavAgent, path: Vec[], step: number): boolean {
  let remaining = step;
  let moved = false;
  while (path.length && remaining > 1e-8) {
    const target = path[0];
    const length = distance(agent.position, target);
    if (length < 0.0001) { path.shift(); continue; }
    const amount = Math.min(length, remaining);
    const before = copy(agent.position);
    if (!nav.move(agent, { x: (target.x - before.x) / length * amount, y: 0, z: (target.z - before.z) / length * amount })) break;
    const actual = distance(before, agent.position);
    moved ||= actual > 1e-6;
    remaining -= amount;
    if (distance(agent.position, target) < 0.0001) path.shift();
    if (actual < 1e-6) break;
  }
  return moved;
}

/** Authored civilian loop. No perception or mission effects. */
export class AmbientWalker {
  readonly agent: NavAgent;
  private leg = 0;
  private path: Vec[] = [];
  private waiting = 1.5;
  constructor(private nav: Navigation, private points: readonly Vec[], private speed: number) {
    this.agent = nav.spawn(points[0]);
    points.forEach((p, i) => nav.path(nav.spawn(p), points[(i + 1) % points.length]));
  }
  get position() { return this.agent.position; }
  step(dt: number) {
    if (this.waiting > 0) { this.waiting = Math.max(0, this.waiting - dt); return; }
    if (!this.path.length) {
      this.leg = (this.leg + 1) % this.points.length;
      this.path = this.nav.path(this.agent, this.points[this.leg]).map(copy);
    }
    follow(this.nav, this.agent, this.path, this.speed * dt);
    if (!this.path.length) this.waiting = .8 + ((this.leg * 7 + Math.abs(this.points[0].x)) % 4) * .25;
  }
}

export interface MovementIntent { x: number; z: number; sprint: boolean }
export class PlayerController {
  readonly agent: NavAgent;
  path: Vec[] = [];
  pendingInteraction: string | null = null;
  moving = false;
  sprinting = false;
  private input: MovementIntent = { x: 0, z: 0, sprint: false };
  constructor(private nav: Navigation, start: Vec, private run: RunState) { this.agent = nav.spawn(start); }
  get position() { return this.agent.position; }
  get hasCommand() { return this.path.length > 0 || this.pendingInteraction !== null; }
  setInput(intent: MovementIntent) {
    if (!intent.sprint) this.run.releaseSprint();
    this.input = { ...intent };
    if (intent.x || intent.z) this.cancel();
  }
  command(target: Vec, interactionId?: string): boolean {
    if (!this.run.active || this.input.x || this.input.z) return false;
    this.cancel();
    try { this.path = this.nav.path(this.agent, target).map(copy); }
    catch { return false; }
    this.pendingInteraction = interactionId ?? null;
    return true;
  }
  cancel() { this.path = []; this.pendingInteraction = null; }
  clearInput() { this.run.releaseSprint(); this.input = { x: 0, z: 0, sprint: false }; this.cancel(); this.moving = this.sprinting = false; }
  step(dt: number) {
    if (!this.run.active) { this.clearInput(); return; }
    const magnitude = Math.hypot(this.input.x, this.input.z);
    const wantsMovement = magnitude > 0 || this.path.length > 0;
    this.sprinting = this.run.sprint(dt, this.input.sprint, wantsMovement);
    const amount = (this.sprinting ? 4.5 : 2.5) * dt;
    if (magnitude) {
      const before = copy(this.position);
      this.nav.move(this.agent, { x: this.input.x / magnitude * amount, y: 0, z: this.input.z / magnitude * amount });
      this.moving = distance(before, this.position) > 1e-6;
    } else this.moving = follow(this.nav, this.agent, this.path, amount);
    if (!this.moving) this.sprinting = false;
  }
}

export interface InteractionTarget { id: string; kind: 'item' | 'recycler'; point: Vec }
export class InteractionSystem {
  constructor(private run: RunState, readonly targets: readonly InteractionTarget[], private los: LineOfSight) {}
  valid(target: InteractionTarget, position: Vec) {
    return this.run.phase === 'collecting' && distance(position, target.point) <= 1.2 && this.los(position, target.point)
      && (target.kind === 'item' ? this.run.items.get(target.id) === 'available' : this.run.bagCount >= this.run.requiredBottles);
  }
  nearest(position: Vec): InteractionTarget | undefined {
    return this.targets.filter(target => this.valid(target, position)).sort((a, b) => distance(position, a.point) - distance(position, b.point))[0];
  }
  interact(id: string, position: Vec): boolean {
    const target = this.targets.find(value => value.id === id);
    return !!target && this.valid(target, position) && (target.kind === 'item' ? this.run.collect(id) : this.run.recycle());
  }
}

export type ThreatState = 'patrol' | 'suspicious' | 'chase' | 'search' | 'return';
export class ThreatController {
  readonly agent: NavAgent;
  facing: Vec = { x: 0, y: 0, z: 1 };
  state: ThreatState = 'patrol';
  suspicion = 0;
  lastSeen: Vec | null = null;
  visible = false;
  private path: Vec[] = [];
  private patrolIndex = 0;
  private perceptionTimer = 0;
  private repathTimer = 0;
  private searchTime = 0;
  private continuousExposure = 0;
  constructor(private nav: Navigation, start: Vec, private patrol: readonly Vec[], private run: RunState) {
    if (!patrol.length) throw new Error('Threat needs a patrol route');
    this.agent = nav.spawn(start);
    const delta = { x: patrol[0].x - start.x, y: 0, z: patrol[0].z - start.z };
    const length = Math.hypot(delta.x, delta.z);
    if (length > 0) this.facing = { x: delta.x / length, y: 0, z: delta.z / length };
  }
  get position() { return this.agent.position; }
  private perceive(player: Vec, hidden: boolean, los: LineOfSight) {
    const range = distance(this.position, player);
    const dot = range < 1e-8 ? 1 : ((player.x - this.position.x) * this.facing.x + (player.z - this.position.z) * this.facing.z) / range;
    const wasVisible = this.visible;
    this.visible = !hidden && range <= 8 && dot >= Math.SQRT1_2 - 1e-8 && los(this.position, player);
    if (this.visible) {
      this.continuousExposure += 0.1;
      this.lastSeen = copy(player);
      this.suspicion = Math.min(1, this.suspicion + 0.1);
      if (this.state === 'search' || this.state === 'return' || this.continuousExposure >= 1 - 1e-8) this.state = 'chase';
      else if (this.state === 'patrol') this.state = 'suspicious';
      this.searchTime = 0;
    } else {
      this.continuousExposure = 0;
      this.suspicion = Math.max(0, this.suspicion - 0.1);
      if (this.state === 'chase' || (hidden && wasVisible)) { this.state = 'search'; this.searchTime = 0; this.path = []; }
      else if (this.state === 'suspicious' && this.suspicion <= 1e-8) this.state = 'patrol';
    }
  }
  step(dt: number, player: Vec, hidden: boolean, los: LineOfSight) {
    if (!this.run.active) return;
    this.perceptionTimer += dt;
    this.repathTimer = Math.max(0, this.repathTimer - dt);
    if (this.perceptionTimer >= 0.1 - 1e-8) { this.perceptionTimer -= 0.1; this.perceive(player, hidden, los); }
    if (distance(this.position, player) <= 0.7 && los(this.position, player)) this.run.damage(20);
    if (this.state === 'suspicious') return;
    let target = this.state === 'chase' || this.state === 'search' ? this.lastSeen : this.patrol[this.patrolIndex];
    if (!target) return;
    if (this.state === 'search' && distance(this.position, target) <= 0.2) {
      this.searchTime += dt;
      if (this.searchTime >= 3) { this.state = 'return'; this.path = []; this.suspicion = 0; }
      return;
    }
    if ((this.state === 'patrol' || this.state === 'return') && distance(this.position, target) <= 0.2) {
      this.state = 'patrol'; this.patrolIndex = (this.patrolIndex + 1) % this.patrol.length;
      target = this.patrol[this.patrolIndex]; this.path = [];
    }
    if (this.repathTimer <= 1e-8) {
      this.repathTimer = 0.25;
      try { this.path = this.nav.path(this.agent, target); } catch { this.path = []; }
    }
    const before = copy(this.position);
    follow(this.nav, this.agent, this.path, (this.state === 'chase' ? 3.4 : 1.8) * dt);
    const moved = distance(before, this.position);
    if (moved > 1e-6) this.facing = { x: (this.position.x - before.x) / moved, y: 0, z: (this.position.z - before.z) / moved };
  }
}
