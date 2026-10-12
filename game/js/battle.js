'use strict';
/* =====================================================================
   ĐẤU THẺ — engine (thuần logic, không đụng DOM) + chiến dịch + phần thưởng
   Luật: căn cứ 30 máu · 4 lane · mana tăng 1/lượt (tối đa 8) · rút 1 lá/lượt
   Quân bài = anh hùng nhận từ gacha · Bùa phép = trang bị nhận từ rương
   Lượt kết thúc → quân của bạn tự đánh lane đối diện (trống thì đánh căn cứ);
   hai bên cùng nhận sát thương (phản đòn).
   ===================================================================== */
const LANES = 4, BASE_HP = 30, HAND_MAX = 7, DECK_MAX = 12, TURN_LIMIT = 40;
const BR = { N: { atk: 2, hp: 3, cost: 1, m: 1 }, R: { atk: 3, hp: 5, cost: 2, m: 1.5 }, SR: { atk: 5, hp: 7, cost: 3, m: 2 }, SSR: { atk: 8, hp: 11, cost: 5, m: 3 } };
const SPELL_VAL = { N: 2, R: 3, SR: 5, SSR: 8 }, SPELL_COST = { N: 1, R: 2, SR: 2, SSR: 3 };
const armorOf = m => m >= 3 ? 3 : m >= 2 ? 2 : 1;
const SKILL = {
  farm:   { n: 'Mùa Gặt',    d: m => `Triệu hồi: hồi ${Math.round(2 * m)} máu căn cứ` },
  lumber: { n: 'Rìu Chẻ',    d: () => 'Đánh: 50% sát thương lan sang lane kề' },
  mine:   { n: 'Giáp Đá',    d: m => `Giảm ${armorOf(m)} sát thương nhận` },
  garden: { n: 'Hồi Phục',   d: m => `Cuối lượt: hồi ${Math.round(1 + m)} máu đồng minh yếu nhất` },
  trade:  { n: 'Nhanh Tay',  d: m => `Triệu hồi: rút ${m >= 3 ? 2 : 1} lá` },
};
const SPELL_TXT = {
  weapon: v => `Gây ${v} sát thương cho 1 mục tiêu địch`, armor: v => `+${v} máu cho 1 quân ta`,
  charm: v => `Hồi ${v} máu căn cứ và rút 1 lá`, potion: v => `+${Math.max(1, Math.ceil(v / 2))} công cho 1 quân ta`,
};

/* ---------- Tạo thẻ ---------- */
function heroCard(h) {
  const o = S.own[h.id], r = BR[h.r], sc = (1 + 0.15 * (o.star - 1)) * (1 + 0.03 * (o.lv - 1));
  return { key: 'h' + h.id, type: 'hero', id: h.id, name: h.n, r: h.r, job: h.job, cost: r.cost, atk: Math.round(r.atk * sc), hp: Math.round(r.hp * sc), m: r.m, spr: { sheet: 'rogues', c: h.c, r: h.rw } };
}
function spellCard(g) {
  const lv = S.gear[g.id], val = Math.round(SPELL_VAL[g.r] * (1 + 0.25 * (lv - 1)));
  return { key: 'g' + g.id, type: 'spell', id: g.id, name: g.n, r: g.r, slot: g.slot, cost: SPELL_COST[g.r], val, spr: { sheet: 'items', c: g.c, r: g.rw } };
}
function cardByKey(k) { const id = +k.slice(1); if (k[0] === 'h') return S.own[id] ? heroCard(HEROES[id]) : null; return S.gear[id] ? spellCard(GEAR[id]) : null; }
function ownedCards() { return [...HEROES.filter(h => S.own[h.id]).map(heroCard), ...GEAR.filter(g => S.gear[g.id]).map(spellCard)]; }
const cardPower = c => c.type === 'hero' ? (c.atk * 1.6 + c.hp) * (c.m > 1 ? 1 : 1) : c.val * 2.5;
function autoDeck() {   // bộ bài gợi ý: tối đa 9 quân mạnh nhất + 3 phép mạnh nhất, bù thêm nếu thiếu
  const all = ownedCards(), heroes = all.filter(c => c.type === 'hero').sort((a, b) => cardPower(b) - cardPower(a)), spells = all.filter(c => c.type === 'spell').sort((a, b) => cardPower(b) - cardPower(a));
  const sp = spells.slice(0, Math.min(3, spells.length)), he = heroes.slice(0, DECK_MAX - sp.length);
  const used = new Set([...he, ...sp].map(c => c.key)), rest = [...heroes, ...spells].filter(c => !used.has(c.key));
  return [...he, ...sp, ...rest].slice(0, DECK_MAX).map(c => c.key);
}
function playerDeck() {
  let d = (S.battle.deck || []).filter(k => cardByKey(k)); if (d.length < 5) d = autoDeck(); return d.map(cardByKey);
}

/* ---------- Chiến dịch ---------- */
const MON = [  // [cột, hàng, tên] trong monsters.png theo bậc
  [[2, 0, 'Goblin'], [0, 2, 'Slime Nhỏ'], [11, 6, 'Chuột Khổng Lồ'], [6, 6, 'Dơi Khổng Lồ'], [9, 6, 'Kiến Khổng Lồ']],
  [[0, 0, 'Orc'], [5, 0, 'Goblin Cung Thủ'], [6, 0, 'Goblin Pháp Sư'], [10, 6, 'Sói Quỷ'], [0, 4, 'Bộ Xương'], [4, 4, 'Xác Sống']],
  [[3, 0, 'Orc Kiếm Sĩ'], [2, 1, 'Troll'], [5, 4, 'Ghoul'], [2, 5, 'Hồn Ma'], [0, 1, 'Ettin'], [3, 5, 'Tà Giáo Đồ']],
  [[3, 4, 'Hiệp Sĩ Chết'], [7, 7, 'Minotaur'], [9, 7, 'Medusa'], [1, 8, 'Rồng Nhỏ'], [2, 4, 'Lich'], [2, 7, 'Golem Đá']],
];
const BOSS = [[4, 0, 'Tù Trưởng Orc'], [3, 2, 'Slime Hợp Thể'], [1, 3, 'Giáo Chủ Tà Ác'], [4, 4, 'Zombie Khổng Lồ'], [2, 8, 'Rồng Hang Động'], [3, 4, 'Hiệp Sĩ Chết Vương']];
const CHAPTERS = ['Chương 1 · Đường Thương Mại', 'Chương 2 · Hang Quỷ', 'Chương 3 · Lãnh Địa Rồng'];
const STAGE_N = 30;
function stageDef(n) {
  const boss = n % 5 === 0, ch = Math.floor((n - 1) / 10);
  const f = 0.5 + 0.2 * (n - 1);
  return { n, boss, chapter: ch, f, name: boss ? BOSS[n / 5 - 1][2] : `Màn ${n}`, tier: Math.min(3, Math.floor((n - 1) / 8)) };
}
function enemyCards(st) {
  const cards = [], rnd = Math.random;
  const pool = MON[st.tier], pool2 = MON[Math.max(0, st.tier - 1)];
  for (let i = 0; i < 12; i++) {
    const cost = [1, 1, 2, 2, 2, 3, 3, 4][Math.floor(rnd() * 8)];
    const p = (rnd() < 0.7 ? pool : pool2)[Math.floor(rnd() * pool.length)] || pool[0];
    cards.push({ key: 'm' + i, type: 'hero', name: p[2], r: 'N', job: 'mon', cost, atk: Math.max(1, Math.round((1.1 + 0.9 * cost) * st.f * 0.85)), hp: Math.max(2, Math.round((2 + 1.4 * cost) * st.f * 0.85)), m: 1, spr: { sheet: 'monsters', c: p[0], r: p[1] } });
  }
  if (st.boss) { const b = BOSS[st.n / 5 - 1]; cards.unshift({ key: 'boss', type: 'hero', name: b[2], r: 'SSR', job: 'mon', boss: true, cost: 4, atk: Math.round(5.5 * st.f * 0.85), hp: Math.round(9 * st.f * 0.9), m: 3, spr: { sheet: 'monsters', c: b[0], r: b[1] } }); }
  return cards;
}

/* ---------- Trận đấu ---------- */
let B = null, uidN = 0;
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function mkSide(name, cards, hp) { return { name, hp, max: hp, mana: 0, maxMana: 0, t: 0, deck: shuffle(cards.map(c => ({ ...c }))), hand: [], board: Array(LANES).fill(null), fatigue: 0 }; }
function newBattle(pCards, st) {
  const boss = st.boss ? 20 : 0;
  B = { st, turn: 0, phase: 'player', over: null, ev: [], p: mkSide('Bạn', pCards, BASE_HP), e: mkSide(st.name, enemyCards(st), BASE_HP + boss) };
  // quái boss ra đầu bài cho chắc chắn xuất hiện sớm
  if (st.boss) { const i = B.e.deck.findIndex(c => c.boss); if (i > 0) B.e.deck.unshift(B.e.deck.splice(i, 1)[0]); }
  for (let i = 0; i < 4; i++) { draw(B.p, true); draw(B.e, true); }
  startTurn(B.p); return B;
}
const foeOf = s => s === B.p ? B.e : B.p;
function emit(e) { B.ev.push(e); }
function draw(s, silent) {
  if (!s.deck.length) return;                 // hết bài: không phạt (bộ bài nhỏ vẫn chơi được)
  const c = s.deck.shift(); if (s.hand.length < HAND_MAX) s.hand.push(c);
}
function checkOver() { if (B.over) return; if (B.e.hp <= 0) B.over = 'win'; else if (B.p.hp <= 0) B.over = 'lose'; }
function hurtBase(s, n) { s.hp = Math.max(0, s.hp - n); emit({ t: 'dmg', side: s === B.p ? 'p' : 'e', slot: -1, n }); checkOver(); }
function healBase(s, n) { const h = Math.min(n, s.max - s.hp); s.hp += h; if (h) emit({ t: 'heal', side: s === B.p ? 'p' : 'e', slot: -1, n: h }); }
function startTurn(s) {
  B.phase = s === B.p ? 'player' : 'enemy'; if (s === B.p) B.turn++;
  s.t++; s.maxMana = Math.min(8, s.t + 1); s.mana = s.maxMana;
  for (const u of s.board) if (u) { u.sick = false; if (u.boss) u.atk++; }
  draw(s); emit({ t: 'turn', side: s === B.p ? 'p' : 'e' });
}
function dmgUnit(side, slot, raw, srcSide) {
  const u = side.board[slot]; if (!u) return 0;
  let d = raw; if (u.job === 'mine') d = Math.max(1, raw - armorOf(u.m));
  u.hp -= d; emit({ t: 'dmg', side: side === B.p ? 'p' : 'e', slot, n: d }); return d;
}
function sweepDead() { for (const s of [B.p, B.e]) s.board.forEach((u, i) => { if (u && u.hp <= 0) { emit({ t: 'die', side: s === B.p ? 'p' : 'e', slot: i }); s.board[i] = null; } }); }
function canPlay(s, i) { const c = s.hand[i]; return !!c && c.cost <= s.mana; }
function summon(s, i, slot) {
  const c = s.hand[i]; if (!c || c.type !== 'hero' || c.cost > s.mana || s.board[slot]) return false;
  s.mana -= c.cost; s.hand.splice(i, 1);
  const u = { uid: ++uidN, name: c.name, r: c.r, job: c.job, m: c.m, atk: c.atk, hp: c.hp, max: c.hp, boss: c.boss, spr: c.spr, sick: true };
  s.board[slot] = u; emit({ t: 'summon', side: s === B.p ? 'p' : 'e', slot });
  if (u.job === 'farm') healBase(s, Math.round(2 * u.m));
  if (u.job === 'trade') { draw(s); if (u.m >= 3) draw(s); }
  return true;
}
function spellTargets(c, s) {      // trả về danh sách mục tiêu hợp lệ
  const f = foeOf(s), t = [];
  if (c.slot === 'weapon') { f.board.forEach((u, i) => u && t.push({ side: f === B.p ? 'p' : 'e', slot: i })); t.push({ side: f === B.p ? 'p' : 'e', slot: -1 }); }
  else if (c.slot === 'armor' || c.slot === 'potion') s.board.forEach((u, i) => u && t.push({ side: s === B.p ? 'p' : 'e', slot: i }));
  else t.push({ side: s === B.p ? 'p' : 'e', slot: -1 });
  return t;
}
function cast(s, i, tg) {
  const c = s.hand[i]; if (!c || c.type !== 'spell' || c.cost > s.mana) return false;
  const tgs = spellTargets(c, s); if (!tgs.some(x => x.side === tg.side && x.slot === tg.slot)) return false;
  s.mana -= c.cost; s.hand.splice(i, 1);
  const tSide = tg.side === 'p' ? B.p : B.e;
  if (c.slot === 'weapon') { if (tg.slot < 0) hurtBase(tSide, c.val); else { const u = tSide.board[tg.slot]; u.hp -= c.val; emit({ t: 'dmg', side: tg.side, slot: tg.slot, n: c.val }); sweepDead(); } }
  else if (c.slot === 'armor') { const u = tSide.board[tg.slot]; u.hp += c.val; u.max += c.val; emit({ t: 'heal', side: tg.side, slot: tg.slot, n: c.val }); }
  else if (c.slot === 'potion') { const u = tSide.board[tg.slot]; u.atk += Math.max(1, Math.ceil(c.val / 2)); emit({ t: 'buff', side: tg.side, slot: tg.slot }); }
  else { healBase(s, c.val); draw(s); }
  emit({ t: 'cast', side: s === B.p ? 'p' : 'e', name: c.name }); checkOver(); return true;
}
function attackLane(s, slot) {            // trả về true nếu có đòn đánh
  const u = s.board[slot]; if (!u || u.sick || B.over) return false;
  const f = foeOf(s), side = s === B.p ? 'p' : 'e', t = f.board[slot];
  emit({ t: 'atk', side, slot });
  if (t) {
    const back = t.atk; dmgUnit(f, slot, u.atk, s);
    if (u.job === 'lumber') for (const k of [slot - 1, slot + 1]) if (f.board[k]) dmgUnit(f, k, Math.max(1, Math.floor(u.atk / 2)), s);
    dmgUnit(s, slot, back, f);
  } else hurtBase(f, u.atk);
  sweepDead(); return true;
}
function endOfTurn(s) {
  for (let i = 0; i < LANES; i++) { const u = s.board[i]; if (u && u.job === 'garden') { const t = s.board.filter(x => x && x.hp < x.max).sort((a, b) => (a.hp / a.max) - (b.hp / b.max))[0]; if (t) { const k = s.board.indexOf(t), h = Math.min(Math.round(1 + u.m), t.max - t.hp); t.hp += h; emit({ t: 'heal', side: s === B.p ? 'p' : 'e', slot: k, n: h }); } } }
}

/* ---------- AI ---------- */
function aiStep(s) {   // thực hiện 1 hành động; trả về false nếu hết việc
  if (B.over) return false;
  const f = foeOf(s), side = s === B.p ? 'p' : 'e';
  // phép: ưu tiên
  for (let i = 0; i < s.hand.length; i++) {
    const c = s.hand[i]; if (c.type !== 'spell' || c.cost > s.mana) continue;
    let tg = null;
    if (c.slot === 'weapon') {
      const lethal = f.hp <= c.val; const fid = f === B.p ? 'p' : 'e';
      if (lethal) tg = { side: fid, slot: -1 };
      else { let best = -1, bv = 0; f.board.forEach((u, k) => { if (u && u.hp <= c.val && u.atk + u.hp > bv) { bv = u.atk + u.hp; best = k; } }); if (best >= 0) tg = { side: fid, slot: best }; else if (s.hand.every(x => x.type === 'spell' || x.cost > s.mana)) tg = { side: fid, slot: -1 }; }
    } else if (c.slot === 'armor' || c.slot === 'potion') {
      let bk = -1, bv = -1; s.board.forEach((u, k) => { if (u && u.atk + u.hp > bv) { bv = u.atk + u.hp; bk = k; } }); if (bk >= 0) tg = { side, slot: bk };
    } else if (s.max - s.hp >= Math.min(c.val, 4)) tg = { side, slot: -1 };
    if (tg && cast(s, i, tg)) return true;
  }
  // quân: ra lá đắt nhất đủ mana
  let bi = -1; s.hand.forEach((c, i) => { if (c.type === 'hero' && c.cost <= s.mana && (bi < 0 || c.cost > s.hand[bi].cost || (c.cost === s.hand[bi].cost && c.atk + c.hp > s.hand[bi].atk + s.hand[bi].hp))) bi = i; });
  if (bi >= 0) {
    const empty = []; for (let k = 0; k < LANES; k++) if (!s.board[k]) empty.push(k);
    if (empty.length) {
      empty.sort((a, b) => (f.board[b] ? f.board[b].atk : 0) - (f.board[a] ? f.board[a].atk : 0));   // chặn quân địch mạnh trước
      const c = s.hand[bi]; const facing = empty.find(k => f.board[k] && f.board[k].atk >= c.hp);
      if (summon(s, bi, facing !== undefined ? facing : empty[0])) return true;
    }
  }
  return false;
}
function runTurn(s) {          // dùng cho mô phỏng/quét: AI chơi trọn lượt rồi tấn công
  let g = 0; while (g++ < 20 && aiStep(s)); for (let k = 0; k < LANES; k++) attackLane(s, k); endOfTurn(s); sweepDead();
}
function simulateBattle(pCards, st) {
  newBattle(pCards, st); let guard = 0;
  while (!B.over && guard++ < 200) {
    const s = B.phase === 'player' ? B.p : B.e; runTurn(s); checkOver(); if (B.over) break;
    if (B.turn >= TURN_LIMIT) { B.over = B.p.hp / B.p.max >= B.e.hp / B.e.max ? 'win' : 'lose'; break; }
    startTurn(s === B.p ? B.e : B.p);
  }
  return B.over || 'lose';
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
  if (o.star >= 6) { o.shard = 0; }
}
function winRewards(st, first) {
  const gold = Math.floor(Math.max(300 * st.n, goldRate() * (60 + st.n * 6)));
  const r = { gold, gems: 0, tickets: 0, shard: null };
  if (first) { r.gems = st.boss ? 100 : 30; if (st.boss) r.tickets = 1; if (st.n % 10 === 0) r.tickets += 2; }
  const deckHeroes = (S.battle.deck || []).filter(k => k[0] === 'h').map(k => +k.slice(1)).filter(id => S.own[id]);
  if (deckHeroes.length && Math.random() < (st.boss ? 0.8 : 0.4)) r.shard = deckHeroes[Math.floor(Math.random() * deckHeroes.length)];
  return r;
}
function applyRewards(r) { addGold(r.gold); S.gems += r.gems; S.tickets += r.tickets; if (r.shard != null) addShard(r.shard); }
function finishBattle(result, st, swept) {
  const b = S.battle; let r = null;
  if (result === 'win') {
    const first = st.n > b.cleared; if (first) b.cleared = st.n;
    r = winRewards(st, first); applyRewards(r); b.wins++; bump('wins'); addGuildXp(4);
  } else b.losses++;
  track('battle', { n: st.n, r: result, swept: !!swept }); return r;
}
function startFight(n) {      // trả về B nếu bắt đầu được
  const b = S.battle; energyTick();
  if (n > b.cleared + 1 || n > STAGE_N) { toast('Hãy qua màn trước đã'); return null; }
  if (b.energy < 1) { toast('Hết Lệnh Bài — chờ hồi hoặc thử lại sau'); return null; }
  const deck = playerDeck(); if (deck.filter(c => c.type === 'hero').length < 3) { toast('Cần ít nhất 3 quân anh hùng trong bộ bài'); return null; }
  b.energy--; if (b.energy === ENERGY_MAX - 1) b.eAt = nowMs();
  return newBattle(deck, stageDef(n));
}
function sweepStage(n) {      // "Chiến tự động": AI chơi cho bạn, chỉ tính cho màn đã qua
  const b = S.battle; energyTick(); if (n > b.cleared) return null; if (b.energy < 1) { toast('Hết Lệnh Bài'); return null; }
  const deck = playerDeck(); b.energy--; if (b.energy === ENERGY_MAX - 1) b.eAt = nowMs();
  const st = stageDef(n), res = simulateBattle(deck, st); const r = finishBattle(res, st, true); return { res, r, st };
}
