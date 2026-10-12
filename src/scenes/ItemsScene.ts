import Phaser from 'phaser';
import { Item, PLUS_STEP, RARITY_COLOR, RARITY_CSS, SLOTS, Slot, StatId, itemName, salvageValue, statLine } from '../data/items';
import { Farm } from '../core/farm';
import { enhanceCost, enhanceItem, equipBonus, equipItem, equipped, fmt, getSave, isEquipped, mergeAll, mergeCount, mergeOnce, salvageItem, save, unequipSlot } from '../core/state';
import { Hud } from '../ui/hud';
import { button, iconButton, panel, T, toast } from '../ui/kit';
import { BAG_CAP } from '../data/items';
import { t } from '../i18n';

const LEFT_SLOTS: Slot[] = ['helmet', 'armor', 'boots'];
const RIGHT_SLOTS: Slot[] = ['weapon', 'ring', 'amulet'];

/** Ô vật phẩm dùng chung (túi đồ, ô mặc, kết quả...) */
export function itemCell(scene: Phaser.Scene, x: number, y: number, size: number, it: Item | null, selected = false): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  const col = it ? RARITY_COLOR[it.r] : 0x555a66;
  g.fillStyle(0x161a24, 0.92).fillRoundedRect(0, 0, size, size, 8);
  if (it) g.fillStyle(col, 0.16).fillRoundedRect(2, 2, size - 4, size - 4, 7);
  g.lineStyle(selected ? 4 : 3, selected ? 0xffe14a : col, 1).strokeRoundedRect(1, 1, size - 2, size - 2, 8);
  c.add(g);
  if (it) {
    const im = scene.add.image(size / 2, size / 2, 'items', it.icon).setDisplaySize(size - 16, size - 16);
    c.add(im);
    if ((it.plus ?? 0) > 0) c.add(T(scene, 5, 3, `+${it.plus}`, Math.max(13, size / 4.5), { color: '#ffe14a', sw: 3 }));
  }
  c.setSize(size, size);
  return c;
}

export class ItemsScene extends Phaser.Scene {
  hud!: Hud;
  tab: 'bag' | 'forge' = 'bag';
  sel: number | null = null;
  dyn!: Phaser.GameObjects.Container;
  lastMerged: Item | null = null;
  slotRects: { slot: Slot; x: number; y: number; w: number; h: number }[] = [];
  dragItem: Item | null = null;
  dragFromSlot = false;
  dragDown = { x: 0, y: 0 };
  ghost: Phaser.GameObjects.Container | null = null;
  hl: Phaser.GameObjects.Graphics | null = null;
  constructor() { super('Items'); }

  create() {
    Farm.viewing = false;
    this.cameras.main.fadeIn(200);
    this.add.rectangle(640, 360, 1280, 720, 0x1b2030);
    this.add.rectangle(640, 408, 1280, 624, 0x242b3f, 0.6);
    this.hud = new Hud(this);
    iconButton(this, 1236, 36, 'icon8', () => this.scene.start('World'), true, 56);
    const mc = this.add.sprite(225, 232, 'mc:idle', 0).setScale(4.2).setOrigin(0.5, 0.56).setDepth(5);
    mc.play('mc:idle');
    this.add.ellipse(225, 282, 120, 20, 0x000000, 0.3).setDepth(4);
    this.dyn = this.add.container(0, 0);
    this.dragItem = null; this.ghost = null; this.hl = null;
    this.input.on('pointermove', this.onMove, this);
    this.input.on('pointerup', this.onUp, this);
    this.events.once('shutdown', () => { this.input.off('pointermove', this.onMove, this); this.input.off('pointerup', this.onUp, this); });
    this.build();
  }

  /** Vùng bấm đúng bằng ô (container mặc định lệch nửa ô) */
  hit(c: Phaser.GameObjects.Container, size: number) {
    c.setInteractive(new Phaser.Geom.Rectangle(0, 0, size, size), Phaser.Geom.Rectangle.Contains);
    if (c.input) c.input.cursor = 'pointer';
  }

  beginDrag(it: Item | null, p: Phaser.Input.Pointer, fromSlot: boolean) {
    this.dragItem = it;
    this.dragFromSlot = fromSlot;
    this.dragDown = { x: p.x, y: p.y };
  }

  onMove(p: Phaser.Input.Pointer) {
    if (!this.dragItem || !p.isDown) return;
    if (!this.ghost && Math.hypot(p.x - this.dragDown.x, p.y - this.dragDown.y) > 10) {
      this.ghost = itemCell(this, 0, 0, 72, this.dragItem).setDepth(9999).setAlpha(0.9);
      // gợi ý ô đúng loại
      this.hl = this.add.graphics().setDepth(9998);
      const r = this.slotRects.find((q) => q.slot === this.dragItem!.slot);
      if (r) this.hl.lineStyle(5, 0xffe14a, 1).strokeRoundedRect(r.x - 4, r.y - 4, r.w + 8, r.h + 8, 10);
    }
    if (this.ghost) this.ghost.setPosition(p.x - 36, p.y - 36);
  }

  onUp(p: Phaser.Input.Pointer) {
    const it = this.dragItem;
    if (!it) return;
    const wasDrag = !!this.ghost;
    this.dragItem = null;
    this.ghost?.destroy(true); this.ghost = null;
    this.hl?.destroy(); this.hl = null;
    const S = getSave();
    if (!wasDrag) { this.sel = it.id; this.build(); return; } // chỉ bấm => chọn xem thuộc tính
    const over = this.slotRects.find((q) => p.x >= q.x && p.x <= q.x + q.w && p.y >= q.y && p.y <= q.y + q.h);
    if (over) {
      if (over.slot === it.slot) { equipItem(S, it); this.sel = it.id; Farm.refresh(); save(true); toast(this, `${t('worn')}: ${itemName(it)}`, RARITY_CSS[it.r]); }
      else toast(this, `${t('slot_' + over.slot)} ≠ ${t('slot_' + it.slot)}`, '#ff9a8a');
    } else if (this.dragFromSlot && p.x > 440) {
      unequipSlot(S, it.slot); Farm.refresh(); save(true);
    }
    this.build();
  }

  build() {
    this.dyn.destroy(true);
    this.slotRects = [];
    const S = getSave();
    const c = this.add.container(0, 0);
    this.dyn = c;

    // ---- khung mặc đồ
    c.add(panel(this, 16, 96, 418, 330, false, 0.45));
    const place = (slots: Slot[], x: number) => slots.forEach((sl, i) => {
      const id = S.equip[sl];
      const it = id != null ? S.items.find((v) => v.id === id) ?? null : null;
      const cell = itemCell(this, x, 116 + i * 96, 80, it, !!it && it.id === this.sel);
      this.hit(cell, 80);
      this.slotRects.push({ slot: sl, x, y: 116 + i * 96, w: 80, h: 80 });
      cell.on('pointerdown', (p: Phaser.Input.Pointer) => { if (it) this.beginDrag(it, p, true); else { this.sel = null; this.build(); } });
      c.add(cell);
      if (!it) {
        c.add(T(this, x + 40, 116 + i * 96 + 40, t('slot_' + sl), 15, { origin: [0.5, 0.5], color: '#9aa0b0' }));
      }
    });
    place(LEFT_SLOTS, 32);
    place(RIGHT_SLOTS, 322);

    // ---- cộng thêm từ trang bị
    const eb = equipBonus(S);
    const lines = (Object.keys(eb) as StatId[]).filter((k) => eb[k] > 0.0005).map((k) => statLine(k, eb[k]));
    c.add(T(this, 20, 432, t('equip_bonus') + ':', 15, { color: '#ffe9a8' }));
    c.add(T(this, 20, 452, lines.length ? lines.join('  ·  ') : '—', 14, { color: '#d8f2c8', wrap: 410, ls: 0 }));

    // ---- thẻ chi tiết vật phẩm đang chọn
    this.detail(c);

    // ---- tab
    const tb1 = button(this, 540, 112, 190, 44, `${t('bag')} ${S.items.length}/${BAG_CAP}`, () => { this.tab = 'bag'; this.build(); }, this.tab !== 'bag', 19);
    const tb2 = button(this, 740, 112, 190, 44, t('forge_tab'), () => { this.tab = 'forge'; this.build(); }, this.tab !== 'forge', 19);
    c.add([tb1.c, tb2.c]);
    if (this.tab === 'bag') this.bagGrid(c); else this.forge(c);
  }

  detail(c: Phaser.GameObjects.Container) {
    const S = getSave();
    const it = this.sel != null ? S.items.find((v) => v.id === this.sel) : undefined;
    c.add(panel(this, 16, 492, 418, 218, false, 0.45));
    if (!it) { c.add(T(this, 225, 600, t('item_drop_hint'), 16, { origin: [0.5, 0.5], color: '#5a4524', stroke: '#fff3cc', sw: 0, wrap: 380, align: 'center' })); return; }
    c.add(itemCell(this, 32, 510, 76, it));
    c.add(T(this, 120, 512, itemName(it) + ((it.plus ?? 0) > 0 ? ` +${it.plus}` : ''), 22, { color: RARITY_CSS[it.r], stroke: '#2a1c0a', sw: 3 }));
    const st: [StatId, number][] = [it.main, ...it.aff];
    const kPlus = 1 + PLUS_STEP * (it.plus ?? 0);
    c.add(T(this, 120, 540, st.map(([s, v]) => statLine(s, v * kPlus)).join('\n'), 16, { color: '#3b2a14', stroke: '#fff3cc', sw: 0, ls: 1 }));
    const worn = isEquipped(S, it);
    const b1 = button(this, 84, 686, 124, 40, worn ? t('unequip') : t('equip'), () => {
      const s = getSave();
      if (worn) unequipSlot(s, it.slot); else equipItem(s, it);
      Farm.refresh(); save(true); this.build();
    }, false, 18);
    c.add(b1.c);
    // cường hóa: chỗ tiêu Đá + Vàng không giới hạn
    const ec = enhanceCost(S, it);
    if (ec) {
      const ok = S.stones >= ec.stones && S.gold >= ec.gold;
      const col = ok ? '#1f5f9a' : '#b02a1a';
      c.add(this.add.image(110, 646, 'stoneIcon').setDisplaySize(30, 30));
      c.add(T(this, 134, 646, fmt(ec.stones), 17, { origin: [0, 0.5], color: col, stroke: '#fff3cc', sw: 0 }));
      c.add(this.add.image(260, 646, 'icon3').setDisplaySize(24, 24));
      c.add(T(this, 277, 646, fmt(ec.gold), 17, { origin: [0, 0.5], color: col, stroke: '#fff3cc', sw: 0 }));
    }
    const eb = button(this, 225, 686, 136, 40, ec ? `${t('enhance')} +${(it.plus ?? 0) + 1}` : t('enhance_max'), () => {
      const s = getSave();
      if (enhanceItem(s, it)) { Farm.refresh(); save(true); toast(this, `${itemName(it)} +${it.plus}`, '#ffe14a'); this.build(); }
      else toast(this, t('enhance_need'), '#ff9a8a');
    }, false, 16);
    eb.setEnabled(!!ec && S.stones >= ec.stones && S.gold >= ec.gold);
    c.add(eb.c);
    const val = salvageValue(it, S.unlocked);
    const b2 = button(this, 366, 686, 124, 40, (it.plus ?? 0) > 0 ? t('salvage') : `${t('salvage')} +${fmt(val)}`, () => {
      const s = getSave();
      const v = salvageItem(s, it);
      if (v > 0) { toast(this, `+${fmt(v)} ${t('stones')}`, '#8fe0ff'); this.sel = null; save(true); this.build(); }
    }, true, 15);
    b2.setEnabled(!worn && !(it.plus ?? 0));
    c.add(b2.c);
  }

  bagGrid(c: Phaser.GameObjects.Container) {
    const S = getSave();
    const items = S.items.slice().sort((a, b) => b.r - a.r || a.slot.localeCompare(b.slot) || b.id - a.id);
    const cell = 74, gap = 8, cols = 10, x0 = 452, y0 = 150;
    if (!items.length) c.add(T(this, 860, 380, t('no_items'), 28, { origin: [0.5, 0.5], color: '#9aa0b0' }));
    items.forEach((it, i) => {
      const x = x0 + (i % cols) * (cell + gap), y = y0 + Math.floor(i / cols) * (cell + gap);
      const cc = itemCell(this, x, y, cell, it, it.id === this.sel);
      this.hit(cc, cell);
      cc.on('pointerdown', (p: Phaser.Input.Pointer) => this.beginDrag(it, p, false));
      c.add(cc);
      if (isEquipped(S, it)) c.add(T(this, x + cell - 4, y + 3, '✔', 18, { origin: [1, 0], color: '#7dff9a' }));
    });
    if (S.items.length >= BAG_CAP) c.add(T(this, 860, 670, t('bag_full'), 18, { origin: [0.5, 0.5], color: '#ffb0a0' }));
  }

  forge(c: Phaser.GameObjects.Container) {
    const S = getSave();
    c.add(T(this, 452, 156, t('forge_hint'), 18, { color: '#d8e0ff', wrap: 800 }));
    for (let r = 0; r < 4; r++) {
      const y = 200 + r * 96;
      c.add(panel(this, 452, y, 808, 86, false, 0.4));
      const can = mergeCount(S, r);
      const total = S.items.filter((x) => x.r === r).length;
      c.add(T(this, 476, y + 14, `${t('rarity_' + r)} → ${t('rarity_' + (r + 1))}`, 22, { color: '#3b2a14', stroke: '#fff3cc', sw: 0 }));
      c.add(T(this, 476, y + 46, `${t('items_total')}: ${total}  ·  ${t('merge3')}: ×${can}`, 18, { color: '#6b4a20', stroke: '#fff3cc', sw: 0 }));
      const b1 = button(this, 900, y + 43, 170, 46, t('merge3'), () => {
        const s = getSave();
        let n: Item | null = null;
        for (const sl of SLOTS) { n = mergeOnce(s, sl, r); if (n) break; }
        if (n) { this.lastMerged = n; this.sel = n.id; Farm.refresh(); save(true); toast(this, `${t('merged')}: ${itemName(n)}`, RARITY_CSS[n.r]); this.build(); }
        else toast(this, t('merge_none'), '#ff9a8a');
      }, false, 19);
      b1.setEnabled(can > 0);
      const b2 = button(this, 1090, y + 43, 170, 46, t('merge_all'), () => {
        const s = getSave();
        const out = mergeAll(s, r);
        if (out.length) { this.lastMerged = out[out.length - 1]; this.sel = this.lastMerged.id; Farm.refresh(); save(true); toast(this, `${t('merged')} ×${out.length}`, RARITY_CSS[r + 1]); this.build(); }
      }, true, 19);
      b2.setEnabled(can > 0);
      c.add([b1.c, b2.c]);
    }
    if (this.lastMerged) {
      c.add(T(this, 452, 596, `${t('merged')}:`, 18, { color: '#ffe9a8' }));
      c.add(itemCell(this, 540, 580, 64, this.lastMerged));
      c.add(T(this, 618, 600, itemName(this.lastMerged), 22, { color: RARITY_CSS[this.lastMerged.r] }));
    }
  }

  update(_t: number, dt: number) {
    try { Farm.update(dt / 1000); this.hud.update(); } catch (e) { console.error(e); }
    void equipped;
  }
}
