// Nhiệm vụ ngày, thành tựu, quà đăng nhập. Mọi bộ đếm đi qua track().
// Lưu ý: dùng giờ máy khách (không có server), nên đổi giờ hệ thống có thể gian lận — đã ghi trong tài liệu thiết kế.
import { ARENAS } from '../data/arenas';
import { Item, rollItem } from '../data/items';
import { Save, addItem, bump, getSave } from './state';

export type Counter =
  | 'kills' | 'bossWins' | 'bossTries' | 'items' | 'epics' | 'legends' | 'merges' | 'villageUps' | 'statUps'
  | 'chests' | 'minutes' | 'tower' | 'raids' | 'merchant';

export interface Reward { gold: number; stones: number; badges: number; item?: Item }

export interface DailyState { day: string; quests: { key: Counter; target: number; claimed: boolean }[]; base: Partial<Record<Counter, number>>; bonusClaimed: boolean }
export interface LoginState { last: string; streak: number; claimedToday: boolean }

export function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
const dayNum = (s: string) => Math.floor(new Date(s + 'T00:00:00').getTime() / 86400000);

function hashStr(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed: number) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

// ---------------------------------------------------------------- đếm
export function track(key: Counter, n = 1, S: Save = getSave()) {
  bump(S, key, n);
  listeners.forEach((l) => l());
}
const listeners: (() => void)[] = [];
export const onProgress = (f: () => void) => { listeners.push(f); return () => { const i = listeners.indexOf(f); if (i >= 0) listeners.splice(i, 1); }; };
export const cnt = (S: Save, k: Counter) => S.cnt?.[k] ?? 0;

// ---------------------------------------------------------------- phần thưởng
/** Đơn vị thưởng = số phút thu nhập hiện tại (có sàn theo Arena) */
export function reward(S: Save, goldMin: number, stoneMin: number, badgeMin = 0): Reward {
  const m = ARENAS[Math.min(S.unlocked, ARENAS.length - 1)].scale;
  return {
    gold: Math.max(S.rate.gold * 60 * goldMin, 40 * m * goldMin / 10),
    stones: Math.max(S.rate.stones * 60 * stoneMin, 1.2 * m * stoneMin / 10),
    badges: Math.max(S.rate.badges * 60 * badgeMin, badgeMin > 0 ? Math.ceil(badgeMin / 20) : 0),
  };
}
export function give(S: Save, r: Reward) {
  S.gold += r.gold; S.stones += r.stones; S.badges += r.badges;
  if (r.item) addItem(S, r.item);
}

// ---------------------------------------------------------------- nhiệm vụ ngày
const POOL: { key: Counter; lo: number; hi: number }[] = [
  { key: 'kills', lo: 60, hi: 160 },
  { key: 'bossTries', lo: 1, hi: 2 },
  { key: 'villageUps', lo: 3, hi: 6 },
  { key: 'statUps', lo: 5, hi: 10 },
  { key: 'chests', lo: 1, hi: 1 },
  { key: 'minutes', lo: 10, hi: 20 },
  { key: 'items', lo: 1, hi: 2 },
];

export function ensureDaily(S: Save): DailyState {
  const day = today();
  if (S.daily && S.daily.day === day) return S.daily;
  const r = rng(hashStr(day));
  const picks = POOL.slice().sort(() => r() - 0.5).slice(0, 5);
  const base: Partial<Record<Counter, number>> = {};
  const quests = picks.map((p) => {
    base[p.key] = cnt(S, p.key);
    return { key: p.key, target: p.lo + Math.floor(r() * (p.hi - p.lo + 1)), claimed: false };
  });
  S.daily = { day, quests, base, bonusClaimed: false };
  return S.daily;
}
export const dailyProg = (S: Save, i: number) => {
  const d = ensureDaily(S), q = d.quests[i];
  return Math.min(q.target, cnt(S, q.key) - (d.base[q.key] ?? 0));
};
export const dailyDone = (S: Save, i: number) => dailyProg(S, i) >= ensureDaily(S).quests[i].target;
export function dailyReward(S: Save): Reward { return reward(S, 12, 10, 0); }
export function claimDaily(S: Save, i: number): Reward | null {
  const d = ensureDaily(S);
  if (d.quests[i].claimed || !dailyDone(S, i)) return null;
  d.quests[i].claimed = true;
  const r = dailyReward(S);
  give(S, r);
  return r;
}
export function dailyBonusReady(S: Save) { const d = ensureDaily(S); return !d.bonusClaimed && d.quests.every((q, i) => q.claimed && dailyDone(S, i)); }
export function claimDailyBonus(S: Save): Reward | null {
  if (!dailyBonusReady(S)) return null;
  S.daily.bonusClaimed = true;
  const r = reward(S, 30, 30, 20);
  r.item = rollItem(S.unlocked, 2, 2);
  give(S, r);
  return r;
}

// ---------------------------------------------------------------- thành tựu
export interface AchDef { id: string; key: Counter | 'skills' | 'arenas' | 'tier3'; tiers: [number, number, number]; vi: string; en: string; icon: string }
export const ACHS: AchDef[] = [
  { id: 'kills', key: 'kills', tiers: [100, 1500, 15000], vi: 'Thợ Săn Quái', en: 'Monster Hunter', icon: 'Medal' },
  { id: 'boss', key: 'bossWins', tiers: [1, 12, 48], vi: 'Sát Thủ Boss', en: 'Boss Slayer', icon: 'Trophy' },
  { id: 'arenas', key: 'arenas', tiers: [4, 24, 48], vi: 'Nhà Thám Hiểm', en: 'Explorer', icon: 'Crown' },
  { id: 'skills', key: 'skills', tiers: [10, 30, 46], vi: 'Bậc Thầy Kỹ Năng', en: 'Skill Master', icon: 'Star' },
  { id: 'items', key: 'items', tiers: [10, 120, 600], vi: 'Thợ Săn Đồ', en: 'Gear Hunter', icon: 'Shield' },
  { id: 'epics', key: 'epics', tiers: [1, 12, 60], vi: 'Sưu Tầm Sử Thi', en: 'Epic Collector', icon: 'Crown' },
  { id: 'legends', key: 'legends', tiers: [1, 6, 25], vi: 'Huyền Thoại Sống', en: 'Living Legend', icon: 'Trophy' },
  { id: 'merges', key: 'merges', tiers: [10, 100, 500], vi: 'Thợ Rèn', en: 'Blacksmith', icon: 'Medal' },
  { id: 'village', key: 'villageUps', tiers: [20, 150, 600], vi: 'Trưởng Làng', en: 'Village Chief', icon: 'Heart' },
  { id: 'stats', key: 'statUps', tiers: [30, 250, 1000], vi: 'Rèn Luyện Không Ngừng', en: 'Never Stop Training', icon: 'Star' },
  { id: 'chests', key: 'chests', tiers: [1, 15, 80], vi: 'Ngủ Ngon Lãnh Hòm', en: 'Sound Sleeper', icon: 'Pin' },
  { id: 'minutes', key: 'minutes', tiers: [60, 600, 3000], vi: 'Kiên Nhẫn', en: 'Patience', icon: 'Shield' },
  { id: 'tier3', key: 'tier3', tiers: [1, 3, 6], vi: 'Hoàng Gia', en: 'Royal Guard', icon: 'Crown' },
  { id: 'tower', key: 'tower', tiers: [10, 50, 150], vi: 'Chinh Phục Tháp', en: 'Tower Conqueror', icon: 'Trophy' },
  { id: 'raids', key: 'raids', tiers: [1, 10, 40], vi: 'Giữ Làng', en: 'Village Defender', icon: 'Shield' },
];

export function achValue(S: Save, d: AchDef): number {
  if (d.key === 'skills') return S.skills.length;
  if (d.key === 'arenas') return S.unlocked;
  if (d.key === 'tier3') return Object.values(S.tiers).filter((t) => t >= 3).length;
  return cnt(S, d.key);
}
export const achClaimed = (S: Save, d: AchDef) => S.ach?.[d.id] ?? 0; // số bậc đã nhận
export const achReady = (S: Save, d: AchDef) => { const v = achValue(S, d), c = achClaimed(S, d); return c < 3 && v >= d.tiers[c]; };
export function achReward(S: Save, tier: number): Reward {
  const r = reward(S, [25, 120, 480][tier], [20, 100, 400][tier], [0, 20, 80][tier]);
  if (tier === 2) r.item = rollItem(S.unlocked, 3, 2);
  return r;
}
export function claimAch(S: Save, d: AchDef): Reward | null {
  if (!achReady(S, d)) return null;
  const c = achClaimed(S, d);
  if (!S.ach) S.ach = {};
  S.ach[d.id] = c + 1;
  const r = achReward(S, c);
  give(S, r);
  return r;
}

// ---------------------------------------------------------------- quà đăng nhập (chu kỳ 7 ngày, không phạt nghỉ)
export function loginState(S: Save): LoginState {
  const d = today();
  if (!S.login) S.login = { last: '', streak: 0, claimedToday: false };
  const L = S.login;
  if (L.last !== d) {
    // sang ngày mới
    if (L.last && dayNum(d) - dayNum(L.last) === 1) { /* nối tiếp */ } else if (L.last) L.streak = Math.max(0, L.streak); // nghỉ ngày: giữ tiến độ, không bị reset
    L.claimedToday = false;
  }
  return L;
}
export const loginReady = (S: Save) => !loginState(S).claimedToday;
export function loginReward(S: Save, day: number, preview = false): Reward {
  const r = reward(S, [8, 12, 18, 25, 35, 50, 90][day], [6, 8, 12, 16, 24, 36, 70][day], [0, 0, 5, 0, 10, 0, 40][day]);
  if (!preview && day === 6) r.item = rollItem(S.unlocked, 3, 2);
  else if (!preview && day === 3) r.item = rollItem(S.unlocked, 1, 1);
  return r;
}
export function claimLogin(S: Save): { day: number; r: Reward } | null {
  const L = loginState(S);
  if (L.claimedToday) return null;
  const day = L.streak % 7;
  const r = loginReward(S, day);
  give(S, r);
  L.streak++;
  L.last = today();
  L.claimedToday = true;
  return { day, r };
}

export function anyClaimable(S: Save): boolean {
  const d = ensureDaily(S);
  if (d.quests.some((q, i) => !q.claimed && dailyDone(S, i)) || dailyBonusReady(S)) return true;
  if (ACHS.some((a) => achReady(S, a))) return true;
  return loginReady(S);
}
