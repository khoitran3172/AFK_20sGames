import Phaser from 'phaser';
import { SYNERGIES, TIER_NAMES, TROOPS, TROOP_ORDER, TroopId, activeSynergy } from '../data/troops';
import { Farm } from '../core/farm';
import { StatKey, evolveTroop, fmt, getSave, mcStats, save, statCost, troopCount, troopTierCost, upgradeStat } from '../core/state';
import { Hud } from '../ui/hud';
import { button, iconButton, panel, T, toast } from '../ui/kit';
import { synText, t, troopText } from '../i18n';

const STATS: { k: StatKey; name: string; desc: string; icon: string }[] = [
  { k: 'hp', name: 'stat_hp', desc: 'stat_hp_d', icon: 'icon6' },
  { k: 'atk', name: 'stat_atk', desc: 'stat_atk_d', icon: 'icon5' },
  { k: 'def', name: 'stat_def', desc: 'stat_def_d', icon: 'icon1' },
];

export class ArmyScene extends Phaser.Scene {
  hud!: Hud;
  dyn!: Phaser.GameObjects.Container;
  constructor() { super('Army'); }

  create() {
    Farm.viewing = false;
    this.cameras.main.fadeIn(200);
    this.add.rectangle(640, 360, 1280, 720, 0x1b2a22);
    const g = this.add.graphics();
    g.fillStyle(0x2c4a38, 0.5).fillRect(0, 96, 1280, 624);
    this.hud = new Hud(this);
    iconButton(this, 1236, 36, 'icon8', () => this.scene.start('World'), true, 56);
    iconButton(this, 1160, 36, 'icon10', () => this.scene.launch('Settings'), false, 56);
    // MC động
    const mc = this.add.sprite(215, 250, 'mc:idle', 0).setScale(5.2).setOrigin(0.5, 0.56);
    mc.play('mc:idle');
    this.add.ellipse(215, 302, 150, 26, 0x000000, 0.3).setDepth(-1);
    T(this, 215, 112, t('mc_hero'), 30, { origin: [0.5, 0], color: '#ffe9a8' });
    this.dyn = this.add.container(0, 0);
    this.build();
  }

  build() {
    this.dyn.destroy(true);
    const S = getSave();
    const c = this.add.container(0, 0);
    this.dyn = c;

    // --- khung chỉ số MC
    c.add(panel(this, 20, 340, 400, 320, false, 0.45));
    const st = mcStats(S);
    const vals: Record<StatKey, string> = { hp: fmt(st.hp), atk: fmt(st.atk), def: fmt(st.def) };
    STATS.forEach((r, i) => {
      const y = 356 + i * 100;
      c.add(this.add.image(54, y + 30, r.icon).setDisplaySize(42, 42));
      c.add(T(this, 86, y + 4, `${t(r.name)}  ${t('level')} ${S.lv[r.k]}`, 21, { color: '#3b2a14', stroke: '#fff3cc', sw: 0 }));
      c.add(T(this, 86, y + 30, `${vals[r.k]}`, 24, { color: '#1f5f9a', stroke: '#fff3cc', sw: 0 }));
      const cost = statCost(S, r.k);
      const b = button(this, 340, y + 38, 120, 48, fmt(cost), () => {
        if (upgradeStat(getSave(), r.k)) { Farm.refresh(); save(true); this.build(); }
        else toast(this, `${t('gold')}?`, '#ff9a8a');
      }, false, 20);
      b.setEnabled(S.gold >= cost);
      c.add(b.c);
      const ico = this.add.image(262, y + 38, 'icon3').setDisplaySize(26, 26);
      c.add(ico);
    });

    // --- thẻ quân
    TROOP_ORDER.forEach((id, i) => this.card(id, i, c));

    // --- cộng hưởng
    const syn = activeSynergy(S.squad);
    const sy = this.add.container(440, 664);
    c.add(sy);
    sy.add(panel(this, 0, -2, 820, 54, false, 0.35));
    if (syn) {
      const tx = synText(syn.id, syn);
      sy.add(T(this, 16, 4, `${t('synergy')}: ${tx.name} — ${tx.desc}`, 14, { color: '#1f6b3a', stroke: '#fff3cc', sw: 0, wrap: 790 }));
    } else {
      sy.add(T(this, 16, 8, `${t('no_synergy')} — ${SYNERGIES.map((s) => synText(s.id, s).name).join(' · ')}`, 14, { color: '#6b4a20', stroke: '#fff3cc', sw: 0, wrap: 790 }));
    }
    c.add(T(this, 440, 104, t('select_squad'), 24, { color: '#ffe9a8' }));
  }

  card(id: TroopId, i: number, c: Phaser.GameObjects.Container) {
    const S = getSave();
    const def = TROOPS[id];
    const tx = troopText(id, def);
    const col = i % 3, row = Math.floor(i / 3);
    const x = 440 + col * 276, y = 134 + row * 264;
    const sel = S.squad.includes(id);
    const cc = this.add.container(x, y);
    c.add(cc);
    cc.add(panel(this, 0, 0, 266, 252, false, 0.45));
    if (sel) cc.add(this.add.rectangle(133, 126, 262, 248).setStrokeStyle(4, 0x2fa84a));
    const sp = this.add.sprite(60, 74, `${id}:idle`, 0).setScale(id === 'pike' ? 0.34 : 0.55).setOrigin(0.5, 0.6);
    sp.play(`${id}:idle`);
    cc.add(sp);
    cc.add(T(this, 112, 8, tx.name, 17, { color: '#3b2a14', stroke: '#fff3cc', sw: 0, wrap: 148 }));
    cc.add(T(this, 112, 58, tx.role, 13, { color: '#6b4a20', stroke: '#fff3cc', sw: 0, wrap: 148 }));
    cc.add(T(this, 112, 98, `${t('count')} ${troopCount(S, id)} · ${TIER_NAMES[S.tiers[id]]}`, 14, { color: '#1f5f9a', stroke: '#fff3cc', sw: 0, wrap: 148 }));
    cc.add(T(this, 12, 128, tx.desc, 13, { color: '#4a3a20', stroke: '#fff3cc', sw: 0, wrap: 242, ls: 0 }));
    const b1 = button(this, 70, 222, 112, 42, sel ? t('owned') : t('swap'), () => {
      const sq = getSave().squad;
      if (sq.includes(id)) return;
      const out = sq.shift()!;
      sq.push(id);
      toast(this, `${troopText(id, def).name} ⇄ ${troopText(out, TROOPS[out]).name}`, '#bfffd0');
      Farm.refresh(); save(true); this.build();
    }, !sel, 17);
    b1.setEnabled(!sel);
    cc.add(b1.c);
    const cost = troopTierCost(S, id);
    const lab = cost ? `${t('evolve')} ${cost.badges}` : t('max');
    const b2 = button(this, 190, 222, 124, 42, lab, () => {
      if (evolveTroop(getSave(), id)) { Farm.refresh(); save(true); toast(this, TIER_NAMES[getSave().tiers[id]], '#ffe27a'); this.build(); }
      else toast(this, cost ? `${t('badges')} ${cost.badges} + ${t('gold')} ${fmt(cost.gold)}` : '', '#ff9a8a');
    }, false, 17);
    b2.setEnabled(!!cost && S.badges >= cost.badges && S.gold >= cost.gold);
    cc.add(b2.c);
  }

  update(_t: number, dt: number) {
    Farm.update(dt / 1000);
    this.hud.update();
  }
}
