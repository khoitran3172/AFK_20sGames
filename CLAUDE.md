# CLAUDE.md — Chronicle of the Chieftain / Biên Niên Thủ Lĩnh

Game AFK/Idle RPG pixel-art 2D: **Phaser 3 + TypeScript + Vite**. Repo: https://github.com/khoitran3172/AFK_20sGames (nhánh `main`, deploy GitHub Pages qua `.github/workflows/deploy.yml`).
Trang chơi: https://khoitran3172.github.io/AFK_20sGames/ · Bản cũ (vanilla JS) nằm ở `legacy/`, không còn deploy.

## Quy ước làm việc với người dùng
- Người dùng nói **tiếng Việt**. Chữ tiếng Việt TRONG GAME viết **giọng miền Nam** (xài, vô, coi, ráng, lẹ, hổng, nè, nha, lãnh, rớt…) — xem `src/i18n.ts` (VI/EN song song, mọi chuỗi mới phải thêm cả hai).
- **Chỉ commit/push khi người dùng bảo** (họ thường nói "commit và push để deploy"). Tải file từ itch.io phải xin phép trước (nêu tên file, nguồn, dung lượng).
- Font: VI dùng VT323 (font pixel duy nhất đủ dấu tiếng Việt), EN dùng Pixelify Sans.

## Chạy / kiểm thử
```bash
npm run dev                      # http://localhost:5173  (thêm ?debug khi test bằng browser pane của Claude: dùng setTimeout thay rAF, lộ window.__game và window.__dbg {Farm,getSave,rollItem})
npx tsc --noEmit                 # type-check
npm run build                    # tsc + vite build -> dist/
npx tsx tools/stress.ts          # hồi quy: 84 tổ hợp quân x 46 kỹ năng, phải in "bad 0"
npx tsx tools/items-test.ts      # logic trang bị
npm run sim                      # mô phỏng cân bằng tiến trình: `npx tsx tools/sim.ts 30 400` (CHƯA tính trang bị/sự kiện/tháp/nhiệm vụ)
npm run audit                    # kiểm tra lỗ hổng kinh tế (farm vô hạn / nhận thưởng lặp) — phải in 'Tất cả kiểm tra kinh tế đều đạt'
```
Trong browser pane: `.claude/launch.json` ở thư mục cha `Desktop\AFK` (server `afk-dev`). Pane throttle rAF => dùng `?debug`. Để xem scene mà không chờ fade: `scene.cameras.main.resetFX()`.
Tránh heredoc Python dài trong Bash (hay bị cắt) — ghi script ra file bằng Write rồi chạy.

## Kiến trúc (src/)
- `core/state.ts` Save (localStorage `afk_save_v2`), mods/mcStats/power, kỹ năng, quân, túi đồ, cây nâng quân. `core/battle.ts` engine trận THUẦN TS (không Phaser; chạy cả trong tools/). Chế độ: `farm|boss|raid|tower`.
- `core/farm.ts` singleton `Farm`: trận farm luôn chạy nền mọi scene, Hòm AFK offline, thu nhập làng, đo tốc độ farm, boss/raid/tháp, kết quả (`Farm.result`).
- `core/village.ts` kinh tế làng (4 công trình x 48 Arena song song). `core/events.ts` thương nhân + địch tấn công (tính theo `playMs`). `core/progress.ts` nhiệm vụ ngày/thành tựu/đăng nhập (`track()`). `core/tower.ts`.
- `data/`: `arenas.ts` (4 map x 12 Arena, hệ số tăng ~1.35→1.55), `skills.ts` (46 node), `troops.ts` (9 binh chủng, synergy, `TROOP_TREE`), `items.ts`, `sprites.ts` (SpriteSet/anim, atlas), `villages.ts` (48 bố cục theo seed).
- `scenes/`: Boot, World, Village, Battle, Skills, Army, Items, Quests, Tower, Settings, Result. `ui/`: kit (nine-slice, button, T text), hud, terrain (autotile).
- Scene được dùng lại => **reset mọi field cache trong `create()`** (lỗi đứng màn hình từng do giữ tham chiếu đối tượng đã huỷ). `update` của scene bọc try/catch.

## Đã làm (trạng thái hiện tại)
Rewrite từ card/gacha -> AFK RPG: 1 Thủ Lĩnh + 3 đạo quân, 4 map x 12 Arena, khiêu chiến Boss mở Arena kế, cây 46 kỹ năng, làng mỗi Arena (nguồn thu AFK chính), Hòm AFK offline, trang bị + rèn đồ, nhiệm vụ/thành tựu/quà đăng nhập, 3 binh chủng mới + cây nâng quân, sự kiện làng, Tháp Vô Tận, 2 ngôn ngữ. Tài liệu thiết kế: `docs/DESIGN.md`.

## Asset (ghi công đã có ở Settings + README)
Tiny Swords (Pixel Frog), Tiny RPG Soldier/Orc (Zerie), Super Pixel Effects Gigapack (unTied), Anvil RPG icons (Ponk, CC BY 4.0), Achievement Icon Pack (GTORAVERSE), LuizMelo (CC0: Evil Wizard 3, Hero Knight, Huntress, Martial Hero 3, Medieval King Pack 2). Gốc tải về ở `Desktop\AFK\assets_download\` (ngoài repo, không commit). Không phát tán lại bộ asset; không dùng cho AI/NFT.

## Kinh tế (đọc docs/ECONOMY.md)
Arena sau mạnh gấp **5×** (ARENA_STEP). Save key `afk_save_v3` (save cũ bị bỏ). Giờ lấy từ máy chủ (`core/clock.ts`), save có chữ ký. Huy Hiệu là tiền hiếm (không nhân theo Arena); Đá có sink vô hạn (cường hóa trang bị). Sau khi đổi bất kỳ hằng số kinh tế nào: chạy `npm run audit` và `tools/sim.ts`.

## Việc còn dở / ý tưởng tiếp
1. Chạy `git status`: có thể còn thay đổi chưa commit (kinh tế x5, chống cheat, cường hóa). Chỉ commit/push khi người dùng bảo.
2. Sim mới: ~180h cho 48 Arena (Arena 2 ≈ 2h là bức tường đầu). Cân nhắc làm mượt đoạn đầu; sim chưa tính trang bị/cường hóa/sự kiện/tháp/nhiệm vụ.
3. Chưa có âm thanh; Wizard (Monk tím)/Rogue (Pawn dao) là sprite tạm; map chưa phong cách tranh vẽ; chưa có server (nhiệm vụ/đăng nhập dựa giờ máy).
4. Ý tưởng chưa làm: Chuyển sinh (Prestige, đã bỏ), kỹ năng bấm tay cho Thủ Lĩnh, affix/cơ chế riêng cho Arena & Boss, thú cưng, bảng xếp hạng (cần server).
