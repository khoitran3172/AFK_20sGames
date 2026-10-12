'use strict';
/* =====================================================================
   HỆ THỐNG TREO MÁY (học từ AFK Arena / Idle Heroes / Raid / AdVenture Capitalist)
   1) Thu hoạch Treo Máy theo tiến độ chiến dịch (tích luỹ tối đa 12h+)
   2) Đơn Hàng Thương Hội (cần giữ hàng trong kho → liên kết Nhà Kho/Auto-Trade)
   3) Thám Hiểm: thẻ dự bị đi làm nhiệm vụ theo giờ (có yêu cầu hệ/độ hiếm)
   4) Tháp Thử Thách (lượt theo ngày) — chiến đấu dùng engine chiến trường
   5) Bụi Sao: đổi thành mảnh thẻ để nâng sao có chủ đích
   ===================================================================== */

/* ---------- 1. Treo máy ---------- */
const afkCapH = () => 12 + Math.floor(S.fac.tavern / 2);
function afkRate() {                       // mỗi giờ
  const c = S.battle.cleared;
  return { gold: Math.max(500, goldRate() * 3600 * 0.12) * (1 + c * 0.04), dust: 0.8 + c * 0.1, gems: c >= 10 ? c * 0.3 : 0 };
}
function afkAccrued() {
  const h = Math.min(afkCapH(), Math.max(0, (nowMs() - S.afk.at) / 3600000)), r = afkRate();
  return { h, gold: Math.floor(r.gold * h), dust: Math.floor(r.dust * h), gems: Math.floor(r.gems * h) };
}
function claimAfk() {
  const a = afkAccrued(); if (a.h < 0.1) { toast('Chưa tích luỹ được gì — quay lại sau nhé'); return; }
  addGold(a.gold); S.dust += a.dust; S.gems += a.gems; S.afk.at = nowMs(); S.afk.claims++; bump('afk'); addGuildXp(3);
  toast(`Treo máy ${a.h.toFixed(1)}h: +${fmt(a.gold)}🪙 +${a.dust}✨${a.gems ? ' +' + a.gems + '💎' : ''}`); track('afk_claim', { h: +a.h.toFixed(1) });
}
const afkFastInfo = () => { if (S.afk.fast.key !== S.daily.key) S.afk.fast = { key: S.daily.key, n: 0 }; const n = S.afk.fast.n; return { n, left: 5 - n, cost: n === 0 ? 0 : 40 + n * 20 }; };
function afkFast() {
  const f = afkFastInfo(); if (f.left <= 0) { toast('Hết lượt tua nhanh hôm nay'); return; } if (S.gems < f.cost) { toast('Không đủ ngọc'); return; }
  S.gems -= f.cost; const r = afkRate(), g = Math.floor(r.gold * 2), d = Math.floor(r.dust * 2);
  addGold(g); S.dust += d; S.afk.fast.n++; toast(`Tua nhanh 2h: +${fmt(g)}🪙 +${d}✨`);
}

/* ---------- 5. Bụi Sao → mảnh thẻ ---------- */
const DUST_COST = 4;
function buyShard(id) {
  const o = S.own[id]; if (!o || o.star >= 6) { toast('Thẻ đã tối đa sao'); return; } if (S.dust < DUST_COST) { toast(`Cần ${DUST_COST} Bụi Sao`); return; }
  S.dust -= DUST_COST; addShard(id, 1); toast(`+1 mảnh ${HEROES[id].n}`);
}

/* ---------- 2. Đơn hàng ---------- */
const ORDER_SLOTS = 3, ORDER_COOLDOWN = 12 * 60000;
function genOrder() {
  const cap = capacity(), avail = GOODS.filter(g => BKEYS.some(k => BUILD[k].good === g && S.lv[k] > 0));
  const pool = avail.length ? avail : ['food']; const n = pool.length > 1 && Math.random() < 0.5 ? 2 : 1; const picks = [...pool].sort(() => Math.random() - 0.5).slice(0, n);
  const items = {}; let val = 0; for (const g of picks) { const a = Math.max(20, Math.floor(cap * (0.25 + Math.random() * 0.4) / n)); items[g] = a; val += a * GOOD[g].price; }
  const names = ['Tiệm Bánh Hoàng Gia', 'Đoàn Lính Biên Phòng', 'Hội Thợ Rèn', 'Nhà Trọ Cầu Đá', 'Quân Doanh Phía Bắc', 'Hiệu Thuốc Bạch Liên', 'Lễ Hội Mùa Thu', 'Thương Nhân Xứ Lạ'];
  return { id: Math.random().toString(36).slice(2, 8), who: names[Math.floor(Math.random() * names.length)], items, reward: { gold: Math.floor(val * (1.8 + Math.random() * 0.7)), dust: 2 + Math.floor(val / 400), gems: Math.random() < 0.3 ? 10 + Math.floor(Math.random() * 15) : 0 } };
}
function ordersTick() {
  if (!featOn(1)) return; const o = S.orders;
  while (o.list.length < ORDER_SLOTS && nowMs() >= o.next) { o.list.push(genOrder()); o.next = nowMs() + 1000; }
}
const orderOk = od => Object.entries(od.items).every(([g, n]) => S[g] >= n);
function deliverOrder(i) {
  const od = S.orders.list[i]; if (!od) return; if (!orderOk(od)) { toast('Chưa đủ hàng trong kho'); return; }
  for (const [g, n] of Object.entries(od.items)) S[g] -= n;
  addGold(od.reward.gold); S.dust += od.reward.dust; S.gems += od.reward.gems; S.orders.list.splice(i, 1); S.orders.next = nowMs() + ORDER_COOLDOWN; bump('orders'); addGuildXp(4);
  toast(`Đơn ${od.who}: +${fmt(od.reward.gold)}🪙 +${od.reward.dust}✨${od.reward.gems ? ' +' + od.reward.gems + '💎' : ''}`); track('order_done', {});
}
function skipOrder(i) { const od = S.orders.list[i]; if (!od) return; S.orders.list.splice(i, 1); S.orders.next = nowMs() + 60000; }

/* ---------- 3. Thám hiểm ---------- */
const EXP_TPL = [
  { n: 'Tìm Dược Thảo Hiếm', req: { count: 1, job: 'garden' } }, { n: 'Hộ Tống Đoàn Buôn', req: { count: 2, job: 'trade' } },
  { n: 'Khai Phá Mỏ Cổ', req: { count: 2, job: 'mine' } }, { n: 'Phá Rừng Mở Đường', req: { count: 1, job: 'lumber' } },
  { n: 'Thu Hoạch Mùa Lớn', req: { count: 2, job: 'farm' } }, { n: 'Thám Hiểm Hang Động', req: { count: 3, minR: 'R' } },
  { n: 'Truy Quét Băng Cướp', req: { count: 2, minR: 'SR' } }, { n: 'Nghi Lễ Cổ Xưa', req: { count: 1, minR: 'SSR' } },
  { n: 'Tuần Tra Biên Giới', req: { count: 3 } }, { n: 'Giải Cứu Dân Làng', req: { count: 2, minStar: 2 } },
];
function genMission() {
  const t = EXP_TPL[Math.floor(Math.random() * EXP_TPL.length)], dur = [1, 2, 4, 8][Math.floor(Math.random() * 4)], k = t.req.count * (t.req.minR === 'SSR' ? 2.2 : t.req.minR === 'SR' ? 1.5 : 1);
  return { id: Math.random().toString(36).slice(2, 8), n: t.n, req: t.req, dur, reward: { gold: Math.floor(goldBonus() * dur * 0.5 * (0.8 + k * 0.3)), dust: Math.round(dur * (1 + k) * 1.5), gems: dur >= 4 ? Math.round(dur * 4 * (0.5 + k * 0.3)) : 0, tickets: dur === 8 && Math.random() < 0.5 ? 1 : 0 }, heroes: [], end: 0 };
}
const expBusy = () => { const b = new Set(); for (const m of S.exp.missions) if (m.end) m.heroes.forEach(h => b.add(h)); return b; };
const expSlots = () => 2 + Math.floor(S.guildLv / 6);
function expTick() {
  if (!featOn(2)) return; const E = S.exp;
  if (E.refreshKey !== S.daily.key) { E.missions = E.missions.filter(m => m.end); E.refreshKey = S.daily.key; }
  const idle = E.missions.filter(m => !m.end).length; for (let i = idle; i < 5; i++) E.missions.push(genMission());
}
const meetsReq = (h, rq) => (!rq.job || h.job === rq.job) && (!rq.minR || RN.indexOf(h.r) >= RN.indexOf(rq.minR)) && (!rq.minStar || S.own[h.id].star >= rq.minStar);
function expCandidates(m) {
  const busy = expBusy(), team = new Set(curTeam());
  return ownedHeroes().filter(h => !busy.has(h.id) && !team.has(h.id) && meetsReq(h, m.req)).sort((a, b) => heroPower(a) - heroPower(b));
}
function startExp(id) {
  const m = S.exp.missions.find(x => x.id === id); if (!m || m.end) return;
  if (S.exp.missions.filter(x => x.end).length >= expSlots()) { toast(`Chỉ chạy tối đa ${expSlots()} thám hiểm cùng lúc`); return; }
  const c = expCandidates(m); if (c.length < m.req.count) { toast('Chưa đủ thẻ dự bị đáp ứng yêu cầu (thẻ trong đội chiến đấu không đi được)'); return; }
  m.heroes = c.slice(0, m.req.count).map(h => h.id); m.end = nowMs() + m.dur * 3600000; track('exp_start', { dur: m.dur });
}
function collectExp(id) {
  const i = S.exp.missions.findIndex(x => x.id === id), m = S.exp.missions[i]; if (!m || !m.end || nowMs() < m.end) return;
  addGold(m.reward.gold); S.dust += m.reward.dust; S.gems += m.reward.gems; S.tickets += m.reward.tickets || 0; S.exp.missions.splice(i, 1); bump('exp'); addGuildXp(5);
  toast(`Thám hiểm xong: +${fmt(m.reward.gold)}🪙 +${m.reward.dust}✨${m.reward.gems ? ' +' + m.reward.gems + '💎' : ''}${m.reward.tickets ? ' +1🎫' : ''}`); expTick(); track('exp_done', { dur: m.dur });
}
const reqTxt = rq => [`${rq.count} thẻ`, rq.job && 'hệ ' + JOB_NAME[rq.job] + ' ' + JOB_ICON[rq.job], rq.minR && 'từ ' + rq.minR + ' trở lên', rq.minStar && '≥' + rq.minStar + '★'].filter(Boolean).join(' · ');

/* ---------- 4. Tháp: reset lượt theo ngày ---------- */
function towerTick() { const t = S.tower; if (t.key !== S.daily.key) { t.key = S.daily.key; t.tries = 3; } }
