# Lưu đám mây bằng Google Sheet (Apps Script)

Game chạy hoàn toàn trên trình duyệt, nên "backend" là một **Google Apps Script Web App** ghi vào 1 Google Sheet (mã ở `backend/Code.gs`).

## Định danh người chơi (không dùng IP làm khóa)
- Mỗi thiết bị có **id ngẫu nhiên** (lưu trong `localStorage`) + **Mã khôi phục** dạng `AFK-XXXX-XXXX` hiển thị trong Cài đặt.
- IP **không** thể làm khóa lưu: IP đổi theo mạng/4G, nhiều người dùng chung 1 IP, và Apps Script không thấy IP của client. Game chỉ ghi IP (lấy qua `api.ipify.org`) vào cột `ip` để bạn tham khảo; tắt bằng `cloud.logIp = false` trong `src/config.ts`.
- Trình duyệt nhúng (Facebook/Zalo) hay xóa `localStorage` khi đóng app → người chơi nhập **Mã khôi phục** để lấy lại tiến độ, hoặc dùng máy khác.

## Cài đặt (làm 1 lần, bằng tài khoản Google của bạn)
1. Mở Google Sheet → **Extensions → Apps Script**.
2. Xóa code mẫu, dán toàn bộ nội dung `backend/Code.gs`, bấm **Save**.
3. **Deploy → New deployment → loại "Web app"**:
   - *Execute as*: **Me**
   - *Who has access*: **Anyone**
   - Bấm Deploy, **Authorize** (Google sẽ hỏi quyền truy cập Sheet — chỉ bạn bấm được bước này).
4. Copy **Web app URL** (dạng `https://script.google.com/macros/s/…/exec`).
5. Dán vào `src/config.ts`: `url: 'https://script.google.com/macros/s/…/exec'`, rồi build/deploy lại.
6. Mở game → Cài đặt → thấy "Mã khôi phục"; bấm **Lưu lên ngay**, sheet sẽ có tab `saves` với 1 dòng.

Sửa `Code.gs` sau này: **Deploy → Manage deployments → Edit → Version: New version**.

## Bảo mật — quan trọng
- Web App chạy **dưới quyền của bạn**, người chơi không cần quyền vào Sheet. Vì vậy **hãy đặt Sheet ở chế độ Restricted (riêng tư)**; KHÔNG chia sẻ "bất kỳ ai có link đều sửa được", nếu không ai cũng đọc/sửa/xóa được save của mọi người chơi.
- id thiết bị là bí mật (ai có id mới ghi được hồ sơ đó); mã khôi phục cho phép đọc (không cho ghi) hồ sơ.
- Save có chữ ký phía game; bản bị sửa trên sheet sẽ bị từ chối khi khôi phục. Đây chỉ là rào cản, không thay được kiểm tra phía máy chủ.
- Chống ghi đè lùi: server từ chối bản có `playMs` thấp hơn bản đã lưu hơn 2 phút (trừ khi "Lưu lên ngay" có `force`).
- Giới hạn: ~180.000 ký tự/hồ sơ (4 ô x 45.000), Apps Script ~20.000 lượt gọi/ngày (tài khoản thường). Game đẩy mỗi 90 giây khi có thay đổi và khi ẩn tab; nếu đông người chơi cần backend thật (Firebase/Supabase).

## Kiểm thử
`npx tsx tools/cloud-test.ts` chạy luồng lưu → khôi phục bằng mã → chặn dữ liệu bị sửa với một server giả cùng giao thức.
