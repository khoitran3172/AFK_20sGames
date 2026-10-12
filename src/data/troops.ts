// 6 binh chủng. Chỉ số cá thể = (20% chỉ số MC) x hệ số đạo quân / quân số
// (Inverse Power-to-Count Rule: đông lính -> chỉ số lẻ thấp, ít lính -> tinh nhuệ).
export type TroopId = 'knight' | 'pike' | 'archer' | 'wizard' | 'healer' | 'rogue' | 'paladin' | 'huntress' | 'summoner';

export interface TroopDef {
  id: TroopId;
  name: string;
  role: string;
  count: number; // quân số gốc
  maxCount: number;
  hpMul: number; // tổng HP đạo quân so với 20% HP MC
  atkMul: number; // tổng ATK đạo quân so với 20% ATK MC
  range: number; // px
  aspd: number; // đòn/giây
  speed: number; // px/giây
  respawn: number; // giây / lính
  melee: boolean;
  lane: number; // 0 tiền tuyến .. 2 hậu phương (x tương đối)
  desc: string;
  tierTraits: [string, string];
  scale: number;
}

export const TROOPS: Record<TroopId, TroopDef> = {
  knight: {
    id: 'knight', name: 'Trọng Giáp Binh', role: 'Tiền tuyến · Đỡ đòn', count: 7, maxCount: 8,
    hpMul: 3.2, atkMul: 0.45, range: 70, aspd: 0.9, speed: 95, respawn: 6, melee: true, lane: 0, scale: 0.62,
    desc: 'Lao lên chặn đường, hút 80% đòn cận chiến. Tự dựng Khiên Phản Chấn: -40% sát thương mặt trước.',
    tierTraits: ['+10% Kháng phép', '-25% hồi sinh, ngoại hình Hoàng Gia'],
  },
  pike: {
    id: 'pike', name: 'Bộ Binh Trường Thương', role: 'Tiền tuyến · Chống sốc', count: 6, maxCount: 7,
    hpMul: 1.7, atkMul: 0.9, range: 105, aspd: 0.95, speed: 90, respawn: 7, melee: true, lane: 0, scale: 0.42,
    desc: 'Đứng sau Knight; đâm xuyên 2 mục tiêu, đẩy lùi quái nhỏ.',
    tierTraits: ['+15% sát thương xuyên', '-25% hồi sinh, ngoại hình Hoàng Gia'],
  },
  archer: {
    id: 'archer', name: 'Xạ Thủ Cung Dài', role: 'Hậu phương · Sát thương đơn', count: 5, maxCount: 6,
    hpMul: 0.55, atkMul: 1.5, range: 430, aspd: 0.95, speed: 85, respawn: 8, melee: false, lane: 2, scale: 0.55,
    desc: 'Giữ cự ly, ưu tiên bắn quái ít máu / quái đang nhắm MC. Chí mạng cao.',
    tierTraits: ['Bắn có 20% xuyên mục tiêu', '-25% hồi sinh, ngoại hình Hoàng Gia'],
  },
  wizard: {
    id: 'wizard', name: 'Pháp Sư Nguyên Tố', role: 'Trung tâm · AoE & Khống chế', count: 3, maxCount: 4,
    hpMul: 0.6, atkMul: 1.75, range: 330, aspd: 0.4, speed: 80, respawn: 12, melee: false, lane: 1, scale: 0.55,
    desc: 'Vận công 1 giây rồi phóng cầu lửa/băng lan vào chỗ quái đông nhất.',
    tierTraits: ['+20% vùng nổ', '-25% hồi sinh, ngoại hình Hoàng Gia'],
  },
  healer: {
    id: 'healer', name: 'Mục Sư Thánh Điện', role: 'Hậu phương · Hồi máu', count: 2, maxCount: 3,
    hpMul: 0.7, atkMul: 0, range: 400, aspd: 0.5, speed: 90, respawn: 10, melee: false, lane: 2, scale: 0.55,
    desc: 'Bám sau MC, ưu tiên hồi MC rồi lính thấp máu nhất.',
    tierTraits: ['+20% lượng hồi', '-25% hồi sinh, ngoại hình Hoàng Gia'],
  },
  rogue: {
    id: 'rogue', name: 'Sát Thủ Bóng Đêm', role: 'Linh hoạt · Ám sát', count: 3, maxCount: 4,
    hpMul: 0.5, atkMul: 1.9, range: 62, aspd: 1.5, speed: 175, respawn: 9, melee: true, lane: 1, scale: 0.5,
    desc: 'Đầu trận tàng hình 2s, dịch chuyển ra sau lưng địch diệt quái đánh xa.',
    tierTraits: ['+25% sát thương chí mạng', '-25% hồi sinh, ngoại hình Hoàng Gia'],
  },
  paladin: {
    id: 'paladin', name: 'Thánh Kỵ Sĩ', role: 'Tiền tuyến · Hộ trì', count: 4, maxCount: 5,
    hpMul: 2.4, atkMul: 0.7, range: 80, aspd: 0.85, speed: 92, respawn: 8, melee: true, lane: 0, scale: 1,
    desc: 'Hào quang thánh: mỗi 3 giây hồi 2% máu tối đa cho đồng minh quanh mình.',
    tierTraits: ['+20% hào quang', '-25% hồi sinh, ngoại hình Hoàng Gia'],
  },
  huntress: {
    id: 'huntress', name: 'Xạ Binh Phi Thương', role: 'Tuyến giữa · Sát thương xuyên', count: 4, maxCount: 5,
    hpMul: 0.7, atkMul: 1.6, range: 300, aspd: 0.9, speed: 100, respawn: 8, melee: false, lane: 1, scale: 1,
    desc: 'Phóng phi thương xuyên 2 mục tiêu, chí mạng cao.',
    tierTraits: ['Xuyên thêm 1 mục tiêu', '-25% hồi sinh, ngoại hình Hoàng Gia'],
  },
  summoner: {
    id: 'summoner', name: 'Triệu Hồi Sư', role: 'Hậu phương · Triệu hồi', count: 2, maxCount: 3,
    hpMul: 0.65, atkMul: 0.9, range: 300, aspd: 0.5, speed: 85, respawn: 12, melee: false, lane: 2, scale: 1,
    desc: 'Mỗi 7 giây triệu hồi 2 Linh Hồn chiến đấu (tồn tại 12 giây).',
    tierTraits: ['Linh Hồn mạnh hơn 20%', '-25% hồi sinh, ngoại hình Hoàng Gia'],
  },
};

export const TROOP_ORDER: TroopId[] = ['knight', 'pike', 'archer', 'wizard', 'healer', 'rogue', 'paladin', 'huntress', 'summoner'];

export const TIER_NAMES = ['', 'Tân Binh', 'Dày Dạn', 'Hoàng Gia'];
export const TIER_STAT_MUL = [0, 1, 1.3, 1.75];
export const TIER_BADGE_COST = [0, 0, 30, 160];
export const TIER_GOLD_COST_MUL = [0, 0, 2500, 40000]; // x arena scale (xem state)

export interface Synergy {
  id: string;
  name: string;
  need: TroopId[];
  desc: string;
  best: string;
}

export const SYNERGIES: Synergy[] = [
  { id: 'balance', name: 'Cân Bằng Chuẩn Mực', need: ['knight', 'archer', 'healer'],
    desc: '+15% HP Knight · Archer +10% tốc bắn · Healer -20% hồi chiêu.', best: 'Vượt ải an toàn, Boss sát thương ổn định.' },
  { id: 'iron', name: 'Thiết Vệ Giáp Trận', need: ['knight', 'pike', 'rogue'],
    desc: '-20% sát thương nhận của cận chiến · MC +30% sát thương lên quái bị khống chế.', best: 'Ải đông quái cận chiến, quái chạy nhanh.' },
  { id: 'storm', name: 'Thủy Thần Bão Lửa', need: ['archer', 'wizard', 'healer'],
    desc: '+25% sát thương tầm xa · đòn thường MC thành tia năng lượng.', best: 'Boss khổng lồ di chuyển chậm.' },
  { id: 'chaos', name: 'Hỗn Loạn Phá Địch', need: ['knight', 'wizard', 'rogue'],
    desc: 'Quái bị đóng băng nhận thêm 50% sát thương chí mạng từ Rogue và MC.', best: 'Ải có hậu phương địch nguy hiểm.' },
  { id: 'crusade', name: 'Thánh Chiến', need: ['paladin', 'knight', 'healer'],
    desc: '+15% HP Knight & Paladin · hào quang Paladin hồi 3% thay vì 2%.', best: 'Boss đánh lâu, sát thương diện rộng.' },
  { id: 'hunt', name: 'Cuộc Săn', need: ['huntress', 'archer', 'rogue'],
    desc: '+20% chí mạng đơn vị xa & Rogue · phi thương xuyên thêm 1 mục tiêu.', best: 'Ải đông quái yếu xếp hàng dài.' },
  { id: 'spirits', name: 'Hồn Ma Bất Diệt', need: ['summoner', 'wizard', 'healer'],
    desc: 'Linh Hồn mạnh hơn 30% và tồn tại 18 giây.', best: 'Ải kéo dài, cần nhiều lá chắn thịt.' },
];

export function activeSynergy(squad: TroopId[]): Synergy | null {
  for (const s of SYNERGIES) if (s.need.every((t) => squad.includes(t))) return s;
  return null;
}


// ---------------------------------------------------------------- cây nâng quân (4 node / binh chủng)
export interface TreeFx { hp?: number; atk?: number; def?: number; aspd?: number; crit?: number; count?: number; respawn?: number; heal?: number; spirit?: number }
export const TROOP_TREE: Record<TroopId, TreeFx[]> = {
  knight: [{ hp: 0.25 }, { count: 1 }, { def: 0.3 }, { hp: 0.35, respawn: 0.25 }],
  pike: [{ atk: 0.2 }, { hp: 0.25 }, { count: 1 }, { atk: 0.3, aspd: 0.1 }],
  archer: [{ crit: 0.1 }, { atk: 0.25 }, { count: 1 }, { atk: 0.3, aspd: 0.15 }],
  wizard: [{ atk: 0.25 }, { aspd: 0.2 }, { count: 1 }, { atk: 0.4 }],
  healer: [{ hp: 0.3 }, { heal: 0.25 }, { count: 1 }, { heal: 0.35, respawn: 0.25 }],
  rogue: [{ crit: 0.15 }, { atk: 0.25 }, { aspd: 0.15 }, { atk: 0.35, crit: 0.15 }],
  paladin: [{ hp: 0.3 }, { heal: 0.3 }, { count: 1 }, { hp: 0.3, def: 0.3 }],
  huntress: [{ crit: 0.12 }, { atk: 0.25 }, { count: 1 }, { atk: 0.35, aspd: 0.15 }],
  summoner: [{ atk: 0.3 }, { hp: 0.3 }, { count: 1 }, { spirit: 0.6, atk: 0.3 }],
};
/** Node IV của mỗi cây quân mở một CƠ CHẾ riêng (không chỉ cộng %) */
export const TROOP_SPECIAL: Record<TroopId, { vi: [string, string]; en: [string, string] }> = {
  knight: { vi: ['Tường Thép', 'Khiên Phản Chấn giảm 60% sát thương mặt trước và kéo dài 5 giây.'], en: ['Iron Wall', 'Rebound Shield blocks 60% frontal damage and lasts 5s.'] },
  pike: { vi: ['Mũi Thương Xuyên Giáp', 'Đòn đâm bỏ qua 40% Giáp của địch.'], en: ['Armor-Piercing Tip', 'Thrusts ignore 40% of enemy armor.'] },
  archer: { vi: ['Mưa Tên', 'Mỗi mũi thứ 6, Xạ Thủ bắn thêm 3 mũi tên vô 3 quái ngẫu nhiên.'], en: ['Arrow Rain', 'Every 6th shot fires 3 extra arrows at random foes.'] },
  wizard: { vi: ['Thiên Thạch Nguyên Tố', 'Vùng nổ +50%; cứ 4 phép có 1 phép Thiên Thạch gấp 2.5 lần sát thương.'], en: ['Elemental Meteor', 'Blast radius +50%; every 4th spell is a Meteor for 2.5x damage.'] },
  healer: { vi: ['Ân Điển Sống Lại', 'Mỗi 20 giây, 1 lính vừa ngã được hồi sinh sau 1.5 giây.'], en: ['Grace of Rebirth', 'Every 20s, a fallen soldier revives after only 1.5s.'] },
  rogue: { vi: ['Đoạt Mạng', 'Hạ gục quái là hồi chiêu dịch chuyển và tàng hình 1.5 giây.'], en: ['Execute', 'Each kill resets the blink cooldown and grants 1.5s of stealth.'] },
  paladin: { vi: ['Thánh Quang Bất Diệt', 'Mỗi 15 giây, Paladin ban Khiên bằng 20% máu cho đồng minh xung quanh.'], en: ['Undying Radiance', 'Every 15s, grants nearby allies a Shield worth 20% max HP.'] },
  huntress: { vi: ['Cuộc Săn Vô Tận', 'Phi thương xuyên thêm 2 mục tiêu và không bị giảm sát thương.'], en: ['Endless Hunt', 'Spears pierce 2 more targets with no damage falloff.'] },
  summoner: { vi: ['Đại Quân Vong Linh', 'Mỗi lần gọi ra 3 Linh Hồn (thay vì 2), tối đa 14 Linh Hồn.'], en: ['Army of the Dead', 'Summons 3 Spirits per cast (instead of 2), up to 14 at once.'] },
};
export const hasSpecial = (ttree: Record<string, number> | undefined, id: TroopId) => (ttree?.[id] ?? 0) >= 4;

export const TREE_BADGE = [20, 50, 110, 220];
export const TREE_GOLD = [2000, 6000, 18000, 45000]; // x hệ số Arena đã mở

export function treeFx(unlockedNodes: number, id: TroopId): Required<TreeFx> {
  const out: Required<TreeFx> = { hp: 0, atk: 0, def: 0, aspd: 0, crit: 0, count: 0, respawn: 0, heal: 0, spirit: 0 };
  const nodes = TROOP_TREE[id];
  for (let i = 0; i < Math.min(unlockedNodes, nodes.length); i++) for (const [k, v] of Object.entries(nodes[i])) (out as unknown as Record<string, number>)[k] += v as number;
  return out;
}
