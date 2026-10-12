# Kinh tế game — nguồn thu, chỗ tiêu, chống farm vô hạn

## Nhịp độ (hệ số Arena ×5)
* Quái Arena sau = **×5** Arena trước (`ARENA_STEP` trong `src/data/arenas.ts`), Arena 48 ≈ 5^47 ≈ 7×10^32 lần Arena 1. Số hiển thị: dưới 1e15 dùng K/M/B/T, từ 1e15 dùng ký hiệu khoa học (`fmt` trong state.ts).
* Để theo kịp ×5 mỗi Arena, mỗi cấp chỉ số Thủ Lĩnh = ×1.30 (`LV_GROWTH`) và giá cấp ×1.32 (`STAT_COST_GROWTH`) → ~6 cấp/chỉ số/Arena, giá mỗi Arena ≈ ×5.3 so với thu nhập ×5 nên thời gian mỗi Arena tăng chầm chậm.
* Mô phỏng (`npm run sim`, người chơi tối ưu chi xen kẽ làng/chỉ số): Arena 1 gần như ngay, **Arena 2 ≈ 2 giờ**, Arena 3–10 ≈ 60–85 phút/Arena, tăng dần tới **~14 giờ/Arena ở Arena 48**; **tổng ≈ 180 giờ chơi tích cực**. Mọi Arena đều vượt được bằng nâng cấp (lực chiến cuối ≈ 1.5× khuyến nghị), chưa tính trang bị/cường hóa nên còn dư địa.

## Tiền tệ
| Tiền | Nguồn | Chỗ tiêu | Cách giữ cân bằng |
|---|---|---|---|
| **Vàng** | làng (Trang Trại/Xưởng Gỗ, ∝ hệ số Arena), quái rớt (30%), Boss, Hòm AFK, nhiệm vụ… | chỉ số Thủ Lĩnh, công trình làng, tiến hóa quân (phần Vàng), cây nâng quân, cường hóa trang bị, thương nhân | giá chỉ số mũ ×1.32/cấp; giá làng ∝ hệ số Arena ×1.24/cấp |
| **Đá Tinh Thạch** | Mỏ Tinh Thạch (∝ hệ số Arena), quái, Boss, rã đồ | **cây kỹ năng** (giá node ∝ hệ số Arena tiền tuyến, ×1.12/node) và **cường hóa trang bị** (giá ∝ hệ số Arena, ×1.5/cấp) — sink không bao giờ cạn | giá luôn gắn Arena tiền tuyến nên không "miễn phí về sau" |
| **Huy Hiệu** | Boss (một lần/Arena), Tháp (boss mỗi 10 tầng), giữ làng (+4), Lò Rèn (cố định, **không nhân hệ số Arena**, ≤ ~90/giờ khi mở hết 41 làng cấp 10), nhiệm vụ/đăng nhập (ít) | **chỉ** tiến hóa quân (30/160) và cây nâng quân (20/50/110/220) × 9 binh chủng ≈ 5.3k | nguồn cố định + giá cố định → luôn là tiền hiếm. Bấm vào ô tiền trên HUD để xem công dụng |

Mọi phần thưởng "theo phút thu nhập" (nhiệm vụ, đăng nhập, thành tựu, giữ làng, Tháp) = `reward()` trong `progress.ts`: số phút × thu nhập đo được, có sàn theo Arena.

## Các lỗ hổng đã vá (kiểm bằng `npm run audit` — thoát mã 1 nếu vi phạm)
1. **Đổi giờ hệ thống để lãnh Hòm AFK / nhiệm vụ / quà ngày / lượt Tháp nhiều lần** → dùng giờ máy chủ (header `Date` của trang) + `performance.now()` (`core/clock.ts`); không có giờ tin cậy thì offline tối đa 15 phút; ngày không bao giờ lùi (`clockMax`).
2. **Sửa dữ liệu lưu thô** → chữ ký lưu trữ; sai chữ ký thì reset và giữ bản sao `*_bad` (chỉ là rào cản, không thay được máy chủ; `?debug` bỏ qua).
3. Huy Hiệu nhân theo hệ số Arena trong khi giá cố định → vô hạn về sau. Đã tách: Lò Rèn không nhân hệ số Arena.
4. Đá hết chỗ tiêu sau khi mở 46 node → cường hóa trang bị + giá node tăng theo Arena.
5. Nhận Hòm AFK rỗng vẫn tính nhiệm vụ/thành tựu → chặn.
6. Thương nhân: mua Đá rẻ hơn tự sản xuất / bùa +50% có lời rõ → đã nâng giá (Đá ×1.2 so với tự sản xuất, bùa lời tối đa ~1 phút thu nhập).
7. Thưởng giữ làng/Tháp quá tay → giảm (giữ làng 8 phút thu nhập; Tháp 30 tầng ≈ 27 phút).
8. Ghép/rã đồ không có lời (rã 2^r, ghép 3→1); đồ đã cường hóa không rã/không bị ghép mất (không hoàn vốn).
9. Mỗi thưởng chỉ nhận 1 lần: nhiệm vụ ngày, thưởng 5/5, đăng nhập/ngày, thành tựu 3 bậc, món thương nhân, Boss (chỉ đánh được Arena tiền tuyến), Tháp 3 lượt/ngày.
Giới hạn còn lại: save nằm ở trình duyệt nên người chơi quyết tâm vẫn sửa được. Muốn chặt hẳn cần máy chủ lưu trạng thái.
