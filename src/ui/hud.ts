import Phaser from 'phaser';
import { fmt, getSave, power } from '../core/state';
import { Farm } from '../core/farm';
import { chip, T } from './kit';
import { t } from '../i18n';

/** Thanh tài nguyên dùng chung: Vàng · Đá Tinh Thạch · Huy Hiệu · Lực chiến */
export class Hud {
  gold; stones; badges; pw;
  private last = { g: -1, s: -1, b: -1, p: -1 };
  rateTxt: Phaser.GameObjects.Text;
  constructor(public scene: Phaser.Scene, x = 16, y = 14) {
    this.gold = chip(scene, x, y, 178, 'icon3');
    this.stones = chip(scene, x + 188, y, 178, 'goldRes', 0x7fdcff);
    this.badges = chip(scene, x + 376, y, 150, 'icon6');
    this.pw = chip(scene, x + 536, y, 220, 'icon5');
    this.pw.text.setColor('#ffe08a');
    for (const c of [this.gold, this.stones, this.badges, this.pw]) c.c.setDepth(6000);
    this.stones.icon.setDisplaySize(52, 52);
    this.rateTxt = T(scene, x + 4, y + 46, '', 17, { color: '#d8f2c8' }).setDepth(6000);
    this.update(true);
  }
  update(force = false) {
    const S = getSave();
    const g = Math.floor(S.gold), s = Math.floor(S.stones), b = Math.floor(S.badges), p = power(S);
    if (force || g !== this.last.g) { this.gold.set(fmt(g)); this.last.g = g; }
    if (force || s !== this.last.s) { this.stones.set(fmt(s)); this.last.s = s; }
    if (force || b !== this.last.b) { this.badges.set(fmt(b)); this.last.b = b; }
    if (force || p !== this.last.p) { this.pw.set(t('power') + ' ' + fmt(p)); this.last.p = p; }
    const r = S.rate;
    this.rateTxt.setText(`+${fmt(r.gold * 60)}${t('per_min')}  +${fmt(r.stones * 60)}${t('per_min')}`);
    void Farm;
  }
}
