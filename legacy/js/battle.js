'use strict';
/* =====================================================================
   CHIẾN TRƯỜNG (auto-battle thời gian thực) — engine thuần logic, không đụng DOM
   Đội 5 thẻ anh hùng dựng sẵn + mạnh hóa trước → trận tự chạy: 3 đợt quái,
   thẻ nạp năng lượng khi đánh/bị đánh, chạm chân dung để tung chiêu (hoặc Auto),
   thanh Tuyệt Kỹ của cả đội nạp khi hạ quái.
   Toạ độ khớp khung game 1280x720 (sân đấu ở nửa dưới).
   ===================================================================== */
const TEAM_MAX = 5, WAVES = 3, ATKX = 6, HPX = 25;
const BR = { N: { atk: 2, hp: 3, m: 1 }, R: { atk: 3, hp: 5, m: 1.5 }, SR: { atk: 5, hp: 7, m: 2 }, SSR: { atk: 8, hp: 11, m: 3 } };
const RANGED_JOB = { farm: 1, garden: 1 };
const SKILL = {
  lumber: { n: 'Vòng Xoáy Rìu', d: m => `Gây ${Math.round(180 + 50 * m)}% công lên kẻ địch quanh mình` },
  mine:   { n: 'Giáp Đá',       d: m => `Cả đội giảm ${Math.round(35 + 5 * m)}% sát thương trong 5s` },
  farm:   { n: 'Mùa Gặt',       d: m => `Hồi ${Math.round(12 + 6 * m)}% máu cả đội` },
  garden: { n: 'Hồi Phục',      d: m => `Hồi ${Math.round(35 + 10 * m)}% máu cho đồng minh yếu nhất` },
  trade:  { n: 'Nhanh Tay',     d: m => `Cả đội đánh nhanh hơn ${Math.round(25 + 5 * m)}% trong 6s` },
};
/* ---------- Hệ phái (nghề) khắc chế theo vòng: Mộc > Nông > Khoáng > Dược > Thương > Mộc ---------- */
const JOBS = ['lumber', 'farm', 'mine', 'garden', 'trade'];
const JOB_ICON = { lumber: '🪓', farm: '🌾', mine: '⛏', garden: '🌿', trade: '⚖' };
const JOB_NAME = { lumber: 'Mộc', farm: 'Nông', mine: 'Khoáng', garden: 'Dược', trade: 'Thương' };
const JOB_BEATS = { lumber: 'farm', farm: 'mine', mine: 'garden', garden: 'trade', trade: 'lumber' };
const jobMult = (a, b) => JOB_BEATS[a] === b ? 1.3 : JOB_BEATS[b] === a ? 0.8 : 1;
function resonance(ids) {            // cộng hưởng đội hình
  const c = {}; ids.forEach(id => c[HEROES[id].job] = (c[HEROES[id].job] || 0) + 1);
  const best = Math.max(0, ...Object.values(c)), kinds = Object.keys(c).length;
  let atk = 0, hp = 0, txt = [];
  if (best >= 5) { atk += 0.25; hp += 0.10; txt.push('Đồng hệ ×5: +25% công +10% máu'); } else if (best >= 4) { atk += 0.18; hp += 0.10; txt.push('Đồng hệ ×4: +18% công +10% máu'); } else if (best >= 3) { atk += 0.10; txt.push('Đồng hệ ×3: +10% công'); }
  if (kinds >= 5) { atk += 0.08; hp += 0.08; txt.push('Đủ 5 hệ: +8% công & máu'); }
  return { atk, hp, txt };
}
const SPELL_TXT = {   // mô tả hiệu ứng trang bị trong chiến đấu (khi nhận từ rương)
  weapon: v => `+${v}% công toàn đội`, armor: v => `+${v}% máu toàn đội`, charm: v => `+${v}% tốc độ nạp năng lượng`, potion: v => `+${v}% sức mạnh kỹ năng`,
};

/* ---------- Thẻ & chỉ số ---------- */
function heroStat(h) { const o = S.own[h.id], r = BR[h.r], sc = (1 + 0.07 * (o.lv - 1)) * (1 + 0.25 * (o.star - 1)); return { atk: r.atk * ATKX * sc, hp: r.hp * HPX * sc }; }
function heroCard(h) { const s = heroStat(h); return { key: 'h' + h.id, type: 'hero', id: h.id, name: h.n, r: h.r, job: h.job, atk: Math.round(s.atk), hp: Math.round(s.hp), m: BR[h.r].m, spr: { sheet: h.sh || 'rogues', c: h.c, r: h.rw } }; }
function spellCard(g) { const lv = S.gear[g.id]; return { key: 'g' + g.id, type: 'gear', id: g.id, name: g.n, r: g.r, slot: g.slot, val: Math.round(GB[g.r] * (1 + 0.25 * (lv - 1))), spr: { sheet: 'items', c: g.c, r: g.rw } }; }
const ownedHeroes = () => HEROES.filter(h => S.own[h.id]);
const heroPower = h => { const s = heroStat(h); return s.atk * 4 + s.hp / 3; };
function autoTeam() { return ownedHeroes().sort((a, b) => heroPower(b) - heroPower(a)).slice(0, TEAM_MAX).map(h => h.id); }
function curTeam() { const t = (S.battle.team || []).filter(id => S.own[id]); return t.length ? t : autoTeam(); }
const teamPower = ids => Math.round(ids.reduce((a, id) => a + heroPower(HEROES[id]), 0) * (1 + gearBonus('weapon') * 0.5 + gearBonus('armor') * 0.5));

/* ---------- Chiến dịch ---------- */
const MON = [  // [cột, hàng, tên, đánh xa?] trong monsters.png theo bậc
  [[2, 0, 'Goblin'], [0, 2, 'Slime Nhỏ'], [11, 6, 'Chuột Khổng Lồ'], [6, 6, 'Dơi Khổng Lồ'], [9, 6, 'Nhện Nhỏ']],
  [[0, 0, 'Orc'], [5, 0, 'Goblin Cung Thủ', 1], [6, 0, 'Goblin Pháp Sư', 1], [10, 6, 'Sói Quỷ'], [0, 4, 'Bộ Xương'], [4, 4, 'Xác Sống']],
  [[3, 0, 'Orc Kiếm Sĩ'], [2, 1, 'Troll'], [5, 4, 'Ghoul'], [2, 5, 'Hồn Ma', 1], [0, 1, 'Ettin'], [3, 5, 'Tà Giáo Đồ', 1]],
  [[3, 4, 'Hiệp Sĩ Chết'], [7, 7, 'Minotaur'], [9, 7, 'Medusa', 1], [1, 8, 'Rồng Nhỏ', 1], [2, 4, 'Lich', 1], [2, 7, 'Golem Đá']],
];
const BOSS = [[4, 0, 'Tù Trưởng Orc'], [3, 2, 'Slime Hợp Thể'], [1, 3, 'Giáo Chủ Tà Ác'], [4, 4, 'Zombie Khổng Lồ'], [2, 8, 'Rồng Hang Động'], [3, 4, 'Hiệp Sĩ Chết Vương']];
const CHAPTERS = ['Chương 1 · Đường Thương Mại', 'Chương 2 · Hang Quỷ', 'Chương 3 · Lãnh Địa Rồng'];
const STAGE_N = 30;
const ENEMY_BASE = { atk: 15, hp: 130 };            // chỉ số quái thường ở "sức mạnh 100%"
function stageDef(n) {
  const boss = n % 5 === 0, ch = Math.floor((n - 1) / 10);
  return { n, boss, chapter: ch, f: 1.0 + 0.4 * (n - 1), name: boss ? BOSS[n / 5 - 1][2] : `Màn ${n}`, tier: Math.min(3, Math.floor((n - 1) / 8)), limit: boss ? 150 : 110, dom: JOBS[n % 5] };
}
function towerDef(f) {                 // Tháp Thử Thách: vô hạn tầng, boss mỗi 10 tầng
  const boss = f % 10 === 0;
  return { n: f, tower: true, boss, chapter: Math.min(2, Math.floor((f - 1) / 20)), f: 1.5 + 0.55 * (f - 1), name: boss ? BOSS[(f / 10 - 1) % BOSS.length][2] : `Tầng ${f}`, tier: Math.min(3, Math.floor((f - 1) / 8)), limit: boss ? 160 : 120, dom: JOBS[(f + 2) % 5], bossIdx: boss ? (f / 10 - 1) % BOSS.length : -1 };
}

/* ---------- Trận đấu ---------- */
let BT = null, uid = 0;
const FIELD = { x0: 120, x1: 1180, y0: 400, y1: 600 };
const SLOT = [[470, 450], [440, 560], [330, 405], [300, 515], [190, 460]];     // vị trí xuất phát của 5 thẻ
const rnd = (a, b) => a + Math.random() * (b - a);
function mkUnit(side, d) { return { id: ++uid, side, flash: 0, atkT: 0, cd: rnd(0.2, 0.9), stun: 0, energy: d.energy || 0, alive: true, buffs: {}, dir: side === 'p' ? 1 : -1, ...d }; }
function newBT(heroIds, st) {
  const gb = generalBonus(S.guildLv), rs = resonance(heroIds), gA = (1 + gearBonus('weapon')) * (1 + gb.atk) * (1 + rs.atk), gH = (1 + gearBonus('armor')) * (1 + gb.hp) * (1 + rs.hp);
  const units = heroIds.map((id, i) => {
    const h = HEROES[id], s = heroStat(h), m = BR[h.r].m;
    return mkUnit('p', { name: h.n, hid: id, r: h.r, job: h.job, m, spr: { sheet: h.sh || 'rogues', c: h.c, r: h.rw }, atk: s.atk * gA, hp: s.hp * gH, max: s.hp * gH, as: 1.25, range: RANGED_JOB[h.job] ? 340 : 85, speed: 150, x: SLOT[i][0] - 90, y: SLOT[i][1], hx: SLOT[i][0], hy: SLOT[i][1], scale: 4, slot: i, energy: 25 + Math.random() * 20 });
  });
  BT = { st, t: 0, wave: 0, waveDelay: 0.6, units, dead: [], ev: [], over: null, paused: false, auto: false, ult: 0, kills: 0, gen: { x: 110, y: 520, cast: 0 }, gb, rs };
  return BT;
}
function spawnWave(bt) {
  bt.wave++; const st = bt.st, wf = [1, 1.12, 1.28][bt.wave - 1], pool = MON[st.tier];
  const n = [3, 4, 5][bt.wave - 1]; const list = [];
  for (let i = 0; i < n; i++) { const p = pool[Math.floor(Math.random() * pool.length)]; list.push({ p, boss: false }); }
  if (st.boss && bt.wave === WAVES) { list.length = 3; list.unshift({ p: BOSS[st.tower ? st.bossIdx : st.n / 5 - 1], boss: true }); }
  list.forEach((e, i) => {
    const k = st.f * wf, strong = !e.boss && /Orc Kiếm|Troll|Ettin|Golem|Minotaur|Hiệp Sĩ/.test(e.p[2]);
    const atk = ENEMY_BASE.atk * k * (e.boss ? 1.6 : strong ? 1.25 : 1), hp = ENEMY_BASE.hp * k * (e.boss ? 7 : strong ? 1.5 : 1);
    bt.units.push(mkUnit('e', { name: e.p[2], r: e.boss ? 'SSR' : 'N', job: e.boss ? st.dom : (Math.random() < 0.6 ? st.dom : JOBS[Math.floor(Math.random() * 5)]), boss: e.boss, spr: { sheet: 'monsters', c: e.p[0], r: e.p[1] }, atk, hp, max: hp, as: 1.5, range: e.p[3] ? 330 : 80, speed: e.boss ? 70 : 85, x: 1330 + i * 70, y: 420 + (i * 83) % 190, scale: e.boss ? 7 : 4, energy: 0 }));
  });
  bt.ev.push({ t: 'wave', n: bt.wave, boss: st.boss && bt.wave === WAVES });
}
const alive = (bt, side) => bt.units.filter(u => u.alive && u.side === side);
const buffMul = (u, k) => (u.buffs[k] && u.buffs[k].t > 0) ? u.buffs[k].v : 0;
function dealDamage(bt, src, tgt, raw, tag) {
  let d = raw; if (src && src.job && tgt.job && tag !== 'ult') d *= jobMult(src.job, tgt.job); const red = tgt.side === 'p' ? Math.min(0.8, bt.units.filter(x => x.alive && x.side === 'p').reduce((a, x) => Math.max(a, buffMul(x, 'shield')), 0)) : 0;
  d *= (1 - red); tgt.hp -= d; tgt.flash = 0.12;
  bt.ev.push({ t: 'hit', id: src ? src.id : 0, tid: tgt.id, dmg: Math.round(d), crit: tag === 'crit', adv: src && src.job && tgt.job ? Math.sign(jobMult(src.job, tgt.job) - 1) : 0, x: tgt.x, y: tgt.y, side: tgt.side, tag });
  const gain = (1 + gearBonus('charm'));
  if (tgt.side === 'p') tgt.energy = Math.min(100, tgt.energy + 4 * gain);
  if (src && src.side === 'p') src.energy = Math.min(100, src.energy + 9 * gain);
  if (tgt.hp <= 0 && tgt.alive) kill(bt, tgt);
}
function kill(bt, u) {
  u.alive = false; u.hp = 0; u.deadT = 0; bt.dead.push(u); bt.ev.push({ t: 'die', id: u.id, x: u.x, y: u.y, side: u.side, boss: !!u.boss });
  if (u.side === 'e') { bt.kills++; bt.ult = Math.min(100, bt.ult + (u.boss ? 40 : 12)); }
}
function nearest(bt, u) {
  let best = null, bd = 1e9; for (const t of bt.units) { if (!t.alive || t.side === u.side) continue; const d = Math.abs(t.x - u.x) + 0.6 * Math.abs(t.y - u.y); if (d < bd) { bd = d; best = t; } } return best;
}
const atkSpeedMul = u => 1 + buffMul(u, 'haste');
function attack(bt, u, t) {
  u.cd = u.as / atkSpeedMul(u); u.atkT = 0.28; u.dir = t.x >= u.x ? 1 : -1;
  const crit = Math.random() < 0.1, d = u.atk * rnd(0.92, 1.08) * (crit ? 1.6 : 1);
  if (u.range > 120) bt.ev.push({ t: 'shot', from: u.id, to: t.id, x: u.x, y: u.y - 40, tx: t.x, ty: t.y - 40, side: u.side });
  dealDamage(bt, u, t, d, crit ? 'crit' : '');
}
const skillPow = u => u.m * (1 + gearBonus('potion'));
function castSkill(bt, u) {
  if (!u.alive || u.energy < 100 || u.side !== 'p') return false;
  u.energy = 0; const m = skillPow(u), allies = alive(bt, 'p'), foes = alive(bt, 'e'); bt.ev.push({ t: 'skill', id: u.id, job: u.job, x: u.x, y: u.y });
  if (u.job === 'lumber') { const k = (180 + 50 * m) / 100; for (const f of foes) if (Math.abs(f.x - u.x) < 320) dealDamage(bt, u, f, u.atk * k, 'skill'); }
  else if (u.job === 'mine') { for (const a of allies) a.buffs.shield = { v: (35 + 5 * m) / 100, t: 5 }; }
  else if (u.job === 'farm') { const p = (12 + 6 * m) / 100; for (const a of allies) healUnit(bt, a, a.max * p); }
  else if (u.job === 'garden') { const t = allies.sort((a, b) => a.hp / a.max - b.hp / b.max)[0]; if (t) healUnit(bt, t, t.max * (35 + 10 * m) / 100); }
  else if (u.job === 'trade') { for (const a of allies) a.buffs.haste = { v: (25 + 5 * m) / 100, t: 6 }; }
  return true;
}
function healUnit(bt, u, n) { const h = Math.min(n, u.max - u.hp); if (h <= 0) return; u.hp += h; bt.ev.push({ t: 'heal', id: u.id, n: Math.round(h), x: u.x, y: u.y }); }
function castUlt(bt) {
  if (bt.ult < 100 || bt.over) return false; bt.ult = 0;
  const allies = alive(bt, 'p'), foes = alive(bt, 'e'), top = allies.reduce((a, u) => a + u.atk, 0);
  bt.ev.push({ t: 'ult' }); bt.gen.cast = 1.2;
  for (const f of foes) { dealDamage(bt, null, f, top * (f.boss ? 1.6 : 3.2) * bt.gb.ult, 'ult'); if (f.alive && !f.boss) f.stun = 1.6; }
  return true;
}
function btStep(bt, dt) {
  if (bt.over || bt.paused) return; bt.t += dt; bt.gen.cast = Math.max(0, bt.gen.cast - dt);
  if (bt.waveDelay > 0) { bt.waveDelay -= dt; if (bt.waveDelay <= 0 && bt.wave < WAVES) spawnWave(bt); }
  const gain = 1 + gearBonus('charm');
  for (const u of bt.units) {
    if (!u.alive) continue;
    u.cd -= dt; u.flash = Math.max(0, u.flash - dt); u.atkT = Math.max(0, u.atkT - dt); u.stun -= dt; u.moving = false;
    for (const k in u.buffs) u.buffs[k].t -= dt;
    if (u.side === 'p') u.energy = Math.min(100, u.energy + 2.2 * gain * dt);
    if (u.stun > 0) continue;
    const t = nearest(bt, u);
    if (!t) { if (u.side === 'p') { const dx = u.hx - u.x, dy = u.hy - u.y, d = Math.hypot(dx, dy); if (d > 4) { u.x += dx / d * u.speed * dt; u.y += dy / d * u.speed * dt; u.moving = true; } } continue; }
    const dx = t.x - u.x, dy = t.y - u.y, d = Math.hypot(dx * 0.9, dy * 1.6);
    u.dir = dx >= 0 ? 1 : -1;
    if (d <= u.range) { if (u.cd <= 0) attack(bt, u, t); }
    else { const dd = Math.hypot(dx, dy) || 1, mv = u.speed * dt; u.x += dx / dd * mv; u.y += dy / dd * mv * 0.9; u.moving = true; }
  }
  const us = bt.units.filter(u => u.alive);       // tách chồng nhau
  for (let i = 0; i < us.length; i++) for (let j = i + 1; j < us.length; j++) { const a = us[i], b = us[j], ddx = a.x - b.x, ddy = a.y - b.y; if (Math.abs(ddx) < 34 && Math.abs(ddy) < 22) { const s = ddy >= 0 ? 1 : -1; a.y += s * 40 * dt; b.y -= s * 40 * dt; if (a.side === b.side) { a.x += Math.sign(ddx || 1) * 20 * dt; b.x -= Math.sign(ddx || 1) * 20 * dt; } } }
  for (const u of us) u.y = Math.max(FIELD.y0, Math.min(FIELD.y1, u.y));
  bt.ult = Math.min(100, bt.ult + 0.6 * dt);
  if (bt.auto) { for (const u of bt.units) if (u.alive && u.side === 'p' && u.energy >= 100) castSkill(bt, u); if (bt.ult >= 100) castUlt(bt); }
  for (const u of bt.dead) u.deadT += dt; bt.dead = bt.dead.filter(u => u.deadT < 0.7);
  const foes = alive(bt, 'e'), mine = alive(bt, 'p');
  if (!mine.length) bt.over = 'lose';
  else if (!foes.length && bt.wave >= WAVES) bt.over = 'win';
  else if (!foes.length && bt.waveDelay <= 0 && bt.wave < WAVES) { bt.waveDelay = 1.6; for (const a of mine) healUnit(bt, a, a.max * 0.08); }
  else if (bt.t > bt.st.limit) bt.over = 'lose';
}
function simulateBattle(ids, st) {       // mô phỏng nhanh (Tự đánh + cân bằng): Auto bật
  const bt = newBT(ids, st); bt.auto = true; let g = 0; while (!bt.over && g++ < 6000) btStep(bt, 0.05); bt.ev.length = 0; return bt.over || 'lose';
}
const estWinCache = {};
function estimateWin(ids, n, k = 8) {
  const key = ids.join(',') + '|' + n + '|' + teamPower(ids) + '|' + [gearBonus('weapon'), gearBonus('armor'), gearBonus('charm'), gearBonus('potion')].join(',');
  if (estWinCache[key] != null) return estWinCache[key];
  let w = 0; for (let i = 0; i < k; i++) if (simulateBattle(ids, stageDef(n)) === 'win') w++; return (estWinCache[key] = w / k);
}

/* ---------- Năng lượng (Lệnh Bài), phần thưởng ---------- */
const ENERGY_MAX = 10, ENERGY_SEC = 480;
function energyTick() {
  const b = S.battle, t = nowMs(); if (b.energy >= ENERGY_MAX) { b.eAt = t; return; }
  const n = Math.floor((t - b.eAt) / 1000 / ENERGY_SEC); if (n > 0) { b.energy = Math.min(ENERGY_MAX, b.energy + n); b.eAt += n * ENERGY_SEC * 1000; if (b.energy >= ENERGY_MAX) b.eAt = t; }
}
const energyNext = () => Math.max(0, ENERGY_SEC - (nowMs() - S.battle.eAt) / 1000);
function addShard(id, n = 1) {
  const o = S.own[id]; if (!o) return; o.shard += n;
  while (o.star < 6 && o.shard >= o.star) { o.shard -= o.star; o.star++; }
  if (o.star >= 6) o.shard = 0;
}
function winRewards(st, first) {
  const gold = Math.floor(Math.max(300 * st.n, goldRate() * (60 + st.n * 6)));
  const r = { gold, gems: 0, tickets: 0, shard: null };
  if (first) { r.gems = st.boss ? 100 : 30; if (st.boss) r.tickets = 1; if (st.n % 10 === 0) r.tickets += 2; }
  const ids = curTeam();
  if (ids.length && Math.random() < (st.boss ? 0.8 : 0.4)) r.shard = ids[Math.floor(Math.random() * ids.length)];
  return r;
}
function applyRewards(r) { addGold(r.gold); S.gems += r.gems; S.tickets += r.tickets; if (r.shard != null) addShard(r.shard); }
function finishBattle(result, st, swept) {
  const b = S.battle; let r = null;
  if (st.tower) {
    if (result === 'win') { const t = S.tower; t.floor = Math.max(t.floor, st.n); r = { gold: Math.floor(Math.max(500 * st.n, goldRate() * (90 + st.n * 12))), gems: st.boss ? 60 : 12, tickets: st.boss ? 1 : 0, dust: st.boss ? 20 : 6, shard: null }; addGold(r.gold); S.gems += r.gems; S.tickets += r.tickets; S.dust += r.dust; b.wins++; bump('wins'); addGuildXp(5); }
    else b.losses++;
    track('tower', { f: st.n, r: result }); return r;
  }
  if (result === 'win') { const first = st.n > b.cleared; if (first) b.cleared = st.n; r = winRewards(st, first); applyRewards(r); b.wins++; bump('wins'); addGuildXp(4); }
  else b.losses++;
  track('battle', { n: st.n, r: result, swept: !!swept }); return r;
}
function startFight(n) {      // bắt đầu trận thủ công; trả về BT
  const b = S.battle; energyTick();
  if (n > b.cleared + 1 || n > STAGE_N) { toast('Hãy qua màn trước đã'); return null; }
  if (b.energy < 1) { toast('Hết Lệnh Bài — chờ hồi hoặc thử lại sau'); return null; }
  const team = curTeam(); if (team.length < 1) { toast('Chưa có anh hùng — hãy Chiêu mộ!'); return null; }
  b.energy--; if (b.energy === ENERGY_MAX - 1) b.eAt = nowMs();
  b.team = team; return newBT(team, stageDef(n));
}
function sweepStage(n) {      // "Tự đánh": mô phỏng nhanh với Auto, chỉ cho màn đã qua
  const b = S.battle; energyTick(); if (n > b.cleared) return null; if (b.energy < 1) { toast('Hết Lệnh Bài'); return null; }
  const team = curTeam(); b.energy--; if (b.energy === ENERGY_MAX - 1) b.eAt = nowMs();
  const st = stageDef(n), res = simulateBattle(team, st); const r = finishBattle(res, st, true); return { res, r, st };
}

function startTower() {
  const t = S.tower; if (t.tries < 1) { toast('Hết lượt Tháp hôm nay — mai quay lại!'); return null; }
  const team = curTeam(); if (team.length < 1) { toast('Chưa có anh hùng — hãy Chiêu mộ!'); return null; }
  t.tries--; S.battle.team = team; return newBT(team, towerDef(t.floor + 1));
}
