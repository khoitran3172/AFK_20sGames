'use strict';
/* =====================================================================
   PANEL "TREO MÁY": Thu hoạch · Đơn hàng · Thám hiểm
   ===================================================================== */
const DUSTI = '✨';
function pAfk() {
  const a = afkAccrued(), r = afkRate(), cap = afkCapH(), f = afkFastInfo();
  const full = a.h >= cap - 0.01;
  const afkCard = `<div class="card wide"><h3>🌙 Thu hoạch Treo Máy <span class="mut">· theo tiến độ chiến dịch (đã qua màn ${S.battle.cleared})</span></h3>
    <div class="row"><div class="sp"><div class="bar ${full ? 'red' : ''}"><i style="width:${Math.min(100, a.h / cap * 100)}%"></i></div>
      <div class="mut" style="margin-top:4px">Tích luỹ ${a.h.toFixed(1)}h / tối đa ${cap}h ${full ? '— <b class="dn">ĐÃ ĐẦY, hãy nhận!</b>' : ''}</div>
      <div style="margin-top:4px"><b>${fmt(a.gold)}</b> 🪙 · <b>${a.dust}</b> ${DUSTI} Bụi Sao${a.gems ? ` · <b>${a.gems}</b> 💎` : ''}</div>
      <div class="mut">Tốc độ: ${fmt(r.gold)} 🪙/h · ${r.dust.toFixed(1)} ${DUSTI}/h${r.gems ? ` · ${r.gems.toFixed(1)} 💎/h` : ''} — qua thêm màn để tăng. Nâng Quán Trọ để tăng giới hạn giờ.</div></div>
      <div style="display:flex;flex-direction:column;gap:6px"><button class="gold" data-a="afkclaim" ${a.h < 0.1 ? 'disabled' : ''}>Nhận thưởng</button>
      <button class="blue sm" data-a="afkfast" ${f.left <= 0 ? 'disabled' : ''}>Tua nhanh 2h · ${f.cost ? f.cost + '💎' : 'MIỄN PHÍ'} (${f.left}/5)</button></div></div></div>`;
  const dust = `<div class="card wide"><div class="row"><span style="font-size:26px">${DUSTI}</span><div class="sp"><b>Bụi Sao: ${S.dust}</b><div class="mut">Dùng ${DUST_COST} Bụi Sao đổi thành 1 mảnh thẻ cho bất kỳ anh hùng nào (nút "+Mảnh" ở tab <b>Đấu Thẻ → Mạnh hóa thẻ</b>). Nhận từ Treo Máy, Đơn hàng, Thám hiểm, Tháp.</div></div></div></div>`;
  let orders;
  if (!featOn(1)) orders = lockCard('Đơn Hàng Thương Hội', 1);
  else {
    const gi = goldenInfo();
    orders = `<div class="card"><h3>📦 Đơn Hàng Thương Hội ${gi.active ? '<span class="tag SSR">Giờ Vàng</span>' : ''}</h3><div class="mut" style="margin-bottom:6px">Giao hàng từ kho với giá cao hơn chợ ~2 lần. Hãy <b>giữ hàng trong kho</b> (Công trình → Giữ lại) và nâng Nhà Kho để nhận đơn lớn.</div>` +
      (S.orders.list.length ? S.orders.list.map((od, i) => `<div class="card" style="margin:6px 0;background:#241b13"><div class="row"><b class="sp">${od.who}</b><span class="mut">thưởng: ${fmt(od.reward.gold)}🪙 ${od.reward.dust}${DUSTI}${od.reward.gems ? ' ' + od.reward.gems + '💎' : ''}</span></div>
        <div class="row" style="flex-wrap:wrap;margin-top:4px">${Object.entries(od.items).map(([g, n]) => `<span class="chip" style="min-width:0;${S[g] >= n ? '' : 'border-color:var(--bad)'}">${ico(GOOD[g].icon, 20)}${fmt(S[g])}/${fmt(n)}</span>`).join('')}<span class="sp"></span>
        <button class="gold sm" data-a="odeliver:${i}" ${orderOk(od) ? '' : 'disabled'}>Giao hàng</button><button class="sm" data-a="oskip:${i}" title="Bỏ đơn này">✕</button></div></div>`).join('') : `<div class="mut">Đơn mới đến sau ${fmtT(Math.max(0, (S.orders.next - nowMs()) / 1000))}…</div>`) + `</div>`;
  }
  let exp;
  if (!featOn(2)) exp = lockCard('Thám Hiểm', 2);
  else {
    const run = S.exp.missions.filter(m => m.end).length;
    exp = `<div class="card"><h3>🧭 Thám Hiểm <span class="mut">(${run}/${expSlots()} đang chạy)</span></h3><div class="mut" style="margin-bottom:6px">Chỉ thẻ <b>dự bị</b> (không nằm trong đội chiến đấu) mới đi được — dùng bộ sưu tập của bạn để kiếm Bụi Sao, vàng, ngọc.</div>` +
      S.exp.missions.map(m => {
        const done = m.end && nowMs() >= m.end, left = m.end ? (m.end - nowMs()) / 1000 : 0, cand = m.end ? [] : expCandidates(m), ok = cand.length >= m.req.count;
        const rw = `${fmt(m.reward.gold)}🪙 ${m.reward.dust}${DUSTI}${m.reward.gems ? ' ' + m.reward.gems + '💎' : ''}${m.reward.tickets ? ' 1🎫' : ''}`;
        return `<div class="card" style="margin:6px 0;background:#241b13"><div class="row"><b class="sp">${m.n}</b><span class="mut">${m.dur}h</span></div><div class="mut">Yêu cầu: ${reqTxt(m.req)} · Thưởng: ${rw}</div>
          ${m.end ? `<div class="row" style="margin-top:4px">${m.heroes.map(id => heroImg(HEROES[id], 28)).join('')}<div class="sp"><div class="bar"><i style="width:${Math.min(100, 100 - left / (m.dur * 3600) * 100)}%"></i></div><div class="mut">${done ? 'Hoàn thành!' : 'còn ' + fmtT(left)}</div></div><button class="gold sm" data-a="expcol:${m.id}" ${done ? '' : 'disabled'}>Nhận</button></div>`
            : `<div class="row" style="margin-top:4px"><span class="mut sp">${ok ? `Sẵn sàng: ${cand.slice(0, m.req.count).map(h => h.n).join(', ')}` : `Thiếu thẻ dự bị phù hợp (${cand.length}/${m.req.count})`}</span><button class="blue sm" data-a="expstart:${m.id}" ${ok && run < expSlots() ? '' : 'disabled'}>Phái đi</button></div>`}</div>`;
      }).join('') + `</div>`;
  }
  return afkCard + dust + orders + exp;
}
