// Hai ngôn ngữ: vi / en. Font: VI -> VT323 (đủ dấu tiếng Việt), EN -> Pixelify Sans.
export type Lang = 'vi' | 'en';

let lang: Lang = 'vi';
try {
  const s = localStorage.getItem('afk_lang');
  if (s === 'en' || s === 'vi') lang = s;
  else if (navigator.language?.toLowerCase().startsWith('en')) lang = 'en';
} catch { /* ignore */ }

export const getLang = (): Lang => lang;
export function setLang(l: Lang) {
  lang = l;
  try { localStorage.setItem('afk_lang', l); } catch { /* ignore */ }
}

/** Họ font theo ngôn ngữ (luôn có fallback có hỗ trợ tiếng Việt). */
export function fontFamily(): string {
  return lang === 'vi' ? '"VT323", monospace' : '"Pixelify Sans", "VT323", monospace';
}
/** VT323 nhỏ hơn Pixelify ~ 1.35 lần với cùng cỡ chữ */
export function fs(px: number): string {
  return Math.round(lang === 'vi' ? px * 1.3 : px) + 'px';
}

type Dict = Record<string, string>;

const VI: Dict = {
  title: 'Biên Niên Thủ Lĩnh',
  subtitle: 'AFK · Idle RPG',
  tap_start: 'Chạm để bắt đầu',
  gold: 'Vàng', stones: 'Đá Tinh Thạch', badges: 'Huy Hiệu',
  power: 'Lực chiến', rec_power: 'Khuyến nghị',
  map: 'Bản đồ', army: 'Quân đội', skills: 'Kỹ năng', train: 'Rèn luyện', settings: 'Cài đặt', battle: 'Chiến đấu',
  challenge_boss: 'Khiêu Chiến Boss', farming: 'Đang farm', locked: 'Chưa mở', cleared: 'Đã vượt',
  not_enough_power: 'Chưa đủ lực chiến', start_farm: 'Farm tại đây', farm_here: 'Farm Arena này',
  claim: 'Nhận', afk_chest: 'Hòm AFK', afk_full: 'Đầy!', afk_cap: 'Tối đa', hours: 'giờ',
  welcome_back: 'Chào mừng trở lại', away_for: 'Bạn đã vắng', collected: 'Đã thu',
  victory: 'Chiến Thắng', defeat: 'Thất Bại', next_arena: 'Arena kế tiếp mở khóa!', map_unlocked: 'Bản đồ mới mở khóa!',
  retry: 'Thử lại', back: 'Quay lại', close: 'Đóng', confirm: 'Xác nhận',
  wave: 'Đợt', boss: 'BOSS', hp: 'Máu', atk: 'Công', def: 'Giáp', aspd: 'Tốc đánh', level: 'Cấp', max: 'Tối đa',
  upgrade: 'Nâng cấp', unlock: 'Mở khóa', unlocked: 'Đã mở', need_req: 'Cần mở node trước',
  cost: 'Giá', tier: 'Bậc', squad: 'Đội hình', select_squad: 'Chọn 3 đạo quân', synergy: 'Cộng hưởng', no_synergy: 'Chưa có cộng hưởng',
  evolve: 'Tiến hóa', count: 'Quân số', respawn: 'Hồi sinh', sec: 'giây',
  mc_hero: 'Thủ Lĩnh', speed_x: 'Tốc độ', auto: 'Tự động',
  language: 'Ngôn ngữ', sound: 'Âm thanh', reset: 'Xóa dữ liệu', reset_confirm: 'Xóa toàn bộ tiến trình?',
  lang_vi: 'Tiếng Việt', lang_en: 'English',
  stat_hp: 'Cương Thể', stat_atk: 'Lực Đòn', stat_def: 'Giáp Trụ',
  stat_hp_d: 'Tăng HP tối đa', stat_atk_d: 'Tăng Sức tấn công', stat_def_d: 'Tăng Giáp',
  branch_root: 'Khởi Nguyên', branch_A: 'Thống Soái', branch_B: 'Bản Thể', branch_C: 'Huyền Bí & AFK',
  skill_points: 'Đá Tinh Thạch', next_cost: 'Chi phí node kế', skill_tree_hint: 'Chạm node để xem — mở lần lượt từ gốc đến ngọn',
  rate: 'Thu nhập', per_min: '/phút',
  drops: 'Rơi', gold_drop: 'Vàng', stone_drop: 'Đá', badge_drop: 'Huy hiệu',
  need_squad: 'Cần đủ 3 đạo quân', squad_saved: 'Đã lưu đội hình',
  arena: 'Arena', world: 'Thế giới', boss_of: 'Boss của',
  hint_1: 'Cắm máy farm tại Arena để tích Vàng và Đá, rồi khiêu chiến Boss.',
  offline_note: 'Thu nhập offline tính theo tốc độ farm gần nhất.',
  tower: 'Tháp', credits: 'Đồ họa: Tiny Swords (Pixel Frog), Tiny RPG (Zerie), Super Pixel Effects Gigapack (unTied Games)',
  rare_found: 'Nguyên liệu hiếm!', crit_gold: 'Vàng bạo kích!', holy_summon: 'Thánh Kỵ Sĩ!', divine: 'THẦN THỂ!', blackhole: 'HỐ ĐEN!',
  invuln: 'Bất tử!', shield: 'Khiên!', rage: 'Cuồng Nộ',
  reward: 'Phần thưởng', first_clear: 'Lần đầu vượt ải', boss_hp: 'Máu Boss', mc_down: 'Thủ Lĩnh gục ngã — hồi phục...',
  hold_to_view: 'Chạm để xem', buy: 'Mua', owned: 'Đang dùng', swap: 'Đổi',
  tab_stats: 'Chỉ số', tab_troops: 'Quân đội',
  days: 'ngày', ready: 'Sẵn sàng', farm_eff: 'Hiệu suất farm',
  village: 'Làng', site_farm: 'Trang Trại', site_lumber: 'Xưởng Gỗ', site_crystal: 'Mỏ Tinh Thạch', site_forge: 'Lò Rèn',
  build: 'Xây dựng', village_income: 'Thu nhập làng', all_villages: 'Tất cả làng', per_sec: '/giây', buy_gold: 'Không đủ Vàng',
  village_hint: 'Dân làng sản xuất liên tục kể cả khi bạn offline.',
};

const EN: Dict = {
  title: 'Chronicle of the Chieftain',
  subtitle: 'AFK · Idle RPG',
  tap_start: 'Tap to start',
  gold: 'Gold', stones: 'Crystal Stones', badges: 'Battle Badges',
  power: 'Power', rec_power: 'Recommended',
  map: 'Map', army: 'Army', skills: 'Skills', train: 'Train', settings: 'Settings', battle: 'Battle',
  challenge_boss: 'Challenge Boss', farming: 'Farming', locked: 'Locked', cleared: 'Cleared',
  not_enough_power: 'Not enough power', start_farm: 'Farm here', farm_here: 'Farm this Arena',
  claim: 'Claim', afk_chest: 'AFK Chest', afk_full: 'Full!', afk_cap: 'Cap', hours: 'h',
  welcome_back: 'Welcome back', away_for: 'You were away for', collected: 'Collected',
  victory: 'Victory', defeat: 'Defeat', next_arena: 'Next Arena unlocked!', map_unlocked: 'New map unlocked!',
  retry: 'Retry', back: 'Back', close: 'Close', confirm: 'Confirm',
  wave: 'Wave', boss: 'BOSS', hp: 'HP', atk: 'ATK', def: 'DEF', aspd: 'Atk Speed', level: 'Lv', max: 'Max',
  upgrade: 'Upgrade', unlock: 'Unlock', unlocked: 'Unlocked', need_req: 'Unlock the previous node first',
  cost: 'Cost', tier: 'Tier', squad: 'Squad', select_squad: 'Pick 3 troop types', synergy: 'Synergy', no_synergy: 'No synergy',
  evolve: 'Evolve', count: 'Units', respawn: 'Respawn', sec: 's',
  mc_hero: 'Chieftain', speed_x: 'Speed', auto: 'Auto',
  language: 'Language', sound: 'Sound', reset: 'Reset save', reset_confirm: 'Delete all progress?',
  lang_vi: 'Tiếng Việt', lang_en: 'English',
  stat_hp: 'Vitality', stat_atk: 'Might', stat_def: 'Armor',
  stat_hp_d: 'Increase max HP', stat_atk_d: 'Increase attack power', stat_def_d: 'Increase armor',
  branch_root: 'Origin', branch_A: 'Commander', branch_B: 'Vessel', branch_C: 'Arcane & AFK',
  skill_points: 'Crystal Stones', next_cost: 'Next node cost', skill_tree_hint: 'Tap a node for details — unlock from root to leaf',
  rate: 'Income', per_min: '/min',
  drops: 'Drops', gold_drop: 'Gold', stone_drop: 'Stones', badge_drop: 'Badges',
  need_squad: 'Pick exactly 3 troop types', squad_saved: 'Squad saved',
  arena: 'Arena', world: 'World', boss_of: 'Boss of',
  hint_1: 'Idle-farm an Arena for Gold and Stones, then challenge its Boss.',
  offline_note: 'Offline income uses your latest farming rate.',
  tower: 'Tower', credits: 'Art: Tiny Swords (Pixel Frog), Tiny RPG (Zerie), Super Pixel Effects Gigapack (unTied Games)',
  rare_found: 'Rare material!', crit_gold: 'Gold jackpot!', holy_summon: 'Holy Knights!', divine: 'DIVINE FORM!', blackhole: 'BLACK HOLE!',
  invuln: 'Invulnerable!', shield: 'Shield!', rage: 'Fury',
  reward: 'Rewards', first_clear: 'First clear', boss_hp: 'Boss HP', mc_down: 'Chieftain fell — recovering...',
  hold_to_view: 'Tap to view', buy: 'Buy', owned: 'In use', swap: 'Swap',
  tab_stats: 'Stats', tab_troops: 'Army',
  days: 'days', ready: 'Ready', farm_eff: 'Farm efficiency',
  village: 'Village', site_farm: 'Farm', site_lumber: 'Lumber Camp', site_crystal: 'Crystal Mine', site_forge: 'Forge',
  build: 'Build', village_income: 'Village income', all_villages: 'All villages', per_sec: '/s', buy_gold: 'Not enough Gold',
  village_hint: 'Villagers keep producing even while you are offline.',
};

/** Tên + mô tả tiếng Anh cho 46 kỹ năng, theo id. */
const SKILL_EN: Record<number, [string, string]> = {
  1: ['Chieftain’s Soul', 'Unlocks commanding 3 troop squads and automatic AFK resource gathering.'],
  2: ['Troop Surge I', 'Knight +1 unit, Archer +1 unit.'],
  3: ['Fortified Gear', 'Melee troops +25% Armor.'],
  4: ['Keen Arrows', 'Ranged units +10% Crit chance.'],
  5: ['Linked Shields', 'Knights have 35% to block a crit aimed at an ally.'],
  6: ['Volley Fire', 'When the Chieftain attacks, an Archer fires a bonus arrow.'],
  7: ['Reinforcement Array', 'Troop respawn time -20%.'],
  8: ['Troop Surge II', 'Healer +1 unit, Wizard +1 unit.'],
  9: ['March Song', '+15% move & attack speed for all allies during the first 10 seconds.'],
  10: ['Lifeblood Cell', 'Healers heal everyone for 8% of the Chieftain’s max HP every 8 seconds.'],
  11: ['Frontline Might', 'While Knights are above 50% HP, Chieftain takes 15% less damage.'],
  12: ['Covering Fire', 'Wizards cast an extra fireball when Knights raise their shields.'],
  13: ['Leader’s Aura', 'Each living trooper gives the Chieftain +2% ATK.'],
  14: ['Fearless Martyrs', 'Fallen troopers explode in an area and restore Chieftain rage.'],
  15: ['Undying Army', 'Troops take 30% less area damage from Bosses.'],
  16: ['Royal Legion', 'Summon Holy Knights when Chieftain is below 30% HP; +20% stats for all troops.'],
  17: ['Vitality I', 'Chieftain +20% max HP.'],
  18: ['Might I', 'Chieftain +20% attack.'],
  19: ['Battle Rhythm', 'Chieftain +15% attack speed.'],
  20: ['Sweeping Slash', 'Every 3rd attack cleaves in a cone.'],
  21: ['Riposte', '40% chance to reflect 25% of melee damage taken.'],
  22: ['Battlefield Leech', 'Heal for 6% of damage dealt.'],
  23: ['Iron Will', 'Immune to stun and freeze for the first 3 seconds.'],
  24: ['Decisive Blow', '+60% crit damage against controlled enemies.'],
  25: ['Fury', 'The lower your HP, the higher your attack and speed (up to +50%).'],
  26: ['Armor Breaker', 'Attacks ignore 30% of Boss armor.'],
  27: ['Energy Shell', 'Shield equal to 25% max HP every 15 seconds.'],
  28: ['Spirit Blade', 'Attack range +80%, attacks launch piercing energy waves.'],
  29: ['Absolute Immunity', 'Taking a crit grants 1.5s invulnerability (45s cooldown).'],
  30: ['Swiftness', 'Active skill cooldowns -20%.'],
  31: ['Avatar of War', 'Divine Form for 12s: +50% size, AoE true damage attacks, immune to control.'],
  32: ['Quick Harvest I', '+10% Gold farm rate.'],
  33: ['Refining I', '+10% Crystal Stone drop rate.'],
  34: ['Arcane Spark', 'Chieftain and Wizard attacks apply Burn over time.'],
  35: ['Frost Field', '30% on-hit chance to slow enemies by 40%.'],
  36: ['Chain Lightning', 'Slain enemies release lightning that jumps to 2 nearby targets.'],
  37: ['Expanded Chest', 'AFK chest stores up to 12 hours (instead of 8).'],
  38: ['Ancient Lore', 'Unlocking later nodes costs 15% fewer Crystal Stones.'],
  39: ['Gale Force', 'At the start of each wave, a whirlwind pulls monsters to the center.'],
  40: ['Delusion Strike', '10% on-hit chance to make enemies Confused (they fight each other).'],
  41: ['Super Accumulation', 'Instantly gain 2 hours of AFK resources when unlocking a new Arena.'],
  42: ['Gold Surge', '5% of normal monsters drop 5x Gold.'],
  43: ['Hex of Weakness', 'Bosses lose 25% attack and armor.'],
  44: ['Energy Flow', 'Wizard spells have no cast time.'],
  45: ['Lucky Chest', '+15% chance for rare materials (Badges) while farming.'],
  46: ['Void Rift', 'Summon a Black Hole at battle start that pulls monsters and deals magic damage; +25% AFK yield permanently.'],
};

export function t(key: string, p?: Record<string, string | number>): string {
  const d = lang === 'vi' ? VI : EN;
  let s = d[key] ?? VI[key] ?? key;
  if (p) for (const k of Object.keys(p)) s = s.replace(`{${k}}`, String(p[k]));
  return s;
}

export function skillName(id: number, viName: string): string {
  return lang === 'vi' ? viName : SKILL_EN[id]?.[0] ?? viName;
}
export function skillDesc(id: number, viDesc: string): string {
  return lang === 'vi' ? viDesc : SKILL_EN[id]?.[1] ?? viDesc;
}

const TROOP_EN: Record<string, [string, string, string]> = {
  knight: ['Heavy Knight', 'Frontline · Tank', 'Charges ahead and soaks 80% of melee hits. Raises a Rebound Shield: -40% frontal damage.'],
  pike: ['Pikeman', 'Frontline · Anti-rush', 'Stands behind Knights; thrusts through 2 targets and knocks back small foes.'],
  archer: ['Longbow Archer', 'Backline · Single target', 'Keeps distance, snipes low-HP foes and anything targeting the Chieftain. High crit.'],
  wizard: ['Elemental Wizard', 'Mid · AoE & Control', 'Channels for 1s then hurls fire/frost into the biggest crowd.'],
  healer: ['Temple Healer', 'Backline · Support', 'Follows the Chieftain; heals him first, then the lowest-HP ally.'],
  rogue: ['Shadow Rogue', 'Flex · Assassin', 'Turns invisible for 2s at battle start and blinks behind the enemy line.'],
};
const TROOP_VI: Record<string, [string, string, string]> = {};
export function troopText(id: string, vi: { name: string; role: string; desc: string }) {
  if (lang === 'vi') return vi;
  const e = TROOP_EN[id];
  return e ? { name: e[0], role: e[1], desc: e[2] } : vi;
}
void TROOP_VI;

const SYN_EN: Record<string, [string, string, string]> = {
  balance: ['Standard Balance', '+15% Knight HP · Archer +10% fire rate · Healer -20% cooldown.', 'Safe clears, steady-damage Bosses.'],
  iron: ['Iron Guard Formation', '-20% damage taken by melee · Chieftain +30% damage vs controlled foes.', 'Melee-heavy stages, fast monsters.'],
  storm: ['Storm & Flame', '+25% ranged damage · Chieftain’s basic attack becomes an energy beam.', 'Giant, slow Bosses.'],
  chaos: ['Chaotic Breaker', 'Frozen enemies take +50% crit damage from Rogues and Chieftain.', 'Stages with dangerous backlines.'],
};
export function synText(id: string, vi: { name: string; desc: string; best: string }) {
  if (lang === 'vi') return vi;
  const e = SYN_EN[id];
  return e ? { name: e[0], desc: e[1], best: e[2] } : vi;
}
