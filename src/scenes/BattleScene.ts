import Phaser from 'phaser';
import { ARENAS, MAPS } from '../data/arenas';
import { SET_BY_ID } from '../data/sprites';
import { TROOPS, TroopId, activeSynergy } from '../data/troops';
import { Battle, Proj, Unit, FIELD } from '../core/battle';
import { Farm } from '../core/farm';
import { fmt, getSave, power, troopCount, save } from '../core/state';
import { Hud } from '../ui/hud';
import { button, drawBar, iconButton, panel, T } from '../ui/kit';
import { makeMask, paintIsland, waterBg, TILE } from '../ui/terrain';
import { getLang, synText, t, troopText } from '../i18n';
import { GIGA } from './BootScene';

/** Chiều cao đầu (px khung gốc) để đặt thanh máu */
const HEAD: Record<string, number> = { mc: 40, orc: 38, knight: 118, pike: 175, archer: 118, wizard: 118, healer: 118, rogue: 110, holy: 118, rwar: 118, rlan: 175, rarc: 118, rmonk: 118, rpawn: 110, bwar: 118, blan: 175, barc: 118, bmonk: 118 };
const TINT_STATUS = { freeze: 0x9ee6ff, burn: 0xffa860, slow: 0xa8b8ff, chaos: 0xe090ff, divine: 0xfff0a0 };

class UnitView {
  spr: Phaser.GameObjects.Sprite;
  shadow: Phaser.GameObjects.Ellipse;
  busy = false;
  lastAct = -1;
  lastHp: number;
  dead = false;
  hurtLock = 0;
  atkFlip = 0;
  constructor(public scene: Phaser.Scene, public u: Unit) {
    const set = SET_BY_ID[u.set];
    this.spr = scene.add.sprite(u.x, u.y, `${set.id}:idle`).setOrigin(set.ox, set.oy);
    this.spr.play(`${set.id}:idle`);
    this.shadow = scene.add.ellipse(u.x, u.y + 2, set.shadow * u.scale * 0.7, 14 * Math.max(0.8, u.scale * 0.7), 0x000000, 0.32);
    this.lastHp = u.hp;
    this.spr.on('animationcomplete', () => { this.busy = false; });
  }
  play(an: string, force = false) {
    const set = SET_BY_ID[this.u.set];
    if (!set.anims[an]) return false;
    const key = `${set.id}:${an}`;
    if (!force && this.spr.anims.currentAnim?.key === key && this.spr.anims.isPlaying) return true;
    this.spr.play(key);
    return true;
  }
  sync(dt: number, scene: BattleScene) {
    const u = this.u, set = SET_BY_ID[u.set];
    this.hurtLock -= dt;
    const sc = set.scale * u.scale * (u.set === 'mc' ? 1 : 1);
    this.spr.setScale(sc);
    this.spr.setPosition(u.x, u.y);
    this.spr.setFlipX(set.faceRight ? u.face === -1 : u.face === 1);
    this.spr.setDepth(u.y);
    this.shadow.setPosition(u.x, u.y + 2).setDepth(u.y - 1).setVisible(u.alive || this.spr.alpha > 0.2);
    this.shadow.setSize(set.shadow * u.scale * 0.7, 14 * Math.max(0.8, u.scale * 0.7));

    if (!u.alive) {
      if (!this.dead) {
        this.dead = true;
        if (!this.play('death', true)) {
          scene.tweens.add({ targets: this.spr, alpha: 0, angle: u.face === 1 ? -80 : 80, y: u.y + 8, duration: 500, ease: 'Quad.in' });
          scene.fxAt('fxDust', u.x, u.y - 10, 0.6);
        } else this.spr.once('animationcomplete', () => scene.tweens.add({ targets: this.spr, alpha: 0, duration: 400 }));
        this.shadow.setAlpha(0.2);
      }
      return;
    }
    // hoạt ảnh
    if (u.act === 'attack' || u.act === 'cast') {
      if (u.actId !== this.lastAct) {
        this.lastAct = u.actId;
        this.atkFlip++;
        let an = 'attack';
        if (u.set === 'mc') an = u.atkVar === 0 ? 'attack3' : u.atkVar === 1 ? 'attack' : 'attack2';
        else if (set.anims.attack2 && this.atkFlip % 2 === 0) an = 'attack2';
        if (this.play(an, true)) { this.busy = true; this.spr.anims.timeScale = Math.min(2.2, Math.max(0.6, u.aspd * 0.95)); }
      }
    }
    if (!this.busy) {
      this.spr.anims.timeScale = 1;
      if (u.stun > 0 || u.freeze > 0) { this.play('idle'); this.spr.anims.timeScale = 0.2; }
      else if (u.act === 'walk') this.play('walk');
      else this.play(u.kind === 'knight' && u.guardActive > 0 && set.anims.guard ? 'guard' : 'idle');
    }
    // trúng đòn
    if (u.hp < this.lastHp - 0.001) {
      if (set.anims.hurt && !this.busy && this.hurtLock <= 0 && u.hp > 0) { this.play('hurt', true); this.busy = true; this.hurtLock = 0.5; }
      if (Math.random() < 0.5) scene.fxAt('hit', u.x + (Math.random() - 0.5) * 16, u.y - HEAD[u.set] * 0.4 * sc, 0.55);
    }
    this.lastHp = u.hp;
    // màu trạng thái
    let tint = 0xffffff;
    if (u.hurtT > 0.12) tint = 0xffb0b0;
    else if (u.divine > 0) tint = TINT_STATUS.divine;
    else if (u.freeze > 0) tint = TINT_STATUS.freeze;
    else if (u.chaos > 0) tint = TINT_STATUS.chaos;
    else if (u.burn > 0) tint = TINT_STATUS.burn;
    else if (u.slow > 0) tint = TINT_STATUS.slow;
    else if (u.elite) tint = 0xffd0a0;
    this.spr.setTint(tint);
    this.spr.setAlpha(u.invis > 0 ? 0.35 : u.spawnIn > 0 ? 0 : u.invuln > 0 ? 0.7 : 1);
  }
  destroy() { this.spr.destroy(); this.shadow.destroy(); }
}

export class BattleScene extends Phaser.Scene {
  hud!: Hud;
  views = new Map<number, UnitView>();
  projViews = new Map<number, Phaser.GameObjects.Sprite>();
  gfx!: Phaser.GameObjects.Graphics;
  topTxt!: Phaser.GameObjects.Text;
  waveTxt!: Phaser.GameObjects.Text;
  speedBtn!: Phaser.GameObjects.Container;
  speedTxt!: Phaser.GameObjects.Text;
  squadC!: Phaser.GameObjects.Container;
  squadTxt: Phaser.GameObjects.Text[] = [];
  banner?: Phaser.GameObjects.Text;
  challengeBtn?: Phaser.GameObjects.Container;
  powTxt!: Phaser.GameObjects.Text;
  bossName!: Phaser.GameObjects.Text;
  clouds: Phaser.GameObjects.Image[] = [];
  resultShown = false;
  fxCount = 0;

  constructor() { super('Battle'); }

  create() {
    Farm.viewing = true;
    this.resultShown = false;
    this.views.clear(); this.projViews.clear();
    this.events.once('shutdown', () => { Farm.viewing = false; });
    this.cameras.main.fadeIn(250);
    this.buildBackdrop();
    this.gfx = this.add.graphics().setDepth(5000);
    this.buildUi();
  }

  // ----------------------------------------------------------------- nền
  buildBackdrop() {
    const A = ARENAS[getSave().farm];
    const map = MAPS[A.map];
    const wb = waterBg(this, map.bgWater, -10);
    this.tweens.add({ targets: wb.tile, tilePositionX: 64, tilePositionY: 32, duration: 9000, repeat: -1 });
    const cols = 22, rows = 11, y0 = 96;
    const mask = makeMask(cols, rows);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) mask[r][c] = true;
    paintIsland(this, map.tilemap, mask, -TILE, y0, true, 0);
    // phủ màu không khí
    this.add.rectangle(640, 460, 1280, 720, map.tint, 0.1).setDepth(4000).setBlendMode(Phaser.BlendModes.MULTIPLY);
    // dải tối nhẹ ở nền xa
    const fade = this.add.graphics().setDepth(2);
    fade.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.28, 0.28, 0, 0).fillRect(0, y0 + 20, 1280, 200);
    // công trình hai bên
    const enemyCol = A.map >= 2 ? 'Black' : 'Red';
    this.add.image(110, 330, 'castleBlue').setOrigin(0.5, 1).setScale(0.8).setDepth(331);
    this.add.image(1170, 330, 'castle' + enemyCol).setOrigin(0.5, 1).setScale(0.8).setDepth(331);
    this.add.image(300, 296, 'towerBlue').setOrigin(0.5, 1).setScale(0.55).setDepth(296);
    this.add.image(980, 296, 'tower' + enemyCol).setOrigin(0.5, 1).setScale(0.55).setDepth(296);
    // cây dọc nền xa
    let seed = 7 + A.map * 31;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    for (let i = 0; i < 24; i++) {
      const x = 20 + i * 54 + rnd() * 20, y = 214 + rnd() * 80;
      if (Math.abs(x - 110) < 120 || Math.abs(x - 1170) < 120) continue;
      const k = 'tree' + (1 + Math.floor(rnd() * 4)) + 'S';
      const sp = this.add.sprite(x, y, k).setOrigin(0.5, 0.88).setScale(0.55 + rnd() * 0.2).setDepth(y);
      sp.play({ key: k, startFrame: Math.floor(rnd() * 8) });
      if (map.decor === 'snow') sp.setTint(0xe0ecff); else if (map.decor === 'dark') sp.setTint(0x9a8ab0);
    }
    for (let i = 0; i < 9; i++) {
      const x = 30 + rnd() * 1220, y = 640 + rnd() * 60;
      const kind = rnd();
      if (kind < 0.4) { const sp = this.add.sprite(x, y, 'bush1S').setOrigin(0.5, 0.8).setScale(0.5).setDepth(y); sp.play({ key: 'bush1S', startFrame: Math.floor(rnd() * 8) }); }
      else this.add.image(x, y, 'rock' + (1 + Math.floor(rnd() * 4))).setOrigin(0.5, 0.8).setDepth(y);
    }
    for (let i = 0; i < 3; i++) this.clouds.push(this.add.image(-200 + i * 520, 90 + i * 70, 'cloud' + (1 + i)).setAlpha(0.7).setDepth(4500).setScale(1.1));
  }

  // ----------------------------------------------------------------- ui
  buildUi() {
    this.hud = new Hud(this);
    const S = getSave();
    // tiêu đề Arena + đợt
    const A = ARENAS[S.farm];
    const tc = this.add.container(640, 70).setDepth(6000);
    tc.add(panel(this, -170, 0, 340, 52, false, 0.4));
    this.topTxt = T(this, 0, 26, '', 24, { origin: [0.5, 0.5], color: '#3b2a14', stroke: '#fff3cc', sw: 0 });
    tc.add(this.topTxt);
    this.waveTxt = T(this, 640, 128, '', 20, { origin: [0.5, 0.5], color: '#ffe9a8' }).setDepth(6000);
    this.bossName = T(this, 640, 152, '', 22, { origin: [0.5, 0.5], color: '#ffb0a0' }).setDepth(6000);
    // nút phải trên
    iconButton(this, 1236, 36, 'icon8', () => { this.scene.start('World'); }, true, 56).setDepth(6000);
    this.speedBtn = this.add.container(1160, 36).setDepth(6000);
    const sb = this.add.image(0, 0, 'roundBlue').setDisplaySize(56, 56);
    this.speedTxt = T(this, 0, -2, `x${S.speed}`, 22, { origin: [0.5, 0.5] });
    this.speedBtn.add([sb, this.speedTxt]).setSize(56, 56).setInteractive({ useHandCursor: true });
    this.speedBtn.on('pointerup', () => { S.speed = S.speed >= 3 ? 1 : S.speed + 1; this.speedTxt.setText(`x${S.speed}`); save(true); });
    // quân số (dưới trái)
    this.squadC = this.add.container(16, 640).setDepth(6000);
    this.drawSquad();
    // lực chiến & nút khiêu chiến (dưới phải)
    this.powTxt = T(this, 1264, 596, '', 22, { origin: [1, 0.5], color: '#ffe9a8' }).setDepth(6000);
    if (Farm.mode === 'farm' && Farm.canChallenge()) {
      const b = button(this, 1100, 650, 300, 62, t('challenge_boss'), () => {
        if (power(getSave()) < A.recPower && false) return;
        Farm.challenge(); this.scene.restart();
      }, true, 26);
      b.c.setDepth(6000); this.challengeBtn = b.c;
      this.tweens.add({ targets: b.c, scale: 1.04, yoyo: true, repeat: -1, duration: 700 });
    } else if (Farm.mode === 'boss') {
      const b = button(this, 1100, 650, 300, 62, t('back'), () => { Farm.startFarm(); this.scene.restart(); }, false, 26);
      b.c.setDepth(6000);
    }
    // nút bản đồ
    iconButton(this, 1236, 112, 'icon11', () => this.scene.start('World'), false, 56).setDepth(6000);
  }

  drawSquad() {
    this.squadC.removeAll(true);
    this.squadTxt = [];
    const S = getSave();
    const syn = activeSynergy(S.squad);
    let x = 0;
    for (const id of S.squad) {
      const def = TROOPS[id];
      this.squadC.add(panel(this, x, 0, 150, 64, false, 0.35));
      const fr = this.add.image(x + 32, 40, `${id}:idle`, 0).setScale(id === 'pike' ? 0.26 : 0.4).setOrigin(0.5, 0.6);
      this.squadC.add(fr);
      const tx = T(this, x + 66, 18, '', 22, { color: '#3b2a14', stroke: '#fff3cc', sw: 0 });
      this.squadC.add(tx);
      this.squadTxt.push(tx);
      void def;
      x += 156;
    }
    if (syn) {
      const st = synText(syn.id, syn);
      this.squadC.add(T(this, 0, -26, `${t('synergy')}: ${st.name}`, 19, { color: '#bfffd0' }));
    }
  }

  // ----------------------------------------------------------------- FX
  fxAt(name: string, x: number, y: number, s = 1, tint?: number) {
    if (this.fxCount > 40) return;
    let key: string, sc: number;
    if (name === 'hit') { key = 'giga_hit_y'; sc = 0.9 * s; }
    else { const g = GIGA[name] ?? { n: name, s: 1 }; key = 'giga_' + g.n; sc = g.s * s * 0.75; }
    const sp = this.add.sprite(x, y, key, 0).setScale(sc).setDepth(4800).setBlendMode(Phaser.BlendModes.ADD);
    if (tint != null) sp.setTint(tint);
    this.fxCount++;
    sp.play(key);
    sp.once('animationcomplete', () => { sp.destroy(); this.fxCount--; });
  }

  floatText(x: number, y: number, s: string, c: number, big?: boolean) {
    const col = '#' + c.toString(16).padStart(6, '0');
    const tx = T(this, x, y, s, big ? 26 : 19, { origin: [0.5, 0.5], color: col }).setDepth(5200);
    tx.x += (Math.random() - 0.5) * 22;
    this.tweens.add({ targets: tx, y: y - (big ? 58 : 40), alpha: { from: 1, to: 0 }, duration: big ? 1100 : 800, ease: 'Cubic.out', onComplete: () => tx.destroy() });
    if (big) this.tweens.add({ targets: tx, scale: { from: 1.5, to: 1 }, duration: 160 });
  }

  showBanner(s: string, c: number) {
    this.banner?.destroy();
    const col = '#' + c.toString(16).padStart(6, '0');
    const b = T(this, 640, 250, s, 62, { origin: [0.5, 0.5], color: col, sw: 8 }).setDepth(5300).setAlpha(0);
    this.banner = b;
    this.tweens.add({ targets: b, alpha: 1, scale: { from: 2, to: 1 }, duration: 220, yoyo: false });
    this.tweens.add({ targets: b, alpha: 0, delay: 1100, duration: 500, onComplete: () => b.destroy() });
  }

  // ----------------------------------------------------------------- update
  update(_t: number, dtMs: number) {
    const dt = dtMs / 1000;
    Farm.update(dt);
    const b = Farm.battle!;
    this.hud.update();
    this.clouds.forEach((c, i) => { c.x += (6 + i * 3) * dt; if (c.x > 1500) c.x = -300; });

    // đồng bộ view với unit
    const alive = new Set<number>();
    for (const u of b.units) {
      alive.add(u.id);
      let v = this.views.get(u.id);
      if (!v) { v = new UnitView(this, u); this.views.set(u.id, v); }
      v.u = u;
      v.sync(dt, this);
    }
    for (const [id, v] of this.views) if (!alive.has(id)) { v.destroy(); this.views.delete(id); }
    // view của battle cũ (đã đổi) -> dọn
    for (const [id, v] of this.views) if (v.u !== b.units.find((x) => x.id === id)) { v.destroy(); this.views.delete(id); }

    this.syncProjs(b);
    this.drawBars(b);
    this.consumeEvents(b);
    this.updateText(b);

    if (Farm.result && !this.resultShown) {
      this.resultShown = true;
      this.scene.launch('Result');
    }
  }

  syncProjs(b: Battle) {
    const live = new Set<number>();
    for (const p of b.projs) {
      live.add(p.id);
      let s = this.projViews.get(p.id);
      if (!s) { s = this.makeProj(p); this.projViews.set(p.id, s); }
      const ang = Math.atan2(p.ty - p.y, p.tx - p.x);
      s.setPosition(p.x, p.y).setDepth(p.y + 200);
      if (p.kind === 'arrow') s.setRotation(ang);
    }
    for (const [id, s] of this.projViews) if (!live.has(id)) { s.destroy(); this.projViews.delete(id); }
  }

  makeProj(p: Proj): Phaser.GameObjects.Sprite {
    let s: Phaser.GameObjects.Sprite;
    if (p.kind === 'arrow') { s = this.add.sprite(p.x, p.y, p.team === 0 ? 'arrowBlue' : 'arrowRed').setScale(0.7); }
    else if (p.kind === 'fire') { s = this.add.sprite(p.x, p.y, 'fxFire').setScale(1.1).setBlendMode(Phaser.BlendModes.ADD); s.play({ key: 'fxFire', repeat: -1 }); }
    else if (p.kind === 'ice') { s = this.add.sprite(p.x, p.y, 'giga_sparkle_b', 0).setScale(1.2).setBlendMode(Phaser.BlendModes.ADD); s.play({ key: 'giga_sparkle_b', repeat: -1 }); }
    else if (p.kind === 'wave') { s = this.add.sprite(p.x, p.y, 'giga_slash', 0).setScale(1.6).setBlendMode(Phaser.BlendModes.ADD); s.play({ key: 'giga_slash', repeat: -1 }); }
    else if (p.kind === 'bolt') { s = this.add.sprite(p.x, p.y, 'giga_zap2', 0).setScale(0.9).setBlendMode(Phaser.BlendModes.ADD); s.play({ key: 'giga_zap2', repeat: -1 }); }
    else { s = this.add.sprite(p.x, p.y, 'giga_sparkle_g', 0).setScale(1.1).setTint(0xcc88ff).setBlendMode(Phaser.BlendModes.ADD); s.play({ key: 'giga_sparkle_g', repeat: -1 }); }
    if (p.kind === 'arrow' && p.team === 0 && p.src.kind !== 'archer') s.setTint(0xffe08a);
    return s;
  }

  drawBars(b: Battle) {
    const g = this.gfx;
    g.clear();
    for (const u of b.units) {
      if (!u.alive || u.spawnIn > 0) continue;
      const showAlways = u === b.mc || u.isBoss;
      if (!showAlways && u.hp >= u.maxHp * 0.999) continue;
      const set = SET_BY_ID[u.set];
      const w = u.isBoss ? 120 : u === b.mc ? 70 : 38;
      const y = u.y - (HEAD[u.set] ?? 100) * set.scale * u.scale - 10;
      const x = u.x - w / 2;
      const col = u.team === 0 ? (u === b.mc ? 0x4ad06a : 0x59b8ff) : 0xe0503a;
      drawBar(g, x, y, w, u.isBoss ? 9 : 6, u.hp / u.maxHp, col);
      if (u.shield > 0) { g.fillStyle(0x9fd0ff, 0.9).fillRect(x, y - 4, Math.min(1, u.shield / u.maxHp) * w, 3); }
      if (u.stun > 0) { for (let i = 0; i < 3; i++) { const a = this.time.now / 200 + i * 2.1; g.fillStyle(0xffe14a, 1).fillCircle(u.x + Math.cos(a) * 14, y - 12 + Math.sin(a) * 4, 3); } }
    }
    // thanh MC lớn (trên cùng trái)
    const mc = b.mc;
    const bx = 16, by = 88, bw = 330;
    g.setDepth(5000);
    drawBar(g, bx + 50, by + 6, bw, 16, mc.hp / mc.maxHp, mc.alive ? 0x4ad06a : 0x777777);
    if (mc.shield > 0) g.fillStyle(0x9fd0ff, 0.95).fillRect(bx + 50, by + 6, Math.min(1, mc.shield / mc.maxHp) * bw, 6);
  }

  consumeEvents(b: Battle) {
    for (const e of b.events) {
      if (e.k === 'text') this.floatText(e.x, e.y, e.s, e.c, e.big);
      else if (e.k === 'fx') this.fxAt(e.n, e.x, e.y, e.s ?? 1, e.tint);
      else if (e.k === 'banner') this.showBanner(e.s, e.c);
      else if (e.k === 'shake') this.cameras.main.shake(180, 0.004 * (e.a / 6));
    }
    b.events.length = 0;
  }

  mcLabel?: Phaser.GameObjects.Text;
  updateText(b: Battle) {
    const S = getSave();
    const A = ARENAS[S.farm];
    this.topTxt.setText(`${t('arena')} ${A.index + 1} · ${A.name}`);
    if (Farm.mode === 'boss') this.waveTxt.setText(`${t('wave')} ${Math.min(b.wave, b.waves.length)}/${b.waves.length}`);
    else this.waveTxt.setText(`${t('farming')} · ${t('wave')} ${b.wave}`);
    const boss = b.units.find((u) => u.isBoss && u.alive);
    this.bossName.setText(boss ? `${t('boss')}  ${fmt(boss.hp)}/${fmt(boss.maxHp)}` : '');
    if (!this.mcLabel) this.mcLabel = T(this, 70, 90, '', 16, { color: '#ffffff' }).setDepth(6000);
    this.mcLabel.setText(`${t('mc_hero')}  ${fmt(b.mc.hp)}/${fmt(b.mc.maxHp)}`);
    this.mcLabel.setPosition(66, 90);
    const p = power(S);
    this.powTxt.setText(`${t('power')} ${fmt(p)} / ${t('rec_power')} ${fmt(A.recPower)}`);
    this.powTxt.setColor(p >= A.recPower ? '#aef0b0' : '#ffb0a0');
    // quân số
    S.squad.forEach((id: TroopId, i: number) => {
      const total = troopCount(S, id);
      const alive = b.units.filter((u) => u.alive && u.troop === id).length;
      const slots = b.slots.filter((s) => s.troop === id && !s.unit && s.timer > 0);
      const rs = slots.length ? Math.min(...slots.map((s) => s.timer)) : 0;
      const tx = this.squadTxt[i];
      if (tx) tx.setText(`${alive}/${total}` + (rs > 0 ? `  ${rs.toFixed(0)}s` : ''));
    });
    void troopText; void getLang; void FIELD;
  }
}
