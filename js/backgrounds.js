// Backgrounds per level. Each scene has:
//   back(ctx, t)            – drawn first (sky etc.)
//   layers: [{ canvas, f }]  – pre-rendered 800px tiles, scrolled at factor f
//   front(ctx, t, scroll)    – drawn after the layers, behind obstacles/player
//   overlay(ctx, t, scroll)  – drawn after the player (e.g. water tint)
const BG = (() => {
  const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
  const TAU = Math.PI * 2;

  function rng(seed) {
    return () => {
      seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function makeLayer(draw, seed = 1) {
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    draw(g, rng(seed));
    return c;
  }
  function R(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
  // draw something at x, and again wrapped around the tile edge
  function wrap(x, w, fn) { fn(x); if (x + w > W) fn(x - W); if (x < 0) fn(x + W); }
  function vgrad(ctx, y0, y1, stops) {
    const gr = ctx.createLinearGradient(0, y0, 0, y1);
    stops.forEach((c, i) => gr.addColorStop(i / (stops.length - 1), c));
    ctx.fillStyle = gr;
    ctx.fillRect(0, y0, W, y1 - y0);
  }
  // A tileable wavy line: integer cycles per tile width
  function wave(x, base, parts) {
    let y = base;
    for (const [amp, k, ph] of parts) y += amp * Math.sin(TAU * k * x / W + ph);
    return y;
  }
  function hills(g, base, parts, color, step = 3) {
    for (let x = 0; x < W; x += step) {
      const y = Math.round(wave(x, base, parts) / 3) * 3;
      R(g, x, y, step, H - y, color);
    }
  }
  function cloud(g, x, y, s, col = '#ffffff') {
    wrap(x, 60 * s, (xx) => {
      R(g, xx, y, 54 * s, 9 * s, col);
      R(g, xx + 9 * s, y - 6 * s, 24 * s, 6 * s, col);
      R(g, xx + 21 * s, y - 12 * s, 15 * s, 6 * s, col);
    });
  }
  function spruce(g, x, base, h, col, snow) {
    wrap(x - 15, 30, (xx) => {
      const cx = xx + 15;
      R(g, cx - 2, base - 6, 3, 6, '#4e3b2e');
      for (let y = 6; y < h; y += 3) {
        const p = (y - 6) / (h - 6);
        const hw = Math.max(1.5, (1 - p) * h * 0.28 + ((y / 3) % 3) * 1.5);
        R(g, cx - hw, base - y - 3, hw * 2, 3, col);
        if (snow && (y / 3) % 3 === 0) R(g, cx - hw, base - y - 3, hw * 2, 2, snow);
      }
    });
  }

  const RUN_G = CONFIG.RUN.groundY;
  const scenes = {};

  // ---------- Office ----------
  scenes.office = () => ({
    back(ctx) { vgrad(ctx, 0, RUN_G, ['#8ec9ef', '#d4ecfa']); },
    layers: [
      { f: 0.12, canvas: makeLayer((g, rnd) => {
        for (let x = 0; x < W; x += 33) {
          const h = 60 + rnd() * 110, w = 30;
          R(g, x, 220 - h, w, h, rnd() < 0.5 ? '#9bb0c6' : '#8aa1b9');
          for (let y = 230 - h; y < 210; y += 12)
            for (let wx = 4; wx < w - 4; wx += 9) if (rnd() < 0.6) R(g, x + wx, y, 4, 5, '#d8e6f2');
        }
      }, 11) },
      { f: 0.5, canvas: makeLayer((g, rnd) => {
        R(g, 0, 0, W, RUN_G, '#efe6d2');
        R(g, 0, 196, W, RUN_G - 196, '#d6c39c');
        R(g, 0, 193, W, 3, '#bfa77a');
        R(g, 0, 0, W, 12, '#d9cdb2');
        for (const wx of [40, 440]) {
          g.clearRect(wx, 40, 150, 100);
          R(g, wx - 6, 34, 162, 6, '#ffffff'); R(g, wx - 6, 140, 162, 8, '#ffffff');
          R(g, wx - 6, 34, 6, 114, '#ffffff'); R(g, wx + 150, 34, 6, 114, '#ffffff');
          R(g, wx + 72, 40, 6, 100, '#ffffff');
        }
        // pinboard
        R(g, 250, 60, 90, 60, '#b88a5a'); R(g, 254, 64, 82, 52, '#c9a06d');
        for (let i = 0; i < 6; i++) R(g, 260 + (i % 3) * 25, 70 + Math.floor(i / 3) * 22, 18, 15, ['#fff59d', '#ffffff', '#b3e5fc'][i % 3]);
        // clock
        R(g, 640, 50, 36, 36, '#ffffff'); R(g, 643, 53, 30, 30, '#fafafa'); R(g, 657, 57, 3, 12, '#333'); R(g, 657, 66, 10, 3, '#333');
        // filing cabinet + plant
        R(g, 360, 150, 60, 106, '#9aa5b1'); R(g, 360, 184, 60, 3, '#7b8794'); R(g, 360, 220, 60, 3, '#7b8794');
        R(g, 384, 164, 12, 3, '#555'); R(g, 384, 200, 12, 3, '#555'); R(g, 384, 236, 12, 3, '#555');
        R(g, 375, 132, 30, 18, '#c0663d'); R(g, 372, 108, 12, 27, '#4caf50'); R(g, 384, 100, 12, 33, '#3f9a46'); R(g, 396, 112, 12, 21, '#4caf50');
        // water cooler
        R(g, 720, 170, 36, 86, '#dfe6ec'); R(g, 726, 128, 24, 42, '#8fd3f4'); R(g, 732, 200, 9, 6, '#3498db');
        // poster
        R(g, 210, 150, 30, 40, '#ffffff'); R(g, 214, 154, 22, 18, '#f39c12'); R(g, 214, 176, 22, 3, '#999');
      }, 12) },
      { f: 1, canvas: makeLayer((g) => {
        R(g, 0, RUN_G, W, H - RUN_G, '#7d8597');
        R(g, 0, RUN_G, W, 3, '#5d6475');
        for (let x = 0; x < W; x += 48) R(g, x, RUN_G + 3, 3, H - RUN_G, '#717a8c');
        for (let x = 24; x < W; x += 96) R(g, x, RUN_G + 20, 3, 3, '#8f97a8');
      }) },
    ],
  });

  // ---------- Paragliding ----------
  const GL_G = CONFIG.GLIDE.groundY;
  scenes.glide = () => ({
    back(ctx) {
      vgrad(ctx, 0, H, ['#7fb8ef', '#cfe6fb', '#eef6fd']);
      R(ctx, 640, 36, 30, 30, '#fff3b0'); R(ctx, 646, 30, 18, 42, '#fff3b0'); R(ctx, 634, 42, 42, 18, '#fff3b0');
    },
    layers: [
      { f: 0.05, canvas: makeLayer((g, rnd) => { for (let i = 0; i < 5; i++) cloud(g, rnd() * W, 40 + rnd() * 70, 1, 'rgba(255,255,255,0.7)'); }, 21) },
      { f: 0.12, canvas: makeLayer((g) => hills(g, 225, [[14, 2, 0.5], [8, 5, 1.3]], '#9cc3a4'), 22) },
      { f: 0.22, canvas: makeLayer((g, rnd) => { for (let i = 0; i < 4; i++) cloud(g, rnd() * W, 90 + rnd() * 70, 1.4); }, 23) },
      { f: 0.3, canvas: makeLayer((g) => hills(g, 250, [[12, 3, 2.1], [6, 7, 0.4]], '#6fa47c'), 24) },
      { f: 0.55, canvas: makeLayer((g, rnd) => {
        hills(g, 270, [[8, 2, 1.0], [5, 6, 2.2]], '#4f8a5f');
        for (let i = 0; i < 18; i++) {
          const x = rnd() * W;
          spruce(g, x, Math.round(wave(x, 270, [[8, 2, 1.0], [5, 6, 2.2]])) + 4, 18 + rnd() * 10, '#3c714b');
        }
      }, 25) },
      { f: 1, canvas: makeLayer((g, rnd) => {
        R(g, 0, GL_G, W, H - GL_G, '#3f7a4f');
        R(g, 0, GL_G, W, 3, '#5a9a62');
        for (let i = 0; i < 40; i++) R(g, rnd() * W, GL_G + 3 + rnd() * 12, 3, 3, '#4f8d5c');
      }, 26) },
    ],
  });

  // ---------- Horse ----------
  scenes.horse = () => ({
    back(ctx) {
      vgrad(ctx, 0, RUN_G, ['#9ed6fb', '#e6f6ff']);
      R(ctx, 90, 40, 27, 27, '#fff3b0');
    },
    layers: [
      { f: 0.06, canvas: makeLayer((g, rnd) => { for (let i = 0; i < 4; i++) cloud(g, rnd() * W, 40 + rnd() * 60, 1.2); }, 31) },
      { f: 0.18, canvas: makeLayer((g, rnd) => {
        hills(g, 190, [[10, 2, 0.3], [6, 5, 1.7]], '#7fae7a');
        for (let i = 0; i < 40; i++) {
          const x = rnd() * W;
          spruce(g, x, Math.round(wave(x, 190, [[10, 2, 0.3], [6, 5, 1.7]])) + 6, 20 + rnd() * 14, '#2f5f45');
        }
        // red barn
        R(g, 500, 172, 42, 27, '#b03a2e'); R(g, 497, 166, 48, 6, '#5a3a32'); R(g, 515, 184, 9, 15, '#f4f1ea');
      }, 32) },
      { f: 0.5, canvas: makeLayer((g, rnd) => {
        R(g, 0, 205, W, RUN_G - 205, '#8cc56b');
        R(g, 0, 205, W, 3, '#9fd47c');
        for (let i = 0; i < 160; i++) R(g, rnd() * W, 210 + rnd() * 42, 3, 3, ['#f7d04a', '#ffffff', '#e86a9a', '#b388eb'][i % 4]);
        // distant fence (faded, so it can't be mistaken for an obstacle)
        for (let x = 0; x < W; x += 30) R(g, x, 214, 3, 12, '#9fbf7e');
        R(g, 0, 217, W, 2, '#a9c78a'); R(g, 0, 222, W, 2, '#a9c78a');
      }, 33) },
      { f: 1, canvas: makeLayer((g, rnd) => {
        R(g, 0, RUN_G, W, H - RUN_G, '#6fb04f');
        R(g, 0, RUN_G, W, 3, '#86c463');
        for (let i = 0; i < 70; i++) {
          const x = rnd() * W, y = RUN_G + 6 + rnd() * 36;
          const c = ['#ffd84a', '#ffffff', '#ff7aa8', '#c39bff', '#ff8a4a'][i % 5];
          R(g, x, y, 3, 3, c); R(g, x - 3, y + 3, 3, 3, c); R(g, x + 3, y + 3, 3, 3, c); R(g, x, y + 3, 3, 3, '#ffe9a8'); R(g, x, y + 6, 3, 3, c);
        }
        for (let i = 0; i < 50; i++) R(g, rnd() * W, RUN_G + 3 + rnd() * 40, 3, 6, '#5e9e43');
      }, 34) },
    ],
  });

  // ---------- Swimming ----------
  const SW = CONFIG.SWIM.surfaceY;
  scenes.swim = () => ({
    back(ctx) {
      vgrad(ctx, 0, SW, ['#8fcaf2', '#e3f4ff']);
      vgrad(ctx, SW, H, ['#5aa9dc', '#3a7fb3', '#2b638f']);
    },
    layers: [
      { f: 0.05, canvas: makeLayer((g, rnd) => { for (let i = 0; i < 4; i++) cloud(g, rnd() * W, 30 + rnd() * 60, 1.2); }, 41) },
      { f: 0.15, canvas: makeLayer((g, rnd) => {
        for (let x = 0; x < W; x += 3) {
          const y = Math.round(wave(x, 172, [[6, 2, 0.8], [4, 7, 2.0]]) / 3) * 3;
          R(g, x, y, 3, SW - y, '#2f5f45');
        }
        for (let i = 0; i < 50; i++) spruce(g, rnd() * W, SW - 4, 22 + rnd() * 18, '#24503a');
        // cottage + sauna on the far shore
        R(g, 300, SW - 24, 30, 18, '#b03a2e'); R(g, 297, SW - 30, 36, 6, '#4a3a3a'); R(g, 309, SW - 18, 6, 12, '#f4f1ea');
        R(g, 350, SW - 15, 18, 12, '#8b5a2b'); R(g, 348, SW - 18, 22, 3, '#4e342e');
        R(g, 368, SW - 6, 24, 3, '#a07850');
        // shoreline
        R(g, 0, SW - 6, W, 6, '#4f7f5a');
      }, 42) },
      { f: 0.6, canvas: makeLayer((g, rnd) => {
        for (let i = 0; i < 9; i++) {
          const x0 = rnd() * W;
          for (let k = 0; k < 7; k++) {
            const x = x0 + k * 5, h = 18 + rnd() * 26;
            wrap(x, 3, (xx) => {
              R(g, xx, SW - h, 3, h, k % 2 ? '#6b8f3a' : '#557a2e');
              if (k % 3 === 0) R(g, xx, SW - h - 6, 3, 9, '#7a4a2a');
            });
          }
        }
      }, 43) },
      { f: 1, canvas: makeLayer((g, rnd) => {
        R(g, 0, H - 12, W, 12, '#b8a26e');
        for (let i = 0; i < 30; i++) R(g, rnd() * W, H - 12 + rnd() * 6, 6, 3, '#8f8a7a');
        for (let i = 0; i < 25; i++) R(g, rnd() * W, SW - 1, 6 + rnd() * 15, 2, 'rgba(255,255,255,0.8)');
      }, 44) },
    ],
    overlay(ctx, t, scroll, x1 = W) {  // x1: where the water ends (the ice arch gate)
      ctx.fillStyle = 'rgba(30, 95, 160, 0.38)';
      ctx.fillRect(0, SW, x1, H - SW);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(0, SW, x1, 2);
    },
  });

  // ---------- Skiing ----------
  let stars = null;
  scenes.ski = () => {
    if (!stars) stars = makeLayer((g, rnd) => {
      for (let i = 0; i < 90; i++) R(g, rnd() * W, rnd() * 180, rnd() < 0.2 ? 3 : 2, rnd() < 0.2 ? 3 : 2, '#ffffff');
      R(g, 690, 30, 24, 24, '#f5f3ce'); R(g, 699, 30, 15, 15, '#e6e3b0');
    }, 51);
    return {
      back(ctx, t) {
        vgrad(ctx, 0, RUN_G, ['#070b24', '#15204a', '#2c3c6e']);
        ctx.globalAlpha = 0.75 + 0.25 * Math.sin(t * 2);
        ctx.drawImage(stars, 0, 0);
        ctx.globalAlpha = 1;
        // aurora ribbons
        const ribbons = [
          { base: 50, col: [93, 255, 176], speed: 0.4, k: 0.011, amp: 18 },
          { base: 80, col: [150, 120, 255], speed: -0.3, k: 0.008, amp: 14 },
        ];
        for (const rb of ribbons) {
          for (let x = 0; x < W; x += 3) {
            const y = rb.base + Math.sin(x * rb.k + t * rb.speed) * rb.amp + Math.sin(x * 0.027 - t * 0.6) * 6;
            const h = 36 + Math.sin(x * 0.02 + t * 0.8) * 16;
            const a = 0.18 + 0.14 * Math.sin(x * 0.015 + t * 1.1);
            for (let j = 0; j < h; j += 6) {
              ctx.fillStyle = `rgba(${rb.col[0]},${rb.col[1]},${rb.col[2]},${Math.max(0, a * (1 - j / h))})`;
              ctx.fillRect(x, Math.round(y + j), 3, 6);
            }
          }
        }
      },
      layers: [
        { f: 0.06, canvas: makeLayer((g) => {
          for (let x = 0; x < W; x += 3) {
            const y = Math.round(wave(x, 175, [[30, 3, 0.2], [14, 7, 1.1]]) / 3) * 3;
            R(g, x, y, 3, H - y, '#22305a');
            if (y < 165) R(g, x, y, 3, Math.min(15, 165 - y), '#d6e2f5');
          }
        }, 52) },
        { f: 0.3, canvas: makeLayer((g, rnd) => {
          R(g, 0, 222, W, H - 222, '#c4d3ea');
          for (let i = 0; i < 34; i++) spruce(g, rnd() * W, 228, 28 + rnd() * 24, '#1d3a3a', '#e8f1fb');
        }, 53) },
        { f: 1, canvas: makeLayer((g, rnd) => {
          R(g, 0, RUN_G, W, H - RUN_G, '#e8f1fb');
          R(g, 0, RUN_G, W, 3, '#ffffff');
          for (let i = 0; i < 20; i++) R(g, rnd() * W, RUN_G + 8 + rnd() * 30, 24 + rnd() * 30, 3, '#cfdcef');
          for (let i = 0; i < 30; i++) R(g, rnd() * W, RUN_G + 4 + rnd() * 40, 2, 2, '#ffffff');
        }, 54) },
      ],
      front(ctx) {
        // ski lift cable (chairs hang from it)
        ctx.fillStyle = '#4b5578';
        ctx.fillRect(0, 57, W, 2);
      },
    };
  };

  // ---------- Wife's office ----------
  scenes.home = () => ({
    back(ctx) { vgrad(ctx, 0, RUN_G, ['#f6b26b', '#f9cb9c']); },
    layers: [
      { f: 0.5, canvas: makeLayer((g, rnd) => {
        // ONE endless bookshelf, floor to ceiling. The tile repeats, so it never ends.
        const SHELF_END = 196;
        R(g, 0, 0, W, SHELF_END + 4, '#4a3328');
        R(g, 0, SHELF_END + 4, W, RUN_G - SHELF_END - 4, '#c9a27a'); R(g, 0, SHELF_END + 4, W, 3, '#a87f57');
        const bookCols = ['#c0392b', '#2980b9', '#27ae60', '#8e44ad', '#f39c12', '#16a085', '#d35400',
          '#2c3e50', '#e84393', '#7f8c8d', '#f1c40f', '#a0522d', '#1abc9c', '#9b59b6'];
        const yarnCols = ['#e84393', '#74b9ff', '#fdcb6e', '#55efc4'];
        for (let top = 0; top < SHELF_END; top += 40) {
          const bottom = top + 36;
          for (let s = 0; s < 5; s++) {
            let x = s * 160 + 8;
            const xe = s * 160 + 158;
            for (;;) {
              const bw = 6 + Math.floor(rnd() * 3) * 3;
              if (x + bw > xe) break;
              const roll = rnd();
              if (roll < 0.05 && x + 14 <= xe) {             // a ball of yarn between the books
                const c = yarnCols[Math.floor(rnd() * yarnCols.length)];
                R(g, x + 1, bottom - 12, 12, 12, c); R(g, x + 3, bottom - 14, 8, 2, c);
                R(g, x + 3, bottom - 9, 8, 1, 'rgba(0,0,0,0.2)'); R(g, x + 3, bottom - 5, 8, 1, 'rgba(0,0,0,0.2)');
                x += 15; continue;
              }
              if (roll < 0.08) { x += 4; continue; }          // small gap
              const bh = 20 + Math.floor(rnd() * 5) * 3;
              const c = bookCols[Math.floor(rnd() * bookCols.length)];
              R(g, x, bottom - bh, bw, bh, c);
              R(g, x, bottom - bh + 3, bw, 2, 'rgba(255,255,255,0.35)');
              R(g, x, bottom - 6, bw, 2, 'rgba(0,0,0,0.2)');
              x += bw + 1;
            }
          }
          R(g, 0, bottom, W, 4, '#8d6e63'); R(g, 0, bottom, W, 1, '#a1887f');
        }
        for (let s = 0; s < 5; s++) { R(g, s * 160, 0, 6, SHELF_END + 4, '#6d4c41'); R(g, s * 160 + 1, 0, 1, SHELF_END + 4, '#8d6e63'); }
        // dim it a little so the game and HUD stay readable in front of all those books
        R(g, 0, 0, W, SHELF_END + 4, 'rgba(40,24,12,0.28)');
        // brass label: Anna-Maria's reading list
        R(g, 246, 113, 66, 11, '#c9a227'); R(g, 247, 114, 64, 9, '#e8c766');
        FONT.draw(g, 'LUKULISTA', 279, 115, { scale: 1, color: '#4e342e', align: 'center' });
        // rolling library ladder on a brass rail
        R(g, 0, 3, W, 3, '#c9a227');
        for (let y = 4; y < SHELF_END + 4; y++) {
          const lx = 520 + Math.round(y * 0.22);
          R(g, lx, y, 4, 1, '#a1887f'); R(g, lx + 30, y, 4, 1, '#a1887f');
        }
        for (let y = 16; y < SHELF_END; y += 18) R(g, 524 + Math.round(y * 0.22), y, 26, 3, '#8d6e63');
        R(g, 518, 2, 8, 6, '#555'); R(g, 548, 2, 8, 6, '#555');
      }, 61) },
      { f: 1, canvas: makeLayer((g) => {
        R(g, 0, RUN_G, W, H - RUN_G, '#b07d4f');
        R(g, 0, RUN_G, W, 3, '#8a5d36');
        for (let y = RUN_G + 12; y < H; y += 12) R(g, 0, y, W, 2, '#986a40');
        for (let x = 0; x < W; x += 90) { R(g, x, RUN_G + 3, 2, 9, '#986a40'); R(g, x + 45, RUN_G + 14, 2, 10, '#986a40'); R(g, x + 20, RUN_G + 26, 2, 10, '#986a40'); }
      }) },
    ],
  });

  // ---------- Finale (sauna yard) ----------
  scenes.finale = () => ({
    back(ctx) {
      vgrad(ctx, 0, RUN_G, ['#6c5b9e', '#e88a6a', '#f7c16e']);
      R(ctx, 560, 150, 39, 39, '#ffe08a');
    },
    layers: [
      { f: 0.08, canvas: makeLayer((g, rnd) => {
        R(g, 0, 190, W, 50, '#7b8fc7');
        for (let i = 0; i < 12; i++) R(g, rnd() * W, 196 + rnd() * 36, 30 + rnd() * 40, 2, '#f5c99a');
        for (let x = 0; x < W; x += 3) { const y = Math.round(wave(x, 178, [[5, 3, 0.3], [3, 8, 1.2]]) / 3) * 3; R(g, x, y, 3, 192 - y, '#3d4a6b'); }
      }, 71) },
      { f: 0.4, canvas: makeLayer((g, rnd) => {
        R(g, 0, 228, W, H - 228, '#4f8a43');
        for (let i = 0; i < 9; i++) {
          const x = rnd() * W;
          wrap(x, 50, (xx) => {
            R(g, xx + 20, 120, 6, 110, '#f4f1ea');
            for (let y = 128; y < 228; y += 15) R(g, xx + 20 + (y % 2) * 3, y, 3, 3, '#333');
            R(g, xx, 96, 48, 42, '#8fbf4a'); R(g, xx + 6, 84, 36, 15, '#a5cf5c'); R(g, xx + 3, 135, 18, 12, '#8fbf4a');
          });
        }
      }, 72) },
      { f: 1, canvas: makeLayer((g, rnd) => {
        R(g, 0, RUN_G, W, H - RUN_G, '#5f9e4a');
        R(g, 0, RUN_G, W, 3, '#77b85e');
        for (let x = 0; x < W; x += 36) R(g, x, RUN_G + 9, 24, 9, '#b8b2a5');
        for (let i = 0; i < 40; i++) R(g, rnd() * W, RUN_G + 22 + rnd() * 20, 3, 6, '#4f8a43');
      }, 73) },
    ],
  });

  const cache = {};
  function get(key) {
    if (!cache[key]) cache[key] = scenes[key]();
    return cache[key];
  }

  function draw(ctx, key, scroll, t, withFront = true) {
    const s = get(key);
    s.back(ctx, t);
    for (const L of s.layers) {
      const off = Math.floor(((scroll * L.f) % W + W) % W);
      ctx.drawImage(L.canvas, -off, 0);
      ctx.drawImage(L.canvas, W - off, 0);
    }
    if (s.front && withFront) s.front(ctx, t, scroll);
  }

  function drawOverlay(ctx, key, scroll, t, x1 = W) {
    const s = get(key);
    if (s.overlay) s.overlay(ctx, t, scroll, x1);
  }

  // Pre-build everything at start so there is no hitch between levels
  function init() { for (const k in scenes) get(k); }

  return { init, draw, drawOverlay };
})();
