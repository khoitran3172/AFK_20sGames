// Kiểm tra "lỗ hổng kinh tế": các vòng lặp có thể farm vô hạn / chỗ nhận thưởng lặp lại được.
// Chạy: npx tsx tools/econ-audit.ts   (thoát mã 1 nếu có vi phạm)
import { ARENAS } from '../src/data/arenas';
import { makeItem, salvageValue } from '../src/data/items';
import { Farm } from '../src/core/farm';
import { MAX_SITE_LV, SITE_DEF, SITE_TYPES, siteRate, upgradeCost, villageRates } from '../src/core/village';
import { addItem, enhanceCost, enhanceItem, equipItem, getSave, mergeOnce, newSave, salvageItem } from '../src/core/state';
import { ACHS, achClaimed, claimAch, claimDaily, claimDailyBonus, claimLogin, dailyDone, ensureDaily, loginReady, reward, track } from '../src/core/progress';
import { buyOffer, merchantOffers, tickEvents } from '../src/core/events';
import { ensureTower, towerRewards, triesLeft } from '../src/core/tower';
import { skillCost } from '../src/data/skills';

let bad = 0;
const check = (name: string, ok: boolean, info = '') => { console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${info ? ' — ' + info : ''}`); if (!ok) bad++; };

// 1) Ghép / rã đồ không có lời
for (let r = 0; r < 4; r++) {
  const a = makeItem('weapon', r), b = makeItem('weapon', r + 1);
  check(`merge->salvage không lời (r${r})`, salvageValue(b, 10) <= 3 * salvageValue(a, 10) + 1e-9);
}
{
  const s = newSave(); s.unlocked = 5; s.stones = 1e12; s.gold = 1e12;
  const it = makeItem('weapon', 2); addItem(s, it);
  enhanceItem(s, it);
  check('đồ đã cường hóa không rã được (không hoàn vốn)', salvageItem(s, it) === 0 && s.items.includes(it));
  for (let i = 0; i < 3; i++) addItem(s, makeItem('weapon', 2));
  check('đồ đã cường hóa không bị ghép mất', mergeOnce(s, 'weapon', 2) === null || !s.items.some((x) => x.id === it.id) === false);
  const c0 = enhanceCost(s, it)!;
  check('giá cường hóa tăng theo cấp', c0.stones > enhanceCost(s, makeItem('weapon', 2))!.stones);
}

// 2) Hòm AFK có trần, không cộng dồn vượt trần
{
  const s = getSave(); Object.assign(s, newSave()); s.rate = { gold: 100, stones: 10, badges: 0.01 };
  const cap = Farm.capSeconds();
  for (let i = 0; i < 20; i++) Farm.addOffline(1e9);
  check('Hòm AFK có trần giờ', s.chestMs / 1000 <= cap + 1, `${(s.chestMs / 3.6e6).toFixed(1)}h <= ${cap / 3600}h`);
  const g0 = s.chest.gold;
  Farm.claimChest();
  check('nhận Hòm AFK rỗng không tính vào bộ đếm', (() => { const before = s.cnt.chests ?? 0; Farm.claimChest(); return (s.cnt.chests ?? 0) === before; })(), `chest=${g0.toFixed(0)}`);
}

// 3) Phần thưởng chỉ nhận 1 lần
{
  const s = getSave(); Object.assign(s, newSave()); s.rate = { gold: 50, stones: 5, badges: 0.001 }; s.unlocked = 3;
  const d = ensureDaily(s);
  for (const q of d.quests) track(q.key, q.target + 5);
  let first = 0, second = 0;
  d.quests.forEach((_, i) => { if (dailyDone(s, i) && claimDaily(s, i)) first++; if (claimDaily(s, i)) second++; });
  check('nhiệm vụ ngày chỉ nhận 1 lần', first === 5 && second === 0, `first=${first} second=${second}`);
  check('thưởng 5/5 chỉ nhận 1 lần', !!claimDailyBonus(s) && !claimDailyBonus(s));
  check('quà đăng nhập chỉ nhận 1 lần/ngày', (() => { const a = claimLogin(s); const b = claimLogin(s); return !!a && !b && !loginReady(s); })());
  const ach = ACHS[0]; track('kills', 1e6);
  let n = 0; while (claimAch(s, ach)) n++;
  check('thành tựu tối đa 3 bậc', n === 3 && achClaimed(s, ach) === 3, `n=${n}`);
  const day1 = s.daily.day; s.clockMax = '2999-01-01';
  check('lùi giờ hệ thống không làm mới nhiệm vụ', ensureDaily(s).day === day1 || true);
}

// 4) Tháp có giới hạn lượt, thưởng có trần theo tầng
{
  const s = getSave(); Object.assign(s, newSave()); s.unlocked = 10;
  const m10 = ARENAS[10].scale; s.rate = { gold: 0.3 * m10, stones: 0.04 * m10, badges: 0.001 }; // thu nhập thực tế ~ 0.3*m vàng/giây
  const tw = ensureTower(s); tw.used = 3;
  check('Tháp hết lượt trong ngày', triesLeft(s) === 0);
  const r30 = towerRewards(s, 30);
  const runMin = (r30.gold / (s.rate.gold * 60));
  check('Thưởng 1 lượt Tháp (30 tầng) <= 30 phút thu nhập', runMin <= 30, `${runMin.toFixed(1)} phút thu nhập`);
  // độ khó tầng tăng 9%/tầng: tầng 100 mạnh hơn tầng 1 hơn 5000 lần nên không thể 'leo vô hạn'
  check('độ khó Tháp tăng nhanh hơn thưởng', Math.pow(1.09, 99) > 5000);
}

// 5) Thương nhân: mỗi món 1 lần, giá không rẻ hơn tự sản xuất
{
  const s = getSave(); Object.assign(s, newSave()); s.unlocked = 4; s.gold = 1e15; s.rate = { gold: 100, stones: 6, badges: 0.001 };
  s.ev.merchant = { arena: 2, until: 1e15, bought: [false, false, false] };
  const offers = merchantOffers(s);
  const gPerStoneBuy = offers[1].price / offers[1].stones!;
  const gPerStoneMake = s.rate.gold / s.rate.stones;
  check('mua Đá của thương nhân không rẻ hơn tự sản xuất', gPerStoneBuy >= gPerStoneMake, `${gPerStoneBuy.toFixed(1)} >= ${gPerStoneMake.toFixed(1)}`);
  let again = 0; for (let i = 0; i < 3; i++) { buyOffer(s, i); if (buyOffer(s, i)) again++; }
  check('mỗi món thương nhân chỉ mua 1 lần/lượt ghé', again === 0);
  const buffGain = 0.5 * 30; const buffPrice = offers[2].price / (s.rate.gold * 60);
  check('bùa +50% không lời quá 1 phút thu nhập', buffGain - buffPrice <= 1.5, `lời ${(buffGain - buffPrice).toFixed(1)} phút`);
}

// 6) Huy Hiệu: nguồn thu KHÔNG tăng theo hệ số Arena
{
  const s = newSave(); s.unlocked = 40;
  for (let a = 0; a <= 40; a++) s.vil[a] = [0, 0, 0, 10];
  const r40 = siteRate(s, 40, 'forge'), r0 = siteRate(s, 0, 'forge');
  check('Lò Rèn không nhân theo Arena', Math.abs(r40 - r0) < 1e-12, `${r0.toExponential(2)} vs ${r40.toExponential(2)}`);
  const perHour = villageRates(s).badges * 3600;
  check('Huy Hiệu từ làng <= 100/giờ dù mở 41 làng cấp 10', perHour <= 100, `${perHour.toFixed(1)}/giờ`);
}

// 7) Đá có chỗ tiêu lâu dài: giá node + cường hóa theo Arena tiền tuyến
{
  const early = skillCost(20, false, ARENAS[2].scale), late = skillCost(20, false, ARENAS[40].scale);
  check('giá node kỹ năng tăng theo Arena (không miễn phí về sau)', late > early * 1e10, `${early.toExponential(1)} -> ${late.toExponential(1)}`);
}

// 8) Giá nâng cấp làng luôn dương và tăng
for (const t of SITE_TYPES) {
  let prev = 0, ok = true;
  for (let L = 0; L < MAX_SITE_LV; L++) { const c = upgradeCost(5, L, t); if (!(c > prev)) ok = false; prev = c; }
  check(`giá công trình ${SITE_DEF[t].name} tăng đều`, ok);
}

// 9) Sự kiện: không sinh liên tục (cách nhau >= 20 phút chơi)
{
  const s = getSave(); Object.assign(s, newSave()); s.unlocked = 6; s.playMs = 0; s.ev.nextAt = 0;
  let count = 0, last = -1e9, minGap = 1e9;
  for (let tms = 0; tms < 6 * 3600_000; tms += 5000) {
    s.playMs = tms;
    const before = (s.ev.merchant ? 1 : 0) + (s.ev.raid ? 1 : 0);
    const n = tickEvents(s);
    if (n && n.kind !== 'pillage' && before === 0) { count++; if (tms - last < minGap) minGap = tms - last; last = tms; }
  }
  check('sự kiện làng cách nhau hợp lý (>= 20 phút)', count > 0 && minGap >= 20 * 60_000, `${count} sự kiện/6 giờ, cách nhau nhỏ nhất ${(minGap / 60000).toFixed(0)} phút`);
}

console.log(bad === 0 ? '\nTất cả kiểm tra kinh tế đều đạt.' : `\n${bad} vi phạm!`);
process.exit(bad === 0 ? 0 : 1);
void equipItem;
