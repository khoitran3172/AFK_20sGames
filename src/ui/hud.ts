import Phaser from 'phaser';
import { fmt, getSave, power } from '../core/state';
import { Farm } from '../core/farm';
import { chip, panel, T, toast } from './kit';
import { ARENAS } from '../data/arenas';
import { RARITY_CSS, itemName } from '../data/items';
import { t } from '../i18n';

/** Thanh tài nguyên dùng chung: Vàng · Đá Tinh Thạch · Huy Hiệu · Lực chiến */
export class Hud {
  gold; stones; badges; pw;
  private last = { g: -1, s: -1, b: -1, p: -1 };
  rateTxt: Phaser.GameObjects.Text;
  evBox: Phaser.GameObjects.Container;
  evTxt: Phaser.GameObjects.Text;
  evBg: Phaser.GameObjects.Graphics;
  constructor(public scene: Phaser.Scene, x = 16, y = 14) {
    this.gold = chip(scene, x, y, 178, 'icon3');
    this.stones = chip(scene, x + 188, y, 178, 'stoneIcon', 0x7fdcff);
    this.badges = chip(scene, x + 376, y, 150, 'icon6');
    this.pw = chip(scene, x + 536, y, 220, 'icon5');
    this.pw.text.setColor('#ffe08a');
    for (const c of [this.gold, this.stones, this.badges, this.pw]) c.c.setDepth(6000);
    this.stones.icon.setDisplaySize(52, 52);
    const help = (c: { c: Phaser.GameObjects.Container }, kind: string, w: number) => {
      c.c.setSize(w, 40).setInteractive(new Phaser.Geom.Rectangle(0, 0, w, 40), Phaser.Geom.Rectangle.Contains);
      c.c.on('pointerup', () => this.showHelp(kind, c.c.x));
    };
    help(this.gold, 'gold', 178); help(this.stones, 'stones', 178); help(this.badges, 'badges', 150); help(this.pw, 'power', 220);
    this.rateTxt = T(scene, x + 4, y + 46, '', 17, { color: '#d8f2c8' }).setDepth(6000);
    // chip sự kiện (thương nhân / địch tấn công)
    this.evBox = scene.add.container(x + 770, y).setDepth(6000).setVisible(false);
    this.evBg = scene.add.graphics();
    this.evTxt = T(scene, 14, 20, '', 19, { origin: [0, 0.5] });
    this.evBox.add([this.evBg, this.evTxt]);
    this.evBox.setSize(330, 40).setInteractive(new Phaser.Geom.Rectangle(0, 0, 330, 40), Phaser.Geom.Rectangle.Contains);
    this.evBox.on('pointerup', () => this.clickEvent());
    this.update(true);
  }
  helpBox: Phaser.GameObjects.Container | null = null;
  showHelp(kind: string, x: number) {
    this.helpBox?.destroy(true);
    const w = 420;
    const c = this.scene.add.container(Math.min(x, 1280 - w - 8), 62).setDepth(7000);
    this.helpBox = c;
    c.add(panel(this.scene, 0, 0, w, 185, false, 0.4));
    c.add(T(this.scene, 16, 10, t('help_' + kind + '_t'), 22, { color: '#3b2a14', stroke: '#fff3cc', sw: 0 }));
    c.add(T(this.scene, 16, 42, t('help_' + kind), 16, { color: '#4a3a20', stroke: '#fff3cc', sw: 0, wrap: w - 32, ls: 2 }));
    this.scene.time.delayedCall(6000, () => { if (this.helpBox === c) { c.destroy(true); this.helpBox = null; } });
    this.scene.input.once('pointerdown', () => { if (this.helpBox === c) this.scene.time.delayedCall(60, () => { c.destroy(true); if (this.helpBox === c) this.helpBox = null; }); });
  }
  clickEvent() {
    const e = getSave().ev;
    if (e.raid) { Farm.startRaid(); this.scene.scene.start('Battle'); }
    else if (e.merchant) this.scene.scene.start('Village', { arena: e.merchant.arena, shop: true });
  }
  update(force = false) {
    const S = getSave();
    if (Farm.notice) {
      const n = Farm.notice; Farm.notice = null;
      const a = ARENAS[n.arena].name;
      if (n.kind === 'merchant') toast(this.scene, t('ev_merchant', { a }), '#ffe9a8');
      else if (n.kind === 'raid') { toast(this.scene, t('ev_raid', { a }), '#ff9a8a'); this.scene.cameras.main.shake(250, 0.004); }
      else toast(this.scene, t('ev_pillage', { a, n: fmt(n.lost ?? 0) }), '#ff9a8a');
    }
    const ev = S.ev;
    const act = ev.raid ? 'raid' : ev.merchant ? 'merchant' : null;
    if (act) {
      const arena = ev.raid ? ev.raid.arena : ev.merchant!.arena;
      const left = Math.max(0, (ev.raid ? ev.raid.until : ev.merchant!.until) - S.playMs) / 1000;
      const mm = `${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2, '0')}`;
      const txt = act === 'raid' ? `⚔ ${t('raid')}! ${ARENAS[arena].name} ${mm}` : `${t('merchant')}: ${ARENAS[arena].name} ${mm}`;
      if (this.evTxt.text !== txt) this.evTxt.setText(txt);
      this.evBg.clear().fillStyle(act === 'raid' ? 0x7a1d18 : 0x2a5a8a, 0.92).fillRoundedRect(0, 0, 330, 40, 10).lineStyle(2, act === 'raid' ? 0xff6a5a : 0xffe9a8, 1).strokeRoundedRect(0, 0, 330, 40, 10);
      this.evBox.setVisible(true).setAlpha(act === 'raid' ? 0.75 + 0.25 * Math.sin(this.scene.time.now / 200) : 1);
    } else this.evBox.setVisible(false);
    while (Farm.newItems.length) { const it = Farm.newItems.shift()!; toast(this.scene, `${t('got_item')}: ${itemName(it)}`, RARITY_CSS[it.r]); }
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
