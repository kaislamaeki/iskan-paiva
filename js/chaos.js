// Chaos mode (unlocked after the sauna): endless random levels.
// Each level gets a random background, a random look for Lauri (any running look
// in the running backgrounds) and 3 jump + 3 duck obstacles taken from ALL levels.
// Obstacles from other levels are resized to fit: a cardboard box in the
// paragliding sky becomes giant, a paraglider in the office becomes tiny.
const CHAOS = (() => {
  const BGS = ['office', 'glide', 'horse', 'swim', 'ski', 'home'];
  const RUN_BODIES = ['office', 'home', 'horse', 'ski'];

  // How big obstacles are drawn (H) and their hitbox (h, bottom) per movement mode.
  // Glide/swim hitboxes reach top-to-ground like the normal levels.
  const SLOT = {
    run:   { low: { H: 40, h: 28 }, high: { H: 30, h: 22 } },
    glide: { low: { H: 140 },       high: { H: 70 } },
    swim:  { low: { H: 115 },       high: { H: 40, h: 30, bottom: 208 } },
  };

  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const shuffle = (a) => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  function sized(t, mode) {
    const s = SLOT[mode][t.kind];
    const shownW = s.H * ART.imageAspect(t.key);
    const maxW = mode === 'glide' && t.kind === 'low' ? 90 : 70;
    const ty = { key: t.key, kind: t.kind, w: Math.round(Math.max(16, Math.min(maxW, shownW * 0.65))), drawH: s.H };
    if (s.h) ty.h = s.h;
    if (s.bottom) ty.bottom = s.bottom;
    if (t.buzz) ty.buzz = true;
    return ty;
  }

  // n = 1, 2, 3, ... (gets a little faster each time)
  function make(n) {
    // dev: ?chaosbg=glide forces a background (to preview)
    const forced = CONFIG.DEV && new URLSearchParams(location.search).get('chaosbg');
    const bg = BGS.includes(forced) ? forced : pick(BGS);
    const src = LEVELS.find((L) => L.bg === bg);
    const mode = src.mode;
    const all = LEVELS.flatMap((L) => L.obstacles);
    const lows = shuffle(all.filter((t) => t.kind === 'low')).slice(0, 3);
    const highs = shuffle(all.filter((t) => t.kind === 'high')).slice(0, 3);
    return {
      id: 'chaos', chaos: true,
      bg, mode, gate: 'portal',
      player: mode === 'run' ? pick(RUN_BODIES) : src.player,
      obstacles: [...lows, ...highs].map((t) => sized(t, mode)),
      length: CONFIG.LEVEL_LENGTH,
      baseSpeed: CONFIG.SPEED.base + CONFIG.SPEED.perLevel * Math.min(5 + n, 12),
      index: 5 + n,
      name: src.name,
      hint: src.hint,
      hudLabel: `${STR.chaos} ${n}: ${src.name}`,
    };
  }

  return { make };
})();
