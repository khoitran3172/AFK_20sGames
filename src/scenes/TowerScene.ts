import Phaser from 'phaser';
import { Farm } from '../core/farm';
import { getSave } from '../core/state';
import { TOWER_TRIES, ensureTower, nextBossFloor, triesLeft } from '../core/tower';
import { Hud } from '../ui/hud';
import { achvIcon, button, iconButton, panel, T, toast } from '../ui/kit';
import { t } from '../i18n';

export class TowerScene extends Phaser.Scene {
  hud!: Hud;
  constructor() { super('Tower'); }

  create() {
    Farm.viewing = false;
    const S = getSave();
    const tw = ensureTower(S);
    this.cameras.main.fadeIn(200);
    // nền trời đêm + sao
    this.add.rectangle(640, 360, 1280, 720, 0x141a33);
    const g = this.add.graphics();
    for (let i = 0; i < 70; i++) { g.fillStyle(0xffffff, 0.3 + Math.random() * 0.6).fillRect(Math.random() * 1280, Math.random() * 520, 2, 2); }
    g.fillStyle(0x2a3a2a, 1).fillRect(0, 640, 1280, 80);
    // tháp
    const tower = this.add.image(330, 650, 'towerBlue').setOrigin(0.5, 1).setScale(2.2).setTint(0xb8c8ff);
    this.tweens.add({ targets: tower, y: 646, yoyo: true, repeat: -1, duration: 2200, ease: 'Sine.inOut' });
    for (let k = 0; k < 4; k++) {
      const f = this.add.sprite(300 + (k % 2) * 60, 560 - k * 100, 'fxFire').setScale(1.1).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.9);
      f.play({ key: 'fxFire', repeat: -1, delay: k * 120 });
    }
    T(this, 330, 150, `${t('best_floor')}: ${t('floor')} ${tw.best}`, 28, { origin: [0.5, 0.5], color: '#ffe9a8' });

    this.hud = new Hud(this);
    iconButton(this, 1236, 36, 'icon8', () => this.scene.start('World'), true, 56);

    // bảng thông tin
    const px = 660, py = 150;
    panel(this, px, py, 580, 470, false, 0.5);
    T(this, px + 290, py + 20, t('tower'), 40, { origin: [0.5, 0], color: '#3b2a14', stroke: '#fff3cc', sw: 0 });
    T(this, px + 30, py + 90, t('tower_hint'), 20, { color: '#4a3a20', stroke: '#fff3cc', sw: 0, wrap: 520, ls: 3 });
    T(this, px + 30, py + 190, t('tower_boss_hint'), 19, { color: '#6b4a20', stroke: '#fff3cc', sw: 0, wrap: 520, ls: 3 });
    const left = triesLeft(S);
    T(this, px + 30, py + 270, t('tries_left', { n: left }), 24, { color: left > 0 ? '#1f7a2a' : '#b02a1a', stroke: '#fff3cc', sw: 0 });
    for (let i = 0; i < TOWER_TRIES; i++) achvIcon(this, px + 450 + i * 40, py + 284, i < left ? 'Gold-Star' : 'Silver-Star', 34).setAlpha(i < left ? 1 : 0.4);
    T(this, px + 30, py + 312, `${t('floor')} ${nextBossFloor(tw.best)}: ${t('boss')}`, 19, { color: '#8a3b2a', stroke: '#fff3cc', sw: 0 });
    const b = button(this, px + 290, py + 400, 320, 64, left > 0 ? t('climb') : t('no_tries'), () => {
      if (Farm.startTower()) this.scene.start('Battle');
      else toast(this, t('no_tries'), '#ff9a8a');
    }, true, left > 0 ? 28 : 18);
    b.setEnabled(left > 0);
  }

  update(_t: number, dt: number) {
    try { Farm.update(dt / 1000); this.hud.update(); } catch (e) { console.error(e); }
  }
}
