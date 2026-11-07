// Spawning, moving and colliding obstacles.
const Obstacles = {
  list: [],
  distToNext: 0,
  next: null,

  reset(level) {
    this.list = [];
    this.distToNext = CONFIG.FIRST_OBSTACLE_DELAY * level.baseSpeed;
    this.deck = this.buildDeck(level);
    this.bags = { low: [], high: [] };
    this.counts = { low: 0, high: 0 };
    this.next = this.pick(level);
  },

  shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  // Every obstacle of the level once, in random order, alternating low/high.
  // This comes first, so each obstacle appears at least once per level.
  buildDeck(level) {
    const lows = this.shuffle(level.obstacles.filter((ty) => ty.kind === 'low'));
    const highs = this.shuffle(level.obstacles.filter((ty) => ty.kind === 'high'));
    const deck = [];
    let useLow = Math.random() < 0.5;
    while (lows.length || highs.length) {
      const from = (useLow && lows.length) || !highs.length ? lows : highs;
      deck.push(from.shift());
      useLow = !useLow;
    }
    return deck;
  },

  // After the deck: a fair mix. Low or high 50/50 (but never more than 2 ahead of
  // the other), then the next obstacle from a shuffled bag of that kind, so none
  // of them repeats much more than the others.
  pick(level) {
    const ty = this.deck.length ? this.deck.shift() : this.pickFromBags(level);
    this.counts[ty.kind]++;
    return ty;
  },

  pickFromBags(level) {
    const lows = level.obstacles.filter((ty) => ty.kind === 'low');
    const highs = level.obstacles.filter((ty) => ty.kind === 'high');
    const diff = this.counts.low - this.counts.high;
    let kind = Math.random() < 0.5 ? 'low' : 'high';
    if (diff >= 2) kind = 'high';
    if (diff <= -2) kind = 'low';
    if (!highs.length) kind = 'low';
    if (!lows.length) kind = 'high';
    if (!this.bags[kind].length) this.bags[kind] = this.shuffle((kind === 'low' ? lows : highs).slice());
    return this.bags[kind].shift();
  },

  // Vertical placement of a hitbox, depending on movement mode
  place(type, level) {
    const mode = level.mode;
    if (mode === 'run') {
      const G = CONFIG.RUN.groundY;
      if (type.kind === 'low') return { y: G - type.h, h: type.h };
      const hb = PLAYER_SETS[level.player].highBottom;
      return { y: G - hb - type.h, h: type.h };
    }
    if (mode === 'glide') {
      const G = CONFIG.GLIDE;
      if (type.kind === 'low') return { y: G.lowTop, h: G.groundY - G.lowTop };
      return { y: G.highTop, h: G.highBottom - G.highTop };
    }
    const S = CONFIG.SWIM;
    if (type.kind === 'low') return { y: S.lowTop, h: S.bottomY - S.lowTop };
    return { y: (type.bottom || S.highBottom) - type.h, h: type.h }; // 'bottom' lets one obstacle sit higher
  },

  // Flying ('high') obstacles must be ducked under, not jumped over: their hit
  // area reaches up (invisibly) above the highest point Lauri can jump or leap.
  // Returns how many px to add above the obstacle's top.
  reach(type, level, y) {
    if (type.kind !== 'high') return 0;
    if (level.mode === 'run') {
      const R = CONFIG.RUN;
      const peak = R.jumpVel * R.jumpVel / (2 * R.gravity);   // ~104 px
      return Math.max(0, y - (R.groundY - peak - 16));
    }
    if (level.mode === 'swim') return Math.max(0, y - 20);    // even a leap out of a dive can't clear it
    return 0;                                                  // paragliding is already correct
  },

  make(type, level, x, seed) {
    const p = this.place(type, level);
    return { type, x, y: p.y, w: type.w, h: p.h, seed, reach: this.reach(type, level, p.y) };
  },

  spawn(level, speed) {
    const type = this.next;
    this.list.push(this.make(type, level, CONFIG.WIDTH + 40, Math.random() * 10));

    // choose the following obstacle now so the gap can account for it
    this.next = this.pick(level);
    const G = CONFIG.GAP;
    // gapScale / extraScale (chaos mode) bring obstacles closer together on harder levels
    let gapTime = G[level.mode] * (level.gapScale || 1) + Math.random() * G.randomExtra * (level.extraScale || 1);
    if (this.next.kind !== type.kind) gapTime += 0.15; // switching up<->down needs a moment
    this.distToNext = type.w + gapTime * speed;
  },

  update(dt, speed, spawning, level) {
    const dx = speed * dt;
    for (const o of this.list) o.x -= dx;
    this.list = this.list.filter((o) => o.x + o.w > -160);
    if (spawning) {
      this.distToNext -= dx;
      if (this.distToNext <= 0) this.spawn(level, speed);
    }
  },

  collide(hb) {
    for (const o of this.list) {
      const top = o.y - (o.reach || 0);
      if (hb.x < o.x + o.w && hb.x + hb.w > o.x && hb.y < o.y + o.h && hb.y + hb.h > top) return o;
    }
    return null;
  },

  // Remove obstacles in [x0, x1] (used after a hit so Lauri has room)
  clearNear(x0, x1) {
    this.list = this.list.filter((o) => o.x > x1 || o.x + o.w < x0);
  },

  // Right edge of the furthest obstacle (for placing the gate)
  farthestRight() {
    let m = -Infinity;
    for (const o of this.list) m = Math.max(m, o.x + o.w);
    return m;
  },

  draw(ctx, t) {
    for (const o of this.list) ART.drawObstacle(ctx, o, t);
  },
};
