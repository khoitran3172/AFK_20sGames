import Phaser from 'phaser';
import { ARENAS } from '../data/arenas';
import { Farm } from '../core/farm';
import { fmt } from '../core/state';
import { button, modalBack, panel, T } from '../ui/kit';
import { t } from '../i18n';

export class ResultScene extends Phaser.Scene {
  constructor() { super('Result'); }
  create() {
    const r = Farm.result!;
    modalBack(this, 0.6);
    const c = this.add.container(640, 380).setDepth(10);
    c.add(panel(this, -270, -200, 540, 410, true, 0.55));
    const key = r.won ? 'giga_you_won' : 'giga_you_lost';
    const banner = this.add.sprite(640, 150, key, 0).setScale(r.won ? 2.0 : 1.7).setDepth(20);
    banner.play(key);
    if (r.won) {
      const f = this.add.sprite(430, 230, 'giga_firework', 0).setScale(2.4).setBlendMode(Phaser.BlendModes.ADD).setDepth(20); f.play('giga_firework');
      const f2 = this.add.sprite(850, 250, 'giga_firework', 0).setScale(2.4).setBlendMode(Phaser.BlendModes.ADD).setDepth(20); f2.play({ key: 'giga_firework', delay: 400 });
    }
    c.add(T(this, 0, -120, r.won ? t('victory') : t('defeat'), 40, { origin: [0.5, 0], color: r.won ? '#9af0a0' : '#ff9a8a' }));
    const A = ARENAS[r.arena];
    c.add(T(this, 0, -72, `${t('arena')} ${A.index + 1} · ${A.name}`, 24, { origin: [0.5, 0], color: '#e8d9a8' }));
    if (r.won) {
      c.add(T(this, 0, -30, `${t('gold')} +${fmt(r.rewards.gold)}`, 26, { origin: [0.5, 0], color: '#ffd36b' }));
      c.add(T(this, 0, 6, `${t('stones')} +${fmt(r.rewards.stones)}`, 26, { origin: [0.5, 0], color: '#8fd0ff' }));
      c.add(T(this, 0, 42, `${t('badges')} +${fmt(r.rewards.badges)}`, 26, { origin: [0.5, 0], color: '#d9b8ff' }));
      c.add(T(this, 0, 92, r.newMap ? t('map_unlocked') : t('next_arena'), 24, { origin: [0.5, 0], color: '#9af0a0' }));
    } else {
      c.add(T(this, 0, -10, t('not_enough_power'), 26, { origin: [0.5, 0], color: '#ff9a8a' }));
    }
    const go = () => {
      const won = r.won;
      Farm.result = null;
      const battle = this.scene.get('Battle');
      this.scene.stop();
      battle.scene.start(won ? 'World' : 'Battle');
    };
    const b = button(this, 0, 160, 280, 56, r.won ? t('map') : t('retry'), go, false, 24);
    c.add(b.c);
  }
}
