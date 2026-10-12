'use strict';
/* =====================================================================
   CẢNH LÀNG (canvas) — dân làng làm việc tự động, anh hùng đứng gác
   Asset: Tiny Swords (Pixel Frog) + 32rogues (Seth Boyles)
   ===================================================================== */
const IMG = {};
const img = s => { if (!IMG[s]) { const i = new Image(); i.src = s; IMG[s] = i; } return IMG[s]; };
const W = 960, Hh = 540;
let cv, cx, hot = [], floats = [], pawns = [], sceneT = 0, sparkles = [];

const SITES = {
  farm:   { name: 'Trang Trại', work: [[200, 440], [260, 470], [310, 430], [230, 500], [175, 480]], home: [470, 268], load: 'Run_Meat', tool: 'Idle_Knife', act: 'Interact_Knife', af: 4, hero: [150, 470] },
  lumber: { name: 'Xưởng Gỗ',  work: [[790, 450], [850, 480], [900, 440], [820, 410], [930, 490]], home: [520, 268], load: 'Run_Wood', tool: 'Idle_Axe', act: 'Interact_Axe', af: 6, hero: [760, 500] },
  mine:   { name: 'Mỏ Vàng',   work: [[600, 450], [660, 480], [590, 410], [715, 460], [640, 420]], home: [500, 268], load: 'Run_Gold', tool: 'Idle_Pickaxe', act: 'Interact_Pickaxe', af: 6, hero: [560, 495] },
  garden: { name: 'Tu Viện Dược', work: [[440, 500], [390, 480], [500, 485], [350, 500], [550, 500]], home: [480, 268], load: 'Run', tool: 'Idle_Knife', act: 'Interact_Knife', af: 4, hero: [400, 475] },
};
const FIX = [ // công trình hạ tầng: tab, nhãn
  { id: 'castle', img: 'Castle', x: 320, y: 0, w: 320, h: 256, tab: 'journey', label: () => `Thương Hội Cấp ${S.guildLv}` },
  { id: 'market', img: 'House1', x: 100, y: 20, w: 128, h: 192, tab: 'village', label: () => `Chợ Lv${S.fac.market}` },
  { id: 'warehouse', img: 'House2', x: 700, y: 20, w: 128, h: 192, tab: 'village', label: () => `Kho Lv${S.fac.warehouse}` },
  { id: 'tavern', img: 'House3', x: 830, y: 90, w: 128, h: 192, tab: 'village', label: () => S.fac.tavern ? `Quán Trọ Lv${S.fac.tavern}` : 'Quán Trọ (ngày 2)', locked: () => !dayUnlocked(1) },
  { id: 'port', img: 'Tower', x: 10, y: 130, w: 128, h: 256, tab: 'trade', label: () => dayUnlocked(1) ? `Bến Cảng Lv${S.fac.port}` : 'Bến Cảng (ngày 2)', locked: () => !dayUnlocked(1) },
];
const FRAMES = { Idle: 8, Run: 6, Run_Meat: 6, Run_Wood: 6, Run_Gold: 6, Run_Pickaxe: 6, Run_Knife: 6, Run_Axe: 6, Idle_Knife: 8, Idle_Axe: 8, Idle_Pickaxe: 8, Interact_Knife: 4, Interact_Axe: 6, Interact_Pickaxe: 6 };

function sceneInit() {
  cv = document.getElementById('scene'); cx = cv.getContext('2d'); cx.imageSmoothingEnabled = false;
  cv.addEventListener('click', e => {
    const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * Hh / r.height;
    const h = hot.slice().reverse().find(h => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h); if (h) { if (tab !== h.tab) setTab(h.tab); } else if (tab) setTab(tab);
  });
  cv.addEventListener('mousemove', e => {
    const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * Hh / r.height;
    cv.style.cursor = hot.some(h => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) ? 'pointer' : 'default';
  });
  for (let i = 0; i < 20; i++) sparkles.push({ x: Math.random() * W, y: Math.random() * Hh, v: 10 + Math.random() * 20, p: Math.random() * 6 });
  requestAnimationFrame(sceneLoop); let last = performance.now();
  function sceneLoop(t) { const dt = Math.min(0.1, (t - last) / 1000); last = t; sceneT += dt; try { sceneUpdate(dt); sceneDraw(); } catch (e) { console.error(e); } requestAnimationFrame(sceneLoop); }
}

function wantPawns(k) { const l = S.lv[k]; return l ? Math.min(5, 1 + Math.floor(l / 8)) : 0; }
function sceneUpdate(dt) {
  for (const k of BKEYS) {
    const want = wantPawns(k), have = pawns.filter(p => p.k === k);
    for (let i = have.length; i < want; i++) { const w = SITES[k].work[i]; pawns.push({ k, i, x: w[0], y: w[1], st: 'work', t: Math.random() * 2, face: 1 }); }
    for (let i = have.length - 1; i >= want; i--) pawns.splice(pawns.indexOf(have[i]), 1);
  }
  for (const p of pawns) {
    const s = SITES[p.k], w = s.work[p.i], speed = 70;
    if (p.st === 'work') { p.t -= dt; if (p.t <= 0) { p.st = 'carry'; } }
    else {
      const tg = p.st === 'carry' ? s.home : w; const dx = tg[0] - p.x, dy = tg[1] - p.y, d = Math.hypot(dx, dy);
      if (d < 4) {
        if (p.st === 'carry') { p.st = 'back'; const amt = prodOf(p.k) * 4; floats.push({ x: p.x, y: p.y - 60, t: 0, txt: '+' + fmt(amt * marketPrice(BUILD[p.k].good) * autoPct()) + '🪙' }); }
        else { p.st = 'work'; p.t = 2.5 + Math.random() * 2; }
      } else { p.x += dx / d * speed * dt; p.y += dy / d * speed * dt; p.face = dx >= 0 ? 1 : -1; }
    }
  }
  floats = floats.filter(f => (f.t += dt) < 1.6);
}

function frame(name, speed = 10) { return Math.floor(sceneT * speed) % FRAMES[name]; }
function pawnSprite(p) {
  const s = SITES[p.k]; let name;
  if (p.st === 'work') name = Math.floor(sceneT * 2 + p.i) % 3 === 0 ? s.tool : s.act;
  else if (p.st === 'carry') name = s.load; else name = p.k === 'lumber' ? 'Run_Axe' : p.k === 'mine' ? 'Run_Pickaxe' : p.k === 'farm' || p.k === 'garden' ? 'Run_Knife' : 'Run';
  const sheet = img(TS('Pawn_' + name)); const f = Math.floor(sceneT * 10 + p.i * 3) % FRAMES[name];
  return { sheet, f };
}
function drawFrame(im, fw, fh, f, x, y, sc, flip) {
  if (!im.complete || !im.naturalWidth) return;
  cx.save(); cx.translate(x, y); if (flip) cx.scale(-1, 1);
  cx.drawImage(im, f * fw, 0, fw, fh, -fw * sc / 2, -fh * sc + 24 * sc, fw * sc, fh * sc); cx.restore();
}
function plate(txt, x, y, col = '#f3c14b', sub) {
  cx.font = 'bold 14px Segoe UI'; const w = cx.measureText(txt).width + 16; const px = x - w / 2;
  cx.fillStyle = '#000a'; cx.beginPath(); cx.roundRect(px, y - 15, w, 22, 6); cx.fill();
  cx.fillStyle = col; cx.textAlign = 'center'; cx.fillText(txt, x, y); cx.textAlign = 'start';
}

function sceneDraw() {
  hot = []; cx.clearRect(0, 0, W, Hh);
  const g = img(TS('Tilemap'));
  if (g.complete && g.naturalWidth) for (let y = 0; y < Hh; y += 64) for (let x = 0; x < W; x += 64) cx.drawImage(g, 64, 64, 64, 64, x, y, 64, 64);
  else { cx.fillStyle = '#7aa63a'; cx.fillRect(0, 0, W, Hh); }
  cx.fillStyle = 'rgba(0,0,0,0.06)'; for (let i = 0; i < 40; i++) cx.fillRect((i * 97) % W, (i * 53) % Hh, 30, 6);

  const items = [];
  // trang trí: bụi cây & đá
  [[30, 520], [345, 395], [650, 380], [215, 360], [60, 420], [940, 380]].forEach(([x, y], i) => items.push({ y, d: () => drawFrame(img(TS(i % 2 ? 'Bushe2' : 'Bushe1')), 128, 128, frame('Idle', 6) % 8, x, y, 1, false) }));
  // địa điểm sản xuất (cảnh vật)
  const locked = k => !dayUnlocked(BUILD[k].unlockDay);
  // cừu (trang trại)
  [[210, 420, 0], [300, 495, 2], [120, 500, 4]].forEach(([x, y, o]) => items.push({ y, d: () => { const sc = 0.9; drawFrame(img(TS('Sheep_Grass')), 128, 128, Math.floor(sceneT * 6 + o) % 12, x, y, sc, false); } }));
  // cây (xưởng gỗ)
  [[780, 430, 0], [870, 500, 2], [915, 440, 5], [830, 390, 3]].forEach(([x, y, o]) => items.push({ y, d: () => drawFrame(img(TS(o % 2 ? 'Tree2' : 'Tree1')), 192, 256, Math.floor(sceneT * 8 + o) % 8, x, y, 0.8, false) }));
  // vàng (mỏ)
  [[610, 440, 1], [690, 485, 3], [735, 430, 5]].forEach(([x, y, n]) => items.push({ y, d: () => { if (locked('mine')) { cx.save(); cx.filter = 'grayscale(1) brightness(.7)'; } const im = img(TS('GoldStone' + n)); if (im.complete) cx.drawImage(im, x - 64, y - 90, 128, 128); if (locked('mine')) cx.restore(); } }));
  // tu viện
  items.push({ y: 505, d: () => { if (locked('garden')) { cx.save(); cx.filter = 'grayscale(1) brightness(.7)'; } const im = img(TS('Monastery')); if (im.complete) cx.drawImage(im, 340, 215); if (locked('garden')) cx.restore(); } });
  // hạ tầng
  for (const f of FIX) items.push({ y: f.y + f.h, d: () => { const im = img(TS(f.img)); const lk = f.locked && f.locked(); if (lk) { cx.save(); cx.filter = 'grayscale(1) brightness(.7)'; } if (im.complete) cx.drawImage(im, f.x, f.y); if (lk) cx.restore(); hot.push({ x: f.x, y: f.y, w: f.w, h: f.h, tab: f.tab }); } });
  // pawn
  for (const p of pawns) items.push({ y: p.y, d: () => { const { sheet, f } = pawnSprite(p); drawFrame(sheet, 192, 192, f, p.x, p.y, 0.7, p.face < 0); } });
  // anh hùng được phân công
  for (const slot in S.assign) {
    const h = HEROES[S.assign[slot]]; const pos = slot === 'trade' ? [215, 520] : SITES[slot] && SITES[slot].hero; if (!pos) continue;
    items.push({ y: pos[1] + 30, d: () => {
      const im = img('assets/rg/rogues.png'); const bob = Math.sin(sceneT * 3 + h.id) * 2;
      cx.fillStyle = RCOL[h.r] + '55'; cx.beginPath(); cx.ellipse(pos[0], pos[1] + 26, 26, 8, 0, 0, 7); cx.fill();
      cx.imageSmoothingEnabled = false; if (im.complete) cx.drawImage(im, h.c * 32, h.rw * 32, 32, 32, pos[0] - 40, pos[1] - 52 + bob, 80, 80);
      plate(h.n, pos[0], pos[1] + 42, RCOL[h.r]);
    } });
  }
  items.sort((a, b) => a.y - b.y).forEach(i => i.d());

  // nhãn
  for (const f of FIX) plate(f.label(), f.x + f.w / 2, f.y + f.h + (f.id === 'castle' ? 14 : 6), f.locked && f.locked() ? '#999' : '#f3c14b');
  const lab = { farm: [250, 532], lumber: [850, 532], mine: [650, 532], garden: [440, 532] };
  for (const k of BKEYS) plate(locked(k) ? `${SITES[k].name} (ngày ${BUILD[k].unlockDay + 1})` : S.lv[k] ? `${SITES[k].name} Lv${S.lv[k]}` : `${SITES[k].name} — chưa xây`, lab[k][0], lab[k][1], locked(k) ? '#999' : '#fff');
  // chữ bay
  for (const f of floats) { cx.globalAlpha = 1 - f.t / 1.6; cx.font = 'bold 16px Segoe UI'; cx.fillStyle = '#ffe27a'; cx.strokeStyle = '#000'; cx.lineWidth = 3; cx.strokeText(f.txt, f.x - 20, f.y - f.t * 30); cx.fillText(f.txt, f.x - 20, f.y - f.t * 30); cx.globalAlpha = 1; }
  // Giờ Vàng
  const gi = goldenInfo();
  if (gi.active) {
    cx.fillStyle = 'rgba(255,200,60,0.12)'; cx.fillRect(0, 0, W, Hh);
    for (const s of sparkles) { s.y -= s.v * 0.016; if (s.y < -10) s.y = Hh + 10; cx.globalAlpha = 0.5 + 0.5 * Math.sin(sceneT * 3 + s.p); cx.fillStyle = '#ffe27a'; cx.fillRect(s.x, s.y, 3, 3); } cx.globalAlpha = 1;
  }
}
