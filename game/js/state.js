'use strict';
/* =====================================================================
   TRẠNG THÁI + CÔNG THỨC
   ===================================================================== */
const KEY = 'thuonghoi_afk_v2';
const fmt = n => { n = Math.floor(n); if (n < 1e4) return n.toLocaleString('en'); const u = ['','K','M','B','T','Qa','Qi','Sx']; let i = 0, v = n; while (v >= 1000 && i < u.length-1) { v /= 1000; i++; } return v.toFixed(v < 100 ? 2 : 1) + u[i]; };
const fmt1 = n => n < 10 ? n.toFixed(2) : n < 100 ? n.toFixed(1) : fmt(n);
const fmtT = s => { s = Math.max(0, Math.ceil(s)); const h = Math.floor(s/3600), m = Math.floor(s%3600/60), x = s%60; return h ? `${h}h ${String(m).padStart(2,'0')}m` : m ? `${m}m ${String(x).padStart(2,'0')}s` : `${x}s`; };

function fresh() {
  const t = Date.now();
  return {
    v: 2, first: t, last: t, devOffset: 0,
    gold: 100, gems: 0, tickets: 0, ssrPick: 0, renown: 0,
    food: 0, wood: 0, ore: 0, herb: 0,
    lv: { farm: 1, lumber: 0, mine: 0, garden: 0 },
    fac: { market: 1, warehouse: 1, port: 0, tavern: 0 },
    assign: {}, own: {}, gear: {},
    auto: true, hold: 0,
    price: { food: 1, wood: 1, ore: 1, herb: 1 }, hist: { food: [1], wood: [1], ore: [1], herb: [1] },
    caravans: [], gemAcc: 0, giftAt: 0,
    pity: { c: 0, sr: 0, lost: false, ch: 0, chsr: 0 },
    stats: { gold: 0, ups: 0, pulls: 0, cars: 0, chests: 0, sell: 0, routeUse: [0,0,0,0] },
    guildLv: 1, guildXp: 0,
    daily: { key: '', stat: { gold: 0, ups: 0, cars: 0, pulls: 0, sell: 0 }, claimed: {}, ap: 0, apClaimed: {}, free: 0 },
    loginKey: '', loginIdx: 0, loginDays: 0, loginClaimed: '',
    jclaimed: {}, achTier: {},
    pass: { season: 0, xp: 0, claimed: {} },
    week: { key: -1, earn: 0, ref: 3000, prevEarn: 0, pending: null },
    rank: 0,
    prestige: { count: 0, run: 0, totalRenownEarned: 0 },
    tut: { step: 0, done: false, tenUsed: false },
    events: [], sessions: [], settings: { notify: false },
    seenGolden: '', nextHint: '',
  };
}
function migrate(s) {
  const f = fresh();
  const deep = (a, b) => { for (const k in b) { if (a[k] === undefined) a[k] = JSON.parse(JSON.stringify(b[k])); else if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k])) deep(a[k], b[k]); } return a; };
  return deep(s, f);
}
let S = (function load() { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v === 2) return migrate(s); } catch (e) {} return fresh(); })();
function save() { S.last = nowMs(); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

/* ---------- Thời gian (devOffset dùng để test qua ngày) ---------- */
const nowMs = () => Date.now() + (S ? S.devOffset : 0);
const localMs = t => t - new Date(t).getTimezoneOffset() * 60000;
const dayNum = t => Math.floor(localMs(t) / DAY);                       // số ngày theo giờ địa phương
const dayKey = t => dayNum(t);
const accDay = () => dayKey(nowMs()) - dayKey(S.first);                // 0 = ngày đầu tiên
const weekIdx = t => Math.floor((dayNum(t) + 3) / 7);                  // tuần bắt đầu thứ Hai
const dayUnlocked = d => accDay() >= d;
function secToNextMidnight() { const t = nowMs(), d = new Date(t); d.setHours(24, 0, 0, 0); return (d - t) / 1000; }

/* ---------- Giờ Vàng ---------- */
function goldenInfo() {
  const t = nowMs(), d = new Date(t); const mins = d.getHours() * 60 + d.getMinutes();
  for (const g of GOLDEN) { const a = g.h * 60 + g.m, b = a + g.len; if (mins >= a && mins < b) return { active: true, end: (b - mins) * 60 - d.getSeconds(), id: g.h }; }
  let best = Infinity; for (const g of GOLDEN) { let a = g.h * 60 + g.m - mins; if (a <= 0) a += 1440; best = Math.min(best, a); }
  return { active: false, next: best * 60 - d.getSeconds() };
}

/* ---------- Anh hùng ---------- */
const heroLvCap = o => 10 + 10 * o.star;
const heroLvCost = (h, o) => Math.floor(80 * Math.pow(1.22, o.lv) * (1 + RN.indexOf(h.r)));
function heroBuff(h, slot) {          // phân số (0.3 = +30%)
  const o = S.own[h.id]; if (!o) return 0;
  return RB[h.r] * (1 + 0.2 * (o.star - 1)) * (1 + 0.04 * (o.lv - 1)) * (h.job === slot ? 2 : 1) / 100;
}
const slotBuff = slot => { const id = S.assign[slot]; return id == null ? 0 : heroBuff(HEROES[id], slot); };
function gearBonus(slot) { let b = 0; for (const g of GEAR) if (g.slot === slot && S.gear[g.id]) b = Math.max(b, GB[g.r] * (1 + 0.25 * (S.gear[g.id] - 1))); return b / 100; }

/* ---------- Sản xuất / kinh tế ---------- */
const mile = l => MILESTONES.reduce((m, x) => l >= x ? m * 2 : m, 1);
const renownMult = () => 1 + 0.15 * Math.sqrt(S.renown);       // tăng chậm dần (tránh nổ lạm phát)
function prodOf(k) { const l = S.lv[k]; if (!l) return 0; return BUILD[k].base * l * mile(l) * (1 + slotBuff(k)) * (1 + gearBonus('weapon')) * renownMult(); }
const UPG_G = 1.17;
const upCost = k => Math.floor(BUILD[k].cost * Math.pow(UPG_G, S.lv[k]));
const facCost = k => Math.floor(FAC[k].cost * Math.pow(FAC[k].g, S.fac[k]));
const capacity = () => capOf(S.fac.warehouse);
const marketPrice = g => GOOD[g].price * S.price[g] * (1 + gearBonus('potion'));
function goldenMult() { return goldenInfo().active ? GOLDEN_PRICE : 1; }
const autoPct = () => autoRate(S.fac.market);
function goldRate() { let r = 0; for (const k of BKEYS) r += prodOf(k) * marketPrice(BUILD[k].good); return r * autoPct(); }
const gemRate = () => (12 / 3600) * (1 + gearBonus('charm') + S.fac.tavern * 0.03) * (goldenInfo().active ? 2 : 1);
const offlineCap = () => (8 + S.fac.tavern) * 3600 * (1 + gearBonus('charm'));
const caravanSlots = () => 1 + Math.floor(S.fac.port / 4);
const portMult = () => 1 + 0.04 * S.fac.port;
const tradeBonus = () => (1 + slotBuff('trade')) * (1 + gearBonus('armor')) * portMult();
function routeCap(r) { const R = ROUTES[r]; const k = [0.35, 0.5, 0.7, 1.0][r]; return Math.max(100, goldRate() * R.time * k / (R.mult - 1)); }
const ssrFeatured = () => SSR_IDS[weekIdx(nowMs()) % SSR_IDS.length];

/* ---------- Cấp thương hội ---------- */
function addGuildXp(n) { S.guildXp += n; while (S.guildXp >= guildXpNeed(S.guildLv)) { S.guildXp -= guildXpNeed(S.guildLv); S.guildLv++; track('guild_level', { lv: S.guildLv }); toast(`🏰 Thương Hội lên Cấp ${S.guildLv}!`); } }
