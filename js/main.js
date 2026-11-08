// Game loop and states:
//   title → comic → card → play → (card → play)×5 → card → finale → victory
//   play → gameover → card (level 1)
(() => {
  const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = W;
  canvas.height = H;
  ctx.imageSmoothingEnabled = false;

  const params = new URLSearchParams(location.search);
  const dev = (k) => CONFIG.DEV && params.has(k);

  const G = {
    state: 'title',
    t: 0,
    stateT: 0,
    score: 0,
    high: 0,
    newRecord: false,
    fx: [],           // little floating '+1 ♥' effects
    lives: CONFIG.START_LIVES,
    levelIndex: 0,
    level: null,
    levelStartScore: 0,
    levelTime: 0,
    speed: 0,
    scroll: 0,
    player: null,
    phase: 'run',     // run | gate | enter | dying
    gate: null,
    invT: 0,
    shake: 0,
    comicSeen: false,
    debug: dev('debug'),
    god: dev('god'),
    paused: false,
    cardFor: 0,       // level index, or 'finale'
    fin: null,
    fade: { a: 0, dir: 0, cb: null },
    fps: 60,
  };

  // ---------- high score ----------
  // Only chaos mode keeps points and a record (the story has none)
  const HS_KEY = 'iskanpaiva_chaos_highscore';
  function loadHigh() {
    try { G.high = parseInt(localStorage.getItem(HS_KEY), 10) || 0; } catch (e) { G.high = 0; }
  }
  function saveHigh() {
    const s = Math.floor(G.score);
    G.newRecord = s > G.high;
    if (G.newRecord) {
      G.high = s;
      try { localStorage.setItem(HS_KEY, String(s)); } catch (e) { /* ignore */ }
    }
  }

  // ---------- transitions ----------
  function transition(cb) {
    if (G.fade.dir !== 0) return;
    G.fade.dir = 1;
    G.fade.cb = cb;
  }
  function updateFade(dt) {
    const f = G.fade;
    if (f.dir === 0) return;
    f.a += f.dir * dt / CONFIG.TRANSITION.fade;
    if (f.dir === 1 && f.a >= 1) {
      f.a = 1;
      f.dir = -1;
      const cb = f.cb; f.cb = null;
      if (cb) cb();
      Input.reset();
    } else if (f.dir === -1 && f.a <= 0) {
      f.a = 0;
      f.dir = 0;
    }
  }
  const fading = () => G.fade.dir !== 0;

  function setState(s) {
    G.state = s;
    G.stateT = 0;
  }

  // ---------- flow ----------
  // a story run, from level 1 or from a level picked in the menu (0-based)
  function startRun(fromLevel = 0) {
    MUSIC.play('main');
    G.startLevel = fromLevel;   // "Yritä uudelleen" starts here again
    G.chaos = false;
    G.score = 0;
    G.lives = CONFIG.START_LIVES;
    G.newRecord = false;
    G.comicSeen = true;
    showCard(fromLevel);
  }

  // Chaos mode: endless random levels after the sauna (points start from 0)
  function startChaos() {
    MUSIC.play('chaos');
    G.chaos = true;
    G.chaosN = 0;
    G.lives = CONFIG.START_LIVES;
    G.score = 0;
    G.newRecord = false;
    nextChaos();
  }

  function nextChaos() {
    G.chaosN++;
    useLevel(CHAOS.make(G.chaosN));
    G.cardFor = 'chaos';
    setState('card');
  }

  function showCard(which) {
    G.cardFor = which;
    if (which !== 'finale') setupLevel(which);
    setState('card');
  }

  function setupLevel(i) {
    G.levelIndex = i;
    useLevel(LEVELS[i]);
  }

  function useLevel(L) {
    G.level = L;
    G.player = new Player(G.level);
    Obstacles.reset(G.level);
    G.levelStartScore = G.score;
    G.levelTime = 0;
    G.speed = G.level.baseSpeed;
    G.scroll = 0;
    G.phase = 'run';
    G.gate = null;
    G.invT = 0;
  }

  function nextLevel() {
    if (G.chaos) nextChaos();
    else if (G.levelIndex + 1 < LEVELS.length) showCard(G.levelIndex + 1);
    else showCard('finale');
  }

  function startGate() {
    G.phase = 'gate';
    const gap = 1.1 * G.speed;
    G.gate = {
      key: G.level.gate,
      x: Math.max(W + 80, Obstacles.farthestRight() + gap),
      arrived: false,
      arrivedT: 0,
    };
  }

  function hit() {
    G.lives--;
    G.invT = CONFIG.INVINCIBLE_TIME;
    G.shake = 0.3;
    SOUND.play('hit');
    Obstacles.clearNear(G.player.x - 60, G.player.x + CONFIG.CLEAR_AHEAD);
    if (G.lives <= 0) {
      G.phase = 'dying';
      G.dyingT = 0;
      SOUND.play('gameover');
    }
  }

  function gameOver() {
    if (G.chaos) saveHigh();
    else G.newRecord = false;
    setState('gameover');
  }

  function startFinale() {
    G.fin = { scroll: 0, saunaX: W + 160, phase: 'walk', t: 0, lauriX: 120, alpha: 1, steam: 1 };
    setState('finale');
  }

  function victory() {
    setState('victory');
    SOUND.play('victory');
  }

  function toTitle() {
    MUSIC.play('main');
    setState('title');
  }

  // ---------- updates ----------
  function updatePlay(dt) {
    const p = G.player;
    const L = G.level;

    if (G.phase === 'dying') {
      G.dyingT += dt;
      G.shake = Math.max(G.shake - dt, 0);
      if (G.dyingT > 1.0 && !fading()) transition(gameOver);
      return;
    }

    if (CONFIG.DEV) {
      if (Input.keys.KeyD) G.debug = !G.debug;
      if (Input.keys.KeyN && G.phase === 'run') {
        G.score = G.levelStartScore + L.length;
        Obstacles.list = [];
      }
    }

    G.levelTime += dt;
    if (G.phase === 'run' || G.phase === 'gate') {
      const S = CONFIG.SPEED;
      G.speed = L.baseSpeed + Math.min(S.accel * G.levelTime, S.maxBonus);
      G.scroll += G.speed * dt;
      G.score += G.speed * dt / CONFIG.PX_PER_POINT;
      p.update(dt, Input, G.speed);
      Obstacles.heartsAllowed = G.lives < CONFIG.START_LIVES;   // hearts only after a lost life
      Obstacles.update(dt, G.speed, G.phase === 'run', L);
      if (G.gate) {
        G.gate.x -= G.speed * dt;
        // once nothing is left ahead, Lauri heads for the gate on his own
        if (!p.auto && Obstacles.farthestRight() < p.x - 20) p.auto = { y: autoY(L.mode) };
        if (G.gate.x <= p.x + 50) G.phase = 'enter';
      }
      if (G.phase === 'run' && G.score - G.levelStartScore >= L.length) startGate();

      if (G.invT <= 0 && !G.god) {
        const o = Obstacles.collide(p.hitbox());
        if (o) { G.lastHit = o.type.key; hit(); }
      }
      // jumped into a floating heart: one life back
      if (Obstacles.collectHeart(p.hitbox())) {
        G.lives = Math.min(CONFIG.START_LIVES, G.lives + 1);
        SOUND.chime();
        G.fx.push({ x: p.x, y: p.hitbox().y, t: 0 });
      }
    } else if (G.phase === 'enter') {
      if (!p.auto) p.auto = { y: autoY(L.mode) };
      p.update(dt, Input, 120);
      if (!G.gate.arrived) {
        p.x += CONFIG.TRANSITION.gateWalk * dt;
        if (p.x >= G.gate.x) { p.x = G.gate.x; G.gate.arrived = true; SOUND.play('gate'); }
      } else {
        G.gate.arrivedT += dt;
        // splash when Lauri's dive off the pier hits the water (same moment as the drawn splash)
        if (G.gate.key === 'pier' && !G.gate.splashed && G.gate.arrivedT >= 1.9) {
          G.gate.splashed = true;
          SOUND.play('splash');
        }
        // at the pier and the rooftop the gate animation takes over (dive / take-off), elsewhere Lauri fades into the door
        p.alpha = G.gate.key in ART.GATE_ANIM ? 0 : Math.max(0, 1 - G.gate.arrivedT * 2.5);
        // stay at the gate until the player clicks/taps/presses space
        if (G.gate.arrivedT > gateWait() && Input.confirm) transition(nextLevel);
      }
    }
    G.invT -= dt;
    for (const f of G.fx) f.t += dt;
    G.fx = G.fx.filter((f) => f.t < 1);
    G.shake = Math.max(G.shake - dt, 0);
  }

  // seconds at the gate before a click moves on (animated gates wait for their scene)
  function gateWait() {
    return CONFIG.TRANSITION.gateMinWait + ((G.gate && ART.GATE_ANIM[G.gate.key]) || 0);
  }

  function autoY(mode) {
    if (mode === 'glide') return CONFIG.GLIDE.groundY - 18;
    if (mode === 'swim') return CONFIG.SWIM.surfaceY;
    return CONFIG.RUN.groundY;
  }

  function updateFinale(dt) {
    const f = G.fin;
    f.t += dt;
    const speed = 80;
    if (f.phase === 'walk') {
      f.scroll += speed * dt;
      f.saunaX -= speed * dt;
      if (f.saunaX <= 560) { f.phase = 'approach'; f.t = 0; }
    } else if (f.phase === 'approach') {
      const target = f.saunaX - 100;
      f.lauriX = Math.min(target, f.lauriX + 70 * dt);
      if (f.lauriX >= target) { f.phase = 'greet'; f.t = 0; }
    } else if (f.phase === 'greet') {
      // Touko speaks (0.3–2.3 s), then Lauri answers (2.6–4.4 s)
      if (f.t > 4.6) { f.phase = 'enter'; f.t = 0; }
    } else if (f.phase === 'enter') {
      f.lauriX += 50 * dt;
      f.alpha = Math.max(0, 1 - Math.max(0, f.t - 1.0) * 1.6);
      f.steam = 1 + f.t;
      if (f.t > 2.2) transition(victory);
    }
  }

  function update(dt) {
    G.t += dt;
    G.stateT += dt;
    Input.update(dt);
    updateFade(dt);

    // sound on/off: the speaker button (top right) or the M key.
    // A tap on the button is used up here, so it never counts as a jump.
    const onSoundButton = Input.tap && inRect(Input.tap, soundButton());
    if (Input.keys.KeyM || onSoundButton) SOUND.toggle();
    if (onSoundButton) { Input.up = false; Input.confirm = false; Input.downPressed = false; Input.tap = null; }

    // phones: pause button next to the speaker during play (same rule: the tap is used up)
    const onPauseButton = pauseButtonVisible() && Input.tap && inRect(Input.tap, pauseButton());
    if (onPauseButton) {
      G.paused = !G.paused;
      Input.up = false; Input.confirm = false; Input.downPressed = false; Input.tap = null;
    }

    if (Input.keys.KeyP || Input.keys.Escape) {
      if (G.state === 'play' && G.phase !== 'dying') G.paused = !G.paused;
    }
    if (G.paused) {
      if (Input.confirm) G.paused = false;
      return;
    }
    if (portraitBlock()) return;

    switch (G.state) {
      case 'title': {
        if (fading() || G.stateT < 0.3) break;
        const b = titleComicButton();
        const onButton = Input.tap && inRect(Input.tap, b);
        if ((Input.tap && inRect(Input.tap, titleMenuButton())) || Input.keys.KeyV) {
          transition(() => setState('menu'));
        } else if (onButton || Input.keys.KeyC) {
          transition(() => { Comic.start(() => transition(toTitle)); G.comicSeen = true; setState('comic'); });
        } else if (Input.confirm) {
          if (!G.comicSeen) {
            transition(() => {
              G.comicSeen = true;
              Comic.start(() => transition(startRun));
              setState('comic');
            });
          } else {
            transition(startRun);
          }
        }
        break;
      }
      case 'menu': {
        // level select: click/tap a level (or press 1-6), Esc / Takaisin goes back
        if (fading() || G.stateT < 0.3) break;
        let pick = -1;
        LEVELS.forEach((L, i) => {
          if ((Input.tap && inRect(Input.tap, menuLevelButton(i))) || Input.keys['Digit' + (i + 1)] || Input.keys['Numpad' + (i + 1)]) pick = i;
        });
        if (pick >= 0) transition(() => startRun(pick));
        else if ((Input.tap && inRect(Input.tap, menuChaosButton())) || Input.keys.Digit7 || Input.keys.Numpad7 || Input.keys.KeyK) transition(startChaos);
        else if ((Input.tap && inRect(Input.tap, menuBackButton())) || Input.keys.Escape || Input.keys.Backspace) transition(toTitle);
        break;
      }
      case 'comic':
        if (!fading()) Comic.update(dt);
        break;
      case 'card':
        if (!fading() && (G.stateT > CONFIG.TRANSITION.card || (Input.confirm && G.stateT > 0.4))) {
          transition(() => {
            if (G.cardFor === 'finale') startFinale();
            else setState('play');
          });
        }
        break;
      case 'play':
        updatePlay(dt);
        break;
      case 'finale':
        updateFinale(dt);
        break;
      case 'gameover':
        if (!fading() && G.stateT > 0.8) {
          if (Input.tap && inRect(Input.tap, gameOverTitleButton())) transition(toTitle);
          else if (Input.confirm) transition(G.chaos ? startChaos : () => startRun(G.startLevel || 0));
        }
        break;
      case 'victory':
        if (!fading() && G.stateT > 1.5) {
          // victory: start chaos mode (space / tap / button), or the small button back to the title
          if (Input.tap && inRect(Input.tap, victoryTitleButton())) transition(toTitle);
          else if (Input.confirm) transition(startChaos);
        }
        break;
    }
  }

  // ---------- UI helpers ----------
  const inRect = (p, r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
  const titleComicButton = () => ({ x: 14, y: 262, w: 150, h: 26 });
  const titleMenuButton = () => ({ x: 172, y: 262, w: 120, h: 26 });
  // level select: 2 columns x 3 rows
  const menuLevelButton = (i) => ({ x: 90 + (i % 2) * 320, y: 68 + Math.floor(i / 2) * 46, w: 300, h: 38 });
  const menuChaosButton = () => ({ x: 90, y: 208, w: 620, h: 34 });
  const menuBackButton = () => ({ x: W / 2 - 80, y: 258, w: 160, h: 28 });
  const gameOverTitleButton = () => ({ x: W / 2 - 60, y: 252, w: 120, h: 26 });
  const victoryChaosButton = () => ({ x: 14, y: 222, w: 234, h: 32 });
  const victoryTitleButton = () => ({ x: 14, y: 262, w: 234, h: 26 });
  const soundButton = () => ({ x: 644, y: 8, w: 30, h: 24 });
  const pauseButton = () => ({ x: 608, y: 8, w: 30, h: 24 });
  const pauseButtonVisible = () => isTouchDevice() && G.state === 'play' && G.phase !== 'dying';

  // phones: pause button (two bars, or a play triangle while paused)
  function drawPauseButton() {
    if (!pauseButtonVisible()) return;
    const b = pauseButton();
    ctx.fillStyle = 'rgba(27,27,47,0.6)';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = '#ffffff';
    if (G.paused) {
      for (let i = 0; i < 7; i++) ctx.fillRect(b.x + 11 + i * 2, b.y + 5 + i, 2, 14 - i * 2);
    } else {
      ctx.fillRect(b.x + 9, b.y + 5, 4, 14);
      ctx.fillRect(b.x + 17, b.y + 5, 4, 14);
    }
  }

  // pixel speaker icon; red cross when sound is off
  function drawSoundButton() {
    const b = soundButton();
    ctx.fillStyle = 'rgba(27,27,47,0.6)';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(b.x + 5, b.y + 9, 4, 6);
    ctx.fillRect(b.x + 9, b.y + 7, 2, 10);
    ctx.fillRect(b.x + 11, b.y + 5, 2, 14);
    if (SOUND.muted) {
      ctx.fillStyle = '#e8364f';
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(b.x + 16 + i * 2, b.y + 7 + i * 2, 2, 2);
        ctx.fillRect(b.x + 24 - i * 2, b.y + 7 + i * 2, 2, 2);
      }
    } else {
      ctx.fillRect(b.x + 16, b.y + 9, 2, 6);
      ctx.fillRect(b.x + 20, b.y + 7, 2, 10);
      ctx.fillRect(b.x + 24, b.y + 5, 2, 14);
    }
  }

  function button(r, label) {
    ctx.fillStyle = 'rgba(27,27,47,0.8)';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = '#ffd56b';
    ctx.fillRect(r.x, r.y + r.h - 3, r.w, 3);
    FONT.draw(ctx, label, r.x + r.w / 2, r.y + 6, { scale: 2, color: '#ffffff', align: 'center' });
  }

  const pad = (n) => String(Math.floor(n)).padStart(5, '0');
  const isTouchDevice = () => Input.isTouch || (window.matchMedia && matchMedia('(pointer: coarse)').matches);
  function portraitBlock() {
    return isTouchDevice() && window.innerHeight > window.innerWidth * 1.1;
  }

  // ---------- drawing ----------
  function drawWorld() {
    const L = G.level;
    BG.draw(ctx, L.bg, G.scroll, G.t);
    if (G.gate) ART.drawGate(ctx, G.gate.key, G.gate.x, groundFor(L.mode), G.t, G.gate);
    Obstacles.draw(ctx, G.t);
    const blink = G.invT > 0 && Math.floor(G.invT * 12) % 2 === 0;
    G.player.draw(ctx, G.t, blink);
    for (const f of G.fx) {   // '+1 ♥' rising from Lauri after collecting a heart
      ctx.globalAlpha = 1 - f.t;
      FONT.draw(ctx, '+1 ♥', f.x, f.y - 10 - f.t * 30, { scale: 2, color: '#ff7a9c', align: 'center', shadow: '#2b2b3b' });
      ctx.globalAlpha = 1;
    }
    // the lake ends at the ice arch, beyond it is snow
    const waterEnd = G.gate && G.gate.key === 'iceArch' ? Math.max(0, G.gate.x - 14 * ART.U) : W;
    BG.drawOverlay(ctx, L.bg, G.scroll, G.t, waterEnd);
    if (G.debug) {
      ctx.strokeStyle = '#00ff66';
      const hb = G.player.hitbox();
      ctx.strokeRect(hb.x + 0.5, hb.y + 0.5, hb.w, hb.h);
      ctx.strokeStyle = '#ff3355';
      for (const o of Obstacles.list) ctx.strokeRect(o.x + 0.5, o.y + 0.5, o.w, o.h);
    }
  }

  function drawHUD() {
    const sh = 'rgba(0,0,0,0.55)';
    if (G.chaos) {   // points and record only in chaos mode
      FONT.draw(ctx, `${STR.score} ${pad(G.score)}`, 12, 10, { scale: 2, color: '#ffffff', shadow: sh });
      FONT.draw(ctx, `${STR.highScore} ${pad(Math.max(G.high, G.score))}`, 12, 30, { scale: 1, color: '#ffffff', shadow: sh });
    }
    const L = G.level;
    FONT.draw(ctx, L.hudLabel || `${STR.level} ${L.index + 1}: ${L.name}`, W / 2, 10, { scale: 2, color: '#ffffff', align: 'center', shadow: sh });
    // progress to the gate
    const prog = Math.min(1, (G.score - G.levelStartScore) / L.length);
    const bx = W / 2 - 80, by = 30;
    ctx.fillStyle = sh; ctx.fillRect(bx, by, 160, 6);
    ctx.fillStyle = '#ffd56b'; ctx.fillRect(bx, by, Math.round(160 * prog), 6);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(bx + 164, by - 2, 8, 8); ctx.fillStyle = '#e8364f'; ctx.fillRect(bx + 166, by, 4, 4);
    // phones: show the two touch zones for the first seconds of each level
    if (isTouchDevice() && G.phase === 'run' && G.levelTime < 4) {
      ctx.globalAlpha = Math.min(1, 4 - G.levelTime) * 0.9;
      const sy = Math.round(H * CONFIG.TOUCH.split);
      ctx.fillStyle = '#ffffff';
      for (let x = 0; x < W; x += 16) ctx.fillRect(x, sy, 8, 2);
      const [hu, hd] = L.hint.split(/\s{2,}/);
      for (const [txt, ty] of [['↑ ' + hu, sy - 40], ['↓ ' + (hd || ''), sy + 22]]) {
        const tw = FONT.width(txt, 2);
        ctx.fillStyle = 'rgba(27,27,47,0.75)';
        ctx.fillRect(W - 28 - tw, ty - 6, tw + 16, 26);
        FONT.draw(ctx, txt, W - 20, ty, { scale: 2, color: '#ffffff', align: 'right' });
      }
      ctx.globalAlpha = 1;
    }
    // lives
    for (let i = 0; i < CONFIG.START_LIVES; i++) {
      ART.blit(ctx, i < G.lives ? ART.SPR.heart : ART.SPR.heartEmpty, W - 32 - i * 28, 10, 3);
    }
    if (G.debug) FONT.draw(ctx, `FPS ${Math.round(G.fps)}  SPD ${Math.round(G.speed)}`, 12, 44, { scale: 1, color: '#00ff66' });
    // waiting at the gate for a click
    if (G.phase === 'enter' && G.gate && G.gate.arrived && G.gate.arrivedT > gateWait() && Math.floor(G.t * 2) % 2 === 0) {
      const label = STR.gateNext + ' ▸';
      const lw = FONT.width(label, 2);
      ctx.fillStyle = 'rgba(27,27,47,0.75)';
      ctx.fillRect(W - 24 - lw, H - 32, lw + 16, 26);
      FONT.draw(ctx, label, W - 16, H - 26, { scale: 2, color: '#ffffff', align: 'right' });
    }
  }

  function drawTitle() {
    const scroll = G.t * 40;
    BG.draw(ctx, 'glide', scroll, G.t);
    const p = { x: 640, y: 170 + Math.sin(G.t * 1.5) * 8, pose: 'glide', frame: Math.floor(G.t * 3) % 2, vy: 0, noMotor: true };
    ART.drawLauri(ctx, 'glide', p, G.t);
    ctx.fillStyle = 'rgba(20,30,60,0.25)';
    ctx.fillRect(0, 0, W, H);
    FONT.draw(ctx, STR.title, 290, 60, { scale: 7, color: '#ffd56b', align: 'center', shadow: '#2b2b3b' });
    FONT.draw(ctx, STR.subtitle, 290, 124, { scale: 2, color: '#ffffff', align: 'center', shadow: '#2b2b3b' });
    if (Math.floor(G.t * 2) % 2 === 0) {
      FONT.draw(ctx, isTouchDevice() ? STR.tapStart : STR.pressStart, 290, 180, { scale: 2, color: '#ffffff', align: 'center', shadow: '#2b2b3b' });
    }
    if (G.high > 0) FONT.draw(ctx, `${STR.chaosRecord} ${pad(G.high)}`, 290, 214, { scale: 2, color: '#ffd56b', align: 'center', shadow: '#2b2b3b' });
    button(titleComicButton(), STR.rewatchComic);
    button(titleMenuButton(), STR.menu);
    // how to play (Finnish), different on phones
    const lines = isTouchDevice() ? STR.controlsTouch : STR.controlsDesktop;
    // the box grows with the longest line (texts are editable in strings.js)
    const bw = Math.max(...lines.map((l) => FONT.width(l, 2)), FONT.width(STR.howTo, 2)) + 24;
    const bx = W - 10 - bw;
    ctx.fillStyle = 'rgba(27,27,47,0.7)';
    ctx.fillRect(bx, 218, bw, 80);
    FONT.draw(ctx, STR.howTo, bx + bw / 2, 224, { scale: 2, color: '#ffd56b', align: 'center' });
    lines.forEach((l, i) => FONT.draw(ctx, l, bx + 12, 244 + i * 18, { scale: 2, color: '#ffffff' }));
  }

  // level select: the title background dimmed, one button per level
  function drawMenu() {
    BG.draw(ctx, 'glide', G.t * 40, G.t);
    ctx.fillStyle = 'rgba(20,20,45,0.72)';
    ctx.fillRect(0, 0, W, H);
    FONT.draw(ctx, STR.menu, W / 2, 18, { scale: 4, color: '#ffd56b', align: 'center', shadow: '#2b2b3b' });
    FONT.draw(ctx, STR.menuHint, W / 2, 48, { scale: 2, color: '#ffffff', align: 'center' });
    const accents = ['#9aa5b1', '#7fb8ef', '#6fb04f', '#3a7fb3', '#c7d7ee', '#c48a52'];
    LEVELS.forEach((L, i) => {
      const b = menuLevelButton(i);
      ctx.fillStyle = 'rgba(27,27,47,0.9)';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = accents[i];
      ctx.fillRect(b.x, b.y, 8, b.h);
      ctx.fillRect(b.x, b.y + b.h - 3, b.w, 3);
      FONT.draw(ctx, String(i + 1), b.x + 26, b.y + 12, { scale: 2, color: '#ffd56b', align: 'center' });
      FONT.draw(ctx, L.name, b.x + 46, b.y + 12, { scale: 2, color: '#ffffff' });
    });
    // chaos mode, with a running rainbow edge like on the victory screen
    const c = menuChaosButton();
    ctx.fillStyle = 'rgba(27,27,47,0.9)';
    ctx.fillRect(c.x, c.y, c.w, c.h);
    const cols = ['#e63946', '#f4a261', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6'];
    for (let i = 0; i < c.w; i += 6) {
      ctx.fillStyle = cols[(Math.floor(i / 6) + Math.floor(G.t * 8)) % cols.length];
      ctx.fillRect(c.x + i, c.y + c.h - 3, 6, 3);
    }
    FONT.draw(ctx, '7', c.x + 26, c.y + 10, { scale: 2, color: '#ffd56b', align: 'center' });
    FONT.draw(ctx, STR.chaosButton, c.x + c.w / 2, c.y + 10, { scale: 2, color: '#ff7ad9', align: 'center' });
    button(menuBackButton(), STR.back);
  }

  function drawCard() {
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);
    const fin = G.cardFor === 'finale';
    const chaos = G.cardFor === 'chaos';
    const L = fin ? null : (chaos ? G.level : LEVELS[G.cardFor]);
    const top = fin ? STR.finaleName : (chaos ? `${STR.chaos} ${G.chaosN}` : `${STR.level} ${L.index + 1}`);
    FONT.draw(ctx, top.toUpperCase(), W / 2, 60, { scale: 3, color: '#ffd56b', align: 'center' });
    if (!fin) {
      FONT.draw(ctx, L.name, W / 2, 100, { scale: L.name.length > 14 ? 4 : 5, color: '#ffffff', align: 'center' });
      if (chaos) FONT.draw(ctx, STR.chaosHint, W / 2, 146, { scale: 2, color: '#ff7ad9', align: 'center' });
      FONT.draw(ctx, L.hint, W / 2, isTouchDevice() ? 240 : 250, { scale: 2, color: '#9fb3c8', align: 'center' });
      if (isTouchDevice()) FONT.draw(ctx, STR.touchHint, W / 2, 264, { scale: 2, color: '#ffd56b', align: 'center' });
      // preview of Lauri's look for this level
      const set = L.player;
      const mode = PLAYER_SETS[set].mode;
      const py = mode === 'glide' ? 228 : (mode === 'swim' ? 205 : 225);
      if (mode === 'swim') { ctx.fillStyle = '#3a7fb3'; ctx.fillRect(W / 2 - 60, 205, 120, 18); }
      ART.drawLauri(ctx, set, { x: W / 2, y: py, pose: mode === 'glide' ? 'glide' : (mode === 'swim' ? 'swim' : 'run'), frame: Math.floor(G.t * 8) % 4, vy: 0 }, G.t);
    } else {
      ART.drawSauna(ctx, W / 2 + 40, 225, G.t);
      ART.drawPerson(ctx, 'lauri', W / 2 - 80, 225, 'walk', G.t);
    }
  }

  function drawFinale() {
    const f = G.fin;
    const gy = CONFIG.RUN.groundY;
    BG.draw(ctx, 'finale', f.scroll, G.t);
    ART.drawSauna(ctx, f.saunaX, gy, G.t, f.steam);
    const tx = f.saunaX - 40;
    const lauriPose = (f.phase === 'greet') ? 'stand' : 'walk';
    if (f.phase === 'enter') {
      ctx.globalAlpha = f.alpha;
      ART.drawPerson(ctx, 'touko', tx + Math.min(40, f.t * 50), gy, 'walk', G.t);
      ART.drawPerson(ctx, 'lauri', f.lauriX, gy, 'walk', G.t);
      ctx.globalAlpha = 1;
    } else {
      ART.drawPerson(ctx, 'touko', tx, gy, f.phase === 'greet' ? 'wave' : 'stand', G.t);
      ART.drawPerson(ctx, 'lauri', f.lauriX, gy, lauriPose, G.t);
    }
    if (f.phase === 'greet' && f.t > 0.3 && f.t < 2.3) drawBubble(ctx, STR.toukoFinale, tx, 110, tx, 196, { center: true });
    if (f.phase === 'greet' && f.t > 2.6 && f.t < 4.4) drawBubble(ctx, STR.lauriFinale, f.lauriX, 110, f.lauriX, 196, { center: true });
  }

  function drawVictory() {
    // everybody together in the sauna
    ART.drawSaunaInterior(ctx, G.stateT);
    const sh = '#2b1a0e';
    ctx.fillStyle = 'rgba(40,20,8,0.55)';
    ctx.fillRect(0, 0, W, 44);
    FONT.draw(ctx, STR.victoryTitle, W / 2, 12, { scale: 3, color: '#ffd56b', align: 'center', shadow: sh });
    // personal message on a wooden plaque
    const lines = FONT.wrap(STR.personalMessage.toUpperCase(), 17);
    const px = 18, py = 82, pw = 226, ph = lines.length * 22 + 26;
    ctx.fillStyle = '#4e2e16'; ctx.fillRect(px - 4, py - 4, pw + 8, ph + 8);
    ctx.fillStyle = '#fff3dc'; ctx.fillRect(px, py, pw, ph);
    ctx.fillStyle = '#e8364f'; ctx.fillRect(px, py, pw, 4);
    lines.forEach((l, i) => FONT.draw(ctx, l, px + pw / 2, py + 18 + i * 22, { scale: 2, color: '#2b2b3b', align: 'center' }));
    ART.blit(ctx, ART.SPR.heart, px + pw - 18, py + ph - 14 + Math.round(Math.sin(G.t * 3) * 2), 2);
    if (G.stateT > 1.5) {
      // continue into chaos mode (space / tap), or back to the title
      const c = victoryChaosButton();
      ctx.fillStyle = 'rgba(27,27,47,0.85)';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      const cols = ['#e63946', '#f4a261', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6'];
      for (let i = 0; i < c.w; i += 6) {
        ctx.fillStyle = cols[(Math.floor(i / 6) + Math.floor(G.t * 8)) % cols.length];
        ctx.fillRect(c.x + i, c.y + c.h - 3, 6, 3);
      }
      FONT.draw(ctx, STR.chaosButton, c.x + c.w / 2, c.y + 8, { scale: 2, color: Math.floor(G.t * 2) % 2 ? '#ffffff' : '#ffd56b', align: 'center' });
      button(victoryTitleButton(), STR.toTitle);
    }
  }

  function drawGameOver() {
    drawWorld();
    ctx.fillStyle = 'rgba(20,20,45,0.72)';
    ctx.fillRect(0, 0, W, H);
    FONT.draw(ctx, STR.gameOver, W / 2, 46, { scale: 6, color: '#e8364f', align: 'center', shadow: '#000' });
    if (G.chaos) {   // only chaos mode has points
      FONT.draw(ctx, `${STR.score} ${pad(G.score)}`, W / 2, 116, { scale: 3, color: '#ffffff', align: 'center' });
      const rec = G.newRecord ? STR.newRecord : `${STR.highScore} ${pad(G.high)}`;
      FONT.draw(ctx, rec, W / 2, 150, { scale: 2, color: G.newRecord ? '#ffd56b' : '#9fb3c8', align: 'center' });
    }
    if (G.stateT > 0.8 && Math.floor(G.t * 2) % 2 === 0) {
      FONT.draw(ctx, STR.tryAgain, W / 2, 196, { scale: 3, color: '#ffffff', align: 'center' });
    }
    button(gameOverTitleButton(), STR.toTitle);
  }

  function drawFade() {
    const a = G.fade.a;
    if (a <= 0) return;
    // whoosh: speed lines, then black
    ctx.fillStyle = `rgba(255,255,255,${0.5 * a})`;
    for (let i = 0; i < 14; i++) {
      const y = (i * 53 + G.t * 900) % H;
      const len = 60 + (i * 37) % 120;
      const x = W - ((G.t * 1600 + i * 211) % (W + len));
      ctx.fillRect(Math.round(x), Math.round(y), len, 2);
    }
    ctx.fillStyle = `rgba(10,10,25,${a})`;
    ctx.fillRect(0, 0, W, H);
  }

  function draw() {
    ctx.save();
    if (G.shake > 0) ctx.translate(Math.round((Math.random() - 0.5) * 6), Math.round((Math.random() - 0.5) * 6));
    switch (G.state) {
      case 'title': drawTitle(); break;
      case 'menu': drawMenu(); break;
      case 'comic': Comic.draw(ctx, G.t); break;
      case 'card': drawCard(); break;
      case 'play': drawWorld(); drawHUD(); break;
      case 'finale': drawFinale(); break;
      case 'victory': drawVictory(); break;
      case 'gameover': drawGameOver(); break;
    }
    ctx.restore();
    if (G.paused) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      FONT.draw(ctx, STR.paused, W / 2, 120, { scale: 5, color: '#ffffff', align: 'center' });
      FONT.draw(ctx, isTouchDevice() ? STR.pausedHintTouch : STR.pausedHintKeys, W / 2, 172, { scale: 2, color: '#ffd56b', align: 'center' });
    }
    drawFade();
    drawSoundButton();
    drawPauseButton();
    if (portraitBlock()) {
      ctx.fillStyle = '#1b1b2f';
      ctx.fillRect(0, 0, W, H);
      FONT.draw(ctx, STR.rotatePhone, W / 2, 130, { scale: 3, color: '#ffffff', align: 'center' });
    }
  }

  // ---------- scaling ----------
  function resize() {
    // fit inside #wrap (the screen minus notches), keeping the 8:3 shape
    const wrap = document.getElementById('wrap');
    const aw = (wrap && wrap.clientWidth) || window.innerWidth;
    const ah = (wrap && wrap.clientHeight) || window.innerHeight;
    const s = Math.min(aw / W, ah / H);
    canvas.style.width = Math.floor(W * s) + 'px';
    canvas.style.height = Math.floor(H * s) + 'px';
  }
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 200));
  if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
  document.addEventListener('fullscreenchange', resize);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && G.state === 'play') G.paused = true;
  });

  // ---------- main loop ----------
  let last = null;
  function frame(now) {
    if (last === null) last = now;
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
    last = now;
    if (dt > 0) G.fps = G.fps * 0.95 + (1 / dt) * 0.05;
    // physics in small steps; input edges only count once
    const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
    for (let i = 0; i < steps; i++) {
      update(dt / steps);
      if (i === 0) Input.endFrame();
    }
    draw();
    requestAnimationFrame(frame);
  }

  // ---------- start ----------
  ART.init();
  SOUND.init();
  BG.init();
  Input.init(canvas);
  loadHigh();
  resize();

  // Dev: expose the game state and one update step for automated tests
  if (CONFIG.DEV) { window.__G = G; window.__step = (dt) => { update(dt); Input.endFrame(); }; }
  if (dev('touch')) Input.isTouch = true;  // preview the phone hints on a desktop

  // Dev shortcuts via URL
  if (dev('level')) {
    const i = Math.max(1, Math.min(LEVELS.length, parseInt(params.get('level'), 10) || 1)) - 1;
    G.comicSeen = true;
    setupLevel(i);
    setState('play');
    if (dev('gate')) { G.score = G.levelStartScore + G.level.length; }
    // ?show=owl,snowhorse places those obstacles on screen right away (preview images)
    if (dev('show')) {
      params.get('show').split(',').forEach((key, i) => {
        const type = G.level.obstacles.find((ty) => ty.key === key);
        if (!type) return;
        Obstacles.list.push(Obstacles.make(type, G.level, 300 + i * 170, 0));
      });
    }
  } else if (dev('scene')) {
    const s = params.get('scene');
    G.comicSeen = true;
    if (s === 'comic') { Comic.start(() => transition(toTitle)); Comic.panel = parseInt(params.get('panel') || '0', 10); Comic.panelT = 5; setState('comic'); }
    if (s === 'finale') { G.score = 2468; startFinale(); }
    if (s === 'victory') { G.score = 2468; victory(); }
    if (s === 'chaos') startChaos();
    if (s === 'gameover') { setupLevel(0); G.score = 321; gameOver(); }
    if (s === 'card') { setupLevel(parseInt(params.get('n') || '0', 10)); G.cardFor = G.levelIndex; setState('card'); }
  }

  // Dev: ?export=obstacles draws every obstacle with the code art, crops it and puts
  // the PNGs (as data URLs) + placement info into <pre id="export"> for saving.
  if (dev('export')) {
    setTimeout(() => {
      const out = {};
      const cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      const c = cv.getContext('2d');
      for (const L of LEVELS) {
        for (const type of L.obstacles) {
          c.clearRect(0, 0, W, H);
          c.imageSmoothingEnabled = false;
          const pl = Obstacles.place(type, L);
          const o = { type, x: Math.round(400 - type.w / 2), y: pl.y, w: type.w, h: pl.h, seed: 0 };
          ART.drawObstacle(c, o, 0, true);
          const d = c.getImageData(0, 0, W, H).data;
          let x0 = W, y0 = H, x1 = -1, y1 = -1;
          for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            if (d[(y * W + x) * 4 + 3] > 0) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
          }
          const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
          const crop = document.createElement('canvas');
          crop.width = cw; crop.height = ch;
          crop.getContext('2d').drawImage(cv, x0, y0, cw, ch, 0, 0, cw, ch);
          out[type.key] = {
            png: crop.toDataURL('image/png'),
            dx: Math.round(x0 + cw / 2 - (o.x + o.w / 2)),
            bottom: (y1 + 1) - (o.y + o.h),
            h: ch,
          };
        }
      }
      const pre = document.createElement('pre');
      pre.id = 'export';
      pre.textContent = JSON.stringify(out);
      document.body.appendChild(pre);
    }, 1000);
  }

  // Dev: ?bot=1 plays automatically, ?sim=SECONDS fast-forwards before the first frame.
  // Result is written to the page title (for headless testing).
  function bot() {
    if (G.state === 'play' && G.phase === 'enter' && G.gate && G.gate.arrivedT > gateWait() + 0.1) Input.confirm = true;
    if (G.state !== 'play' || !G.player || G.phase !== 'run' && G.phase !== 'gate') return;
    const p = G.player, hb = p.hitbox(), sp = G.speed;
    let next = null;
    for (const o of Obstacles.list) if (o.x + o.w > hb.x - 2 && (!next || o.x < next.x)) next = o;
    Input._downKey = false;
    Input.upHeld = false;
    if (!next) return;
    const d = next.x - (hb.x + hb.w);
    const lead = { run: 0.12, glide: 0.45, swim: 0.15 }[p.mode] * (parseFloat(params.get('lead')) || 1);
    if (next.type.kind === 'low') {
      if (d < sp * lead) { Input.up = true; Input.upHeld = true; }
    } else if (d < sp * 0.3) {
      Input._downKey = true;
      if (!Input._botDown) Input.downPressed = true;
    }
    Input._botDown = Input._downKey;
  }
  if (dev('sim')) {
    const n = Math.round(parseFloat(params.get('sim')) * 120);
    let lostAt = [];
    const startState = G.state;
    let lives = G.lives;
    for (let i = 0; i < n; i++) {
      if (dev('bot')) bot();
      update(1 / 120);
      Input.endFrame();
      if (G.lives < lives) lostAt.push(`L${G.levelIndex + 1}:${G.lastHit || '?'}`);
      lives = G.lives;
      if (G.state !== startState && (G.state === 'victory' || G.state === 'gameover')) break;
    }
    document.title = `state=${G.state} level=${G.levelIndex + 1} chaos=${G.chaosN || 0} lives=${G.lives} score=${Math.floor(G.score)} lost=${lostAt.join(',')}`;
  }

  requestAnimationFrame(frame);
})();
