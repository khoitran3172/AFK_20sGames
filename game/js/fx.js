'use strict';
/* =====================================================================
   VFX — phát spritesheet (Super Pixel Effects Gigapack, unTied Games) bằng DOM
   fx('ring_b', {x, y, s:2, hue, flip, rot, fps, loop, z, delay, blend, onend}) — toạ độ theo khung 1280x720
   ===================================================================== */
const FXIMG = {};
function fxLoad(n) { if (!FXIMG[n]) { const i = new Image(); i.src = `assets/fx/${n}.png`; FXIMG[n] = i; } return FXIMG[n]; }
if (typeof FXMAN !== 'undefined') for (const k in FXMAN) fxLoad(k);
function stagePos(el) {
  const st = document.getElementById('stage'), sr = st.getBoundingClientRect(), k = sr.width / 1280, r = el.getBoundingClientRect();
  return { x: (r.left + r.width / 2 - sr.left) / k, y: (r.top + r.height / 2 - sr.top) / k };
}
function fx(name, o = {}) {
  const m = typeof FXMAN !== 'undefined' && FXMAN[name]; if (!m) return null;
  const host = o.host || document.getElementById('stage'), s = o.s || 2, fps = (o.fps || 15) * (o.speed || 1);
  const el = document.createElement('div'); el.className = 'fx';
  el.style.cssText = `left:${o.x || 640}px;top:${o.y || 360}px;z-index:${o.z || 30};background-image:url(assets/fx/${name}.png);background-size:${m.w * s}px ${m.h * s}px;` +
    (o.hue ? `filter:hue-rotate(${o.hue}deg) saturate(${o.sat || 1});` : '') + (o.blend ? `mix-blend-mode:${o.blend};` : '') +
    (o.op != null ? `opacity:${o.op};` : '') + `transform:translate(-50%,-50%) rotate(${o.rot || 0}deg) scaleX(${o.flip ? -1 : 1});`;
  let i = 0, timer = null;
  const set = () => { const f = m.f[i]; el.style.width = f[2] * s + 'px'; el.style.height = f[3] * s + 'px'; el.style.backgroundPosition = `-${f[0] * s}px -${f[1] * s}px`; };
  el.stop = () => { clearInterval(timer); el.remove(); };
  const go = () => {
    set(); host.appendChild(el);
    timer = setInterval(() => { i++; if (i >= m.f.length) { if (o.loop) i = 0; else { el.stop(); if (o.onend) o.onend(); return; } } set(); }, 1000 / fps);
  };
  if (o.delay) setTimeout(go, o.delay); else go();
  return el;
}
const fxEl = (name, el, o = {}) => { if (!el) return null; const p = stagePos(el); return fx(name, { ...o, x: p.x + (o.dx || 0), y: p.y + (o.dy || 0) }); };
function shake(el, ms = 350) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); setTimeout(() => el.classList.remove('shake'), ms); }
