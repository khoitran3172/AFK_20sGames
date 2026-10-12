# Chronicle of the Chieftain / Biên Niên Thủ Lĩnh

Idle / AFK RPG 2D pixel-art (Phaser 3 + TypeScript + Vite). 1 Thủ Lĩnh (Main Character) + 3 đạo quân, 4 bản đồ × 12 Arena,
cây kỹ năng 46 node. Hai ngôn ngữ: Tiếng Việt (font Baloo 2) và English (font Pixelify Sans).

```bash
npm install
npm run dev          # http://localhost:5173  (thêm ?debug để bật chế độ gỡ lỗi)
npm run build        # build tĩnh vào dist/ (GitHub Pages deploy từ workflow)
npm run sim          # mô phỏng cân bằng tiến trình (tools/sim.ts)
npx tsx tools/stress.ts   # kiểm thử hồi quy 46 kỹ năng × 20 bộ quân
```

Thiết kế chi tiết: [docs/DESIGN.md](docs/DESIGN.md). Bản cũ (idle thương hội + gacha + card battle) nằm ở `legacy/`.

## Asset & giấy phép
* **Tiny Swords (Free Pack)** — Pixel Frog (itch.io): quân lính, công trình, địa hình, UI.
* **Tiny RPG Character Asset Pack (Free Soldier & Orc)** — Zerie (itch.io): Thủ Lĩnh và Orc.
* **Super Pixel Effects Gigapack (bản Free)** — Will Tice / unTied Games: VFX.
* **Anvil's RPG icons** — Ponk (CC BY 4.0): icon trang bị. **Achievement Icon Pack** — GTORAVERSE: icon thành tựu/rương.
* **Evil Wizard 3, Hero Knight, Huntress, Martial Hero 3, Medieval King Pack 2** — LuizMelo (CC0): binh chủng mới và nhân vật sự kiện.
* Fonts: Baloo 2, VT323, Pixelify Sans (SIL OFL, qua @fontsource).
Không phát tán lại bộ asset gốc; không dùng cho huấn luyện AI/NFT.
