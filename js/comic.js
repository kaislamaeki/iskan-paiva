// Intro comic: four panels, advanced with click/tap/space, with a skip button.

// Speech bubble with a little tail pointing at (tx, ty). Returns the bubble rect.
function drawBubble(ctx, text, x, y, tx, ty, opts = {}) {
  const scale = opts.scale || 2;
  const lines = FONT.wrap(String(text).toUpperCase(), opts.maxChars || 22);
  const lh = 9 * scale;
  const w = Math.max(...lines.map((l) => FONT.width(l, scale))) + 8 * scale;
  const h = lines.length * lh + 6 * scale;
  let bx = Math.round(opts.center ? x - w / 2 : x), by = Math.round(y);
  const ink = '#2b2b3b';
  const sx = Math.min(Math.max(tx, bx + 18), bx + w - 18), sy = by + h - 2;
  const tail = () => {
    ctx.beginPath();
    ctx.moveTo(sx - 9, sy);
    ctx.lineTo(sx + 9, sy);
    ctx.lineTo(tx, ty);
    ctx.closePath();
  };
  // outline: body border + tail stroke
  ctx.fillStyle = ink;
  ctx.fillRect(bx - 3, by, w + 6, h);
  ctx.fillRect(bx, by - 3, w, h + 6);
  tail();
  ctx.strokeStyle = ink;
  ctx.lineWidth = 6;
  ctx.lineJoin = 'miter';
  ctx.stroke();
  // fill
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(bx, by, w, h);
  tail();
  ctx.fill();
  lines.forEach((l, i) => FONT.draw(ctx, l, bx + w / 2, by + 3 * scale + i * lh, { scale, color: ink, align: 'center' }));
  return { x: bx, y: by, w, h };
}

// Phone with a chat. messages: [{ text, me }]
function drawPhone(ctx, x, y, w, h, header, messages, opts = {}) {
  const ink = '#2b2b3b';
  ctx.fillStyle = ink;
  ctx.fillRect(x + 6, y, w - 12, h);
  ctx.fillRect(x, y + 6, w, h - 12);
  ctx.fillStyle = '#f4f6fb';
  ctx.fillRect(x + 9, y + 24, w - 18, h - 48);
  ctx.fillStyle = '#555a6e';
  ctx.fillRect(x + w / 2 - 15, y + 9, 30, 4);
  ctx.fillRect(x + w / 2 - 9, y + h - 17, 18, 8);
  // header
  ctx.fillStyle = '#3d7bd9';
  ctx.fillRect(x + 9, y + 24, w - 18, 30);
  if (opts.headerHead) ART.drawHead(ctx, opts.headerHead, x + 30, y + 39, 24);
  FONT.draw(ctx, header, x + (opts.headerHead ? 50 : w / 2), y + 32, { scale: 2, color: '#ffffff', align: opts.headerHead ? 'left' : 'center' });
  // messages
  const scale = 2, maxChars = Math.floor((w - 60) / 12);
  let my = y + 66;
  for (const m of messages) {
    if (m.typing) {
      const bw = 50, bh = 22;
      ctx.fillStyle = '#e1e5ee';
      ctx.fillRect(x + 20, my, bw, bh);
      for (let i = 0; i < 3; i++) {
        const on = Math.floor((opts.t || 0) * 4) % 3 === i;
        ctx.fillStyle = on ? '#555a6e' : '#a0a6b8';
        ctx.fillRect(x + 30 + i * 12, my + 8, 6, 6);
      }
      my += bh + 8;
      continue;
    }
    const lines = FONT.wrap(m.text.toUpperCase(), maxChars);
    const bw = Math.max(...lines.map((l) => FONT.width(l, scale))) + 16;
    const bh = lines.length * 18 + 10;
    const bx = m.me ? x + w - 20 - bw : x + 20;
    ctx.fillStyle = m.me ? '#3d7bd9' : '#e1e5ee';
    ctx.fillRect(bx, my, bw, bh);
    lines.forEach((l, i) => FONT.draw(ctx, l, bx + 8, my + 6 + i * 18, { scale, color: m.me ? '#ffffff' : ink }));
    my += bh + 8;
  }
}

const Comic = {
  panel: 0,
  panelT: 0,
  onDone: null,
  SKIP: { x: 680, y: 16, w: 96, h: 24 },

  start(onDone) {
    this.panel = 0;
    this.panelT = 0;
    this.onDone = onDone;
  },

  update(dt) {
    this.panelT += dt;
    const tap = Input.tap;
    const S = this.SKIP;
    if ((tap && tap.x >= S.x && tap.x <= S.x + S.w && tap.y >= S.y && tap.y <= S.y + S.h) || Input.keys.Escape) {
      this.finish();
      return;
    }
    if (Input.confirm && this.panelT > 0.3) {
      this.panel++;
      this.panelT = 0;
      SOUND.play('click');
      if (this.panel >= STR.comic.length) this.finish();
    }
  },

  finish() {
    const cb = this.onDone;
    this.onDone = null;
    if (cb) cb();
  },

  draw(ctx, t) {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);
    const F = { x: 16, y: 10, w: 768, h: 256 };
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(F.x - 4, F.y - 4, F.w + 8, F.h + 8);
    ctx.save();
    ctx.beginPath();
    ctx.rect(F.x, F.y, F.w, F.h);
    ctx.clip();
    const p = Math.min(this.panel, STR.comic.length - 1);
    this['panel' + p](ctx, F, this.panelT, t, STR.comic[p]);
    ctx.restore();

    // skip button
    const S = this.SKIP;
    ctx.fillStyle = 'rgba(27,27,47,0.85)';
    ctx.fillRect(S.x, S.y, S.w, S.h);
    FONT.draw(ctx, STR.comicSkip + ' ▸▸', S.x + S.w / 2, S.y + 5, { scale: 2, color: '#ffffff', align: 'center' });

    // page dots + continue hint
    for (let i = 0; i < STR.comic.length; i++) {
      ctx.fillStyle = i === p ? '#ffd56b' : '#555a6e';
      ctx.fillRect(W / 2 - 40 + i * 22, 279, 12, 12);
    }
    if (Math.floor(t * 2) % 2 === 0) FONT.draw(ctx, STR.comicNext + ' ▸', W - 20, 279, { scale: 2, color: '#ffffff', align: 'right' });
  },

  // Lauri drawn bigger by scaling the whole context
  bigLauri(ctx, x, feetY, scale, pose, t) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(feetY));
    ctx.scale(scale, scale);
    ART.drawPerson(ctx, 'lauri', 0, 0, pose, t);
    ctx.restore();
  },

  panel0(ctx, F, pt, t, s) {
    // office: Lauri closing his laptop
    ctx.fillStyle = '#efe6d2'; ctx.fillRect(F.x, F.y, F.w, F.h);
    const g = ctx.createLinearGradient(0, 40, 0, 150);
    g.addColorStop(0, '#f6a96b'); g.addColorStop(1, '#ffd8a8');
    ctx.fillStyle = g; ctx.fillRect(540, 40, 180, 110);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(534, 34, 192, 6); ctx.fillRect(534, 150, 192, 8); ctx.fillRect(534, 34, 6, 124); ctx.fillRect(720, 34, 6, 124); ctx.fillRect(627, 40, 6, 110);
    ctx.fillStyle = '#7d8597'; ctx.fillRect(F.x, 236, F.w, 40);
    this.steamPoster(ctx, 36, 34);
    this.bigLauri(ctx, 300, 204, 2, 'stand', t);
    // desk
    ctx.fillStyle = '#8d6e63'; ctx.fillRect(140, 182, 380, 14);
    ctx.fillStyle = '#a1887f'; ctx.fillRect(140, 182, 380, 4);
    ctx.fillStyle = '#6d4c41'; ctx.fillRect(160, 196, 340, 70);
    // laptop closing
    const k = Math.min(1, pt / 0.9);
    const lidH = Math.round(54 * (1 - k)) + 4;
    ctx.fillStyle = '#95a5a6'; ctx.fillRect(262, 176, 96, 6);
    ctx.fillStyle = '#7f8c8d'; ctx.fillRect(268, 176 - lidH, 84, lidH);
    if (lidH > 10) { ctx.fillStyle = '#9fd3ff'; ctx.fillRect(272, 180 - lidH, 76, lidH - 8); }
    // light blue "ISÄ" mug with a bit of steam
    ctx.fillStyle = '#7fbfe8'; ctx.fillRect(432, 154, 12, 20);
    ctx.fillStyle = '#efe6d2'; ctx.fillRect(432, 159, 6, 10);
    ctx.fillStyle = '#a8dcf7'; ctx.fillRect(388, 144, 44, 38);
    ctx.fillStyle = '#7fbfe8'; ctx.fillRect(388, 144, 44, 4); ctx.fillRect(388, 178, 44, 4);
    FONT.draw(ctx, 'ISÄ', 410, 158, { scale: 2, color: '#245a85', align: 'center' });
    for (let i = 0; i < 3; i++) {
      const k = (t * 0.5 + i / 3) % 1;
      ctx.fillStyle = `rgba(255,255,255,${0.7 * (1 - k)})`;
      ctx.fillRect(Math.round(398 + i * 10 + Math.sin(k * 6 + i) * 3), Math.round(136 - k * 28), 3, 6);
    }
    // fidget spinner spinning on the desk
    ctx.save();
    ctx.translate(208, 172);
    ctx.scale(1, 0.7);
    for (let i = 0; i < 3; i++) {
      const a = t * 9 + i * Math.PI * 2 / 3;
      ctx.fillStyle = '#e67e22';
      ctx.beginPath(); ctx.arc(Math.cos(a) * 12, Math.sin(a) * 12, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2b2b3b';
      ctx.beginPath(); ctx.arc(Math.cos(a) * 12, Math.sin(a) * 12, 3.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#bdc3c7';
    ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    if (pt > 0.4) drawBubble(ctx, s.speech, 360, 30, 330, 92);
  },

  // framed poster of a steam locomotive (top-left corner at x, y)
  steamPoster(ctx, x, y) {
    const R = (rx, ry, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x + rx, y + ry, w, h); };
    const C = (cx, cy, rad, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + cx, y + cy, rad, 0, Math.PI * 2); ctx.fill(); };
    R(0, 0, 168, 116, '#5d4037');                // frame
    R(6, 6, 156, 104, '#f3e2bd');                // paper
    R(6, 6, 156, 50, '#f7cf8f');                 // sunset sky
    C(128, 40, 12, '#f39a2b');                   // sun
    R(6, 84, 156, 26, '#c8b48a');                // ground
    R(10, 92, 148, 3, '#4e342e');                // rail
    for (let i = 0; i < 10; i++) R(14 + i * 15, 95, 6, 3, '#6d4c41'); // sleepers
    // smoke from the chimney
    C(104, 34, 7, '#d8d2c4'); C(90, 26, 9, '#e2ddd0'); C(70, 22, 10, '#ebe7dc');
    // locomotive
    R(30, 46, 26, 34, '#7a2a22');                // cab
    R(28, 44, 30, 4, '#2b2b2b');                 // cab roof
    R(36, 52, 12, 10, '#ffd56b');                // cab window
    R(56, 58, 54, 22, '#2d4a3e');                // boiler
    R(70, 58, 3, 22, '#c9a227'); R(92, 58, 3, 22, '#c9a227'); // brass bands
    R(78, 50, 10, 8, '#c9a227');                 // dome
    R(104, 40, 8, 18, '#2b2b2b');                // chimney
    R(102, 38, 12, 4, '#2b2b2b');
    R(110, 56, 8, 24, '#2b2b2b');                // smokebox
    R(28, 78, 94, 5, '#2b2b2b');                 // footplate
    R(120, 78, 8, 3, '#555'); R(122, 81, 8, 3, '#555'); R(124, 84, 8, 3, '#555'); // cowcatcher
    for (const [wx, wr] of [[48, 9], [72, 9], [96, 9], [116, 5]]) {
      C(wx, 92 - wr + 2, wr, '#c0392b');
      C(wx, 92 - wr + 2, 2, '#2b2b2b');
    }
    R(48, 84, 50, 2, '#9aa4ad');                 // coupling rod
  },

  panel1(ctx, F, pt, t, s) {
    // Lauri texting Touko
    ctx.fillStyle = '#dfe9f3'; ctx.fillRect(F.x, F.y, F.w, F.h);
    ctx.fillStyle = '#cfdbe8';
    for (let i = 0; i < 8; i++) ctx.fillRect(F.x + i * 100, F.y, 50, F.h);
    this.bigLauri(ctx, 200, 304, 3, 'stand', t);
    // phone in hand
    ctx.fillStyle = '#2b2b3b'; ctx.fillRect(240, 196, 26, 42);
    ctx.fillStyle = '#9fd3ff'; ctx.fillRect(243, 200, 20, 32);
    ctx.fillStyle = ART.PEOPLE.lauri.shirt; ctx.fillRect(232, 222, 9, 36);
    ctx.fillStyle = '#f1c4a0'; ctx.fillRect(232, 222, 14, 14);
    // big phone screen
    const full = s.phone;
    const n = Math.min(full.length, Math.floor(Math.max(0, pt - 0.3) * 24));
    const msgs = n > 0 ? [{ text: full.slice(0, n), me: true }] : [];
    drawPhone(ctx, 470, 22, 240, 236, 'TOUKO', msgs, { headerHead: 'touko', t });
    if (s.speech) drawBubble(ctx, s.speech, 40, 28, 160, 120, { maxChars: 16 });
  },

  panel2(ctx, F, pt, t, s) {
    // Touko's reply on the phone
    ctx.fillStyle = '#ffe3b3'; ctx.fillRect(F.x, F.y, F.w, F.h);
    ctx.fillStyle = '#ffd38a';
    for (let i = 0; i < 12; i++) for (let j = 0; j < 5; j++) if ((i + j) % 2) ctx.fillRect(F.x + i * 66, F.y + j * 52, 66, 52);
    const msgs = [{ text: STR.comic[1].phone, me: true }];
    if (pt > 0.3 && pt < 1.1) msgs.push({ typing: true });
    if (pt >= 1.1) msgs.push({ text: s.phone, me: false });
    drawPhone(ctx, 270, 16, 260, 244, (s.phoneFrom || 'TOUKO').toUpperCase(), msgs, { headerHead: 'touko', t });
    if (pt >= 1.1) {
      // little hearts + steam for joy
      for (let i = 0; i < 4; i++) {
        const k = ((t * 0.6) + i / 4) % 1;
        ctx.globalAlpha = 1 - k;
        ART.blit(ctx, ART.SPR.heart, 560 + i * 30, 200 - k * 120, 3);
        ART.blit(ctx, ART.SPR.heart, 170 + i * 25, 210 - k * 110, 3);
      }
      ctx.globalAlpha = 1;
    }
  },

  panel3(ctx, F, pt, t, s) {
    // Lauri leaves his own office room into the office corridor (= level 1)
    const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
    R(F.x, F.y, F.w, F.h, '#efe6d2');
    R(F.x, 236, F.w, 40, '#7d8597');
    // his room: the steam engine poster and his desk with the closed laptop + ISÄ mug
    this.steamPoster(ctx, 36, 34);
    R(30, 182, 170, 10, '#8d6e63'); R(30, 182, 170, 3, '#a1887f'); R(44, 192, 142, 44, '#6d4c41');
    R(70, 176, 70, 6, '#95a5a6'); R(74, 174, 62, 3, '#7f8c8d');
    R(150, 156, 26, 26, '#a8dcf7'); R(150, 156, 26, 3, '#7fbfe8'); R(176, 162, 7, 12, '#7fbfe8');
    FONT.draw(ctx, 'ISÄ', 163, 166, { scale: 1, color: '#245a85', align: 'center' });

    // door frame with nameplate
    R(560, 70, 130, 170, '#5d6d7e');
    R(573, 24, 104, 42, '#c9a227'); R(575, 26, 100, 38, '#e8c766');
    FONT.draw(ctx, 'LAURIN', 625, 29, { scale: 2, color: '#4e342e', align: 'center' });
    FONT.draw(ctx, 'TOIMISTO', 625, 47, { scale: 2, color: '#4e342e', align: 'center' });
    // through the door: the office corridor, same look as level 1
    R(572, 80, 106, 156, '#e6dcc4');
    R(572, 80, 106, 5, '#fffbe6');
    R(572, 192, 106, 30, '#d6c39c'); R(572, 189, 106, 3, '#bfa77a');
    R(572, 222, 106, 14, '#7d8597'); R(572, 222, 106, 2, '#5d6475');
    R(586, 168, 22, 54, '#dfe6ec'); R(590, 142, 14, 26, '#8fd3f4'); R(593, 192, 7, 5, '#3498db');
    R(632, 172, 34, 50, '#9aa5b1'); R(632, 188, 34, 2, '#7b8794'); R(632, 205, 34, 2, '#7b8794');
    R(644, 180, 10, 2, '#555'); R(644, 196, 10, 2, '#555'); R(644, 212, 10, 2, '#555');
    R(640, 158, 18, 14, '#c0663d'); R(638, 140, 8, 20, '#4caf50'); R(646, 134, 8, 26, '#3f9a46'); R(654, 144, 6, 16, '#4caf50');
    // door leaf swung open
    R(690, 80, 16, 160, '#a1887f'); R(690, 80, 4, 160, '#8d6e63'); R(698, 156, 5, 10, '#f1c40f');

    const x = Math.min(520, 250 + pt * 110);
    this.bigLauri(ctx, x, 238, 2, x < 520 ? 'walk' : 'wave', t);
    if (pt > 0.3) drawBubble(ctx, s.speech, Math.max(230, x - 190), 40, x - 10, 104);
  },
};
