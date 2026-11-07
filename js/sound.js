// Sound effects. Set paths in SOUNDS (config.js) and they play.
// Uses Web Audio when the game is hosted (instant playback, also on phones);
// when index.html is opened as a local file, falls back to <audio> elements.
const SOUND = {
  ctx: null,
  buffers: {},
  elements: {},
  volume: 0.8,

  init() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) {
      try { this.ctx = new AC(); } catch (e) { this.ctx = null; }
    }
    for (const name in SOUNDS) {
      const src = SOUNDS[name];
      if (!src) continue;
      // fallback element, always prepared
      try {
        const el = new Audio(src);
        el.preload = 'auto';
        this.elements[name] = el;
      } catch (e) { /* ignore */ }
      // instant-playback buffer (fails quietly on file://)
      if (this.ctx && location.protocol !== 'file:') {
        fetch(src)
          .then((r) => r.arrayBuffer())
          .then((data) => new Promise((ok, fail) => this.ctx.decodeAudioData(data, ok, fail)))
          .then((buf) => { this.buffers[name] = buf; })
          .catch(() => {});
      }
    }
    // browsers only allow sound after the first tap / key press
    const unlock = () => {
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    };
    for (const ev of ['pointerdown', 'keydown', 'touchend']) window.addEventListener(ev, unlock, { passive: true });
  },

  play(name) {
    if (!SOUNDS[name]) return;
    try {
      const buf = this.buffers[name];
      if (this.ctx && buf && this.ctx.state === 'running') {
        const src = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        gain.gain.value = this.volume;
        src.buffer = buf;
        src.connect(gain).connect(this.ctx.destination);
        src.start(0);
        return;
      }
      const el = this.elements[name];
      if (el) {
        const a = el.cloneNode();
        a.volume = this.volume;
        a.play().catch(() => {});
      }
    } catch (e) { /* ignore */ }
  },
};
