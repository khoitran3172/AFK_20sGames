// 6 binh chủng. Chỉ số cá thể = (20% chỉ số MC) x hệ số đạo quân / quân số
// (Inverse Power-to-Count Rule: đông lính -> chỉ số lẻ thấp, ít lính -> tinh nhuệ).
export type TroopId = 'knight' | 'pike' | 'archer' | 'wizard' | 'healer' | 'rogue';

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
};

export const TROOP_ORDER: TroopId[] = ['knight', 'pike', 'archer', 'wizard', 'healer', 'rogue'];

export const TIER_NAMES = ['', 'Tân Binh', 'Dày Dạn', 'Hoàng Gia'];
export const TIER_STAT_MUL = [0, 1, 1.3, 1.75];
export const TIER_BADGE_COST = [0, 0, 30, 160];
export const TIER_GOLD_COST_MUL = [0, 0, 400, 6000]; // x arena scale (xem state)

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
];

export function activeSynergy(squad: TroopId[]): Synergy | null {
  for (const s of SYNERGIES) if (s.need.every((t) => squad.includes(t))) return s;
  return null;
}
