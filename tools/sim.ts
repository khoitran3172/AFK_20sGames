// Mô phỏng người chơi idle "tham lam": farm -> nâng cấp -> khiêu chiến Boss. Dùng để chỉnh cân bằng.
// Chạy: npm run sim [-- số_phút_mỗi_chunk]
import { Battle } from '../src/core/battle';
import { ARENAS, TOTAL_ARENAS } from '../src/data/arenas';
import { SKILLS } from '../src/data/skills';
import { MAX_SITE_LV, SITE_DEF, SITE_TYPES, lvOf, siteRate, upgradeCost, upgradeSite, villageRates } from '../src/core/village';
import { canUnlock, evolveTroop, mcStats, newSave, nextSkillCost, power, statCost, unlockSkill, upgradeStat, Save, StatKey, has } from '../src/core/state';

const MINCHUNK = Number(process.argv[2] ?? 30);
const ORDER = [...SKILLS].filter((s) => s.id !== 1).sort((a, b) => a.tier - b.tier || ({ B: 0, C: 1, A: 2, root: 3 } as any)[a.branch] - ({ B: 0, C: 1, A: 2, root: 3 } as any)[b.branch] || a.id - b.id);

function measure(s: Save, arena: number, secs = 20) {
  const b = new Battle(s, arena, { events: false, mode: 'farm' });
  while (b.time < secs) b.step(0.05);
  return { g: b.rewards.gold / b.time, st: b.rewards.stones / b.time, bd: b.rewards.badges / b.time, deaths: b.deaths, kills: b.kills };
}
function spend(s: Save) {
  // kỹ năng theo thứ tự
  for (const n of ORDER) {
    if (has(s, n.id)) continue;
    if (canUnlock(s, n.id) === 'ok') { unlockSkill(s, n.id); continue; }
    if (canUnlock(s, n.id) === 'req') continue;
    break;
  }
  // tiến hóa quân
  for (const id of s.squad) evolveTroop(s, id);
  // làng (thời gian hoàn vốn ngắn) rồi tới chỉ số
  for (let i = 0; i < 600; i++) {
    let best: { a: number; t: (typeof SITE_TYPES)[number]; cost: number; pay: number } | null = null;
    for (let a = Math.max(0, s.unlocked - 5); a <= Math.min(s.unlocked, TOTAL_ARENAS - 1); a++) for (const t of SITE_TYPES) {
      const L = lvOf(s, a, t);
      if (L >= MAX_SITE_LV) continue;
      const cost = upgradeCost(a, L, t);
      const before = siteRate(s, a, t);
      if (!s.vil[a]) s.vil[a] = [0, 0, 0, 0];
      s.vil[a][SITE_TYPES.indexOf(t)] = L + 1;
      const after = siteRate(s, a, t);
      s.vil[a][SITE_TYPES.indexOf(t)] = L;
      const w = SITE_DEF[t].res === 'gold' ? 1 : SITE_DEF[t].res === 'stones' ? 25 : 300;
      const pay = cost / Math.max(1e-9, (after - before) * w);
      if (!best || pay < best.pay) best = { a, t, cost, pay };
    }
    const keys: StatKey[] = ['hp', 'atk', 'def'];
    keys.sort((x, y) => statCost(s, x) - statCost(s, y));
    const stat = keys[0];
    // chi tiêu xen kẽ: làng khi hoàn vốn < 40 phút, ngược lại (hoặc theo lượt chẵn) nâng chỉ số
    const useVillage = !!best && best.pay < 2400 && i % 2 === 0;
    if (useVillage && best) { if (!upgradeSite(s, best.a, best.t)) { if (!upgradeStat(s, stat)) break; } }
    else if (!upgradeStat(s, stat)) { if (best && upgradeSite(s, best.a, best.t)) continue; break; }
  }
}

const s = newSave();
let t = 0;
const log: string[] = [];
let fails = 0, lastClear = 0;
s.squad = ['knight', 'archer', 'healer'];
while (s.unlocked < TOTAL_ARENAS && t < 3600 * 400) {
  const A = ARENAS[s.unlocked];
  const r = measure(s, s.unlocked);
  const CHUNK = Math.max(MINCHUNK, t * 0.02); const vr = villageRates(s); s.gold += (r.g + vr.gold) * CHUNK; s.stones += (r.st + vr.stones) * CHUNK; s.badges += (r.bd + vr.badges) * CHUNK; t += CHUNK;
  spend(s);
  const p = power(s);
  if (p >= A.recPower) {
    const b = new Battle(s, s.unlocked, { events: false, mode: 'boss' });
    while (b.state === 'run' && b.time < 240) b.step(0.05);
    if (b.state === 'won') {
      s.gold += b.rewards.gold; s.stones += b.rewards.stones; s.badges += b.rewards.badges;
      log.push(`A${String(A.index + 1).padStart(2)} ${A.name.padEnd(13)} clear@${(t / 3600).toFixed(2).padStart(7)}h (+${((t - lastClear) / 60).toFixed(0).padStart(4)}m) power ${String(p).padStart(10)} rec ${String(A.recPower).padStart(10)} fails ${fails} skills ${s.skills.length} g/min ${(r.g * 60).toExponential(1)} deaths/40s ${r.deaths} mcHP ${mcStats(s).hp.toExponential(1)}`);
      s.unlocked++; lastClear = t; fails = 0;
    } else fails++;
  }
}
console.log(log.join('\n'));
console.log('TOTAL', (t / 3600).toFixed(1), 'giờ; arena', s.unlocked, 'skills', s.skills.length, 'tiers', JSON.stringify(s.tiers));
