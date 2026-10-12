import Phaser from 'phaser';
import { SYNERGIES, TIER_NAMES, TROOPS, TROOP_ORDER, TROOP_TREE, TreeFx, TroopId, activeSynergy } from '../data/troops';
import { SET_BY_ID } from '../data/sprites';
import { Farm } from '../core/farm';
import { StatKey, evolveTroop, fmt, getSave, mcStats, save, statCost, troopCount, troopTierCost, treeCost, unlockTreeNode, upgradeStat } from '../core/state';
import { Hud } from '../ui/hud';
import { button, iconButton, modalBack, panel, T, toast } from '../ui/kit';
import { synText, t, troopText } from '../i18n';

const STATS: { k: StatKey; name: string; desc: string; icon: string }[] = [
  { k: 'hp', name: 'stat_hp', desc: 'stat_hp_d', icon: 'icon6' },
  { k: 'atk', name: 'stat_atk', desc: 'stat_atk_d', icon: 'icon5' },
  { k: 'def', name: 'stat_def', desc: 'stat_def_d', icon: 'icon1' },
];
const PER_PAGE = 6;
const TREE_ROMAN = ['I', 'II', 'III', 'IV'];

export function fxText(fx: TreeFx): string {
  const out: string[] = [];
  const pct = (v: number) => `+${Math.round(v * 100)}%`;
  if (fx.hp) out.push(`${pct(fx.hp)} ${t('tf_hp')}`);
  if (fx.atk) out.push(`${pct(fx.atk)} ${t('tf_atk')}`);
  if (fx.def) out.push(`${pct(fx.def)} ${t('tf_def')}`);
  if (fx.aspd) out.push(`${pct(fx.aspd)} ${t('tf_aspd')}`);
  if (fx.crit) out.push(`${pct(fx.crit)} ${t('tf_crit')}`);
  if (fx.heal) out.push(`${pct(fx.heal)} ${t('tf_heal')}`);
  if (fx.spirit) out.push(`${pct(fx.spirit)} ${t('tf_spirit')}`);
  if (fx.count) out.push(`+${fx.count} ${t('count')}`);
  if (fx.respawn) out.push(`-${Math.round(fx.respawn * 100)}% ${t('respawn')}`);
  return out.join('\n');
}

/** Icon binh chủng: sprite idle frame 0, đặt chân tại (x, y), cao ~size px */
export function troopIcon(scene: Phaser.Scene, id: string, x: number, y: number, size: number) {
  const st = SET_BY_ID[id];
  const sp = scene.add.sprite(x, y, `${id}:idle`, 0).setOrigin(st.ox, st.oy);
  sp.setScale(size / (st.fig ?? 118));
  return sp;
}

export class ArmyScene extends Phaser.Scene {
  hud!: Hud;
  dyn!: Phaser.GameObjects.Container;
  page = 0;
  treeFor: TroopId | null = null;
  constructor() { super('Army'); }

  create() {
    Farm.viewing = false;
    this.treeFor = null;
    this.cameras.main.fadeIn(200);
    this.add.rectangle(640, 360, 1280, 720, 0x1b2a22);
    const g = this.add.graphics();
    g.fillStyle(0x2c4a38, 0.5).fillRect(0, 96, 1280, 624);
    this.hud = new Hud(this);
    iconButton(this, 1236, 36, 'icon8', () => this.scene.start('World'), true, 56);
    iconButton(this, 1160, 36, 'icon10', () => this.scene.launch('Settings'), false, 56);
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
      c.add(this.add.image(262, y + 38, 'icon3').setDisplaySize(26, 26));
    });

    // --- thẻ quân (chia trang)
    const pages = Math.ceil(TROOP_ORDER.length / PER_PAGE);
    TROOP_ORDER.slice(this.page * PER_PAGE, this.page * PER_PAGE + PER_PAGE).forEach((id, i) => this.card(id, i, c));
    c.add(T(this, 440, 104, t('select_squad'), 24, { color: '#ffe9a8' }));
    for (let p = 0; p < pages; p++) {
      const b = button(this, 1000 + p * 70, 118, 60, 36, String(p + 1), () => { this.page = p; this.build(); }, this.page !== p, 19);
      c.add(b.c);
    }

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

    if (this.treeFor) this.treeModal(c, this.treeFor);
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
    const sp = troopIcon(this, id, 60, 100, 84);
    sp.play(`${id}:idle`);
    cc.add(sp);
    cc.add(T(this, 112, 8, tx.name, 17, { color: '#3b2a14', stroke: '#fff3cc', sw: 0, wrap: 148 }));
    cc.add(T(this, 112, 58, tx.role, 13, { color: '#6b4a20', stroke: '#fff3cc', sw: 0, wrap: 148 }));
    cc.add(T(this, 112, 98, `${t('count')} ${troopCount(S, id)} · ${TIER_NAMES[S.tiers[id]]}`, 14, { color: '#1f5f9a', stroke: '#fff3cc', sw: 0, wrap: 148 }));
    cc.add(T(this, 12, 124, tx.desc, 13, { color: '#4a3a20', stroke: '#fff3cc', sw: 0, wrap: 242, ls: 0 }));
    const b1 = button(this, 46, 224, 82, 40, sel ? t('owned') : t('swap'), () => {
      const sq = getSave().squad;
      if (sq.includes(id)) return;
      const out = sq.shift()!;
      sq.push(id);
      toast(this, `${troopText(id, def).name} ⇄ ${troopText(out, TROOPS[out]).name}`, '#bfffd0');
      Farm.refresh(); save(true); this.build();
    }, !sel, 16);
    b1.setEnabled(!sel);
    cc.add(b1.c);
    const cost = troopTierCost(S, id);
    const lab = cost ? `${t('evolve')} ${cost.badges}` : t('max');
    const b2 = button(this, 140, 224, 100, 40, lab, () => {
      if (evolveTroop(getSave(), id)) { Farm.refresh(); save(true); toast(this, TIER_NAMES[getSave().tiers[id]], '#ffe27a'); this.build(); }
      else toast(this, cost ? `${t('badges')} ${cost.badges} + ${t('gold')} ${fmt(cost.gold)}` : '', '#ff9a8a');
    }, false, 15);
    b2.setEnabled(!!cost && S.badges >= cost.badges && S.gold >= cost.gold);
    cc.add(b2.c);
    const nodes = S.ttree[id] ?? 0;
    const b3 = button(this, 224, 224, 70, 40, `${t('tree')} ${nodes}/4`, () => { this.treeFor = id; this.build(); }, true, 14);
    cc.add(b3.c);
  }

  treeModal(c: Phaser.GameObjects.Container, id: TroopId) {
    const S = getSave();
    const tx = troopText(id, TROOPS[id]);
    const layer = this.add.container(0, 0).setDepth(100);
    c.add(layer);
    layer.add(modalBack(this, 0.6));
    layer.add(panel(this, 150, 150, 980, 420, true, 0.55));
    layer.add(T(this, 640, 172, `${tx.name} — ${t('tree_title')}`, 30, { origin: [0.5, 0], color: '#fff6dd' }));
    const done = S.ttree[id] ?? 0;
    TROOP_TREE[id].forEach((fx, n) => {
      const x = 190 + n * 236, y = 240;
      const unlocked = n < done, next = n === done;
      layer.add(panel(this, x, y, 216, 240, false, 0.4));
      if (next) layer.add(this.add.rectangle(x + 108, y + 120, 220, 244).setStrokeStyle(5, 0xff9d00));
      layer.add(T(this, x + 108, y + 10, TREE_ROMAN[n], 28, { origin: [0.5, 0], color: unlocked ? '#2a6b2a' : '#3b2a14', stroke: '#fff3cc', sw: 0 }));
      layer.add(T(this, x + 108, y + 56, fxText(fx), 19, { origin: [0.5, 0], align: 'center', color: '#3b2a14', stroke: '#fff3cc', sw: 0, ls: 4 }));
      if (unlocked) layer.add(T(this, x + 108, y + 200, '✔ ' + t('unlocked'), 20, { origin: [0.5, 0.5], color: '#2a6b2a', stroke: '#fff3cc', sw: 0 }));
      else if (next) {
        const cost = treeCost(S, id)!;
        layer.add(T(this, x + 108, y + 124, `${fmt(cost.badges)} ${t('badges')}\n${fmt(cost.gold)} ${t('gold')}`, 16, { origin: [0.5, 0], align: 'center', color: '#6b4a20', stroke: '#fff3cc', sw: 0 }));
        const b = button(this, x + 108, y + 206, 150, 40, t('unlock'), () => {
          if (unlockTreeNode(getSave(), id)) { Farm.refresh(); save(true); toast(this, fxText(fx).replace(/\n/g, ' · '), '#ffe27a'); this.build(); }
          else toast(this, `${t('badges')} ${fmt(cost.badges)} + ${t('gold')} ${fmt(cost.gold)}`, '#ff9a8a');
        }, false, 17);
        b.setEnabled(S.badges >= cost.badges && S.gold >= cost.gold);
        layer.add(b.c);
      } else layer.add(T(this, x + 108, y + 200, t('need_req'), 14, { origin: [0.5, 0.5], color: '#8a3b2a', stroke: '#fff3cc', sw: 0, wrap: 190, align: 'center' }));
    });
    const close = button(this, 640, 548, 200, 44, t('close'), () => { this.treeFor = null; this.build(); }, true, 20);
    layer.add(close.c);
  }

  update(_t: number, dt: number) {
    try { Farm.update(dt / 1000); this.hud.update(); } catch (e) { console.error(e); }
  }
}
