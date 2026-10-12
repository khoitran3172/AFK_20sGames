// 4 bản đồ lớn x 12 Arena = 48 Arena nối tiếp. Chỉ số quái Arena sau = ARENA_STEP (x5) lần Arena trước.
export interface MapDef {
  id: number;
  name: { vi: string; en: string };
  tilemap: string; // key ảnh tileset (màu cỏ)
  tint: number; // màu phủ không khí
  bgWater: number;
  mobs: string[]; // sprite set quái thường
  boss: string[]; // sprite set boss
  accent: number;
  decor: 'tree' | 'rock' | 'snow' | 'dark';
}

export const MAPS: MapDef[] = [
  { id: 0, name: { vi: 'Thảo Nguyên Evermoor', en: 'Evermoor Plains' }, tilemap: 'tilemap1', tint: 0xffffff, bgWater: 0x4a8fa8,
    mobs: ['orc', 'rwar', 'rpawn', 'rarc'], boss: ['orc', 'rwar'], accent: 0xf3d36b, decor: 'tree' },
  { id: 1, name: { vi: 'Rừng Sương Jandelle', en: 'Jandelle Mistwood' }, tilemap: 'tilemap2', tint: 0xd9f5e8, bgWater: 0x3b7f8a,
    mobs: ['rwar', 'rlan', 'rarc', 'rmonk', 'orc'], boss: ['rwar', 'orc'], accent: 0x7fe0a0, decor: 'tree' },
  { id: 2, name: { vi: 'Đỉnh Tuyết Vaskasia', en: 'Vaskasia Peaks' }, tilemap: 'tilemap3', tint: 0xe6efff, bgWater: 0x52789c,
    mobs: ['blan', 'barc', 'rlan', 'orc', 'bmonk'], boss: ['bwar', 'orc'], accent: 0x9fd0ff, decor: 'snow' },
  { id: 3, name: { vi: 'Hắc Thành Terbisia', en: 'Terbisia Citadel' }, tilemap: 'tilemap4', tint: 0xc8b8d8, bgWater: 0x2f4a66,
    mobs: ['bwar', 'blan', 'barc', 'bmonk', 'rpawn'], boss: ['bwar', 'orc'], accent: 0xc59bff, decor: 'dark' },
];

const PLACES: string[][] = [
  ['Evenmoor', 'Tylburne', 'Brookhollow', 'Vaskasia', 'Zeffira', 'Terbisia', 'Jandelle', 'Oakhaven', 'Stonewick', 'Mirefall', 'Sunharbor', 'Greywatch'],
  ['Mossgate', 'Fernholt', 'Dewmere', 'Willowend', 'Thornby', 'Larkspur', 'Hollowbrook', 'Ashgrove', 'Quillmoor', 'Briarwick', 'Nettlefen', 'Elderglade'],
  ['Frostmere', 'Icewind', 'Snowcrest', 'Glacierhold', 'Rimeford', 'Whitepine', 'Hailstone', 'Cragmoor', 'Winterhelm', 'Skyreach', 'Northwall', 'Howlpeak'],
  ['Duskfall', 'Gloomreach', 'Blackmere', 'Cinderkeep', 'Ravenspire', 'Ashenvale', 'Doomwatch', 'Hexmoor', 'Nightbarrow', 'Ironmaw', 'Bonegate', 'Terbisia Keep'],
];

/** Vị trí 12 node trên mỗi bản đồ (khung 1280x720), uốn lượn như đường đi. */
const NODE_POS: { x: number; y: number }[][] = [
  [
    { x: 250, y: 560 }, { x: 380, y: 470 }, { x: 540, y: 520 }, { x: 690, y: 440 }, { x: 560, y: 330 }, { x: 410, y: 250 },
    { x: 560, y: 150 }, { x: 740, y: 190 }, { x: 900, y: 270 }, { x: 1040, y: 190 }, { x: 1080, y: 360 }, { x: 960, y: 500 },
  ],
  [
    { x: 220, y: 200 }, { x: 360, y: 280 }, { x: 250, y: 410 }, { x: 400, y: 520 }, { x: 570, y: 450 }, { x: 560, y: 300 },
    { x: 720, y: 220 }, { x: 880, y: 300 }, { x: 760, y: 440 }, { x: 900, y: 560 }, { x: 1060, y: 470 }, { x: 1090, y: 290 },
  ],
  [
    { x: 200, y: 540 }, { x: 330, y: 430 }, { x: 230, y: 300 }, { x: 380, y: 200 }, { x: 540, y: 270 }, { x: 650, y: 400 },
    { x: 550, y: 540 }, { x: 760, y: 560 }, { x: 880, y: 430 }, { x: 800, y: 280 }, { x: 960, y: 190 }, { x: 1080, y: 320 },
  ],
  [
    { x: 240, y: 220 }, { x: 400, y: 160 }, { x: 560, y: 230 }, { x: 440, y: 360 }, { x: 280, y: 450 }, { x: 420, y: 560 },
    { x: 620, y: 520 }, { x: 760, y: 420 }, { x: 900, y: 500 }, { x: 1040, y: 420 }, { x: 960, y: 270 }, { x: 800, y: 170 },
  ],
];

export interface ArenaDef {
  index: number; // 0..47 toàn cục
  map: number;
  local: number; // 0..11
  name: string;
  x: number;
  y: number;
  scale: number; // hệ số chỉ số tích lũy m(i)
  growth: number; // hệ số nhân so với arena trước
  recPower: number; // lực chiến khuyến nghị để khiêu chiến Boss
  killGold: number;
  killStone: number;
  killBadge: number; // xác suất rơi (0..1) * số lượng
  bossReward: { gold: number; stones: number; badges: number };
  mobHp: number;
  mobAtk: number;
  mobDef: number;
  isLastOfMap: boolean;
}

export const TOTAL_ARENAS = 48;
export const ARENAS_PER_MAP = 12;

export const ARENA_STEP = 5;
export function arenaGrowth(i: number): number {
  return i <= 0 ? 1 : ARENA_STEP;
}

const BASE_MOB_HP = 70;
const BASE_MOB_ATK = 9;
const BASE_MOB_DEF = 4;
export const REC_K = 260; // lực chiến khuyến nghị = REC_K * scale (chỉnh bằng tools/sim.ts)

export const ARENAS: ArenaDef[] = (() => {
  const out: ArenaDef[] = [];
  let m = 1;
  for (let i = 0; i < TOTAL_ARENAS; i++) {
    const g = arenaGrowth(i);
    if (i > 0) m *= g;
    const map = Math.floor(i / ARENAS_PER_MAP);
    const local = i % ARENAS_PER_MAP;
    const p = NODE_POS[map][local];
    out.push({
      index: i, map, local, name: PLACES[map][local], x: p.x, y: p.y,
      scale: m, growth: g,
      recPower: Math.round(REC_K * m),
      killGold: 3 * m,
      killStone: 0.18 * m,
      killBadge: 0.05,
      bossReward: { gold: 400 * m, stones: 12 * m, badges: 2 + Math.floor(i / 4) },
      mobHp: BASE_MOB_HP * m,
      mobAtk: BASE_MOB_ATK * m,
      mobDef: BASE_MOB_DEF * Math.sqrt(m),
      isLastOfMap: local === ARENAS_PER_MAP - 1,
    });
  }
  return out;
})();

export const MOB_SPEC: Record<string, { hp: number; atk: number; aspd: number; speed: number; range: number; ranged: boolean; scale: number; weight: number }> = {
  orc: { hp: 1.2, atk: 1.0, aspd: 0.8, speed: 78, range: 70, ranged: false, scale: 1, weight: 1 },
  rwar: { hp: 1.0, atk: 1.0, aspd: 0.9, speed: 82, range: 70, ranged: false, scale: 1, weight: 1 },
  rpawn: { hp: 0.7, atk: 0.9, aspd: 1.3, speed: 110, range: 55, ranged: false, scale: 1, weight: 1 },
  rlan: { hp: 1.1, atk: 1.0, aspd: 0.8, speed: 76, range: 105, ranged: false, scale: 1, weight: 1 },
  rarc: { hp: 0.6, atk: 1.2, aspd: 0.8, speed: 56, range: 300, ranged: true, scale: 1, weight: 1 },
  rmonk: { hp: 0.7, atk: 1.2, aspd: 0.6, speed: 54, range: 260, ranged: true, scale: 1, weight: 1 },
  blan: { hp: 1.3, atk: 1.1, aspd: 0.8, speed: 78, range: 105, ranged: false, scale: 1, weight: 1 },
  barc: { hp: 0.7, atk: 1.3, aspd: 0.9, speed: 58, range: 320, ranged: true, scale: 1, weight: 1 },
  bmonk: { hp: 0.8, atk: 1.3, aspd: 0.6, speed: 54, range: 270, ranged: true, scale: 1, weight: 1 },
  martial: { hp: 0.9, atk: 1.25, aspd: 1.2, speed: 100, range: 62, ranged: false, scale: 1, weight: 1 },
  king: { hp: 1.5, atk: 1.2, aspd: 0.9, speed: 80, range: 74, ranged: false, scale: 1, weight: 1 },
  bwar: { hp: 1.5, atk: 1.2, aspd: 0.9, speed: 84, range: 72, ranged: false, scale: 1, weight: 1 },
};
