// Sound effects + background music, with one on/off switch (remembered).
// Uses Web Audio when the game is hosted (instant playback, also on phones);
// when index.html is opened as a local file, effects fall back to <audio> elements.
const SOUND = {
  ctx: null,
  master: null,       // everything goes through here; 0 when muted
  buffers: {},
  elements: {},
  muted: false,
  musicStarted: false,
  KEY: 'iskanpaiva_sound',

  init() {
    try { this.muted = localStorage.getItem(this.KEY) === 'off'; } catch (e) { /* ignore */ }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) {
      try {
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 1;
        this.master.connect(this.ctx.destination);
      } catch (e) { this.ctx = null; }
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
      if (!this.ctx) return;
      const go = () => {
        if (!this.musicStarted && CONFIG.AUDIO.music > 0) {
          this.musicStarted = true;
          MUSIC.start(this.ctx, this.master, CONFIG.AUDIO.music);
        }
      };
      if (this.ctx.state === 'suspended') this.ctx.resume().then(go).catch(() => {});
      else go();
    };
    for (const ev of ['pointerdown', 'keydown', 'touchend']) window.addEventListener(ev, unlock, { passive: true });
    // pause everything while the tab is hidden
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) this.ctx.suspend().catch(() => {});
      else this.ctx.resume().catch(() => {});
    });
  },

  // short retro "bling" (two rising notes), e.g. for collecting a heart
  chime() {
    if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    [[988, 0], [1480, 0.08]].forEach(([f, d]) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'square';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + d);
      g.gain.linearRampToValueAtTime(0.12 * CONFIG.AUDIO.effects, t + d + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.18);
      o.connect(g).connect(this.master);
      o.start(t + d);
      o.stop(t + d + 0.2);
    });
  },

  toggle() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 1;
    try { localStorage.setItem(this.KEY, this.muted ? 'off' : 'on'); } catch (e) { /* ignore */ }
  },

  play(name) {
    if (!SOUNDS[name] || this.muted) return;
    const vol = CONFIG.AUDIO.effects;
    try {
      const buf = this.buffers[name];
      if (this.ctx && buf && this.ctx.state === 'running') {
        const src = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        gain.gain.value = vol;
        src.buffer = buf;
        src.connect(gain).connect(this.master);
        src.start(0);
        return;
      }
      const el = this.elements[name];
      if (el) {
        const a = el.cloneNode();
        a.volume = vol;
        a.play().catch(() => {});
      }
    } catch (e) { /* ignore */ }
  },
};
