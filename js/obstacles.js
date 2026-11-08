// Spawning, moving and colliding obstacles.
const Obstacles = {
  list: [],
  distToNext: 0,
  next: null,

  hearts: [],            // floating hearts that give a life back
  heartsAllowed: false,  // set by the game: true while Lauri has lost a life
  heartTimer: 0,         // seconds since the last heart (or level start)

  reset(level) {
    this.list = [];
    this.hearts = [];
    this.heartTimer = 0;
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

  make(type, level, x, seed) {
    const p = this.place(type, level);
    return { type, x, y: p.y, w: type.w, h: p.h, seed };
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

    // Rarely, after a lost life: a floating heart in the gap behind this obstacle.
    // The gap gets extra room so jumping for the heart never makes the next obstacle unfair.
    const H = CONFIG.HEART;
    if (this.heartsAllowed && this.heartTimer > H.cooldown && Math.random() < H.chance) {
      this.heartTimer = 0;
      this.hearts.push({ x: CONFIG.WIDTH + 40 + type.w + H.after * speed, y: this.heartY(level) - 10, w: 24, h: 20, seed: Math.random() * 6 });
      this.distToNext += H.extraGap * speed;
    }
  },

  // Height of a heart: only reachable by jumping (rising / leaping), never by just running past
  heartY(level) {
    if (level.mode === 'glide') return CONFIG.GLIDE.baseY - CONFIG.GLIDE.offset + 5;
    if (level.mode === 'swim') return CONFIG.SWIM.surfaceY - 75;
    return CONFIG.RUN.groundY - 82;
  },

  // Returns true (and removes the heart) if Lauri touches one
  collectHeart(hb) {
    const i = this.hearts.findIndex((o) => hb.x < o.x + o.w && hb.x + hb.w > o.x && hb.y < o.y + o.h && hb.y + hb.h > o.y);
    if (i < 0) return false;
    this.hearts.splice(i, 1);
    return true;
  },

  update(dt, speed, spawning, level) {
    const dx = speed * dt;
    this.heartTimer += dt;
    for (const o of this.list) o.x -= dx;
    for (const o of this.hearts) o.x -= dx;
    this.list = this.list.filter((o) => o.x + o.w > -160);
    this.hearts = this.hearts.filter((o) => o.x + o.w > -40);
    if (spawning) {
      this.distToNext -= dx;
      if (this.distToNext <= 0) this.spawn(level, speed);
    }
  },

  collide(hb) {
    for (const o of this.list) {
      if (hb.x < o.x + o.w && hb.x + hb.w > o.x && hb.y < o.y + o.h && hb.y + hb.h > o.y) return o;
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
    for (const h of this.hearts) ART.drawHeartPickup(ctx, h, t);
  },
};
