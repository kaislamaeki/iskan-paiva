// All pixel art, drawn in code. Most things are drawn in "art units":
// one unit = U canvas pixels, so everything shares the same chunky pixel size.
const ART = (() => {
  const U = 3;
  let C = null; // current context while drawing in unit space

  // ---------- helpers ----------
  function begin(ctx, x, y) {
    C = ctx;
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.scale(U, U);
  }
  function end() { C.restore(); }
  function r(x, y, w, h, col) { C.fillStyle = col; C.fillRect(x, y, w, h); }

  function sprite(rows, pal) {
    const h = rows.length;
    const w = Math.max(...rows.map((row) => row.length));
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const g = cv.getContext('2d');
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const col = pal[row[x]];
        if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); }
      }
    });
    return cv;
  }
  function blit(ctx, spr, x, y, scale = U) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(spr, Math.round(x), Math.round(y), spr.width * scale, spr.height * scale);
  }

  const OUT = '#2b2b3b';

  // ---------- people & heads ----------
  const PEOPLE = {
    // shirt colours match the face PNGs in assets/faces
    lauri:     { style: 'short',  hair: '#6b4226', skin: '#f1c4a0', shirt: '#6f8f4e', pants: '#3a3f55', cardigan: true },
    touko:     { style: 'kid',    hair: '#d4b148', skin: '#f1c4a0', shirt: '#27ae60', pants: '#34495e' },
    pyry:      { style: 'beanie', hair: '#ead27a', skin: '#f1c4a0', shirt: '#7d3c98', pants: '#2c3e50', hat: '#26262b' },
    annamaria: { style: 'long',   hair: '#c2402a', skin: '#f1c4a0', shirt: '#1e1e22', pants: '#3a3a44', dress: true },
    kaisla:    { style: 'long',   hair: '#b8955a', skin: '#f1c4a0', shirt: '#2e5fb8', pants: '#3a3f55', dress: true },
    dave:      { style: 'beard',  hair: '#6e4423', skin: '#f1c4a0', shirt: '#7f8c8d', pants: '#2c3e50' },
  };

  const FACE_ROWS = ['ssessssess', 'ssessssess', 'scsssssscs', '.sssmmsss.', '..ssssss..', '...ssss...'];
  const HEAD_STYLES = {
    short:  ['..hhhhhh..', '.hhhhhhhh.', 'hhhhhhhhhh', 'hssssssssh', ...FACE_ROWS],
    kid:    ['h.hh.hh.h.', 'hhhhhhhhhh', 'hhhhhhhhhh', 'hsshssshsh', ...FACE_ROWS],
    long:   ['..hhhhhh..', '.hhhhhhhh.', 'hhhhhhhhhh', 'hhsssssshh', 'hsessssesh', 'hsessssesh',
             'hcssssssch', 'hsssmmsssh', 'hhsssssshh', 'hh.ssss.hh'],
    bun:    ['...hhhh...', '..hhhhhh..', '.hhhhhhhh.', 'hhhhhhhhhh', 'hsessssesh', 'ssessssess',
             'scsssssscs', '.sssmmsss.', '..ssssss..', '...ssss...'],
    beard:  ['..hhhhhh..', '.hhhhhhhh.', 'hhhhhhhhhh', 'hssssssssh', 'ssessssess', 'ssessssess',
             'hssssssssh', 'hhhsmmshhh', '.hhhhhhhh.', '..hhhhhh..'],
    beanie: ['....ww....', '..tttttt..', '.tttttttt.', 'wwwwwwwwww', 'hsessssesh', 'ssessssess',
             'scsssssscs', '.sssmmsss.', '..ssssss..', '...ssss...'],
  };

  const heads = {};
  const faceImgs = {};

  function buildHeads() {
    for (const who in PEOPLE) {
      const P = PEOPLE[who];
      heads[who] = sprite(HEAD_STYLES[P.style], {
        h: P.hair, s: P.skin, e: OUT, c: '#f29a9a', m: '#b5524b', t: P.hat || P.hair, w: '#ffffff',
      });
    }
  }

  function loadFaces() {
    for (const who in FACES) {
      if (!FACES[who]) continue;
      const img = new Image();
      img.onload = () => { faceImgs[who] = img; };
      img.src = FACES[who];
    }
  }

  // Draw a head centred at (cx, cy). size = height in canvas px (30 in game).
  function drawHead(ctx, who, cx, cy, size = 30) {
    const img = faceImgs[who];
    if (img && img.height <= 64) {
      // small pixel-art face: whole-pixel scale, no smoothing (stays crisp).
      // Anchored at the chin so the neck meets the body; rows below the
      // chin (e.g. long hair) hang down beside the shoulders.
      const s = Math.max(1, Math.round(size / FACE_CHIN_ROW));
      blit(ctx, img, cx - img.width * s / 2, cy + size / 2 - FACE_CHIN_ROW * s, s);
      return;
    }
    if (img) {
      const h = size * 1.2;
      const w = h * img.width / img.height;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, Math.round(cx - w / 2), Math.round(cy - h / 2), w, h);
      ctx.imageSmoothingEnabled = false;
      return;
    }
    const spr = heads[who];
    blit(ctx, spr, cx - size / 2, cy - size / 2, size / spr.height);
  }

  // Shared simple body for everybody except Lauri's level bodies.
  // (x, y) = feet centre. pose: 'stand' | 'walk' | 'wave' | 'sit'
  function drawPerson(ctx, who, x, y, pose = 'stand', t = 0) {
    const P = PEOPLE[who];
    const f = Math.floor(t * 6) % 2;
    begin(ctx, x, y);
    if (pose !== 'sit') {
      if (pose === 'walk' && f === 0) {
        r(-3, -4, 2, 3, P.pants); r(1, -4, 2, 3, P.pants);
        r(-4, -1, 2, 1, OUT); r(2, -1, 2, 1, OUT);
      } else {
        r(-2, -4, 2, 3, P.pants); r(0, -4, 2, 3, P.pants);
        r(-2, -1, 2, 1, OUT); r(0, -1, 2, 1, OUT);
      }
    }
    r(-3, -9, 6, 5, P.shirt);
    if (P.cardigan) r(-1, -9, 2, 5, CARDIGAN_INNER);
    if (P.dress && pose !== 'sit') r(-4, -5, 8, 2, P.shirt);
    // arms
    if (pose === 'wave') {
      r(-4, -9, 1, 4, P.shirt); r(-4, -5, 1, 1, P.skin);
      const up = Math.floor(t * 4) % 2;
      if (up) { r(3, -12, 1, 3, P.shirt); r(3, -13, 1, 1, P.skin); }
      else { r(3, -11, 1, 2, P.shirt); r(4, -12, 1, 1, P.shirt); r(5, -13, 1, 1, P.skin); }
    } else {
      r(-4, -9, 1, 4, P.shirt); r(3, -9, 1, 4, P.shirt);
      r(-4, -5, 1, 1, P.skin); r(3, -5, 1, 1, P.skin);
    }
    end();
    drawHead(ctx, who, x, y - 14 * U);
  }

  // ---------- Lauri's level bodies ----------
  // Every body is drawn with (x, y) = anchor (see player.js), then the head.
  const LAURI = PEOPLE.lauri;
  const CARDIGAN_INNER = '#f4efe3'; // shirt showing under Lauri's open cardigan

  function bodyWalker(ctx, p, t, shirt, pants) {
    const skin = LAURI.skin;
    if (p.pose === 'duck') {
      // head-first slide
      begin(ctx, p.x, p.y);
      r(-13, -3, 2, 2, OUT);
      r(-11, -3, 5, 2, pants);
      r(-6, -4, 7, 3, shirt);
      r(-4, -4, 2, 1, '#ffffff');
      r(1, -2, 4, 1, shirt); r(5, -2, 1, 1, skin);
      // dust puffs
      const d = Math.floor(t * 10) % 3;
      r(-15 - d, -1, 1, 1, '#d8cbb0'); r(-17 - d, -2, 1, 1, '#d8cbb0');
      end();
      drawHead(ctx, 'lauri', p.x + 5 * U + 3, p.y - 5 * U);
      return;
    }
    const bob = (p.pose === 'run' && p.frame % 2 === 1) ? -1 : 0;
    begin(ctx, p.x, p.y + bob * U);
    if (p.pose === 'jump') {
      r(-3, -4, 2, 2, pants); r(1, -5, 2, 2, pants);
      r(-4, -2, 2, 1, OUT); r(2, -3, 2, 1, OUT);
      r(-3, -9, 6, 5, shirt); r(-1, -9, 2, 5, CARDIGAN_INNER);
      r(-4, -12, 1, 4, shirt); r(3, -12, 1, 4, shirt);
      r(-4, -13, 1, 1, skin); r(3, -13, 1, 1, skin);
    } else {
      const f = p.frame % 4;
      if (f === 0 || f === 2) {
        const a = f === 0 ? 0 : 1;
        r(-3, -4, 2, 3, pants); r(1, -4, 2, 3, pants);
        r(-4, -1, 2, 1, OUT); r(2, -1, 2, 1, OUT);
        r(-3, -9, 6, 5, shirt); r(-1, -9, 2, 5, CARDIGAN_INNER);
        // swinging arms
        r(3, -8 + a, 2, 1, shirt); r(5, -8 + a, 1, 1, skin);
        r(-5, -7 - a, 2, 1, shirt); r(-6, -7 - a, 1, 1, skin);
      } else {
        r(-2, -4, 4, 3, pants); r(0, -4, 1, 3, '#2c3044');
        r(-2, -1, 3, 1, OUT); r(0, -1, 3, 1, OUT);
        r(-3, -9, 6, 5, shirt); r(-1, -9, 2, 5, CARDIGAN_INNER);
        r(-4, -9, 1, 3, shirt); r(3, -9, 1, 3, shirt);
        r(-4, -6, 1, 1, skin); r(3, -6, 1, 1, skin);
      }
    }
    end();
    drawHead(ctx, 'lauri', p.x, p.y + bob * U - 14 * U);
  }

  function bodySki(ctx, p, t) {
    const jacket = LAURI.shirt, pants = '#2c3e66', ski = '#f1c40f', pole = '#bdc3c7';
    const skin = LAURI.skin;
    begin(ctx, p.x, p.y);
    // skis
    r(-8, -1, 16, 1, ski); r(8, -2, 1, 1, ski);
    if (p.pose === 'duck') {
      r(-2, -3, 4, 2, pants);
      r(-4, -5, 7, 2, jacket);
      r(2, -4, 3, 1, jacket); r(5, -4, 1, 1, skin);
      // poles tucked under arms
      for (let i = 0; i < 6; i++) r(-3 - i, -4 + Math.floor(i / 3), 1, 1, pole);
      end();
      drawHead(ctx, 'lauri', p.x + 3 * U, p.y - 8 * U);
      return;
    }
    const f = p.frame % 2;
    r(-2, -4, 4, 3, pants); r(-1, -2, 1, 1, '#1f2b4a');
    r(-3, -9, 6, 5, jacket); r(-3, -6, 6, 1, '#ffffff');
    if (p.pose === 'jump') {
      r(-5, -10, 2, 1, jacket); r(3, -10, 2, 1, jacket);
      r(-6, -10, 1, 1, skin); r(5, -10, 1, 1, skin);
      for (let i = 0; i < 6; i++) { r(-6 - i, -9 + i, 1, 1, pole); r(5 + i, -9 + i, 1, 1, pole); }
    } else if (f === 0) {
      // poles planted behind
      r(-5, -7, 2, 1, jacket); r(-6, -7, 1, 1, skin);
      for (let i = 0; i < 7; i++) r(-6 - Math.floor(i / 2), -6 + i, 1, 1, pole);
      r(3, -8, 2, 1, jacket); r(5, -8, 1, 1, skin);
    } else {
      // poles swinging forward
      r(3, -7, 2, 1, jacket); r(5, -7, 1, 1, skin);
      for (let i = 0; i < 7; i++) r(5 + Math.floor(i / 2), -6 + i, 1, 1, pole);
      r(-5, -8, 2, 1, jacket); r(-6, -8, 1, 1, skin);
    }
    end();
    drawHead(ctx, 'lauri', p.x, p.y - 14 * U);
  }

  function bodyHorse(ctx, p, t) {
    const coat = '#a5683b', dark = '#5a3620', hoof = '#2b2b2b', light = '#c98d5c';
    const shirt = LAURI.shirt, pants = LAURI.pants, skin = LAURI.skin;
    const f = p.frame % 3;
    const duck = p.pose === 'duck';
    const jump = p.pose === 'jump';
    begin(ctx, p.x, p.y);
    // tail
    r(-8, -8, 2, 1, dark); r(-9, -7, 2, 2, dark); r(-9, -5, 1, 1, dark);
    // legs: [x, lower offset per frame]
    const legs = [[-5, [-1, 0, 1]], [-3, [0, 1, -1]], [3, [1, -1, 0]], [5, [0, 0, 1]]];
    for (const [lx, offs] of legs) {
      const o = jump ? (lx < 0 ? -1 : 1) : offs[f];
      r(lx, -4, 1, 2, coat);
      r(lx + o, -2, 1, 1, coat);
      r(lx + o, -1, 1, 1, hoof);
    }
    // body
    r(-6, -8, 12, 4, coat);
    r(-5, -5, 10, 1, light);
    // neck + head
    if (duck) {
      r(4, -9, 3, 3, coat); r(4, -10, 1, 3, dark);
      r(6, -10, 5, 3, coat); r(10, -9, 2, 2, light); r(8, -10, 1, 1, OUT); r(6, -11, 1, 1, coat);
    } else {
      r(4, -11, 3, 4, coat); r(4, -12, 1, 5, dark);
      r(5, -13, 5, 3, coat); r(9, -12, 2, 2, light); r(8, -12, 1, 1, OUT); r(6, -14, 1, 1, coat);
    }
    // saddle
    r(-2, -9, 4, 1, '#7b2d26');
    if (p.noRider) { end(); return; }
    // rider
    if (duck) {
      r(-3, -10, 6, 2, shirt);
      r(-1, -8, 2, 1, pants); r(0, -7, 1, 2, pants); r(0, -5, 2, 1, OUT);
      end();
      drawHead(ctx, 'lauri', p.x + 4 * U, p.y - 11 * U);
    } else {
      r(-2, -13, 4, 4, shirt); r(-1, -13, 2, 1, '#ffffff');
      r(-1, -9, 3, 1, pants); r(1, -8, 1, 3, pants); r(1, -5, 2, 1, OUT);
      r(2, -12, 2, 1, shirt); r(4, -12, 1, 1, skin);
      // reins
      r(5, -12, 1, 1, '#4a2c1a');
      end();
      drawHead(ctx, 'lauri', p.x, p.y - 18 * U);
    }
  }

  const CANOPY_LAURI = ['#e2463a', '#f39a2b', '#f7cf3d', '#f39a2b', '#e2463a'];
  const CANOPY_OTHER = ['#2d6cdf', '#38b6a0', '#e8f1f2', '#38b6a0', '#2d6cdf'];

  // canopy centred at (cx, cy) in canvas px, half width hw units
  function canopy(ctx, cx, cy, hw, cols) {
    begin(ctx, cx, cy);
    for (let x = -hw; x <= hw; x++) {
      const k = 1 - (x / (hw + 0.5)) ** 2;
      const top = -Math.round(Math.sqrt(Math.max(0, k)) * hw * 0.32);
      const stripe = Math.min(cols.length - 1, Math.floor((x + hw) / ((2 * hw + 1) / cols.length)));
      r(x, top, 1, 3, cols[stripe]);
      r(x, top + 2, 1, 1, 'rgba(0,0,0,0.18)');
    }
    end();
  }
  function lines(ctx, x1, y1, x2, y2) {
    ctx.fillStyle = 'rgba(42,52,70,0.55)';
    const n = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
    for (let i = 0; i <= n; i += 1) {
      ctx.fillRect(Math.round(x1 + (x2 - x1) * i / n), Math.round(y1 + (y2 - y1) * i / n), 1, 1);
    }
  }

  function bodyGlide(ctx, p, t) {
    const cx = p.x, cy = p.y;
    const cTop = cy - 78;
    // lines from canopy to hands
    lines(ctx, cx - 42, cTop + 4, cx - 9, cy - 18);
    lines(ctx, cx - 20, cTop - 4, cx - 8, cy - 18);
    lines(ctx, cx + 20, cTop - 4, cx + 8, cy - 18);
    lines(ctx, cx + 42, cTop + 4, cx + 9, cy - 18);
    canopy(ctx, cx, cTop, 15, CANOPY_LAURI);
    // Lauri's new electric paramotor on his back: a caged propeller (not on the title screen)
    if (!p.noMotor) {
      begin(ctx, cx - 7 * U, cy - 4 * U);
      for (let i = 0; i < 28; i++) {
        const a = i / 28 * Math.PI * 2;
        r(Math.round(Math.cos(a) * 6), Math.round(Math.sin(a) * 6), 1, 1, '#5d6670');
      }
      const blade = 'rgba(235,238,242,0.9)';
      const pa = Math.floor(t * 40) % 4;
      for (let i = 1; i <= 5; i++) {
        if (pa === 0) { r(0, -i, 1, 1, blade); r(0, i, 1, 1, blade); }
        else if (pa === 1) { r(i - 1, -i + 1, 1, 1, blade); r(-i + 1, i - 1, 1, 1, blade); }
        else if (pa === 2) { r(-i, 0, 1, 1, blade); r(i, 0, 1, 1, blade); }
        else { r(i - 1, i - 1, 1, 1, blade); r(-i + 1, -i + 1, 1, 1, blade); }
      }
      r(-1, -1, 3, 3, '#2b2b3b'); r(0, 0, 1, 1, '#4caf50');   // motor hub
      r(3, -1, 4, 2, '#5d6670');                            // frame to the harness
      r(5, 1, 2, 4, '#2c3e50'); r(5, 2, 2, 1, '#4caf50');   // battery pack
      end();
      // a bit of moving air behind the propeller
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      for (let i = 0; i < 3; i++) {
        const k = (t * 3 + i / 3) % 1;
        ctx.fillRect(Math.round(cx - 7 * U - 22 - k * 24), Math.round(cy - 4 * U - 10 + i * 10), 8, 1);
      }
    }
    const f = p.frame % 2;
    begin(ctx, cx, cy);
    // harness/seat
    r(-3, -1, 7, 3, '#34495e');
    r(-3, -5, 6, 4, LAURI.shirt); r(-1, -5, 2, 4, CARDIGAN_INNER);
    // arms up to the brakes
    r(-4, -6, 1, 3, LAURI.shirt); r(3, -6, 1, 3, LAURI.shirt);
    r(-4, -7, 1, 1, LAURI.skin); r(3, -7, 1, 1, LAURI.skin);
    // dangling legs
    r(2, 2, 2, 1, LAURI.pants); r(3 + f, 3, 1, 2, LAURI.pants); r(3 + f, 5, 2, 1, OUT);
    r(-1, 2, 2, 1, LAURI.pants); r(0 + (1 - f), 3, 1, 2, LAURI.pants); r(0 + (1 - f), 5, 2, 1, OUT);
    end();
    drawHead(ctx, 'lauri', cx, cy - 10 * U);
  }

  function bodySwim(ctx, p, t) {
    const skin = LAURI.skin, trunks = '#d63c3c';
    const f = p.frame % 3;
    if (p.pose === 'swim') {
      begin(ctx, p.x, p.y);
      // body under the surface
      r(-12, 1, 10, 3, skin); r(-6, 1, 3, 3, trunks);
      const k = Math.floor(t * 8) % 2;
      r(-17, 1 + k, 5, 1, skin); r(-17, 3 - k, 5, 1, skin);
      // arm strokes
      if (f === 0) { r(3, -5, 1, 4, skin); r(3, -6, 2, 1, skin); }
      else if (f === 1) { r(4, -1, 5, 1, skin); }
      else { r(-5, -6, 1, 4, skin); r(-6, -7, 2, 1, skin); }
      end();
      drawHead(ctx, 'lauri', p.x, p.y - 4 * U);
      // splashes
      begin(ctx, p.x, p.y);
      const s = Math.floor(t * 10) % 3;
      r(6 + s, -1, 1, 1, '#ffffff'); r(-8 - s, -1, 1, 1, '#ffffff');
      end();
    } else {
      // leap / dive: stretched body
      const down = p.pose === 'dive' || p.vy > 120;
      begin(ctx, p.x, p.y);
      const o = down ? 1 : -1;
      r(-17, 1 - o, 5, 2, skin);
      r(-12, 0, 3, 3, trunks);
      r(-9, 0, 7, 3, skin);
      r(2, -1 + o, 6, 1, skin);
      end();
      drawHead(ctx, 'lauri', p.x + 1, p.y - 1 * U);
    }
  }

  // Draw Lauri for a given body set
  function drawLauri(ctx, set, p, t) {
    switch (set) {
      case 'office': return bodyWalker(ctx, p, t, LAURI.shirt, LAURI.pants);
      case 'home':   return bodyWalker(ctx, p, t, LAURI.shirt, LAURI.pants);
      case 'ski':    return bodySki(ctx, p, t);
      case 'horse':  return bodyHorse(ctx, p, t);
      case 'glide':  return bodyGlide(ctx, p, t);
      case 'swim':   return bodySwim(ctx, p, t);
    }
  }

  // ---------- small sprites ----------
  let SPR = {};
  function buildSprites() {
    SPR.heart = sprite(['.rr.rr.', 'rwrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'],
      { r: '#e8364f', w: '#ffb3c0' });
    SPR.heartEmpty = sprite(['.rr.rr.', 'r..r..r', 'r.....r', '.r...r.', '..r.r..', '...r...'],
      { r: '#6b6b80' });
    SPR.bird = [
      sprite(['k.....k', '.k...k.', '..kok..', '...k...'], { k: '#3a4a63', o: '#f39a2b' }),
      sprite(['.......', '..kok..', '.k...k.', 'k.....k'], { k: '#3a4a63', o: '#f39a2b' }),
    ];
    SPR.duck = [
      sprite([
        '...gg.....',
        '..gegy....',
        '..ggyy..ww',
        '...bbbbww.',
        '..bbbbbbb.',
        '...bbbbb..',
      ], { g: '#2e7d4f', e: OUT, y: '#f2a23a', b: '#9b7653', w: '#d9cfc0' }),
      sprite([
        '...gg.....',
        '..gegy.ww.',
        '..ggyywww.',
        '...bbbbb..',
        '..bbbbbbb.',
        '...bbbbb..',
      ], { g: '#2e7d4f', e: OUT, y: '#f2a23a', b: '#9b7653', w: '#d9cfc0' }),
    ];
    SPR.sock = sprite([
      '..rrrr',
      '..wwww',
      '..rrrr',
      '..wwww',
      '..rrrr',
      'rrrrrr',
      'rrrrrr',
      '.rrrr.',
    ], { r: '#d9534f', w: '#f5e6d3' });
    SPR.beanie = sprite([
      '...ww...',
      '..bbbb..',
      '.bbbbbb.',
      'bbbbbbbb',
      'bybybyby',
      'yyyyyyyy',
    ], { b: '#3f72af', y: '#f2c94c', w: '#ffffff' });
    SPR.gloves = sprite([
      'g.g.......',
      'g.g.g.....',
      'ggggg.g.g.',
      'gggggg.g.g',
      '.ggggggggg',
      '.wwww.gggg',
      '......wwww',
    ], { g: '#6aa84f', w: '#f5e6d3' });
    SPR.glasses = sprite([
      'k..............k',
      'kkkkkkk..kkkkkkk',
      '.kbbbbk..kbbbbk.',
      '.kwbbbkkkkwbbbk.',
      '.kbbbbk..kbbbbk.',
      '..kkkk....kkkk..',
    ], { k: OUT, b: '#4b6584', w: '#c7ecee' });
  }

  // ---------- obstacles ----------
  // Each gets the obstacle (hitbox x, y, w, h) and draws around it.
  // Visuals are a bit bigger than hitboxes on purpose (forgiving).
  const bob = (t, o, amp = 1, speed = 6) => Math.round(Math.sin(t * speed + (o.seed || 0)) * amp);

  const OB = {
    // --- office
    box(ctx, o) {
      begin(ctx, o.x + o.w / 2, o.y + o.h);
      r(-6, -11, 12, 11, '#c08a52'); r(-6, -11, 12, 1, '#d9a86e'); r(5, -11, 1, 11, '#9c6d3f');
      r(-1, -11, 2, 4, '#ead7a8'); r(-4, -6, 4, 3, '#f4efe3'); r(-4, -5, 3, 1, '#d94a3a');
      end();
    },
    desk(ctx, o) {
      begin(ctx, o.x + o.w / 2, o.y + o.h);
      r(-8, -9, 16, 2, '#8d6e63'); r(-8, -9, 16, 1, '#a98f84');
      r(-7, -7, 1, 7, '#5d4037'); r(6, -7, 1, 7, '#5d4037');
      r(1, -7, 5, 4, '#795548'); r(3, -6, 1, 1, '#e0d6cf');
      r(-6, -12, 3, 3, '#e74c3c'); r(-3, -11, 1, 1, '#e74c3c');
      r(0, -10, 5, 1, '#ffffff'); r(1, -11, 4, 1, '#f1f1f1');
      end();
    },
    glasses(ctx, o, t) {
      const b = bob(t, o, 2, 7);
      blit(ctx, SPR.glasses, o.x + o.w / 2 - 24, o.y + o.h / 2 - 9 + b);
    },
    paper(ctx, o, t) {
      const f = Math.floor(t * 6 + (o.seed || 0)) % 2;
      begin(ctx, o.x + o.w / 2, o.y + o.h / 2 + bob(t, o, 2, 5));
      if (f === 0) {
        r(-4, -4, 8, 8, '#ffffff'); r(2, -4, 2, 2, '#d9d9d9');
        r(-3, -2, 5, 1, '#9fb3c8'); r(-3, 0, 6, 1, '#9fb3c8'); r(-3, 2, 4, 1, '#9fb3c8');
      } else {
        for (let i = 0; i < 8; i++) r(-4 + (i >> 2), -4 + i, 8, 1, '#ffffff');
        r(-3, -2, 5, 1, '#9fb3c8'); r(-2, 0, 5, 1, '#9fb3c8'); r(-2, 2, 4, 1, '#9fb3c8');
      }
      end();
    },

    // --- paragliding
    tree(ctx, o) {
      const cx = o.x + o.w / 2, base = o.y + o.h;
      begin(ctx, cx, base);
      r(-1, -4, 2, 4, '#6d4c41');
      const H = 46;
      for (let y = 4; y <= H; y++) {
        const p = (y - 4) / (H - 4);
        const hw = Math.max(1, Math.round((1 - p) * 6 + ((y + 3) % 7) * 0.45));
        r(-hw, -y, hw * 2, 1, '#2f6e40');
        r(-hw, -y, 1, 1, '#3f8a52');
        r(hw - 1, -y, 1, 1, '#24573a');
      }
      end();
    },
    powerline(ctx, o) {
      const cx = o.x + o.w / 2, base = o.y + o.h;
      begin(ctx, cx, base);
      for (const px of [-15, 14]) {
        r(px, -43, 2, 43, '#7a5a3a'); r(px, -43, 1, 43, '#8d6a47');
        r(px - 4, -41, 10, 1, '#5e4329');
        r(px - 4, -42, 1, 1, '#ecf0f1'); r(px + 1, -42, 1, 1, '#ecf0f1'); r(px + 5, -42, 1, 1, '#ecf0f1');
      }
      end();
      // three sagging wires
      ctx.fillStyle = '#2b2b3b';
      for (const off of [-4, 1, 5]) {
        const x1 = cx + (-15 + off) * U, x2 = cx + (14 + off) * U;
        for (let x = x1; x <= x2; x++) {
          const k = (x - x1) / (x2 - x1);
          const sag = Math.sin(k * Math.PI) * 10;
          ctx.fillRect(Math.round(x), Math.round(base - 42 * U + sag), 1, 2);
        }
      }
    },
    birds(ctx, o, t) {
      const f = Math.floor(t * 6 + (o.seed || 0)) % 2;
      const cx = o.x + o.w / 2;
      const pos = [[-8, 2], [6, 18], [-4, 36], [8, 52]];
      for (const [dx, dy] of pos) blit(ctx, SPR.bird[(f + (dy > 20 ? 1 : 0)) % 2], cx + dx - 10, o.y + dy + bob(t, o, 1, 4));
    },
    glider(ctx, o, t) {
      const cx = o.x + o.w / 2;
      const b = bob(t, o, 1, 3);
      const cTop = o.y + 2 + b;
      const py = o.y + o.h - 10 + b;
      lines(ctx, cx - 26, cTop + 4, cx - 4, py - 8);
      lines(ctx, cx + 26, cTop + 4, cx + 4, py - 8);
      lines(ctx, cx - 10, cTop - 2, cx - 3, py - 8);
      lines(ctx, cx + 10, cTop - 2, cx + 3, py - 8);
      canopy(ctx, cx, cTop, 10, CANOPY_OTHER);
      begin(ctx, cx, py);
      r(-2, -6, 4, 2, '#f1c40f'); r(-2, -4, 4, 1, '#f1c4a0'); // helmet + face
      r(-2, -3, 4, 3, '#8e44ad'); r(-1, 0, 2, 2, '#34495e'); r(-1, 2, 1, 1, OUT); r(1, 2, 1, 1, OUT);
      end();
    },

    // --- horse
    fence(ctx, o) {
      begin(ctx, o.x + o.w / 2, o.y + o.h);
      r(-7, -9, 14, 2, '#a86f45'); r(-7, -5, 14, 2, '#a86f45');
      r(-7, -9, 14, 1, '#c48a5c'); r(-7, -5, 14, 1, '#c48a5c');
      r(-6, -11, 2, 11, '#8d5a3b'); r(4, -11, 2, 11, '#8d5a3b');
      r(-6, -11, 2, 1, '#6b4128'); r(4, -11, 2, 1, '#6b4128');
      r(-8, -1, 3, 1, '#6aa84f'); r(6, -1, 3, 1, '#6aa84f');
      end();
    },
    lowglider(ctx, o, t) {
      const cx = o.x + o.w / 2;
      const b = bob(t, o, 1, 3);
      const py = o.y + 12 + b;
      const cTop = py - 58;
      lines(ctx, cx - 30, cTop + 4, cx - 4, py - 6);
      lines(ctx, cx + 30, cTop + 4, cx + 4, py - 6);
      lines(ctx, cx - 12, cTop - 2, cx - 3, py - 6);
      lines(ctx, cx + 12, cTop - 2, cx + 3, py - 6);
      canopy(ctx, cx, cTop, 11, ['#9b59b6', '#f78fb3', '#ffffff', '#f78fb3', '#9b59b6']);
      begin(ctx, cx, py);
      r(-2, -6, 4, 2, '#e74c3c'); r(-2, -4, 4, 1, '#f1c4a0');
      r(-2, -3, 4, 3, '#16a085'); r(-1, 0, 2, 2, '#34495e'); r(-1, 2, 1, 2, OUT); r(1, 2, 1, 2, OUT);
      end();
    },

    // --- swimming (y of these extends to the lake bottom)
    log(ctx, o, t) {
      const cx = o.x + o.w / 2, sy = CONFIG.SWIM.surfaceY;
      begin(ctx, cx, sy + bob(t, o, 0.6, 3));
      const depth = Math.round((CONFIG.SWIM.bottomY - sy) / U);
      for (const sx of [-6, -2, 3, 7]) {
        for (let y = 2; y < depth; y++) {
          const w = Math.round(Math.sin(y * 0.5 + t * 2 + sx) * 1);
          r(sx + w, y, 1, 1, y % 3 ? '#4f7f3a' : '#6b9b47');
        }
      }
      r(-9, -2, 18, 4, '#7b5236'); r(-9, -2, 18, 1, '#94673f');
      r(-10, -2, 2, 4, '#c49a6c'); r(-9, -1, 1, 2, '#8a6a45');
      r(-3, -1, 4, 1, '#5e3d26'); r(4, 0, 3, 1, '#5e3d26');
      r(2, -4, 1, 2, '#5e3d26'); r(3, -5, 2, 1, '#6aa84f');
      end();
    },
    buoy(ctx, o, t) {
      const cx = o.x + o.w / 2, sy = CONFIG.SWIM.surfaceY;
      const b = bob(t, o, 1, 3);
      begin(ctx, cx, sy);
      const depth = Math.round((CONFIG.SWIM.bottomY - sy) / U);
      for (let y = 2; y < depth; y += 2) r(0, y, 1, 1, '#555b66');
      r(-1, depth - 2, 3, 2, '#666');
      r(-3, -6 + b, 6, 2, '#e74c3c'); r(-3, -4 + b, 6, 2, '#ffffff'); r(-3, -2 + b, 6, 3, '#e74c3c');
      r(-3, -6 + b, 1, 7, 'rgba(255,255,255,0.3)');
      r(0, -9 + b, 1, 3, OUT); r(-1, -10 + b, 3, 1, '#f1c40f');
      end();
    },
    rock(ctx, o) {
      const cx = o.x + o.w / 2, sy = CONFIG.SWIM.surfaceY;
      begin(ctx, cx, sy);
      const depth = Math.round((CONFIG.SWIM.bottomY - sy) / U) + 1;
      for (let y = -9; y < depth; y++) {
        const hw = Math.min(8, 3 + Math.round((y + 9) * 0.5));
        r(-hw, y, hw * 2, 1, '#8a8f99');
        r(-hw, y, 2, 1, '#a9aeb8');
        r(hw - 2, y, 2, 1, '#6b707a');
      }
      r(-2, -10, 4, 1, '#8a8f99'); r(-2, -10, 3, 1, '#6a8f4e'); r(-3, -9, 2, 1, '#6a8f4e');
      r(-5, -1, 10, 1, 'rgba(255,255,255,0.7)');
      end();
    },
    duck(ctx, o, t) {
      const f = Math.floor(t * 7 + (o.seed || 0)) % 2;
      const sy = CONFIG.SWIM.surfaceY;
      blit(ctx, SPR.duck[f], o.x + o.w / 2 - 15, sy - 22 + bob(t, o, 1, 5));
      ctx.fillStyle = '#ffffff';
      const s = Math.floor(t * 10) % 3;
      ctx.fillRect(Math.round(o.x + o.w / 2 + 12 + s * 3), sy - 2, 3, 3);
    },
    boat(ctx, o, t) {
      const cx = o.x + o.w / 2, sy = CONFIG.SWIM.surfaceY;
      const b = bob(t, o, 0.6, 2);
      // people
      drawPerson(ctx, 'kaisla', cx - 6 * U, sy - 1 * U + b * U, 'sit', t);
      drawPerson(ctx, 'dave', cx + 6 * U, sy - 1 * U + b * U, 'sit', t);
      begin(ctx, cx, sy + b);
      // oars
      const of = Math.floor(t * 3) % 2;
      for (let i = 0; i < 6; i++) { r(-2 - i, -4 + i, 1, 1, '#c49a6c'); r(2 + i, -4 + i, 1, 1, '#c49a6c'); }
      r(-9 - of, 1, 2, 1, '#c49a6c'); r(8 + of, 1, 2, 1, '#c49a6c');
      // hull
      r(-15, -4, 30, 2, '#b5653a'); r(-15, -4, 30, 1, '#d08050');
      r(-14, -2, 28, 2, '#8b4513'); r(-12, 0, 24, 2, '#7a3b10'); r(-10, 2, 20, 1, '#6a320d');
      r(-16, -5, 2, 1, '#b5653a'); r(14, -5, 2, 1, '#b5653a');
      end();
    },
    branch(ctx, o, t) {
      const cx = o.x + o.w / 2;
      begin(ctx, cx, 0);
      // bough from off-screen
      r(-40, 12, 50, 3, '#6d4c41'); r(-40, 12, 50, 1, '#8d6e63'); r(5, 14, 6, 2, '#6d4c41');
      // willow strands
      const bottom = Math.round(CONFIG.SWIM.highBottom / U) + 1;
      for (let i = 0; i < 9; i++) {
        const sx = -8 + i * 2;
        const top = 14 + (i % 3);
        for (let y = top; y < bottom - (i % 2) * 2; y++) {
          const sw = Math.round(Math.sin(t * 1.5 + y * 0.12 + i) * (y - top) / 25);
          r(sx + sw, y, 1, 1, (y + i) % 3 ? '#7fb24a' : '#5c8f34');
        }
      }
      end();
    },

    // --- skiing
    skirock(ctx, o) {
      begin(ctx, o.x + o.w / 2, o.y + o.h);
      r(-5, -6, 10, 6, '#7f8c8d'); r(-4, -7, 8, 1, '#7f8c8d'); r(-6, -3, 12, 3, '#6c7a7b');
      r(-4, -8, 7, 2, '#ffffff'); r(-5, -7, 3, 1, '#ffffff'); r(2, -7, 2, 1, '#e8f4ff');
      r(-4, -4, 2, 1, '#95a5a6');
      end();
    },
    snowman(ctx, o, t) {
      begin(ctx, o.x + o.w / 2, o.y + o.h);
      r(-5, -6, 10, 6, '#ffffff'); r(-4, -7, 8, 1, '#ffffff'); r(-6, -4, 12, 3, '#ffffff');
      r(-4, -11, 8, 4, '#ffffff'); r(-3, -12, 6, 1, '#ffffff');
      r(-3, -15, 6, 3, '#ffffff'); r(-2, -16, 4, 1, '#ffffff');
      r(3, -6, 2, 5, '#dfe9f3'); r(3, -11, 1, 4, '#dfe9f3');
      r(-1, -14, 1, 1, OUT); r(1, -14, 1, 1, OUT); r(0, -13, 2, 1, '#f39c12');
      r(-4, -12, 8, 1, '#d64541'); r(2, -12, 1, 3, '#d64541');
      r(0, -9, 1, 1, OUT); r(0, -7, 1, 1, OUT);
      r(-3, -18, 6, 2, OUT); r(-4, -16, 8, 1, OUT);
      r(-7, -10, 3, 1, '#6d4c41'); r(4, -10, 3, 1, '#6d4c41');
      end();
    },
    snowbranch(ctx, o, t) {
      const cx = o.x + o.w / 2;
      const by = o.y + o.h;
      begin(ctx, cx, by);
      const len = Math.round(by / U);
      // heavy snowy bough bending down from above
      for (let y = -len; y < -2; y++) {
        const k = (y + len) / len;
        const x = Math.round(-20 + Math.sqrt(k) * 20);
        r(x, y, 3, 1, '#5d4037');
        if (y % 4 === 0) {
          r(x - 4, y, 4, 2, '#2f6e40'); r(x + 3, y + 1, 4, 2, '#24573a');
          r(x - 4, y - 1, 4, 1, '#ffffff'); r(x + 3, y, 4, 1, '#ffffff');
        }
      }
      // needles + snow clumps at the end
      r(-7, -7, 11, 3, '#2f6e40'); r(-5, -4, 9, 2, '#2f6e40'); r(-3, -2, 6, 2, '#24573a');
      r(-7, -8, 11, 1, '#ffffff'); r(-5, -5, 3, 1, '#ffffff'); r(1, -4, 3, 1, '#ffffff'); r(-2, -2, 2, 1, '#ffffff');
      end();
    },
    liftchair(ctx, o, t) {
      const cx = o.x + o.w / 2;
      const top = 58;
      const sw = bob(t, o, 1, 2);
      begin(ctx, cx, o.y + o.h);
      const rise = Math.round((o.y + o.h - top) / U);
      r(0 + sw, -rise, 1, rise - 6, '#7f8c8d');
      r(-1 + sw, -rise, 3, 1, '#555');
      r(-5 + sw, -7, 10, 1, '#7f8c8d');
      r(-5 + sw, -6, 1, 4, '#7f8c8d'); r(4 + sw, -6, 1, 4, '#7f8c8d');
      r(-5 + sw, -2, 10, 2, '#2980b9'); r(-5 + sw, -6, 10, 2, '#3498db');
      r(-5 + sw, -3, 10, 1, '#7f8c8d');
      end();
    },
    snowball(ctx, o, t) {
      const cx = o.x + o.w / 2, cy = o.y + o.h / 2;
      begin(ctx, cx, cy);
      r(-2, -3, 4, 6, '#ffffff'); r(-3, -2, 6, 4, '#ffffff'); r(1, 0, 2, 2, '#dfe9f3');
      const k = Math.floor(t * 12) % 2;
      r(5, -1, 3, 1, 'rgba(255,255,255,0.6)'); r(6 + k, 1, 3, 1, 'rgba(255,255,255,0.4)');
      end();
    },

    // --- wife's office
    books(ctx, o) {
      begin(ctx, o.x + o.w / 2, o.y + o.h);
      const bks = [[-5, 10, '#c0392b'], [-4, 8, '#2980b9'], [-6, 11, '#27ae60'], [-4, 9, '#8e44ad'], [-3, 7, '#f39c12']];
      let y = 0;
      for (const [x, w, c] of bks) { y -= 2; r(x, y, w, 2, c); r(x, y, w, 1, 'rgba(255,255,255,0.25)'); r(x + w - 2, y + 1, 2, 1, '#f5f0e1'); }
      end();
    },
    yarn(ctx, o, t) {
      const cx = o.x + o.w / 2, base = o.y + o.h;
      begin(ctx, cx, base);
      const c = '#e84393', d = '#b83280';
      r(-3, -8, 6, 8, c); r(-4, -7, 8, 6, c);
      const f = Math.floor(t * 8) % 3;
      for (let i = 0; i < 3; i++) r(-3 + ((i * 2 + f) % 6), -7 + i * 2, 3, 1, d);
      r(-2, -6, 1, 1, '#fdcfe8');
      r(4, -1, 6, 1, c); r(10, -1, 1, 1, c);
      end();
    },
    sock(ctx, o, t) { blit(ctx, SPR.sock, o.x + o.w / 2 - 9, o.y + o.h / 2 - 12 + bob(t, o, 2, 6)); },
    beanie(ctx, o, t) { blit(ctx, SPR.beanie, o.x + o.w / 2 - 12, o.y + o.h / 2 - 9 + bob(t, o, 2, 6)); },
    gloves(ctx, o, t) { blit(ctx, SPR.gloves, o.x + o.w / 2 - 15, o.y + o.h / 2 - 10 + bob(t, o, 2, 6)); },
  };

  // Obstacle images: assets/obstacles/<key>.png (see js/obstacle-images.js).
  // Replace a png to change how that obstacle looks; any size works, it is
  // scaled to the original height and stands on the same spot.
  const obstacleImgs = {};
  function loadObstacleImages() {
    if (typeof OBSTACLE_IMAGES === 'undefined') return;
    for (const key in OBSTACLE_IMAGES) {
      const img = new Image();
      img.onload = () => { obstacleImgs[key] = img; };
      img.src = 'assets/obstacles/' + key + '.png';
    }
  }

  function drawObstacle(ctx, o, t, codeOnly = false) {
    const img = !codeOnly && obstacleImgs[o.type.key];
    if (img) {
      const m = OBSTACLE_IMAGES[o.type.key];
      const s = m.h / img.height;
      const w = img.width * s, h = m.h;
      const flying = o.type.kind === 'high' && o.type.key !== 'branch' && o.type.key !== 'snowbranch' && o.type.key !== 'liftchair';
      const b = flying ? Math.round(Math.sin(t * 6 + (o.seed || 0)) * 2) : 0;
      ctx.imageSmoothingEnabled = s < 1;
      ctx.drawImage(img, Math.round(o.x + o.w / 2 + m.dx - w / 2), Math.round(o.y + o.h + m.bottom - h + b), Math.round(w), Math.round(h));
      ctx.imageSmoothingEnabled = false;
      return;
    }
    const fn = OB[o.type.key];
    if (fn) fn(ctx, o, t);
    else { ctx.fillStyle = o.type.kind === 'low' ? '#c0392b' : '#8e44ad'; ctx.fillRect(o.x, o.y, o.w, o.h); }
  }

  // ---------- gates ----------
  // gx = door centre (canvas px), gy = ground line. g.arrived = Lauri reached it.
  function hearts(ctx, x, y, t) {
    for (let i = 0; i < 3; i++) {
      const k = (t * 0.8 + i / 3) % 1;
      ctx.globalAlpha = 1 - k;
      blit(ctx, SPR.heart, x + Math.sin(k * 6 + i) * 8 - 10, y - k * 40, 2);
    }
    ctx.globalAlpha = 1;
  }

  // Draw another level's background to the right of x0 (shifted down by dy so its
  // ground/water line matches this level). Used to preview the next level at a gate.
  function sceneThrough(ctx, key, x0, dy, scroll, t, fill) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0, 0, CONFIG.WIDTH - x0, CONFIG.HEIGHT);
    ctx.clip();
    ctx.fillStyle = fill;
    ctx.fillRect(x0, 0, CONFIG.WIDTH - x0, CONFIG.HEIGHT);
    ctx.translate(0, Math.round(dy));
    BG.draw(ctx, key, scroll, t, false);
    ctx.restore();
  }

  const GATES = {
    rooftop(ctx, gx, gy, t, g) {
      // gx = the door out to the roof. Everything right of it is outside.
      const W = CONFIG.WIDTH;
      const out = Math.round(gx - 7 * U);
      const sky = ctx.createLinearGradient(0, 0, 0, gy);
      sky.addColorStop(0, '#7fb8ef'); sky.addColorStop(1, '#d4ecfa');
      ctx.fillStyle = sky; ctx.fillRect(out, 0, W - out, gy);
      // clouds and the city below
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.round(gx + 150), 60, 66, 12); ctx.fillRect(Math.round(gx + 168), 50, 30, 10);
      ctx.fillRect(Math.round(gx + 380), 90, 54, 10); ctx.fillRect(Math.round(gx + 392), 82, 24, 8);
      const tops = [40, 70, 30, 55, 85, 45, 65, 35, 75, 50, 60, 40, 80, 30];
      for (let i = 0; i < tops.length; i++) {
        const bx = out + 6 + i * 44;
        if (bx > W) break;
        ctx.fillStyle = i % 2 ? '#9bb0c6' : '#8aa1b9';
        ctx.fillRect(bx, gy - 20 - tops[i], 38, tops[i] + 20);
        ctx.fillStyle = '#d8e6f2';
        for (let wy = gy - 12 - tops[i]; wy < gy - 26; wy += 12) { ctx.fillRect(bx + 6, wy, 6, 5); ctx.fillRect(bx + 22, wy, 6, 5); }
      }
      // roof deck with a railing
      ctx.fillStyle = '#a3abb5'; ctx.fillRect(out, gy, W - out, CONFIG.HEIGHT - gy);
      ctx.fillStyle = '#c3c9d0'; ctx.fillRect(out, gy, W - out, 3);
      ctx.fillStyle = '#7f8a96';
      ctx.fillRect(out, gy - 22, W - out, 3);
      for (let x = out + 20; x < W; x += 40) ctx.fillRect(x, gy - 22, 3, 22);
      // windsock on the roof
      begin(ctx, gx + 210, gy);
      r(0, -40, 1, 40, '#bdc3c7');
      const w = Math.floor(t * 5) % 2;
      const cols = ['#e74c3c', '#ffffff', '#e74c3c', '#ffffff'];
      for (let i = 0; i < 4; i++) r(1 + i * 2, -40 + (i > 1 ? w : 0), 2, 3 - (i > 2 ? 1 : 0), cols[i]);
      end();

      // end wall of the office with the open door
      begin(ctx, gx, gy);
      const top = -Math.ceil(gy / U);
      r(-11, top, 4, -top, '#efe6d2'); r(7, top, 4, -top, '#efe6d2'); r(-11, top, 22, -27 - top, '#efe6d2');
      r(-11, -20, 4, 20, '#d6c39c'); r(7, -20, 4, 20, '#d6c39c');
      r(-8, -27, 16, 1, '#5d6d7e'); r(-8, -27, 1, 27, '#5d6d7e'); r(7, -27, 1, 27, '#5d6d7e');
      // glass door swung open
      r(8, -26, 4, 26, 'rgba(190,230,255,0.7)'); r(8, -26, 4, 1, '#5d6d7e'); r(11, -26, 1, 26, '#5d6d7e'); r(9, -14, 1, 2, '#f1c40f');
      // EXIT sign with a pigeon
      r(-6, -33, 12, 4, '#27ae60');
      const hop = (t % 2.2) < 0.2 ? -1 : 0;
      const px = (t % 6.6) < 3.3 ? -4 : 1;
      r(px, -35 + hop, 4, 2, '#9aa5b1'); r(px + 3, -36 + hop, 2, 2, '#7f8c8d');
      r(px + 5, -35 + hop, 1, 1, '#f39c12'); r(px + 4, -36 + hop, 1, 1, OUT); r(px - 1, -35 + hop, 1, 1, '#7f8c8d');
      end();
      FONT.draw(ctx, 'EXIT', gx, gy - 33 * U + 3, { scale: 1, color: '#ffffff', align: 'center' });

      // Lauri's paraglider laid out on the deck, ready
      const lay = Math.round(gx + 40);
      if (!g || !g.arrived) {
        for (let i = 0; i < 5; i++) {
          ctx.fillStyle = CANOPY_LAURI[i];
          ctx.fillRect(lay - 45 + i * 18, gy - 4, 18, 4);
        }
        return;
      }

      // run, the canopy fills with air, take off
      const a = g.arrivedT;
      const lerp = (u, v, k) => u + (v - u) * Math.max(0, Math.min(1, k));
      if (a < 0.9) {
        const k = a / 0.9;
        const x = lerp(gx, gx + 130, k);
        const e = 1 - (1 - k) * (1 - k);
        const cx = lerp(lay, x, e), cy = lerp(gy - 6, gy - 18 - 78, e);
        lines(ctx, cx - 30, cy + 4, x - 4, gy - 40);
        lines(ctx, cx + 30, cy + 4, x + 4, gy - 40);
        canopy(ctx, cx, cy, Math.round(lerp(8, 15, e)), CANOPY_LAURI);
        drawLauri(ctx, 'office', { x, y: gy, pose: 'run', frame: Math.floor(a * 14) % 4 }, t);
      } else {
        const k = Math.min(1, (a - 0.9) / 1.5);
        drawLauri(ctx, 'glide', {
          x: lerp(gx + 130, gx + 430, k), y: lerp(gy - 18, gy - 115, Math.pow(k, 0.8)),
          pose: 'glide', frame: Math.floor(t * 3) % 2, vy: 0,
        }, t);
      }
    },
    barn(ctx, gx, gy, t, g) {
      begin(ctx, gx, gy);
      // landing field
      r(-36, -1, 72, 2, '#7cc06a');
      // barn walls (red planks, white corners)
      r(-24, -30, 48, 30, '#b03a2e');
      for (let x = -24; x < 24; x += 3) r(x, -30, 1, 30, '#962f25');
      r(-25, -30, 2, 30, '#f4f1ea'); r(23, -30, 2, 30, '#f4f1ea');
      // gable roof with white trim
      for (let i = 0; i < 17; i++) r(-27 + i, -31 - i, 54 - 2 * i, 1, '#4e342e');
      for (let i = 0; i < 17; i++) { r(-28 + i, -31 - i, 2, 1, '#f4f1ea'); r(26 - i, -31 - i, 2, 1, '#f4f1ea'); }
      // hay loft door with hay sticking out
      r(-5, -42, 10, 8, '#5a3a22'); r(-6, -43, 12, 1, '#f4f1ea');
      r(-4, -36, 8, 2, '#e2c26a'); r(-3, -34, 1, 1, '#e2c26a'); r(2, -34, 1, 1, '#e2c26a');
      // inside: the horse farm
      r(-11, -22, 22, 22, '#4a2e1a');
      for (let x = -11; x < 11; x += 3) r(x, -22, 1, 20, '#3e2615');
      const glow = 0.8 + 0.2 * Math.sin(t * 6);
      r(7, -20, 2, 3, `rgba(255,213,107,${glow})`); r(7, -21, 2, 1, '#555');
      // stall with a saddle
      r(1, -10, 10, 1, '#8d5a3b'); r(1, -6, 10, 1, '#8d5a3b'); r(1, -10, 1, 10, '#8d5a3b');
      r(5, -12, 4, 2, '#7b2d26'); r(6, -13, 2, 1, '#7b2d26'); r(8, -10, 1, 3, '#7b2d26');
      // hay bales
      r(-10, -7, 8, 5, '#d9b44a'); r(-10, -7, 8, 1, '#ead27a'); r(-7, -7, 1, 5, '#b8902e');
      r(-9, -12, 6, 5, '#d9b44a'); r(-9, -12, 6, 1, '#ead27a'); r(-6, -12, 1, 5, '#b8902e');
      // pitchfork leaning on the wall
      r(-1, -15, 1, 13, '#8d6e63'); r(-2, -17, 1, 2, '#aab4bd'); r(0, -17, 1, 2, '#aab4bd'); r(-2, -15, 3, 1, '#aab4bd');
      // straw floor
      r(-11, -2, 22, 2, '#e2c26a');
      for (const sx of [-9, -4, 3, 8]) r(sx, -3, 2, 1, '#e2c26a');
      // door frame
      r(-12, -23, 24, 1, '#f4f1ea'); r(-12, -23, 1, 23, '#f4f1ea'); r(11, -23, 1, 23, '#f4f1ea');
      // both doors swung open, with white X braces
      for (const dx of [-17, 12]) {
        r(dx, -22, 5, 22, '#b03a2e');
        r(dx, -22, 5, 1, '#f4f1ea'); r(dx, -1, 5, 1, '#f4f1ea'); r(dx, -22, 1, 22, '#f4f1ea'); r(dx + 4, -22, 1, 22, '#f4f1ea');
        for (let i = 0; i < 20; i++) { const k = Math.round(i * 3 / 19); r(dx + 1 + k, -21 + i, 1, 1, '#f4f1ea'); r(dx + 3 - k, -21 + i, 1, 1, '#f4f1ea'); }
      }
      // little fence next to the barn
      r(27, -6, 1, 6, '#8d5a3b'); r(33, -6, 1, 6, '#8d5a3b'); r(26, -5, 10, 1, '#a86f45'); r(26, -3, 10, 1, '#a86f45');
      end();

      // a sneaky pony peeks out from behind the barn (and stays out once Lauri lands)
      const c = t % 4;
      let peek = 0;
      if (g && g.arrived) peek = 1;
      else if (c < 0.5) peek = c / 0.5;
      else if (c < 2.3) peek = 1;
      else if (c < 2.8) peek = 1 - (c - 2.3) / 0.5;
      if (peek > 0) {
        const edge = -25;
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, Math.round(gx + edge * U), CONFIG.HEIGHT);
        ctx.clip();
        const coat = '#a5683b', mane = '#5a3620', light = '#c98d5c';
        const ax = edge - Math.round(peek * 10);
        const twitch = Math.floor(t * 3) % 4 === 0 ? 1 : 0;
        begin(ctx, gx, gy);
        r(ax + 6, -17, 5, 5, coat);                                       // neck
        r(ax + 5, -24 + twitch, 1, 2, coat); r(ax + 7, -24, 1, 2, coat);  // ears
        r(ax + 3, -22, 6, 3, coat);                                       // head
        r(ax, -20, 7, 3, coat);                                           // muzzle
        r(ax, -19, 2, 2, light); r(ax, -19, 1, 1, OUT);                   // nose
        r(ax + 5, -22, 3, 1, mane); r(ax + 8, -22, 2, 6, mane);           // forelock + mane
        const blink = (t % 1.9) < 0.12;
        r(ax + 4, -21, 1, 1, blink ? coat : OUT);
        if (!blink) r(ax + 5, -21, 1, 1, '#ffffff');
        end();
        ctx.restore();
        if (g && g.arrived) hearts(ctx, gx + (ax + 4) * U, gy - 26 * U, t);
      }
    },
    pier(ctx, gx, gy, t, g) {
      // gx = where the pony stops on the shore. The lake starts just after it.
      const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
      const shore = Math.round(gx + 24);
      // past the shore you already see Kaislikko (the swimming level's lake and reeds)
      sceneThrough(ctx, 'swim', shore, gy - 2 - CONFIG.SWIM.surfaceY, 900 - gx, t, '#8fcaf2');
      // soft haze so the two skies blend
      const haze = ctx.createLinearGradient(shore - 60, 0, shore + 60, 0);
      haze.addColorStop(0, 'rgba(230,246,255,0)');
      haze.addColorStop(0.5, 'rgba(230,246,255,0.6)');
      haze.addColorStop(1, 'rgba(230,246,255,0)');
      ctx.fillStyle = haze; ctx.fillRect(shore - 60, 0, 120, gy - 40);
      ctx.fillStyle = '#c9b27a'; ctx.fillRect(shore - 6, gy - 2, 12, H - gy + 2);
      // tall reeds hiding where the meadow turns into the lake
      for (let i = 0; i < 12; i++) {
        const rx = shore - 16 + i * 3, rh = 40 + ((i * 37) % 45);
        const sw = Math.round(Math.sin(t * 1.5 + i) * 1.5);
        ctx.fillStyle = i % 2 ? '#6b8f3a' : '#557a2e';
        ctx.fillRect(rx, gy - rh, 3, rh);
        if (i % 3 === 0) { ctx.fillStyle = '#7a4a2a'; ctx.fillRect(rx + sw, gy - rh - 9, 3, 10); }
      }
      // a duck paddling further out; Lauri's splash scares it onto the pony's back
      const dx = gx + 330 + Math.sin(t * 0.6) * 40;
      const da = g && g.arrived ? g.arrivedT : 0;
      if (da < 1.9) blit(ctx, SPR.duck[Math.floor(t * 2) % 2], dx, gy - 16 + Math.round(Math.sin(t * 3)), 3);
      const flyingDuck = () => {
        if (da < 1.9) return;
        if (g.duckFrom == null) g.duckFrom = dx;
        const k = Math.min(1, (da - 1.9) / 1.3);
        const sx = g.duckFrom, sy = gy - 16, ex = gx - 15, ey = gy - 44;
        const fx = sx + (ex - sx) * k, fy = sy + (ey - sy) * k - Math.sin(k * Math.PI) * 70;
        const flap = k < 1 ? Math.floor(t * 14) % 2 : 0;
        blit(ctx, SPR.duck[flap], fx, k < 1 ? fy : ey + Math.round(Math.sin(t * 2)), 3);
      };

      // the pier
      const deck = gy - 9, p0 = shore - 12, p1 = shore + 180;
      ctx.fillStyle = '#6d4c41';
      for (let x = p0 + 12; x <= p1; x += 42) ctx.fillRect(x, deck, 6, H - deck);
      ctx.fillStyle = '#b5773f'; ctx.fillRect(p0, deck, p1 - p0 + 6, 6);
      ctx.fillStyle = '#c98d5c'; ctx.fillRect(p0, deck, p1 - p0 + 6, 2);
      ctx.fillStyle = '#8d5a33'; for (let x = p0; x < p1; x += 12) ctx.fillRect(x, deck, 2, 6);
      ctx.fillStyle = '#5d4037'; ctx.fillRect(p1 - 2, deck - 9, 8, 9);           // bollard
      ctx.fillStyle = '#aab4bd'; ctx.fillRect(p1 + 6, deck + 6, 3, 22); ctx.fillRect(p1 + 12, deck + 6, 3, 22); // ladder
      ctx.fillRect(p1 + 6, deck + 12, 9, 2); ctx.fillRect(p1 + 6, deck + 20, 9, 2);

      // Kaisla waiting on the shore
      drawPerson(ctx, 'kaisla', gx - 30 * U, gy, 'wave', t);
      if (g && g.arrived) hearts(ctx, gx - 30 * U, gy - 30 * U - 10, t);
      if (!g || !g.arrived) return;

      // Lauri hops off the pony, runs along the pier and dives in
      ART.drawLauri(ctx, 'horse', { x: gx, y: gy, pose: 'run', frame: 0, noRider: true }, t);
      flyingDuck();
      const a = g.arrivedT;
      const entry = p1 + 70;
      const lerp = (u, v, k) => u + (v - u) * Math.max(0, Math.min(1, k));
      if (a < 0.4) {
        const k = a / 0.4;
        drawLauri(ctx, 'home', { x: lerp(gx + 6, p0 + 24, k), y: lerp(gy - 27, deck, k) - Math.sin(k * Math.PI) * 18, pose: 'jump', frame: 0 }, t);
      } else if (a < 1.3) {
        const k = (a - 0.4) / 0.9;
        drawLauri(ctx, 'home', { x: lerp(p0 + 24, p1, k), y: deck, pose: 'run', frame: Math.floor(a * 12) % 4 }, t);
      } else if (a < 2.0) {
        const k = (a - 1.3) / 0.7;
        drawLauri(ctx, 'home', { x: lerp(p1, entry, k), y: lerp(deck, gy + 30, k) - Math.sin(k * Math.PI) * 55, pose: 'jump', frame: 0 }, t);
      }
      // splash + rings
      if (a > 1.9 && a < 2.7) {
        const k = (a - 1.9) / 0.8;
        ctx.fillStyle = `rgba(255,255,255,${1 - k})`;
        for (let i = 0; i < 8; i++) {
          const ang = Math.PI * (0.15 + 0.7 * i / 7);
          ctx.fillRect(Math.round(entry - Math.cos(ang) * k * 40), Math.round(gy - 4 - Math.sin(ang) * Math.sin(k * Math.PI) * 45), 5, 5);
        }
      }
      if (a > 1.9) {
        const k = ((a - 1.9) * 0.6) % 1;
        ctx.strokeStyle = `rgba(255,255,255,${0.7 * (1 - k)})`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(entry, gy + 2, 8 + k * 50, 3 + k * 8, 0, 0, Math.PI * 2); ctx.stroke();
      }
      // ...and pops back up, swimming
      if (a > 2.5) {
        drawLauri(ctx, 'swim', { x: entry + Math.min(40, (a - 2.5) * 20), y: gy, pose: 'swim', frame: Math.floor(a * 5) % 3, vy: 0 }, t);
      }
    },
    iceArch(ctx, gx, gy, t, g) {
      // gy = water surface. Through the arch and beyond: the snowy ski slope (next level)
      const x0 = Math.round(gx - 14 * U);
      sceneThrough(ctx, 'ski', x0, gy - CONFIG.RUN.groundY, 900 - gx, t, '#e8f1fb');
      ctx.fillStyle = '#ffffff'; ctx.fillRect(x0, gy - 2, CONFIG.WIDTH - x0, 3);
      // a snowstorm curtain where the lake turns into winter
      const band = ctx.createLinearGradient(x0 - 50, 0, x0 + 50, 0);
      band.addColorStop(0, 'rgba(255,255,255,0)');
      band.addColorStop(0.5, 'rgba(240,248,255,0.75)');
      band.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = band; ctx.fillRect(x0 - 50, 0, 100, CONFIG.HEIGHT);
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 30; i++) {
        const fy = (i * 37 + t * (60 + (i % 5) * 15)) % CONFIG.HEIGHT;
        const fx = x0 - 40 + ((i * 53) % 80) + Math.sin(t * 2 + i) * 6;
        ctx.fillRect(Math.round(fx), Math.round(fy), i % 3 ? 2 : 3, i % 3 ? 2 : 3);
      }
      begin(ctx, gx, gy);
      const R = 18, th = 4, cy = 4;
      for (let y = -R - 6; y <= 0; y++) {
        for (let x = -R; x <= R; x++) {
          const d = Math.sqrt(x * x + y * y);
          if (d <= R && d > R - th) r(x, cy + y - 6, 1, 1, d > R - 1 ? '#1b4f7a' : (d < R - th + 1 ? '#2f7fb8' : ((x * 3 + y) % 7 === 0 ? '#e8f8ff' : '#6cc0ec')));
        }
      }
      r(-R, -2, th, 8, '#6cc0ec'); r(R - th + 1, -2, th, 8, '#6cc0ec');
      r(-R, -2, 1, 8, '#1b4f7a'); r(R, -2, 1, 8, '#1b4f7a'); r(-R + th - 1, -2, 1, 8, '#2f7fb8'); r(R - th + 1, -2, 1, 8, '#2f7fb8');
      // icicles under the arch, dripping now and then
      for (const ix of [-9, -5, -1, 3, 7]) {
        const top = Math.round(cy - 6 - Math.sqrt((R - th) ** 2 - ix * ix)) + 1;
        const len = 2 + ((ix + 9) % 3);
        r(ix, top, 1, len, '#e8f8ff');
        const k = (t * 0.7 + ix * 0.13) % 1.5;
        if (k < 1) r(ix, top + len + Math.round(k * 10), 1, 1, '#9fd3ff');
      }
      // a fish jumping out of the water
      const fp = t % 3.2;
      if (fp < 1) {
        const fx = 24 + Math.round(fp * 12), fy = -Math.round(Math.sin(fp * Math.PI) * 12);
        r(fx, fy, 3, 2, '#f39c12'); r(fx - 1, fy + (fp < 0.5 ? 1 : -1), 1, 2, '#e67e22'); r(fx + 2, fy, 1, 1, OUT);
      }
      if (fp < 0.15 || (fp > 0.85 && fp < 1.1)) r(fp < 0.5 ? 23 : 35, -1, 3, 1, '#ffffff');
      // ice floe for Pyry
      r(-36, -1, 13, 2, '#eaf8ff'); r(-35, 1, 11, 1, '#bfe3f5');
      end();
      // snowstorm swirl
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 40; i++) {
        const a = t * 2 + i * 0.7;
        const rad = 30 + (i % 8) * 9 + Math.sin(t + i) * 4;
        const x = gx + Math.cos(a) * rad;
        const y = gy - 50 + Math.sin(a) * rad * 0.6;
        const s = i % 3 === 0 ? 3 : 2;
        ctx.fillRect(Math.round(x), Math.round(y), s, s);
      }
      drawPerson(ctx, 'pyry', gx - 30 * U, gy - 1 * U, 'wave', t);
      if (g && g.arrived) hearts(ctx, gx - 30 * U, gy - 30 * U - 10, t);
    },
    house(ctx, gx, gy, t, g) {
      begin(ctx, gx, gy);
      // chimney + smoke
      r(14, -44, 4, 8, '#7f3a33');
      end();
      ctx.fillStyle = 'rgba(220,220,235,0.6)';
      for (let i = 0; i < 4; i++) {
        const k = (t * 0.4 + i / 4) % 1;
        ctx.fillRect(Math.round(gx + 16 * U + Math.sin(k * 5) * 6), Math.round(gy - 44 * U - k * 50), 6 + k * 8, 6 + k * 8);
      }
      begin(ctx, gx, gy);
      // walls (falu red with planks)
      r(-30, -28, 60, 28, '#a3352d');
      for (let x = -30; x < 30; x += 3) r(x, -28, 1, 28, '#8d2c25');
      r(-31, -28, 2, 28, '#f4f1ea'); r(29, -28, 2, 28, '#f4f1ea');
      // roof with snow
      for (let i = 0; i < 12; i++) r(-34 + i, -29 - i, 68 - i * 2, 1, '#3b3b4f');
      for (let i = 0; i < 12; i++) r(-34 + i, -30 - i, 3, 1, '#ffffff'), r(31 - i, -30 - i, 3, 1, '#ffffff');
      r(-23, -41, 46, 1, '#ffffff');
      // windows
      for (const wx of [-24, 14]) {
        r(wx, -22, 10, 9, '#f4f1ea'); r(wx + 1, -21, 8, 7, '#ffd56b');
        r(wx + 4, -21, 1, 7, '#f4f1ea'); r(wx + 1, -18, 8, 1, '#f4f1ea');
      }
      // door (open, warm light)
      r(-6, -18, 12, 18, '#f4f1ea'); r(-5, -17, 10, 17, '#ffcf6b'); r(-5, -17, 3, 17, '#e0a84a');
      r(-9, -1, 18, 1, '#d6e4f0');
      // snowy mailbox
      r(37, -8, 1, 8, '#6d4c41'); r(35, -11, 5, 3, '#2d6cdf'); r(35, -12, 5, 1, '#ffffff'); r(40, -11, 1, 2, '#e74c3c');
      // snow on the ground
      r(-36, -1, 78, 1, '#ffffff');
      end();
      // warm glow
      ctx.fillStyle = 'rgba(255,207,107,0.15)';
      ctx.fillRect(Math.round(gx - 30), gy - 60, 60, 60);
      drawPerson(ctx, 'annamaria', gx + 12 * U, gy, 'wave', t);
      if (g && g.arrived) hearts(ctx, gx + 12 * U, gy - 30 * U - 10, t);
    },
    backDoor(ctx, gx, gy, t) {
      // The endless bookshelf finally ends: a plain hallway with the back door.
      const x0 = Math.round(gx - 34 * U);
      const W = CONFIG.WIDTH;
      ctx.fillStyle = '#f3e2c7'; ctx.fillRect(x0, 0, W - x0, 200);
      ctx.fillStyle = '#ead2ae';
      for (let y = 12; y < 190; y += 24) for (let x = x0 + ((y / 24) % 2) * 18 + 9; x < W; x += 36) ctx.fillRect(x, y, 6, 6);
      ctx.fillStyle = '#c9a27a'; ctx.fillRect(x0, 200, W - x0, gy - 200);
      ctx.fillStyle = '#a87f57'; ctx.fillRect(x0, 200, W - x0, 3);
      // side panel of the bookshelf
      ctx.fillStyle = '#6d4c41'; ctx.fillRect(x0 - 8, 0, 10, 204);
      ctx.fillStyle = '#8d6e63'; ctx.fillRect(x0 - 8, 0, 3, 204);
      // family pictures in the hallway
      for (const [fx, c] of [[-28, '#7fb3d5'], [18, '#f5b7b1'], [30, '#a9dfbf']]) {
        const px = Math.round(gx + fx * U);
        ctx.fillStyle = '#6d4c41'; ctx.fillRect(px, 70, 30, 26);
        ctx.fillStyle = c; ctx.fillRect(px + 3, 73, 24, 20);
        ctx.fillStyle = '#f1c4a0'; ctx.fillRect(px + 10, 77, 10, 10);
      }
      begin(ctx, gx, gy);
      r(-10, -28, 20, 28, '#8d6e63');
      r(-8, -26, 16, 26, '#f6b26b');
      r(-8, -26, 16, 10, '#f9cb9c');
      // garden outside + sauna far away
      r(-8, -8, 16, 8, '#6aa84f');
      r(1, -14, 6, 6, '#8b5a2b'); r(0, -16, 8, 2, '#5d4037'); r(5, -18, 1, 2, '#555');
      // door leaf open
      r(8, -26, 3, 26, '#6d4c41'); r(9, -14, 1, 2, '#f1c40f');
      // doormat with sauna slippers
      r(-9, -1, 18, 1, '#a0522d');
      r(-7, -2, 3, 1, '#2d6cdf'); r(-3, -2, 3, 1, '#2d6cdf');
      // towel on a hook and a birch whisk (vihta)
      r(-16, -25, 1, 1, '#555'); r(-17, -24, 4, 9, '#e74c3c');
      r(-17, -21, 4, 1, '#ffffff'); r(-17, -18, 4, 1, '#ffffff');
      const sway = Math.floor(t * 1.5) % 2;
      r(14, -25, 1, 1, '#555'); r(14, -24, 1, 3, '#8d6e63');
      r(12 + sway, -21, 5, 4, '#5c8f34'); r(13 + sway, -17, 3, 2, '#7fb24a'); r(12 + sway, -21, 1, 1, '#7fb24a');
      // sign
      r(-7, -33, 14, 4, '#6d4c41');
      end();
      FONT.draw(ctx, 'SAUNA', gx, gy - 33 * U + 3, { scale: 1, color: '#ffe8c2', align: 'center' });
      // steam coming in
      for (let i = 0; i < 7; i++) {
        const k = (t * 0.35 + i / 7) % 1;
        ctx.fillStyle = `rgba(255,255,255,${0.55 * (1 - k)})`;
        const s = 8 + k * 18;
        ctx.fillRect(Math.round(gx - 10 - k * 70 + Math.sin(i + t * 2) * 6), Math.round(gy - 40 - (i % 3) * 14 - k * 20), s, s * 0.7);
      }
    },
  };

  // Gates that play their own little scene once Lauri arrives (he is drawn by the gate),
  // with how many extra seconds to wait before the JATKA click is accepted.
  const GATE_ANIM = { rooftop: 2.4, pier: 2.6 };

  function drawGate(ctx, key, gx, gy, t, g) {
    GATES[key](ctx, gx, gy, t, g);
  }

  // ---------- sauna (finale) ----------
  function drawSauna(ctx, gx, gy, t, steam = 1) {
    begin(ctx, gx, gy);
    r(12, -38, 4, 8, '#555');
    end();
    for (let i = 0; i < 6; i++) {
      const k = (t * 0.3 + i / 6) % 1;
      ctx.fillStyle = `rgba(255,255,255,${0.6 * (1 - k) * steam})`;
      const s = 8 + k * 20;
      ctx.fillRect(Math.round(gx + 14 * U - s / 2 + Math.sin(k * 6 + i) * 10), Math.round(gy - 38 * U - k * 80), s, s);
    }
    begin(ctx, gx, gy);
    // log walls
    r(-24, -26, 48, 26, '#9a6233');
    for (let y = -26; y < 0; y += 3) { r(-24, y, 48, 1, '#b5773f'); r(-25, y, 2, 2, '#c48a52'); r(23, y, 2, 2, '#c48a52'); }
    // roof
    for (let i = 0; i < 10; i++) r(-28 + i * 2, -27 - i, 56 - i * 4, 1, '#4e342e');
    r(-29, -27, 58, 1, '#3e2723');
    // door with glowing window
    r(-5, -20, 10, 20, '#6d4c41'); r(-5, -20, 10, 1, '#5d4037');
    r(-2, -17, 4, 4, '#ffcf6b'); r(3, -10, 1, 2, '#f1c40f');
    // window
    r(10, -18, 8, 6, '#5d4037'); r(11, -17, 6, 4, '#ffcf6b');
    // bench + bucket
    r(-21, -5, 12, 1, '#c48a52'); r(-20, -4, 1, 4, '#8d6e63'); r(-11, -4, 1, 4, '#8d6e63');
    r(-17, -8, 4, 3, '#c49a6c'); r(-17, -8, 4, 1, '#8d6e63');
    end();
  }

  // ---------- sauna interior (victory screen) ----------
  // A person sitting on a bench, seen from the front, wearing a towel in
  // their shirt colour. (x, seatY) = middle of the seat under them.
  function drawBather(ctx, who, x, seatY, ladleUp = null, scale = 2) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(seatY));
    ctx.scale(scale, scale);
    bather(ctx, who, ladleUp);
    ctx.restore();
  }
  function bather(ctx, who, ladleUp) {
    const P = PEOPLE[who];
    const skin = P.skin, towel = P.shirt;
    begin(ctx, 0, 0);
    r(-3, 0, 2, 5, skin); r(1, 0, 2, 5, skin);
    r(-3, 5, 2, 1, '#d99a73'); r(1, 5, 2, 1, '#d99a73');
    r(-3, -6, 6, 6, skin);
    if (P.dress) { r(-3, -5, 6, 6, towel); r(-3, -5, 6, 1, 'rgba(255,255,255,0.3)'); }
    else { r(-3, -2, 6, 3, towel); r(-3, -2, 6, 1, 'rgba(255,255,255,0.3)'); }
    r(3, -6, 1, 4, skin); r(3, -2, 1, 1, skin);
    if (ladleUp === null) r(-4, -6, 1, 4, skin);
    else if (ladleUp) { r(-5, -7, 2, 1, skin); r(-6, -8, 1, 1, skin); }
    else { r(-5, -5, 2, 1, skin); r(-6, -5, 1, 1, skin); }
    end();
    drawHead(ctx, who, 0, -6 * U - 15);
  }

  function steamPuff(ctx, x, y, s, a) {
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), Math.round(s), Math.round(s * 0.75));
    ctx.fillRect(Math.round(x - s / 3), Math.round(y - s * 0.7), Math.round(s * 0.66), Math.round(s * 0.4));
  }

  function drawSaunaInterior(ctx, t) {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    // wall planks
    for (let x = 0; x < W; x += 24) {
      ctx.fillStyle = (x / 24) % 2 ? '#c58b55' : '#b97f4a';
      ctx.fillRect(x, 0, 24, H);
      ctx.fillStyle = '#a86f3e';
      ctx.fillRect(x, 0, 2, H);
    }
    ctx.fillStyle = '#7a4a26'; ctx.fillRect(0, 272, W, 28);
    ctx.fillStyle = '#6a3e1e'; for (let x = 0; x < W; x += 40) ctx.fillRect(x, 272, 2, 28);

    // small window with the night sky and aurora
    ctx.fillStyle = '#6d4c41'; ctx.fillRect(256, 72, 88, 60);
    ctx.fillStyle = '#0f1838'; ctx.fillRect(262, 78, 76, 48);
    for (let x = 262; x < 338; x += 2) {
      const y = 92 + Math.sin(x * 0.08 + t * 0.8) * 5;
      ctx.fillStyle = 'rgba(93,255,176,0.45)'; ctx.fillRect(x, Math.round(y), 2, 10);
    }
    ctx.fillStyle = '#ffffff';
    for (const [sx, sy] of [[270, 84], [300, 82], [326, 88], [284, 116], [318, 112]]) ctx.fillRect(sx, sy, 2, 2);
    ctx.fillStyle = '#6d4c41'; ctx.fillRect(298, 78, 4, 48); ctx.fillRect(262, 100, 76, 4);

    // benches (lauteet): backrest, upper bench, lower step
    const UP = 170, LOW = 254;
    ctx.fillStyle = '#d9a066'; for (let y = 98; y < UP; y += 12) ctx.fillRect(380, y, 420, 9);
    ctx.fillStyle = '#e3ae75'; ctx.fillRect(380, UP, 420, 6);
    ctx.fillStyle = '#c48a52'; ctx.fillRect(380, UP + 6, 420, 8);
    ctx.fillStyle = '#a86f3e'; for (const px of [392, 560, 780]) ctx.fillRect(px, UP + 14, 8, LOW - UP - 14);
    ctx.fillStyle = '#e3ae75'; ctx.fillRect(360, LOW, 440, 6);
    ctx.fillStyle = '#c48a52'; ctx.fillRect(360, LOW + 6, 440, 8);
    ctx.fillStyle = '#a86f3e'; for (const px of [372, 580, 780]) ctx.fillRect(px, LOW + 14, 8, 272 - LOW - 14);

    // stove (kiuas) with stones and a flickering fire
    ctx.fillStyle = '#3a3a42'; ctx.fillRect(266, 200, 76, 72);
    ctx.fillStyle = '#2b2b31'; ctx.fillRect(266, 200, 76, 4);
    const fl = 0.75 + 0.25 * Math.sin(t * 13) * Math.sin(t * 7);
    ctx.fillStyle = '#1c1c20'; ctx.fillRect(282, 232, 44, 28);
    ctx.fillStyle = `rgba(255,140,40,${fl})`; ctx.fillRect(286, 240, 36, 20);
    ctx.fillStyle = `rgba(255,220,90,${fl})`; ctx.fillRect(296, 248, 16, 12);
    const stones = ['#8a8f99', '#6c717b', '#a3a8b1'];
    for (let i = 0; i < 14; i++) {
      ctx.fillStyle = stones[i % 3];
      ctx.fillRect(268 + (i % 7) * 10 + (i > 6 ? 5 : 0), i > 6 ? 180 : 190, 10, 10);
    }
    // bucket (kiulu)
    ctx.fillStyle = '#b5773f'; ctx.fillRect(356, 252, 26, 20);
    ctx.fillStyle = '#7a4a26'; ctx.fillRect(356, 256, 26, 3); ctx.fillRect(356, 266, 26, 3);
    ctx.fillStyle = '#5aa9dc'; ctx.fillRect(358, 252, 22, 3);

    // Lauri throws löyly every 5 seconds
    const c = t % 5;
    const up = c > 0.3 && c < 1.6;
    const burst = c < 0.9 ? 0 : Math.max(0, 1 - (c - 0.9) / 3.5);

    // people: upper bench, then lower bench in front
    const bob = (i) => Math.round(Math.sin(t * 1.3 + i * 1.7) * 1.5);
    drawBather(ctx, 'kaisla', 474, UP + bob(0));
    drawBather(ctx, 'dave', 604, UP + bob(1));
    drawBather(ctx, 'pyry', 734, UP + bob(2));
    drawBather(ctx, 'annamaria', 540, LOW + bob(3));
    drawBather(ctx, 'touko', 670, LOW + bob(4));
    const lx = 412, ly = LOW + bob(5);
    drawBather(ctx, 'lauri', lx, ly, up);

    // ladle (kauha) from Lauri's hand towards the stones
    const hx = lx - 6 * U * 2, hy = ly + (up ? -8 : -5) * U * 2;
    const ex = up ? 326 : 372, ey = up ? hy - 8 : hy + 30;
    ctx.fillStyle = '#8d5a33';
    const n = Math.max(Math.abs(ex - hx), Math.abs(ey - hy));
    for (let i = 0; i <= n; i += 2) ctx.fillRect(Math.round(hx + (ex - hx) * i / n), Math.round(hy + (ey - hy) * i / n), 3, 3);
    ctx.fillStyle = '#c48a52'; ctx.fillRect(ex - 8, ey - 2, 10, 7);
    // water drops onto the stones
    if (c > 0.7 && c < 1.4) {
      ctx.fillStyle = '#9fd3ff';
      for (let i = 0; i < 4; i++) {
        const k = ((c - 0.7) * 3 + i * 0.25) % 1;
        ctx.fillRect(ex - 4 + (i % 2) * 4, Math.round(ey + 6 + k * (178 - ey)), 3, 4);
      }
    }

    // steam: gentle all the time, a big cloud after the löyly
    for (let i = 0; i < 6; i++) {
      const k = (t * 0.25 + i / 6) % 1;
      steamPuff(ctx, 300 + Math.sin(k * 5 + i) * 18, 176 - k * 150, 14 + k * 30, 0.35 * (1 - k));
    }
    if (burst > 0) {
      for (let i = 0; i < 10; i++) {
        const k = Math.min(1, (c - 0.9) / 2.5 + i * 0.03);
        const x = 304 + (i - 4.5) * 14 + Math.sin(i * 2 + t) * 10 + k * (60 + i * 18);
        steamPuff(ctx, x, 170 - k * (90 + (i % 4) * 25), 20 + k * 50, 0.55 * burst);
      }
    }
    ctx.fillStyle = `rgba(255,240,225,${0.05 + 0.18 * burst})`;
    ctx.fillRect(0, 0, W, H);

    // warm lamp glow
    const g = ctx.createRadialGradient(560, 110, 10, 560, 110, 360);
    g.addColorStop(0, 'rgba(255,200,120,0.18)');
    g.addColorStop(1, 'rgba(60,20,0,0.25)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // the occasional heart floating up from someone
    const people = [[474, 96], [604, 96], [734, 96], [540, 180], [670, 180], [412, 180]];
    for (let i = 0; i < people.length; i++) {
      const k = (t * 0.35 + i * 0.37) % 2;
      const hy = people[i][1] - 20 - k * 50;
      if (k > 1 || hy < 64) continue; // keep clear of the title band
      ctx.globalAlpha = 1 - k;
      blit(ctx, SPR.heart, people[i][0] - 10 + Math.sin(k * 6 + i) * 6, hy, 2);
    }
    ctx.globalAlpha = 1;
  }

  return {
    U, init() { buildHeads(); buildSprites(); loadFaces(); loadObstacleImages(); },
    begin, end, r, sprite, blit,
    drawHead, drawPerson, drawLauri, drawObstacle, drawGate, drawSauna, drawSaunaInterior, GATE_ANIM,
    get SPR() { return SPR; },
    PEOPLE,
  };
})();
