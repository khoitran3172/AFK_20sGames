// Quản lý vòng lặp farm AFK: luôn chạy nền (mọi scene), hòm AFK offline, khiêu chiến Boss.
import { ARENAS, TOTAL_ARENAS } from '../data/arenas';
import { Battle } from './battle';
import { Rates, Save, addItem, getSave, has, mods, power, save } from './state';
import { Item } from '../data/items';
import { track } from './progress';
import { ensureTower, towerRewards } from './tower';
import { EventNotice, finishRaid, raidRewards, tickEvents, villageBuff } from './events';
import { t } from '../i18n';
import { villageRates } from './village';

export interface OfflineReport { seconds: number; gained: Rates; capped: boolean }

class FarmMgr {
  battle: Battle | null = null;
  mode: 'farm' | 'boss' | 'raid' | 'tower' = 'farm';
  raidArena = 0;
  notice: EventNotice = null; // thông báo sự kiện mới cho Hud
  viewing = false;
  loginShown = false;
  offline: OfflineReport | null = null;
  result: { won: boolean; arena: number; rewards: Rates; newMap: boolean; flawless: boolean; items: Item[]; raid?: boolean; tower?: number; newBest?: boolean } | null = null;
  private dropIdx = 0;
  private killsSeen = 0;
  private minAcc = 0;
  newItems: Item[] = []; // đồ vừa nhận (để thông báo)
  private flushed = { gold: 0, stones: 0, badges: 0 };
  private win: { t: number; g: number; s: number; b: number }[] = [];
  private clock = 0;
  private rateTick = 0;
  vRate: Rates = { gold: 0, stones: 0, badges: 0 };
  bRate: Rates = { gold: 0, stones: 0, badges: 0 };
  listeners: (() => void)[] = [];

  get S(): Save { return getSave(); }

  init() {
    const S = this.S;
    const vr0 = villageRates(S);
    if (S.rate.gold <= 0 && S.rate.stones <= 0) S.rate = { ...vr0 };
    const away = (Date.now() - S.lastSeen) / 1000;
    if (away > 45 && (S.rate.gold > 0 || S.rate.stones > 0)) this.addOffline(away);
    this.startFarm();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) save(true);
      else {
        const a = (Date.now() - getSave().lastSeen) / 1000;
        if (a > 45) this.addOffline(a);
      }
    });
    window.addEventListener('beforeunload', () => save(true));
  }

  capSeconds() { return mods(this.S).chestHours * 3600; }

  addOffline(away: number) {
    const S = this.S, m = mods(S);
    const room = Math.max(0, this.capSeconds() - S.chestMs / 1000);
    const sec = Math.min(away, room);
    const eff = 0.85 * m.afkYield;
    const g: Rates = { gold: S.rate.gold * sec * eff, stones: S.rate.stones * sec * eff, badges: S.rate.badges * sec * eff };
    S.chest.gold += g.gold; S.chest.stones += g.stones; S.chest.badges += g.badges;
    S.chestMs += sec * 1000;
    S.lastSeen = Date.now();
    this.offline = { seconds: away, gained: g, capped: sec < away };
    save(true);
  }

  claimChest(): Rates {
    const S = this.S, c = { ...S.chest };
    S.gold += c.gold; S.stones += c.stones; S.badges += Math.floor(c.badges);
    S.chest = { gold: 0, stones: 0, badges: 0 };
    S.chestMs = 0;
    track('chests');
    save(true);
    this.emit();
    return c;
  }

  chestFraction() { return Math.min(1, this.S.chestMs / 1000 / this.capSeconds()); }

  /** 1 giờ-farm ngay lập tức (node 41) */
  grantHours(h: number) {
    const S = this.S;
    S.gold += S.rate.gold * 3600 * h; S.stones += S.rate.stones * 3600 * h; S.badges += S.rate.badges * 3600 * h;
  }

  emit() { for (const l of this.listeners) l(); }

  startFarm() {
    this.mode = 'farm';
    this.battle = new Battle(this.S, this.S.farm, { events: this.viewing, mode: 'farm', lang: (k) => t(k) });
    this.flushed = { gold: 0, stones: 0, badges: 0 };
    this.dropIdx = 0;
    this.killsSeen = 0;
  }

  /** Gọi sau khi đổi chỉ số/kỹ năng/đội hình để áp dụng ngay (khi đang farm). */
  refresh() {
    if (this.mode === 'farm') this.startFarm();
  }

  setFarmArena(i: number) {
    const S = this.S;
    if (i < 0 || i > Math.min(S.unlocked, TOTAL_ARENAS - 1)) return;
    S.farm = i;
    this.win = []; this.bRate = { gold: 0, stones: 0, badges: 0 };
    this.startFarm();
    save(true);
  }

  curArena(): number { return this.mode === 'raid' || this.mode === 'tower' ? this.raidArena : this.S.farm; }

  startTower() {
    const S = this.S;
    const tw = ensureTower(S);
    if (tw.used >= 3) return false;
    tw.used++;
    this.mode = 'tower';
    this.raidArena = Math.min(S.unlocked, 47);
    this.battle = new Battle(S, this.raidArena, { events: this.viewing, mode: 'tower', lang: (k) => t(k) });
    this.flushed = { gold: 0, stones: 0, badges: 0 };
    this.dropIdx = 0;
    this.killsSeen = 0;
    this.result = null;
    save(true);
    return true;
  }

  /** Kết thúc sớm lượt leo tháp (nút Quay lại) */
  endTower() { if (this.mode === 'tower' && this.battle) this.finishTowerRun(); }

  startRaid() {
    const S = this.S, ev = S.ev.raid;
    if (!ev) return;
    this.mode = 'raid';
    this.raidArena = ev.arena;
    this.battle = new Battle(S, ev.arena, { events: this.viewing, mode: 'raid', lang: (k) => t(k) });
    this.flushed = { gold: 0, stones: 0, badges: 0 };
    this.dropIdx = 0;
    this.killsSeen = 0;
    this.result = null;
  }

  canChallenge(): boolean {
    const S = this.S;
    return S.farm === S.unlocked && S.unlocked < TOTAL_ARENAS;
  }

  challenge() {
    if (!this.canChallenge()) return;
    this.mode = 'boss';
    this.battle = new Battle(this.S, this.S.farm, { events: this.viewing, mode: 'boss', lang: (k) => t(k) });
    this.flushed = { gold: 0, stones: 0, badges: 0 };
    this.dropIdx = 0;
    this.killsSeen = 0;
    this.result = null;
    track('bossTries');
  }

  private flush() {
    const b = this.battle!, S = this.S;
    const dg = b.rewards.gold - this.flushed.gold, ds = b.rewards.stones - this.flushed.stones;
    const dbf = Math.floor(b.rewards.badges) - this.flushed.badges;
    if (dg > 0) S.gold += dg; if (ds > 0) S.stones += ds; if (dbf > 0) S.badges += dbf;
    this.flushed = { gold: b.rewards.gold, stones: b.rewards.stones, badges: Math.floor(b.rewards.badges) };
    if (this.mode === 'farm') {
      this.win.push({ t: this.clock, g: dg, s: ds, b: dbf });
    }
    while (this.dropIdx < b.drops.length) {
      const it = b.drops[this.dropIdx++];
      if (addItem(S, it)) this.newItems.push(it);
      track('items'); if (it.r >= 3) track('epics'); if (it.r >= 4) track('legends');
    }
    if (b.kills > this.killsSeen) { track('kills', b.kills - this.killsSeen); S.kills += b.kills - this.killsSeen; this.killsSeen = b.kills; }
    S.kills = (S.kills || 0);
  }

  update(dtSec: number) {
    const S = this.S;
    if (!this.battle) return;
    let dt = Math.min(dtSec, 0.25) * (S.speed || 1);
    this.clock += dtSec;
    S.playMs += dtSec * 1000;
    this.minAcc += dtSec;
    if (this.minAcc >= 60) { this.minAcc -= 60; track('minutes'); }
    const sub = 0.05;
    while (dt > 0) {
      const d = Math.min(sub, dt);
      this.battle.step(d);
      dt -= d;
      if (this.battle.state !== 'run') break;
    }
    this.battle.opts.events = this.viewing;
    if (!this.viewing) this.battle.events.length = 0;
    this.flush();
    // làng: thu nhập liên tục (không bị ảnh hưởng bởi tốc độ x2/x3 của trận)
    const vr = villageRates(S);
    const bm = villageBuff(S);
    vr.gold *= bm; vr.stones *= bm; vr.badges *= bm;
    const notice = tickEvents(S);
    if (notice) { this.notice = notice; this.emit(); }
    S.gold += vr.gold * dtSec; S.stones += vr.stones * dtSec; S.badges += vr.badges * dtSec;
    this.vRate = vr;

    // đo tốc độ farm 60 giây gần nhất (dùng cho offline)
    this.rateTick += dtSec;
    if (this.rateTick > 4 && this.mode === 'farm') {
      this.rateTick = 0;
      const cut = this.clock - 90;
      this.win = this.win.filter((w) => w.t >= cut);
      const span = Math.min(90, this.clock);
      if (span > 20) {
        let g = 0, s = 0, b = 0;
        for (const w of this.win) { g += w.g; s += w.s; b += w.b; }
        const sp = S.speed || 1;
        this.bRate = { gold: g / span / sp, stones: s / span / sp, badges: b / span / sp };
      }
      S.rate = { gold: this.bRate.gold + vr.gold, stones: this.bRate.stones + vr.stones, badges: this.bRate.badges + vr.badges };
    }

    if (this.mode === 'tower') {
      if (this.battle.state === 'lost') this.finishTowerRun();
    } else if (this.mode === 'raid') {
      if (this.battle.state === 'won') this.finishRaidBattle(true);
      else if (this.battle.state === 'lost') this.finishRaidBattle(false);
    } else if (this.battle.state === 'won' && this.mode === 'boss') this.finishBoss(true);
    else if (this.battle.state === 'lost' && this.mode === 'boss') this.finishBoss(false);
    save();
  }

  private finishTowerRun() {
    const S = this.S, b = this.battle!;
    const cleared = b.cleared;
    const r = towerRewards(S, cleared);
    S.gold += r.gold; S.stones += r.stones; S.badges += r.badges;
    for (const it of r.items) if (addItem(S, it)) this.newItems.push(it);
    if (cleared > 0) track('tower', cleared);
    if (r.newBest) S.tower.best = cleared;
    this.result = { won: cleared > 0, arena: this.raidArena, rewards: { gold: r.gold, stones: r.stones, badges: r.badges }, newMap: false, flawless: false, items: r.items, tower: cleared, newBest: r.newBest };
    this.startFarm();
    save(true);
    this.emit();
  }

  private finishRaidBattle(won: boolean) {
    const S = this.S, b = this.battle!;
    const arena = this.raidArena;
    let rewards: Rates = { gold: 0, stones: 0, badges: 0 };
    const items: Item[] = [];
    if (won) {
      const r = raidRewards(S, arena);
      S.gold += r.gold; S.stones += r.stones; S.badges += r.badges;
      if (addItem(S, r.item)) this.newItems.push(r.item);
      items.push(r.item);
      rewards = { gold: r.gold, stones: r.stones, badges: r.badges };
      track('raids');
      finishRaid(S, true);
    }
    this.result = { won, arena, rewards, newMap: false, flawless: b.flawless, items, raid: true };
    this.startFarm();
    save(true);
    this.emit();
  }

  private finishBoss(won: boolean) {
    const S = this.S, b = this.battle!;
    const a = S.farm;
    let newMap = false;
    if (won) {
      track('bossWins');
      if (S.unlocked === a) {
        S.unlocked = Math.min(TOTAL_ARENAS, a + 1);
        newMap = ARENAS[a].isLastOfMap && a + 1 < TOTAL_ARENAS;
        if (S.unlocked >= TOTAL_ARENAS) S.done = true;
        else S.farm = S.unlocked;
        if (has(S, 41)) this.grantHours(2);
        this.bRate = { gold: 0, stones: 0, badges: 0 };
        this.win = [];
      }
    }
    this.result = { won, arena: a, rewards: { ...b.rewards }, newMap, flawless: b.flawless, items: b.drops.slice() };
    this.startFarm();
    save(true);
    this.emit();
  }

  powerNow() { return power(this.S); }
}

export const Farm = new FarmMgr();
