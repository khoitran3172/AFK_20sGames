import { ARENAS, TOTAL_ARENAS } from '../data/arenas';
import { SKILLS, SKILL_BY_ID, skillCost } from '../data/skills';
import type { DailyState, LoginState } from './progress';
import type { EventState } from './events';
import { BAG_CAP, EquipBonus, Item, SLOTS, Slot, getSeq, makeItem, salvageValue, setSeq, sumBonus, ZERO_BONUS } from '../data/items';
import { TIER_BADGE_COST, TIER_GOLD_COST_MUL, TIER_STAT_MUL, TREE_BADGE, TREE_GOLD, TROOPS, TROOP_ORDER, TROOP_TREE, TroopId, treeFx } from '../data/troops';

export type StatKey = 'hp' | 'atk' | 'def';

export interface Rates { gold: number; stones: number; badges: number }

export interface Save {
  v: number;
  gold: number;
  stones: number;
  badges: number;
  lv: Record<StatKey, number>;
  skills: number[];
  squad: TroopId[];
  tiers: Record<TroopId, number>;
  ttree: Record<TroopId, number>; // số node cây nâng quân đã mở
  unlocked: number; // Arena xa nhất được mở (0..47); Boss của nó là thử thách tiếp theo
  farm: number; // Arena đang farm
  lastSeen: number;
  rate: Rates; // tốc độ farm đo được (đơn vị / giây) — dùng cho offline
  chest: Rates; // hòm AFK đang chờ nhận
  chestMs: number; // thời gian đã tích lũy (ms)
  vil: Record<number, number[]>; // cấp 4 công trình của làng mỗi Arena
  items: Item[]; // túi đồ
  equip: Partial<Record<Slot, number>>; // id vật phẩm đang mặc
  itemSeq: number;
  cnt: Record<string, number>; // bộ đếm tích lũy (thành tựu / nhiệm vụ)
  daily: DailyState;
  ach: Record<string, number>; // số bậc thành tựu đã nhận
  login: LoginState;
  ev: EventState;
  tower: { best: number; day: string; used: number };
  kills: number;
  playMs: number;
  speed: number;
  done: boolean;
}

const KEY = 'afk_save_v2';

export const BASE = { hp: 420, atk: 26, def: 6, aspd: 1.15, range: 85, speed: 125 };
export const LV_GROWTH = 1.09;
export const STAT_BASE_COST: Record<StatKey, number> = { hp: 18, atk: 24, def: 20 };
export const STAT_COST_GROWTH = 1.118;

export const newEventState = (): EventState => ({ nextAt: 8 * 60_000, merchant: null, raid: null, buffUntil: 0, buffMult: 1 });

export function newSave(): Save {
  return {
    v: 2, gold: 150, stones: 0, badges: 0,
    lv: { hp: 0, atk: 0, def: 0 },
    skills: [1],
    squad: ['knight', 'archer', 'healer'],
    tiers: { knight: 1, pike: 1, archer: 1, wizard: 1, healer: 1, rogue: 1, paladin: 1, huntress: 1, summoner: 1 },
    ttree: { knight: 0, pike: 0, archer: 0, wizard: 0, healer: 0, rogue: 0, paladin: 0, huntress: 0, summoner: 0 },
    unlocked: 0, farm: 0, lastSeen: Date.now(),
    rate: { gold: 0, stones: 0, badges: 0 },
    chest: { gold: 0, stones: 0, badges: 0 }, chestMs: 0,
    vil: {}, items: [], equip: {}, itemSeq: 1, cnt: {}, daily: null as unknown as DailyState, ach: {}, login: { last: '', streak: 0, claimedToday: false }, ev: newEventState(), tower: { best: 0, day: '', used: 0 }, kills: 0, playMs: 0, speed: 1, done: false,
  };
}

let S: Save = newSave();
export const getSave = () => S;

export function load(): Save {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) S = { ...newSave(), ...JSON.parse(raw) };
  } catch { S = newSave(); }
  const base = newSave();
  S.tiers = { ...base.tiers, ...(S.tiers || {}) };
  S.ev = { ...newEventState(), ...(S.ev || {}) };
  S.tower = S.tower ? S.tower : { best: 0, day: '', used: 0 };
  S.ttree = { ...base.ttree, ...(S.ttree || {}) };
  setSeq(S.itemSeq || 1);
  return S;
}
let saveTimer = 0;
export function save(force = false) {
  const now = Date.now();
  if (!force && now - saveTimer < 2000) return;
  saveTimer = now;
  S.lastSeen = now;
  S.itemSeq = getSeq();
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* ignore */ }
}
export function resetSave() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  S = newSave();
}

// ---------- Skills / mods ----------
export const has = (s: Save, id: number) => s.skills.includes(id);
export function bump(s: Save, key: string, n = 1) { if (!s.cnt) s.cnt = {}; s.cnt[key] = (s.cnt[key] ?? 0) + n; }

export function nextSkillCost(s: Save): number {
  return skillCost(s.skills.length, has(s, 38));
}
export function canUnlock(s: Save, id: number): 'ok' | 'owned' | 'req' | 'cost' {
  if (has(s, id)) return 'owned';
  const node = SKILL_BY_ID[id];
  if (!node.req.every((r) => has(s, r))) return 'req';
  if (s.stones < nextSkillCost(s)) return 'cost';
  return 'ok';
}
export function unlockSkill(s: Save, id: number): boolean {
  if (canUnlock(s, id) !== 'ok') return false;
  s.stones -= nextSkillCost(s);
  s.skills.push(id);
  return true;
}

export interface Mods {
  hpMul: number; atkMul: number; aspdMul: number;
  farmGold: number; farmStone: number; badgeBonus: number;
  chestHours: number; afkYield: number;
  troopMul: number;
}
export function equipped(s: Save): Item[] {
  const out: Item[] = [];
  for (const sl of SLOTS) { const id = s.equip?.[sl]; if (id != null) { const it = s.items?.find((x) => x.id === id); if (it) out.push(it); } }
  return out;
}
export function equipBonus(s: Save): EquipBonus {
  return s.items ? sumBonus(equipped(s)) : ZERO_BONUS();
}

export function mods(s: Save): Mods {
  const h = (i: number) => has(s, i);
  const eb = equipBonus(s);
  return {
    hpMul: h(17) ? 1.2 : 1,
    atkMul: h(18) ? 1.2 : 1,
    aspdMul: h(19) ? 1.15 : 1,
    farmGold: (h(32) ? 1.1 : 1) * (1 + eb.gold),
    farmStone: (h(33) ? 1.1 : 1) * (1 + eb.stone),
    badgeBonus: h(45) ? 1.15 : 1,
    chestHours: h(37) ? 12 : 8,
    afkYield: h(46) ? 1.25 : 1,
    troopMul: (h(16) ? 1.2 : 1) * (1 + eb.troop),
  };
}

// ---------- MC stats ----------
export function statCost(s: Save, k: StatKey): number {
  return Math.ceil(STAT_BASE_COST[k] * Math.pow(STAT_COST_GROWTH, s.lv[k]));
}
export function upgradeStat(s: Save, k: StatKey): boolean {
  const c = statCost(s, k);
  if (s.gold < c) return false;
  s.gold -= c;
  s.lv[k]++;
  bump(s, 'statUps');
  return true;
}

export interface McStats { hp: number; atk: number; def: number; aspd: number; range: number; speed: number }
export function mcStats(s: Save): McStats {
  const m = mods(s);
  const eb = equipBonus(s);
  return {
    hp: BASE.hp * Math.pow(LV_GROWTH, s.lv.hp) * m.hpMul * (1 + eb.hp),
    atk: BASE.atk * Math.pow(LV_GROWTH, s.lv.atk) * m.atkMul * (1 + eb.atk),
    def: BASE.def * Math.pow(LV_GROWTH, s.lv.def) * (1 + eb.def),
    aspd: BASE.aspd * m.aspdMul * (1 + eb.aspd),
    range: BASE.range * (has(s, 28) ? 1.8 : 1),
    speed: BASE.speed,
  };
}

// ---------- Troops ----------
export function troopCount(s: Save, id: TroopId): number {
  const d = TROOPS[id];
  let c = d.count;
  if ((id === 'knight' || id === 'archer') && has(s, 2)) c += 1;
  if ((id === 'healer' || id === 'wizard') && has(s, 8)) c += 1;
  c += treeFx(s.ttree?.[id] ?? 0, id).count;
  return Math.min(c, d.maxCount + 1);
}

export function troopTierCost(s: Save, id: TroopId): { badges: number; gold: number } | null {
  const t = s.tiers[id];
  if (t >= 3) return null;
  return { badges: TIER_BADGE_COST[t + 1], gold: TIER_GOLD_COST_MUL[t + 1] * ARENAS[Math.min(s.unlocked, TOTAL_ARENAS - 1)].scale };
}
export function evolveTroop(s: Save, id: TroopId): boolean {
  const c = troopTierCost(s, id);
  if (!c || s.badges < c.badges || s.gold < c.gold) return false;
  s.badges -= c.badges;
  s.gold -= c.gold;
  s.tiers[id]++;
  return true;
}

/** Lực chiến tổng hợp (MC + 3 đạo quân). */
export function power(s: Save): number {
  const st = mcStats(s);
  const m = mods(s);
  const base = Math.sqrt(st.hp * st.atk * st.aspd) * (1 + 0.5 * (st.def / st.atk));
  let troop = 0;
  for (const id of s.squad) troop += TIER_STAT_MUL[s.tiers[id]] * m.troopMul;
  troop /= Math.max(1, s.squad.length);
  return Math.round(base * (0.55 + 0.45 * troop) * 1.6);
}

export function fmt(n: number): string {
  if (!isFinite(n)) return '∞';
  if (n === 0) return '0';
  if (n < 1000) return n >= 100 ? String(Math.floor(n)) : n >= 10 ? n.toFixed(0) : n.toFixed(n < 1 ? 2 : 1).replace(/\.0$/, '');
  const u = ['K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
  let i = -1;
  while (n >= 1000 && i < u.length - 1) { n /= 1000; i++; }
  return (n >= 100 ? n.toFixed(0) : n >= 10 ? n.toFixed(1) : n.toFixed(2)) + u[i];
}

export { SKILLS };


// ---------- Túi đồ ----------
export const itemById = (s: Save, id: number) => s.items.find((x) => x.id === id);
export const isEquipped = (s: Save, it: Item) => s.equip[it.slot] === it.id;

/** Thêm đồ vào túi; túi đầy thì tự rã ra Đá Tinh Thạch. Trả về true nếu giữ được. */
export function addItem(s: Save, it: Item): boolean {
  if (s.items.length >= BAG_CAP) { s.stones += salvageValue(it, s.unlocked); return false; }
  s.items.push(it);
  return true;
}
export function equipItem(s: Save, it: Item) { s.equip[it.slot] = it.id; }
export function unequipSlot(s: Save, sl: Slot) { delete s.equip[sl]; }
export function salvageItem(s: Save, it: Item): number {
  if (isEquipped(s, it)) return 0;
  const v = salvageValue(it, s.unlocked);
  s.items = s.items.filter((x) => x.id !== it.id);
  s.stones += v;
  return v;
}
/** Ghép 3 món cùng ô + cùng độ hiếm (không tính đồ đang mặc) thành 1 món bậc cao hơn. */
export function mergeOnce(s: Save, slot: Slot, r: number): Item | null {
  if (r >= 4) return null;
  const pool = s.items.filter((x) => x.slot === slot && x.r === r && !isEquipped(s, x)).slice(0, 3);
  if (pool.length < 3) return null;
  const ids = new Set(pool.map((x) => x.id));
  s.items = s.items.filter((x) => !ids.has(x.id));
  const n = makeItem(slot, r + 1);
  s.items.push(n);
  bump(s, 'merges');
  return n;
}
export function mergeCount(s: Save, r: number): number {
  let n = 0;
  for (const sl of SLOTS) n += Math.floor(s.items.filter((x) => x.slot === sl && x.r === r && !isEquipped(s, x)).length / 3);
  return r >= 4 ? 0 : n;
}
export function mergeAll(s: Save, r: number): Item[] {
  const out: Item[] = [];
  for (const sl of SLOTS) { for (;;) { const n = mergeOnce(s, sl, r); if (!n) break; out.push(n); } }
  return out;
}


// ---------- Cây nâng quân ----------
export function treeCost(s: Save, id: TroopId): { badges: number; gold: number } | null {
  const n = s.ttree[id] ?? 0;
  if (n >= TROOP_TREE[id].length) return null;
  return { badges: TREE_BADGE[n], gold: TREE_GOLD[n] * ARENAS[Math.min(s.unlocked, TOTAL_ARENAS - 1)].scale };
}
export function unlockTreeNode(s: Save, id: TroopId): boolean {
  const c = treeCost(s, id);
  if (!c || s.badges < c.badges || s.gold < c.gold) return false;
  s.badges -= c.badges; s.gold -= c.gold;
  s.ttree[id] = (s.ttree[id] ?? 0) + 1;
  bump(s, 'treeNodes');
  return true;
}
void TROOP_ORDER;
