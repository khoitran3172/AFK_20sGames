// Kiểm thử hồi quy: mở hết 46 kỹ năng, thử mọi bộ 3 binh chủng trên vài Arena, đảm bảo không lỗi/NaN.
import { Battle } from '../src/core/battle';
import { newSave } from '../src/core/state';
import { SKILLS } from '../src/data/skills';
import { TROOP_ORDER, TroopId } from '../src/data/troops';

const combos: TroopId[][] = [];
for (let i = 0; i < TROOP_ORDER.length; i++) for (let j = i + 1; j < TROOP_ORDER.length; j++) for (let k = j + 1; k < TROOP_ORDER.length; k++) combos.push([TROOP_ORDER[i], TROOP_ORDER[j], TROOP_ORDER[k]]);
let bad = 0;
for (const all of [false, true]) {
  for (const arena of [0, 30]) {
    for (const sq of combos) {
      const s = newSave();
      if (all) s.skills = SKILLS.map((k) => k.id);
      s.squad = sq;
      if (all) for (const id of TROOP_ORDER) s.ttree[id] = 4;
      s.lv = { hp: 20, atk: 20, def: 20 };
      for (const mode of ['farm', 'boss'] as const) {
        const b = new Battle(s, arena, { events: true, mode });
        let steps = 0;
        while (b.time < 90 && b.state === 'run') { b.step(0.05); b.events.length = 0; steps++; }
        const nan = b.units.some((u) => !isFinite(u.hp) || !isFinite(u.x) || !isFinite(u.y));
        if (nan) { bad++; console.log('NaN', all, arena, sq.join('+'), mode); }
      }
    }
  }
}
console.log('combos', combos.length, 'bad', bad);
const s = newSave(); s.skills = SKILLS.map((k) => k.id); s.lv = { hp: 25, atk: 25, def: 25 }; s.squad = ['knight', 'wizard', 'healer'];
const b = new Battle(s, 5, { events: false, mode: 'boss' });
while (b.state === 'run' && b.time < 200) b.step(0.05);
console.log('all-skills boss result', b.state, b.time.toFixed(1), 'mcHp', b.mc.hp.toFixed(0), '/', b.mc.maxHp.toFixed(0), 'kills', b.kills);
