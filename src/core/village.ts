// Kinh tế làng: mỗi Arena có 1 làng (4 công trình). Làng của MỌI Arena đã mở đều sản xuất song song.
import { ARENAS } from '../data/arenas';
import { Rates, Save, bump, equipBonus, has } from './state';

export type SiteType = 'farm' | 'lumber' | 'crystal' | 'forge';
export const SITE_TYPES: SiteType[] = ['farm', 'lumber', 'crystal', 'forge'];
export const MAX_SITE_LV = 20;

export const SITE_DEF: Record<SiteType, { res: keyof Rates; base: number; cost: number; name: string; icon: string }> = {
  farm: { res: 'gold', base: 0.05, cost: 30, name: 'site_farm', icon: 'icon4' },
  lumber: { res: 'gold', base: 0.05, cost: 35, name: 'site_lumber', icon: 'icon2' },
  crystal: { res: 'stones', base: 0.0058, cost: 50, name: 'site_crystal', icon: 'goldRes' },
  forge: { res: 'badges', base: 0.00006, cost: 70, name: 'site_forge', icon: 'icon6' },
};

export function lvOf(S: Save, arena: number, t: SiteType): number {
  return S.vil?.[arena]?.[SITE_TYPES.indexOf(t)] ?? 0;
}

export const lvMult = (L: number) => (L <= 0 ? 0 : L);

export function siteRate(S: Save, arena: number, t: SiteType): number {
  const L = lvOf(S, arena, t);
  if (!L) return 0;
  const d = SITE_DEF[t];
  // Huy Hiệu là tiền HIẾM: sản lượng Lò Rèn KHÔNG tăng theo hệ số Arena (giá nâng quân là số cố định)
  let r = d.base * (t === 'forge' ? 1 : ARENAS[arena].scale) * lvMult(L);
  const eb = equipBonus(S);
  if (t === 'farm' || t === 'lumber') r *= (has(S, 32) ? 1.1 : 1) * (1 + eb.gold);
  if (t === 'crystal') r *= (has(S, 33) ? 1.1 : 1) * (1 + eb.stone);
  if (t === 'forge') r *= has(S, 45) ? 1.15 : 1;
  if (has(S, 46)) r *= 1.25;
  return r;
}

export function upgradeCost(arena: number, L: number, t: SiteType): number {
  return Math.ceil(SITE_DEF[t].cost * ARENAS[arena].scale * Math.pow(1.24, L));
}

export function upgradeSite(S: Save, arena: number, t: SiteType): boolean {
  const L = lvOf(S, arena, t);
  if (L >= MAX_SITE_LV) return false;
  const c = upgradeCost(arena, L, t);
  if (S.gold < c) return false;
  S.gold -= c;
  if (!S.vil) S.vil = {};
  if (!S.vil[arena]) S.vil[arena] = [0, 0, 0, 0];
  S.vil[arena][SITE_TYPES.indexOf(t)] = L + 1;
  bump(S, 'villageUps');
  return true;
}

/** Thu nhập / giây của một làng (theo tài nguyên) */
export function villageRate(S: Save, arena: number): Rates {
  const r: Rates = { gold: 0, stones: 0, badges: 0 };
  for (const t of SITE_TYPES) r[SITE_DEF[t].res] += siteRate(S, arena, t);
  return r;
}

/** Tổng thu nhập / giây của mọi làng đã mở */
export function villageRates(S: Save): Rates {
  const r: Rates = { gold: 0, stones: 0, badges: 0 };
  for (let a = 0; a <= S.unlocked && a < ARENAS.length; a++) {
    const v = villageRate(S, a);
    r.gold += v.gold; r.stones += v.stones; r.badges += v.badges;
  }
  return r;
}
