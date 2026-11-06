// Lauri. Three movement modes:
//   run   – up = jump, down = duck (office, horse, skiing, home office)
//   glide – up = rise, down = dive, springs back to base altitude
//   swim  – up = leap out of the water, down = dive, back to the surface
class Player {
  constructor(level) {
    this.set = level.player;
    this.cfg = PLAYER_SETS[this.set];
    this.mode = this.cfg.mode;
    this.x = CONFIG.PLAYER_X;
    this.vy = 0;
    this.dir = 0;        // glide/swim: -1 up, 1 down, 0 neutral
    this.holdT = 0;
    this.jumpBuf = 0;
    this.coyote = 0;
    this.leaping = false;
    this.ducking = false;
    this.grounded = true;
    this.animT = 0;
    this.frame = 0;
    this.pose = 'run';
    this.auto = null;    // { y } while walking into a gate: input ignored
    this.alpha = 1;
    if (this.mode === 'run') this.y = CONFIG.RUN.groundY;
    if (this.mode === 'glide') { this.y = CONFIG.GLIDE.baseY; this.pose = 'glide'; }
    if (this.mode === 'swim') { this.y = CONFIG.SWIM.surfaceY; this.pose = 'swim'; }
  }

  update(dt, input, speed) {
    const inp = this.auto ? null : input;
    if (this.mode === 'run') this.updateRun(dt, inp);
    else if (this.mode === 'glide') this.updateGlide(dt, inp);
    else this.updateSwim(dt, inp);
    this.animT += dt * (speed / 250);
  }

  spring(dt, target, k, c) {
    const a = k * (target - this.y) - c * this.vy;
    this.vy += a * dt;
    this.y += this.vy * dt;
  }

  updateRun(dt, inp) {
    const R = CONFIG.RUN;
    if (inp && inp.up) this.jumpBuf = R.jumpBuffer;
    this.jumpBuf -= dt;
    this.coyote = this.grounded ? R.coyote : this.coyote - dt;
    if (inp && this.jumpBuf > 0 && this.coyote > 0) {
      this.vy = -R.jumpVel;
      this.grounded = false;
      this.coyote = 0;
      this.jumpBuf = 0;
      SOUND.play('jump');
    }
    const down = !!(inp && inp.down);
    if (!this.grounded) {
      this.vy += R.gravity * (down ? R.fastFall : 1) * dt;
      this.y += this.vy * dt;
      if (this.y >= R.groundY) { this.y = R.groundY; this.vy = 0; this.grounded = true; }
    }
    this.ducking = this.grounded && down;
    this.pose = !this.grounded ? 'jump' : (this.ducking ? 'duck' : 'run');
    this.frame = Math.floor(this.animT * 10) % 4;
  }

  updateGlide(dt, inp) {
    const G = CONFIG.GLIDE;
    let target = G.baseY;
    if (inp) {
      if (inp.up) { this.dir = -1; this.holdT = G.hold; SOUND.play('jump'); }
      if (inp.downPressed) { this.dir = 1; this.holdT = G.hold; }
      if (this.dir === -1 && inp.upHeld) this.holdT = G.hold;
      if (this.dir === 1 && inp.down) this.holdT = G.hold;
      this.holdT -= dt;
      if (this.holdT <= 0) this.dir = 0;
      target = G.baseY + (this.dir < 0 ? -G.offset : this.dir > 0 ? G.diveOffset : 0);
    } else if (this.auto) {
      target = this.auto.y;
    }
    this.spring(dt, target, G.stiffness, G.damping);
    this.pose = 'glide';
    this.frame = Math.floor(this.animT * 3) % 2;
  }

  updateSwim(dt, inp) {
    const S = CONFIG.SWIM;
    if (inp && inp.up) this.jumpBuf = CONFIG.RUN.jumpBuffer;
    this.jumpBuf -= dt;

    if (this.leaping) {
      const down = !!(inp && inp.down);
      this.vy += S.gravity * (down ? 1.8 : 1) * dt;
      this.y += this.vy * dt;
      if (this.y >= S.surfaceY && this.vy > 0) {
        this.leaping = false;
        this.vy *= 0.4;            // splash: a small dip, then the spring takes over
        if (down) { this.dir = 1; this.holdT = S.hold; }
      }
    } else {
      if (inp) {
        if (this.jumpBuf > 0) {
          // leap (also works straight from a dive: burst out of the water)
          this.leaping = true;
          this.vy = -(S.leapVel + Math.max(0, this.y - S.surfaceY) * 2.2);
          this.dir = 0;
          this.jumpBuf = 0;
          SOUND.play('jump');
        } else {
          if (inp.downPressed) { this.dir = 1; this.holdT = S.hold; }
          if (this.dir === 1 && inp.down) this.holdT = S.hold;
          this.holdT -= dt;
          if (this.holdT <= 0) this.dir = 0;
        }
      } else {
        this.dir = 0;
      }
      if (!this.leaping) this.spring(dt, S.surfaceY + this.dir * S.diveDepth, S.stiffness, S.damping);
    }
    this.pose = this.leaping ? 'leap' : (this.y > S.surfaceY + 20 ? 'dive' : 'swim');
    this.frame = Math.floor(this.animT * 5) % 3;
  }

  hitbox() {
    const c = this.cfg;
    if (this.mode === 'run') {
      if (this.ducking) {
        return { x: this.x - c.duckW / 2 + (c.duckDX || 0), y: this.y - c.duckH, w: c.duckW, h: c.duckH };
      }
      return { x: this.x - c.hitW / 2 + (c.hitDX || 0), y: this.y - c.standH, w: c.hitW, h: c.standH };
    }
    if (this.mode === 'glide') {
      const G = CONFIG.GLIDE;
      return { x: this.x - G.hitW / 2, y: this.y - G.hitH / 2, w: G.hitW, h: G.hitH };
    }
    const S = CONFIG.SWIM;
    return { x: this.x - S.hitW / 2, y: this.y - S.hitH / 2, w: S.hitW, h: S.hitH };
  }

  draw(ctx, t, blink) {
    if (this.alpha <= 0) return;
    if (blink) ctx.globalAlpha = 0.3;
    else if (this.alpha < 1) ctx.globalAlpha = this.alpha;
    ART.drawLauri(ctx, this.set, this, t);
    ctx.globalAlpha = 1;
  }
}
