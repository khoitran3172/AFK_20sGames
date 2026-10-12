// Engine chiến đấu thuần TypeScript (không phụ thuộc Phaser) — chạy được cả trong tools/sim.ts.
import { ARENAS, ArenaDef, MAPS, MOB_SPEC } from '../data/arenas';
import { TIER_STAT_MUL, TROOPS, TroopId, activeSynergy } from '../data/troops';
import { Save, has, mcStats, mods, troopCount } from './state';

export const FIELD = { w: 1280, top: 345, bottom: 610 };

export type Team = 0 | 1;
export interface Unit {
  id: number; team: Team; set: string; kind: string; troop?: TroopId;
  x: number; y: number; hp: number; maxHp: number; atk: number; def: number;
  range: number; aspd: number; speed: number; cd: number; alive: boolean; deadT: number;
  isBoss: boolean; ranged: boolean; scale: number; crit: number; critDmg: number;
  face: 1 | -1; target: Unit | null; threat: number;
  // trạng thái
  stun: number; freeze: number; slow: number; chaos: number; burn: number; burnDps: number;
  invuln: number; shield: number; cast: number; castTarget: Unit | null; invis: number;
  // hiển thị
  act: string; actId: number; hurtT: number; atkVar: number; hits: number;
  // MC / đặc thù
  skillCd: number; shieldCd: number; invulnCd: number; immuneT: number; divine: number; divineCd: number;
  guardT: number; stepCd: number; guardCd: number; guardActive: number; healCd: number; ice: boolean;
  lifetime: number; slot: number; burnTick: number; spawnIn: number; bossCd: number; elite: boolean;
  bonusDmg: number;
}

export interface Proj {
  id: number; kind: 'arrow' | 'fire' | 'ice' | 'bolt' | 'wave' | 'mag'; team: Team;
  x: number; y: number; tx: number; ty: number; speed: number; dmg: number; aoe: number;
  target: Unit | null; src: Unit; pierce: number; hitIds: number[]; crit: boolean; life: number;
  apply?: 'burn' | 'freeze' | 'none';
}

export type Ev =
  | { k: 'text'; x: number; y: number; s: string; c: number; big?: boolean }
  | { k: 'fx'; n: string; x: number; y: number; s?: number; tint?: number }
  | { k: 'banner'; s: string; c: number }
  | { k: 'shake'; a: number };

export interface BattleOpts { events: boolean; mode: 'farm' | 'boss'; lang?: (k: string) => string }

export interface Rewards { gold: number; stones: number; badges: number }

let UID = 1;
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, (a.y - b.y) * 1.6);

const THREAT: Record<string, number> = { knight: 10, pike: 7, mc: 4, rogue: 2.2, wizard: 2, archer: 1.6, healer: 1, holy: 8 };

export class Battle {
  S: Save; arena: ArenaDef; opts: BattleOpts;
  units: Unit[] = []; projs: Proj[] = []; events: Ev[] = [];
  time = 0; wave = 0; waves: { n: number; boss: boolean }[] = []; waveDelay = 0.6; spawnQueue: { unit: Unit; at: number }[] = [];
  state: 'run' | 'won' | 'lost' = 'run';
  rewards: Rewards = { gold: 0, stones: 0, badges: 0 };
  kills = 0; deaths = 0; mc!: Unit; reviveT = 0; slots: { troop: TroopId; unit: Unit | null; timer: number; idx: number }[] = [];
  holySummoned = false; blackhole = 0; bhX = 760; buff10 = 10; synergy = activeSynergy([]);
  mcAnchorX = 330; flawless = true; bossAlive = false; totalWaveDelay = 0; paused = false;
  m!: ReturnType<typeof mods>;

  constructor(S: Save, arenaIdx: number, opts: BattleOpts) {
    this.S = S; this.opts = opts;
    this.arena = ARENAS[arenaIdx];
    this.m = mods(S);
    this.synergy = activeSynergy(S.squad);
    this.waves = opts.mode === 'boss'
      ? [{ n: 6, boss: false }, { n: 8, boss: false }, { n: 4, boss: true }]
      : [];
    this.spawnPlayer();
    if (has(S, 46)) { this.blackhole = 6; this.say('banner', 'blackhole', 0xb98cff); this.fx('fxExplosion2', this.bhX, 470, 2.6); }
  }

  // ------------------------------------------------------------------ helpers
  say(k: 'banner', key: string, c: number) { if (this.opts.events) this.events.push({ k, s: this.opts.lang ? this.opts.lang(key) : key, c }); }
  txt(x: number, y: number, s: string, c = 0xffffff, big = false) { if (this.opts.events) this.events.push({ k: 'text', x, y, s, c, big }); }
  fx(n: string, x: number, y: number, s = 1, tint?: number) { if (this.opts.events) this.events.push({ k: 'fx', n, x, y, s, tint }); }

  mk(team: Team, set: string, kind: string, o: Partial<Unit>): Unit {
    const u: Unit = {
      id: UID++, team, set, kind, x: 0, y: 0, hp: 1, maxHp: 1, atk: 1, def: 0, range: 60, aspd: 1, speed: 80, cd: 0.3, alive: true, deadT: 0,
      isBoss: false, ranged: false, scale: 1, crit: 0.05, critDmg: 1.6, face: team === 0 ? 1 : -1, target: null, threat: THREAT[kind] ?? 3,
      stun: 0, freeze: 0, slow: 0, chaos: 0, burn: 0, burnDps: 0, invuln: 0, shield: 0, cast: 0, castTarget: null, invis: 0,
      act: 'idle', actId: 0, hurtT: 0, atkVar: 0, hits: 0, skillCd: 6, shieldCd: 4, invulnCd: 0, immuneT: 0, divine: 0, divineCd: 5,
      guardT: 0, stepCd: 0, guardCd: 5, guardActive: 0, healCd: 4, ice: false, lifetime: 0, slot: -1, burnTick: 0, spawnIn: 0, bossCd: 6, elite: false,
      bonusDmg: 0, ...o,
    };
    this.units.push(u);
    return u;
  }

  allies() { return this.units.filter((u) => u.team === 0 && u.alive); }
  foes(of: Team = 0) { return this.units.filter((u) => u.team !== of && u.alive && u.spawnIn <= 0); }

  // ------------------------------------------------------------------ setup
  mcMax() { return this.mc.maxHp; }

  spawnPlayer() {
    const s = this.S, st = mcStats(s);
    this.mc = this.mk(0, 'mc', 'mc', {
      x: 330, y: 480, hp: st.hp, maxHp: st.hp, atk: st.atk, def: st.def, range: st.range, aspd: st.aspd, speed: st.speed,
      scale: 1, crit: 0.12 + (this.synergy?.id === 'chaos' ? 0 : 0), critDmg: 1.7, threat: 4,
    });
    if (has(s, 23)) this.mc.immuneT = 3;
    this.mc.skillCd = 4;
    this.mc.divineCd = 8;
    this.mc.shieldCd = 3;
    for (const id of s.squad) {
      const n = troopCount(s, id);
      for (let i = 0; i < n; i++) {
        const slot = { troop: id, unit: null as Unit | null, timer: 0, idx: i };
        this.slots.push(slot);
        slot.unit = this.makeTroop(id, i, false);
      }
    }
  }

  troopStat(id: TroopId) {
    const d = TROOPS[id], s = this.S, st = mcStats(s);
    const tier = TIER_STAT_MUL[s.tiers[id]] * this.m.troopMul;
    const base = 0.2;
    let hp = (st.hp * base * d.hpMul) / d.count * tier;
    let atk = (st.atk * base * d.atkMul) / d.count * tier;
    let def = st.def * 0.55 * tier;
    if (id === 'knight' && this.synergy?.id === 'balance') hp *= 1.15;
    if ((id === 'knight' || id === 'pike') && has(s, 3)) def *= 1.25;
    if (this.synergy?.id === 'storm' && (id === 'archer' || id === 'wizard')) atk *= 1.25;
    return { hp, atk, def };
  }

  makeTroop(id: TroopId, idx: number, entering: boolean): Unit {
    const d = TROOPS[id], { hp, atk, def } = this.troopStat(id), s = this.S;
    const startX = entering ? -50 : this.anchorX(id);
    let crit = 0.05;
    if ((id === 'archer' || id === 'wizard') && has(s, 4)) crit += 0.1;
    if (id === 'archer') crit += 0.1;
    if (id === 'rogue') crit += 0.3;
    const u = this.mk(0, id, id, {
      troop: id, x: startX, y: this.laneY(id, idx), hp, maxHp: hp, atk, def, range: d.range, aspd: d.aspd * (this.synergy?.id === 'balance' && id === 'archer' ? 1.1 : 1),
      speed: d.speed, scale: 1, ranged: !d.melee, crit, critDmg: id === 'rogue' && s.tiers[id] >= 2 ? 2.1 : 1.7, slot: idx,
    });
    if (id === 'rogue') u.invis = 2;
    return u;
  }

  anchorX(id: TroopId) {
    const d = TROOPS[id];
    return this.mcAnchorX + (d.lane === 0 ? 210 : d.lane === 1 ? -20 : -110) + (id === 'pike' ? -50 : 0) + (id === 'healer' ? -30 : 0);
  }
  laneY(id: TroopId, idx: number) {
    const n = Math.max(1, troopCount(this.S, id));
    const span = FIELD.bottom - FIELD.top - 40;
    return FIELD.top + 30 + ((idx + 0.5) / n) * span;
  }

  // ------------------------------------------------------------------ waves
  mobCount() { return 5 + Math.min(3, Math.floor(this.wave / 3)); }

  spawnWave() {
    const map = MAPS[this.arena.map];
    const boss = this.opts.mode === 'boss' ? this.waves[this.wave] : null;
    const n = boss ? boss.n : this.opts.mode === 'boss' ? 6 : this.mobCount();
    let t = 0;
    if (boss && boss.boss) {
      const set = map.boss[Math.floor(Math.random() * map.boss.length)];
      const u = this.makeEnemy(set, true);
      u.spawnIn = 0.1; u.x = FIELD.w + 120; u.y = (FIELD.top + FIELD.bottom) / 2;
      this.bossAlive = true;
      this.say('banner', 'boss', 0xff6a5a);
    }
    for (let i = 0; i < n; i++) {
      const set = map.mobs[Math.floor(Math.random() * map.mobs.length)];
      const u = this.makeEnemy(set, false);
      u.spawnIn = t; t += rand(0.25, 0.55);
    }
    if (has(this.S, 39)) {
      this.fx('fxDust', 800, 480, 3);
      for (const e of this.units) if (e.team === 1 && e.alive) e.x = Math.min(e.x, 900 + rand(-60, 160));
    }
  }

  makeEnemy(set: string, boss: boolean): Unit {
    const A = this.arena, sp = MOB_SPEC[set] ?? MOB_SPEC.orc;
    let hp = A.mobHp * sp.hp, atk = A.mobAtk * sp.atk, def = A.mobDef;
    let scale = (sp.scale ?? 1);
    if (boss) { hp *= 16; atk *= 1.7; def *= 2.2; scale *= 1.7; if (has(this.S, 43)) { atk *= 0.75; def *= 0.75; } }
    const elite = !boss && Math.random() < 0.08;
    if (elite) { hp *= 2.2; atk *= 1.3; scale *= 1.2; }
    const u = this.mk(1, set, 'mob', {
      x: FIELD.w + 40 + rand(0, 90), y: rand(FIELD.top + 20, FIELD.bottom - 10), hp, maxHp: hp, atk, def, range: sp.range, aspd: sp.aspd, speed: sp.speed * (boss ? 0.85 : 1),
      scale, ranged: sp.ranged, isBoss: boss, elite, threat: 3, face: -1, bossCd: 5 + rand(0, 3), spawnIn: 0,
    });
    u.x = FIELD.w + 60 + rand(0, 80);
    return u;
  }

  // ------------------------------------------------------------------ damage
  dmgMul(src: Unit, dst: Unit, aoeFromBoss: boolean): number {
    let m = 1;
    if (dst.team === 0) {
      if (dst.kind === 'knight' && dst.guardActive > 0 && src.x > dst.x) m *= 0.6;
      if (this.synergy?.id === 'iron' && TROOPS[dst.kind as TroopId]?.melee) m *= 0.8;
      if (dst === this.mc && has(this.S, 11)) {
        const ks = this.units.filter((u) => u.kind === 'knight' && u.alive);
        if (ks.length && ks.reduce((a, u) => a + u.hp / u.maxHp, 0) / ks.length > 0.5) m *= 0.85;
      }
      if (dst !== this.mc && aoeFromBoss && has(this.S, 15)) m *= 0.7;
    }
    return m;
  }

  hit(src: Unit, dst: Unit, raw: number, o: { aoeBoss?: boolean; trueDmg?: boolean; noCrit?: boolean; noReflect?: boolean; mag?: boolean; fixedCrit?: boolean } = {}): number {
    if (!dst.alive || dst.invuln > 0) return 0;
    const S = this.S;
    let dmg = raw;
    // chí mạng
    let crit = false;
    if (!o.noCrit && (o.fixedCrit || Math.random() < src.crit)) crit = true;
    let def = dst.def;
    if (src === this.mc && dst.isBoss && has(S, 26)) def *= 0.7;
    if (!o.trueDmg) dmg *= src.atk / (src.atk + def);
    if (crit) {
      let cd = src.critDmg;
      const controlled = dst.stun > 0 || dst.freeze > 0 || dst.chaos > 0 || dst.slow > 0;
      if ((src === this.mc) && has(S, 24) && controlled) cd += 0.6;
      if (this.synergy?.id === 'chaos' && dst.freeze > 0 && (src === this.mc || src.kind === 'rogue')) cd += 0.5;
      if (dst.team === 0 && dst !== this.mc && has(S, 5) && this.units.some((u) => u.kind === 'knight' && u.alive) && Math.random() < 0.35) { crit = false; }
      else dmg *= cd;
    }
    if (src === this.mc && this.synergy?.id === 'iron' && (dst.stun > 0 || dst.freeze > 0 || dst.chaos > 0)) dmg *= 1.3;
    dmg *= this.dmgMul(src, dst, !!o.aoeBoss);
    if (dst.shield > 0) { const a = Math.min(dst.shield, dmg); dst.shield -= a; dmg -= a; }
    dmg = Math.max(0, dmg);
    dst.hp -= dmg;
    dst.hurtT = 0.18;
    if (dmg > 0) this.txt(dst.x, dst.y - 70 * dst.scale * 0.8, Math.round(dmg) >= 1e6 ? (dmg / 1e6).toFixed(1) + 'M' : String(Math.round(dmg)), crit ? 0xffd34d : dst.team === 0 ? 0xff6a5a : 0xffffff, crit);
    // hiệu ứng của MC
    if (dst.team === 0 && dst === this.mc) {
      if (crit && has(S, 29) && this.mc.invulnCd <= 0) { this.mc.invuln = 1.5; this.mc.invulnCd = 45; this.txt(this.mc.x, this.mc.y - 120, 'IMMUNE!', 0xffffff, true); this.fx('fxExplosion2', this.mc.x, this.mc.y - 40, 0.8); }
      if (has(S, 21) && !o.noReflect && src.team === 1 && !src.ranged && Math.random() < 0.4) this.hit(this.mc, src, dmg * 0.25, { trueDmg: true, noCrit: true, noReflect: true });
    }
    if (src === this.mc && has(S, 22) && dmg > 0) this.heal(this.mc, dmg * 0.06);
    if (dst.hp <= 0) this.die(dst, src);
    return dmg;
  }

  heal(u: Unit, amt: number) {
    if (!u.alive) return;
    const a = Math.min(u.maxHp - u.hp, amt);
    if (a <= 0) return;
    u.hp += a;
    if (a > u.maxHp * 0.01) this.txt(u.x, u.y - 80, '+' + Math.round(a), 0x7dff9a);
  }

  die(u: Unit, killer: Unit | null) {
    if (!u.alive) return;
    u.alive = false; u.deadT = 0; u.act = 'death'; u.actId++;
    const S = this.S;
    if (u.team === 1) {
      this.kills++;
      const A = this.arena;
      let g = A.killGold * this.m.farmGold * (u.isBoss ? 0 : 1);
      if (!u.isBoss && has(S, 42) && Math.random() < 0.05) { g *= 5; this.txt(u.x, u.y - 100, 'x5 GOLD!', 0xffd34d, true); this.fx('fxExplosion', u.x, u.y - 30, 0.8); }
      if (u.elite) g *= 3;
      let st = A.killStone * this.m.farmStone * (u.elite ? 2.5 : 1);
      this.rewards.gold += g; this.rewards.stones += st;
      if (Math.random() < A.killBadge * this.m.badgeBonus * (u.elite ? 4 : 1)) { this.rewards.badges += 1; this.txt(u.x, u.y - 100, '+1 ' + (this.opts.lang ? this.opts.lang('badges') : 'Badge'), 0xb9e6ff, true); }
      if (u.isBoss) { this.bossAlive = false; this.fx('fxExplosion2', u.x, u.y - 40, 3.2); this.events.length < 400 && this.opts.events && this.events.push({ k: 'shake', a: 10 }); }
      if (has(S, 36)) {
        const near = this.foes(0).filter((e) => e !== u).sort((a, b) => dist(a, u) - dist(b, u)).slice(0, 2);
        for (const e of near) { this.hit(this.mc, e, this.mc.atk * 0.7, { noCrit: true, trueDmg: true }); this.fx('fxFire', e.x, e.y - 30, 1.2); }
      }
    } else {
      if (u !== this.mc) {
        if (has(S, 14)) {
          this.fx('fxExplosion', u.x, u.y - 20, 0.8);
          for (const e of this.foes(0)) if (dist(e, u) < 130) this.hit(this.mc, e, u.atk * 2.2, { noCrit: true });
          this.mc.skillCd = Math.max(0, this.mc.skillCd - 2);
        }
        if (u.troop) {
          const slot = this.slots.find((s) => s.unit === u);
          if (slot) {
            let t = TROOPS[u.troop].respawn * (has(S, 7) ? 0.8 : 1) * (S.tiers[u.troop] >= 3 ? 0.75 : 1);
            slot.timer = t; slot.unit = null;
          }
        }
        this.flawless = false;
      } else {
        this.deaths++;
        this.txt(u.x, u.y - 100, this.opts.lang ? this.opts.lang('mc_down') : 'down', 0xff6a5a, true);
        if (this.opts.mode === 'boss') this.state = 'lost';
        else this.reviveT = 6;
      }
    }
  }

  // ------------------------------------------------------------------ update
  step(dtRaw: number) {
    if (this.state !== 'run' && this.state !== 'won') return;
    const dt = dtRaw;
    this.time += dt;
    this.m = this.m; // giữ tham chiếu
    if (this.buff10 > 0) this.buff10 -= dt;
    const buffSpd = has(this.S, 9) && this.buff10 > 0 ? 1.15 : 1;

    // hồi sinh MC (farm)
    if (!this.mc.alive && this.opts.mode === 'farm') {
      this.reviveT -= dt;
      if (this.reviveT <= 0) this.reviveFarm();
      this.stepProjs(dt);
      this.cleanup(dt);
      return;
    }

    // hố đen
    if (this.blackhole > 0) {
      this.blackhole -= dt;
      for (const e of this.foes(0)) {
        e.x += Math.sign(this.bhX - e.x) * Math.min(Math.abs(this.bhX - e.x), 120 * dt);
        e.y += Math.sign(480 - e.y) * Math.min(Math.abs(480 - e.y), 50 * dt);
        if (dist(e, { x: this.bhX, y: 480 }) < 260) this.hit(this.mc, e, this.mc.atk * 0.55 * dt * 2, { trueDmg: true, noCrit: true });
      }
    }

    // lính hồi sinh
    for (const sl of this.slots) {
      if (!sl.unit && sl.timer > 0) {
        sl.timer -= dt;
        if (sl.timer <= 0) sl.unit = this.makeTroop(sl.troop, sl.idx, true);
      }
    }

    // đợt quái
    this.updateWaves(dt);

    for (const u of this.units) {
      if (!u.alive) continue;
      if (u.spawnIn > 0) { u.spawnIn -= dt; continue; }
      this.updateUnit(u, dt, buffSpd);
    }
    this.stepProjs(dt);
    this.cleanup(dt);
  }

  reviveFarm() {
    const st = mcStats(this.S);
    this.mc.alive = true; this.mc.hp = st.hp; this.mc.act = 'idle'; this.mc.actId++; this.mc.invuln = 2; this.mc.x = this.mcAnchorX;
    this.fx('fxHeal', this.mc.x, this.mc.y - 40, 1.2);
    for (const e of this.units) if (e.team === 1) { e.alive = false; e.deadT = 9; }
    this.spawnQueue = [];
    this.waveDelay = 1.5; this.wave = Math.max(0, this.wave - 0);
  }

  updateWaves(dt: number) {
    const enemiesLeft = this.units.some((u) => u.team === 1 && u.alive);
    if (this.opts.mode === 'boss') {
      if (this.state === 'won') return;
      if (!enemiesLeft) {
        if (this.wave >= this.waves.length) { this.win(); return; }
        this.waveDelay -= dt;
        if (this.waveDelay <= 0) { this.spawnWave(); this.wave++; this.waveDelay = 1.2; }
      }
    } else if (!enemiesLeft) {
      this.waveDelay -= dt;
      if (this.waveDelay <= 0) { this.spawnWave(); this.wave++; this.waveDelay = 1.0; }
    }
  }

  win() {
    this.state = 'won';
    const b = this.arena.bossReward;
    this.rewards.gold += b.gold * this.m.farmGold;
    this.rewards.stones += b.stones * this.m.farmStone;
    this.rewards.badges += b.badges;
  }

  cleanup(dt: number) {
    for (let i = this.units.length - 1; i >= 0; i--) {
      const u = this.units[i];
      if (!u.alive) { u.deadT += dt; if (u.deadT > 1.4) this.units.splice(i, 1); }
    }
  }

  // ------------------------------------------------------------------ unit AI
  frontX(): number {
    let f = -1;
    for (const u of this.units) if (u.alive && u.team === 0 && (u.kind === 'knight' || u.kind === 'pike' || u.kind === 'holy')) f = Math.max(f, u.x);
    return f < 0 ? this.mc.x + 60 : f;
  }

  nearest(u: Unit, list: Unit[], maxD = 1e9): Unit | null {
    let b: Unit | null = null, bd = maxD;
    for (const e of list) { const d = dist(u, e); if (d < bd) { bd = d; b = e; } }
    return b;
  }

  pickTarget(u: Unit): Unit | null {
    if (u.team === 0) {
      const foes = this.foes(0);
      if (!foes.length) return null;
      if (u.kind === 'archer') {
        // ưu tiên quái ít máu nhất / quái đang nhắm MC, trong tầm
        const inR = foes.filter((e) => dist(u, e) <= u.range);
        if (!inR.length) return this.nearest(u, foes);
        const onMc = inR.filter((e) => e.target === this.mc);
        const pool = onMc.length ? onMc : inR;
        return pool.reduce((a, b) => (a.hp < b.hp ? a : b));
      }
      if (u.kind === 'wizard') {
        // vùng quái đông nhất
        let best: Unit | null = null, bc = -1;
        for (const e of foes) {
          if (dist(u, e) > u.range + 60) continue;
          let c = 0; for (const f of foes) if (dist(e, f) < 110) c++;
          if (c > bc) { bc = c; best = e; }
        }
        return best ?? this.nearest(u, foes);
      }
      if (u.kind === 'rogue') {
        const rngd = foes.filter((e) => e.ranged);
        return this.nearest(u, rngd.length ? rngd : foes);
      }
      return this.nearest(u, foes);
    }
    // quái
    if (u.chaos > 0) {
      const others = this.units.filter((e) => e.team === 1 && e.alive && e !== u);
      return this.nearest(u, others) ?? null;
    }
    const pl = this.units.filter((e) => e.team === 0 && e.alive && e.invis <= 0);
    if (!pl.length) return null;
    if (u.ranged) {
      const inR = pl.filter((e) => dist(u, e) <= u.range);
      if (inR.length) return inR.reduce((a, b) => (a.atk * a.aspd > b.atk * b.aspd ? a : b));
      return this.nearest(u, pl);
    }
    // cận chiến: Threat cao nhất trong bán kính aggro, mặc định Knight
    const wall = pl.filter((e) => e.threat >= 7);
    if (wall.length && !this.guardMode()) {
      const near = wall.filter((e) => dist(u, e) < 380);
      const pool = near.length ? near : wall;
      return pool.reduce((a, b) => (dist(u, a) - a.threat * 14 < dist(u, b) - b.threat * 14 ? a : b));
    }
    return this.nearest(u, pl);
  }

  guardMode(): boolean { return this.mc.alive && this.mc.hp / this.mc.maxHp < 0.35; }

  updateUnit(u: Unit, dt: number, buffSpd: number) {
    // trạng thái
    if (u.hurtT > 0) u.hurtT -= dt;
    if (u.invuln > 0) u.invuln -= dt;
    if (u.invis > 0) u.invis -= dt;
    if (u.immuneT > 0) u.immuneT -= dt;
    if (u.guardActive > 0) u.guardActive -= dt;
    if (u.divine > 0) u.divine -= dt;
    if (u.invulnCd > 0) u.invulnCd -= dt;
    if (u.shield > 0 && u === this.mc && has(this.S, 27) === false) u.shield = 0;
    const immune = u.divine > 0 || (u === this.mc && u.immuneT > 0);
    if (immune) { u.stun = 0; u.freeze = 0; }
    if (u.stun > 0) u.stun -= dt;
    if (u.freeze > 0) u.freeze -= dt;
    if (u.slow > 0) u.slow -= dt;
    if (u.chaos > 0) u.chaos -= dt;
    if (u.burn > 0) {
      u.burn -= dt; u.burnTick -= dt;
      if (u.burnTick <= 0) { u.burnTick = 1; this.hit(this.mc, u, u.burnDps, { trueDmg: true, noCrit: true }); this.fx('fxFire', u.x, u.y - 40, 0.8); }
    }
    if (u.lifetime > 0) { u.lifetime -= dt; if (u.lifetime <= 0) { u.alive = false; u.deadT = 1; this.fx('fxDust', u.x, u.y, 1.5); return; } }

    // MC: kỹ năng bị động / chủ động
    if (u === this.mc) this.updateMc(dt);
    if (u.team === 0 && u.kind === 'knight') this.updateKnight(u, dt);
    if (u.team === 1 && u.isBoss) this.updateBoss(u, dt);
    if (u.team === 0 && u.kind === 'healer') this.updateHealer(u, dt);

    if (u.stun > 0 || u.freeze > 0) { u.act = 'idle'; return; }
    if (u.cast > 0) { this.updateCast(u, dt); return; }

    const slowM = (u.slow > 0 ? 0.6 : 1) * buffSpd;
    let spd = u.speed * slowM;
    let aspd = u.aspd * slowM;
    if (u === this.mc) {
      if (has(this.S, 25)) { const f = 1 - u.hp / u.maxHp; aspd *= 1 + 0.5 * f; }
      if (u.divine > 0) aspd *= 1.3;
    }
    if (u.team === 0 && this.guardMode() && (u.kind === 'knight' || u.kind === 'pike') && u !== this.mc) spd *= 1.5;

    u.cd -= dt;
    if (!u.target || !u.target.alive || (u.target.invis > 0 && u.team === 1) || u.chaos > 0 || Math.random() < dt * 0.9) u.target = this.pickTarget(u);

    // Hộ Giá: tiền tuyến lùi về bảo vệ MC
    if (u.team === 0 && this.guardMode() && (u.kind === 'knight' || u.kind === 'pike') && u !== this.mc) {
      const a = (u.slot / 8) * Math.PI - Math.PI / 2;
      this.moveTo(u, this.mc.x + 70 + Math.cos(a) * 20, this.mc.y + Math.sin(a) * 110, spd, dt);
      u.act = 'walk';
      if (u.target && dist(u, u.target) <= u.range + 6 && u.cd <= 0) this.attack(u, u.target, aspd);
      return;
    }

    // Rogue: dịch chuyển
    if (u.kind === 'rogue') {
      u.stepCd -= dt;
      const foes = this.foes(0);
      if (u.stepCd <= 0 && foes.length) {
        const tgt = foes.filter((e) => e.ranged)[0] ?? foes.reduce((a, b) => (a.x > b.x ? a : b));
        u.x = Math.min(FIELD.w - 20, tgt.x + 55); u.y = tgt.y + rand(-12, 12); u.invis = 2; u.stepCd = 14; u.target = tgt;
        this.fx('fxDust', u.x, u.y, 1.4);
      }
    }

    const tgt = u.target;
    if (!tgt) {
      // đứng chờ ở vị trí đội hình
      this.holdFormation(u, spd, dt);
      return;
    }
    const d = dist(u, tgt);
    const reach = u.range;
    u.face = tgt.x >= u.x ? 1 : -1;
    if (d <= reach) {
      if (u.cd <= 0) this.attack(u, tgt, aspd);
      else if (u.act !== 'attack' || u.cd > 1 / aspd * 0.6) { if (u.act === 'walk') u.act = 'idle'; }
      // tránh đứng yên ngay trước mặt (giữ khoảng cách) cho quân xa
    } else {
      // chưa tới tầm: tiến lên (quân hỗ trợ giữ đội hình)
      if (u.team === 0 && u !== this.mc && !(u.kind === 'knight' || u.kind === 'pike' || u.kind === 'rogue' || u.kind === 'holy')) {
        // quân đánh xa: tiến cho tới khi mục tiêu vào tầm, nhưng không vượt qua tiền tuyến
        const front = this.frontX();
        const want = Math.min(tgt.x - reach * 0.85, front - 70);
        if (Math.abs(tgt.x - u.x) < 900 && u.x < want - 8) this.moveTo(u, want, u.y, spd, dt);
        else this.holdFormation(u, spd, dt);
      } else if (u === this.mc) {
        const front = this.frontX();
        const lim = front + 40;
        const tx = Math.min(tgt.x - 20, Math.max(lim, this.mcAnchorX), 1150);
        if (dist(u, tgt) > reach) this.moveTo(u, tx, tgt.y, spd, dt);
        u.act = 'walk';
      } else {
        // quân tiền tuyến: chỉ lao lên khi địch trong 700px, ngược lại giữ hàng
        if (u.team === 0 && u.kind !== 'rogue' && tgt.x > (u.troop ? this.anchorX(u.troop) : this.mc.x) + 130 + 450) { this.holdFormation(u, spd, dt); return; }
        const gx = u.team === 0 && u.kind !== 'rogue' ? Math.min(tgt.x - Math.sign(tgt.x - u.x) * Math.min(reach * 0.7, 40), 1210) : tgt.x - Math.sign(tgt.x - u.x) * Math.min(reach * 0.7, 40);
        this.moveTo(u, gx, tgt.y + ((u.slot % 4) - 1.5) * 30, spd, dt);
        u.act = 'walk';
      }
    }
    this.separate(u, dt);
  }

  formationX(u: Unit): number {
    const front = Math.min(this.frontX(), 760);
    if (u === this.mc) return Math.max(this.mcAnchorX, front - 150);
    const d = TROOPS[u.kind as TroopId];
    if (!d) return u.x;
    const off = u.kind === 'wizard' ? -190 : u.kind === 'archer' ? -300 : u.kind === 'healer' ? -340 : u.kind === 'rogue' ? -80 : -40;
    return Math.max(this.anchorX(u.kind as TroopId), front + off);
  }

  holdFormation(u: Unit, spd: number, dt: number) {
    let hx = this.formationX(u);
    let hy = u.y;
    if (u.team === 0) {
      if (u.kind === 'healer') { hx = this.mc.x - 70; hy = this.mc.y + 50; }
      else if (u.troop) hy = this.laneY(u.troop, u.slot);
      else if (u === this.mc) hy = 480;
      // lính xa chỉ tiến lên theo tiền tuyến
      const front = Math.min(this.frontX(), 800);
      if (u.kind === 'knight' || u.kind === 'pike' || u.kind === 'holy') hx = (u.troop ? this.anchorX(u.troop) : this.mc.x + 80) + 130;
      void front;
    } else { hx = 200; hy = u.y; }
    if (Math.abs(u.x - hx) > 6 || Math.abs(u.y - hy) > 8) { this.moveTo(u, hx, hy, spd, dt); u.act = 'walk'; }
    else { u.act = 'idle'; }
  }

  moveTo(u: Unit, tx: number, ty: number, spd: number, dt: number) {
    const dx = tx - u.x, dy = ty - u.y;
    const d = Math.hypot(dx, dy * 1.6);
    if (d < 1) return;
    const s = Math.min(spd * dt, d);
    u.x += (dx / d) * s;
    u.y += ((dy * 1.6) / d) * s * 0.62;
    u.y = Math.max(FIELD.top, Math.min(FIELD.bottom, u.y));
    if (Math.abs(dx) > 2) u.face = dx > 0 ? 1 : -1;
    u.act = 'walk';
  }

  separate(u: Unit, dt: number) {
    for (const o of this.units) {
      if (o === u || !o.alive || o.team !== u.team || o.spawnIn > 0) continue;
      const dx = u.x - o.x, dy = (u.y - o.y) * 1.6;
      const d = Math.hypot(dx, dy);
      const min = 46 * Math.max(1, u.scale * 0.8);
      if (d > 0.01 && d < min) { const p = (min - d) * 14 * dt; u.x += (dx / d) * p; u.y += (dy / d) * p * 0.6; }
    }
  }

  // ------------------------------------------------------------------ attack
  attack(u: Unit, tgt: Unit, aspd: number) {
    u.cd = 1 / aspd;
    u.act = 'attack'; u.actId++; u.face = tgt.x >= u.x ? 1 : -1;
    const S = this.S;
    // sát thủ ra khỏi tàng hình
    if (u.invis > 0 && u.kind === 'rogue') u.invis = 0;

    if (u === this.mc) { this.mcAttack(tgt); return; }

    if (u.team === 1) {
      const a = u.atk * (u.slow > 0 ? 0.85 : 1);
      if (u.ranged) {
        this.proj(u.set === 'rarc' || u.set === 'barc' ? 'arrow' : 'mag', u, tgt, a, 0, 560);
      } else this.hit(u, tgt, a);
      return;
    }

    switch (u.kind) {
      case 'knight':
        this.hit(u, tgt, u.atk);
        break;
      case 'pike': {
        const line = this.foes(0).filter((e) => Math.abs(e.y - tgt.y) < 40 && e.x >= tgt.x - 10 && e.x < tgt.x + 120).slice(0, 2);
        const pm = S.tiers.pike >= 2 ? 1.15 : 1;
        for (const e of line) { this.hit(u, e, u.atk * pm); if (!e.isBoss && !e.elite) e.x += 18; }
        break;
      }
      case 'archer': {
        this.proj('arrow', u, tgt, u.atk, 0, 700, S.tiers.archer >= 2 && Math.random() < 0.2 ? 1 : 0);
        break;
      }
      case 'wizard': {
        if (has(S, 44)) { this.castNow(u, tgt); }
        else { u.cast = 1.0; u.castTarget = tgt; u.act = 'cast'; u.actId++; this.fx('fxFire', u.x, u.y - 60, 0.9); }
        break;
      }
      case 'rogue': {
        this.hit(u, tgt, u.atk);
        break;
      }
      case 'healer': break;
    }
  }

  updateCast(u: Unit, dt: number) {
    u.cast -= dt;
    if (u.cast <= 0 && u.castTarget) {
      const t = u.castTarget.alive ? u.castTarget : this.nearest(u, this.foes(0));
      if (t) this.castNow(u, t);
      u.castTarget = null;
    }
  }

  castNow(u: Unit, t: Unit) {
    u.ice = !u.ice;
    const aoe = 110 * (this.S.tiers.wizard >= 2 ? 1.2 : 1);
    this.proj(u.ice ? 'ice' : 'fire', u, t, u.atk * 1.15, aoe, 420, 0, has(this.S, 34) && !u.ice ? 'burn' : u.ice ? 'freeze' : 'none');
  }

  proj(kind: Proj['kind'], src: Unit, tgt: Unit, dmg: number, aoe: number, speed: number, pierce = 0, apply: Proj['apply'] = 'none') {
    const crit = Math.random() < src.crit;
    this.projs.push({ id: UID++, kind, team: src.team, x: src.x + src.face * 24, y: src.y - 44 * src.scale, tx: tgt.x, ty: tgt.y - 30, speed, dmg, aoe, target: tgt, src, pierce, hitIds: [], crit, life: 3, apply });
  }

  stepProjs(dt: number) {
    for (let i = this.projs.length - 1; i >= 0; i--) {
      const p = this.projs[i];
      p.life -= dt;
      if (p.target && p.target.alive) { p.tx = p.target.x; p.ty = p.target.y - 30; }
      const dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy);
      const s = p.speed * dt;
      if (d <= s + 4 || p.life <= 0) { this.projHit(p); this.projs.splice(i, 1); continue; }
      p.x += (dx / d) * s; p.y += (dy / d) * s;
      if (p.kind === 'wave') {
        // sóng xuyên: va chạm trên đường đi
        for (const e of this.foes(p.team)) {
          if (p.hitIds.includes(e.id)) continue;
          if (Math.abs(e.x - p.x) < 40 && Math.abs(e.y - (p.y + 30)) < 55) { p.hitIds.push(e.id); this.hit(p.src, e, p.dmg, { noCrit: true }); }
        }
      }
    }
  }

  projHit(p: Proj) {
    if (p.kind === 'wave') return;
    const foes = this.foes(p.team);
    if (p.aoe > 0) {
      this.fx(p.kind === 'ice' ? 'fxSplash' : 'fxExplosion', p.tx, p.ty + 10, p.kind === 'ice' ? 0.9 : 0.8);
      for (const e of foes) {
        if (dist(e, { x: p.tx, y: p.ty + 30 }) <= p.aoe) {
          this.hit(p.src, e, p.dmg, { fixedCrit: p.crit, mag: true });
          if (p.apply === 'burn') this.applyBurn(e, p.src.atk);
          if (p.apply === 'freeze' && !e.isBoss) e.freeze = Math.max(e.freeze, 1.3);
          else if (p.apply === 'freeze') e.slow = Math.max(e.slow, 2);
        }
      }
    } else if (p.target && p.target.alive) {
      this.hit(p.src, p.target, p.dmg, { fixedCrit: p.crit, mag: p.kind === 'mag' });
      if (p.pierce > 0) {
        const nxt = foes.filter((e) => e !== p.target && Math.abs(e.y - p.target!.y) < 45 && e.x < p.target!.x + 110 && e.x > p.target!.x - 110)[0];
        if (nxt) this.hit(p.src, nxt, p.dmg * 0.7, {});
      }
    }
  }

  applyBurn(e: Unit, atk: number) { e.burn = 3; e.burnDps = atk * 0.22; e.burnTick = 0.5; }

  // ------------------------------------------------------------------ MC
  mcAttack(tgt: Unit) {
    const S = this.S, mc = this.mc;
    mc.hits++;
    mc.atkVar = mc.hits % 3;
    let mult = 1;
    if (has(S, 13)) mult *= 1 + 0.02 * this.units.filter((u) => u.team === 0 && u.alive && u !== mc).length;
    if (has(S, 25)) mult *= 1 + 0.5 * (1 - mc.hp / mc.maxHp);
    const atk = mc.atk * mult;
    const real = mc.atk;
    mc.atk = atk; // dmg dùng atk hiện thời
    const divine = mc.divine > 0;
    const beam = this.synergy?.id === 'storm';
    const rangedAtk = has(S, 28) || beam;
    if (divine) {
      for (const e of this.foes(0)) if (dist(e, mc) < 150) this.hit(mc, e, atk * 1.3, { trueDmg: true });
      this.fx('fxExplosion', mc.x + 60, mc.y - 20, 1.4);
    } else if (rangedAtk) {
      this.proj(has(S, 28) ? 'wave' : 'bolt', mc, tgt, atk * (beam ? 1.1 : 1), 0, 520);
    } else {
      this.hit(mc, tgt, atk);
      if (has(S, 20) && mc.hits % 3 === 0) {
        for (const e of this.foes(0)) if (e !== tgt && e.x > mc.x - 10 && dist(e, mc) < 130) this.hit(mc, e, atk * 0.8);
        this.fx('fxDust', mc.x + 70, mc.y - 10, 1.4);
      }
    }
    mc.atk = real;
    // đòn phụ thuộc node
    if (has(S, 34)) this.applyBurn(tgt, mc.atk);
    if (has(S, 35) && Math.random() < 0.3 && !tgt.isBoss) { tgt.slow = 3; }
    else if (has(S, 35) && Math.random() < 0.3) tgt.slow = 3;
    if (has(S, 40) && Math.random() < 0.1 && !tgt.isBoss) tgt.chaos = 3;
    if (has(S, 6)) {
      const ar = this.units.filter((u) => u.kind === 'archer' && u.alive);
      if (ar.length) this.proj('arrow', ar[0], tgt, ar[0].atk * 0.6, 0, 720);
    }
    // hàm combo quét theo hướng ngang
  }

  updateMc(dt: number) {
    const S = this.S, mc = this.mc;
    // Chiến Hống (kỹ năng chủ động cơ bản)
    const cdMul = has(S, 30) ? 0.8 : 1;
    mc.skillCd -= dt;
    if (mc.skillCd <= 0 && this.foes(0).length) {
      mc.skillCd = 10 * cdMul;
      this.fx('fxExplosion', mc.x + 40, mc.y - 20, 1.7);
      for (const e of this.foes(0)) if (dist(e, mc) < 190) {
        this.hit(mc, e, mc.atk * 1.8);
        if (!e.isBoss) e.x += 40;
      }
      this.txt(mc.x, mc.y - 130, 'WAR CRY', 0xffe08a, true);
    }
    if (has(S, 27)) { mc.shieldCd -= dt; if (mc.shieldCd <= 0) { mc.shield = mc.maxHp * 0.25; mc.shieldCd = 15; this.txt(mc.x, mc.y - 110, 'SHIELD', 0x9fd0ff); this.fx('fxHeal', mc.x, mc.y - 20, 1); } }
    if (has(S, 31) && mc.divine <= 0) {
      mc.divineCd -= dt;
      if (mc.divineCd <= 0 && this.foes(0).length) {
        mc.divine = 12; mc.divineCd = 60 * cdMul; mc.scale = 1.5;
        this.txt(mc.x, mc.y - 140, 'DIVINE FORM!', 0xffd34d, true); this.fx('fxExplosion2', mc.x, mc.y - 40, 2.2);
        if (this.opts.events) this.events.push({ k: 'shake', a: 8 });
      }
    }
    if (mc.divine <= 0 && mc.scale > 1) mc.scale = 1;
    if (has(S, 16) && !this.holySummoned && mc.hp / mc.maxHp < 0.3) {
      this.holySummoned = true;
      for (let i = 0; i < 4; i++) {
        const h = this.mk(0, 'holy', 'holy', { x: mc.x + 20 + i * 18, y: FIELD.top + 40 + i * 60, hp: mc.maxHp * 0.25, maxHp: mc.maxHp * 0.25, atk: mc.atk * 0.45, def: mc.def, range: 76, aspd: 1.1, speed: 140, scale: 1, lifetime: 18, threat: 8, ranged: false });
        this.fx('fxExplosion', h.x, h.y, 0.9);
      }
      this.txt(mc.x, mc.y - 140, 'HOLY KNIGHTS!', 0xfff1a0, true);
    }
  }

  updateKnight(u: Unit, dt: number) {
    u.guardCd -= dt;
    if (u.guardCd <= 0 && this.foes(0).some((e) => dist(e, u) < 260)) {
      u.guardCd = 12; u.guardActive = 3;
      if (has(this.S, 12)) {
        const wz = this.units.filter((w) => w.kind === 'wizard' && w.alive);
        const foes = this.foes(0);
        if (wz.length && foes.length) for (const w of wz) this.proj('fire', w, foes[Math.floor(Math.random() * foes.length)], w.atk * 0.9, 100, 420, 0, 'none');
      }
    }
  }

  updateHealer(u: Unit, dt: number) {
    const S = this.S;
    u.healCd -= dt * (this.synergy?.id === 'balance' ? 1.25 : 1) * (u.slow > 0 ? 0.6 : 1);
    if (u.healCd <= 0 && u.stun <= 0 && u.freeze <= 0) {
      const al = this.units.filter((a) => a.team === 0 && a.alive && a.hp < a.maxHp * 0.98);
      if (al.length) {
        let t = this.mc.alive && this.mc.hp < this.mc.maxHp * 0.98 ? this.mc : al.reduce((a, b) => (a.hp / a.maxHp < b.hp / b.maxHp ? a : b));
        if (this.mc.alive && this.mc.hp / this.mc.maxHp < 0.7) t = this.mc;
        if (dist(u, t) < u.range + 150) {
          u.healCd = 1 / u.aspd;
          u.act = 'attack'; u.actId++; u.face = t.x >= u.x ? 1 : -1;
          const pw = this.S.tiers.healer >= 2 ? 1.2 : 1;
          this.heal(t, this.mc.maxHp * 0.045 * pw * (u.maxHp > 0 ? 1 : 1));
          this.fx('fxHeal', t.x, t.y - 30, 0.9);
        }
      } else u.healCd = 0.4;
    }
    if (has(S, 10)) {
      u.bossCd -= dt;
      if (u.bossCd <= 0) {
        u.bossCd = 8;
        for (const a of this.units) if (a.team === 0 && a.alive) this.heal(a, this.mc.maxHp * 0.08 / Math.max(1, this.units.filter((h) => h.kind === 'healer' && h.alive).length));
        this.fx('fxHeal', this.mc.x, this.mc.y - 20, 1.7);
      }
    }
  }

  updateBoss(u: Unit, dt: number) {
    u.skillCd -= dt;
    if (u.skillCd <= 0) {
      u.skillCd = 8;
      const pl = this.units.filter((e) => e.team === 0 && e.alive && Math.abs(e.x - u.x) < 260);
      this.txt(u.x, u.y - 150, '!!', 0xff6a5a, true);
      this.fx('fxExplosion2', u.x - 90, u.y, 2);
      if (this.opts.events) this.events.push({ k: 'shake', a: 6 });
      for (const e of pl) {
        this.hit(u, e, u.atk * 1.8, { aoeBoss: true, noCrit: true });
        if (e.divine <= 0 && !(e === this.mc && e.immuneT > 0)) e.stun = 1.2;
      }
    }
  }
}
