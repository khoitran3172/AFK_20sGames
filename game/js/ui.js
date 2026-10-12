'use strict';
/* =====================================================================
   GIAO DIỆN (DOM)
   ===================================================================== */
const $ = s => document.querySelector(s);
const DEV = /[?&]dev=1/.test(location.search);
function toast(t) { const d = document.createElement('div'); d.textContent = t; $('#toast').appendChild(d); setTimeout(() => d.remove(), 3300); }

/* ---------- icon helpers ---------- */
const SHEETS = { items: [352, 832], rogues: [224, 224], monsters: [384, 416], animals: [288, 512] };
function ico(spec, size = 24) {
  if (spec.img) return `<img src="${spec.img}" width="${size}" height="${size}" style="object-fit:contain;flex:none">`;
  const k = size / 32, [sw, sh] = SHEETS[spec.sheet]; return `<span class="ico px" style="width:${size}px;height:${size}px;background:url(assets/rg/${spec.sheet}.png) -${spec.c * 32 * k}px -${spec.r * 32 * k}px/${sw * k}px ${sh * k}px"></span>`;
}
const COIN = { img: 'assets/ts/Icon_03.png' };
const TICKET = { sheet: 'items', c: 0, r: 21 };
function heroImg(h, size = 48, cls) {
  const k = size / 32, r = cls || h.r, sh = h.sh || 'rogues', [sw, sht] = SHEETS[sh];
  return `<span class="hs ${r}" style="width:${size + 4}px;height:${size + 4}px;background-image:url(assets/rg/${sh}.png);background-size:${sw * k}px ${sht * k}px;background-position:-${h.c * 32 * k}px -${h.rw * 32 * k}px"></span>`;
}
function gearImg(g, size = 40) {
  const k = size / 32; return `<span class="gi ${g.r}" style="width:${size + 4}px;height:${size + 4}px;background-size:${352 * k}px ${832 * k}px;background-position:-${g.c * 32 * k}px -${g.rw * 32 * k}px"></span>`;
}
const gemI = () => '<span class="gemi"></span>';
const tag = r => `<span class="tag ${r}">${r}</span>`;

/* ---------- Tab ---------- */
const TABS = [
  ['village', 'Công trình', { img: TS('House2') }, 'Công trình & Kho'], ['trade', 'Thương mại', { sheet: 'items', c: 2, r: 24 }, 'Thương mại'],
  ['gacha', 'Chiêu mộ', { sheet: 'items', c: 0, r: 21 }, 'Chiêu mộ thẻ'], ['battle', 'Đấu Thẻ', { sheet: 'items', c: 2, r: 0 }, 'Đấu Thẻ — Chiến dịch'], ['team', 'Nhân sự', { sheet: 'rogues', c: 0, r: 1 }, 'Nhân sự'],
  ['gear', 'Trang bị', { sheet: 'items', c: 5, r: 12 }, 'Trang bị'], ['journey', 'Hành trình', { sheet: 'items', c: 6, r: 21 }, 'Hành Trình 7 Ngày'],
  ['quest', 'Nhiệm vụ', { sheet: 'items', c: 1, r: 21 }, 'Nhiệm vụ & Điểm danh'], ['pass', 'Sổ Hội', { sheet: 'items', c: 0, r: 22 }, 'Sổ Thương Hội'],
  ['rival', 'Xếp hạng', { sheet: 'items', c: 5, r: 17 }, 'Bảng Xếp Hạng'], ['more', 'Khác', { img: TS('Icon_10') }, 'Cài đặt'],
];
let tab = null;
function setTab(t) { tab = (tab === t) ? null : t; lastMain = ''; render(); }

/* ---------- Header ---------- */
function renderRes() {
  const cap = capacity(), prod = g => { const b = BKEYS.find(b => BUILD[b].good === g); return prodOf(b); };
  const chips = [`<div class="chip" style="min-width:120px">${ico(COIN)}${fmt(S.gold)}<small>+${fmt1(goldRate())}/s</small></div>`];
  for (const g of GOODS) { const full = S[g] >= cap * 0.98; chips.push(`<div class="chip ${full ? 'warn' : ''}" style="min-width:84px" title="Kho ${fmt(S[g])}/${fmt(cap)}">${ico(GOOD[g].icon, 22)}${fmt(S[g])}<small>${full ? 'ĐẦY' : ''}</small></div>`); }
  chips.push(`<div class="chip">${gemI()}${fmt(S.gems)}</div>`);
  chips.push(`<div class="chip" style="min-width:60px">${ico(TICKET, 22)}${S.tickets}</div>`);
  if (S.renown) chips.push(`<div class="chip" title="Danh Vọng">🏅 ${S.renown}</div>`);
  return chips.join('');
}
function renderGuild() { const need = guildXpNeed(S.guildLv); return `<div class="gpl" data-a="tab:journey"><img src="${TS('Castle')}"><div><b>Thương Hội Cấp ${S.guildLv}</b><div class="bar" style="width:104px"><i style="width:${S.guildXp / need * 100}%"></i></div></div></div>`; }
function renderGolden() {
  const gi = goldenInfo();
  return gi.active ? `<div class="gbar">🌟 GIỜ VÀNG! Giao hàng x1.5 · Ngọc x2 · còn ${fmtT(gi.end)}</div>`
    : `<div class="gbar idle">Giờ Vàng kế tiếp sau ${fmtT(gi.next)} (12:00 · 20:00)</div>`;
}
function renderHint() { const h = nextHint(); return `<span>👉</span><div class="sp"><b>Gợi ý:</b> ${h.t}</div><button class="gold" data-a="goto:${h.tab}">Đi</button>`; }
function renderNav() { const b = badges(); return TABS.map(([k, l, ic]) => `<button class="dk ${tab === k ? 'on' : ''} ${b[k] ? 'dot' : ''}" data-a="tab:${k}"><span class="dki">${ico(ic, 32)}</span>${l}</button>`).join(''); }

/* ---------- Panels ---------- */
function heroOpts(slot) {
  const owned = HEROES.filter(h => S.own[h.id]).sort((a, b) => heroBuff(b, slot) - heroBuff(a, slot));
  return `<select data-assign="${slot}"><option value="">— Trống —</option>` + owned.map(h => `<option value="${h.id}" ${S.assign[slot] === h.id ? 'selected' : ''}>[${h.r}] ${h.n} ${'★'.repeat(S.own[h.id].star)} Lv${S.own[h.id].lv} (+${Math.round(heroBuff(h, slot) * 100)}%${h.job === slot ? ' khớp nghề' : ''})</option>`).join('') + `</select>`;
}
function slotBox(slot) {
  const id = S.assign[slot], h = id != null ? HEROES[id] : null;
  return `<div class="slot">${h ? heroImg(h, 40) : '<span class="hs empty" style="width:44px;height:44px">+</span>'}<div class="sp"><div class="mut">Nhân sự ${JOBN[slot]}</div>${heroOpts(slot)}</div><div class="up">${h ? '+' + Math.round(slotBuff(slot) * 100) + '%' : ''}</div></div>`;
}
function lockCard(name, day) { return `<div class="card lock"><div class="row"><span style="font-size:26px">🔒</span><div class="sp"><b>${name}</b><div class="mut">Mở khi đạt ${gateTxt(day)} (hiện Cấp ${S.guildLv})</div></div></div></div>`; }

function pVillage() {
  const cap = capacity();
  const builds = BKEYS.map(k => {
    const b = BUILD[k]; if (!featOn(b.unlockDay)) return lockCard(b.n, b.unlockDay);
    const l = S.lv[k], c = upCost(k), nm = MILESTONES.find(m => m > l);
    return `<div class="card"><div class="row">${ico(GOOD[b.good].icon, 40)}<div class="sp"><b>${b.n}</b> <span class="mut">Lv ${l}${mile(l) > 1 ? ' · x' + mile(l) : ''}</span><div class="mut">${l ? '+' + fmt1(prodOf(k)) + ' ' + GOOD[b.good].n + '/s' : b.desc}${nm ? ` · mốc x2 ở Lv ${nm}` : ''}</div></div>
      <button class="gold" data-a="up:${k}" ${S.gold < c ? 'disabled' : ''}>${l ? 'Nâng' : 'Xây'}<br><small>${fmt(c)}</small></button><button class="sm gold" data-a="upmax:${k}" ${S.gold < c ? 'disabled' : ''}>MAX</button></div>${l ? slotBox(k) : ''}</div>`;
  }).join('');
  const facs = FKEYS.map(k => {
    const f = FAC[k]; if (!featOn(f.unlockDay)) return lockCard(f.n, f.unlockDay);
    const l = S.fac[k], c = facCost(k);
    return `<div class="row" style="margin:6px 0"><div class="sp"><b>${f.n}</b> <span class="mut">Lv ${l}/${f.max}</span><div class="mut">${f.desc(l)}</div></div><button class="blue" data-a="fac:${k}" ${S.gold < c || l >= f.max ? 'disabled' : ''}>${l >= f.max ? 'MAX' : fmt(c) + ' 🪙'}</button></div>`;
  }).join('');
  const stock = GOODS.map(g => `<div class="row" style="margin:3px 0">${ico(GOOD[g].icon, 20)}<div class="sp"><div class="bar ${S[g] >= cap * .98 ? 'red' : ''}"><i style="width:${Math.min(100, S[g] / cap * 100)}%"></i></div></div><span class="mut" style="width:96px;text-align:right">${fmt(S[g])}/${fmt(cap)}</span></div>`).join('');
  const pc = canPrestige(), pg = renownGain();
  const prest = featOn(3) ? `<div class="card"><h3>🏅 Mở Chi Nhánh (Prestige)</h3><div class="mut">Đặt lại vàng + công trình sản xuất (giữ anh hùng, trang bị, ngọc, hạ tầng). Nhận Danh Vọng: mỗi điểm +5% sản lượng vĩnh viễn.</div><div class="row" style="margin-top:6px"><div class="sp">Danh Vọng hiện có: <b>${S.renown}</b> · Nhận thêm: <b class="up">+${pg}</b><div class="mut">Thu nhập lần này: ${fmt(S.prestige.run)} (cần ≥ 50K)</div></div><button class="red" data-a="prestige" ${pc ? '' : 'disabled'}>Mở chi nhánh</button></div></div>` : lockCard('Mở Chi Nhánh (Prestige)', 3);
  return `<div class="card"><h3>Kho hàng & Auto-Trade</h3>${stock}
    <div class="row" style="margin-top:8px"><button class="${S.auto ? '' : 'red'}" data-a="auto">Auto-Trade: ${S.auto ? 'BẬT' : 'TẮT'}</button><span class="mut sp">Bán tự động ${Math.round(autoPct() * 100)}% giá. Giữ lại trong kho:</span>
    <select data-hold>${[0, .25, .5, .75].map(v => `<option value="${v}" ${S.hold === v ? 'selected' : ''}>${v * 100}%</option>`).join('')}</select></div>
    <div class="mut" style="margin-top:4px">Kho đầy = sản xuất dừng. Giữ hàng rồi giao thủ công lúc Giờ Vàng để được 100% giá x1.5.</div></div>
    ${builds}<div class="card"><h3>Hạ tầng thành phố</h3>${facs}</div>${prest}`;
}

function spark(g) {
  const h = S.hist[g], w = 200, hh = 32; const pts = h.map((v, i) => `${i / Math.max(h.length - 1, 1) * w},${hh - (v - 0.5) / 1.4 * hh}`).join(' ');
  return `<svg class="spark" viewBox="0 0 ${w} ${hh}" preserveAspectRatio="none"><polyline fill="none" stroke="${h[h.length - 1] >= (h[h.length - 2] || 0) ? '#6cd06c' : '#e0594f'}" stroke-width="2" points="${pts}"/></svg>`;
}
function pTrade() {
  const gm = goldenMult(); const mk = GOODS.map(g => { const p = S.price[g]; return `<div style="flex:1;min-width:150px"><div class="row">${ico(GOOD[g].icon, 22)}<b>${GOOD[g].n}</b><span class="sp"></span><span class="${p >= 1 ? 'up' : 'dn'}">${(marketPrice(g) * gm).toFixed(1)}🪙</span></div>${spark(g)}<div class="mut">Kho: ${fmt(S[g])}</div></div>`; }).join('');
  const sellVal = GOODS.reduce((a, g) => a + Math.floor(S[g]) * marketPrice(g) * gm * 1.1, 0);
  const slots = caravanSlots();
  const active = S.caravans.map((c, i) => { const R = ROUTES[c.route], left = (c.end - nowMs()) / 1000, pct = Math.min(100, 100 - left / R.time * 100);
    return `<div class="card"><div class="row"><div class="sp"><b>🛒 ${R.n}</b> <span class="mut">vốn ${fmt(c.bet)}🪙</span><div class="bar"><i style="width:${pct}%"></i></div><div class="mut">${left > 0 ? 'còn ' + fmtT(left) : 'Đã về!'}</div></div><button class="gold" data-a="col:${i}" ${left > 0 ? 'disabled' : ''}>Thu hoạch</button></div></div>`; }).join('');
  const free = slots - S.caravans.length;
  const routes = free > 0 ? ROUTES.map((R, i) => { if (!featOn(R.unlockDay)) return `<div class="row mut" style="margin:5px 0">🔒 ${R.n} (Cấp ${LV_GATE[R.unlockDay]})</div>`; const cap = routeCap(i);
    return `<div style="margin:7px 0"><div class="row"><div class="sp"><b>${R.n}</b> <span class="mut">${fmtT(R.time)} · lãi x${((R.mult - 1) * tradeBonus() + 1).toFixed(2)}</span><div class="mut">Vốn tối đa ${fmt(cap)}🪙${R.gem[0] ? ` · có cơ hội ${R.gem[0]}+💎` : ''}</div></div>
      <button class="sm gold" data-a="car:${i}:0.25" ${S.gold < 50 ? 'disabled' : ''}>25%</button><button class="sm gold" data-a="car:${i}:0.5" ${S.gold < 50 ? 'disabled' : ''}>50%</button><button class="sm gold" data-a="car:${i}:1" ${S.gold < 50 ? 'disabled' : ''}>MAX</button></div></div>`; }).join('') : `<div class="mut">Hết chỗ — nâng Bến Cảng để thêm thương đoàn.</div>`;
  return `<div class="card"><h3>Chợ giá biến động</h3><div class="row" style="flex-wrap:wrap;gap:10px">${mk}</div>
    <div class="row" style="margin-top:8px"><button class="gold" data-a="sell" ${sellVal < 1 ? 'disabled' : ''}>Giao hàng ≈ ${fmt(sellVal)}🪙 ${gm > 1 ? '(x1.5)' : ''}</button><span class="mut sp">Thủ công = 100% giá +10%</span></div></div>
    <div class="card"><h3>Thương đoàn (${S.caravans.length}/${slots})</h3>${routes}</div>${active}${slotBox('trade')}`;
}

function pityBar(l, v, m) { return `<div><div class="mut">${l}: ${v}/${m}</div><div class="bar"><i style="width:${v / m * 100}%"></i></div></div>`; }
function pGacha() {
  const f = HEROES[ssrFeatured()], P = PITY.char; const t10 = !S.tut.tenUsed;
  const hero = `<div class="card banner"><h3>✨ Chiêu Mộ Nhân Tài${t10 ? ' — QUÀ TÂN THỦ' : ''}</h3>
   <div class="row">${heroImg(f, 80)}<div class="sp">${tag('SSR')} <b>${f.n}</b> — RATE UP TUẦN<div class="mut">${f.story}</div><div class="mut">Buff ${JOBN[f.job]} x2 · +${RB.SSR}% gốc</div></div></div>
   <div class="mut" style="margin-top:6px">SSR ${charSsrRate().toFixed(1)}% · SR ${P.sr}% · R ${P.r}% · N còn lại. Đảm bảo SR+ mỗi 10 lượt, SSR tối đa ${P.hard} lượt, 50/50 có bảo hiểm.</div>
   <div class="pity">${pityBar('Pity SSR', S.pity.c, P.hard)}${pityBar('Pity SR', S.pity.sr, P.srGuar)}</div>
   <div class="row"><button class="gold" data-a="pull:hero:1" ${S.tickets < 1 && S.gems < COST.pull ? 'disabled' : ''}>×1 ${S.tickets ? '1🎫' : COST.pull + '💎'}</button>
   <button class="gold" data-a="pull:hero:10" ${!t10 && S.tickets < 10 && S.gems < (10 - Math.min(10, S.tickets)) * COST.pull ? 'disabled' : ''}>×10 ${t10 ? '(Tân thủ: chắc SSR)' : S.tickets >= 10 ? '10🎫' : COST.pull10 + '💎'}</button><span class="mut sp">Vé: ${S.tickets} · Ngọc: ${fmt(S.gems)}</span></div>
   <div class="mut" style="margin-top:6px">Trùng anh hùng → tăng sao (+20% buff/sao, tối đa 6★). Đã quay: ${S.stats.pulls}</div></div>`;
  const pick = S.ssrPick ? `<div class="card" style="border-color:var(--SSR)"><div class="row"><b class="sp">🎟 Bạn có ${S.ssrPick} Vé SSR tự chọn!</b><button class="gold" data-a="pickssr">Chọn SSR</button></div></div>` : '';
  const chest = featOn(2) ? `<div class="card banner chest"><h3>🧰 Rương Trang Bị</h3><div class="mut">Vũ khí, Giáp, Trang sức, Thuốc. Mỗi ô dùng món tốt nhất, trùng → +25%/cấp. SSR ${chestSsrRate().toFixed(1)}% · SR ${PITY.chest.sr}% · R ${PITY.chest.r}%.</div>
   <div class="pity">${pityBar('Pity SSR', S.pity.ch, PITY.chest.hard)}${pityBar('Pity SR', S.pity.chsr, 10)}</div>
   <div class="row"><button class="gold" data-a="pull:gear:1" ${S.gold < COST.chest ? 'disabled' : ''}>×1 · ${fmt(COST.chest)}🪙</button><button class="gold" data-a="pull:gear:10" ${S.gold < COST.chest10 ? 'disabled' : ''}>×10 · ${fmt(COST.chest10)}🪙</button></div></div>` : lockCard('Rương Trang Bị', 2);
  const gift = `<div class="card"><div class="row"><span class="mut sp">🎁 Quà Thương Hội: 60💎 mỗi 10 phút</span><button class="blue" data-a="gift" ${nowMs() < S.giftAt ? 'disabled' : ''}>${nowMs() < S.giftAt ? fmtT((S.giftAt - nowMs()) / 1000) : 'Nhận'}</button></div></div>`;
  return pick + hero + chest + gift;
}

function pTeam() {
  const slots = ['farm', 'lumber', 'mine', 'garden', 'trade'].filter(s => s === 'trade' || S.lv[s] > 0 || featOn(BUILD[s].unlockDay)).map(slotBox).join('');
  const list = HEROES.slice().sort((a, b) => (!!S.own[b.id] - !!S.own[a.id]) || RN.indexOf(b.r) - RN.indexOf(a.r) || a.id - b.id).map(h => {
    const o = S.own[h.id];
    return `<div class="ch ${o ? '' : 'locked'}" title="${h.story}">${heroImg(h, 48)}<div>${tag(h.r)} <b>${h.n}</b></div><div class="stars">${o ? '★'.repeat(o.star) + '☆'.repeat(6 - o.star) : '???'}</div><div class="mut">${JOBN[h.job]} · +${RB[h.r]}%${o ? `<br>⚔ ${heroCard(h).atk} ❤ ${heroCard(h).hp}` : ''}${o ? `<br>Lv ${o.lv}/${heroLvCap(o)} · mảnh ${o.shard}/${o.star}` : ''}</div>${o && o.lv < heroLvCap(o) ? `<button class="sm" data-a="hlv:${h.id}" ${S.gold < heroLvCost(h, o) ? 'disabled' : ''}>Lên cấp ${fmt(heroLvCost(h, o))}</button>` : ''}</div>`;
  }).join('');
  return `<div class="card"><h3>Phân công (khớp nghề = buff x2)</h3>${slots}</div><div class="card wide"><h3>Bộ sưu tập ${Object.keys(S.own).length}/${HEROES.length}</h3><div class="chars">${list}</div></div>`;
}
function pGear() {
  return ['weapon', 'armor', 'charm', 'potion'].map(sl => `<div class="card"><h3>${GSLOT[sl]} <span class="mut">— ${GDESC[sl]}: +${Math.round(gearBonus(sl) * 100)}%</span></h3><div class="chars">` +
    GEAR.filter(g => g.slot === sl).map(g => { const lv = S.gear[g.id]; return `<div class="ch ${lv ? '' : 'locked'}">${gearImg(g, 40)}<div>${tag(g.r)} <b>${g.n}</b></div><div class="mut">${lv ? `Cấp ${lv} · +${Math.round(GB[g.r] * (1 + 0.25 * (lv - 1)))}%` : 'Chưa có'}</div></div>`; }).join('') + `</div></div>`).join('');
}

function pJourney() {
  const d = accDay(); let out = `<div class="card"><h3>🗺 Hành Trình Tân Thương Nhân (7 ngày)</h3><div class="mut">Mỗi ngày có mục tiêu mới (tính năng mở theo Cấp Thương Hội). Hoàn thành để nhận ngọc, vé và Vé SSR tự chọn ở ngày 7.</div></div>`;
  for (const j of JOURNEY) {
    if (j.day > d) { out += `<div class="card lock"><b>🔒 ${j.title}</b><div class="mut">Mở sau ${fmtT(secToNextMidnight() + (j.day - d - 1) * 86400)}</div></div>`; continue; }
    const done = j.goals.filter(g => S.jclaimed[g.id]).length;
    out += `<div class="card" style="${j.day === d ? 'border-color:var(--gold)' : ''}"><h3>${j.title} <span class="mut">${done}/${j.goals.length}</span></h3>` + j.goals.map(g => {
      const ok = g.chk(S), cl = S.jclaimed[g.id];
      return `<div class="row" style="margin:5px 0"><span>${cl ? '✅' : ok ? '🟡' : '⬜'}</span><div class="sp ${cl ? 'mut' : ''}">${g.n}<div class="mut">${rewTxt(g.rew)}</div></div><button class="gold sm" data-a="goal:${g.id}" ${ok && !cl ? '' : 'disabled'}>${cl ? 'Đã nhận' : 'Nhận'}</button></div>`;
    }).join('') + (j.day === d ? `<div class="mut" style="margin-top:6px">⏭ ${j.teaser}</div>` : '') + `</div>`;
  }
  return out;
}

function pQuest() {
  const cal = `<div class="card"><h3>📅 Điểm danh 7 ngày</h3><div class="days">${LOGIN.map((r, i) => `<div class="dcell ${i === S.loginIdx ? 'today' : ''} ${i < S.loginIdx || (i === S.loginIdx && S.loginClaimed === S.daily.key) ? 'done' : ''}"><b>Ngày ${i + 1}</b><br>${rewTxt(r)}</div>`).join('')}</div>
    <div class="row" style="margin-top:8px"><span class="mut sp">Mỗi ngày mở game được 1 phần quà (không mất tiến độ nếu nghỉ).</span><button class="gold" data-a="login" ${S.loginClaimed === S.daily.key ? 'disabled' : ''}>${S.loginClaimed === S.daily.key ? 'Đã nhận' : 'Nhận quà'}</button></div></div>`;
  const dq = `<div class="card"><h3>Nhiệm vụ ngày <span class="mut">(làm mới sau ${fmtT(secToNextMidnight())})</span></h3>` + DAILY.map(q => {
    const g = dailyGoal(q), v = Math.min(q.get(S), g), cl = S.daily.claimed[q.id];
    return `<div class="row" style="margin:6px 0"><div class="sp"><b>${q.n}</b> <span class="mut">${fmt(v)}/${fmt(g)} · +${q.ap} điểm</span><div class="bar"><i style="width:${v / g * 100}%"></i></div></div><button class="gold sm" data-a="dq:${q.id}" ${!cl && v >= g ? '' : 'disabled'}>${cl ? 'Xong' : '+' + q.gems + '💎'}</button></div>`;
  }).join('') + `<div class="mut" style="margin-top:8px">Điểm hoạt động: <b>${S.daily.ap}/100</b></div><div class="bar"><i style="width:${S.daily.ap}%"></i></div><div class="row" style="margin-top:6px;flex-wrap:wrap">` +
    AP_CHESTS.map((c, i) => `<button class="gold sm ${!S.daily.apClaimed[i] && S.daily.ap >= c.ap ? 'dotted' : ''}" data-a="ap:${i}" ${!S.daily.apClaimed[i] && S.daily.ap >= c.ap ? '' : 'disabled'} title="${rewTxt(c.r)}">${c.ap}đ<br>${rewTxt(c.r)}</button>`).join('') + `</div></div>`;
  const ach = `<div class="card"><h3>🏅 Thành tựu</h3>` + ACH.map(a => {
    const t = S.achTier[a.id] || 0, max = t >= a.tiers.length, goal = a.tiers[Math.min(t, a.tiers.length - 1)], v = a.get(S);
    return `<div class="row" style="margin:5px 0"><div class="sp"><b>${a.n}</b> <span class="mut">bậc ${t}/${a.tiers.length} · ${fmt(Math.min(v, goal))}/${fmt(goal)}</span><div class="bar"><i style="width:${Math.min(100, v / goal * 100)}%"></i></div></div><button class="gold sm" data-a="ach:${a.id}" ${!max && v >= goal ? '' : 'disabled'}>${max ? 'MAX' : '+' + a.gem[t] + '💎'}</button></div>`;
  }).join('') + `</div>`;
  return cal + dq + ach;
}
function pPass() {
  if (!featOn(2)) return lockCard('Sổ Thương Hội (Season Pass miễn phí)', 2);
  const tiers = Math.floor(S.pass.xp / PASS_XP);
  return `<div class="card"><h3>🎖 Sổ Thương Hội — Mùa ${S.pass.season}</h3><div class="mut">Điểm hoạt động hằng ngày → XP. Mùa kéo dài 28 ngày, 30 bậc miễn phí. Bậc 10/20/30 có thưởng lớn (30: Vé SSR tự chọn).</div><div class="bar" style="margin:8px 0"><i style="width:${Math.min(100, S.pass.xp % PASS_XP / PASS_XP * 100)}%"></i></div><div class="mut">Bậc ${Math.min(30, tiers)}/30 · XP ${S.pass.xp}</div></div>
  <div class="card"><div class="pass">${PASS.map((r, i) => `<div class="ptier ${S.pass.claimed[i] ? 'got' : tiers >= i + 1 ? 'ok' : ''}"><b>${i + 1}</b><br>${rewTxt(r)}<br><button class="sm gold" data-a="pass:${i}" ${!S.pass.claimed[i] && tiers >= i + 1 ? '' : 'disabled'}>${S.pass.claimed[i] ? '✔' : 'Nhận'}</button></div>`).join('')}</div></div>`;
}
function pRival() {
  if (!featOn(1)) return lockCard('Bảng xếp hạng Thương Hội', 1);
  const wk = S.week.key, b = botScores(wk, S.week.ref, weekProgress(wk)); b.push({ n: '⭐ Thương Hội của bạn', s: S.week.earn, me: 1 }); b.sort((x, y) => y.s - x.s);
  const left = ((wk * 7 - 3 + 7) - localMs(nowMs()) / DAY) * 86400;
  const pend = S.week.pending ? `<div class="card" style="border-color:var(--gold)"><div class="row"><div class="sp"><b>Thưởng tuần trước: hạng ${S.week.pending.rank}</b><div class="mut">${rewTxt(S.week.pending.rew)}</div></div><button class="gold" data-a="week">Nhận</button></div></div>` : '';
  const rows = b.map((x, i) => ({ ...x, i })).filter(x => x.i < 10 || x.me).map(x => `<tr class="${x.me ? 'me' : ''}"><td>${x.i + 1}</td><td>${x.n}</td><td style="text-align:right">${fmt(x.s)}</td></tr>`).join('');
  return `${pend}<div class="card"><h3>🏆 Bảng xếp hạng tuần (thương hội đối thủ giả lập)</h3><div class="mut">Chốt sau ${fmtT(left)}. Điểm = vàng kiếm được trong tuần. Thưởng: Top1 ${RANK_REW[0].gems}💎, Top3 ${RANK_REW[1].gems}💎, Top10 ${RANK_REW[2].gems}💎…</div><table class="lb" style="margin-top:6px">${rows}</table></div>`;
}
function pMore() {
  const r = retentionReport();
  const dev = DEV ? `<div class="card"><h3>🧪 Dev</h3><div class="row" style="flex-wrap:wrap"><button class="sm" data-a="dev:h:1">+1h</button><button class="sm" data-a="dev:h:8">+8h</button><button class="sm" data-a="dev:d:1">+1 ngày</button><button class="sm" data-a="dev:d:3">+3 ngày</button><button class="sm gold" data-a="dev:gems">+10000💎</button><button class="sm gold" data-a="dev:gold">+x1000 vàng</button></div></div>` : '';
  return `<div class="card"><h3>⚙ Cài đặt</h3><div class="row"><span class="sp">Thông báo trình duyệt (thương đoàn về, kho đầy, Giờ Vàng)</span><button class="${S.settings.notify ? '' : 'red'}" data-a="notify">${S.settings.notify ? 'BẬT' : 'TẮT'}</button></div>
   <div class="row" style="margin-top:8px"><button class="blue" data-a="export">Xuất save</button><button class="blue" data-a="import">Nhập save</button><button class="red" data-a="reset">Xoá save</button></div></div>
  <div class="card"><h3>📊 Chỉ số giữ chân (thiết bị này)</h3><div class="mut">Ngày cài: ${new Date(S.first).toLocaleDateString()} · Ngày thứ ${accDay() + 1} · Tổng ngày đăng nhập: ${S.loginDays}<br>Quay lại D1: <b>${r.d1 ? 'CÓ' : 'chưa'}</b> · D7: <b>${r.d7 ? 'CÓ' : 'chưa'}</b> · Phiên: ${r.sessions}<br>Đặt <code>window.ANALYTICS_URL</code> để gửi sự kiện về server; RR1/RR7 thật phải tính theo cohort phía server (xem DESIGN.md).</div></div>${dev}`;
}
const PANELS = { battle: pBattle, village: pVillage, trade: pTrade, gacha: pGacha, team: pTeam, gear: pGear, journey: pJourney, quest: pQuest, pass: pPass, rival: pRival, more: pMore };

/* ---------- Render ---------- */
let lastMain = '', lastRes = '', lastNav = '', lastG = '', lastHint = '', lastGuild = '';
function render() {
  const set = (id, html, last) => { if (html !== last) $(id).innerHTML = html; return html; };
  lastRes = set('#res', renderRes(), lastRes); lastGuild = set('#guild', renderGuild(), lastGuild); lastG = set('#golden', renderGolden(), lastG); lastHint = set('#hint', renderHint(), lastHint); lastNav = set('#dock', renderNav(), lastNav);
  $('#hint').classList.toggle('hidden', !!tab);
  const win = $('#win'); if (!tab) { win.classList.add('hidden'); return; }
  if (win.classList.contains('hidden')) { win.classList.remove('hidden'); lastMain = ''; }
  $('#winTitle').textContent = TABS.find(t => t[0] === tab)[3];
  const ae = document.activeElement; if (ae && ae.tagName === 'SELECT') return;
  const html = PANELS[tab](); if (html !== lastMain) { const m = $('#winBody'), sc = m.scrollTop; m.innerHTML = html; m.scrollTop = sc; lastMain = html; }
}

/* ---------- Modal ---------- */
let modalQueue = [];
function openModal(html) { $('#modalInner').innerHTML = html; $('#modal').classList.add('show'); }
function closeModal() { $('#modal').classList.remove('show'); if (modalQueue.length) openModal(modalQueue.shift()); }
function queueModal(html) { if ($('#modal').classList.contains('show')) modalQueue.push(html); else openModal(html); }
function showPulls(res, type, n) {
  if (res.some(r => r.r === 'SSR')) { const f = document.createElement('div'); f.className = 'flash'; $('#stage').appendChild(f); setTimeout(() => f.remove(), 950); }
  openModal(`<h2 style="color:var(--gold)">${type === 'hero' ? 'Kết quả chiêu mộ' : 'Kết quả mở rương'}</h2><div class="pulls">` + res.map((r, i) => `<div class="pull ${r.r}" style="animation-delay:${i * 0.13}s">${tag(r.r)}<div style="margin:6px 0">${r.kind === 'hero' ? heroImg(r.hero, 64) : gearImg(r.gear, 56)}</div><div class="nm">${r.n}</div><div class="mut">${r.isNew ? '<b class="up">MỚI!</b>' : r.kind === 'hero' ? `Trùng · ${r.star}★` : `Cấp ${r.star}`}</div></div>`).join('') +
    `</div><button class="gold" data-a="close">Đóng</button> <button class="blue" data-a="pull:${type}:${n}">Quay tiếp ×${n}</button>`);
  render();
}
function welcomeHtml(w) {
  const h = Math.floor(w.dt / 3600), m = Math.floor(w.dt % 3600 / 60);
  return `<h2 style="color:var(--gold)">Chào mừng trở lại!</h2><p>Làng đã làm việc <b>${h}h ${m}m</b> khi bạn vắng mặt${w.dt >= offlineCap() - 5 ? ' (đã đạt giới hạn offline — nâng Quán Trọ để lâu hơn)' : ''}.</p><div class="card" style="display:inline-block;text-align:left;min-width:260px"><div>${ico(COIN, 18)} Vàng: <b class="up">+${fmt(w.gold)}</b></div><div>${gemI()} Ngọc: <b class="up">+${fmt(w.gems)}</b></div>${w.carDone ? `<div>🛒 ${w.carDone} thương đoàn đã về — vào Thương mại để thu hoạch!</div>` : ''}</div><p><button class="gold" data-a="close">Tuyệt vời!</button></p>`;
}
function loginHtml() {
  return `<h2 style="color:var(--gold)">📅 Điểm danh — Ngày ${S.loginDays}</h2><div class="days" style="max-width:640px;margin:12px auto">${LOGIN.map((r, i) => `<div class="dcell ${i === S.loginIdx ? 'today' : ''} ${i < S.loginIdx ? 'done' : ''}"><b>Ngày ${i + 1}</b><br>${rewTxt(r)}</div>`).join('')}</div><p class="mut">${accDay() < 6 ? `Ngày mai: ${JOURNEY[Math.min(accDay(), 6)].teaser}` : 'Chúc mừng đã đi được một tuần!'}</p><button class="gold" data-a="loginclaim">Nhận quà hôm nay</button>`;
}
function ssrPickHtml() {
  return `<h2 style="color:var(--gold)">Chọn 1 anh hùng SSR</h2><div class="pulls">${SSR_IDS.map(id => { const h = HEROES[id]; return `<div class="pull SSR" style="opacity:1;transform:none;animation:none;cursor:pointer" data-a="ssr:${id}">${heroImg(h, 64)}<div class="nm">${h.n}</div><div class="mut">${JOBN[h.job]}</div>${S.own[id] ? '<div class="mut">Đã có → +1 mảnh</div>' : ''}</div>`; }).join('')}</div><button data-a="close">Huỷ</button>`;
}

/* ---------- Sự kiện ---------- */
function act(a) {
  const [n, x, y] = a.split(':'); const P = parseFloat;
  switch (n) {
    case 'tab': setTab(x); return;
    case 'goto': tab = x; lastMain = ''; render(); return;
    case 'up': upgradeBuild(x); break; case 'upmax': upgradeMax(x); break; case 'fac': upgradeFac(x); break;
    case 'auto': S.auto = !S.auto; break; case 'sell': sellAll(); break;
    case 'car': sendCaravan(+x, P(y)); break; case 'col': collectCaravan(+x); break;
    case 'hlv': levelHero(+x); break;
    case 'pull': { const res = doPull(x, +y); if (res) playSummon(res, x, +y); break; }
    case 'smclose': closeSummon(); return;
    case 'pickssr': openModal(ssrPickHtml()); return;
    case 'ssr': claimSsrPick(+x); closeModal(); break;
    case 'gift': claimGift(); break;
    case 'goal': claimGoal(x); break; case 'dq': claimDaily(x); break; case 'ap': claimApChest(+x); break;
    case 'ach': claimAch(x); break; case 'pass': claimPass(+x); break; case 'week': claimWeek(); break;
    case 'login': case 'loginclaim': claimLogin(); if (n === 'loginclaim') closeModal(); break;
    case 'prestige': if (confirm('Mở chi nhánh mới? Vàng và công trình sản xuất sẽ được đặt lại (giữ anh hùng, trang bị, ngọc).')) doPrestige(); break;
    case 'close': closeModal(); return;
    case 'bfight': if (openArena(+x)) { tab = null; lastMain = ''; } break;
    case 'barena_again': closeModal(); closeArena(); openArena(+x); return;
    case 'barena_close': closeModal(); closeArena(); return;
    case 'bsweep': { const r = sweepStage(+x); if (r) openModal(`<h2 style="color:${r.res === 'win' ? 'var(--gold)' : '#e0594f'}">${r.res === 'win' ? '🏆 Tự đánh: Thắng' : '💀 Tự đánh: Thua'}</h2><p>${r.st.name}</p>${r.r ? `<div class="card" style="display:inline-block">${fmt(r.r.gold)} 🪙${r.r.shard != null ? ' · Mảnh ' + HEROES[r.r.shard].n : ''}</div>` : '<p class="mut">Hãy mạnh hơn rồi thử lại.</p>'}<p><button class="gold" data-a="close">OK</button></p>`); break; }
    case 'bautoteam': S.battle.team = autoTeam(); break;
    case 'notify': if (!S.settings.notify) { if (window.Notification) Notification.requestPermission().then(p => { S.settings.notify = p === 'granted'; render(); }); } else S.settings.notify = false; break;
    case 'export': prompt('Sao chép chuỗi save:', btoa(unescape(encodeURIComponent(JSON.stringify(S))))); return;
    case 'import': { const s = prompt('Dán chuỗi save:'); if (s) { try { S = migrate(JSON.parse(decodeURIComponent(escape(atob(s))))); save(); location.reload(); } catch (e) { toast('Save không hợp lệ'); } } return; }
    case 'reset': if (confirm('Xoá toàn bộ tiến trình?')) { localStorage.removeItem(KEY); location.reload(); } return;
    case 'dev': devAct(x, y); break;
  }
  save(); render();
}
function devAct(k, v) {
  if (k === 'h') S.devOffset += HOUR * +v; if (k === 'd') S.devOffset += DAY * +v;
  if (k === 'gems') S.gems += 10000; if (k === 'gold') S.gold += goldBonus() * 1000;
  if (k === 'h' || k === 'd') { lastTick = nowMs() - (k === 'h' ? HOUR * +v : DAY * +v); gameTick(); S.last = nowMs() - 1; if (welcomeDay) { welcomeDay = false; queueModal(loginHtml()); } }
}
document.addEventListener('pointerdown', e => {
  if (e.button) return; const b = e.target.closest('[data-a]'); if (!b || b.disabled) return; e.preventDefault(); act(b.dataset.a);
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.assign) { assignHero(t.dataset.assign, t.value === '' ? null : +t.value); }
  if (t.hasAttribute('data-hold')) S.hold = +t.value;
  t.blur(); save(); render();
});
$('#btnLogin').onclick = () => openModal(loginHtml());
$('#btnSet').onclick = () => setTab('more');
$('#btnFs').onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); };
$('#winClose').onclick = () => setTab(tab);
document.addEventListener('keydown', e => { if (e.key === 'Escape') { if ($('#modal').classList.contains('show')) closeModal(); else if (tab) setTab(tab); } });
function fit() { const k = Math.min(innerWidth / 1280, innerHeight / 720), st = $('#stage'); st.style.transform = `scale(${k})`; st.style.left = (innerWidth - 1280 * k) / 2 + 'px'; st.style.top = (innerHeight - 720 * k) / 2 + 'px'; }
addEventListener('resize', fit); fit();
$('#modal').addEventListener('pointerdown', e => { if (e.target.id === 'modal') closeModal(); });

/* ---------- Khởi động ---------- */
gameInit(); sceneInit(); render();
if (welcome) { queueModal(welcomeHtml(welcome)); welcome = null; }
if (S.loginClaimed !== S.daily.key) queueModal(loginHtml());
setInterval(() => {
  gameTick();
  if (welcome) { queueModal(welcomeHtml(welcome)); welcome = null; }
  if (welcomeDay) { welcomeDay = false; if (S.loginClaimed !== S.daily.key) queueModal(loginHtml()); }
  render();
}, 500);
window.addEventListener('beforeunload', save);
window.__S = () => S;   // debug
