// Đăng ký spritesheet + animation. Tiny Swords (Pixel Frog) & Tiny RPG (Zerie).
const TS = 'assets/ts/Units';
const ZR = 'assets/zerie';

export interface AnimDef {
  file: string; // đường dẫn ảnh
  fw: number;
  fh: number;
  frames: number;
  fps: number;
  loop?: boolean;
}

export interface SpriteSet {
  id: string;
  scale: number;
  ox: number;
  oy: number; // origin: tâm chân nhân vật trong frame
  anims: Record<string, AnimDef>;
  /** hướng mặc định của sprite: true = nhìn phải */
  faceRight: boolean;
  shadow: number; // bề rộng bóng
}

const ts = (color: string, unit: string, file: string) => `${TS}/${color}_Units/${unit}/${file}.png`;
const A = (file: string, fw: number, fh: number, frames: number, fps = 10, loop = false): AnimDef => ({ file, fw, fh, frames, fps, loop });

function warrior(color: string, id: string, scale: number): SpriteSet {
  return {
    id, scale, ox: 0.5, oy: 0.62, faceRight: true, shadow: 60,
    anims: {
      idle: A(ts(color, 'Warrior', 'Warrior_Idle'), 192, 192, 8, 8, true),
      walk: A(ts(color, 'Warrior', 'Warrior_Run'), 192, 192, 6, 12, true),
      attack: A(ts(color, 'Warrior', 'Warrior_Attack1'), 192, 192, 4, 11),
      attack2: A(ts(color, 'Warrior', 'Warrior_Attack2'), 192, 192, 4, 11),
      guard: A(ts(color, 'Warrior', 'Warrior_Guard'), 192, 192, 6, 10, true),
    },
  };
}
function lancer(color: string, id: string, scale: number): SpriteSet {
  return {
    id, scale, ox: 0.5, oy: 0.56, faceRight: true, shadow: 64,
    anims: {
      idle: A(ts(color, 'Lancer', 'Lancer_Idle'), 320, 320, 12, 9, true),
      walk: A(ts(color, 'Lancer', 'Lancer_Run'), 320, 320, 6, 12, true),
      attack: A(ts(color, 'Lancer', 'Lancer_Right_Attack'), 320, 320, 3, 9),
      guard: A(ts(color, 'Lancer', 'Lancer_Right_Defence'), 320, 320, 6, 10, true),
    },
  };
}
function archer(color: string, id: string, scale: number): SpriteSet {
  return {
    id, scale, ox: 0.5, oy: 0.62, faceRight: true, shadow: 52,
    anims: {
      idle: A(ts(color, 'Archer', 'Archer_Idle'), 192, 192, 6, 8, true),
      walk: A(ts(color, 'Archer', 'Archer_Run'), 192, 192, 4, 12, true),
      attack: A(ts(color, 'Archer', 'Archer_Shoot'), 192, 192, 8, 14),
    },
  };
}
function monk(color: string, id: string, scale: number): SpriteSet {
  return {
    id, scale, ox: 0.5, oy: 0.62, faceRight: true, shadow: 52,
    anims: {
      idle: A(ts(color, 'Monk', 'Idle'), 192, 192, 6, 8, true),
      walk: A(ts(color, 'Monk', 'Run'), 192, 192, 4, 12, true),
      attack: A(ts(color, 'Monk', 'Heal'), 192, 192, 11, 14),
    },
  };
}
function pawnKnife(color: string, id: string, scale: number): SpriteSet {
  return {
    id, scale, ox: 0.5, oy: 0.62, faceRight: true, shadow: 46,
    anims: {
      idle: A(ts(color, 'Pawn', 'Pawn_Idle_Knife'), 192, 192, 8, 9, true),
      walk: A(ts(color, 'Pawn', 'Pawn_Run_Knife'), 192, 192, 6, 14, true),
      attack: A(ts(color, 'Pawn', 'Pawn_Interact_Knife'), 192, 192, 4, 13),
    },
  };
}
function zerie(who: 'Soldier' | 'Orc', id: string, scale: number, atk3: boolean): SpriteSet {
  const p = (f: string) => `${ZR}/${who}/${who}/${who}_${f}.png`;
  const anims: Record<string, AnimDef> = {
    idle: A(p('Idle'), 100, 100, 6, 7, true),
    walk: A(p('Walk'), 100, 100, 8, 11, true),
    attack: A(p('Attack01'), 100, 100, 6, 12),
    attack2: A(p('Attack02'), 100, 100, 6, 12),
    hurt: A(p('Hurt'), 100, 100, 4, 12),
    death: A(p('Death'), 100, 100, 4, 8),
  };
  if (atk3) anims.attack3 = A(p('Attack03'), 100, 100, 9, 14);
  return { id, scale, ox: 0.5, oy: 0.56, faceRight: true, shadow: 46, anims };
}

function pawnJob(id: string, tool: string, load: string, act: string, actFrames: number): SpriteSet {
  const f = (n: string) => ts('Blue', 'Pawn', n);
  return {
    id, scale: 0.8, ox: 0.5, oy: 0.62, faceRight: true, shadow: 46,
    anims: {
      idle: A(f('Pawn_Idle_' + tool), 192, 192, 8, 8, true),
      walk: A(f('Pawn_Run_' + load), 192, 192, 6, 12, true),
      back: A(f('Pawn_Run_' + tool), 192, 192, 6, 12, true),
      attack: A(f(act), 192, 192, actFrames, 10, true),
    },
  };
}
export const SPRITE_SETS: SpriteSet[] = [
  // --- dân làng ---
  pawnJob('pv_farm', 'Knife', 'Meat', 'Pawn_Interact_Knife', 4),
  pawnJob('pv_lumber', 'Axe', 'Wood', 'Pawn_Interact_Axe', 6),
  pawnJob('pv_crystal', 'Pickaxe', 'Gold', 'Pawn_Interact_Pickaxe', 6),
  pawnJob('pv_forge', 'Hammer', 'Hammer', 'Pawn_Interact_Hammer', 3),
  // --- phe ta ---
  zerie('Soldier', 'mc', 3.6, true),
  warrior('Blue', 'knight', 0.95),
  lancer('Blue', 'pike', 0.62),
  archer('Blue', 'archer', 0.85),
  monk('Purple', 'wizard', 0.85),
  monk('Blue', 'healer', 0.85),
  pawnKnife('Black', 'rogue', 0.8),
  warrior('Blue', 'holy', 1.05),
  // --- địch ---
  zerie('Orc', 'orc', 3.4, false),
  warrior('Red', 'rwar', 0.95),
  lancer('Red', 'rlan', 0.6),
  archer('Red', 'rarc', 0.8),
  monk('Red', 'rmonk', 0.8),
  pawnKnife('Red', 'rpawn', 0.8),
  warrior('Black', 'bwar', 0.95),
  lancer('Black', 'blan', 0.6),
  archer('Black', 'barc', 0.8),
  monk('Black', 'bmonk', 0.8),
];

export const SET_BY_ID: Record<string, SpriteSet> = Object.fromEntries(SPRITE_SETS.map((s) => [s.id, s]));

/** Các asset ảnh tĩnh / sheet khác */
export const IMAGES: Record<string, string> = {
  arrowBlue: `${TS}/Blue_Units/Archer/Arrow.png`,
  arrowRed: `${TS}/Red_Units/Archer/Arrow.png`,
  tilemap1: 'assets/ts/Terrain/Tileset/Tilemap_color1.png',
  tilemap2: 'assets/ts/Terrain/Tileset/Tilemap_color2.png',
  tilemap3: 'assets/ts/Terrain/Tileset/Tilemap_color3.png',
  tilemap4: 'assets/ts/Terrain/Tileset/Tilemap_color4.png',
  tilemap5: 'assets/ts/Terrain/Tileset/Tilemap_color5.png',
  waterBg: 'assets/ts/Terrain/Tileset/Water_Background_color.png',
  foam: 'assets/ts/Terrain/Tileset/Water_Foam.png',
  shadow: 'assets/ts/Terrain/Tileset/Shadow.png',
  tree1: 'assets/ts/Terrain/Resources/Wood/Trees/Tree1.png',
  tree2: 'assets/ts/Terrain/Resources/Wood/Trees/Tree2.png',
  tree3: 'assets/ts/Terrain/Resources/Wood/Trees/Tree3.png',
  tree4: 'assets/ts/Terrain/Resources/Wood/Trees/Tree4.png',
  rock1: 'assets/ts/Terrain/Decorations/Rocks/Rock1.png',
  rock2: 'assets/ts/Terrain/Decorations/Rocks/Rock2.png',
  rock3: 'assets/ts/Terrain/Decorations/Rocks/Rock3.png',
  rock4: 'assets/ts/Terrain/Decorations/Rocks/Rock4.png',
  goldStone: 'assets/ts/Terrain/Resources/Gold/Gold_Stones/Gold_Stone_1.png',
  goldStone2: 'assets/ts/Terrain/Resources/Gold/Gold_Stones/Gold_Stone_3.png',
  goldRes: 'assets/ts/Terrain/Resources/Gold/Gold_Resource/Gold_Resource.png',
  woodRes: 'assets/ts/Terrain/Resources/Wood/Wood_Resource/Wood_Resource.png',
  meatRes: 'assets/ts/Terrain/Resources/Meat/Meat_Resource/Meat_Resource.png',
  bPaper: 'assets/ts/UI_Elements/UI_Elements/Papers/RegularPaper.png',
  bPaperSp: 'assets/ts/UI_Elements/UI_Elements/Papers/SpecialPaper.png',
  btnBlue: 'assets/ts/UI_Elements/UI_Elements/Buttons/BigBlueButton_Regular.png',
  btnBluePr: 'assets/ts/UI_Elements/UI_Elements/Buttons/BigBlueButton_Pressed.png',
  btnRed: 'assets/ts/UI_Elements/UI_Elements/Buttons/BigRedButton_Regular.png',
  btnRedPr: 'assets/ts/UI_Elements/UI_Elements/Buttons/BigRedButton_Pressed.png',
  roundBlue: 'assets/ts/UI_Elements/UI_Elements/Buttons/SmallBlueRoundButton_Regular.png',
  roundRed: 'assets/ts/UI_Elements/UI_Elements/Buttons/SmallRedRoundButton_Regular.png',
  sqBlue: 'assets/ts/UI_Elements/UI_Elements/Buttons/SmallBlueSquareButton_Regular.png',
  sqRed: 'assets/ts/UI_Elements/UI_Elements/Buttons/SmallRedSquareButton_Regular.png',
  ribbonBlue: 'assets/ts/UI_Elements/UI_Banners_from_the_store_page/Ribbons/Ribbon_Blue.png',
  ribbonRed: 'assets/ts/UI_Elements/UI_Banners_from_the_store_page/Ribbons/Ribbon_Red.png',
  ribbonYellow: 'assets/ts/UI_Elements/UI_Banners_from_the_store_page/Ribbons/Ribbon_Yellow.png',
  ribbonPurple: 'assets/ts/UI_Elements/UI_Banners_from_the_store_page/Ribbons/Ribbon_Purple.png',
  barBase: 'assets/ts/UI_Elements/UI_Elements/Bars/SmallBar_Base.png',
  barFill: 'assets/ts/UI_Elements/UI_Elements/Bars/SmallBar_Fill.png',
  castleBlue: 'assets/ts/Buildings/Blue_Buildings/Castle.png',
  towerBlue: 'assets/ts/Buildings/Blue_Buildings/Tower.png',
  barracksBlue: 'assets/ts/Buildings/Blue_Buildings/Barracks.png',
  houseBlue: 'assets/ts/Buildings/Blue_Buildings/House1.png',
  castleRed: 'assets/ts/Buildings/Red_Buildings/Castle.png',
  towerRed: 'assets/ts/Buildings/Red_Buildings/Tower.png',
  barracksRed: 'assets/ts/Buildings/Red_Buildings/Barracks.png',
  houseRed: 'assets/ts/Buildings/Red_Buildings/House1.png',
  towerBlack: 'assets/ts/Buildings/Black_Buildings/Tower.png',
  houseBlack: 'assets/ts/Buildings/Black_Buildings/House1.png',
  barracksBlack: 'assets/ts/Buildings/Black_Buildings/Barracks.png',
  archeryRed: 'assets/ts/Buildings/Red_Buildings/Archery.png',
  monasteryRed: 'assets/ts/Buildings/Red_Buildings/Monastery.png',
  castleBlack: 'assets/ts/Buildings/Black_Buildings/Castle.png',
  archeryBlue: 'assets/ts/Buildings/Blue_Buildings/Archery.png',
  monasteryBlue: 'assets/ts/Buildings/Blue_Buildings/Monastery.png',
  cloud1: 'assets/ts/Terrain/Decorations/Clouds/Clouds_01.png',
  cloud2: 'assets/ts/Terrain/Decorations/Clouds/Clouds_03.png',
  cloud3: 'assets/ts/Terrain/Decorations/Clouds/Clouds_05.png',
};
for (let i = 1; i <= 12; i++) IMAGES['icon' + i] = `assets/ts/UI_Elements/UI_Elements/Icons/Icon_${String(i).padStart(2, '0')}.png`;

/** Spritesheet FX */
export const FX_SHEETS: Record<string, { file: string; fw: number; fh: number; frames: number; fps: number }> = {
  fxExplosion: { file: 'assets/ts/Particle_FX/Explosion_01.png', fw: 192, fh: 192, frames: 8, fps: 16 },
  fxExplosion2: { file: 'assets/ts/Particle_FX/Explosion_02.png', fw: 192, fh: 192, frames: 10, fps: 16 },
  fxDust: { file: 'assets/ts/Particle_FX/Dust_01.png', fw: 64, fh: 64, frames: 8, fps: 14 },
  fxFire: { file: 'assets/ts/Particle_FX/Fire_01.png', fw: 64, fh: 64, frames: 8, fps: 12 },
  fxHeal: { file: 'assets/ts/Units/Blue_Units/Monk/Heal_Effect.png', fw: 192, fh: 192, frames: 11, fps: 14 },
  fxSplash: { file: 'assets/ts/Particle_FX/Water_Splash.png', fw: 192, fh: 192, frames: 9, fps: 14 },
};

/** Trang trí động (spritesheet lặp) cho bản đồ & sàn đấu */
export const DECOR_SHEETS: Record<string, { file: string; fw: number; fh: number; frames: number; fps: number }> = {
  tree1: { file: 'assets/ts/Terrain/Resources/Wood/Trees/Tree1.png', fw: 192, fh: 256, frames: 8, fps: 6 },
  tree2: { file: 'assets/ts/Terrain/Resources/Wood/Trees/Tree2.png', fw: 192, fh: 256, frames: 8, fps: 6 },
  tree3: { file: 'assets/ts/Terrain/Resources/Wood/Trees/Tree3.png', fw: 192, fh: 192, frames: 8, fps: 6 },
  tree4: { file: 'assets/ts/Terrain/Resources/Wood/Trees/Tree4.png', fw: 192, fh: 192, frames: 8, fps: 6 },
  bush1: { file: 'assets/ts/Terrain/Decorations/Bushes/Bushe1.png', fw: 128, fh: 128, frames: 8, fps: 6 },
  bush2: { file: 'assets/ts/Terrain/Decorations/Bushes/Bushe2.png', fw: 128, fh: 128, frames: 8, fps: 6 },
  sheep: { file: 'assets/ts/Terrain/Resources/Meat/Sheep/Sheep_Idle.png', fw: 128, fh: 128, frames: 6, fps: 6 },
  sheepGrass: { file: 'assets/ts/Terrain/Resources/Meat/Sheep/Sheep_Grass.png', fw: 128, fh: 128, frames: 12, fps: 7 },
  wrock1: { file: 'assets/ts/Terrain/Decorations/Rocks_in_the_Water/Water_Rocks_01.png', fw: 64, fh: 64, frames: 16, fps: 8 },
  wrock2: { file: 'assets/ts/Terrain/Decorations/Rocks_in_the_Water/Water_Rocks_02.png', fw: 64, fh: 64, frames: 16, fps: 8 },
};
