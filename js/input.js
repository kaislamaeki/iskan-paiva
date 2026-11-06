// Keyboard, mouse and touch input, reduced to two actions: up and down.
// Edge flags (up, downPressed, confirm, tap) are cleared every frame by endFrame().
//
// Touch: the top half of the screen is UP (jump / rise / leap), the bottom half
// is DOWN (duck / dive, for as long as the finger stays down). Both react the
// moment the finger lands. Swiping up/down also works. Several fingers at once
// are fine (e.g. hold the bottom half and tap the top half).
const Input = {
  up: false,          // up was pressed this frame
  upHeld: false,
  downPressed: false, // down was pressed this frame
  confirm: false,     // space / enter / click / tap this frame (menus)
  tap: null,          // {x, y} in canvas coords for a click/tap this frame
  keys: {},           // other keys pressed this frame (e.g. 'KeyD')
  isTouch: false,

  _keyUp: false,
  _downKey: false,
  _downPulse: 0,
  _touchDownHeld: false,
  _pointers: new Map(), // pointerId -> { zone: 'up' | 'down' | 'mouse', sy }
  _canvas: null,

  get down() {
    return this._downKey || this._downPulse > 0 || this._touchDownHeld;
  },

  init(canvas) {
    this._canvas = canvas;

    window.addEventListener('keydown', (e) => {
      const c = e.code;
      if (c === 'Space' || c === 'ArrowUp' || c === 'KeyW') {
        if (!e.repeat) { this.up = true; this.confirm = true; }
        this._keyUp = true;
        this._refresh();
        e.preventDefault();
      } else if (c === 'ArrowDown' || c === 'KeyS') {
        if (!e.repeat) this.downPressed = true;
        this._downKey = true;
        e.preventDefault();
      } else if (c === 'Enter') {
        if (!e.repeat) this.confirm = true;
      } else if (!e.repeat) {
        this.keys[c] = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      const c = e.code;
      if (c === 'Space' || c === 'ArrowUp' || c === 'KeyW') { this._keyUp = false; this._refresh(); }
      if (c === 'ArrowDown' || c === 'KeyS') this._downKey = false;
    });

    window.addEventListener('blur', () => {
      this._keyUp = false; this._downKey = false;
      this._pointers.clear();
      this._refresh();
    });

    // listen on the whole screen (incl. the dark bars around the game on phones)
    const area = document.getElementById('wrap') || canvas;
    area.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const p = this._toCanvas(e);
      if (e.pointerType === 'mouse') {
        if (e.button !== 0) return;
        this.up = true; this.confirm = true; this.tap = p;
        this._pointers.set(e.pointerId, { zone: 'mouse' });
      } else {
        this.isTouch = true;
        this.confirm = true; this.tap = p;
        try { area.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        if (p.y < CONFIG.HEIGHT * CONFIG.TOUCH.split) {
          this.up = true;
          this._pointers.set(e.pointerId, { zone: 'up', sy: e.clientY });
        } else {
          this.downPressed = true;
          this._downPulse = CONFIG.TOUCH.downMin;
          this._pointers.set(e.pointerId, { zone: 'down', sy: e.clientY });
        }
      }
      this._refresh();
    });

    // swipes: a finger that moves up/down far enough switches to that action
    area.addEventListener('pointermove', (e) => {
      const ptr = this._pointers.get(e.pointerId);
      if (!ptr || ptr.zone === 'mouse') return;
      const dy = e.clientY - ptr.sy;
      if (ptr.zone === 'down' && dy < -CONFIG.TOUCH.swipe) {
        ptr.zone = 'up'; ptr.sy = e.clientY;
        this.up = true; this._downPulse = 0;
      } else if (ptr.zone === 'up' && dy > CONFIG.TOUCH.swipe) {
        ptr.zone = 'down'; ptr.sy = e.clientY;
        this.downPressed = true; this._downPulse = CONFIG.TOUCH.downMin;
      }
      this._refresh();
    });

    const end = (e) => {
      const ptr = this._pointers.get(e.pointerId);
      if (!ptr) return;
      this._pointers.delete(e.pointerId);
      this._refresh();
      if (ptr.zone !== 'mouse') this._goFullscreen();
    };
    area.addEventListener('pointerup', end);
    area.addEventListener('pointercancel', end);
    area.addEventListener('contextmenu', (e) => e.preventDefault());
  },

  // held states from all fingers / the mouse / the keyboard
  _refresh() {
    let up = this._keyUp, down = false;
    for (const p of this._pointers.values()) {
      if (p.zone === 'up' || p.zone === 'mouse') up = true;
      if (p.zone === 'down') down = true;
    }
    this.upHeld = up;
    this._touchDownHeld = down;
  },

  // On phones: go fullscreen and lock landscape after the first touch, where the
  // browser allows it (Android Chrome does; iPhone Safari ignores it).
  _goFullscreen() {
    if (this._triedFullscreen) return;
    this._triedFullscreen = true;
    const el = document.documentElement;
    if (!el.requestFullscreen || document.fullscreenElement) return;
    el.requestFullscreen({ navigationUI: 'hide' })
      .then(() => {
        if (screen.orientation && screen.orientation.lock) return screen.orientation.lock('landscape');
      })
      .catch(() => {});
  },

  _toCanvas(e) {
    const r = this._canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * CONFIG.WIDTH / r.width,
      y: (e.clientY - r.top) * CONFIG.HEIGHT / r.height,
    };
  },

  update(dt) {
    if (this._downPulse > 0) this._downPulse -= dt;
  },

  endFrame() {
    this.up = false;
    this.downPressed = false;
    this.confirm = false;
    this.tap = null;
    this.keys = {};
  },

  // Clear everything (used when switching states so a press does not leak through)
  reset() {
    this.endFrame();
    this._downPulse = 0;
  },
};
