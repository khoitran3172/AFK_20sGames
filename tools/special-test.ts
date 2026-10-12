// Kiểm tra nhanh: mọi node đặc tính cây quân + node 47-64 chạy trong trận không lỗi / không NaN
import { Battle } from '../src/core/battle';
import { SKILLS } from '../src/data/skills';
import { TROOP_ORDER } from '../src/data/troops';
import { newSave } from '../src/core/state';

let bad = 0;
for (const mode of ['farm', 'boss'] as const) {
  for (let i = 0; i < TROOP_ORDER.length; i++) {
    const s = newSave();
    s.skills = SKILLS.map((k) => k.id);
    s.lv = { hp: 25, atk: 25, def: 25 };
    s.squad = [TROOP_ORDER[i], TROOP_ORDER[(i + 3) % 9], TROOP_ORDER[(i + 6) % 9]];
    for (const id of TROOP_ORDER) s.ttree[id] = 4;
    const b = new Battle(s, 3, { events: true, mode });
    let t = 0;
    while (t < 90 && b.state === 'run') { b.step(0.05); t += 0.05; b.events.length = 0; }
    const nan = b.units.some((u) => !isFinite(u.hp) || !isFinite(u.atk));
    if (nan) { bad++; console.log('NaN', mode, s.squad); }
  }
}
console.log('special test bad', bad);
