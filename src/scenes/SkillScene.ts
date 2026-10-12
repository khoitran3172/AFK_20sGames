import Phaser from 'phaser';
import { BRANCH_INFO, SKILLS, SKILL_BY_ID, skillLayout } from '../data/skills';
import { Farm } from '../core/farm';
import { canUnlock, fmt, getSave, nextSkillCost, save, unlockSkill } from '../core/state';
import { Hud } from '../ui/hud';
import { button, iconButton, panel, T, toast } from '../ui/kit';
import { skillDesc, skillName, t } from '../i18n';

const AX = 36, AY = 150, SX = 0.84, SY = 0.62;
const pos = skillLayout();
const sp = (id: number) => ({ x: AX + pos[id].x * SX, y: AY + (pos[id].y - 100) * SY });

export class SkillScene extends Phaser.Scene {
  hud!: Hud;
  sel = 1;
  nodes = new Map<number, Phaser.GameObjects.Container>();
  lines!: Phaser.GameObjects.Graphics;
  detail!: Phaser.GameObjects.Container;
  cnt!: Phaser.GameObjects.Text;
  constructor() { super('Skills'); }

  create() {
    Farm.viewing = false;
    this.nodes.clear();
    this.cameras.main.fadeIn(200);
    this.add.rectangle(640, 360, 1280, 720, 0x1d1a2b);
    const g = this.add.graphics();
    for (const [b, cx] of [['A', 36 + 170 * SX], ['B', 36 + 500 * SX], ['C', 36 + 830 * SX]] as const) {
      g.fillStyle(BRANCH_INFO[b].color, 0.07).fillRoundedRect(cx - 150, 92, 300, 620, 24);
    }
    this.lines = this.add.graphics();
    this.hud = new Hud(this);
    for (const [b, cx] of [['A', 36 + 170 * SX], ['B', 36 + 500 * SX], ['C', 36 + 830 * SX]] as const) {
      T(this, cx, 96, t('branch_' + b), 24, { origin: [0.5, 0], color: BRANCH_INFO[b].css });
    }
    for (const s of SKILLS) this.makeNode(s.id);
    iconButton(this, 1236, 36, 'icon8', () => this.scene.start('World'), true, 56);
    this.cnt = T(this, 640, 72, '', 20, { origin: [0.5, 0.5], color: '#cfd8ff' });
    this.detail = this.add.container(0, 0);
    this.refresh();
  }

  makeNode(id: number) {
    const s = SKILL_BY_ID[id];
    const p = sp(id);
    const c = this.add.container(p.x, p.y);
    const size = s.tier === 5 ? 72 : s.tier === 0 ? 70 : 54;
    const ring = this.add.circle(0, 0, size / 2 + 4, 0x000000, 0.65).setStrokeStyle(3, 0x555555);
    const bg = this.add.image(0, 0, 'roundBlue').setDisplaySize(size, size);
    const ic = this.add.image(0, -2, 'icon' + (1 + (id % 12))).setDisplaySize(size * 0.5, size * 0.5);
    c.add([ring, bg, ic]);
    c.setSize(size, size).setInteractive({ useHandCursor: true });
    c.on('pointerup', () => { this.sel = id; this.refresh(); });
    c.setData({ ring, bg, ic, size });
    this.nodes.set(id, c);
  }

  drawLines() {
    const S = getSave();
    const g = this.lines;
    g.clear();
    for (const s of SKILLS) for (const r of s.req) {
      const a = sp(r), b = sp(s.id);
      const on = S.skills.includes(s.id) && S.skills.includes(r);
      const avail = S.skills.includes(r);
      g.lineStyle(on ? 6 : 4, on ? BRANCH_INFO[s.branch].color : avail ? 0x8a8aa0 : 0x3d3d52, on ? 1 : 0.9);
      g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.strokePath();
    }
  }

  refresh() {
    const S = getSave();
    this.drawLines();
    for (const [id, c] of this.nodes) {
      const s = SKILL_BY_ID[id];
      const st = canUnlock(S, id);
      const ring = c.getData('ring') as Phaser.GameObjects.Arc, bg = c.getData('bg') as Phaser.GameObjects.Image, ic = c.getData('ic') as Phaser.GameObjects.Image;
      const col = BRANCH_INFO[s.branch].color;
      this.tweens.killTweensOf(ring);
      ring.setAlpha(1);
      if (st === 'owned') { ring.setStrokeStyle(4, 0xffe27a); bg.setTexture('roundBlue').clearTint(); ic.clearTint().setAlpha(1); c.setAlpha(1); }
      else if (st === 'req') { ring.setStrokeStyle(3, 0x4a4a5a); bg.setTexture('roundBlue').setTint(0x555566); ic.setTint(0x777788).setAlpha(0.6); c.setAlpha(0.85); }
      else { ring.setStrokeStyle(4, col); bg.setTexture('roundRed').clearTint(); ic.clearTint().setAlpha(1); c.setAlpha(1); }
      c.setScale(id === this.sel ? 1.18 : 1);
      if (st === 'ok') this.tweens.add({ targets: ring, alpha: 0.35, yoyo: true, repeat: -1, duration: 600 });
    }
    this.cnt.setText(`${t('unlocked')}: ${S.skills.length}/46   ·   ${t('next_cost')}: ${fmt(nextSkillCost(S))} ${t('stones')}`);
    this.drawDetail();
  }

  drawDetail() {
    this.detail.destroy(true);
    const S = getSave();
    const s = SKILL_BY_ID[this.sel];
    const st = canUnlock(S, s.id);
    const c = this.add.container(900, 100);
    this.detail = c;
    c.add(panel(this, 0, 0, 350, 540, false, 0.5));
    c.add(T(this, 28, 26, t('branch_' + s.branch) + (s.tier ? ` · ${t('tier')} ${s.tier}` : ''), 20, { color: '#6b4a20', stroke: '#fff3cc', sw: 0 }));
    c.add(T(this, 28, 60, skillName(s.id, s.name), 28, { color: '#3b2a14', stroke: '#fff3cc', sw: 0, wrap: 296 }));
    c.add(T(this, 28, 150, skillDesc(s.id, s.desc), 22, { color: '#4a3a20', stroke: '#fff3cc', sw: 0, wrap: 296, ls: 3 }));
    if (s.req.length) {
      const names = s.req.map((r) => skillName(r, SKILL_BY_ID[r].name)).join(', ');
      c.add(T(this, 28, 330, `${t('need_req')}:`, 18, { color: '#8a3b2a', stroke: '#fff3cc', sw: 0 }));
      c.add(T(this, 28, 352, names, 18, { color: '#8a3b2a', stroke: '#fff3cc', sw: 0, wrap: 296 }));
    }
    const cost = nextSkillCost(S);
    if (st !== 'owned') c.add(T(this, 28, 420, `${t('cost')}: ${fmt(cost)} ${t('stones')}`, 24, { color: S.stones >= cost ? '#1f5f9a' : '#b02a1a', stroke: '#fff3cc', sw: 0 }));
    const b = button(this, 175, 490, 280, 54, st === 'owned' ? t('unlocked') : t('unlock'), () => {
      if (unlockSkill(getSave(), s.id)) {
        const p = sp(s.id);
        const fx = this.add.sprite(p.x, p.y, 'giga_burst_y', 0).setScale(1.6).setDepth(50).setBlendMode(Phaser.BlendModes.ADD);
        fx.play('giga_burst_y'); fx.once('animationcomplete', () => fx.destroy());
        toast(this, skillName(s.id, s.name), '#ffe27a');
        Farm.refresh(); save(true); this.refresh();
      } else toast(this, st === 'req' ? t('need_req') : t('stones') + '?', '#ff9a8a');
    }, false, 24);
    b.setEnabled(st === 'ok');
    c.add(b.c);
  }

  update(_t: number, dt: number) {
    try { Farm.update(dt / 1000); this.hud.update(); } catch (e) { console.error(e); }
  }
}
