'use strict';
/* =====================================================================
   CHIẾN TRƯỜNG — giao diện: canvas nhìn ngang + HUD (chân dung đội, tuyệt kỹ) + panel dựng đội hình
   ===================================================================== */
let V = null;                          // trạng thái hiển thị của trận đang chạy
const rc = r => RCOL[r] || '#9aa0a6';
const skillOf = c => (c.type === 'hero' && SKILL[c.job]) ? SKILL[c.job] : null;
const IMGS = n => img(n);
const arenaEl = () => document.getElementById('arena');
const mmss = s => { s = Math.max(0, Math.ceil(s)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };

/* ---------- VFX có giới hạn số lượng ---------- */
function fxs(name, x, y, o = {}) {
  if (!V || (V.fxN > 36 && !o.big)) return null; V.fxN++;
  return fx(name, { x, y, z: o.z || 12, s: o.s || 2, speed: V.speed, hue: o.hue, rot: o.rot, flip: o.flip, delay: o.delay, blend: o.blend, onend: () => { if (V) V.fxN--; } });
}
function banner(txt, cls = 'p', ms = 1500) { const b = document.createElement('div'); b.className = 'turnban ' + cls; b.textContent = txt; arenaEl().appendChild(b); setTimeout(() => b.remove(), ms); }

/* ---------- Khởi động / kết thúc ---------- */
function openArena(n) {
  const bt = startFight(n); if (!bt) return false;
  V = { n, speed: S.battle.speed || 1, floats: [], shots: [], fxN: 0, last: performance.now(), over: false, paused: false, t: 0, shake: 0, white: 0, hudT: 0, gold: 0, raf: 0 };
  bt.auto = !!S.battle.auto;
  const a = arenaEl(); a.classList.add('show'); document.body.classList.add('inbattle');
  a.innerHTML = `<canvas id="bcv" width="1280" height="720"></canvas>
    <div id="bhud"><button class="bpause" data-b="pause">❚❚</button>
      <div class="bpill"><span class="hg">⏳</span><b id="btime">00:00</b></div><div class="bpill wave"><b id="bwave">1/3</b></div>
      <div class="bctl"><button class="sm" data-b="auto" id="bauto">AUTO</button><button class="sm" data-b="speed" id="bspeed">x1</button></div>
      <div class="bpill r"><span class="ico-c"></span><b id="bgold">0</b></div><div class="bpill r"><span>${CHAPTERS[bt.st.chapter].split('·')[0]}</span><b>${bt.st.boss ? '👑 ' : ''}${bt.st.name}</b></div>
      <div class="bteam" id="bteam"></div><button class="bult" data-b="ult" id="bult"><i></i><em class="gp" style="background-image:url(${curGeneral().idle.src})"></em><span>HIỆU LỆNH</span></button></div>`;
  V.cv = document.getElementById('bcv'); V.cx = V.cv.getContext('2d'); V.cx.imageSmoothingEnabled = false;
  updateCtl(); V.raf = requestAnimationFrame(arenaLoop); return true;
}
function closeArena() { if (V) cancelAnimationFrame(V.raf); const a = arenaEl(); a.classList.remove('show'); a.innerHTML = ''; document.body.classList.remove('inbattle'); document.querySelectorAll('#stage > .fx').forEach(e => e.stop && e.stop()); V = null; BT = null; render(); }
function updateCtl() { const a = document.getElementById('bauto'), s = document.getElementById('bspeed'); if (a) { a.textContent = 'AUTO ' + (BT.auto ? 'BẬT' : 'TẮT'); a.classList.toggle('gold', BT.auto); } if (s) s.textContent = 'x' + V.speed; }
function arenaLoop(now) {
  if (!V) return; const dt = Math.min(0.05, (now - V.last) / 1000); V.last = now; V.t += dt;
  if (!V.paused && !BT.over) {
    let tot = dt * V.speed; while (tot > 1e-6) { const s = Math.min(0.05, tot); btStep(BT, s); tot -= s; handleEvents(); }
  }
  for (const f of V.floats) f.t += dt * (V.paused ? 0 : 1); V.floats = V.floats.filter(f => f.t < 1);
  for (const s of V.shots) s.t += dt * V.speed; V.shots = V.shots.filter(s => s.t < s.dur);
  V.shake = Math.max(0, V.shake - dt); V.white = Math.max(0, V.white - dt * 2.5);
  drawArena(); V.hudT -= dt; if (V.hudT <= 0) { V.hudT = 0.08; updateHud(); }
  if (BT.over && !V.over) { V.over = true; onOver(); }
  V.raf = requestAnimationFrame(arenaLoop);
}

/* ---------- Sự kiện chiến đấu → VFX ---------- */
function handleEvents() {
  const evs = BT.ev.splice(0);
  for (const e of evs) {
    if (e.t === 'hit') {
      const big = e.crit || e.tag === 'skill' || e.tag === 'ult';
      V.floats.push({ x: e.x + (Math.random() * 30 - 15), y: e.y - 90, t: 0, txt: (e.side === 'e' ? '' : '-') + e.dmg, col: e.side === 'e' ? (big ? '#ffd54a' : '#fff') : '#ff6a5a', big });
      if (e.tag === 'ult') fxs('hit_y', e.x, e.y - 50, { s: 2.6 });
      else fxs(big ? 'slash' : 'hit_y', e.x, e.y - 55, { s: big ? 2.6 : 1.8, rot: e.side === 'e' ? 0 : 180 });
    } else if (e.t === 'shot') V.shots.push({ x: e.x, y: e.y, tx: e.tx, ty: e.ty, t: 0, dur: 0.22, side: e.side });
    else if (e.t === 'heal') { V.floats.push({ x: e.x, y: e.y - 100, t: 0, txt: '+' + e.n, col: '#6cff7a' }); fxs('heal', e.x, e.y - 50, { s: 1.1 }); }
    else if (e.t === 'skill') {
      const sk = SKILL[e.job]; if (sk) V.floats.push({ x: e.x, y: e.y - 150, t: 0, txt: sk.n + '!', col: '#7fe8ff', big: true });
      if (e.job === 'lumber') { fxs('ring_big', e.x, e.y - 40, { s: 3, big: true }); fxs('slash', e.x + 90, e.y - 60, { s: 3.4, big: true }); }
      else if (e.job === 'mine') for (const a of alive(BT, 'p')) fxs('defup', a.x, a.y - 60, { s: 1, big: true });
      else if (e.job === 'farm') { for (const a of alive(BT, 'p')) fxs('hearts', a.x, a.y - 60, { s: 1, big: true }); }
      else if (e.job === 'trade') for (const a of alive(BT, 'p')) fxs('atkup', a.x, a.y - 60, { s: 1, big: true });
      else if (e.job === 'garden') fxs('sparkle_g', e.x, e.y - 60, { s: 2.6, big: true });
    } else if (e.t === 'ult') {
      V.white = 1; V.shake = 0.6; banner(curGeneral().ult.toUpperCase() + '!', 'p', 1300); fxs('ring_big', BT.gen.x, BT.gen.y - 60, { s: 3.4, big: true }); fxs('atkup', BT.gen.x, BT.gen.y - 70, { s: 1.6, big: true });
      for (const f of alive(BT, 'e')) { fxs('strike', f.x, f.y - 60, { s: 2.6, big: true }); fxs('boom3', f.x, f.y - 40, { s: 2.6, big: true, delay: 150 }); }
      fxs('zap3', 640, 420, { s: 6, big: true, blend: 'screen' });
    } else if (e.t === 'die') {
      if (e.boss) { fxs('boom2', e.x, e.y - 60, { s: 3.2, big: true }); V.shake = 0.7; }
      else fxs(e.side === 'e' ? 'skull' : 'smoke', e.x, e.y - 60, { s: 2.6 });
      if (e.side === 'e') { const g = Math.floor(rnd(20, 40) * BT.st.n) + (e.boss ? 400 : 0); V.gold += g; V.floats.push({ x: e.x, y: e.y - 40, t: 0, txt: '+' + g, col: '#ffd54a' }); }
    } else if (e.t === 'wave') {
      banner(e.boss ? '⚠ BOSS XUẤT HIỆN!' : `ĐỢT ${e.n}/${WAVES}`, e.boss ? 'e' : 'p', 1600); if (e.boss) { fx('alert', { x: 640, y: 300, s: 3.4, z: 40, speed: V.speed }); V.shake = 0.5; }
    }
  }
}

/* ---------- Vẽ sân đấu ---------- */
function drawBG(cx, t) {
  const g = cx.createLinearGradient(0, 0, 0, 380); g.addColorStop(0, '#6dc3ef'); g.addColorStop(1, '#d6f0ff'); cx.fillStyle = g; cx.fillRect(0, 0, 1280, 400);
  cx.fillStyle = '#fff'; for (let i = 0; i < 6; i++) { const x = ((i * 260 + t * 8) % 1500) - 150, y = 50 + (i % 3) * 38; cx.globalAlpha = .85; cx.beginPath(); cx.ellipse(x, y, 70, 20, 0, 0, 7); cx.ellipse(x + 40, y + 6, 50, 16, 0, 0, 7); cx.ellipse(x - 40, y + 8, 46, 14, 0, 0, 7); cx.fill(); } cx.globalAlpha = 1;
  cx.fillStyle = '#7fa6c9'; cx.beginPath(); cx.moveTo(0, 330); for (let x = 0; x <= 1280; x += 80) cx.lineTo(x, 270 + 40 * Math.sin(x * 0.011 + 1)); cx.lineTo(1280, 340); cx.fill();
  cx.fillStyle = '#5f9a5a'; cx.beginPath(); cx.moveTo(0, 350); for (let x = 0; x <= 1280; x += 60) cx.lineTo(x, 315 + 22 * Math.sin(x * 0.02)); cx.lineTo(1280, 360); cx.fill();
  const gr = IMGS(TS('grass'));
  if (gr.complete && gr.naturalWidth) for (let y = 330; y < 720; y += 64) for (let x = 0; x < 1280; x += 64) cx.drawImage(gr, x, y, 64, 64); else { cx.fillStyle = '#7aa63a'; cx.fillRect(0, 330, 1280, 390); }
  const bd = [['House1', 40, 150, .9], ['House3', 190, 165, .8], ['Tower', 330, 110, .8], ['Castle', 520, 100, .85], ['House2', 840, 150, .85], ['House1', 980, 165, .8], ['House3', 1110, 150, .9]];
  for (const [n, x, y, s] of bd) { const im = IMGS(TS(n)); if (im.complete && im.naturalWidth) cx.drawImage(im, x, y + 20, im.width * s, im.height * s); }
  cx.fillStyle = 'rgba(0,30,0,.18)'; cx.fillRect(0, 330, 1280, 14); cx.fillStyle = 'rgba(0,0,0,.14)'; cx.fillRect(0, 640, 1280, 80);
  const tr = IMGS(TS('Tree1')); if (tr.complete && tr.naturalWidth) for (const [x, y] of [[20, 400], [1230, 420], [1180, 640], [60, 650]]) cx.drawImage(tr, (Math.floor(t * 8) % 8) * 192, 0, 192, 256, x - 80, y - 190, 160, 213);
}
function drawUnit(cx, u, t) {
  const sheet = IMGS('assets/rg/' + u.spr.sheet + '.png'); if (!sheet.complete || !sheet.naturalWidth) return;
  const sz = 32 * u.scale; let ox = 0, oy = 0, alpha = 1, sc = 1;
  if (!u.alive) { const p = u.deadT / 0.7; alpha = 1 - p; sc = 1 + p * 0.2; oy = -p * 20; }
  else { oy = u.moving ? -Math.abs(Math.sin(t * 12 + u.id)) * 8 : Math.sin(t * 3 + u.id) * 2; if (u.atkT > 0) ox = Math.sin((1 - u.atkT / 0.28) * Math.PI) * 34 * u.dir; if (u.stun > 0) ox += Math.sin(t * 40) * 3; }
  cx.save(); cx.globalAlpha = alpha;
  cx.fillStyle = 'rgba(0,0,0,.3)'; cx.beginPath(); cx.ellipse(u.x, u.y + 4, sz * 0.3, sz * 0.09, 0, 0, 7); cx.fill();
  if (u.alive && u.side === 'p' && u.energy >= 100) { cx.strokeStyle = `rgba(127,232,255,${0.5 + 0.5 * Math.sin(t * 8)})`; cx.lineWidth = 4; cx.beginPath(); cx.ellipse(u.x, u.y + 4, sz * 0.42, sz * 0.13, 0, 0, 7); cx.stroke(); }
  if (buffMul(u, 'shield') > 0) { cx.strokeStyle = 'rgba(90,170,255,.8)'; cx.lineWidth = 3; cx.beginPath(); cx.ellipse(u.x, u.y - sz * 0.4, sz * 0.4, sz * 0.5, 0, 0, 7); cx.stroke(); }
  cx.translate(u.x + ox, u.y + oy); cx.scale((u.dir < 0 ? -1 : 1) * sc, sc);
  if (u.flash > 0) cx.filter = 'brightness(2.6)';
  cx.drawImage(sheet, u.spr.c * 32, u.spr.r * 32, 32, 32, -sz / 2, -sz, sz, sz); cx.filter = 'none'; cx.restore();
  if (u.alive) {
    const w = u.boss ? 150 : 70, x = u.x - w / 2, y = u.y - sz - 12;
    cx.fillStyle = '#000b'; cx.fillRect(x - 2, y - 2, w + 4, 11); cx.fillStyle = u.side === 'p' ? '#4cd04c' : '#e0453a'; cx.fillRect(x, y, w * Math.max(0, u.hp / u.max), 7);
    if (u.side === 'p') { cx.fillStyle = '#000b'; cx.fillRect(x - 2, y + 9, w + 4, 6); cx.fillStyle = u.energy >= 100 ? '#7fe8ff' : '#f3c14b'; cx.fillRect(x, y + 10, w * u.energy / 100, 3); }
    if (u.stun > 0) { cx.font = '800 22px Texturina,serif'; cx.fillStyle = '#ffe27a'; cx.fillText('✦✦', u.x - 16, y - 6); }
  }
}
function drawArena() {
  const cx = V.cx, t = V.t; cx.save(); if (V.shake > 0) cx.translate(Math.sin(t * 90) * 8 * V.shake, Math.cos(t * 70) * 6 * V.shake);
  drawBG(cx, t);
  const gen = curGeneral(), cast = BT.gen.cast > 0, gy = BT.gen.y + (cast ? -Math.abs(Math.sin(t * 14)) * 22 : 0);
  cx.fillStyle = 'rgba(0,0,0,.3)'; cx.beginPath(); cx.ellipse(BT.gen.x, BT.gen.y + 4, 46, 11, 0, 0, 7); cx.fill();
  if (cast) { cx.strokeStyle = `rgba(255,213,74,${BT.gen.cast})`; cx.lineWidth = 6; cx.beginPath(); cx.ellipse(BT.gen.x, BT.gen.y + 4, 40 + (1.2 - BT.gen.cast) * 120, 12 + (1.2 - BT.gen.cast) * 40, 0, 0, 7); cx.stroke(); }
  drawGen(cx, gen, cast ? 'walk' : 'idle', t, BT.gen.x, gy, 3.3, true);   // sprite gốc hướng trái → lật để quay mặt về phía quái
  cx.font = '800 17px Texturina,serif'; cx.textAlign = 'center'; cx.lineWidth = 4; cx.strokeStyle = '#000'; cx.strokeText(gen.n, BT.gen.x, BT.gen.y + 30); cx.fillStyle = '#ffe27a'; cx.fillText(gen.n, BT.gen.x, BT.gen.y + 30); cx.textAlign = 'start';
  const all = [...BT.units.filter(u => u.alive), ...BT.dead].sort((a, b) => a.y - b.y); for (const u of all) drawUnit(cx, u, t);
  for (const s of V.shots) { const p = s.t / s.dur, x = s.x + (s.tx - s.x) * p, y = s.y + (s.ty - s.y) * p - Math.sin(p * Math.PI) * 30; cx.fillStyle = s.side === 'p' ? '#8ff' : '#ff7a4a'; cx.beginPath(); cx.arc(x, y, 8, 0, 7); cx.fill(); cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(x, y, 4, 0, 7); cx.fill(); }
  for (const f of V.floats) { const p = f.t; cx.globalAlpha = 1 - p * p; cx.font = `800 ${f.big ? 34 : 24}px Texturina,serif`; cx.textAlign = 'center'; cx.lineWidth = 5; cx.strokeStyle = '#000'; cx.strokeText(f.txt, f.x, f.y - p * 50); cx.fillStyle = f.col; cx.fillText(f.txt, f.x, f.y - p * 50); cx.globalAlpha = 1; cx.textAlign = 'start'; }
  cx.restore();
  if (V.white > 0) { cx.fillStyle = `rgba(255,255,255,${V.white * 0.7})`; cx.fillRect(0, 0, 1280, 720); }
}

/* ---------- HUD ---------- */
function updateHud() {
  const q = id => document.getElementById(id); if (!q('btime')) return;
  q('btime').textContent = mmss(BT.st.limit - BT.t); q('bwave').textContent = `${Math.max(1, BT.wave)}/${WAVES}`; q('bgold').textContent = fmt(V.gold);
  const team = BT.units.filter(u => u.side === 'p');
  q('bteam').innerHTML = team.map(u => `<div class="pt ${u.r} ${u.alive ? '' : 'dead'} ${u.alive && u.energy >= 100 ? 'ready' : ''}" data-b="skill:${u.id}" style="--rc:${rc(u.r)}">${ico(u.spr, 60)}<div class="pn">${u.name}</div>
    <div class="pb hp"><i style="width:${Math.max(0, u.hp / u.max * 100)}%"></i></div><div class="pb en"><i style="width:${u.energy}%"></i></div></div>`).join('');
  const b = q('bult'); b.style.setProperty('--p', BT.ult); b.classList.toggle('ready', BT.ult >= 100);
}
document.addEventListener('pointerdown', e => {
  const t = e.target.closest('[data-b]'); if (!t || e.button) return; const [n, x] = t.dataset.b.split(':');
  if (n === 'team') { if (e.target.closest('[data-a]')) return; toggleTeam(+x); return; }
  if (!V || !BT) return;
  if (n === 'pause') { V.paused = true; showPause(); }
  else if (n === 'resume') { V.paused = false; document.getElementById('bpauseov')?.remove(); }
  else if (n === 'quit') { document.getElementById('bpauseov')?.remove(); if (!BT.over) { finishBattle('lose', BT.st); save(); } closeArena(); }
  else if (n === 'auto') { BT.auto = !BT.auto; S.battle.auto = BT.auto; updateCtl(); }
  else if (n === 'speed') { V.speed = V.speed === 1 ? 2 : V.speed === 2 ? 3 : 1; S.battle.speed = V.speed; updateCtl(); }
  else if (n === 'skill') { const u = BT.units.find(z => z.id === +x); if (u && !V.paused) castSkill(BT, u); }
  else if (n === 'ult') { if (!V.paused) castUlt(BT); }
});
function showPause() { const d = document.createElement('div'); d.id = 'bpauseov'; d.innerHTML = `<div class="card"><h3>Tạm dừng</h3><div class="row"><button class="gold" data-b="resume">Tiếp tục</button><button class="red" data-b="quit">Bỏ cuộc (thua)</button></div></div>`; arenaEl().appendChild(d); }

/* ---------- Kết thúc trận ---------- */
async function onOver() {
  const won = BT.over === 'win';
  if (won) { fx('you_won', { x: 640, y: 230, s: 2.8, z: 40 }); fx('crown', { x: 640, y: 120, s: 3, z: 40 }); for (let i = 0; i < 4; i++) fx('firework', { x: 300 + i * 220, y: 180 + (i % 2) * 110, s: 3, z: 39, delay: i * 250 }); fx('coins', { x: 640, y: 380, s: 3, z: 39, delay: 400 }); }
  else { fx('you_lost', { x: 640, y: 230, s: 2.8, z: 40 }); fx('failure', { x: 640, y: 110, s: 2.4, z: 40 }); }
  await new Promise(r => setTimeout(r, 2300)); if (!V) return;
  const st = BT.st, r = finishBattle(BT.over, st, false); save();
  const rt = r ? [`${fmt(r.gold)} 🪙`, r.gems && `${r.gems} 💎`, r.tickets && `${r.tickets} 🎫`, r.shard != null && `Mảnh thẻ ${HEROES[r.shard].n}`].filter(Boolean).join(' · ') : '';
  const next = won && st.n < STAGE_N && S.battle.energy > 0;
  openModal(`<h2 style="color:${won ? 'var(--gold)' : '#e0594f'}">${won ? '🏆 CHIẾN THẮNG!' : '💀 Thất bại'}</h2><p>${CHAPTERS[st.chapter]} — ${st.name} · ${mmss(BT.t)}</p>${r ? `<div class="card" style="display:inline-block">Phần thưởng: <b class="up">${rt}</b>${r.gems ? '<div class="mut">Thưởng lần đầu qua màn</div>' : ''}</div>` : '<p class="mut">Hãy mạnh hóa thẻ (Lên cấp / lên sao), đổi đội hình hoặc dùng Tuyệt Kỹ đúng lúc rồi thử lại nhé.</p>'}<p>
    <button class="gold" data-a="barena_close">Về</button> <button class="blue" data-a="barena_again:${st.n}" ${S.battle.energy > 0 ? '' : 'disabled'}>Đánh lại</button> ${next ? `<button class="blue" data-a="barena_again:${st.n + 1}">Màn ${st.n + 1} ▶</button>` : ''}</p>`);
}

/* ---------- Panel: dựng đội hình & mạnh hóa thẻ ---------- */
function toggleTeam(id) {
  const t = curTeam().slice(), i = t.indexOf(id);
  if (i >= 0) { if (t.length <= 1) { toast('Cần ít nhất 1 thẻ'); return; } t.splice(i, 1); } else if (t.length >= TEAM_MAX) { toast(`Đội tối đa ${TEAM_MAX} thẻ — bỏ bớt 1 thẻ trước`); return; } else t.push(id);
  S.battle.team = t; save(); render();
}
function pBattle() {
  energyTick(); const b = S.battle, team = curTeam(), roster = ownedHeroes().sort((a, c) => heroPower(c) - heroPower(a));
  const next = Math.min(STAGE_N, b.cleared + 1), win = team.length ? estimateWin(team, next, 6) : 0;
  const stages = []; for (let n = 1; n <= STAGE_N; n++) {
    if (n === 1 || (n - 1) % 10 === 0) stages.push(`<div class="mut" style="margin:8px 0 2px"><b>${CHAPTERS[Math.floor((n - 1) / 10)]}</b></div>`);
    const st = stageDef(n), cl = n <= b.cleared, open = n <= b.cleared + 1;
    stages.push(`<div class="row" style="margin:3px 0;opacity:${open ? 1 : .45}"><span style="width:26px">${cl ? '✅' : open ? '⚔' : '🔒'}</span><div class="sp">${st.boss ? '👑 ' : ''}<b>${st.name}</b> <span class="mut">sức mạnh ${(st.f * 100).toFixed(0)}% ${cl ? '' : '· thưởng lần đầu ' + (st.boss ? '100💎 +1🎫' : '30💎')}</span></div>
      ${cl ? `<button class="sm blue" data-a="bsweep:${n}" ${b.energy < 1 ? 'disabled' : ''}>Tự đánh</button>` : ''}<button class="sm gold" data-a="bfight:${n}" ${open && b.energy >= 1 ? '' : 'disabled'}>Chiến</button></div>`);
  }
  const slots = Array.from({ length: TEAM_MAX }, (_, i) => { const id = team[i]; if (id == null) return `<div class="tslot empty">+</div>`; const h = HEROES[id], c = heroCard(h); return `<div class="tslot" data-b="team:${id}" title="Bấm để bỏ khỏi đội">${heroImg(h, 44)}<div class="tn">${h.n}</div><div class="mut">Lv ${S.own[id].lv} · ${'★'.repeat(S.own[id].star)}</div><div class="mut">⚔${c.atk} ❤${c.hp}</div>${i < 2 ? '<span class="front">Tiền tuyến</span>' : ''}</div>`; }).join('');
  const roster_ = roster.map(h => {
    const o = S.own[h.id], c = heroCard(h), sk = SKILL[h.job], inT = team.includes(h.id), cost = heroLvCost(h, o);
    return `<div class="rc ${inT ? 'in' : ''}" data-b="team:${h.id}" title="${sk.n}: ${sk.d(c.m)}">${heroImg(h, 44)}<div class="rn">${tag(h.r)} ${h.n}</div><div class="mut">Lv ${o.lv}/${heroLvCap(o)} · <span class="stars">${'★'.repeat(o.star)}</span></div><div class="mut">⚔${c.atk} ❤${c.hp} · ${sk.n}</div><div class="mut">mảnh ${o.shard}/${o.star}</div>
      ${o.lv < heroLvCap(o) ? `<button class="sm" data-a="hlv:${h.id}" ${S.gold < cost ? 'disabled' : ''}>Lên cấp ${fmt(cost)}</button>` : '<span class="mut">Đã tối đa cấp</span>'}</div>`;
  }).join('');
  const gear = ['weapon', 'armor', 'charm', 'potion'].map(sl => `${GSLOT[sl]}: <b>${SPELL_TXT[sl](Math.round(gearBonus(sl) * 100))}</b>`).join(' · ');
  const g = curGeneral(), gb = generalBonus(S.guildLv);
  const genCard = `<div class="card wide"><div class="row"><span class="gp big" style="background-image:url(${g.idle.src})"></span><div class="sp"><h3 style="margin:0">Tướng lĩnh: ${g.n} <span class="mut">· ${g.title}</span></h3><div class="mut">${g.story}</div>
    <div class="mut">Cấp ${S.guildLv} (theo Cấp Thương Hội) · đội +${Math.round(gb.atk * 100)}% công, +${Math.round(gb.hp * 100)}% máu · <b>${g.ult}</b> (nút ở góc phải màn đánh): sát thương x${gb.ult.toFixed(2)}, choáng quái thường 1.6s</div></div></div></div>`;
  return genCard + `<div class="card wide"><div class="row"><div class="sp"><b>Lệnh Bài ${b.energy}/${ENERGY_MAX}</b> <span class="mut">${b.energy < ENERGY_MAX ? 'hồi 1 sau ' + fmtT(energyNext()) : 'đã đầy — hãy dùng!'}</span><div class="bar"><i style="width:${b.energy / ENERGY_MAX * 100}%"></i></div></div><span class="mut">Thắng ${b.wins} · Thua ${b.losses}</span></div>
    <div class="mut" style="margin-top:6px">Dựng đội 5 thẻ, mạnh hóa trước rồi vào trận: quân tự đánh 3 đợt quái. Chân dung sáng lên khi đủ năng lượng — chạm để tung chiêu; hạ quái nạp thanh <b>Hiệu Lệnh</b>. Tướng lĩnh đứng sau đội, hạ quái nạp thanh Hiệu Lệnh. Có thể bật AUTO. Trang bị từ rương tăng sức mạnh cả đội.</div></div>
    <div class="card wide"><h3>Đội hình (${team.length}/${TEAM_MAX}) <span class="mut">· sức mạnh ${fmt(teamPower(team))} · thẻ xếp đầu đứng tiền tuyến</span></h3><div class="tslots">${slots}</div>
      <div class="row" style="margin-top:8px"><button class="sm gold" data-a="bautoteam">Gợi ý đội mạnh nhất</button><span class="mut sp">Khả năng thắng màn ${next}: <b style="color:${win >= .7 ? 'var(--good)' : win >= .4 ? 'var(--gold)' : 'var(--bad)'}">~${Math.round(win * 100)}%</b> (ước tính khi bật Auto)</span></div>
      <div class="mut" style="margin-top:6px">${gear}</div></div>
    <div class="card"><h3>Chiến dịch</h3>${stages.join('')}</div>
    <div class="card wide"><h3>Mạnh hóa thẻ <span class="mut">(bấm thẻ để thêm/bớt khỏi đội)</span></h3><div class="rcgrid">${roster_ || '<span class="mut">Chưa có thẻ — hãy Chiêu mộ!</span>'}</div></div>`;
}
