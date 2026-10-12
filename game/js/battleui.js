'use strict';
/* =====================================================================
   ĐẤU THẺ — giao diện đấu trường (DOM) + panel chiến dịch / bộ bài
   ===================================================================== */
let A = null;                       // trạng thái UI của trận đang diễn ra
const sleep = ms => new Promise(r => setTimeout(r, ms / (A ? A.speed : 1)));
const rc = r => RCOL[r] || '#9aa0a6';

/* ---------- Mảnh HTML dùng chung ---------- */
function skillOf(c) { return c.type === 'hero' && SKILL[c.job] ? SKILL[c.job] : null; }
function cardMini(c, extra = '') {     // thẻ nhỏ trong bộ bài / bộ sưu tập
  const sk = skillOf(c);
  return `<div class="cm ${c.r} ${extra}" data-b="deck:${c.key}" title="${c.type === 'hero' ? (sk ? sk.n + ': ' + sk.d(c.m) : '') : SPELL_TXT[c.slot](c.val)}">
    <span class="cost">${c.cost}</span>${ico(c.spr, 48)}<div class="cn">${c.name}</div>
    <div class="cs">${c.type === 'hero' ? `<b class="a">${c.atk}</b><b class="h">${c.hp}</b>` : `<b class="sp">✦ ${c.val}</b>`}</div></div>`;
}
function unitHtml(u, side, slot, cls = '') {
  const sk = SKILL[u.job]; const pc = u.hp < u.max ? 'hurt' : '';
  return `<div class="uc ${u.r} ${cls} ${u.sick ? 'sick' : ''}" data-b="tgt:${side}:${slot}" data-side="${side}" data-slot="${slot}" style="--rc:${rc(u.r)}">
    <div class="uart">${ico(u.spr, 76)}</div><div class="un">${u.name}</div>
    <div class="usk">${sk ? sk.n : (u.boss ? 'Cuồng nộ' : '')}</div>
    <div class="ust"><b class="a">${u.atk}</b><b class="h ${pc}">${u.hp}</b></div></div>`;
}
function handHtml(c, i, playable, sel) {
  const sk = skillOf(c);
  return `<div class="hc ${c.r} ${playable ? '' : 'dim'} ${sel ? 'sel' : ''}" data-b="hand:${i}" style="--rc:${rc(c.r)}">
    <span class="cost">${c.cost}</span><div class="hart">${ico(c.spr, 60)}</div><div class="hn">${c.name}</div>
    <div class="hd">${c.type === 'hero' ? (sk ? `<b>${sk.n}</b>: ${sk.d(c.m)}` : '') : SPELL_TXT[c.slot](c.val)}</div>
    <div class="ust">${c.type === 'hero' ? `<b class="a">${c.atk}</b><b class="h">${c.hp}</b>` : `<b class="sp">✦ ${c.val}</b>`}</div></div>`;
}
function manaHtml(s) { let h = ''; for (let i = 0; i < 8; i++) h += `<i class="mn ${i < s.mana ? 'full' : i < s.maxMana ? 'used' : ''}"></i>`; return h; }
function hpBar(s, who) { return `<div class="abar ${who}"><span>❤ ${s.hp}/${s.max}</span><div class="bar"><i style="width:${Math.max(0, s.hp / s.max * 100)}%"></i></div></div>`; }

/* ---------- Vẽ đấu trường ---------- */
function validTarget(side, slot) {
  if (!A.sel || B.phase !== 'player') return false;
  const c = B.p.hand[A.sel.i]; if (!c || c.type !== 'spell') return false;
  return spellTargets(c, B.p).some(t => t.side === side && t.slot === slot);
}
function renderArena() {
  if (!A || !B) return;
  const selC = A.sel ? B.p.hand[A.sel.i] : null, mine = B.phase === 'player' && !A.busy && !A.auto;
  const row = (s, side) => s.board.map((u, k) => {
    const fl = A.floats.filter(f => f.side === side && f.slot === k).map(f => `<em class="fl ${f.kind}">${f.kind === 'heal' ? '+' : f.kind === 'buff' ? '⬆' : '-'}${f.n || ''}</em>`).join('');
    const an = A.anim && A.anim.side === side && A.anim.slot === k ? (side === 'p' ? 'lunge-up' : 'lunge-dn') : '';
    const tg = validTarget(side, k) ? 'tg' : '';
    if (u) return `<div class="lane ${tg}" data-ls="${side}${k}">${unitHtml(u, side, k, an + ' ' + tg)}${fl}</div>`;
    const sum = mine && selC && selC.type === 'hero' && side === 'p' ? 'sum' : '';
    return `<div class="lane ${sum}" data-ls="${side}${k}"><div class="slot0 ${sum}" data-b="slot:${side}:${k}"></div>${fl}</div>`;
  }).join('');
  const baseFl = side => A.floats.filter(f => f.side === side && f.slot === -1).map(f => `<em class="fl ${f.kind}">${f.kind === 'heal' ? '+' : '-'}${f.n}</em>`).join('');
  const eBase = `<div class="base ${validTarget('e', -1) ? 'tg' : ''}" data-b="tgt:e:-1">${hpBar(B.e, 'e')}${baseFl('e')}</div>`;
  const pBase = `<div class="base ${validTarget('p', -1) ? 'tg' : ''}" data-b="tgt:p:-1">${hpBar(B.p, 'p')}${baseFl('p')}</div>`;
  const hand = B.p.hand.map((c, i) => handHtml(c, i, mine && c.cost <= B.p.mana, A.sel && A.sel.i === i)).join('');
  const st = B.st, turnTxt = B.over ? (B.over === 'win' ? 'CHIẾN THẮNG!' : 'THẤT BẠI') : B.phase === 'player' ? (A.auto ? 'Lượt bạn (Auto)' : 'Lượt của bạn') : 'Lượt đối thủ…';
  $('#arena').innerHTML = `
    <div class="atop"><div class="ainfo"><b>${CHAPTERS[st.chapter]}</b> · ${st.boss ? '👑 ' : ''}${st.name}${st.boss ? ' (Boss)' : ''}</div>
      <div class="actl"><button class="sm ${A.auto ? 'gold' : ''}" data-b="auto">Auto: ${A.auto ? 'BẬT' : 'TẮT'}</button><button class="sm" data-b="speed">Tốc độ x${A.speed}</button><button class="sm red" data-b="flee">Bỏ cuộc</button></div></div>
    <div class="aside e">${eBase}<div class="edeck">Bài địch: ${B.e.deck.length} · Tay: ${B.e.hand.length}</div></div>
    <div class="board e">${row(B.e, 'e')}</div>
    <div class="mid"><span class="turn">Lượt ${B.turn} — ${turnTxt}</span>${selC ? `<span class="hintb">${selC.type === 'hero' ? 'Chọn lane trống để triệu hồi' : SPELL_TXT[selC.slot](selC.val)}${selC.slot === 'charm' ? '' : ' — chọn mục tiêu'}</span>` : ''}</div>
    <div class="board p">${row(B.p, 'p')}</div>
    <div class="abot"><div class="aside p">${pBase}<div class="manarow"><span class="mnl">Mana ${B.p.mana}/${B.p.maxMana}</span>${manaHtml(B.p)}</div><div class="edeck">Bài còn: ${B.p.deck.length}</div></div>
      <div class="hand">${hand}</div>
      <button class="endbtn" data-b="end" ${mine ? '' : 'disabled'}>Kết thúc lượt</button></div>`;
}

/* ---------- Luồng trận ---------- */
function flush() {
  const evs = B.ev.splice(0); const keep = [];
  for (const e of evs) {
    if (e.t === 'dmg') keep.push({ side: e.side, slot: e.slot, n: e.n, kind: 'dmg' });
    else if (e.t === 'heal') keep.push({ side: e.side, slot: e.slot, n: e.n, kind: 'heal' });
    else if (e.t === 'buff') keep.push({ side: e.side, slot: e.slot, n: '', kind: 'buff' });
    else if (e.t === 'atk') { A.anim = { side: e.side, slot: e.slot }; setTimeout(() => { A.anim = null; renderArena(); }, 280 / A.speed); }
  }
  for (const f of keep) { A.floats.push(f); setTimeout(() => { A.floats = A.floats.filter(x => x !== f); renderArena(); }, 900 / A.speed); }
  renderArena(); battleFx(evs);
}
const arenaEl = () => document.getElementById('arena');
function laneEl(side, slot) { return slot < 0 ? document.querySelector(`.aside.${side === 'p' ? 'p' : 'e'} .base`) : document.querySelector(`.lane[data-ls="${side}${slot}"]`); }
function banner(txt, cls) {
  const b = document.createElement('div'); b.className = 'turnban ' + cls; b.textContent = txt; arenaEl().appendChild(b); setTimeout(() => b.remove(), 1500 / (A ? A.speed : 1));
}
function battleFx(evs) {
  const sp = A ? A.speed : 1, d = 140 / sp, z = 30;
  for (const e of evs) {
    const el = e.slot !== undefined ? laneEl(e.side, e.slot) : null;
    if (e.t === 'turn') banner(e.side === 'p' ? (A.auto ? 'LƯỢT BẠN · AUTO' : 'LƯỢT CỦA BẠN') : 'LƯỢT ĐỐI THỦ', e.side);
    else if (e.t === 'summon' && el) {
      fxEl('ring_b', el, { s: 2.2, z, speed: sp }); fxEl('sparkle_b', el, { s: 2.6, z, speed: sp });
      if (e.r === 'SSR') fxEl('burst_y', el, { s: 2.4, z, speed: sp, delay: 80 });
      if (e.boss) { fx('alert', { x: 640, y: 330, s: 3.2, z: 40, speed: sp }); shake(arenaEl(), 500); fxEl('boom3', el, { s: 2.8, z, speed: sp }); }
    } else if (e.t === 'dmg' && el) {
      if (e.slot < 0) { fxEl('burst_y', el, { s: 2.6, z, speed: sp, delay: d }); fxEl('hit_y', el, { s: 2.6, z, speed: sp, delay: d }); shake(arenaEl(), 300); }
      else { fxEl(e.n >= 6 ? 'slash' : 'hit_y', el, { s: 2.4, z, speed: sp, delay: d, rot: e.side === 'p' ? 180 : 0 }); if (e.n >= 6) fxEl('ring_y', el, { s: 2, z, speed: sp, delay: d }); }
    } else if (e.t === 'heal' && el) fxEl(e.slot < 0 ? 'hearts' : 'heal', el, { s: e.slot < 0 ? 1.2 : 1.1, z, speed: sp });
    else if (e.t === 'buff' && el) fxEl('atkup', el, { s: 1.1, z, speed: sp });
    else if (e.t === 'cast' && e.tg) {
      const t = laneEl(e.tg.side, e.tg.slot);
      if (e.spell === 'weapon') { fxEl('zap2', t, { s: 3, z, speed: sp }); fxEl('strike', t, { s: 2, z, speed: sp, dy: -40 }); shake(arenaEl(), 250); }
      else if (e.spell === 'armor') fxEl('defup', t, { s: 1.1, z, speed: sp });
      else if (e.spell === 'charm') fxEl('absorb', t, { s: 1.2, z, speed: sp });
    } else if (e.t === 'die' && el) {
      fxEl(e.boss ? 'boom2' : 'skull', el, { s: e.boss ? 2.6 : 2.6, z, speed: sp, delay: d }); if (e.boss) shake(arenaEl(), 600);
    }
  }
}
function openArena(n) {
  const b = startFight(n); if (!b) return false;
  A = { sel: null, busy: false, auto: !!S.battle.auto, speed: S.battle.speed || 1, floats: [], anim: null, n };
  $('#arena').classList.add('show'); document.body.classList.add('inbattle'); flush(); save();
  if (A.auto) autoTurn(); return true;
}
function closeArena() { $('#arena').classList.remove('show'); document.body.classList.remove('inbattle'); A = null; B = null; render(); }
async function doAttacks(s) {
  for (let k = 0; k < LANES; k++) { if (B.over) break; if (attackLane(s, k)) { flush(); await sleep(520); } }
  endOfTurn(s); sweepDead(); flush(); checkOver();
}
async function finishIfOver() {
  if (!B.over) return false;
  flush(); const won = B.over === 'win', sp = A.speed;
  if (won) { fx('you_won', { x: 640, y: 250, s: 2.6, z: 40, speed: sp }); fx('crown', { x: 640, y: 150, s: 3, z: 40, speed: sp }); for (let i = 0; i < 4; i++) fx('firework', { x: 300 + i * 220, y: 200 + (i % 2) * 120, s: 3, z: 39, delay: i * 250 / sp, speed: sp }); fx('coins', { x: 640, y: 400, s: 3, z: 39, delay: 400 / sp, speed: sp }); }
  else { fx('you_lost', { x: 640, y: 250, s: 2.6, z: 40, speed: sp }); fx('failure', { x: 640, y: 120, s: 2.4, z: 40, speed: sp }); }
  await sleep(2200);
  const st = B.st, res = B.over, r = finishBattle(res, st, false); save();
  const rt = r ? [`${fmt(r.gold)} 🪙`, r.gems && `${r.gems} 💎`, r.tickets && `${r.tickets} 🎫`, r.shard != null && `Mảnh thẻ ${HEROES[r.shard].n}`].filter(Boolean).join(' · ') : '';
  const next = res === 'win' && st.n < STAGE_N && S.battle.energy > 0;
  A.busy = true;
  openModal(`<h2 style="color:${res === 'win' ? 'var(--gold)' : '#e0594f'}">${res === 'win' ? '🏆 CHIẾN THẮNG!' : '💀 Thất bại'}</h2><p>${CHAPTERS[st.chapter]} — ${st.name}</p>${r ? `<div class="card" style="display:inline-block">Phần thưởng: <b class="up">${rt}</b>${r.gems ? '<div class="mut">Thưởng lần đầu qua màn</div>' : ''}</div>` : '<p class="mut">Nâng cấp / lên sao anh hùng, đổi bộ bài rồi thử lại nhé.</p>'}<p>
    <button class="gold" data-a="barena_close">Về</button> <button class="blue" data-a="barena_again:${st.n}" ${S.battle.energy > 0 ? '' : 'disabled'}>Đánh lại</button> ${next ? `<button class="blue" data-a="barena_again:${st.n + 1}">Màn ${st.n + 1} ▶</button>` : ''}</p>`);
  return true;
}
async function enemyTurn() {
  startTurn(B.e); flush(); await sleep(600);
  let g = 0; while (g++ < 15 && !B.over && aiStep(B.e)) { flush(); await sleep(650); }
  if (!B.over) await doAttacks(B.e);
  if (await finishIfOver()) return;
  if (B.turn >= TURN_LIMIT) { B.over = B.p.hp / B.p.max >= B.e.hp / B.e.max ? 'win' : 'lose'; await finishIfOver(); return; }
  startTurn(B.p); A.busy = false; flush();
  if (A.auto) autoTurn();
}
async function playerEnd() {
  if (!A || A.busy || B.phase !== 'player' || B.over) return;
  A.busy = true; A.sel = null; renderArena();
  await doAttacks(B.p); if (await finishIfOver()) return;
  await enemyTurn();
}
async function autoTurn() {
  if (!A || B.phase !== 'player' || B.over) return; A.busy = true; await sleep(500);
  let g = 0; while (g++ < 15 && A && B && !B.over && A.auto && aiStep(B.p)) { flush(); await sleep(650); }
  if (!A || !B) return;
  if (!A.auto) { A.busy = false; renderArena(); return; }       // người chơi tắt auto giữa chừng
  A.busy = false; await playerEnd();
}

/* ---------- Sự kiện đấu trường ---------- */
document.addEventListener('pointerdown', e => {
  const t = e.target.closest('[data-b]'); if (!t || !A || !B || e.button) return;
  const [n, x, y] = t.dataset.b.split(':'); const mine = B.phase === 'player' && !A.busy && !A.auto && !B.over;
  if (n === 'auto') { A.auto = !A.auto; S.battle.auto = A.auto; renderArena(); if (A.auto && !A.busy) autoTurn(); return; }
  if (n === 'speed') { A.speed = A.speed === 1 ? 2 : A.speed === 2 ? 4 : 1; S.battle.speed = A.speed; renderArena(); return; }
  if (n === 'flee') { if (confirm('Bỏ cuộc sẽ tính là thua và mất 1 Lệnh Bài. Tiếp tục?')) { finishBattle('lose', B.st); save(); closeArena(); } return; }
  if (!mine) return;
  if (n === 'end') { playerEnd(); return; }
  if (n === 'hand') {
    const i = +x, c = B.p.hand[i]; if (!c || c.cost > B.p.mana) { if (c) toast('Không đủ mana'); return; }
    if (A.sel && A.sel.i === i) { A.sel = null; renderArena(); return; }
    if (c.type === 'spell' && c.slot === 'charm') { cast(B.p, i, { side: 'p', slot: -1 }); A.sel = null; flush(); return; }
    if (c.type === 'spell' && !spellTargets(c, B.p).length) { toast('Không có mục tiêu'); return; }
    A.sel = { i }; renderArena(); return;
  }
  if (n === 'slot' && A.sel && x === 'p') { const c = B.p.hand[A.sel.i]; if (c && c.type === 'hero' && summon(B.p, A.sel.i, +y)) { A.sel = null; flush(); } return; }
  if (n === 'tgt' && A.sel) { const c = B.p.hand[A.sel.i]; if (c && c.type === 'spell' && cast(B.p, A.sel.i, { side: x, slot: +y })) { A.sel = null; flush(); finishIfOver(); } }
});
document.getElementById('arena').addEventListener('contextmenu', e => { if (A && A.sel) { e.preventDefault(); A.sel = null; renderArena(); } });

/* ---------- Panel Đấu Thẻ (cửa sổ) ---------- */
function effDeck() { const d = (S.battle.deck || []).filter(k => cardByKey(k)); return d.length ? d : autoDeck(); }
function pBattle() {
  energyTick(); const b = S.battle, deck = effDeck(), all = ownedCards();
  const heroes = deck.filter(k => k[0] === 'h').length;
  const stages = []; for (let n = 1; n <= STAGE_N; n++) {
    if (n === 1 || (n - 1) % 10 === 0) stages.push(`<div class="mut" style="margin:8px 0 2px"><b>${CHAPTERS[Math.floor((n - 1) / 10)]}</b></div>`);
    const st = stageDef(n), cl = n <= b.cleared, open = n <= b.cleared + 1;
    stages.push(`<div class="row" style="margin:3px 0;opacity:${open ? 1 : .45}"><span style="width:26px">${cl ? '✅' : open ? '⚔' : '🔒'}</span><div class="sp">${st.boss ? '👑 ' : ''}<b>${st.name}</b> <span class="mut">sức mạnh ${(st.f * 100).toFixed(0)}% ${cl ? '' : '· thưởng lần đầu ' + (st.boss ? '100💎 +1🎫' : '30💎')}</span></div>
      ${cl ? `<button class="sm blue" data-a="bsweep:${n}" ${b.energy < 1 ? 'disabled' : ''}>Tự đánh</button>` : ''}<button class="sm gold" data-a="bfight:${n}" ${open && b.energy >= 1 ? '' : 'disabled'}>Chiến</button></div>`);
  }
  const grid = all.sort((a, b2) => RN.indexOf(b2.r) - RN.indexOf(a.r) || cardPower(b2) - cardPower(a)).map(c => cardMini(c, deck.includes(c.key) ? 'in' : '')).join('');
  return `<div class="card wide"><div class="row"><div class="sp"><b>Lệnh Bài ${b.energy}/${ENERGY_MAX}</b> <span class="mut">${b.energy < ENERGY_MAX ? 'hồi 1 sau ' + fmtT(energyNext()) : 'đã đầy — hãy dùng!'}</span><div class="bar"><i style="width:${b.energy / ENERGY_MAX * 100}%"></i></div></div><span class="mut">Thắng ${b.wins} · Thua ${b.losses}</span></div>
    <div class="mut" style="margin-top:6px">Luật: căn cứ ${BASE_HP} máu · 4 lane · mana +1/lượt (tối đa 8) · rút 1 lá/lượt. Quân của bạn tự đánh lane đối diện khi kết thúc lượt (lane trống = đánh căn cứ), hai bên cùng chịu sát thương. Thẻ anh hùng = quân; trang bị từ rương = bùa phép.</div></div>
    <div class="card"><h3>Chiến dịch</h3>${stages.join('')}</div>
    <div class="card"><h3>Bộ bài ${deck.length}/${DECK_MAX} <span class="mut">(${heroes} quân · ${deck.length - heroes} phép)</span></h3>
      <div class="row" style="margin-bottom:6px"><button class="sm gold" data-a="bautodeck">Gợi ý bộ bài mạnh nhất</button><button class="sm" data-a="bcleardeck">Xoá</button></div>
      <div class="mut" style="margin-bottom:6px">Bấm thẻ để thêm/bớt. Thẻ viền sáng = đang trong bộ bài.</div><div class="cmgrid">${grid || '<span class="mut">Chưa có thẻ — hãy Chiêu mộ!</span>'}</div></div>`;
}
document.addEventListener('pointerdown', e => {          // chọn thẻ trong panel (data-b="deck:key")
  const t = e.target.closest('[data-b^="deck:"]'); if (!t || A || e.button) return; const k = t.dataset.b.slice(5);
  const d = effDeck().slice(); const i = d.indexOf(k);
  if (i >= 0) d.splice(i, 1); else if (d.length < DECK_MAX) d.push(k); else { toast(`Bộ bài tối đa ${DECK_MAX} lá`); return; }
  S.battle.deck = d; save(); render();
}, true);
