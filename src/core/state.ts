import { ARENAS, TOTAL_ARENAS } from '../data/arenas';
import { SKILLS, SKILL_BY_ID, skillCost } from '../data/skills';
import { TIER_BADGE_COST, TIER_GOLD_COST_MUL, TIER_STAT_MUL, TROOPS, TroopId } from '../data/troops';

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
  unlocked: number; // Arena xa nhất được mở (0..47); Boss của nó là thử thách tiếp theo
  farm: number; // Arena đang farm
  lastSeen: number;
  rate: Rates; // tốc độ farm đo được (đơn vị / giây) — dùng cho offline
  chest: Rates; // hòm AFK đang chờ nhận
  chestMs: number; // thời gian đã tích lũy (ms)
  vil: Record<number, number[]>; // cấp 4 công trình của làng mỗi Arena
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

export function newSave(): Save {
  return {
    v: 2, gold: 150, stones: 0, badges: 0,
    lv: { hp: 0, atk: 0, def: 0 },
    skills: [1],
    squad: ['knight', 'archer', 'healer'],
    tiers: { knight: 1, pike: 1, archer: 1, wizard: 1, healer: 1, rogue: 1 },
    unlocked: 0, farm: 0, lastSeen: Date.now(),
    rate: { gold: 0, stones: 0, badges: 0 },
    chest: { gold: 0, stones: 0, badges: 0 }, chestMs: 0,
    vil: {}, kills: 0, playMs: 0, speed: 1, done: false,
  };
}

let S: Save = newSave();
export const getSave = () => S;

export function load(): Save {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) S = { ...newSave(), ...JSON.parse(raw) };
  } catch { S = newSave(); }
  return S;
}
let saveTimer = 0;
export function save(force = false) {
  const now = Date.now();
  if (!force && now - saveTimer < 2000) return;
  saveTimer = now;
  S.lastSeen = now;
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* ignore */ }
}
export function resetSave() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  S = newSave();
}

// ---------- Skills / mods ----------
export const has = (s: Save, id: number) => s.skills.includes(id);

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
export function mods(s: Save): Mods {
  const h = (i: number) => has(s, i);
  return {
    hpMul: h(17) ? 1.2 : 1,
    atkMul: h(18) ? 1.2 : 1,
    aspdMul: h(19) ? 1.15 : 1,
    farmGold: h(32) ? 1.1 : 1,
    farmStone: h(33) ? 1.1 : 1,
    badgeBonus: h(45) ? 1.15 : 1,
    chestHours: h(37) ? 12 : 8,
    afkYield: h(46) ? 1.25 : 1,
    troopMul: h(16) ? 1.2 : 1,
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
  return true;
}

export interface McStats { hp: number; atk: number; def: number; aspd: number; range: number; speed: number }
export function mcStats(s: Save): McStats {
  const m = mods(s);
  return {
    hp: BASE.hp * Math.pow(LV_GROWTH, s.lv.hp) * m.hpMul,
    atk: BASE.atk * Math.pow(LV_GROWTH, s.lv.atk) * m.atkMul,
    def: BASE.def * Math.pow(LV_GROWTH, s.lv.def),
    aspd: BASE.aspd * m.aspdMul,
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
  return Math.min(c, d.maxCount);
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
  if (n < 1000) return n >= 100 ? String(Math.floor(n)) : n >= 10 ? n.toFixed(0) : n.toFixed(n < 1 ? 2 : 1).replace(/\.0$/, '');
  const u = ['K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
  let i = -1;
  while (n >= 1000 && i < u.length - 1) { n /= 1000; i++; }
  return (n >= 100 ? n.toFixed(0) : n >= 10 ? n.toFixed(1) : n.toFixed(2)) + u[i];
}

export { SKILLS };
