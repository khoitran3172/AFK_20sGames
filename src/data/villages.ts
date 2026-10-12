// Bố cục làng cho 48 Arena: sinh theo seed -> mỗi Arena một bố cục riêng (đất, hồ, lâu đài, vị trí 4 công trình, trang trí).
import { ARENAS, MAPS } from './arenas';
import { SITE_TYPES, SiteType } from '../core/village';

export const VCOLS = 20, VROWS = 12, VY0 = -24, VT = 64;
export type VMask = boolean[][];

export interface VSite { type: SiteType; x: number; y: number; work: { x: number; y: number }[]; deco: { k: 'sheep' | 'tree' | 'stump' | 'crystal' | 'forge'; x: number; y: number; v: number }[] }
export interface VDecor { k: 'tree' | 'rock' | 'bush' | 'gold' | 'sheep' | 'banner' | 'house'; x: number; y: number; v: number }
export interface VLayout {
  castle: { x: number; y: number; flip: boolean };
  door: { x: number; y: number };
  sites: VSite[];
  decor: VDecor[];
  mask: VMask;
  pond: { x: number; y: number; r: number } | null;
  tilemap: string;
  mapIdx: number;
}

function rng(seed: number) {
  let s = (seed * 2654435761) >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
function shuffle<T>(a: T[], r: () => number): T[] {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}

// 6 khuôn bố cục (vị trí lâu đài + 4 ô công trình), thêm xáo trộn/lệch theo seed
const TEMPLATES: { castle: [number, number]; slots: [number, number][] }[] = [
  { castle: [640, 300], slots: [[260, 280], [1020, 280], [300, 470], [980, 470]] },
  { castle: [300, 290], slots: [[620, 240], [940, 280], [520, 460], [900, 470]] },
  { castle: [980, 290], slots: [[640, 250], [330, 280], [740, 470], [380, 470]] },
  { castle: [640, 250], slots: [[240, 360], [1040, 360], [450, 480], [830, 480]] },
  { castle: [420, 300], slots: [[880, 250], [1060, 400], [700, 480], [200, 470]] },
  { castle: [860, 300], slots: [[400, 240], [200, 400], [560, 480], [1040, 470]] },
];

const cache = new Map<number, VLayout>();

export function layoutFor(arena: number): VLayout {
  const hit = cache.get(arena);
  if (hit) return hit;
  const a = ARENAS[Math.min(arena, ARENAS.length - 1)];
  const map = MAPS[a.map];
  const r = rng(arena * 7919 + 17);
  const tpl = TEMPLATES[Math.floor(r() * TEMPLATES.length)];
  const jit = () => (r() - 0.5) * 70;
  const castle = { x: tpl.castle[0] + jit(), y: tpl.castle[1] + jit() * 0.5, flip: r() < 0.5 };
  const door = { x: castle.x, y: castle.y + 18 };
  const order = shuffle(SITE_TYPES, r);
  const placed: { x: number; y: number }[] = [];
  const sites: VSite[] = tpl.slots.map(([sx, sy], i) => {
    let x = sx + jit(), y = sy + jit() * 0.6;
    // giữ khoảng cách với lâu đài và các công trình khác
    for (let it = 0; it < 12; it++) {
      const others = [{ x: castle.x, y: castle.y, m: 270 }, ...placed.map((p) => ({ ...p, m: 230 }))];
      let moved = false;
      for (const o of others) {
        const dx = x - o.x, dy = (y - o.y) * 1.4, d = Math.hypot(dx, dy) || 1;
        if (d < o.m) { x += (dx / d) * (o.m - d); y += ((dy / d) * (o.m - d)) / 1.4; moved = true; }
      }
      x = Math.max(130, Math.min(1150, x)); y = Math.max(210, Math.min(470, y));
      if (!moved) break;
    }
    placed.push({ x, y });
    const type = order[i];
    const work: { x: number; y: number }[] = [];
    for (let k = 0; k < 5; k++) { const ang = (k / 5) * Math.PI * 2 + r(); work.push({ x: x + Math.cos(ang) * (46 + r() * 30), y: y + 30 + Math.sin(ang) * (22 + r() * 14) }); }
    const deco: VSite['deco'] = [];
    if (type === 'farm') for (let k = 0; k < 3; k++) deco.push({ k: 'sheep', x: x + (r() - 0.5) * 150, y: y + 20 + (r() - 0.3) * 60, v: k * 4 });
    if (type === 'lumber') for (let k = 0; k < 5; k++) deco.push({ k: k < 4 ? 'tree' : 'stump', x: x + (r() - 0.5) * 190, y: y - 10 + (r() - 0.3) * 80, v: 1 + Math.floor(r() * 4) });
    if (type === 'crystal') for (let k = 0; k < 3; k++) deco.push({ k: 'crystal', x: x + (k - 1) * 70 + (r() - 0.5) * 20, y: y + 8 + (r() - 0.5) * 36, v: k });
    if (type === 'forge') deco.push({ k: 'forge', x, y: y - 6, v: 0 });
    return { type, x, y, work, deco };
  });

  // đất: hợp các vòng quanh lâu đài + công trình + vài thùy ngẫu nhiên, trừ hồ
  const blobs: { x: number; y: number; r: number }[] = [{ x: castle.x, y: castle.y, r: 210 }];
  for (const s of sites) blobs.push({ x: s.x, y: s.y, r: 150 });
  for (let i = 0; i < 4; i++) blobs.push({ x: 160 + r() * 960, y: 220 + r() * 300, r: 90 + r() * 60 });
  // cầu đất nối lâu đài với từng công trình (để dân làng luôn đi được trên đất)
  for (const st of sites) for (let k = 1; k < 8; k++) blobs.push({ x: castle.x + ((st.x - castle.x) * k) / 8, y: castle.y + ((st.y - castle.y) * k) / 8, r: 85 });
  const corridor = blobs.filter((b) => b.r === 85 || b.r === 210 || b.r === 150);
  const pond = r() < 0.7 ? { x: 560 + (r() - 0.5) * 500, y: 380 + (r() - 0.5) * 120, r: 56 + r() * 36 } : null;
  const mask: VMask = Array.from({ length: VROWS }, () => Array<boolean>(VCOLS).fill(false));
  for (let rr = 0; rr < VROWS; rr++) for (let c = 0; c < VCOLS; c++) {
    const px = c * VT + 32, py = VY0 + rr * VT + 32;
    let on = blobs.some((b) => Math.hypot(b.x - px, (b.y - py) * 1.15) < b.r);
    if (on && pond && Math.hypot(pond.x - px, (pond.y - py) * 1.2) < pond.r && !corridor.some((b) => Math.hypot(b.x - px, (b.y - py) * 1.15) < 70)) on = false;
    // giữ khoảng trống phía trên (HUD) và dưới (bảng nâng cấp)
    if (py < 110 || py > 600) on = false;
    mask[rr][c] = on;
  }
  for (let rr = 1; rr < VROWS - 1; rr++) for (let c = 1; c < VCOLS - 1; c++) {
    if (!mask[rr][c] && mask[rr - 1][c] && mask[rr + 1][c] && mask[rr][c - 1] && mask[rr][c + 1]) mask[rr][c] = true;
  }
  const onLand = (x: number, y: number) => {
    const c = Math.floor(x / VT), rr = Math.floor((y - VY0) / VT);
    return rr > 0 && rr < VROWS - 1 && c > 0 && c < VCOLS - 1 && mask[rr][c] && mask[rr][c - 1] && mask[rr][c + 1] && mask[rr + 1][c] && mask[rr - 1][c];
  };
  const decor: VDecor[] = [];
  const kinds: VDecor['k'][] = map.decor === 'snow' ? ['tree', 'rock', 'rock', 'bush', 'banner']
    : map.decor === 'dark' ? ['tree', 'rock', 'gold', 'rock', 'banner'] : ['tree', 'tree', 'bush', 'sheep', 'rock', 'house', 'banner'];
  let tries = 0;
  const free = (x: number, y: number) =>
    Math.hypot(x - castle.x, y - castle.y) > 170 && sites.every((s) => Math.hypot(s.x - x, (s.y - y) * 1.3) > 125) && decor.every((d) => Math.hypot(d.x - x, d.y - y) > 62) &&
    !(pond && Math.hypot(pond.x - x, pond.y - y) < pond.r + 30);
  while (decor.length < 26 && tries++ < 900) {
    const x = r() * 1200 + 40, y = r() * 480 + 130;
    if (!onLand(x, y) || !free(x, y)) continue;
    decor.push({ k: kinds[Math.floor(r() * kinds.length)], x, y, v: Math.floor(r() * 4) });
  }
  const out: VLayout = { castle, door, sites, decor, mask, pond, tilemap: map.tilemap, mapIdx: a.map };
  cache.set(arena, out);
  return out;
}
