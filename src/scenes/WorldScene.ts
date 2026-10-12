import Phaser from 'phaser';
import { ARENAS, ARENAS_PER_MAP, MAPS, TOTAL_ARENAS } from '../data/arenas';
import { Farm } from '../core/farm';
import { fmt, getSave, power, save } from '../core/state';
import { Hud } from '../ui/hud';
import { achvFrame, button, iconButton, iconButtonFrame, modalBack, nine, panel, T, toast } from '../ui/kit';
import { anyClaimable, loginReady } from '../core/progress';
import { fillGrass, makeMask, paintIsland, waterBg, TILE } from '../ui/terrain';
import { getLang, t } from '../i18n';

const KINDS = ['house', 'archery', 'house', 'barracks', 'tower', 'monastery', 'house', 'barracks', 'archery', 'tower', 'monastery', 'castle'];
const BSCALE: Record<string, number> = { house: 0.55, archery: 0.5, barracks: 0.5, tower: 0.55, monastery: 0.42, castle: 0.62 };

function rngSeed(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

export class WorldScene extends Phaser.Scene {
  hud!: Hud;
  mapIdx = 0;
  sel = 0;
  layer!: Phaser.GameObjects.Container;
  info!: Phaser.GameObjects.Container;
  mapTitle!: Phaser.GameObjects.Text;
  chestTxt!: Phaser.GameObjects.Text;
  chestBar!: Phaser.GameObjects.Graphics;
  chestBtn!: Phaser.GameObjects.Container;
  pulse: Phaser.GameObjects.Image[] = [];
  clouds: Phaser.GameObjects.Image[] = [];
  mini?: Phaser.GameObjects.Container;
  boundChange = () => { this.buildInfo(); this.buildMini(); };

  constructor() { super('World'); }

  create() {
    const S = getSave();
    Farm.viewing = false;
    this.mini = undefined; this.selRing = undefined; this.info = undefined as unknown as Phaser.GameObjects.Container; this.layer = undefined as unknown as Phaser.GameObjects.Container; this.clouds = []; this.pulse = []; this.showBubble = false;
    this.mapIdx = Math.min(MAPS.length - 1, Math.floor(S.farm / ARENAS_PER_MAP));
    this.sel = S.farm;
    this.cameras.main.fadeIn(250);
    this.buildMap();
    this.buildUi();
    Farm.listeners.push(this.boundChange);
    this.events.once('shutdown', () => { Farm.listeners = Farm.listeners.filter((l) => l !== this.boundChange); });
    if (Farm.offline) this.offlinePopup();
    else if (!Farm.loginShown && loginReady(getSave())) { Farm.loginShown = true; this.time.delayedCall(400, () => this.scene.start('Quests', { tab: 'login' })); }
  }

  // ---------------------------------------------------------------- map
  buildMap() {
    this.layer?.destroy(true);
    this.pulse = [];
    const map = MAPS[this.mapIdx];
    const S = getSave();
    const L = this.add.container(0, 0);
    this.layer = L;
    const rnd = rngSeed(1337 + this.mapIdx * 977);
    const arenas = ARENAS.filter((a) => a.map === this.mapIdx);
    const add = <T extends Phaser.GameObjects.GameObject>(o: T): T => { L.add(o); return o; };

    // nền nước
    const wb = waterBg(this, map.bgWater, -10);
    add(wb.g); add(wb.tile);
    this.tweens.add({ targets: wb.tile, tilePositionX: 64, tilePositionY: 32, duration: 9000, repeat: -1 });

    // mặt nạ đất = hợp các vòng quanh node + đường nối
    const cols = 20, rows = 12, y0 = -24;
    const mask = makeMask(cols, rows);
    const near = (px: number, py: number) => {
      for (const a of arenas) if (Math.hypot(a.x - px, a.y - py) < 118) return true;
      for (let i = 0; i < arenas.length - 1; i++) {
        const a = arenas[i], b = arenas[i + 1];
        const dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy;
        const tt = Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / l2));
        if (Math.hypot(px - (a.x + dx * tt), py - (a.y + dy * tt)) < 58) return true;
      }
      return false;
    };
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) mask[r][c] = near(c * TILE + 32, y0 + r * TILE + 32);
    // lấp lỗ đơn lẻ
    for (let r = 1; r < rows - 1; r++) for (let c = 1; c < cols - 1; c++) {
      if (!mask[r][c] && mask[r - 1][c] && mask[r + 1][c] && mask[r][c - 1] && mask[r][c + 1]) mask[r][c] = true;
    }
    // đá nổi trên nước
    for (let i = 0; i < 9; i++) {
      const x = rnd() * 1240 + 20, y = rnd() * 680 + 20;
      if (near(x, y)) continue;
      const k = 'wrock' + (1 + Math.floor(rnd() * 2)) + 'S';
      const s = add(this.add.sprite(x, y, k).setDepth(-5).setScale(1.4));
      s.play({ key: k, startFrame: Math.floor(rnd() * 8) });
    }
    const isl = paintIsland(this, map.tilemap, mask, 0, y0, true, 0);
    isl.objs.forEach((o) => L.add(o));

    // đường mòn nối các Arena
    const road = add(this.add.graphics().setDepth(1.2));
    for (let pass = 0; pass < 2; pass++) {
      road.lineStyle(pass === 0 ? 24 : 15, pass === 0 ? 0x6f5a32 : 0xe3cf94, pass === 0 ? 0.85 : 1);
      road.beginPath(); road.moveTo(arenas[0].x, arenas[0].y);
      for (let i = 1; i < arenas.length; i++) {
        const a = arenas[i - 1], b = arenas[i];
        const mx = (a.x + b.x) / 2 + (i % 2 ? 22 : -22), my = (a.y + b.y) / 2 + (i % 2 ? -14 : 14);
        const steps = 14;
        for (let s = 1; s <= steps; s++) {
          const tt = s / steps;
          const x = (1 - tt) * (1 - tt) * a.x + 2 * (1 - tt) * tt * mx + tt * tt * b.x;
          const y = (1 - tt) * (1 - tt) * a.y + 2 * (1 - tt) * tt * my + tt * tt * b.y;
          road.lineTo(x, y);
        }
      }
      road.strokePath();
    }

    // trang trí: cây, đá vàng, cừu
    const used: { x: number; y: number }[] = arenas.map((a) => ({ x: a.x, y: a.y }));
    const decorSet: ('tree' | 'rock' | 'sheep' | 'bush' | 'gold')[] = map.decor === 'snow' ? ['tree', 'rock', 'rock', 'bush'] : map.decor === 'dark' ? ['tree', 'rock', 'gold', 'rock'] : ['tree', 'tree', 'bush', 'sheep', 'rock', 'gold'];
    let tries = 0, placed = 0;
    while (placed < 46 && tries++ < 700) {
      const x = rnd() * 1260 + 10, y = rnd() * 690 + 15;
      const c = Math.floor(x / TILE), r = Math.floor((y - y0) / TILE);
      if (r < 1 || r >= rows - 1 || c < 1 || c >= cols - 1 || !mask[r][c] || !mask[r + 1]?.[c]) continue;
      if (!mask[r][c - 1] || !mask[r][c + 1]) continue;
      if (used.some((u) => Math.hypot(u.x - x, u.y - y) < 80)) continue;
      let onRoad = false;
      for (let i = 0; i < arenas.length - 1; i++) {
        const a = arenas[i], b = arenas[i + 1];
        const dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy;
        const tt = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / l2));
        if (Math.hypot(x - (a.x + dx * tt), y - (a.y + dy * tt)) < 60) { onRoad = true; break; }
      }
      if (onRoad) continue;
      used.push({ x, y }); placed++;
      const kind = decorSet[Math.floor(rnd() * decorSet.length)];
      if (kind === 'tree') {
        const n = 1 + Math.floor(rnd() * 4);
        const k = 'tree' + n + 'S';
        const sp = add(this.add.sprite(x, y + 20, k).setOrigin(0.5, 0.88).setScale(0.62 + rnd() * 0.18).setDepth(y));
        sp.play({ key: k, startFrame: Math.floor(rnd() * 8) });
        if (map.decor === 'snow') sp.setTint(0xdfeaff);
        if (map.decor === 'dark') sp.setTint(0x9a8ab0);
      } else if (kind === 'bush') {
        const k = 'bush' + (1 + Math.floor(rnd() * 2)) + 'S';
        const sp = add(this.add.sprite(x, y + 10, k).setOrigin(0.5, 0.8).setScale(0.55).setDepth(y));
        sp.play({ key: k, startFrame: Math.floor(rnd() * 8) });
      } else if (kind === 'sheep') {
        const sp = add(this.add.sprite(x, y + 10, 'sheepGrassS').setOrigin(0.5, 0.8).setScale(0.5).setDepth(y));
        sp.play({ key: 'sheepGrassS', startFrame: Math.floor(rnd() * 12) });
      } else if (kind === 'gold') {
        add(this.add.image(x, y + 10, rnd() < 0.5 ? 'goldStone' : 'goldStone2').setOrigin(0.5, 0.8).setScale(0.55).setDepth(y));
      } else {
        add(this.add.image(x, y + 10, 'rock' + (1 + Math.floor(rnd() * 4))).setOrigin(0.5, 0.8).setScale(0.9).setDepth(y));
      }
    }

    // các Arena
    const nodesShown = arenas;
    for (const a of nodesShown) {
      const locked = a.index > S.unlocked;
      const cleared = a.index < S.unlocked || (S.done && a.index <= S.unlocked);
      const farming = a.index === S.farm;
      const kind = KINDS[a.local];
      const color = locked ? 'Black' : cleared ? 'Blue' : 'Red';
      let key = kind + color;
      if (!this.textures.exists(key)) key = locked ? 'barracksBlack' : kind + 'Blue';
      const b = add(this.add.image(a.x, a.y + 8, key).setOrigin(0.5, 0.9).setScale(BSCALE[kind]).setDepth(a.y));
      if (locked) b.setTint(0x8a8a9a);
      // đèn hiệu / cờ khi đang farm
      if (farming) {
        const ring = add(this.add.sprite(a.x, a.y + 18, 'giga_ring_y', 0).setScale(1.4).setDepth(a.y - 1).setAlpha(0.9));
        ring.play({ key: 'giga_ring_y', repeat: -1, frameRate: 9 });
      }
      // bảng tên
      const label = a.name;
      const w = Math.max(96, label.length * 12 + 56);
      const plate = add(this.add.container(a.x, a.y + 28).setDepth(a.y + 1));
      const bg = panel(this, -w / 2, -4, w, 34, locked, 0.38);
      const lv = this.add.rectangle(-w / 2 + 6, 13, 36, 20, locked ? 0x6b6b78 : 0x2f6dd8).setStrokeStyle(2, 0xffffff).setAngle(0);
      const lvT = T(this, -w / 2 + 6, 13, String(a.index + 1), 17, { origin: [0.5, 0.5] });
      const nm = T(this, 12, 13, label.toUpperCase(), 19, locked ? { origin: [0.5, 0.5], color: '#e6e6f0' } : { origin: [0.5, 0.5], color: '#3b2a14', stroke: '#fff3cc', sw: 0 });
      plate.add([bg, lv, lvT, nm]);
      if (a.isLastOfMap) { const cr = add(this.add.image(a.x, a.y - 120, 'icon5').setDisplaySize(36, 36).setDepth(a.y + 2)); this.tweens.add({ targets: cr, y: cr.y - 6, yoyo: true, repeat: -1, duration: 800 }); }
      if (locked) { const lk = T(this, a.x, a.y - 54, '🔒', 26, { origin: [0.5, 0.5] }).setDepth(a.y + 2); add(lk); }
      // vùng bấm
      const hit = add(this.add.rectangle(a.x, a.y - 10, 150, 130, 0xffffff, 0.001).setDepth(5000).setInteractive({ useHandCursor: true }));
      hit.on('pointerdown', () => { this.sel = a.index; this.showBubble = true; this.buildInfo(); this.placeSel(); });
    }

    // mây trôi
    this.clouds.forEach((c) => c.destroy());
    this.clouds = [];
    for (let i = 0; i < 3; i++) {
      const c = this.add.image(-200 + i * 520, 90 + i * 220, 'cloud' + (1 + i)).setAlpha(0.8).setDepth(450).setScale(1.2);
      this.clouds.push(c);
    }
    this.placeSel();
  }

  selRing?: Phaser.GameObjects.Sprite;
  questDot!: Phaser.GameObjects.Container;
  dotT = 0;
  placeSel() {
    const a = ARENAS[this.sel];
    if (a.map !== this.mapIdx) { this.selRing?.setVisible(false); return; }
    if (!this.selRing) {
      this.selRing = this.add.sprite(0, 0, 'giga_ring_big', 0).setScale(1.2).setDepth(8000);
      this.selRing.play({ key: 'giga_ring_big', repeat: -1, frameRate: 8 });
    }
    this.selRing.setVisible(true).setPosition(a.x, a.y + 14);
  }

  // ---------------------------------------------------------------- ui
  buildUi() {
    this.hud = new Hud(this);
    // tiêu đề bản đồ ◀ ▶
    const bar = this.add.container(640, 62).setDepth(6000);
    bar.add(panel(this, -250, 0, 500, 46, false, 0.4));
    this.mapTitle = T(this, 0, 24, '', 26, { origin: [0.5, 0.5], color: '#3b2a14', stroke: '#fff3cc', sw: 0 });
    bar.add(this.mapTitle);
    const prev = iconButton(this, -285, 24, 'icon8', () => this.switchMap(-1), false, 46);
    const next = iconButton(this, 285, 24, 'icon8', () => this.switchMap(1), false, 46);
    (next.getAt(1) as Phaser.GameObjects.Image).setFlipX(true);
    bar.add([prev, next]);
    this.updateTitle();

    // nút tính năng (góc dưới trái)
    const mk = (x: number, icon: string, label: string, cb: () => void) => {
      const b = iconButton(this, x, 640, icon, cb, false, 74).setDepth(6000);
      T(this, x, 686, label, 18, { origin: [0.5, 0.5] }).setDepth(6000);
      return b;
    };
    mk(56, 'icon1', t('skills'), () => this.scene.start('Skills'));
    mk(146, 'icon6', t('army'), () => this.scene.start('Army'));
    mk(236, 'icon10', t('settings'), () => this.scene.launch('Settings'));
    mk(326, 'icon4', t('village'), () => this.scene.start('Village', { arena: getSave().farm }));
    mk(416, 'icon5', t('gear'), () => this.scene.start('Items'));
    const qb = iconButtonFrame(this, 506, 640, 'achv', achvFrame(this, 'Gift-Box-Red'), () => this.scene.start('Quests'), false, 74).setDepth(6000);
    T(this, 506, 686, t('quests'), 18, { origin: [0.5, 0.5] }).setDepth(6000);
    this.questDot = this.add.container(536, 612).setDepth(6001);
    this.questDot.add([this.add.circle(0, 0, 13, 0xe0302a).setStrokeStyle(2, 0xffffff), T(this, 0, -1, '!', 18, { origin: [0.5, 0.5] })]);
    const tb = iconButtonFrame(this, 596, 640, 'achv', achvFrame(this, 'Gold-Trophy'), () => this.scene.start('Tower'), false, 74).setDepth(6000);
    T(this, 596, 686, t('tower_short'), 18, { origin: [0.5, 0.5] }).setDepth(6000);
    void qb; void tb;

    // nút Chiến đấu lớn (góc dưới phải)
    const bb = this.add.container(1170, 606).setDepth(6000);
    const ring = this.add.image(0, 0, 'roundBlue').setDisplaySize(128, 128);
    const ic = this.add.image(0, -8, 'icon5').setDisplaySize(64, 64);
    const lb = T(this, 0, 40, t('battle'), 22, { origin: [0.5, 0.5] });
    bb.add([ring, ic, lb]);
    bb.setSize(128, 128).setInteractive({ useHandCursor: true });
    bb.on('pointerup', () => this.scene.start('Battle'));
    this.tweens.add({ targets: ic, angle: { from: -6, to: 6 }, yoyo: true, repeat: -1, duration: 900 });

    // Hòm AFK
    const ch = this.add.container(16, 96).setDepth(6000);
    ch.add(panel(this, 0, 0, 236, 74, false, 0.4));
    const icn = this.add.image(36, 38, 'stoneIcon').setDisplaySize(52, 52);
    this.chestTxt = T(this, 70, 8, '', 19, { color: '#3b2a14', stroke: '#fff3cc', sw: 0 });
    this.chestBar = this.add.graphics();
    ch.add([icn, this.chestTxt, this.chestBar]);
    ch.setSize(236, 74).setInteractive(new Phaser.Geom.Rectangle(0, 0, 236, 74), Phaser.Geom.Rectangle.Contains);
    ch.on('pointerup', () => this.claim());
    this.chestBtn = ch;

    const bg = this.add.rectangle(640, 360, 1280, 720, 0xffffff, 0.001).setDepth(-50).setInteractive();
    bg.on('pointerdown', () => { if (this.showBubble) { this.showBubble = false; this.buildInfo(); } });
    this.buildMini();
    this.buildInfo();
  }

  /** Bản đồ thu nhỏ (góc trên trái): 4 bản đồ lớn, cho biết còn map mới sau khi vượt hết Arena hiện tại */
  buildMini() {
    this.mini?.destroy(true);
    const S = getSave();
    const W = 236, H = 104;
    const c = this.add.container(16, 178).setDepth(6000);
    this.mini = c;
    c.add(panel(this, 0, 0, W, H, false, 0.4));
    const icons = ['icon4', 'icon2', 'icon9', 'icon12'];
    const done = (m: number) => S.unlocked >= (m + 1) * ARENAS_PER_MAP;
    const open = (m: number) => m * ARENAS_PER_MAP <= S.unlocked;
    const cur = Math.min(MAPS.length - 1, Math.floor(S.unlocked / ARENAS_PER_MAP));
    const nm = (m: number) => (open(m) ? MAPS[m].name[getLang()] : '???');
    c.add(T(this, W / 2, 6, `${t('world_map')} ${this.mapIdx + 1}/${MAPS.length}`, 16, { origin: [0.5, 0], color: '#3b2a14', stroke: '#fff3cc', sw: 0 }));
    const gap = 52, x0 = W / 2 - gap * 1.5;
    MAPS.forEach((m, i) => {
      const x = x0 + i * gap, y = 52;
      if (i < MAPS.length - 1) c.add(this.add.image(x + gap / 2, y, 'icon8').setDisplaySize(16, 16).setFlipX(true).setAlpha(open(i + 1) ? 1 : 0.5));
      const b = iconButton(this, x, y, icons[i], () => {
        if (!open(i)) { toast(this, t('map_locked_hint', { n: i * ARENAS_PER_MAP }), '#ffd9a0'); return; }
        this.switchMap(i - this.mapIdx);
      }, !open(i), 44);
      if (!open(i)) { (b.getAt(1) as Phaser.GameObjects.Image).setTint(0x333344).setAlpha(0.7); b.add(T(this, 0, -1, '?', 22, { origin: [0.5, 0.5], color: '#ffe9a8' })); }
      c.add(b);
      if (i === this.mapIdx) c.add(this.add.rectangle(x, y + 29, 36, 4, 0xe8a418).setStrokeStyle(1, 0x3b2a14));
      if (done(i)) c.add(this.add.circle(x + 16, y - 16, 7, 0x4ec05a).setStrokeStyle(2, 0xffffff));
    });
    const nxt = done(MAPS.length - 1) ? t('map_all_done') : t('map_next_goal', { a: (cur + 1) * ARENAS_PER_MAP - S.unlocked, n: nm(cur + 1) });
    c.add(T(this, W / 2, H - 22, nxt, 13, { origin: [0.5, 0.5], color: '#6b4a20', stroke: '#fff3cc', sw: 0, wrap: W - 16, align: 'center', ls: 0 }));
  }

  claim() {
    const S = getSave();
    if (S.chest.gold < 1 && S.chest.stones < 1) { toast(this, t('hint_1'), '#ffe9a8'); return; }
    const c = Farm.claimChest();
    toast(this, `+${fmt(c.gold)} ${t('gold')}  +${fmt(c.stones)} ${t('stones')}`, '#ffe9a8');
    this.sound?.play?.('x');
  }

  switchMap(d: number) {
    const S = getSave();
    const n = this.mapIdx + d;
    if (n < 0 || n >= MAPS.length) return;
    if (n * ARENAS_PER_MAP > S.unlocked) { toast(this, t('locked'), '#ff9a8a'); return; }
    this.mapIdx = n;
    this.sel = Math.min(Math.max(this.sel, n * ARENAS_PER_MAP), n * ARENAS_PER_MAP + ARENAS_PER_MAP - 1);
    if (ARENAS[this.sel].map !== n) this.sel = n * ARENAS_PER_MAP;
    this.cameras.main.flash(200, 20, 30, 40);
    this.buildMap(); this.updateTitle(); this.buildInfo(); this.buildMini();
  }

  updateTitle() { this.mapTitle.setText(`${this.mapIdx + 1}/4  ${MAPS[this.mapIdx].name[getLang()]}`); }

  /** Bong bóng nhỏ cạnh node được chọn (thay cho thẻ thông tin to ở giữa màn hình). */
  showBubble = false;
  buildInfo() {
    this.info?.destroy(true);
    if (!this.showBubble) return;
    const S = getSave();
    const a = ARENAS[this.sel];
    if (a.map !== this.mapIdx) return;
    const W = 440, H = 100;
    let by = a.y - 60 - H - 30;
    if (by < 100) by = a.y + 60;
    const bx = Math.max(8, Math.min(1272 - W, a.x - W / 2));
    const c = this.add.container(bx, by).setDepth(6100);
    this.info = c;
    c.add(panel(this, 0, 0, W, H, false, 0.45));
    const locked = a.index > S.unlocked;
    const p = power(S);
    const ok = p >= a.recPower;
    c.add(T(this, 14, 8, `${a.index + 1} · ${a.name}`, 19, { color: '#3b2a14', stroke: '#fff3cc', sw: 0 }));
    if (locked) {
      c.add(T(this, W / 2, 62, `${t('locked')} — ${t('arena')} ${S.unlocked + 1}`, 18, { origin: [0.5, 0.5], color: '#8a3b2a', stroke: '#fff3cc', sw: 0 }));
      return;
    }
    c.add(T(this, W - 14, 8, `${fmt(p)}/${fmt(a.recPower)}`, 19, { origin: [1, 0], color: ok ? '#1f7a2a' : '#b02a1a', stroke: '#fff3cc', sw: 0 }));
    const bY = 66;
    const close = () => { this.showBubble = false; this.buildInfo(); };
    c.add(button(this, 66, bY, 110, 42, t('village'), () => this.scene.start('Village', { arena: a.index }), false, 17).c);
    const fb = button(this, 190, bY, 126, 42, 'Farm', () => { Farm.setFarmArena(a.index); this.sel = a.index; this.showBubble = false; this.buildMap(); this.buildInfo(); toast(this, `${t('farming')}: ${a.name}`, '#bfffc0'); }, false, 17);
    fb.setEnabled(S.farm !== a.index);
    c.add(fb.c);
    if (a.index === S.unlocked && a.index < TOTAL_ARENAS) {
      const cb = button(this, 346, bY, 132, 42, 'Boss', () => {
        if (power(getSave()) < ARENAS[a.index].recPower) toast(this, t('not_enough_power'), '#ff9a8a');
        Farm.setFarmArena(a.index); Farm.challenge(); this.scene.start('Battle');
      }, true, 19);
      if (!ok) cb.c.setAlpha(0.8);
      c.add(cb.c);
    }
    void close;
  }

  offlinePopup() {
    const rep = Farm.offline!;
    Farm.offline = null;
    const back = modalBack(this, 0.65).setDepth(2000);
    const c = this.add.container(640, 360).setDepth(2001);
    c.add(panel(this, -260, -170, 520, 340, true, 0.55));
    c.add(T(this, 0, -138, t('welcome_back'), 34, { origin: [0.5, 0], color: '#fff6dd' }));
    const h = Math.floor(rep.seconds / 3600), m = Math.floor((rep.seconds % 3600) / 60);
    c.add(T(this, 0, -86, `${t('away_for')} ${h}${t('hours')} ${m}m`, 24, { origin: [0.5, 0], color: '#e8d9a8' }));
    const g = rep.gained;
    c.add(T(this, 0, -36, `${t('gold')}: ${fmt(g.gold)}`, 28, { origin: [0.5, 0], color: '#ffd36b' }));
    c.add(T(this, 0, 4, `${t('stones')}: ${fmt(g.stones)}`, 28, { origin: [0.5, 0], color: '#8fd0ff' }));
    c.add(T(this, 0, 44, `${t('badges')}: ${fmt(g.badges)}`, 28, { origin: [0.5, 0], color: '#d9b8ff' }));
    if (rep.capped) c.add(T(this, 0, 88, `${t('afk_full')} (${t('afk_cap')} ${Farm.capSeconds() / 3600}${t('hours')})`, 20, { origin: [0.5, 0], color: '#ff9a8a' }));
    const btn = button(this, 0, 134, 240, 58, t('claim'), () => { Farm.claimChest(); back.destroy(); c.destroy(true); this.fxCoins(); }, false, 26);
    c.add(btn.c);
  }

  fxCoins() {
    const s = this.add.sprite(640, 330, 'giga_coins', 0).setDepth(3000).setScale(2.5);
    s.play('giga_coins'); s.once('animationcomplete', () => s.destroy());
  }

  update(_t: number, dt: number) {
    try { this.tick(dt); } catch (e) { console.error(e); }
  }
  tick(dt: number) {
    Farm.update(dt / 1000);
    this.dotT -= dt;
    if (this.dotT <= 0) { this.dotT = 800; this.questDot.setVisible(anyClaimable(getSave())); }
    this.hud.update();
    const S = getSave();
    // hòm AFK
    const fr = Farm.chestFraction();
    const capH = Farm.capSeconds() / 3600;
    this.chestTxt.setText(`${t('afk_chest')} ${(S.chestMs / 3600000).toFixed(1)}/${capH}${t('hours')}`);
    this.chestBar.clear();
    this.chestBar.fillStyle(0x3b2a14, 1).fillRect(70, 44, 150, 14);
    this.chestBar.fillStyle(fr >= 1 ? 0xe0503a : 0x6fcf5a, 1).fillRect(70, 44, 150 * fr, 14);
    this.chestBtn.setAlpha(S.chest.gold > 1 ? 1 : 0.85);
    this.clouds.forEach((c, i) => { c.x += (6 + i * 3) * dt / 1000; if (c.x > 1500) c.x = -300; });
  }
}
