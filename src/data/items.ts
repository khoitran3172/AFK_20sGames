// Trang bị Thủ Lĩnh: 6 ô, 5 độ hiếm, dòng phụ ngẫu nhiên. Icon: Anvil's RPG icons (Ponk, CC BY 4.0), atlas 20x20 ô 32px.
import { ARENAS } from './arenas';
import { getLang, t } from '../i18n';

export type Slot = 'weapon' | 'helmet' | 'armor' | 'boots' | 'ring' | 'amulet';
export const SLOTS: Slot[] = ['weapon', 'helmet', 'armor', 'boots', 'ring', 'amulet'];
export type StatId = 'atk' | 'hp' | 'def' | 'aspd' | 'crit' | 'gold' | 'stone' | 'troop';

export interface Item {
  id: number;
  slot: Slot;
  r: number; // 0..4
  icon: number; // chỉ số khung trong atlas 'items' (0-based)
  main: [StatId, number];
  aff: [StatId, number][];
}

export const RARITY_COLOR = [0xb8b8b8, 0x6fcf5a, 0x4aa3ff, 0xc07bff, 0xffa81e];
export const RARITY_CSS = ['#c8c8c8', '#8fe07a', '#7dbcff', '#d6a6ff', '#ffc24d'];
export const RB = [0.06, 0.1, 0.17, 0.28, 0.45]; // giá trị gốc theo độ hiếm
export const MAX_RARITY = 4;
export const BAG_CAP = 60;

export const MAIN_STAT: Record<Slot, StatId> = { weapon: 'atk', helmet: 'hp', armor: 'def', boots: 'aspd', ring: 'crit', amulet: 'gold' };
const STAT_MULT: Record<StatId, number> = { atk: 1, hp: 1, def: 1, aspd: 0.45, crit: 0.3, gold: 1, stone: 0.8, troop: 0.8 };
const AFF_POOL: StatId[] = ['atk', 'hp', 'def', 'aspd', 'crit', 'gold', 'stone', 'troop'];
const AFF_COUNT = [0, 1, 1, 2, 3];

// vùng icon (1-based trong gói Anvil) cho từng ô
const ICON_RANGE: Record<Slot, [number, number]> = {
  weapon: [1, 20], helmet: [161, 180], armor: [181, 200], boots: [221, 240], ring: [241, 250], amulet: [251, 260],
};

let SEQ = 1;
export const setSeq = (n: number) => { SEQ = Math.max(SEQ, n); };
export const getSeq = () => SEQ;

function pickIcon(slot: Slot, r: number): number {
  const [a, b] = ICON_RANGE[slot];
  const n = b - a + 1, per = n / 5;
  const lo = Math.floor(r * per), hi = Math.max(lo + 1, Math.floor((r + 1) * per));
  return a - 1 + lo + Math.floor(Math.random() * (hi - lo));
}

export function makeItem(slot: Slot, r: number): Item {
  const mainStat = MAIN_STAT[slot];
  const it: Item = { id: SEQ++, slot, r, icon: pickIcon(slot, r), main: [mainStat, RB[r] * STAT_MULT[mainStat]], aff: [] };
  const pool = AFF_POOL.filter((s) => s !== mainStat);
  for (let i = 0; i < AFF_COUNT[r]; i++) {
    const k = Math.floor(Math.random() * pool.length);
    const st = pool.splice(k, 1)[0];
    it.aff.push([st, RB[r] * 0.45 * STAT_MULT[st] * (0.8 + Math.random() * 0.4)]);
  }
  return it;
}

/** Xác suất độ hiếm theo tiến độ Arena */
export function rarityWeights(arena: number): number[] {
  const t = Math.min(1, arena / 47);
  const w = [60 - 55 * t, 28 - 8 * t, 10 + 25 * t, 2 + 28 * t, 10 * t * t];
  const s = w.reduce((a, b) => a + b, 0);
  return w.map((x) => x / s);
}

export function rollRarity(arena: number, minR = 0, luck = 1): number {
  let best = 0;
  for (let k = 0; k < luck; k++) {
    const w = rarityWeights(arena);
    let x = Math.random(), r = 0;
    for (; r < 4; r++) { if (x < w[r]) break; x -= w[r]; }
    best = Math.max(best, r);
  }
  return Math.max(minR, best);
}

export function rollItem(arena: number, minR = 0, luck = 1): Item {
  const slot = SLOTS[Math.floor(Math.random() * SLOTS.length)];
  return makeItem(slot, rollRarity(arena, minR, luck));
}

export interface EquipBonus { atk: number; hp: number; def: number; aspd: number; crit: number; gold: number; stone: number; troop: number }
export const ZERO_BONUS = (): EquipBonus => ({ atk: 0, hp: 0, def: 0, aspd: 0, crit: 0, gold: 0, stone: 0, troop: 0 });

export function sumBonus(items: Item[]): EquipBonus {
  const b = ZERO_BONUS();
  for (const it of items) {
    b[it.main[0]] += it.main[1];
    for (const [s, v] of it.aff) b[s] += v;
  }
  return b;
}

/** Giá trị rã đồ: Đá Tinh Thạch theo Arena đã mở */
export function salvageValue(it: Item, unlocked: number): number {
  const A = ARENAS[Math.min(unlocked, ARENAS.length - 1)];
  return Math.max(1, 12 * Math.pow(2, it.r) * A.killStone);
}

export const STAT_FMT_PCT: Record<StatId, string> = { atk: 'stat_atk_p', hp: 'stat_hp_p', def: 'stat_def_p', aspd: 'stat_aspd_p', crit: 'stat_crit_p', gold: 'stat_gold_p', stone: 'stat_stone_p', troop: 'stat_troop_p' };

export const itemName = (it: Item) => (getLang() === 'vi' ? `${t('slot_' + it.slot)} ${t('rarity_' + it.r)}` : `${t('rarity_' + it.r)} ${t('slot_' + it.slot)}`);
export const statLine = (s: StatId, v: number) => `${t(STAT_FMT_PCT[s])} +${(v * 100).toFixed(v < 0.1 ? 1 : 0)}%`;
