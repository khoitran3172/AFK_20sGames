// Mô phỏng người chơi idle "tham lam": farm -> nâng cấp -> khiêu chiến Boss. Dùng để chỉnh cân bằng.
// Chạy: npm run sim [-- số_phút_mỗi_chunk]
import { Battle } from '../src/core/battle';
import { ARENAS, TOTAL_ARENAS } from '../src/data/arenas';
import { SKILLS } from '../src/data/skills';
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
  // chỉ số theo giá rẻ nhất
  for (let i = 0; i < 400; i++) {
    const keys: StatKey[] = ['hp', 'atk', 'def'];
    keys.sort((a, b) => statCost(s, a) - statCost(s, b));
    if (!upgradeStat(s, keys[0])) break;
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
  const CHUNK = Math.max(MINCHUNK, t * 0.02); s.gold += r.g * CHUNK; s.stones += r.st * CHUNK; s.badges += r.bd * CHUNK; t += CHUNK;
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
