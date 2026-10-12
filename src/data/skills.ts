// Cây kỹ năng 64 node: 1 gốc + 3 nhánh (7 tầng). Một số node "Chiêu Mộ" mở khóa binh chủng mới.
import type { TroopId } from './troops';
export type Branch = 'root' | 'A' | 'B' | 'C';

export interface SkillNode {
  id: number;
  name: string;
  desc: string;
  branch: Branch;
  tier: number; // 0 = gốc, 1..5
  req: number[]; // cần mở TẤT CẢ node này trước
  icon: number; // chỉ số icon UI
  troop?: TroopId; // node chiêu mộ: mở khóa binh chủng này
}

const n = (
  id: number,
  branch: Branch,
  tier: number,
  req: number[],
  name: string,
  desc: string,
  icon = id % 12,
  troop?: TroopId,
): SkillNode => ({ id, branch, tier, req, name, desc, icon, troop });

export const SKILLS: SkillNode[] = [
  n(1, 'root', 0, [], 'Linh Hồn Thủ Lĩnh', 'Mở khóa chỉ huy 3 đạo lính và tự động tích lũy tài nguyên khi AFK.'),

  // ===== Nhánh A: Thống Soái =====
  n(2, 'A', 1, [1], 'Tăng Quân Số I', 'Knight +1 lính, Archer +1 lính.'),
  n(3, 'A', 1, [1], 'Quân Giới Kiên Cố', 'Lính cận chiến +25% Giáp.'),
  n(4, 'A', 1, [1], 'Mũi Tên Sắc Bén', 'Đơn vị đánh xa +10% Chí mạng.'),
  n(5, 'A', 2, [3], 'Khiên Chắn Liên Hoàn', 'Knight có 35% chặn đòn chí mạng nhắm vào đồng minh.'),
  n(6, 'A', 2, [4], 'Xạ Kích Đồng Loạt', 'Khi MC đánh thường, một Archer bắn thêm mũi tên phụ.'),
  n(7, 'A', 2, [2], 'Trận Pháp Tiếp Ứng', 'Giảm 20% thời gian hồi sinh của lính.'),
  n(8, 'A', 2, [2], 'Tăng Quân Số II', 'Healer +1 lính, Wizard +1 lính (nếu đã chiêu mộ).'),
  n(9, 'A', 3, [7], 'Khúc Ca Hành Quân', '+15% tốc chạy và tốc đánh toàn quân trong 10 giây đầu trận.'),
  n(10, 'A', 3, [8], 'Tế Bào Sinh Mệnh', 'Healer hồi máu diện rộng bằng 8% HP tối đa của MC mỗi 8 giây.'),
  n(11, 'A', 3, [5], 'Cường Lực Tiền Tuyến', 'Khi Knight còn trên 50% máu, MC giảm 15% sát thương nhận.'),
  n(12, 'A', 3, [6], 'Hỏa Lực Yểm Trợ', 'Wizard (nếu có) phóng thêm cầu lửa khi Knight kích hoạt Khiên.'),
  n(13, 'A', 4, [9], 'Khí Phách Thủ Lĩnh', 'Mỗi lính còn sống +2% Công cho MC.'),
  n(14, 'A', 4, [11], 'Tử Sĩ Bất Khuất', 'Lính ngã xuống phát nổ gây sát thương diện rộng và hồi nộ cho MC.'),
  n(15, 'A', 4, [10], 'Quân Đội Bất Tử', 'Lính nhận ít hơn 30% sát thương diện rộng từ Boss.'),
  n(16, 'A', 5, [13, 14, 15], 'Quân Đoàn Hoàng Gia', 'Triệu hồi Thánh Kỵ Sĩ khi MC dưới 30% máu; +20% chỉ số toàn bộ lính.'),
  n(47, 'A', 2, [3], 'Chiêu Mộ: Trường Thương', 'MỞ KHÓA binh chủng Bộ Binh Trường Thương: tiền tuyến thứ hai, đâm xuyên 2 mục tiêu.', 3, 'pike'),
  n(48, 'A', 3, [6], 'Chiêu Mộ: Phi Thương', 'MỞ KHÓA Xạ Binh Phi Thương: tuyến giữa, phi thương xuyên giáp nhiều mục tiêu.', 4, 'huntress'),
  n(49, 'A', 4, [11], 'Chiêu Mộ: Thánh Kỵ Sĩ', 'MỞ KHÓA Thánh Kỵ Sĩ: tiền tuyến hộ trì, hào quang hồi máu cả đội.', 5, 'paladin'),
  n(50, 'A', 6, [16], 'Chiến Cổ Vang Dội', 'Cứ 20 giây, tiếng trống chiến làm toàn quân +30% tốc đánh trong 6 giây.', 6),
  n(51, 'A', 6, [16], 'Hậu Cần Dự Bị', 'Lính hồi sinh nhanh gấp đôi và vừa vô trận đã có Khiên bằng 35% máu.', 7),
  n(52, 'A', 6, [16], 'Tinh Binh Tuyển Chọn', '+1 quân số cho MỌI binh chủng đang ra trận.', 8),
  n(53, 'A', 7, [50, 51, 52], 'Tổng Tiến Công', 'Mỗi 25 giây: mọi lính đã ngã sống dậy tức thì, toàn quân +40% Công trong 8 giây.', 9),

  // ===== Nhánh B: Bản Thể =====
  n(17, 'B', 1, [1], 'Cương Thể I', 'MC +20% HP tối đa.'),
  n(18, 'B', 1, [1], 'Lực Đòn I', 'MC +20% Sức tấn công.'),
  n(19, 'B', 1, [1], 'Nhịp Điệu Chiến Đấu', 'MC +15% Tốc độ đánh.'),
  n(20, 'B', 2, [18], 'Nhát Chém Quét', 'Đòn đánh thứ 3 của MC chém lan hình nón.'),
  n(21, 'B', 2, [17], 'Phản Kích', 'MC có 40% phản lại 25% sát thương cận chiến nhận vào.'),
  n(22, 'B', 2, [18], 'Hút Máu Chiến Trường', 'MC hồi HP bằng 6% sát thương gây ra.'),
  n(23, 'B', 2, [19], 'Ý Chí Sắt Đá', 'Miễn nhiễm choáng/đóng băng 3 giây đầu trận.'),
  n(24, 'B', 3, [20], 'Đòn Quyết Định', 'MC +60% sát thương chí mạng lên địch bị khống chế.'),
  n(25, 'B', 3, [21], 'Cuồng Nộ', 'HP càng thấp, Công và Tốc đánh MC càng cao (tối đa +50%).'),
  n(26, 'B', 3, [22], 'Xuyên Giáp Tối Đa', 'Đòn đánh MC bỏ qua 30% Giáp của Boss.'),
  n(27, 'B', 3, [23], 'Vỏ Bọc Năng Lượng', 'Khiên bằng 25% HP tối đa mỗi 15 giây.'),
  n(28, 'B', 4, [24], 'Kiếm Khí Thấu Thần', 'Tầm đánh MC +80%, đòn đánh phóng sóng năng lượng xuyên.'),
  n(29, 'B', 4, [25], 'Miễn Nhiễm Tuyệt Đối', 'Nhận đòn chí mạng: bất tử 1.5 giây (hồi 45 giây).'),
  n(30, 'B', 4, [27], 'Thần Tốc', 'Giảm 20% hồi chiêu kỹ năng chủ động của MC.'),
  n(31, 'B', 5, [28, 29, 30], 'Chiến Thần Giáng Thế', 'Thần Thể 12 giây: +50% kích thước, đòn đánh gây sát thương chuẩn diện rộng, miễn khống chế.'),
  n(54, 'B', 2, [19], 'Chiêu Mộ: Sát Thủ', 'MỞ KHÓA Sát Thủ Bóng Đêm: tàng hình, dịch chuyển ra sau lưng địch diệt quái đánh xa.', 10, 'rogue'),
  n(55, 'B', 6, [31], 'Khát Máu', 'Mỗi lần hạ gục quái, MC hồi 3% máu tối đa.', 11),
  n(56, 'B', 6, [31], 'Bão Kiếm', 'Cứ 6 đòn đánh, MC xoay một vòng chém tất cả địch quanh mình gây 2 lần Công.', 0),
  n(57, 'B', 6, [31], 'Phượng Hoàng Tái Sinh', 'Mỗi trận 1 lần: nhận đòn chí tử sẽ sống dậy với 50% máu và bất tử 2 giây.', 1),
  n(58, 'B', 7, [55, 56, 57], 'Chiến Ý Bất Diệt', 'Mỗi đòn đánh của MC giảm 0.8 giây hồi chiêu Chiến Hống; Chiến Hống làm choáng quái 1.5 giây.', 2),

  // ===== Nhánh C: Huyền Bí & AFK =====
  n(32, 'C', 1, [1], 'Thu Hoạch Nhanh I', '+10% tốc độ farm Vàng.'),
  n(33, 'C', 1, [1], 'Tinh Luyện I', '+10% tốc độ rớt Đá Tinh Thạch.'),
  n(34, 'C', 1, [1], 'Tia Lửa Ma Pháp', 'Đòn của MC và Wizard gây Đốt Cháy theo thời gian.'),
  n(35, 'C', 2, [34], 'Băng Phong Diện Rộng', 'Đòn đánh 30% làm chậm 40% tốc chạy/tốc đánh quái.'),
  n(36, 'C', 2, [34], 'Sấm Sét Liên Hoàn', 'Quái chết là phóng tia sét giật sang 2 con kế bên.'),
  n(37, 'C', 2, [32], 'Thùng Đồ Mở Rộng', 'Hòm AFK tích lũy tối đa 12 giờ (thay vì 8 giờ).'),
  n(38, 'C', 2, [33], 'Tinh Thông Cổ Ngữ', 'Giảm 15% Đá Tinh Thạch khi mở các node kế tiếp.'),
  n(39, 'C', 3, [35], 'Cuồng Phong Càn Quét', 'Đầu mỗi đợt quái, lốc xoáy gom quái vào giữa sàn.'),
  n(40, 'C', 3, [36], 'Đòn Đánh Hoang Tưởng', 'Đòn đánh 10% khiến quái Hỗn Loạn (đánh lẫn nhau).'),
  n(41, 'C', 3, [37], 'Tích Lũy Siêu Cấp', 'Lãnh liền 2 giờ tài nguyên AFK khi mở Arena mới.'),
  n(42, 'C', 3, [32], 'Vàng Rơi Đột Biến', 'Quái thường có 5% rớt gấp 5 lần Vàng.'),
  n(43, 'C', 4, [39], 'Lời Nguyền Suy Yếu', 'Boss giảm 25% Công và Giáp.'),
  n(44, 'C', 4, [40], 'Dòng Chảy Năng Lượng', 'Phép của Wizard (nếu có) hết thời gian niệm (tức thì).'),
  n(45, 'C', 4, [41], 'Rương Báu May Mắn', '+15% tỉ lệ rớt nguyên liệu hiếm (Huy Hiệu) khi farm.'),
  n(46, 'C', 5, [43, 44, 45], 'Lỗ Hổng Hư Không', 'Đầu trận triệu hồi Hố Đen hút quái & gây sát thương phép; +25% hiệu suất farm AFK vĩnh viễn.'),
  n(59, 'C', 2, [34], 'Chiêu Mộ: Pháp Sư', 'MỞ KHÓA Pháp Sư Nguyên Tố: niệm 1 giây rồi phóng cầu lửa/băng lan vào chỗ quái đông.', 3, 'wizard'),
  n(60, 'C', 4, [40], 'Chiêu Mộ: Triệu Hồi Sư', 'MỞ KHÓA Triệu Hồi Sư: cứ 7 giây gọi 2 Linh Hồn ra chiến đấu.', 4, 'summoner'),
  n(61, 'C', 6, [46], 'Kho Báu Vĩnh Hằng', 'Hòm AFK tích lũy tối đa 24 giờ; làng sản xuất thêm 20% Vàng.', 5),
  n(62, 'C', 6, [46], 'Thợ Săn Báu Vật', 'Tỉ lệ rớt trang bị x2; mỗi lần hạ Boss rớt thêm 1 món.', 6),
  n(63, 'C', 6, [46], 'Bão Băng Hà', 'Cứ 14 giây, bão tuyết đóng băng toàn bộ quái thường 2 giây (Boss bị làm chậm).', 7),
  n(64, 'C', 7, [61, 62, 63], 'Thiên Thạch Hủy Diệt', 'Cứ 16 giây, thiên thạch giáng xuống gây 3 lần Công của MC lên mọi địch và thiêu đốt.', 8),
];

export const SKILL_BY_ID: Record<number, SkillNode> = Object.fromEntries(SKILLS.map((s) => [s.id, s]));

export const BRANCH_INFO: Record<Branch, { name: string; color: number; css: string }> = {
  root: { name: 'Khởi Nguyên', color: 0xf3d36b, css: '#f3d36b' },
  A: { name: 'Thống Soái', color: 0x6aa8ff, css: '#6aa8ff' },
  B: { name: 'Bản Thể', color: 0xff7a6a, css: '#ff7a6a' },
  C: { name: 'Huyền Bí & AFK', color: 0xb98cff, css: '#b98cff' },
};

/** Chi phí Đá Tinh Thạch để mở node tiếp theo: tăng theo số node đã mở. */
export const SKILL_C = 4; // chỉnh bằng tools/sim.ts
export const SKILL_G = 1.12;
export function skillCost(unlockedCount: number, hasNode38: boolean, frontierScale = 1): number {
  if (unlockedCount === 0) return 0;
  // giá theo hệ số Arena tiền tuyến: Đá kiếm được tăng theo Arena nên giá node cũng phải tăng theo, nếu không sẽ miễn phí về sau
  const base = SKILL_C * Math.pow(SKILL_G, unlockedCount - 1) * frontierScale;
  return Math.ceil(base * (hasNode38 ? 0.85 : 1));
}

/** Toạ độ node trong màn Cây kỹ năng (0..1000 x 0..1000, gốc ở giữa dưới). */
export function skillLayout(): Record<number, { x: number; y: number }> {
  const pos: Record<number, { x: number; y: number }> = { 1: { x: 500, y: 930 } };
  const branches: { b: Branch; cx: number }[] = [
    { b: 'A', cx: 170 },
    { b: 'B', cx: 500 },
    { b: 'C', cx: 830 },
  ];
  const tierY = [0, 800, 670, 540, 410, 280, 150, 20];
  for (const { b, cx } of branches) {
    const tiers: Record<number, SkillNode[]> = {};
    SKILLS.filter((s) => s.branch === b).forEach((s) => (tiers[s.tier] ||= []).push(s));
    for (const t of Object.keys(tiers).map(Number)) {
      // sắp theo vị trí trung bình của node cha để đường nối ít bắt chéo
      const arr = tiers[t].slice().sort((p, q) => parentX(p, pos, cx) - parentX(q, pos, cx));
      const gap = arr.length >= 5 ? 66 : arr.length === 4 ? 85 : 98;
      arr.forEach((s, i) => {
        pos[s.id] = { x: cx + (i - (arr.length - 1) / 2) * gap, y: tierY[t] };
      });
    }
  }
  return pos;
}
function parentX(s: SkillNode, pos: Record<number, { x: number; y: number }>, cx: number): number {
  const xs = s.req.map((r) => pos[r]?.x).filter((v): v is number => v !== undefined);
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : cx;
}
