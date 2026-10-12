# Thương Hội AFK — Thiết kế giữ chân (RR1 ≥ 70%, RR7 ≥ 50%)

> **Lưu ý trung thực về mục tiêu.** RR1 = % người cài game quay lại vào ngày hôm sau, RR7 = % quay lại vào ngày thứ 7.
> Mức phổ biến của game mobile/idle: RR1 ≈ 25–40%, RR7 ≈ 8–15%; top 1% thế giới mới chạm RR1 ~50%, RR7 ~25%.
> 70% / 50% **vượt xa mọi benchmark** nên không thể "thiết kế đảm bảo" — chỉ có thể (1) đặt đủ đòn bẩy giữ chân đã được chứng minh,
> (2) đo đúng cohort, (3) lặp A/B cho tới khi tới ngưỡng. Bản này làm (1) và (2); (3) cần người chơi thật + server.
> Nếu chọn nhóm người chơi hẹp (người đã được mời/closed beta) thì mục tiêu thực tế hơn nhiều so với người cài đại trà.

## 1. Vòng lặp chính (đã cài trong game)

| Khung thời gian | Việc người chơi làm | Hook |
|---|---|---|
| 5–30 giây | Nâng cấp công trình, xem lính làng chạy, chữ `+vàng` bay | Mỗi vài chục giây có nâng cấp mới; mốc x2 ở Lv 10/25/50/100/200/400 |
| 5 phút | Phân công anh hùng, gửi thương đoàn, quay gacha | Gacha có pity nhìn thấy được; buff khớp nghề x2 |
| 1 phiên (3–10') | Thu hoạch thương đoàn, nhận nhiệm vụ ngày, nâng nhân vật | Badge đỏ trên tab + thanh "Gợi ý" luôn chỉ bước tiếp theo |
| Trong ngày | Quay lại đúng **Giờ Vàng (12:00 / 20:00)**; thương đoàn dài 15'/2h/8h | Giờ Vàng: bán thủ công x1.5, ngọc x2; kho đầy = ngừng sản xuất |
| Tuần | Bảng xếp hạng, Sổ Thương Hội, sự kiện anh hùng SSR rate-up xoay vòng | Chốt tuần có thưởng, nhắc nhận lúc vào game |
| Dài hạn | Mở Chi Nhánh (prestige), sưu tập 30 anh hùng ×6 sao, 16 trang bị ×8 cấp, thành tựu | Danh Vọng tăng sản lượng vĩnh viễn (√, không nổ lạm phát) |

## 2. Đòn bẩy cho RR1 (đã cài)

1. **FTUE ≤ 3 phút tới khoảnh khắc "wow":** nâng Trang Trại 3 lần → *Chiêu mộ ×10 tân thủ miễn phí, chắc chắn có SSR* (rate-up tuần) → phân công anh hùng (buff hiện ngay + sprite đứng trong làng) → gửi thương đoàn 60s đầu tiên. Thanh "Gợi ý" dẫn từng bước.
2. **Lý do cụ thể để quay lại trong 24h:**
   - Thương đoàn *Hành Trình Đêm* 8h (lãi x5.5) — gửi trước khi ngủ, sáng có thưởng (mở từ ngày 4; ngày 1 có tuyến 60s/15'/2h).
   - Kho đầy → sản xuất dừng (cảnh báo viền đỏ trên header) → offline tối đa 8h (+1h/cấp Quán Trọ).
   - **Giờ Vàng** hai khung cố định mỗi ngày (thông báo trình duyệt tuỳ chọn).
   - *Teaser ngày mai* ở cuối mục tiêu ngày 1 ("Mai mở Mỏ Vàng, Bến Cảng, Quán Trọ, Bảng Xếp Hạng") và cửa sổ điểm danh hiển thị phần thưởng ngày 2.
   - Công trình/tính năng **khoá theo ngày tài khoản** (thấy sẵn trong làng, màu xám + đếm ngược) → ngày 2 luôn có thứ mới.
3. **Điểm danh 7 ngày** hiện ngay khi mở game, không phạt nghỉ (không có streak bị gãy → người nghỉ 1 ngày vẫn thấy hấp dẫn quay lại).
4. **Offline reward** rõ ràng: màn "Chào mừng trở lại" liệt kê vàng, ngọc, số thương đoàn đã về.

## 3. Đòn bẩy cho RR7 (đã cài)

1. **Hành Trình 7 ngày** (tab *Hành trình*): mỗi ngày 3–5 mục tiêu mới, ngày 7 có *Vé SSR tự chọn*; có "teaser" cho ngày tiếp theo.
2. **Lịch mở khoá** (xem bảng bên dưới) — tới ngày 7 vẫn còn thứ chưa chạm:

| Ngày | Mở khoá | Mục tiêu tâm lý |
|---|---|---|
| 1 | Trang Trại, Xưởng Gỗ, Chợ, Nhà Kho, Gacha anh hùng, tuyến 60s | Học vòng lặp, nhận SSR đầu |
| 2 | Mỏ Vàng, Bến Cảng, Quán Trọ, Thương đoàn 15', **Bảng xếp hạng** | Mở rộng, cạnh tranh |
| 3 | Tu Viện Dược, **Rương trang bị**, **Sổ Thương Hội**, tuyến 2h | Chuyên môn hoá |
| 4 | **Mở Chi Nhánh (prestige)**, tuyến **Hành Trình Đêm 8h** | Vòng lặp dài hạn đầu tiên |
| 5–6 | Chốt tuần (thưởng hạng), nâng 12 anh hùng, đủ 4 ô trang bị | Sưu tầm |
| 7 | Quà điểm danh ngày 7 (Vé SSR + 1000💎), mục tiêu Huyền thoại | Cột mốc, mở tuần mới |

3. **Nhiệm vụ ngày + điểm hoạt động (0–100)** → 5 rương mốc + **Sổ Thương Hội** (30 bậc, mùa 28 ngày) → thói quen hằng ngày.
4. **Bảng xếp hạng tuần** (đối thủ giả lập; điểm bot co giãn theo thành tích tuần trước của người chơi để luôn "cạnh tranh được"). Cần thay bằng server thật khi có đủ người.
5. **Sưu tầm / gacha dài hạn:** 30 anh hùng (8 N, 8 R, 8 SR, 6 SSR), mảnh → 6★, cấp anh hùng, 16 trang bị × 8 cấp. SSR rate-up xoay vòng theo tuần.
6. **Prestige bội số căn bậc hai** để người chơi cũ luôn có "chạy lại, nhanh hơn".

## 4. Gacha

| | Anh hùng (💎 / 🎫) | Rương trang bị (🪙) |
|---|---|---|
| Giá | 160💎 (x10 = 1600💎) hoặc 1🎫 | 3 000🪙 (x10 = 27 000🪙) |
| SSR cơ bản | 1.6% | 1.5% |
| Soft pity | từ lượt 59: +6%/lượt | từ lượt 39: +5%/lượt |
| Hard pity | 80 lượt | 60 lượt |
| SR+ đảm bảo | mỗi 10 lượt | mỗi 10 lượt |
| Rate-up | 1 SSR/tuần, 50/50 có bảo hiểm (lần sau chắc chắn) | — |
| Trùng | mảnh → sao (1★→6★), 6★ trùng quy ngọc | cấp trang bị (+25%/cấp, tối đa 8) |

Tỉ lệ & pity hiển thị trên giao diện. Không có tiền thật trong bản này; điểm nối cho IAP/ads nằm ở `COST`, `grant()` và Sổ Thương Hội (thêm nhánh trả phí).

### Nguồn ngọc (F2P) — đã mô phỏng bằng `tools/sim.js`
Thụ động 12💎/giờ (+Quán Trọ/trang sức, Giờ Vàng x2), nhiệm vụ ngày, rương điểm hoạt động, điểm danh, quà 30💎/10', Sổ Thương Hội, thành tựu, thưởng hạng tuần, thương đoàn xa (ngọc ngẫu nhiên), mục tiêu Hành trình (một lần).
Kết quả mô phỏng người chơi 4 phiên/ngày: tuần đầu ≈ 150 lượt (cố ý hào phóng để tạo gắn bó), trạng thái ổn định ≈ 10 lượt/ngày ≈ 1 SSR / 1–1.5 tuần.
**Cần hiệu chỉnh lại sau khi có dữ liệu thật** (nếu quá nhiều nội dung bị "ăn" hết trước ngày 14 → giảm ngọc, thêm anh hùng/sự kiện).

## 5. Đo lường — làm sao biết đã đạt RR1/RR7

Game đã phát sự kiện qua `track()` (`js/game.js`): `session_start`, `daily_login`, `login_claim`, `upgrade`, `upgrade_fac`, `pull`, `caravan_send/done`, `goal`, `hero_lv`, `ssr_pick`, `prestige`, `guild_level`, `week_reward`.
Đặt `window.ANALYTICS_URL = 'https://…'` (trước khi tải `game.js`) để gửi bằng `sendBeacon` JSON `{uid, t, d, n, p}` (`uid` = timestamp cài đặt; **thay bằng ID thật khi có server**).

Tính phía server:
* **RR1** = số `uid` có sự kiện ở ngày `install+1` ÷ số `uid` cài đặt (theo ngày lịch, múi giờ người chơi).
* **RR7** = tương tự ngày `install+7` (chặt chẽ) hoặc "7 ngày trở đi" (rộng — nên báo cáo cả hai).
* Phễu FTUE: `session_start → upgrade(farm≥3) → pull(tutorial) → assign → caravan_send → goal day1 → quay lại D1`.
* Cohort theo bản build, nguồn, giờ cài. Chạy A/B: thưởng điểm danh, độ dài thương đoàn đêm, số mục tiêu ngày 1, giờ Giờ Vàng.

Bảng "📊 Chỉ số giữ chân" trong tab *Khác* chỉ là bản cục bộ trên một thiết bị (D1/D7 của chính máy đó) — **không** phải RR thật.

### Công cụ test
* `?dev=1` → tab *Khác* có nút +1h / +8h / +1 ngày / +3 ngày / +ngọc / +vàng để kiểm tra toàn bộ lịch mở khoá, điểm danh, đổi tuần.
* `node tools/sim.js [phiên/ngày] [số ngày]` → mô phỏng người chơi tham lam (nâng cấp theo ROI, gacha hết ngọc, prestige) và in mốc ngày 1/2/3/4/7/14. Dùng để chỉnh `UPG_G`, `COST`, `PITY`, nguồn ngọc trong `js/data.js` + `js/state.js`.

## 6. Rủi ro / việc tiếp theo (chưa làm)

1. **Server + tài khoản + chống gian lận** (hiện lưu `localStorage`, có thể sửa; đổi giờ hệ thống sẽ phá bộ đếm ngày — cần giờ server).
2. **Push thật** (hiện chỉ Web Notification khi tab đang mở nền). Mobile/PC cần service worker + email/Zalo/Discord.
3. **Bảng xếp hạng & Hội thật** — hiện là bot giả lập.
4. **Âm thanh, hiệu ứng, cinematic gacha** — chưa có; đây là phần ảnh hưởng mạnh tới "cảm giác" ngày 1.
5. **Nội dung chương/story, sự kiện theo mùa** — để duy trì sau ngày 14.
6. **Cân bằng dài hạn** (ngày 30+) — mô phỏng mới kiểm tới ngày 14; prestige trong sim bị lạm dụng hơn người thật.
7. Cần playtest thật trước khi tin vào bất kỳ con số RR nào.

## 7. Asset & giấy phép

* **Tiny Swords** — Pixel Frog (itch.io): công trình, dân làng, cừu, cây, đá vàng, icon. Dùng thương mại được, không được phát tán lại bộ asset.
* **32rogues** — Seth Boyles (itch.io): anh hùng, vật phẩm. Dùng thương mại được (trừ dự án NFT/blockchain), **không dùng cho dự án AI sinh tạo/ML**, không phát tán lại. Xem `assets/rg/LICENSE.txt`.
* Bản gốc tải về nằm ở `assets_itch/` (ngoài thư mục `game/`). Khi xuất bản, chỉ phát hành các file cần dùng trong `game/assets/` và ghi công tác giả.

## 8. Đấu Thẻ (card battle) — gacha có chỗ dùng

* **Thẻ:** anh hùng nhận từ gacha = *quân* (công/máu/cost theo độ hiếm × sao × cấp, kỹ năng theo nghề); trang bị nhận từ rương = *bùa phép* (sát thương / +máu / hồi căn cứ + rút bài / +công).
* **Luật:** căn cứ 30 máu, 4 lane, mana +1/lượt (tối đa 8), rút 1 lá/lượt, bộ bài tối đa 12. Hết lượt, quân tự đánh lane đối diện (trống → đánh căn cứ), hai bên cùng chịu sát thương. Có Auto-battle (AI chơi giúp), tốc độ x1/x2/x4 và "Tự đánh" cho màn đã qua.
* **Chiến dịch:** 30 màn / 3 chương, boss mỗi 5 màn. Tốn **Lệnh Bài** (10, hồi 1 mỗi 8 phút kể cả offline) → thêm một lý do quay lại.
* **Thưởng:** vàng, thưởng lần đầu (ngọc, vé chiêu mộ), 40–80% rơi *mảnh thẻ* của anh hùng trong bộ bài (lên sao). Nhiệm vụ ngày, Hành trình, thành tựu có mục tiêu Đấu Thẻ.
* **Cân bằng (mô phỏng `tools/sim.js`, thắng ≥50%):** người chơi 4 phiên/ngày qua ~màn 8 (ngày 1), ~14–16 (ngày 3), ~17–19 (ngày 7–14). Màn 20–30 cần lên sao/cấp lâu dài. AI địch & AI của người chơi trong sim là một; người thật chơi tay sẽ tốt hơn AI.
* **Chưa làm:** PvP thật, hiệu ứng kỹ năng riêng cho từng thẻ, thẻ phép ngoài trang bị, combo theo nghề, âm thanh.
