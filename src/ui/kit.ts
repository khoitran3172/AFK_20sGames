// Bộ UI nhỏ dựng từ Tiny Swords UI (9-slice tự cắt theo vùng pixel thật) + font pixel theo ngôn ngữ.
import Phaser from 'phaser';
import { fontFamily, fs } from '../i18n';

interface Nine { cw: number[]; ch: number[]; cells: { f: string; w: number; h: number; ox: number; oy: number }[][] }
const NINES: Record<string, Nine> = {};

/** Cắt 9 ô (lưới 5x5 với 3 ô thật ở hàng/cột 0,2,4) theo bbox pixel đục. */
export function buildNines(scene: Phaser.Scene) {
  for (const key of ['bPaper', 'bPaperSp', 'btnBlue', 'btnBluePr', 'btnRed', 'btnRedPr']) {
    const tex = scene.textures.get(key);
    const img = tex.getSourceImage() as HTMLImageElement;
    const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
    const cx = cv.getContext('2d')!; cx.drawImage(img, 0, 0);
    const cells: Nine['cells'] = [[], [], []];
    const cw = [0, 0, 0], ch = [0, 0, 0];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const x0 = c * 128, y0 = r * 128;
      const d = cx.getImageData(x0, y0, 64, 64).data;
      let minx = 64, miny = 64, maxx = -1, maxy = -1;
      for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) if (d[(y * 64 + x) * 4 + 3] > 20) { if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y; }
      if (maxx < 0) { minx = 0; miny = 0; maxx = 63; maxy = 63; }
      const w = maxx - minx + 1, h = maxy - miny + 1, f = `n${r}${c}`;
      tex.add(f, 0, x0 + minx, y0 + miny, w, h);
      cells[r][c] = { f, w, h, ox: minx, oy: miny };
      cw[c] = Math.max(cw[c], w); ch[r] = Math.max(ch[r], h);
    }
    NINES[key] = { cw, ch, cells };
  }
}

export function nine(scene: Phaser.Scene, key: string, x: number, y: number, w: number, h: number, s = 0.5): Phaser.GameObjects.Container {
  const n = NINES[key];
  const c = scene.add.container(x, y);
  const L = n.cw[0] * s, R = n.cw[2] * s, T = n.ch[0] * s, B = n.ch[2] * s;
  const midW = Math.max(2, w - L - R), midH = Math.max(2, h - T - B);
  const xs = [0, L, L + midW], ws = [L, midW, R];
  const ys = [0, T, T + midH], hs = [T, midH, B];
  for (let r = 0; r < 3; r++) for (let cI = 0; cI < 3; cI++) {
    const im = scene.add.image(xs[cI], ys[r], key, n.cells[r][cI].f).setOrigin(0, 0).setDisplaySize(ws[cI] + 0.5, hs[r] + 0.5);
    c.add(im);
  }
  c.setSize(w, h);
  return c;
}

export interface TxtOpts { color?: string; stroke?: string; sw?: number; origin?: [number, number]; align?: string; wrap?: number; bold?: boolean; ls?: number }
export function T(scene: Phaser.Scene, x: number, y: number, s: string, size = 22, o: TxtOpts = {}): Phaser.GameObjects.Text {
  const tx = scene.add.text(x, y, s, {
    fontFamily: fontFamily(), fontSize: fs(size), color: o.color ?? '#fff6dd',
    stroke: o.stroke ?? '#1b1208', strokeThickness: o.sw ?? Math.max(2, Math.round(size / 7)),
    align: o.align ?? 'left', wordWrap: o.wrap ? { width: o.wrap } : undefined, lineSpacing: o.ls ?? 0,
  });
  const org = o.origin ?? [0, 0];
  tx.setOrigin(org[0], org[1]);
  return tx;
}

/** Panel giấy kem (nội dung tối màu) */
export function panel(scene: Phaser.Scene, x: number, y: number, w: number, h: number, special = false, s = 0.5) {
  return nine(scene, special ? 'bPaperSp' : 'bPaper', x, y, w, h, s);
}

export interface Btn { c: Phaser.GameObjects.Container; setText(s: string): void; setEnabled(v: boolean): void; label: Phaser.GameObjects.Text }
export function button(scene: Phaser.Scene, x: number, y: number, w: number, h: number, label: string, onClick: () => void, red = false, size = 24): Btn {
  const c = scene.add.container(x, y);
  const up = nine(scene, red ? 'btnRed' : 'btnBlue', -w / 2, -h / 2, w, h, 0.5);
  const dn = nine(scene, red ? 'btnRedPr' : 'btnBluePr', -w / 2, -h / 2 + 3, w, h - 3, 0.5).setVisible(false);
  const tx = T(scene, 0, -2, label, size, { origin: [0.5, 0.5], align: 'center' });
  c.add([up, dn, tx]);
  c.setSize(w, h);
  c.setInteractive({ useHandCursor: true });
  let enabled = true;
  const setEn = (v: boolean) => { enabled = v; c.setAlpha(v ? 1 : 0.55); };
  c.on('pointerdown', () => { if (!enabled) return; up.setVisible(false); dn.setVisible(true); tx.y = 1; });
  const rel = () => { up.setVisible(true); dn.setVisible(false); tx.y = -2; };
  c.on('pointerup', () => { rel(); if (enabled) onClick(); });
  c.on('pointerout', rel);
  return { c, setText: (s) => tx.setText(s), setEnabled: setEn, label: tx };
}

export function iconButton(scene: Phaser.Scene, x: number, y: number, icon: string, onClick: () => void, red = false, size = 70): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const bg = scene.add.image(0, 0, red ? 'roundRed' : 'roundBlue').setDisplaySize(size, size);
  const ic = scene.add.image(0, -2, icon).setDisplaySize(size * 0.55, size * 0.55);
  c.add([bg, ic]);
  c.setSize(size, size).setInteractive({ useHandCursor: true });
  c.on('pointerdown', () => c.setScale(0.92));
  c.on('pointerup', () => { c.setScale(1); onClick(); });
  c.on('pointerout', () => c.setScale(1));
  return c;
}

/** Thanh tiến độ (SmallBar) có thể đổi màu fill bằng tint */
export function barGfx(scene: Phaser.Scene) { return scene.add.graphics(); }
export function drawBar(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, v: number, color: number, bg = 0x1b1208) {
  g.fillStyle(0x000000, 0.55).fillRoundedRect(x - 2, y - 2, w + 4, h + 4, 3);
  g.fillStyle(bg, 1).fillRect(x, y, w, h);
  g.fillStyle(color, 1).fillRect(x, y, Math.max(0, Math.min(1, v)) * w, h);
  g.fillStyle(0xffffff, 0.22).fillRect(x, y, Math.max(0, Math.min(1, v)) * w, Math.max(1, h * 0.35));
}

/** Chip tài nguyên: nền tối + icon + số. */
export function chip(scene: Phaser.Scene, x: number, y: number, w: number, icon: string, tint?: number) {
  const c = scene.add.container(x, y);
  const bg = scene.add.graphics();
  bg.fillStyle(0x1b1a14, 0.82).fillRoundedRect(0, 0, w, 40, 10).lineStyle(2, 0xe8d49a, 0.9).strokeRoundedRect(0, 0, w, 40, 10);
  const ic = scene.add.image(22, 20, icon).setDisplaySize(36, 36);
  if (tint != null) ic.setTint(tint);
  const tx = T(scene, 46, 20, '0', 22, { origin: [0, 0.5] });
  c.add([bg, ic, tx]);
  return { c, set: (s: string) => tx.setText(s), icon: ic, text: tx };
}

export function toast(scene: Phaser.Scene, msg: string, color = '#ffffff') {
  const t = T(scene, 640, 150, msg, 26, { color, origin: [0.5, 0.5], align: 'center' }).setDepth(9999);
  scene.tweens.add({ targets: t, y: 110, alpha: 0, duration: 1400, delay: 400, onComplete: () => t.destroy() });
}

export function modalBack(scene: Phaser.Scene, alpha = 0.6): Phaser.GameObjects.Rectangle {
  const r = scene.add.rectangle(640, 360, 1280, 720, 0x000000, alpha).setInteractive();
  return r;
}

/** Tween đếm số */
export function pop(scene: Phaser.Scene, o: Phaser.GameObjects.GameObject) {
  scene.tweens.add({ targets: o, scale: 1.18, yoyo: true, duration: 110 });
}

/** Icon thành tựu (atlas GTORAVERSE) theo tên */
export function achvFrame(scene: Phaser.Scene, name: string): number {
  const names = scene.cache.json.get('achvNames') as string[];
  const i = names.indexOf(name);
  return i < 0 ? 0 : i;
}
export function achvIcon(scene: Phaser.Scene, x: number, y: number, name: string, size = 40) {
  return scene.add.image(x, y, 'achv', achvFrame(scene, name)).setDisplaySize(size, size);
}
export function iconButtonFrame(scene: Phaser.Scene, x: number, y: number, tex: string, frame: number, onClick: () => void, red = false, size = 70): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const bg = scene.add.image(0, 0, red ? 'roundRed' : 'roundBlue').setDisplaySize(size, size);
  const ic = scene.add.image(0, -2, tex, frame).setDisplaySize(size * 0.62, size * 0.62);
  c.add([bg, ic]);
  c.setSize(size, size).setInteractive({ useHandCursor: true });
  c.on('pointerdown', () => c.setScale(0.92));
  c.on('pointerup', () => { c.setScale(1); onClick(); });
  c.on('pointerout', () => c.setScale(1));
  return c;
}
