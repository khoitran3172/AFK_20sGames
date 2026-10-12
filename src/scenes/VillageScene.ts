import Phaser from 'phaser';
import { ARENAS, MAPS } from '../data/arenas';
import { SPRITE_SETS } from '../data/sprites';
import { VT, VY0, layoutFor } from '../data/villages';
import { Farm } from '../core/farm';
import { fmt, getSave, save } from '../core/state';
import { MAX_SITE_LV, SITE_DEF, SITE_TYPES, SiteType, lvOf, siteRate, upgradeCost, upgradeSite, villageRate } from '../core/village';
import { Hud } from '../ui/hud';
import { button, iconButton, panel, T, toast } from '../ui/kit';
import { paintIsland, waterBg } from '../ui/terrain';
import { t } from '../i18n';

interface Pawn { spr: Phaser.GameObjects.Sprite; site: number; idx: number; st: 'work' | 'carry' | 'back'; t: number; set: string }
const RES_COL: Record<string, string> = { gold: '#ffe27a', stones: '#8fe0ff', badges: '#d9b8ff' };
const CYCLE = 9;

export class VillageScene extends Phaser.Scene {
  arena = 0;
  hud!: Hud;
  pawns: Pawn[] = [];
  cards: Phaser.GameObjects.Container | null = null;
  plates: Phaser.GameObjects.Text[] = [];
  sel: SiteType | null = null;
  rateTxt!: Phaser.GameObjects.Text;
  refreshT = 0;
  clouds: Phaser.GameObjects.Image[] = [];

  constructor() { super('Village'); }
  init(data: { arena?: number }) { this.arena = data?.arena ?? getSave().farm; }

  create() {
    Farm.viewing = false;
    this.pawns = []; this.plates = [];
    const S = getSave();
    this.arena = Math.max(0, Math.min(this.arena, S.unlocked, ARENAS.length - 1));
    const L = layoutFor(this.arena);
    const map = MAPS[L.mapIdx];
    this.cameras.main.fadeIn(200);

    const wb = waterBg(this, map.bgWater, -10);
    this.tweens.add({ targets: wb.tile, tilePositionX: 64, tilePositionY: 32, duration: 9000, repeat: -1 });
    paintIsland(this, L.tilemap, L.mask, 0, VY0, true, 0);
    void VT;

    // trang trí
    for (const d of L.decor) {
      if (d.k === 'tree') { const k = 'tree' + (1 + (d.v % 4)) + 'S'; const sp = this.add.sprite(d.x, d.y + 20, k).setOrigin(0.5, 0.88).setScale(0.62).setDepth(d.y); sp.play({ key: k, startFrame: d.v * 2 }); if (map.decor === 'snow') sp.setTint(0xe0ecff); if (map.decor === 'dark') sp.setTint(0x9a8ab0); }
      else if (d.k === 'bush') { const sp = this.add.sprite(d.x, d.y + 10, 'bush1S').setOrigin(0.5, 0.8).setScale(0.55).setDepth(d.y); sp.play({ key: 'bush1S', startFrame: d.v }); }
      else if (d.k === 'sheep') { const sp = this.add.sprite(d.x, d.y + 10, 'sheepGrassS').setOrigin(0.5, 0.8).setScale(0.55).setDepth(d.y); sp.play({ key: 'sheepGrassS', startFrame: d.v * 3 }); }
      else if (d.k === 'gold') this.add.image(d.x, d.y + 10, 'goldStone').setOrigin(0.5, 0.8).setScale(0.55).setDepth(d.y);
      else if (d.k === 'rock') this.add.image(d.x, d.y + 10, 'rock' + (1 + d.v)).setOrigin(0.5, 0.8).setDepth(d.y);
      else if (d.k === 'house') this.add.image(d.x, d.y + 20, d.v % 2 ? 'houseBlue' : 'houseRed').setOrigin(0.5, 0.9).setScale(0.5).setDepth(d.y);
      else if (d.k === 'banner') this.add.image(d.x, d.y + 10, 'icon5').setDisplaySize(30, 30).setDepth(d.y).setAlpha(0.0);
    }
    // lâu đài
    const cs = this.add.image(L.castle.x, L.castle.y + 52, 'castleBlue').setOrigin(0.5, 1).setScale(0.82).setDepth(L.castle.y + 52).setFlipX(L.castle.flip);
    void cs;
    // công trình sản xuất
    L.sites.forEach((s, i) => {
      const lv = lvOf(S, this.arena, s.type);
      const dim = lv === 0 ? 0x777788 : 0xffffff;
      for (const d of s.deco) {
        if (d.k === 'sheep') { const sp = this.add.sprite(d.x, d.y, 'sheepGrassS').setOrigin(0.5, 0.8).setScale(0.6).setDepth(d.y).setTint(dim); sp.play({ key: 'sheepGrassS', startFrame: d.v }); }
        else if (d.k === 'tree') { const k = 'tree' + d.v + 'S'; const sp = this.add.sprite(d.x, d.y + 18, k).setOrigin(0.5, 0.88).setScale(0.62).setDepth(d.y).setTint(dim); sp.play({ key: k, startFrame: (d.v * 2) % 8 }); }
        else if (d.k === 'stump') this.add.image(d.x, d.y + 10, 'rock' + (1 + (d.v % 4))).setOrigin(0.5, 0.8).setDepth(d.y).setTint(dim);
        else if (d.k === 'crystal') {
          const im = this.add.image(d.x, d.y + 10, 'rock' + (1 + (d.v % 4))).setOrigin(0.5, 0.8).setScale(1.5).setDepth(d.y).setTint(lv === 0 ? 0x667788 : 0x8fdcff);
          if (lv > 0) { const sp = this.add.sprite(d.x + 14, d.y - 28, 'giga_sparkle_b', 0).setScale(0.9).setDepth(d.y + 1).setBlendMode(Phaser.BlendModes.ADD); sp.play({ key: 'giga_sparkle_b', repeat: -1, delay: d.v * 400 }); }
          void im;
        }
        else if (d.k === 'forge') this.add.image(d.x, d.y + 36, 'barracksBlue').setOrigin(0.5, 1).setScale(0.62).setDepth(d.y + 36).setTint(dim);
      }
      const def = SITE_DEF[s.type];
      const plate = this.add.container(s.x, s.y + 70).setDepth(5500);
      const w = 190;
      plate.add(panel(this, -w / 2, 0, w, 34, false, 0.38));
      const tx = T(this, 0, 17, `${t(def.name)}  ${t('level')} ${lv}`, 17, { origin: [0.5, 0.5], color: '#3b2a14', stroke: '#fff3cc', sw: 0 });
      plate.add(tx);
      this.plates.push(tx);
      plate.setSize(w, 34).setInteractive({ useHandCursor: true });
      plate.on('pointerup', () => { this.sel = s.type; this.buildCards(); });
      // dân làng
      const n = lv === 0 ? 0 : Math.min(5, 1 + Math.floor(lv / 5));
      for (let k = 0; k < n; k++) this.spawnPawn(i, k);
    });

    this.clouds = [];
    for (let i = 0; i < 2; i++) this.clouds.push(this.add.image(-200 + i * 700, 120 + i * 90, 'cloud' + (1 + i)).setAlpha(0.75).setDepth(4500).setScale(1.1));

    this.buildUi();
  }

  spawnPawn(siteIdx: number, k: number) {
    const L = layoutFor(this.arena);
    const s = L.sites[siteIdx];
    const set = 'pv_' + s.type;
    const w = s.work[k % s.work.length];
    const spr = this.add.sprite(w.x, w.y, `${set}:idle`).setOrigin(0.5, 0.62).setScale(0.8);
    this.pawns.push({ spr, site: siteIdx, idx: k, st: 'work', t: Math.random() * 3, set });
    spr.play(`${set}:attack`);
  }

  buildUi() {
    this.hud = new Hud(this);
    const A = ARENAS[this.arena];
    const S = getSave();
    // thanh tiêu đề + duyệt Arena
    const bar = this.add.container(640, 62).setDepth(6000);
    bar.add(panel(this, -250, 0, 500, 46, false, 0.4));
    bar.add(T(this, 0, 24, `${t('village')} · ${t('arena')} ${A.index + 1} · ${A.name}`, 24, { origin: [0.5, 0.5], color: '#3b2a14', stroke: '#fff3cc', sw: 0 }));
    const prev = iconButton(this, -285, 24, 'icon8', () => this.go(-1), false, 46);
    const next = iconButton(this, 285, 24, 'icon8', () => this.go(1), false, 46);
    (next.getAt(1) as Phaser.GameObjects.Image).setFlipX(true);
    bar.add([prev, next]);
    prev.setAlpha(this.arena > 0 ? 1 : 0.4); next.setAlpha(this.arena < Math.min(S.unlocked, ARENAS.length - 1) ? 1 : 0.4);
    this.rateTxt = T(this, 640, 118, '', 20, { origin: [0.5, 0.5], color: '#d8f2c8' }).setDepth(6000);
    iconButton(this, 1236, 36, 'icon8', () => this.scene.start('World'), true, 56).setDepth(6000);
    iconButton(this, 1160, 36, 'icon5', () => { Farm.setFarmArena(this.arena); this.scene.start('Battle'); }, false, 56).setDepth(6000);
    this.buildCards();
  }

  go(d: number) {
    const S = getSave();
    const n = this.arena + d;
    if (n < 0 || n > Math.min(S.unlocked, ARENAS.length - 1)) return;
    this.scene.restart({ arena: n });
  }

  buildCards() {
    this.cards?.destroy(true);
    const S = getSave();
    const c = this.add.container(0, 0).setDepth(6000);
    this.cards = c;
    SITE_TYPES.forEach((type, i) => {
      const x = 16 + i * 313, y = 586, w = 303, h = 128;
      const def = SITE_DEF[type];
      const lv = lvOf(S, this.arena, type);
      c.add(panel(this, x, y, w, h, false, 0.45));
      if (this.sel === type) c.add(this.add.rectangle(x + w / 2, y + h / 2, w - 4, h - 4).setStrokeStyle(4, 0x2fa84a));
      c.add(this.add.image(x + 38, y + 40, def.icon).setDisplaySize(46, 46).setTint(def.res === 'stones' ? 0x86e0ff : 0xffffff));
      c.add(T(this, x + 72, y + 12, t(def.name), 21, { color: '#3b2a14', stroke: '#fff3cc', sw: 0 }));
      c.add(T(this, x + 72, y + 40, `${t('level')} ${lv}/${MAX_SITE_LV}`, 18, { color: '#6b4a20', stroke: '#fff3cc', sw: 0 }));
      const r = siteRate(S, this.arena, type);
      const nxt = lv < MAX_SITE_LV ? (() => { const S2 = JSON.parse(JSON.stringify(S)); S2.vil[this.arena] = S2.vil[this.arena] ?? [0, 0, 0, 0]; S2.vil[this.arena][i] = lv + 1; return siteRate(S2, this.arena, type); })() : r;
      c.add(T(this, x + 72, y + 64, `+${fmt(r)}${t('per_sec')} ${lv < MAX_SITE_LV ? '→ ' + fmt(nxt) : ''}`, 17, { color: def.res === 'gold' ? '#8a5a00' : def.res === 'stones' ? '#1f5f9a' : '#5a3a8a', stroke: '#fff3cc', sw: 0 }));
      if (lv >= MAX_SITE_LV) { c.add(T(this, x + w / 2, y + 100, t('max'), 22, { origin: [0.5, 0.5], color: '#2a6b2a', stroke: '#fff3cc', sw: 0 })); return; }
      const cost = upgradeCost(this.arena, lv, type);
      const b = button(this, x + w / 2, y + 102, 250, 40, `${lv === 0 ? t('build') : t('upgrade')}  ${fmt(cost)}`, () => {
        if (upgradeSite(getSave(), this.arena, type)) { save(true); Farm.emit(); this.scene.restart({ arena: this.arena }); }
        else toast(this, t('buy_gold'), '#ff9a8a');
      }, false, 19);
      b.setEnabled(S.gold >= cost);
      c.add(b.c);
    });
  }

  update(_t: number, dtMs: number) {
    const dt = dtMs / 1000;
    Farm.update(dt);
    this.hud.update();
    const S = getSave();
    this.clouds.forEach((c, i) => { c.x += (7 + i * 4) * dt; if (c.x > 1500) c.x = -300; });
    // dân làng
    const L = layoutFor(this.arena);
    for (const p of this.pawns) {
      const s = L.sites[p.site];
      const w = s.work[p.idx % s.work.length];
      const doorX = L.door.x + (p.idx - 2) * 10, doorY = L.door.y + 36;
      const speed = 95;
      if (p.st === 'work') {
        p.t -= dt;
        if (p.t <= 0) { p.st = 'carry'; p.spr.play(`${p.set}:walk`); }
      } else {
        const tx = p.st === 'carry' ? doorX : w.x, ty = p.st === 'carry' ? doorY : w.y;
        const dx = tx - p.spr.x, dy = ty - p.spr.y, d = Math.hypot(dx, dy);
        if (d < 5) {
          if (p.st === 'carry') {
            p.st = 'back'; p.spr.play(`${p.set}:back`);
            const n = this.pawns.filter((q) => q.site === p.site).length;
            const rate = siteRate(S, this.arena, s.type);
            this.floatText(p.spr.x, p.spr.y - 60, `+${fmt(rate * CYCLE / Math.max(1, n))}`, RES_COL[SITE_DEF[s.type].res]);
          } else { p.st = 'work'; p.t = 2.2 + Math.random() * 2.2; p.spr.play(`${p.set}:attack`); }
        } else {
          p.spr.x += (dx / d) * speed * dt; p.spr.y += (dy / d) * speed * dt;
          p.spr.setFlipX(dx < 0);
        }
      }
      p.spr.setDepth(p.spr.y);
    }
    this.refreshT -= dt;
    if (this.refreshT <= 0) {
      this.refreshT = 0.5;
      const vr = villageRate(S, this.arena);
      Farm.vRate && this.rateTxt.setText(`${t('village_income')}: +${fmt(vr.gold * 60)} ${t('gold')}${t('per_min')} · +${fmt(vr.stones * 60)} ${t('stones')}${t('per_min')} · +${fmt(vr.badges * 60)} ${t('badges')}${t('per_min')}   |   ${t('all_villages')}: +${fmt(Farm.vRate.gold * 60)}${t('per_min')}`);
    }
    void SPRITE_SETS;
  }

  floatText(x: number, y: number, s: string, col: string) {
    const tx = T(this, x, y, s, 20, { origin: [0.5, 0.5], color: col }).setDepth(5600);
    this.tweens.add({ targets: tx, y: y - 44, alpha: { from: 1, to: 0 }, duration: 1300, ease: 'Cubic.out', onComplete: () => tx.destroy() });
  }
}
