# ROADMAP — Biên Niên Thủ Lĩnh

Quy ước: **S** = vài giờ · **M** = 1–2 buổi · **L** = nhiều buổi. Mỗi mục đã chọn kèm thiết kế sơ bộ, sẽ đào sâu từng cái trước khi build.
Mọi chuỗi mới thêm cả VI (giọng miền Nam) và EN trong `src/i18n.ts`. Sau khi đổi kinh tế: `npm run audit` + `tools/sim.ts`. Sau khi đổi engine: `tools/stress.ts` + `tools/special-test.ts`.

## A. Đã CHỌN (13 mục)

| # | Mục | Cỡ | Nhóm |
|---|---|---|---|
| 3 | Boss có cơ chế riêng | L | Chiến đấu |
| 5 | Chiêu cuối của từng binh chủng | M | Chiến đấu |
| 7 | Cây kỹ năng tầng 8–10 ("Thần thoại") | M | Tiến trình |
| 8 | Mở rộng map 5–8 | L | Tiến trình |
| 9 | Chế độ Hard cho Arena đã qua | M | Tiến trình |
| 10 | Mục tiêu ngày/tuần động | S | Tiến trình |
| 11 | Thú cưng / Linh thú | L | Quân & đồ |
| 12 | Bộ trang bị (set bonus) + thuộc tính phụ | M | Quân & đồ |
| 13 | Ô quân thứ 4 + synergy 4 loại | M | Quân & đồ |
| 15 | Làng có tương tác (sự kiện chọn lựa, công trình mới) | M | Làng |
| 16 | Nhiệm vụ làng và NPC | M | Làng |
| 18 | Hiệu ứng và "game feel" | S–M | Hoàn thiện |
| 19 | Sổ tay / Bestiary / sưu tầm | S | Hoàn thiện |
| 24 | Tháp phụ "Tháp Hỗn Loạn" + mốc thưởng theo mùa | M | Chế độ chơi |
| 25 | Phòng thủ làng (mini tower-defense) | L | Chế độ chơi |
| 27 | Khiêu chiến "Lời nguyền" (modifier tự chọn) | M | Chế độ chơi |
| 28 | Cửa hàng xoay vòng theo ngày | M | Kinh tế |
| 29 | Lò rèn nâng cao (chế tạo đồ chỉ định) | M | Kinh tế |
| — | Mobile web responsive + chạy trong trình duyệt nhúng Facebook | M | Nền tảng |

Không chọn (để lại backlog): 1 kỹ năng bấm tay, 2 affix Arena, 4 hệ nguyên tố, 6 chuyển sinh, 14 tướng phụ, 17 âm thanh, 20 bảng xếp hạng/cloud.

### Thiết kế sơ bộ

**3. Boss có cơ chế riêng (L)** — mỗi map 1 "họ boss" x 12 boss; mỗi boss 1–2 cơ chế: triệu hồi lính (map1), khiên theo pha cần phá (map2), vùng nổ báo trước trên sàn (map3), hút máu/đổi hàng (map4). Cần: dữ liệu `BOSS_KIT` theo map, telegraph vùng nguy hiểm (hiển thị), thông báo pha. Gợi ý số: pha tại 70/40/15% HP. `recPower` boss tính lại sau khi cân (sim phải mô phỏng cơ chế).

**5. Chiêu cuối binh chủng (M)** — thanh Nộ chung của đội (đầy theo sát thương gây/nhận); khi đầy tự động xả hoặc bấm tay (tùy bật). Mỗi binh chủng 1 chiêu: Knight dựng tường 4s, Archer mưa tên diện rộng, Wizard thiên thạch, Healer hồi toàn đội %, Rogue chém nhiều mục tiêu, Paladin bất tử 3s, Huntress xuyên cả hàng, Summoner gọi 6 linh hồn, Pike đâm quét. Chọn chiêu theo quân đang trong đội (3 chiêu). Liên quan 5 ↔ 13 (ô thứ 4 thêm chiêu thứ 4).

**7. Cây kỹ năng tầng 8–10 (M)** — 3 nhánh x ~6 node "Thần thoại", mở sau khi vượt Map 3 (hoặc Arena 36). Node mang cơ chế mới (không chỉ %): ví dụ A: quân hồi sinh thành tinh nhuệ; B: Thần Thể tự kích hoạt đầu mỗi wave; C: hòm AFK theo giờ thật tới 48h. Cần mở rộng `skillLayout` (hiện 7 tầng, vừa khít màn) → thêm kéo cuộn dọc cho SkillScene.

**8. Map 5–8 (L)** — 4 map mới x 12 Arena (=96 Arena), hệ số tăng tiếp x5. Cần: tileset/quái mới (ưu tiên tái dùng Tiny Swords + LuizMelo, tinted), 4 `MapDef`, nhạc/âm (liên hệ #17 backlog), cập nhật minimap (`buildMini` đang cứng 4 map) và `TOTAL_ARENAS`, số hiển thị (đã dùng ký hiệu khoa học từ 1e15). Cân lại bằng sim vì số lên cực lớn (5^95).

**9. Chế độ Hard (M)** — nút chuyển độ khó ở Arena đã qua: x3 chỉ số quái, rớt Huy Hiệu x2 + cơ hội trang bị Sử Thi; làng không đổi. Mở khóa theo tiến độ (Arena X cleared). Cần: cờ `hard` trong `farm`, hệ số `HARD_MUL`, giao diện chọn trong bong bóng Arena. Liên quan #3 (boss Hard thêm 1 cơ chế).

**10. Mục tiêu ngày/tuần động (S)** — nhiệm vụ sinh theo trạng thái (không giao việc đã xong), chuỗi tuần 7 ngày, thưởng lớn khi hoàn thành 5/7. Cần mở rộng `core/progress.ts` (pool nhiệm vụ có điều kiện `eligible(S)`). Bám economy audit (không cho farm lặp).

**11. Thú cưng / Linh thú (L)** — 1 thú đi cùng MC: có buff chủ động nhẹ + buff bị động, nuôi bằng nguyên liệu rơi từ Tháp (mốc tầng). Cần: dữ liệu thú (5–8 loài, 3 bậc), sprite (dùng tạm sprite quái/Tiny Swords), UI nuôi trong ArmyScene hoặc tab mới, lưu vào `Save` (migration `v3`). Rủi ro: asset thú → hỏi trước khi tải.

**12. Bộ trang bị + thuộc tính phụ (M)** — items.ts thêm `set` (6 bộ x 6 ô) + 2/4/6 món bonus; đồ Hiếm trở lên có 1–2 dòng phụ ngẫu nhiên (chí mạng, hút máu, +Vàng). Cần: tính bonus trong `equipBonus`, hiển thị gọn trong ItemsScene (đã chật), ghép/rã/cường hóa giữ nguyên. Đừng quên kiểm tra `tools/items-test.ts`.

**13. Ô quân thứ 4 (M)** — mở bằng node cây kỹ năng (đề xuất node mới tầng 8) hoặc mốc Arena. `Save.squad` từ 3 → tối đa 4; `activeSynergy` hỗ trợ synergy 4 loại (thêm ~5 synergy "lớn" cộng dồn). Cần: ArmyScene hiển thị 4 ô, `battle.ts` spawn, lane layout (hiện tối ưu cho 3), sim lại. Liên quan #5 (chiêu thứ 4).

**15. Làng có tương tác (M)** — sự kiện làng có lựa chọn (đánh, cống nạp, thương lượng) với kết quả có rủi ro; thêm 2 công trình mới: Chợ (đổi tài nguyên), Pháp đàn (buff tạm). `core/events.ts` + `village.ts`; kiểm audit chống lặp.

**16. Nhiệm vụ làng + NPC (M)** — mỗi làng có 1 NPC (sprite Pawn Tiny Swords tái dùng) giao nhiệm vụ ngắn: "diệt 30 quái elite", "nâng Lò Rèn lv 5"… thưởng trang bị/kỹ năng độc nhất. Cần: `core/quests-village`, hiển thị dấu "!" trên làng, lưu tiến độ theo Arena.

**18. Game feel (S–M)** — rung màn theo cường độ, số sát thương có hiệu ứng (chí mạng phóng to, màu theo nguyên tố), hiệu ứng mở node/Arena (giga FX đã có), Boss xuất hiện có animation + thanh máu riêng, hit-stop ngắn. Gần như thuần Phaser/UI, ít rủi ro.

**19. Sổ tay / Bestiary (S)** — màn mới: quái đã gặp (theo map, chỉ số), binh chủng + synergy đã khám phá, trang bị đã có; mỗi trang hoàn thành nhận thưởng (Huy Hiệu/Đá). Cần: `Save.dex` đếm quái giết/đã thấy; UI danh sách; thành tựu nối vào `core/progress.ts`.

**24. Tháp Hỗn Loạn (M)** — tháp thứ hai dùng chung engine `mode:'tower'` nhưng mỗi tầng có modifier ngẫu nhiên (quái nhanh, hồi máu, nổ khi chết…); mùa 2 tuần có bảng mốc thưởng (không cần server: mốc theo tầng cá nhân). Thưởng: nguyên liệu cho #11/#29. Dùng lại `towerMul`; bảo đảm audit chống lặp.

**25. Phòng thủ làng (L)** — sự kiện "địch tấn công" hiện chỉ là raid; nâng thành mini tower-defense: đặt/nâng tháp cung, tường trong làng, địch đi theo đường, thất bại mất 1 phần Vàng làng. Cần màn mới (`DefenseScene`) tái dùng sprite Tiny Swords; kết nối `core/events.ts`. Liên quan #15.

**27. Lời nguyền (M)** — trước khi vào Boss/Hard/Tháp, chọn 0–3 modifier (quái +50% máu, không hồi sinh quân, MC không hồi máu…) mỗi cái cộng % thưởng; công thức thưởng nhân đơn giản và có trần. Nên làm sau #9 (Hard) để dùng chung UI chọn. Cần `modifiers` truyền vào `BattleOpts`.

**28. Cửa hàng xoay vòng (M)** — 6 vật phẩm/ngày (seed theo ngày máy chủ): đồ có sẵn bộ (#12), nguyên liệu, vé Tháp; mua bằng Huy Hiệu/Đá. Cần: `core/shop.ts`, tab trong WorldScene, chống làm mới bằng đổi giờ (đã có `clock.ts`). Audit: tổng giá trị mua/ngày có trần.

**29. Lò rèn nâng cao (M)** — chế tạo trang bị chỉ định ô + bộ (#12) từ nguyên liệu (rơi từ Tháp/Hard/Boss) thay vì chỉ rơi ngẫu nhiên; công thức nâng bậc, có "bảo hiểm" bằng Đá. Mở rộng `ItemsScene` ("Rèn đồ" đã có, hiện là ghép 3→1).

**Mobile web + trình duyệt nhúng Facebook (M)** — đã làm bước 1 (xem mục D). Bước sau: sàn cỡ chữ trên điện thoại, nút to hơn, PWA, tối ưu hiệu năng.

### Thứ tự build đề xuất
1. **18** (game feel) + **19** (sổ tay) — nhanh, tăng cảm giác sống động, chạy song song được.
2. **10** (mục tiêu động) — nhẹ, giữ người chơi quay lại.
3. **12** (bộ trang bị) → **13** (ô quân thứ 4) — nền cho #5 và #7.
4. **5** (chiêu cuối) → **3** (boss có cơ chế) — chiều sâu trận đánh.
5. **9** (Hard) → **7** (cây tầng 8–10) — nội dung cuối game.
6. **15** → **16** (làng) — mở rộng đời sống làng.
7. **11** (thú cưng) — khi có asset phù hợp.
8. **8** (map 5–8) — mốc lớn cuối, khi nội dung bên trên đã đầy đủ.

## D. Nền tảng — Mobile & trình duyệt nhúng (đã làm bước 1)
- `index.html`: viewport-fit=cover, khung `position:fixed` + `100dvh`, chặn cuộn/kéo-tải-lại, overlay "Xoay ngang điện thoại" khi cầm dọc.
- `main.ts`: `scale.refresh()` khi resize/orientationchange/visualViewport (webview Facebook đổi thanh công cụ liên tục).
- `vite.config.ts`: build target es2019/safari13 cho WebView cũ.
- Còn thiếu: cỡ chữ nhỏ (13–15px logic → ~7px trên điện thoại); cần pass "sàn cỡ chữ/nút to" cho từng scene; PWA/manifest; localStorage có thể bị xóa khi webview Facebook đóng → làm #38 (xuất/nhập mã save) sớm.

## B. Backlog cũ (chưa chọn)
1 Kỹ năng bấm tay · 2 Affix Arena · 4 Hệ nguyên tố · 6 Chuyển sinh · 14 Tướng phụ · 17 Âm thanh · 20 Bảng xếp hạng + cloud.

## C. Đề xuất mới (21–40) — chờ chọn
Chưa cam kết; khi chọn sẽ chuyển lên mục A.

**Nội dung & chế độ chơi**
21. Sự kiện giới hạn thời gian (lễ hội, Boss thế giới theo tuần) — M
22. Đấu trường theo mùa (Colosseum) với luật đặc biệt mỗi mùa — M
23. Hầm ngục ngẫu nhiên kiểu roguelike: mỗi tầng chọn 1 trong 3 buff — L
26. Cốt truyện 4 chương theo map: lời thoại boss, cutscene tĩnh — M

**Kinh tế & hệ thống**
30. Học viện: nâng cấp quân bằng hàng chờ thời gian thật — M
31. Tự động nâng cấp có ưu tiên cấu hình (mở bằng kỹ năng) — S
32. Kế hoạch AFK: chọn ưu tiên tài nguyên, báo cáo offline chi tiết — S

**Cá nhân hóa & thu thập**
33. Skin Thủ Lĩnh/quân (mở bằng thành tựu) + khung/danh hiệu — M
34. Khám phá bản đồ: rương ẩn, điểm bí mật trên map — S
35. Thành tựu ẩn và huy hiệu nâng cao — S

**Chất lượng & tiện ích**
36. Thống kê/biểu đồ: thu nhập/giờ, nhật ký trận, DPS — S
37. Mobile/PWA: UI cảm ứng, rung, chế độ tiết kiệm pin, cài app — M
38. Xuất/nhập mã save (backup không cần server) — S
39. Thêm ngôn ngữ (Trung, Thái, Indonesia…) + tùy chọn font — M
40. Chế độ trợ năng: chữ lớn, màu cho người mù màu, giảm hiệu ứng nhấp nháy — S
