# Thiết kế — Biên Niên Thủ Lĩnh (AFK / Idle RPG)

## 1. Lõi
Thuần AFK/Idle RPG. Không còn card battle. Toàn bộ tài nguyên farm được đổ vào **1 Thủ Lĩnh** (chỉ số + cây 46 kỹ năng)
và **3 đạo quân hỗ trợ** (tiến hóa bằng Huy Hiệu). Trận đánh luôn tự động; người chơi chỉ quyết định nâng gì, farm ở đâu và khi nào khiêu chiến Boss.

## 2. Thế giới & tiến trình
* 4 bản đồ lớn × 12 Arena = 48 Arena nối tiếp (đường mòn trên bản đồ, mỗi bản đồ một màu cỏ / hệ quái).
* Chỉ số quái ×1.35 → ×1.55 mỗi Arena (`arenaGrowth` trong `src/data/arenas.ts`).
* Vòng lặp: farm quái thường ở Arena hiện tại → khi **Lực chiến ≥ khuyến nghị** bấm **Khiêu Chiến Boss** (3 đợt: 6 quái → 8 quái → Boss + 4 lính) → thắng mở Arena kế (node 41 tặng thêm 2 giờ AFK).
* Có thể quay lại farm bất kỳ Arena đã mở.

## 3. Tài nguyên
| Tài nguyên | Nguồn | Dùng cho |
|---|---|---|
| Vàng | quái rơi, hòm AFK | nâng chỉ số Thủ Lĩnh (HP/Công/Giáp), tiến hóa quân |
| Đá Tinh Thạch | quái rơi (nhiều hơn khi Boss/Elite) | mở node cây kỹ năng (giá tăng 20%/node đã mở, node 38 giảm 15%) |
| Huy Hiệu Chiến Trận | rơi hiếm (node 45 +15%) | tiến hóa bậc quân (Tân Binh → Dày Dạn → Hoàng Gia) |

## 3b. Làng của mỗi Arena (nguồn thu AFK chính)
* Mỗi Arena có một **cảnh làng riêng** (48 bố cục sinh theo seed: hình đất, hồ, vị trí lâu đài và 4 công trình, trang trí; màu cỏ/trang trí đổi theo bản đồ).
* 4 công trình: **Trang Trại** & **Xưởng Gỗ** → Vàng, **Mỏ Tinh Thạch** → Đá Tinh Thạch, **Lò Rèn** → Huy Hiệu. Mỗi công trình tối đa cấp 20, nâng bằng Vàng.
* Dân làng (Pawn) làm việc, vác hàng về lâu đài, chữ `+` bay như làng cũ; số dân tăng theo cấp.
* **Làng của mọi Arena đã mở đều sản xuất song song** (tỉ lệ theo hệ số Arena) nên cả game là một "đế chế" cộng dồn; mở Arena mới = thêm làng mới.
* Drop từ trận đánh giảm còn 30% (`BATTLE_DROP`), phần còn lại do làng đảm nhiệm; Boss thưởng nguyên vẹn.
* Offline: Hòm AFK dùng (tốc độ trận đo được + tổng sản lượng làng) × thời gian vắng × 0.85.

## 4. AFK / Offline hợp lý
* Trận farm **luôn chạy nền** ở mọi màn hình (menu, bản đồ, kỹ năng...), nhận drop thực từ từng quái.
* Hệ thống đo tốc độ farm 90 giây gần nhất. Khi thoát, lần vào lại tính **Hòm AFK = tốc độ đo được × thời gian vắng × 0.85**, tối đa 8h (node 37 → 12h; node 46 +25%).
* Hòm đầy thì dừng tích lũy (cảnh báo trong thanh Hòm AFK).

## 5. Quân đội
Công thức: chỉ số cá thể = 20% chỉ số MC × hệ số đạo quân ÷ quân số gốc (Inverse Power-to-Count). 6 binh chủng:
Knight 7, Pikeman 6, Archer 5, Wizard 3, Healer 2, Rogue 3. Chọn đúng 3.
* **Aggro:** quái cận chiến đánh đơn vị gần có Threat cao nhất (Knight 10 > Pike 7 > MC 4 > ...). Quái đánh xa nhắm đơn vị DPS cao nhất.
* **Hộ Giá:** MC < 35% máu → tiền tuyến +50% tốc chạy, lùi vòng quanh MC.
* **Sinh tử:** lính chết hồi sinh sau 6/8/12s... (rìa trái sân, chạy vào). **Chỉ khi MC chết mới thất bại.** Boss: thua → thử lại. Farm: MC hồi sinh sau 6s.
* **Cộng hưởng:** 4 bộ 3 binh chủng có Synergy (xem `src/data/troops.ts`).
* **Bậc:** ×1.0 / ×1.3 / ×1.75 chỉ số, bậc 3 giảm 25% thời gian hồi sinh. Quân hưởng 20% chỉ số MC nên tự mạnh theo MC.

## 6. Cây kỹ năng 46 node
1 gốc + 3 nhánh × 15 (Thống Soái / Bản Thể / Huyền Bí & AFK), 5 tầng, ngọn (node 16, 31, 46) cần đủ 3 node tầng 4. Toàn bộ hiệu ứng được cài trong engine
(`src/core/battle.ts`) và chỉ số (`src/core/state.ts: mods`). Dữ liệu và bản dịch EN ở `src/data/skills.ts`, `src/i18n.ts`.

## 7. Cân bằng (tools/sim.ts)
Người chơi tham lam tối ưu (chi xen kẽ làng/chỉ số) hoàn thành 48 Arena trong ≈ 35 giờ chơi tích cực (Map 1 ≈ 20 phút, mỗi bản đồ dài dần). Người chơi thật chậm hơn nhiều.
Chỉnh `REC_K`, `STAT_COST_GROWTH`, `LV_GROWTH`, `killGold` và chạy lại `npm run sim`.

## 8. Đồ họa, VFX, ngôn ngữ
* Pixel-art Tiny Swords (địa hình autotile + bọt sóng động + vách đá, công trình, cây đung đưa) và nhân vật có animation idle/walk/attack/hurt/death.
* VFX Gigapack (nổ, hồi máu, băng, sấm, pháo hoa, màn Chiến Thắng).
* Hai ngôn ngữ vi/en: tiếng Việt cần VT323 (chỉ font pixel đủ 74/74 ký tự có dấu trong các font đã thử), tiếng Anh dùng Pixelify Sans.
  Màn Cài đặt có dòng thử dấu tiếng Việt để kiểm tra lỗi font.


## 10. Hệ thống mở rộng (giai đoạn A, D, F, E, C)
**A. Trang bị & Rèn đồ** — 6 ô (Vũ khí, Mũ, Giáp, Ủng, Nhẫn, Bùa), 5 độ hiếm (Thường → Huyền Thoại), dòng chính theo ô + 0–3 dòng phụ ngẫu nhiên.
Đồ rớt từ Boss (1–2 món, ≥ Tốt), Elite (6%) và quái thường (0.6%); túi 60 ô, đầy thì tự rã ra Đá. Rèn: gộp 3 món cùng ô + cùng độ hiếm → 1 món hiếm hơn. Rã đồ đổi Đá Tinh Thạch. (`src/data/items.ts`, `src/scenes/ItemsScene.ts`)

**D. Nhiệm vụ ngày + Thành tựu + Quà đăng nhập** — 5 nhiệm vụ/ngày (chọn theo ngày), thưởng thêm khi xong cả 5; 15 thành tựu × 3 bậc (Đồng/Bạc/Vàng); quà đăng nhập 7 ngày không phạt nghỉ.
Thưởng tính theo "số phút thu nhập hiện tại" nên luôn có ý nghĩa ở mọi giai đoạn. Dùng giờ máy khách (chưa có server) — đổi giờ hệ thống có thể gian lận. (`src/core/progress.ts`, `src/scenes/QuestScene.ts`)

**F. Binh chủng mới + cây nâng quân** — Thánh Kỵ Sĩ (hào quang hồi máu), Xạ Binh Phi Thương (phi thương xuyên), Triệu Hồi Sư (triệu Linh Hồn); 3 bộ cộng hưởng mới (Thánh Chiến, Cuộc Săn, Hồn Ma Bất Diệt).
Mỗi binh chủng (cả 9) có cây 4 node bằng Huy Hiệu + Vàng (máu/công/giáp/tốc đánh/chí mạng/hồi máu/quân số/hồi sinh). Tối đa 9 quân trong 3 đạo. (`src/data/troops.ts: TROOP_TREE`)

**E. Sự kiện làng** — tính theo thời gian chơi (không bị phạt khi offline). *Thương nhân* ghé một làng ngẫu nhiên 12 phút: rương trang bị hiếm, bao Đá, bùa +50% thu nhập làng 30 phút. *Địch tấn công*: 15 phút để đem đội hình ra giữ làng (trận 3 đợt, thủ lĩnh Medieval King); thắng được thưởng và trang bị, bỏ qua thì mất tối đa 15% Vàng. (`src/core/events.ts`)

**C. Tháp Vô Tận** — 3 lượt leo/ngày, leo liên tục tới khi Thủ Lĩnh ngã; Boss mỗi 10 tầng; quái = 55% sức Arena tiền tuyến, +9%/tầng; hồi 25% máu giữa các tầng; thưởng theo số tầng vượt + trang bị Hiếm+ ở tầng Boss. (`src/core/tower.ts`)

## 11. Ngôn ngữ
Tiếng Việt viết theo **giọng miền Nam** (xài, vô, coi, ráng, lẹ, hổng, nè, nha, lãnh, rớt…), tiếng Anh song song. Xem `src/i18n.ts`.

## 9. Còn thiếu / việc tiếp theo
* Âm thanh/nhạc.
* Wizard dùng Monk tím, Rogue dùng Pawn dao (Tiny Swords free pack không có Wizard/Rogue). Gói Zerie đầy đủ 22 nhân vật ($2.50) hoặc gói Enemy Pack của Pixel Frog sẽ thay được.
* Bản đồ phong cách tranh vẽ như ảnh tham khảo cần art riêng; hiện dựng từ tileset Tiny Swords.
* Server/chống gian lận (save localStorage), push nhắc quay lại.
