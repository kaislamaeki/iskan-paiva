// Sound effects (not in v1). Set paths in SOUNDS (config.js) and they play.
const SOUND = {
  cache: {},
  play(name) {
    const src = SOUNDS[name];
    if (!src) return;
    try {
      if (!this.cache[name]) this.cache[name] = new Audio(src);
      const a = this.cache[name].cloneNode();
      a.volume = 0.6;
      a.play().catch(() => {});
    } catch (e) { /* ignore */ }
  },
};
