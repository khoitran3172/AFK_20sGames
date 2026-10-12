import Phaser from 'phaser';
import { Farm } from '../core/farm';
import { fmt, getSave, save } from '../core/state';
import {
  ACHS, Reward, achClaimed, achReady, achReward, achValue, claimAch, claimDaily, claimDailyBonus, claimLogin, dailyBonusReady, dailyDone, dailyProg,
  dailyReward, ensureDaily, loginReward, loginState, reward,
} from '../core/progress';
import { Item, RARITY_CSS, itemName } from '../data/items';
import { Hud } from '../ui/hud';
import { achvIcon, button, drawBar, iconButton, panel, T, toast } from '../ui/kit';
import { getLang, t } from '../i18n';
import { itemCell } from './ItemsScene';

type Tab = 'daily' | 'ach' | 'login';
const TIER_NAME = ['bronze', 'silver', 'gold_t'];
const TIER_ICO = ['Bronze', 'Silver', 'Gold'];

export class QuestScene extends Phaser.Scene {
  hud!: Hud;
  tab: Tab = 'daily';
  dyn!: Phaser.GameObjects.Container;
  gfx!: Phaser.GameObjects.Graphics;
  constructor() { super('Quests'); }
  init(d: { tab?: Tab }) { this.tab = d?.tab ?? 'daily'; }

  create() {
    Farm.viewing = false;
    this.cameras.main.fadeIn(200);
    this.add.rectangle(640, 360, 1280, 720, 0x1d2338);
    this.add.rectangle(640, 410, 1280, 620, 0x2a3250, 0.6);
    this.hud = new Hud(this);
    iconButton(this, 1236, 36, 'icon8', () => this.scene.start('World'), true, 56);
    this.dyn = this.add.container(0, 0);
    this.gfx = this.add.graphics().setDepth(20);
    this.build();
  }

  rewardText(r: Reward) {
    const parts = [`${fmt(r.gold)} ${t('gold')}`, `${fmt(r.stones)} ${t('stones')}`];
    if (r.badges >= 1) parts.push(`${fmt(r.badges)} ${t('badges')}`);
    return '+' + parts.join('  +');
  }

  build() {
    this.dyn.destroy(true);
    this.gfx.clear();
    const c = this.add.container(0, 0);
    this.dyn = c;
    const tabs: [Tab, string][] = [['daily', t('daily')], ['ach', t('ach_tab')], ['login', t('login_tab')]];
    tabs.forEach(([k, label], i) => {
      const b = button(this, 330 + i * 310, 108, 290, 46, label, () => { this.tab = k; this.build(); }, this.tab !== k, 21);
      c.add(b.c);
    });
    if (this.tab === 'daily') this.buildDaily(c);
    else if (this.tab === 'ach') this.buildAch(c);
    else this.buildLogin(c);
  }

  // ------------------------------------------------------------ daily
  buildDaily(c: Phaser.GameObjects.Container) {
    const S = getSave();
    const d = ensureDaily(S);
    c.add(T(this, 640, 150, t('daily_reset'), 16, { origin: [0.5, 0], color: '#a8b4d8' }));
    d.quests.forEach((q, i) => {
      const y = 178 + i * 86;
      c.add(panel(this, 180, y, 920, 78, false, 0.4));
      c.add(achvIcon(this, 224, y + 39, d.quests[i].claimed ? 'Gift-Box-Blue-Open-' : 'Gift-Box-Blue', 48));
      c.add(T(this, 262, y + 8, t('q_' + q.key, { n: q.target }), 21, { color: '#3b2a14', stroke: '#fff3cc', sw: 0 }));
      const prog = dailyProg(S, i);
      drawBar(this.gfx, 262, y + 44, 360, 14, prog / q.target, 0x5fcf6a, 0x3b2a14);
      c.add(T(this, 632, y + 38, `${Math.floor(prog)}/${q.target}`, 16, { color: '#3b2a14', stroke: '#fff3cc', sw: 0 }));
      c.add(T(this, 700, y + 44, this.rewardText(dailyReward(S)), 14, { color: '#6b4a20', stroke: '#fff3cc', sw: 0, wrap: 220 }));
      const done = dailyDone(S, i);
      const b = button(this, 1020, y + 39, 140, 46, q.claimed ? t('claimed') : t('claim'), () => {
        const r = claimDaily(getSave(), i);
        if (r) { toast(this, this.rewardText(r), '#ffe9a8'); save(true); this.build(); }
      }, false, 19);
      b.setEnabled(done && !q.claimed);
      c.add(b.c);
    });
    // thưởng thêm
    const y = 612;
    c.add(panel(this, 180, y, 920, 78, true, 0.4));
    c.add(achvIcon(this, 224, y + 39, d.bonusClaimed ? 'Gold-Chest-3_4-Opened' : 'Silver-Chest', 52));
    c.add(T(this, 262, y + 12, t('all_done_bonus'), 21, { color: '#fff6dd' }));
    c.add(T(this, 262, y + 44, `+${t('reward_item')} (${t('rarity_2')}+)  ${this.rewardText(reward(S, 20, 20, 20))}`, 15, { color: '#e8d9a8', wrap: 600 }));
    const bb = button(this, 1020, y + 39, 140, 46, d.bonusClaimed ? t('claimed') : t('claim'), () => {
      const r = claimDailyBonus(getSave());
      if (r) { toast(this, this.rewardText(r) + (r.item ? '  + ' + itemName(r.item) : ''), r.item ? RARITY_CSS[r.item.r] : '#ffe9a8'); save(true); this.build(); }
    }, true, 19);
    bb.setEnabled(dailyBonusReady(S));
    c.add(bb.c);
  }

  // ------------------------------------------------------------ achievements
  buildAch(c: Phaser.GameObjects.Container) {
    const S = getSave();
    ACHS.forEach((a, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = 50 + col * 600, y = 160 + row * 69;
      const w = 580, h = 64;
      c.add(panel(this, x, y, w, h, false, 0.35));
      const claimed = achClaimed(S, a);
      const v = achValue(S, a);
      const next = claimed >= 3 ? 3 : claimed;
      const target = a.tiers[Math.min(2, next)];
      c.add(achvIcon(this, x + 36, y + 32, `${TIER_ICO[Math.min(2, next)]}-${a.icon}`, 44).setAlpha(claimed >= 3 ? 1 : 0.95));
      c.add(T(this, x + 70, y + 4, `${getLang() === 'vi' ? a.vi : a.en}`, 18, { color: '#3b2a14', stroke: '#fff3cc', sw: 0 }));
      // 3 chấm bậc
      for (let k = 0; k < 3; k++) c.add(this.add.circle(x + 252 + k * 16, y + 14, 5, k < claimed ? 0xffc233 : 0x7a6a50).setStrokeStyle(1, 0x3b2a14));
      if (claimed >= 3) c.add(T(this, x + 70, y + 34, t('ach_done'), 16, { color: '#2a6b2a', stroke: '#fff3cc', sw: 0 }));
      else {
        drawBar(this.gfx, x + 70, y + 40, 250, 12, Math.min(1, v / target), 0x5fa8ff, 0x3b2a14);
        c.add(T(this, x + 328, y + 33, `${v < 1000 ? Math.floor(Math.min(v, target)) : fmt(Math.min(v, target))}/${fmt(target)}`, 15, { color: '#3b2a14', stroke: '#fff3cc', sw: 0 }));
      }
      const ready = achReady(S, a);
      if (claimed < 3) {
        const b = button(this, x + w - 70, y + 32, 120, 42, t('claim'), () => {
          const r = claimAch(getSave(), a);
          if (r) { toast(this, this.rewardText(r) + (r.item ? '  + ' + itemName(r.item) : ''), '#ffe9a8'); save(true); this.build(); }
        }, false, 17);
        b.setEnabled(ready);
        c.add(b.c);
        void achReward;
      }
      void TIER_NAME;
    });
  }

  // ------------------------------------------------------------ login
  buildLogin(c: Phaser.GameObjects.Container) {
    const S = getSave();
    const L = loginState(S);
    c.add(T(this, 640, 156, t('login_title'), 28, { origin: [0.5, 0], color: '#ffe9a8' }));
    c.add(T(this, 640, 194, t('login_hint'), 17, { origin: [0.5, 0], color: '#a8b4d8' }));
    const cur = L.streak % 7;
    const icons = ['Gift-Box-Blue', 'Gift-Box-Green', 'Gift-Box-Red', 'Silver-Chest', 'Gift-Box-Blue', 'Gold-Chest-3_4-Opened', 'Red-Gold-Chest'];
    for (let d = 0; d < 7; d++) {
      const x = 40 + d * 172, y = 240, w = 162, h = 270;
      const isToday = d === cur && !L.claimedToday;
      const passed = d < cur || (d === cur && L.claimedToday) ;
      c.add(panel(this, x, y, w, h, d === 6, 0.4));
      if (isToday) c.add(this.add.rectangle(x + w / 2, y + h / 2, w + 4, h + 4).setStrokeStyle(6, 0xffc233));
      const tcol = d === 6 ? { color: '#fff6dd' } : { color: '#3b2a14', stroke: '#fff3cc', sw: 0 };
      c.add(T(this, x + w / 2, y + 14, `${t('day')} ${d + 1}`, 21, { origin: [0.5, 0], ...tcol }));
      c.add(achvIcon(this, x + w / 2, y + 100, icons[d], 70).setAlpha(passed ? 0.5 : 1));
      const r = loginReward(S, d, true);
      const tc2 = d === 6 ? { color: '#e8d9a8' } : { color: '#5a4524', stroke: '#fff3cc', sw: 0 };
      c.add(T(this, x + w / 2, y + 150, `${fmt(r.gold)} ${t('gold')}\n${fmt(r.stones)} ${t('stones')}${r.badges >= 1 ? '\n' + fmt(r.badges) + ' ' + t('badges') : ''}${d === 3 || d === 6 ? '\n+ ' + t('reward_item') : ''}`, 14, { origin: [0.5, 0], align: 'center', ...tc2, ls: 2 }));
      if (passed) c.add(T(this, x + w / 2, y + 232, '✔', 30, { origin: [0.5, 0.5], color: '#7dff9a' }));
    }
    const b = button(this, 640, 580, 320, 58, L.claimedToday ? t('login_claimed') : t('claim'), () => {
      const res = claimLogin(getSave());
      if (res) {
        const r = res.r;
        toast(this, this.rewardText(r) + (r.item ? '  + ' + itemName(r.item) : ''), r.item ? RARITY_CSS[r.item.r] : '#ffe9a8');
        save(true); this.build();
      }
    }, false, 22);
    b.setEnabled(!L.claimedToday);
    c.add(b.c);
    void itemCell; void (null as unknown as Item);
  }

  update(_t: number, dt: number) {
    try { Farm.update(dt / 1000); this.hud.update(); } catch (e) { console.error(e); }
  }
}
