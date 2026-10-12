'use strict';
/* =====================================================================
   LOGIC GAME: vòng lặp, kinh tế, gacha, nhiệm vụ, retention hooks
   ===================================================================== */

/* ---------- Analytics (cục bộ + endpoint tuỳ chọn) ---------- */
// Đặt window.ANALYTICS_URL = 'https://…' để gửi sự kiện về server; D1/D7 thật phải tính phía server theo cohort.
function track(name, props) {
  const e = { t: nowMs(), d: accDay(), n: name, p: props || {} };
  S.events.push(e); if (S.events.length > 300) S.events.shift();
  try { if (window.ANALYTICS_URL && navigator.sendBeacon) navigator.sendBeacon(window.ANALYTICS_URL, JSON.stringify({ uid: S.first, ...e })); } catch (_) {}
}
function retentionReport() {
  const days = new Set(S.sessions.map(s => s.day));
  return { installDay: dayKey(S.first), activeDays: [...days].sort((a, b) => a - b), d1: days.has(1), d7: days.has(7), sessions: S.sessions.length, loginDays: S.loginDays };
}
function notify(title, body) {
  try { if (S.settings.notify && document.hidden && window.Notification && Notification.permission === 'granted') new Notification(title, { body }); } catch (_) {}
}

/* ---------- Thưởng chung ---------- */
function goldBonus() { return Math.max(500, Math.floor(goldRate() * 1800)); }      // = 30 phút thu nhập
function grant(r, src) {
  const out = [];
  if (r.gems)    { S.gems += r.gems;       out.push(`${r.gems} 💎`); }
  if (r.tickets) { S.tickets += r.tickets; out.push(`${r.tickets} 🎫`); }
  if (r.gold)    { const g = r.gold === 'x' ? goldBonus() : r.gold; addGold(g); out.push(`${fmt(g)} 🪙`); }
  if (r.ssrPick) { S.ssrPick += r.ssrPick; out.push(`Vé SSR tự chọn`); }
  return out.join(' · ');
}
const rewTxt = r => [r.gems && `${r.gems}💎`, r.tickets && `${r.tickets}🎫`, r.gold && (r.gold === 'x' ? '🪙 30p thu nhập' : fmt(r.gold) + '🪙'), r.ssrPick && 'Vé SSR'].filter(Boolean).join(' ');

/* ---------- Vàng & thống kê ---------- */
function addGold(v) {
  S.gold += v; S.stats.gold += v; S.daily.stat.gold += v; S.week.earn += v; S.prestige.run += v;
}
function bump(stat, n = 1) { S.stats[stat] = (S.stats[stat] || 0) + n; S.daily.stat[stat] = (S.daily.stat[stat] || 0) + n; }

/* ---------- Mô phỏng sản xuất ---------- */
function step(c) {
  const cap = capacity();
  for (const k of BKEYS) { const g = BUILD[k].good; S[g] = Math.min(cap, S[g] + prodOf(k) * c); }
  if (S.auto) {
    const keep = cap * S.hold;
    for (const g of GOODS) {
      const amt = Math.floor(S[g] - keep);
      if (amt >= 1) { S[g] -= amt; addGold(amt * marketPrice(g) * autoPct()); }
    }
  }
  S.gemAcc += gemRate() * c;
  if (S.gemAcc >= 1) { const n = Math.floor(S.gemAcc); S.gems += n; S.gemAcc -= n; }
}
function simulate(dt) { while (dt > 0) { const c = Math.min(dt, 30); step(c); dt -= c; } }
function marketStep() {
  for (const g of GOODS) {
    const p = S.price[g] * (1 + (Math.random() - 0.5) * 0.18) + (1 - S.price[g]) * 0.08;
    S.price[g] = Math.min(1.8, Math.max(0.6, p));
    S.hist[g].push(S.price[g]); if (S.hist[g].length > 40) S.hist[g].shift();
  }
}

/* ---------- Ngày / tuần ---------- */
function ensureDay() {
  const k = dayKey(nowMs());
  if (S.daily.key === k) return false;
  S.daily = { key: k, stat: { gold: 0, ups: 0, cars: 0, pulls: 0, sell: 0 }, claimed: {}, ap: 0, apClaimed: {}, free: 0 };
  S.loginDays++;
  S.loginIdx = (S.loginDays - 1) % 7;
  const sn = Math.floor(dayNum(nowMs()) / 28);
  if (S.pass.season !== sn) S.pass = { season: sn, xp: 0, claimed: {} };
  track('daily_login', { loginDays: S.loginDays });
  return true;
}
function hash01(n) { let x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); }
function weekProgress(wk) { const dF = localMs(nowMs()) / DAY; return Math.min(1, Math.max(0, (dF - (wk * 7 - 3)) / 7)); }
function botScores(wk, ref, prog) { return RIVALS.map((n, i) => ({ n, s: ref * (0.2 + 1.6 * hash01(wk * 131 + i * 17)) * Math.pow(prog, 0.9) })); }
function rankNow() { const b = botScores(S.week.key, S.week.ref, weekProgress(S.week.key)); return 1 + b.filter(x => x.s > S.week.earn).length; }
function ensureWeek() {
  const wk = weekIdx(nowMs());
  if (S.week.key === wk) { S.rank = rankNow(); return; }
  let pending = S.week.pending;
  if (S.week.key >= 0 && accDay() >= 1) {
    const b = botScores(S.week.key, S.week.ref, 1); const rank = 1 + b.filter(x => x.s > S.week.earn).length;
    pending = { rank, rew: RANK_REW.find(x => rank <= x.max) };
  }
  S.week = { key: wk, earn: 0, ref: Math.max(3000 * S.guildLv, S.week.earn * 0.6), prevEarn: S.week.earn, pending };
  S.rank = rankNow();
}

/* ---------- Offline ---------- */
function catchUp() {
  const now = nowMs(); let dt = (now - S.last) / 1000; if (dt <= 0) return null;
  dt = Math.min(dt, offlineCap());
  const before = { gold: S.gold, gems: S.gems, food: S.food, wood: S.wood, ore: S.ore, herb: S.herb };
  const carDone = S.caravans.filter(c => c.end <= now).length;
  simulate(dt);
  return dt > 60 ? { dt, gold: S.gold - before.gold, gems: S.gems - before.gems, carDone, goods: GOODS.map(g => [g, S[g] - before[g]]) } : null;
}

/* ---------- Hành động ---------- */
function upgradeBuild(k) {
  const l = S.lv[k]; if (!featOn(BUILD[k].unlockDay)) return;
  const c = upCost(k); if (S.gold < c) return;
  S.gold -= c; S.lv[k]++; bump('ups'); addGuildXp(2); track('upgrade', { k, lv: S.lv[k] });
}
function upgradeMax(k) { let n = 0; while (n < 100 && S.gold >= upCost(k) && featOn(BUILD[k].unlockDay)) { upgradeBuild(k); n++; } }
function upgradeFac(k) {
  if (S.fac[k] >= FAC[k].max || !featOn(FAC[k].unlockDay)) return;
  const c = facCost(k); if (S.gold < c) return;
  S.gold -= c; S.fac[k]++; bump('ups'); addGuildXp(3); track('upgrade_fac', { k, lv: S.fac[k] });
}
function sellAll() {
  let t = 0; const mult = goldenMult();
  for (const g of GOODS) { const n = Math.floor(S[g]); if (n > 0) { S[g] -= n; const v = n * marketPrice(g) * mult * (1 + 0.1 * (S.fac.market > 0 ? 1 : 0)); addGold(v); t += v; } }
  if (t) { bump('sell'); track('sell', { v: Math.floor(t) }); }
  toast(t ? `Giao hàng +${fmt(t)} 🪙${mult > 1 ? ' (Giờ Vàng x1.5)' : ''}` : 'Kho trống');
}
function sendCaravan(route, pct) {
  if (!featOn(ROUTES[route].unlockDay) || S.caravans.length >= caravanSlots()) return;
  const R = ROUTES[route]; const bet = Math.floor(Math.min(S.gold * pct, routeCap(route)));
  if (bet < 50) { toast('Không đủ vàng để xuất phát'); return; }
  S.gold -= bet; S.caravans.push({ route, bet, start: nowMs(), end: nowMs() + R.time * 1000 });
  S.stats.routeUse[route]++; track('caravan_send', { route, bet });
}
function collectCaravan(i) {
  const c = S.caravans[i]; if (!c || nowMs() < c.end) return; const R = ROUTES[c.route];
  const luck = 0.9 + Math.random() * 0.4;
  const profit = c.bet * (R.mult - 1) * portMult() * (1 + slotBuff('trade')) * (1 + gearBonus('armor')) * luck * (goldenInfo().active ? 1.2 : 1);
  const back = Math.floor(c.bet + profit); addGold(back); bump('cars'); addGuildXp(8);
  let msg = `Thương đoàn ${R.n} về: +${fmt(back)} 🪙 (lãi ${fmt(profit)})`;
  if (Math.random() < R.gem[1]) { const g = Math.max(10, Math.floor(R.gem[0] * (0.7 + Math.random() * 0.8))); if (R.gem[0]) { S.gems += g; msg += ` +${g}💎`; } }
  S.caravans.splice(i, 1); toast(msg); track('caravan_done', { route: c.route });
}
function collectAllCaravans() { for (let i = S.caravans.length - 1; i >= 0; i--) collectCaravan(i); }

function assignHero(slot, id) {
  for (const s in S.assign) if (S.assign[s] === id) delete S.assign[s];
  if (id === null) delete S.assign[slot]; else S.assign[slot] = id;
}
function levelHero(id) {
  const o = S.own[id], h = HEROES[id]; if (!o || o.lv >= heroLvCap(o)) return;
  const c = heroLvCost(h, o); if (S.gold < c) return; S.gold -= c; o.lv++; track('hero_lv', { id, lv: o.lv });
}

/* ---------- Gacha ---------- */
const pick = a => a[Math.floor(Math.random() * a.length)];
function charSsrRate() { const p = S.pity.c, P = PITY.char; if (p >= P.hard - 1) return 100; return p >= P.soft ? Math.min(100, P.ssr + (p - P.soft + 1) * 6) : P.ssr; }
function chestSsrRate() { const p = S.pity.ch, P = PITY.chest; if (p >= P.hard - 1) return 100; return p >= P.soft ? Math.min(100, P.ssr + (p - P.soft + 1) * 5) : P.ssr; }
function pullChar(forceSSR) {
  const P = PITY.char; const ssr = forceSSR ? 100 : charSsrRate(); S.pity.c++; S.pity.sr++;
  let r; const x = Math.random() * 100;
  if (x < ssr) r = 'SSR'; else if (S.pity.sr >= P.srGuar) r = 'SR';
  else { const y = Math.random() * (100 - ssr); r = y < P.sr ? 'SR' : y < P.sr + P.r ? 'R' : 'N'; }
  if (r === 'SSR') { S.pity.c = 0; S.pity.sr = 0; } else if (r === 'SR') S.pity.sr = 0;
  let c;
  if (r === 'SSR') {
    const f = ssrFeatured();
    if (forceSSR || S.pity.lost || Math.random() < 0.5) { c = HEROES[f]; S.pity.lost = false; }
    else { c = pick(HEROES.filter(h => h.r === 'SSR' && h.id !== f)); S.pity.lost = true; }
  } else c = pick(HEROES.filter(h => h.r === r));
  const o = S.own[c.id]; let dup = false;
  if (!o) S.own[c.id] = { star: 1, shard: 0, lv: 1 };
  else {
    dup = true; o.shard++;
    while (o.star < 6 && o.shard >= o.star) { o.shard -= o.star; o.star++; }
    if (o.star >= 6) { o.shard = 0; S.gems += { N: 5, R: 15, SR: 40, SSR: 100 }[c.r]; }
  }
  bump('pulls'); addGuildXp(3);
  return { kind: 'hero', r, n: c.n, hero: c, dup, star: S.own[c.id].star, isNew: !dup };
}
function pullChest() {
  const P = PITY.chest; const ssr = chestSsrRate(); S.pity.ch++; S.pity.chsr++;
  let r; const x = Math.random() * 100;
  if (x < ssr) r = 'SSR'; else if (S.pity.chsr >= P.srGuar) r = 'SR';
  else { const y = Math.random() * (100 - ssr); r = y < P.sr ? 'SR' : y < P.sr + P.r ? 'R' : 'N'; }
  if (r === 'SSR') { S.pity.ch = 0; S.pity.chsr = 0; } else if (r === 'SR') S.pity.chsr = 0;
  const g = pick(GEAR.filter(g => g.r === r)); const dup = !!S.gear[g.id];
  S.gear[g.id] = Math.min(8, (S.gear[g.id] || 0) + 1);
  bump('chests'); bump('pulls'); addGuildXp(3);
  return { kind: 'gear', r, n: g.n, gear: g, dup, star: S.gear[g.id], isNew: !dup };
}
function doPull(type, n) {
  let res = [];
  if (type === 'hero') {
    const tutorial10 = n === 10 && !S.tut.tenUsed;                       // ×10 tân thủ: miễn phí, chắc chắn SSR
    const useT = tutorial10 ? 0 : Math.min(S.tickets, n), rest = tutorial10 ? 0 : n - useT; const gemCost = rest === 10 ? COST.pull10 : rest * COST.pull;
    if (S.gems < gemCost) { toast('Không đủ ngọc / vé chiêu mộ!'); return; }
    S.tickets -= useT; S.gems -= gemCost;
    for (let i = 0; i < n; i++) res.push(pullChar(tutorial10 && i === n - 1));
    if (tutorial10) S.tut.tenUsed = true;
  } else {
    if (!featOn(2)) { toast('Rương trang bị mở ở ' + gateTxt(2)); return; }
    const cost = n === 10 ? COST.chest10 : COST.chest * n; if (S.gold < cost) { toast('Không đủ vàng!'); return; }
    S.gold -= cost; for (let i = 0; i < n; i++) res.push(pullChest());
  }
  track('pull', { type, n, best: res.reduce((m, r) => Math.max(m, RN.indexOf(r.r)), 0) });
  save(); return res;
}
function claimSsrPick(id) {
  if (S.ssrPick < 1 || !SSR_IDS.includes(id)) return;
  S.ssrPick--; const o = S.own[id];
  if (!o) S.own[id] = { star: 1, shard: 0, lv: 1 }; else { o.shard++; while (o.star < 6 && o.shard >= o.star) { o.shard -= o.star; o.star++; } }
  track('ssr_pick', { id }); toast(`Nhận ${HEROES[id].n}!`);
}

/* ---------- Nhiệm vụ / phần thưởng ---------- */
const dailyGoal = q => q.goal(S);
function claimDaily(id) {
  const q = DAILY.find(x => x.id === id); if (S.daily.claimed[id] || q.get(S) < dailyGoal(q)) return;
  S.daily.claimed[id] = 1; S.gems += q.gems; S.daily.ap += q.ap; S.pass.xp += q.ap; addGuildXp(5); toast(`+${q.gems}💎 +${q.ap} điểm hoạt động`);
}
function claimApChest(i) {
  const c = AP_CHESTS[i]; if (S.daily.apClaimed[i] || S.daily.ap < c.ap) return;
  S.daily.apClaimed[i] = 1; toast('Nhận: ' + grant(c.r));
}
function claimLogin() {
  if (S.loginClaimed === S.daily.key) return;
  S.loginClaimed = S.daily.key; toast('Điểm danh: ' + grant(LOGIN[S.loginIdx])); track('login_claim', { day: S.loginIdx });
}
function claimGoal(id) {
  for (const d of JOURNEY) for (const g of d.goals) if (g.id === id && !S.jclaimed[id] && accDay() >= d.day && g.chk(S)) { S.jclaimed[id] = 1; toast('Hoàn thành: ' + grant(g.rew)); track('goal', { id }); }
}
function claimAch(id) {
  const a = ACH.find(x => x.id === id), t = S.achTier[id] || 0; if (t >= a.tiers.length || a.get(S) < a.tiers[t]) return;
  S.achTier[id] = t + 1; S.gems += a.gem[t]; toast(`Thành tựu ${a.n}: +${a.gem[t]}💎`);
}
function claimPass(t) {
  if (S.pass.claimed[t] || Math.floor(S.pass.xp / PASS_XP) < t + 1) return;
  S.pass.claimed[t] = 1; toast('Sổ Thương Hội: ' + grant(PASS[t]));
}
function claimWeek() {
  const p = S.week.pending; if (!p) return; toast(`Hạng ${p.rank} tuần trước: ${grant(p.rew)}`); S.week.pending = null; track('week_reward', { rank: p.rank });
}
function claimGift() { if (nowMs() < S.giftAt) return; S.giftAt = nowMs() + 600000; S.gems += 30; toast('+30 💎 Quà Thương Hội'); }

/* ---------- Prestige: Mở Chi Nhánh ---------- */
const renownGain = () => Math.max(0, Math.floor(Math.sqrt(S.prestige.run / 2e6)));
function canPrestige() { return featOn(3) && renownGain() >= 1; }
function doPrestige() {
  if (!canPrestige()) return; const g = renownGain();
  S.renown += g; S.prestige.count++; S.prestige.totalRenownEarned += g; S.prestige.run = 0;
  S.gold = 100 + 50 * Math.sqrt(S.renown); GOODS.forEach(x => S[x] = 0);
  S.lv = { farm: 1, lumber: 0, mine: 0, garden: 0 };
  track('prestige', { n: S.prestige.count, gain: g }); toast(`Mở chi nhánh mới! +${g} Danh Vọng (sản lượng x${renownMult().toFixed(2)})`);
}

/* ---------- Gợi ý bước tiếp theo (FTUE + định hướng) ---------- */
function nextHint() {
  const d = accDay();
  if (S.lv.farm < 3) return { t: 'Nâng cấp Trang Trại để tăng thu nhập!', tab: 'village' };
  if (!S.tut.tenUsed) return { t: 'Quà tân thủ: bấm Chiêu Mộ ×10 (miễn phí, chắc chắn có SSR)!', tab: 'gacha' };
  if (!Object.keys(S.assign).length && Object.keys(S.own).length) return { t: 'Phân công anh hùng vào công trình để nhận buff!', tab: 'team' };
  if (S.battle.wins < 1 && Object.keys(S.own).length >= 3) return { t: 'Thử Đấu Thẻ: dùng thẻ anh hùng vừa chiêu mộ để đánh màn 1!', tab: 'battle' };
  if (S.stats.cars < 1) return { t: 'Gửi thương đoàn đầu tiên (Thương mại)!', tab: 'trade' };
  const g = S.week.pending; if (g) return { t: 'Nhận thưởng Bảng Xếp Hạng tuần trước!', tab: 'rival' };
  const open = JOURNEY.filter(j => j.day <= d).flatMap(j => j.goals).filter(x => !S.jclaimed[x.id]);
  const ready = open.find(x => x.chk(S)); if (ready) return { t: `Nhận thưởng: ${ready.n}`, tab: 'journey' };
  if (open.length) return { t: `Mục tiêu: ${open[0].n}`, tab: 'journey' };
  return { t: 'Quay lại vào Giờ Vàng để bán hàng giá x1.5!', tab: 'trade' };
}

/* ---------- Badge đỏ (nút đỏ báo có thưởng chưa nhận) ---------- */
function badges() {
  const b = {};
  b.journey = JOURNEY.some(j => j.day <= accDay() && j.goals.some(g => !S.jclaimed[g.id] && g.chk(S)));
  b.quest = DAILY.some(q => !S.daily.claimed[q.id] && q.get(S) >= dailyGoal(q)) || AP_CHESTS.some((c, i) => !S.daily.apClaimed[i] && S.daily.ap >= c.ap) || S.loginClaimed !== S.daily.key || ACH.some(a => (S.achTier[a.id] || 0) < a.tiers.length && a.get(S) >= a.tiers[S.achTier[a.id] || 0]);
  b.pass = featOn(2) && PASS.some((_, i) => !S.pass.claimed[i] && Math.floor(S.pass.xp / PASS_XP) >= i + 1);
  b.gacha = S.tickets > 0 || S.gems >= COST.pull || S.ssrPick > 0;
  b.trade = S.caravans.some(c => c.end <= nowMs());
  b.rival = !!S.week.pending;
  b.battle = S.battle.energy >= 5 && S.battle.cleared < STAGE_N;
  b.team = false;
  return b;
}

/* ---------- Vòng lặp chính ---------- */
let lastTick = 0, marketAcc = 0, saveAcc = 0, hookAcc = 0, welcome = null;
function gameInit() {
  S.sessions.push({ t: nowMs(), day: accDay() }); if (S.sessions.length > 200) S.sessions.shift();
  welcome = catchUp(); ensureDay(); ensureWeek();
  track('session_start', { day: accDay() }); lastTick = nowMs(); save();
}
function gameTick() {
  const t = nowMs(); let dt = (t - lastTick) / 1000; lastTick = t; if (dt <= 0) return;
  if (dt > 90) { const before = { gold: S.gold, gems: S.gems }; const cd = S.caravans.filter(c => c.end <= t).length; dt = Math.min(dt, offlineCap()); simulate(dt); welcome = { dt, gold: S.gold - before.gold, gems: S.gems - before.gems, carDone: cd, goods: [] }; }
  else simulate(dt);
  energyTick();
  marketAcc += dt; saveAcc += dt; hookAcc += dt;
  if (marketAcc >= 5) { marketAcc = 0; marketStep(); }
  if (ensureDay()) { welcomeDay = true; }
  ensureWeek();
  if (hookAcc >= 2) {
    hookAcc = 0;
    for (const c of S.caravans) if (c.end <= t && !c.notified) { c.notified = 1; notify('Thương đoàn đã về!', 'Vào thu hoạch lợi nhuận.'); }
    const cap = capacity(); if (GOODS.every(g => S[g] >= cap * 0.98) && !S._fullNotified) { S._fullNotified = 1; notify('Nhà kho đã đầy', 'Sản xuất đang dừng — vào bán hàng!'); } else if (!GOODS.every(g => S[g] >= cap * 0.98)) S._fullNotified = 0;
    const gi = goldenInfo(); const gk = dayKey(t) + ':' + gi.id; if (gi.active && S.seenGolden !== gk) { S.seenGolden = gk; notify('Giờ Vàng bắt đầu!', 'Bán hàng giá x1.5, ngọc x2.'); }
  }
  if (saveAcc >= 10) { saveAcc = 0; save(); }
}
let welcomeDay = false;
