// Spawning, moving and colliding obstacles.
const Obstacles = {
  list: [],
  distToNext: 0,
  next: null,

  reset(level) {
    this.list = [];
    this.distToNext = CONFIG.FIRST_OBSTACLE_DELAY * level.baseSpeed;
    this.next = this.pick(level, null);
  },

  pick(level, prev) {
    const types = level.obstacles;
    let total = 0;
    for (const ty of types) total += ty.weight || 1;
    let r = Math.random() * total;
    for (const ty of types) {
      r -= ty.weight || 1;
      if (r <= 0) return ty;
    }
    return types[types.length - 1];
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
    return { y: S.highBottom - type.h, h: type.h };
  },

  spawn(level, speed) {
    const type = this.next;
    const p = this.place(type, level);
    this.list.push({ type, x: CONFIG.WIDTH + 40, y: p.y, w: type.w, h: p.h, seed: Math.random() * 10 });

    // choose the following obstacle now so the gap can account for it
    this.next = this.pick(level, type);
    const G = CONFIG.GAP;
    let gapTime = G[level.mode] + Math.random() * G.randomExtra;
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
  },
};
