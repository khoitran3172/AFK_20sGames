import { Battle } from '../src/core/battle';
import { newSave, power, mcStats } from '../src/core/state';
import { ARENAS } from '../src/data/arenas';

const s = newSave();
console.log('mc', mcStats(s), 'power', power(s), 'rec0', ARENAS[0].recPower);
for (const mode of ['farm', 'boss'] as const) {
  const b = new Battle(s, 0, { events: false, mode });
  const t0 = Date.now();
  let steps = 0;
  while (b.time < 120 && b.state === 'run') { b.step(0.05); steps++; }
  console.log(mode, 'state', b.state, 'time', b.time.toFixed(1), 'kills', b.kills, 'deaths', b.deaths, 'rew', b.rewards, 'ms', Date.now() - t0, 'mcHp', b.mc.hp.toFixed(0), '/', b.mc.maxHp.toFixed(0));
}
