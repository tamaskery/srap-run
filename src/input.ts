export type InputAction =
  | { type: 'move'; x: number; z: number; sprint: boolean }
  | { type: 'click'; clientX: number; clientY: number }
  | { type: 'interact' | 'cancel' | 'recenter' | 'blur' }
  | { type: 'pan'; dx: number; dy: number }
  | { type: 'zoom'; delta: number };

const movement = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight']);
const sprint = new Set(['ShiftLeft', 'ShiftRight']);
const commands: Record<string, 'interact' | 'cancel' | 'recenter'> = { KeyE: 'interact', Escape: 'cancel', Home: 'recenter' };

/** Device events end here. Gameplay receives only normalized axes and semantic actions. */
export class InputAdapter {
  static activeAdapters = 0;
  private disposed = false;
  private readonly lifetime = new AbortController();
  private readonly held = new Set<string>();
  private drag: { id: number; x: number; y: number } | undefined;

  constructor(private readonly canvas: HTMLElement, private readonly emit: (action: InputAction) => void) {
    InputAdapter.activeAdapters++;
    const document = canvas.ownerDocument;
    const window = document.defaultView!;
    const options = { signal: this.lifetime.signal };
    window.addEventListener('keydown', event => {
      if (this.isUI(event.target)) return;
      if (!movement.has(event.code) && !sprint.has(event.code) && !commands[event.code]) return;
      event.preventDefault();
      if (event.repeat || this.held.has(event.code)) return;
      this.held.add(event.code);
      if (commands[event.code]) this.emit({ type: commands[event.code] });
      else this.emitMovement();
    }, options);
    window.addEventListener('keyup', event => {
      if (!this.held.delete(event.code)) return;
      event.preventDefault();
      if (movement.has(event.code) || sprint.has(event.code)) this.emitMovement();
    }, options);
    window.addEventListener('blur', () => this.loseFocus(), options);
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.loseFocus(); }, options);
    canvas.addEventListener('click', event => {
      if (event.button !== 0 || this.isUI(event.target) || [...this.held].some(key => movement.has(key))) return;
      this.emit({ type: 'click', clientX: event.clientX, clientY: event.clientY });
    }, options);
    canvas.addEventListener('pointerdown', event => {
      if (event.button !== 1 || this.isUI(event.target)) return;
      event.preventDefault();
      this.drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
      canvas.setPointerCapture(event.pointerId);
    }, options);
    canvas.addEventListener('pointermove', event => {
      if (!this.drag || this.drag.id !== event.pointerId) return;
      this.emit({ type: 'pan', dx: event.clientX - this.drag.x, dy: event.clientY - this.drag.y });
      this.drag.x = event.clientX; this.drag.y = event.clientY;
    }, options);
    canvas.addEventListener('pointerup', event => { if (event.pointerId === this.drag?.id) this.endDrag(); }, options);
    canvas.addEventListener('pointercancel', () => this.endDrag(), options);
    canvas.addEventListener('lostpointercapture', () => { this.drag = undefined; }, options);
    canvas.addEventListener('wheel', event => {
      if (this.isUI(event.target)) return;
      event.preventDefault();
      this.emit({ type: 'zoom', delta: event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? canvas.clientHeight : 1) });
    }, { ...options, passive: false });
    canvas.addEventListener('auxclick', event => { if (event.button === 1) event.preventDefault(); }, options);
  }

  clear(): void {
    this.held.clear();
    this.endDrag();
    this.emitMovement();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    InputAdapter.activeAdapters--;
    this.clear();
    this.lifetime.abort();
  }

  private loseFocus(): void { this.clear(); this.emit({ type: 'blur' }); }

  private endDrag(): void {
    const id = this.drag?.id;
    this.drag = undefined;
    if (id !== undefined && this.canvas.hasPointerCapture(id)) this.canvas.releasePointerCapture(id);
  }

  private isUI(target: EventTarget | null): boolean {
    // Avoid cross-window instanceof checks; listeners are scoped to the canvas's document.
    return !!(target as Element | null)?.closest?.('button, input, select, textarea, a, [contenteditable="true"], [data-ui]');
  }

  private emitMovement(): void {
    const down = (...keys: string[]) => keys.some(key => this.held.has(key)) ? 1 : 0;
    const x = down('KeyD', 'ArrowRight') - down('KeyA', 'ArrowLeft');
    const z = down('KeyW', 'ArrowUp') - down('KeyS', 'ArrowDown');
    const length = Math.hypot(x, z) || 1;
    this.emit({ type: 'move', x: x / length, z: z / length, sprint: down('ShiftLeft', 'ShiftRight') === 1 });
  }
}
