// Sự kiện làng: Thương nhân ghé thăm (mua đồ/đá/buff) và Địch tấn công (đem đội hình ra bảo vệ).
// Tính theo THỜI GIAN CHƠI (playMs), không theo giờ máy, nên offline không bị phạt và không gian lận bằng đổi giờ.
import { ARENAS } from '../data/arenas';
import { Item, rollItem } from '../data/items';
import { Save, addItem, newEventState } from './state';
import { reward } from './progress';

export interface MerchantEvent { arena: number; until: number; bought: boolean[] }
export interface RaidEvent { arena: number; until: number }
export interface EventState {
  nextAt: number; // playMs để sinh sự kiện kế tiếp
  merchant: MerchantEvent | null;
  raid: RaidEvent | null;
  buffUntil: number; // playMs hết hiệu lực buff thu nhập làng
  buffMult: number;
}

const MERCHANT_MS = 12 * 60_000;
const RAID_MS = 15 * 60_000;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

export function villageBuff(S: Save): number {
  return S.ev && S.playMs < S.ev.buffUntil ? S.ev.buffMult : 1;
}

export type EventNotice = { kind: 'merchant' | 'raid' | 'pillage'; arena: number; lost?: number } | null;

/** Gọi mỗi khung: trả về thông báo nếu có sự kiện mới / vừa hết hạn */
export function tickEvents(S: Save): EventNotice {
  if (!S.ev) S.ev = newEventState();
  const e = S.ev;
  // hết hạn
  if (e.merchant && S.playMs > e.merchant.until) e.merchant = null;
  if (e.raid && S.playMs > e.raid.until) {
    const arena = e.raid.arena;
    e.raid = null;
    // địch cướp: mất một phần Vàng (tối đa 15%)
    const loss = Math.min(S.gold * 0.15, reward(S, 12, 0).gold);
    S.gold -= loss;
    e.nextAt = S.playMs + rnd(20, 35) * 60_000;
    return { kind: 'pillage', arena, lost: loss };
  }
  if (!e.merchant && !e.raid && S.playMs >= e.nextAt && S.unlocked >= 1) {
    const arena = Math.floor(Math.random() * (Math.min(S.unlocked, ARENAS.length - 1) + 1));
    if (S.unlocked >= 2 && Math.random() < 0.45) {
      e.raid = { arena, until: S.playMs + RAID_MS };
      return { kind: 'raid', arena };
    }
    e.merchant = { arena, until: S.playMs + MERCHANT_MS, bought: [false, false, false] };
    e.nextAt = S.playMs + rnd(25, 45) * 60_000;
    return { kind: 'merchant', arena };
  }
  return null;
}

// ------------------------------------------------------------ thương nhân
export interface Offer { id: number; kind: 'crate' | 'stones' | 'buff'; price: number; gold?: number; stones?: number }
export function merchantOffers(S: Save): Offer[] {
  const G = Math.max(S.rate.gold * 60, 4 * ARENAS[Math.min(S.unlocked, ARENAS.length - 1)].scale);
  return [
    { id: 0, kind: 'crate', price: Math.ceil(30 * G) },
    { id: 1, kind: 'stones', price: Math.ceil(36 * G), stones: reward(S, 0, 30).stones }, // đắt hơn tự sản xuất: không có lời khi quy đổi
    { id: 2, kind: 'buff', price: Math.ceil(14 * G) }, // buff +50% x 30 phút = lời tối đa ~15 phút thu nhập, giá 14 phút
  ];
}
export function buyOffer(S: Save, id: number): { item?: Item; stones?: number; buff?: boolean } | null {
  const m = S.ev?.merchant;
  if (!m || m.bought[id]) return null;
  const o = merchantOffers(S)[id];
  if (S.gold < o.price) return null;
  S.gold -= o.price;
  m.bought[id] = true;
  if (o.kind === 'crate') {
    const it = rollItem(S.unlocked, 2, 2);
    addItem(S, it);
    return { item: it };
  }
  if (o.kind === 'stones') { S.stones += o.stones!; return { stones: o.stones }; }
  S.ev.buffUntil = S.playMs + 30 * 60_000;
  S.ev.buffMult = 1.5;
  return { buff: true };
}

// ------------------------------------------------------------ tấn công
export function raidRewards(S: Save, arena: number): { gold: number; stones: number; badges: number; item: Item } {
  const r = reward(S, 8, 8, 0);
  void arena;
  return { gold: r.gold, stones: r.stones, badges: 4, item: rollItem(S.unlocked, 1, 2) };
}
export function finishRaid(S: Save, won: boolean) {
  if (!S.ev) return;
  S.ev.raid = null;
  S.ev.nextAt = S.playMs + rnd(20, 35) * 60_000;
  void won;
}
