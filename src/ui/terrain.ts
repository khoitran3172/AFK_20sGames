// Dựng địa hình bằng tileset Tiny Swords (autotile theo 4 hướng) + bọt sóng động + vách đá.
import Phaser from 'phaser';

export const TILE = 64;
let inited = false;

export function initTerrain(scene: Phaser.Scene) {
  if (inited) return;
  inited = true;
  for (let k = 1; k <= 5; k++) {
    const tex = scene.textures.get('tilemap' + k);
    for (let r = 0; r < 6; r++) for (let c = 0; c < 9; c++) tex.add(`g${c}_${r}`, 0, c * TILE, r * TILE, TILE, TILE);
  }
  const foam = scene.textures.get('foam');
  for (let i = 0; i < 16; i++) foam.add('f' + i, 0, i * 192, 0, 192, 192);
}

export type Mask = boolean[][];

export function makeMask(cols: number, rows: number): Mask {
  return Array.from({ length: rows }, () => Array<boolean>(cols).fill(false));
}

function colRow(m: Mask, r: number, c: number) {
  const g = (rr: number, cc: number) => (rr >= 0 && rr < m.length && cc >= 0 && cc < m[0].length && m[rr][cc]);
  const L = g(r, c - 1), R = g(r, c + 1), U = g(r - 1, c), D = g(r + 1, c);
  const col = !L && R ? 0 : L && R ? 1 : L && !R ? 2 : 3;
  const row = !U && D ? 0 : U && D ? 1 : U && !D ? 2 : 3;
  return { col, row, edge: !(L && R && U && D), downEdge: !D, L, R };
}

export interface Island { foam: Phaser.GameObjects.Image[]; objs: Phaser.GameObjects.GameObject[] }

/** elevated=true: mặt phẳng cao có vách đá phía dưới; false: đất phẳng. */
export function paintIsland(scene: Phaser.Scene, key: string, m: Mask, x0: number, y0: number, elevated: boolean, depth = 0): Island {
  const foam: Phaser.GameObjects.Image[] = [];
  const objs: Phaser.GameObjects.GameObject[] = [];
  const off = elevated ? 5 : 0;
  const R = m.length, C = m[0].length;
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    if (!m[r][c]) continue;
    const { col, row, edge, downEdge } = colRow(m, r, c);
    const px = x0 + c * TILE, py = y0 + r * TILE;
    if (edge) {
      const f = scene.add.image(px + TILE / 2, py + TILE / 2 + (elevated ? 14 : 0), 'foam', 'f0').setDepth(depth + 0.1).setAlpha(0.95);
      foam.push(f); objs.push(f);
    }
    if (elevated && downEdge) {
      for (let k = 1; k <= 2; k++) {
        const cf = col === 3 ? 3 : col;
        const im = scene.add.image(px, py + TILE * k - 4, key, `g${off + (cf === 3 ? 3 : cf)}_${3 + k}`).setOrigin(0, 0).setDepth(depth + 0.2);
        objs.push(im);
      }
    }
    const im = scene.add.image(px, py, key, `g${off + col}_${row}`).setOrigin(0, 0).setDepth(depth + 0.3);
    objs.push(im);
  }
  // hoạt ảnh bọt sóng dùng chung
  let i = 0;
  const ev = scene.time.addEvent({ delay: 90, loop: true, callback: () => { i = (i + 1) % 16; for (const f of foam) f.setFrame('f' + i); } });
  scene.events.once('shutdown', () => ev.remove());
  return { foam, objs };
}

/** Lấp kín vùng bằng đất (không có viền) — dùng cho sàn đấu. */
export function fillGrass(scene: Phaser.Scene, key: string, x: number, y: number, w: number, h: number, depth = 0) {
  const cols = Math.ceil(w / TILE), rows = Math.ceil(h / TILE);
  const rt = scene.add.renderTexture(x, y, cols * TILE, rows * TILE).setOrigin(0, 0).setDepth(depth);
  const stamp = scene.add.image(0, 0, key, 'g1_1').setOrigin(0, 0).setVisible(false);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) rt.draw(stamp, c * TILE, r * TILE);
  stamp.destroy();
  return rt;
}

export function waterBg(scene: Phaser.Scene, color: number, depth = -10) {
  const g = scene.add.rectangle(640, 360, 1280, 720, color).setDepth(depth);
  const tile = scene.add.tileSprite(640, 360, 1280, 720, 'waterBg').setDepth(depth + 0.01).setAlpha(0.35);
  return { g, tile };
}
