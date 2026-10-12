'use strict';
/* =====================================================================
   MÀN TRIỆU HỒI GACHA — sạc năng lượng → lật thẻ từng lá với VFX theo độ hiếm
   ===================================================================== */
let SM = null;
const rndr = (a, b) => a + Math.random() * (b - a);
const smWait = ms => new Promise(res => { const t0 = performance.now(); const id = setInterval(() => { if (!SM || SM.skip || performance.now() - t0 >= ms) { clearInterval(id); res(); } }, 30); });
function smCard(r) {
  const c = r.kind === 'hero' ? heroCard(r.hero) : spellCard(r.gear), sk = skillOf(c);
  const tag2 = r.isNew ? '<div class="sc-new">MỚI!</div>' : `<div class="sc-dup">${r.kind === 'hero' ? 'Trùng · ' + r.star + '★' : 'Cấp ' + r.star}</div>`;
  return `<div class="sc-card ${c.r}" style="--rc:${RCOL[c.r]}"><span class="cost">${c.cost}</span><div class="sc-rar">${c.r}</div>
    <div class="sc-art">${ico(c.spr, 92)}</div><div class="sc-name">${c.name}</div>
    <div class="sc-d">${c.type === 'hero' ? (sk ? `<b>${sk.n}</b>: ${sk.d(c.m)}` : '') : SPELL_TXT[c.slot](c.val)}</div>
    <div class="ust">${c.type === 'hero' ? `<b class="a">${c.atk}</b><b class="h">${c.hp}</b>` : `<b class="sp">✦ ${c.val}</b>`}</div>${tag2}</div>`;
}
function revealFx(el, r, host) {
  if (SM.skip) return;
  const o = { z: 28 };
  if (r === 'N') fxEl('sparkle_b', el, { ...o, s: 2.4 });
  else if (r === 'R') { fxEl('ring_b', el, { ...o, s: 2.4 }); fxEl('sparkle_b', el, { ...o, s: 3 }); }
  else if (r === 'SR') { fxEl('ring_b', el, { ...o, s: 2.8, hue: 70 }); fxEl('zap3', el, { ...o, s: 3 }); fxEl('sparkle_y', el, { ...o, s: 3, hue: 200 }); shake(host, 300); }
  else {
    const f = document.createElement('div'); f.className = 'flash'; host.appendChild(f); setTimeout(() => f.remove(), 950); shake(host, 500);
    fxEl('light', el, { ...o, s: 3.5, blend: 'screen' }); fxEl('ring_y2', el, { ...o, s: 3.4 }); fxEl('burst_y', el, { ...o, s: 3.4 });
    fxEl('firework', el, { ...o, s: 3, delay: 150 }); fxEl('coins', el, { ...o, s: 2.6, dy: -60, delay: 100 }); fxEl('rank_S', el, { ...o, s: 1.7, dy: -150 });
  }
}
async function playSummon(res, type, n) {
  const host = document.getElementById('summon'); SM = { skip: false, done: false };
  const best = res.reduce((m, r) => Math.max(m, RN.indexOf(r.r)), 0), bc = RCOL[RN[best]];
  host.className = 'show';
  host.innerHTML = `<div class="sm-bg"></div><div class="sm-circle" style="--c:${bc}"><i></i><i></i></div><div class="sm-orb" style="--c:${bc}"></div><div class="sm-txt">${type === 'hero' ? 'Đang triệu hồi anh hùng…' : 'Đang mở rương…'}</div><button class="sm-skip" data-s="skip">Bỏ qua ⏭</button>`;
  let tick = 0;
  const timer = setInterval(() => {
    tick++; if (SM.skip) return;
    fx('ring_big', { x: 640, y: 340, s: 2 + tick * 0.12, op: .9, z: 26, hue: best === 2 ? 70 : 0 });
    if (best >= 1) fx('zap3', { x: 640 + rndr(-170, 170), y: 340 + rndr(-130, 130), s: 2.4, z: 26, hue: best === 3 ? 160 : 0 });
    if (best >= 3 && tick % 2) fx('burst_y', { x: 640, y: 340, s: 2 + tick * 0.2, z: 26, blend: 'screen' });
  }, 360);
  await smWait(1700 + best * 350); clearInterval(timer);
  if (!SM.skip) { const f = document.createElement('div'); f.className = 'flash'; host.appendChild(f); setTimeout(() => f.remove(), 900); fx('light', { x: 640, y: 340, s: 5, z: 27, blend: 'screen' }); }
  const sm = n === 1 ? ' one' : '';
  host.innerHTML = `<div class="sm-bg dim"></div><div class="sm-title">${type === 'hero' ? 'Kết quả chiêu mộ' : 'Kết quả mở rương'}</div><div class="sm-grid${sm}">${res.map((r, i) => `<div class="sc" data-i="${i}"><div class="sc-in"><div class="sc-back"><i></i></div><div class="sc-front">${smCard(r)}</div></div></div>`).join('')}</div><button class="sm-skip" data-s="skip">Lật hết ⏭</button>`;
  const cards = [...host.querySelectorAll('.sc')];
  for (let i = 0; i < cards.length; i++) {
    if (!SM.skip) await smWait(n === 1 ? 250 : 380);
    if (!SM) return;
    cards[i].classList.add('on'); revealFx(cards[i], res[i].r, host);
    if (!SM.skip && res[i].r === 'SSR') await smWait(1100);
  }
  SM.done = true; await smWait(120);
  const sk = host.querySelector('.sm-skip'); if (sk) sk.remove();
  host.insertAdjacentHTML('beforeend', `<div class="sm-btns"><button class="gold" data-a="smclose">Xong</button> <button class="blue" data-a="pull:${type}:${n}">Quay tiếp ×${n}</button></div>`);
  render();
}
function closeSummon() { const h = document.getElementById('summon'); h.className = ''; h.innerHTML = ''; document.querySelectorAll('#stage > .fx').forEach(e => e.stop && e.stop()); SM = null; render(); }
document.addEventListener('pointerdown', e => {
  if (!SM) return; const t = e.target.closest('[data-s="skip"]');
  if (t || (!SM.done && e.target.closest('#summon') && !e.target.closest('[data-a]'))) SM.skip = true;
}, true);
