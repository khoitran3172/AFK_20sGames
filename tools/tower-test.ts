// Tháp: leo bằng save mẫu (lên Arena N) và xem đi được mấy tầng
import { Battle, towerMul } from '../src/core/battle';
import { newSave, power } from '../src/core/state';
console.log('mul f1', towerMul(1).toFixed(2), 'f5', towerMul(5).toFixed(2), 'f10', towerMul(10).toFixed(2));
for (const lv of [0, 6, 12, 18, 25]) {
  const s = newSave(); s.lv = { hp: lv, atk: lv, def: lv };
  const b = new Battle(s, 0, { events: false, mode: 'tower' });
  let t = 0; while (b.state === 'run' && t < 1500) { b.step(0.05); t += 0.05; }
  console.log('stat lv', lv, 'power', power(s), 'cleared', b.cleared, 'time', Math.round(t));
}
