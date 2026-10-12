import Phaser from 'phaser';
import { DECOR_SHEETS, FX_SHEETS, ICON_SHEETS, IMAGES, SPRITE_SETS } from '../data/sprites';
import { initTerrain } from '../ui/terrain';
import { load as loadSave, wasTampered } from '../core/state';
import { Farm } from '../core/farm';
import { fontFamily, fs, t } from '../i18n';
import { W, H } from '../main';
import { buildNines } from '../ui/kit';

/** Gigapack FX — tên engine -> tên sheet Gigapack */
export const GIGA: Record<string, { n: string; s: number }> = {
  fxExplosion: { n: 'boom3', s: 1.1 },
  fxExplosion2: { n: 'boom1', s: 1.3 },
  fxDust: { n: 'smoke', s: 1.2 },
  fxFire: { n: 'hit_y', s: 1.1 },
  fxHeal: { n: 'heal', s: 1 },
  fxSplash: { n: 'ring_b', s: 1.2 },
};
export const GIGA_NAMES = ['boom1', 'boom2', 'boom3', 'boom4', 'hit_w', 'hit_y', 'hit_v', 'zap1', 'zap2', 'zap3', 'heal', 'strike', 'burst_y', 'slash',
  'ring_b', 'ring_y', 'ring_y2', 'ring_big', 'absorb', 'smoke', 'splat', 'atkup', 'defup', 'light', 'coins', 'sparkle_y', 'sparkle_g', 'sparkle_b',
  'death', 'skull', 'alert', 'level_up', 'you_won', 'you_lost', 'crown', 'firework', 'hearts', 'success', 'failure', 'warning'];

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    const bar = this.add.rectangle(W / 2 - 200, H / 2, 4, 14, 0xf3d36b).setOrigin(0, 0.5);
    this.add.rectangle(W / 2, H / 2, 404, 18).setStrokeStyle(2, 0xffffff);
    this.load.on('progress', (v: number) => (bar.width = 400 * v));

    for (const [k, p] of Object.entries(IMAGES)) this.load.image(k, p);
    for (const set of SPRITE_SETS) for (const [an, d] of Object.entries(set.anims)) {
      this.load.spritesheet(`${set.id}:${an}`, d.file, { frameWidth: d.fw, frameHeight: d.fh });
    }
    for (const [k, d] of Object.entries(FX_SHEETS)) this.load.spritesheet(k, d.file, { frameWidth: d.fw, frameHeight: d.fh });
    for (const [k, d] of Object.entries(DECOR_SHEETS)) this.load.spritesheet(k + 'S', d.file, { frameWidth: d.fw, frameHeight: d.fh });
    for (const [k, d] of Object.entries(ICON_SHEETS)) this.load.spritesheet(k, d.file, { frameWidth: d.fw, frameHeight: d.fh });
    this.load.json('achvNames', 'assets/items/achv.json');
    this.load.json('gigafx', 'assets/fx/fx.json');
    for (const n of GIGA_NAMES) this.load.image('giga_' + n, `assets/fx/${n}.png`);
  }

  async create() {
    loadSave();
    // đợi font
    try {
      await Promise.all([
        document.fonts.load('600 20px "Baloo 2"', 'Aăâêôơưđ ạảãấầẩẫậắằẳẵặẹẻẽếềểễệịỉĩọỏõốồổỗộớờởỡợụủũứừửữựỳỵỷỹ'),
        document.fonts.load('20px "VT323"', 'Aăâêôơưđ ạảãấầẩẫậắằẳẵặẹẻẽếềểễệịỉĩọỏõốồổỗộớờởỡợụủũứừửữựỳỵỷỹ'),
        document.fonts.load('20px "Pixelify Sans"', 'Abc123'),
      ]);
    } catch { /* tiếp tục với font fallback */ }

    // icon Đá Tinh Thạch: ảnh gốc 128px chỉ có ~25px nội dung ở giữa => cắt sát để hiển thị đúng cỡ
    try {
      const src = this.textures.get('goldRes').getSourceImage() as HTMLImageElement;
      const cv = document.createElement('canvas'); cv.width = 28; cv.height = 28;
      cv.getContext('2d')!.drawImage(src, 49, 47, 28, 28, 0, 0, 28, 28);
      this.textures.addCanvas('stoneIcon', cv);
    } catch { /* dùng ảnh gốc */ }

    // animation sprite
    for (const set of SPRITE_SETS) for (const [an, d] of Object.entries(set.anims)) {
      this.anims.create({
        key: `${set.id}:${an}`,
        frames: this.anims.generateFrameNumbers(`${set.id}:${an}`, { start: 0, end: d.frames - 1 }),
        frameRate: d.fps,
        repeat: d.loop ? -1 : 0,
      });
    }
    for (const [k, d] of Object.entries(FX_SHEETS)) {
      this.anims.create({ key: k, frames: this.anims.generateFrameNumbers(k, { start: 0, end: d.frames - 1 }), frameRate: d.fps });
    }
    // Gigapack: thêm frame theo rect của fx.json
    const json = this.cache.json.get('gigafx') as Record<string, { f: number[][] }>;
    for (const n of GIGA_NAMES) {
      const tex = this.textures.get('giga_' + n);
      const fr = json[n].f;
      fr.forEach((r, i) => tex.add(i, 0, r[0], r[1], r[2], r[3]));
      this.anims.create({ key: 'giga_' + n, frames: fr.map((_, i) => ({ key: 'giga_' + n, frame: i })), frameRate: 16 });
    }
    for (const [k, d] of Object.entries(DECOR_SHEETS)) {
      this.anims.create({ key: k + 'S', frames: this.anims.generateFrameNumbers(k + 'S', { start: 0, end: d.frames - 1 }), frameRate: d.fps, repeat: -1 });
    }
    buildNines(this);
    initTerrain(this);

    await Farm.init();

    const title = this.add.text(W / 2, H / 2 - 120, t('title'), { fontFamily: fontFamily(), fontSize: fs(54), color: '#f3d36b', stroke: '#2b1b0b', strokeThickness: 8 }).setOrigin(0.5);
    this.add.text(W / 2, H / 2 - 60, t('subtitle'), { fontFamily: fontFamily(), fontSize: fs(26), color: '#ffffff', stroke: '#2b1b0b', strokeThickness: 5 }).setOrigin(0.5);
    if (wasTampered()) this.add.text(W / 2, H / 2 + 150, t('tampered'), { fontFamily: fontFamily(), fontSize: fs(22), color: '#ff9a8a', stroke: '#000', strokeThickness: 4, wordWrap: { width: 900 }, align: 'center' }).setOrigin(0.5);
    const tap = this.add.text(W / 2, H / 2 + 80, t('tap_start'), { fontFamily: fontFamily(), fontSize: fs(30), color: '#ffffff', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5);
    this.tweens.add({ targets: tap, alpha: 0.2, yoyo: true, repeat: -1, duration: 700 });
    this.tweens.add({ targets: title, y: title.y - 6, yoyo: true, repeat: -1, duration: 1400, ease: 'Sine.inOut' });
    this.input.once('pointerdown', () => this.scene.start('World'));
    this.input.keyboard?.once('keydown', () => this.scene.start('World'));
  }
}
