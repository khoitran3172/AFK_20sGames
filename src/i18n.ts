// Hai ngôn ngữ: vi / en. Font: VI -> Baloo 2 (dễ đọc, đủ dấu tiếng Việt), EN -> Pixelify Sans.
import { TROOP_SPECIAL, TroopId } from './data/troops';
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
  return lang === 'vi' ? '"Baloo 2", "VT323", sans-serif' : '"Pixelify Sans", "VT323", monospace';
}
/** Baloo 2 nhỏ hơn Pixelify chút ít với cùng cỡ chữ */
export function fs(px: number): string {
  return Math.round(lang === 'vi' ? px * 1.02 : px) + 'px';
}

type Dict = Record<string, string>;

const VI: Dict = {
  title: 'Biên Niên Thủ Lĩnh',
  subtitle: 'AFK · Idle RPG',
  tap_start: 'Chạm vô để bắt đầu nha',
  gold: 'Vàng', stones: 'Đá Tinh Thạch', badges: 'Huy Hiệu',
  power: 'Lực chiến', rec_power: 'Khuyến nghị',
  map: 'Bản đồ', army: 'Quân đội', skills: 'Kỹ năng', train: 'Rèn luyện', settings: 'Cài đặt', battle: 'Chiến đấu',
  challenge_boss: 'Khiêu Chiến Boss', farming: 'Đang farm', locked: 'Chưa mở', cleared: 'Đã vượt',
  not_enough_power: 'Chưa đủ lực chiến, ráng thêm nha', start_farm: 'Farm tại đây', farm_here: 'Farm Arena này',
  claim: 'Lãnh', afk_chest: 'Hòm AFK', afk_full: 'Đầy!', afk_cap: 'Tối đa', hours: 'giờ',
  welcome_back: 'Mừng bạn quay lại nè', away_for: 'Bạn đi vắng', collected: 'Đã lãnh',
  victory: 'Chiến Thắng', defeat: 'Thất Bại', next_arena: 'Mở được Arena kế tiếp rồi nè!', map_unlocked: 'Mở thêm bản đồ mới luôn!',
  retry: 'Thử lại', back: 'Quay lại', close: 'Đóng', confirm: 'Xác nhận',
  wave: 'Đợt', boss: 'BOSS', hp: 'Máu', atk: 'Công', def: 'Giáp', aspd: 'Tốc đánh', level: 'Cấp', max: 'Tối đa',
  upgrade: 'Nâng cấp', unlock: 'Mở khóa', unlocked: 'Đã mở', need_req: 'Mở node trước đó đã nha',
  cost: 'Giá', tier: 'Bậc', squad: 'Đội hình', select_squad: 'Chọn 3 đạo quân', synergy: 'Cộng hưởng', no_synergy: 'Chưa có cộng hưởng',
  evolve: 'Tiến hóa', count: 'Quân số', respawn: 'Hồi sinh', sec: 'giây',
  mc_hero: 'Thủ Lĩnh', speed_x: 'Tốc độ', auto: 'Tự động',
  language: 'Ngôn ngữ', sound: 'Âm thanh', reset: 'Xóa dữ liệu', reset_confirm: 'Xóa sạch tiến trình luôn hả?',
  lang_vi: 'Tiếng Việt', lang_en: 'English',
  stat_hp: 'Cương Thể', stat_atk: 'Lực Đòn', stat_def: 'Giáp Trụ',
  stat_hp_d: 'Tăng HP tối đa', stat_atk_d: 'Tăng Sức tấn công', stat_def_d: 'Tăng Giáp',
  branch_root: 'Khởi Nguyên', branch_A: 'Thống Soái', branch_B: 'Bản Thể', branch_C: 'Huyền Bí & AFK',
  skill_points: 'Đá Tinh Thạch', next_cost: 'Chi phí node kế', skill_tree_hint: 'Chạm vô node để coi, mở từ gốc lên ngọn nha',
  rate: 'Thu nhập', per_min: '/phút',
  drops: 'Rớt', gold_drop: 'Vàng', stone_drop: 'Đá', badge_drop: 'Huy hiệu',
  need_squad: 'Cần đủ 3 đạo quân', squad_saved: 'Đã lưu đội hình',
  arena: 'Arena', world: 'Thế giới', boss_of: 'Boss của',
  hint_1: 'Cứ để máy farm ở Arena lấy Vàng với Đá, đủ mạnh rồi thì đánh Boss nha.',
  offline_note: 'Lúc offline thì tính thu nhập theo tốc độ farm gần đây nhất nha.',
  credits: 'Đồ họa: Tiny Swords (Pixel Frog), Tiny RPG (Zerie), Super Pixel Effects Gigapack (unTied Games), Anvil RPG Icons (Ponk, CC BY 4.0), Achievement Icon Pack (GTORAVERSE), nhân vật LuizMelo (CC0)',
  rare_found: 'Nguyên liệu hiếm!', crit_gold: 'Vàng bạo kích!', holy_summon: 'Thánh Kỵ Sĩ!', divine: 'THẦN THỂ!', blackhole: 'HỐ ĐEN!',
  invuln: 'Bất tử!', shield: 'Khiên!', rage: 'Cuồng Nộ',
  reward: 'Phần thưởng', first_clear: 'Lần đầu vượt ải', boss_hp: 'Máu Boss', mc_down: 'Thủ Lĩnh ngã rồi, đang hồi sức...',
  hold_to_view: 'Chạm vô coi', buy: 'Mua', owned: 'Đang xài', swap: 'Đổi',
  world_map: 'Thế giới', map_locked_hint: 'Vượt hết Arena của bản đồ trước (tới Arena {n}) để mở nha.', map_next_goal: 'Còn {a} Arena nữa là mở: {n}', map_all_done: 'Đã mở hết các bản đồ!',
  tut_1: 'FARM: Thủ Lĩnh và quân tự đánh quái ở Arena đang chọn, rớt Vàng và Đá. Bạn cứ ngồi AFK hoặc coi bằng nút Chiến đấu.', tut_2: 'LÀNG: mỗi Arena có 1 làng. Nâng cấp công trình để ra Vàng/Đá mỗi giây, kể cả khi tắt game. Đây là nguồn thu chính, nhớ lãnh ở Hòm AFK.', tut_3: 'Đủ lực chiến thì đánh Boss để mở Arena mới, có thêm làng và quái mạnh hơn (rớt nhiều hơn).', tut_4: 'Kỹ năng và Quân đội giúp mạnh lên, mở thêm binh chủng. Chúc bạn chơi vui!', tut_tap: 'Chạm để qua', tut_skip: 'Bỏ qua',
  cloud_title: 'Lưu đám mây', cloud_off: 'Chưa bật. Dán link Web App Google Sheet vào src/config.ts (xem docs/CLOUD_SAVE.md).', cloud_code: 'Mã khôi phục', cloud_last: 'Lần lưu cuối', cloud_sync: 'Lưu lên ngay', cloud_restore: 'Khôi phục bằng mã', cloud_ok: 'Đã lưu lên đám mây!', cloud_err: 'Lưu lỗi, thử lại sau nha', cloud_prompt: 'Nhập mã khôi phục (dạng AFK-XXXX-XXXX):', cloud_notfound: 'Hổng tìm thấy mã này', cloud_confirm: 'Tiến độ trên máy này sẽ bị thay bằng bản đám mây. Làm luôn hôn?', cloud_bad: 'Dữ liệu đám mây hổng hợp lệ', cloud_newer: 'Đám mây có tiến độ mới hơn máy này!', cloud_use: 'Dùng bản đám mây',
  troop_locked: 'Chưa chiêu mộ', troop_locked_via: 'Mở node Cây kỹ năng:', go_skills: 'Tới Cây kỹ năng', troop_unlock_hint: 'Mở khóa binh chủng {n} — coi bên tab Quân đội nha.',
  tab_stats: 'Chỉ số', tab_troops: 'Quân đội',
  days: 'ngày', ready: 'Sẵn sàng', farm_eff: 'Hiệu suất farm',
  village: 'Làng', site_farm: 'Trang Trại', site_lumber: 'Xưởng Gỗ', site_crystal: 'Mỏ Tinh Thạch', site_forge: 'Lò Rèn',
  build: 'Xây dựng', village_income: 'Thu nhập làng', all_villages: 'Tất cả làng', per_sec: '/giây', buy_gold: 'Hổng đủ Vàng rồi',
  village_hint: 'Dân làng làm việc hoài hà, bạn offline cũng vậy.',
  gear: 'Trang bị', bag: 'Túi đồ', forge_tab: 'Rèn đồ', equip: 'Mặc', unequip: 'Cởi', salvage: 'Rã đồ', merge3: 'Ghép 3→1', merge_all: 'Ghép hết',
  bag_full: 'Túi đầy rồi, đồ mới tự rã ra Đá nha', no_items: 'Chưa có món đồ nào hết', worn: 'Đang mặc', got_item: 'Lượm được', forge_hint: 'Gom 3 món cùng loại, cùng độ hiếm là ghép ra 1 món hiếm hơn (đồ đang mặc hổng tính nha).',
  merge_none: 'Chưa đủ 3 món cùng loại', merged: 'Đã ghép', items_total: 'Đồ', equip_bonus: 'Cộng thêm từ trang bị', item_drop_hint: 'Đồ rớt từ Boss với Elite, còn quái thường thì rớt hiếm lắm.',
  quests: 'Nhiệm vụ', daily: 'Mỗi ngày', ach_tab: 'Thành tựu', login_tab: 'Điểm danh', claimed: 'Đã lãnh', all_done_bonus: 'Làm xong hết 5 nhiệm vụ', day: 'Ngày',
  login_title: 'Quà đăng nhập 7 ngày', login_hint: 'Vô game mỗi ngày lãnh quà nha. Nghỉ một bữa hổng mất tiến độ đâu.', login_claimed: 'Hôm nay lãnh rồi, mai ghé tiếp nha!',
  daily_reset: 'Làm mới lúc nửa đêm (00:00)', bronze: 'Đồng', silver: 'Bạc', gold_t: 'Vàng', ach_done: 'Hoàn tất', reward_item: 'Trang bị',
  q_kills: 'Hạ {n} con quái', q_bossTries: 'Khiêu chiến Boss {n} lần', q_villageUps: 'Nâng cấp công trình trong làng {n} lần', q_statUps: 'Nâng chỉ số Thủ Lĩnh {n} lần',
  q_chests: 'Lãnh Hòm AFK {n} lần', q_minutes: 'Chơi {n} phút', q_items: 'Kiếm {n} món trang bị',
  tree: 'Cây', tree_title: 'Cây nâng quân', tf_hp: 'Máu', tf_atk: 'Công', tf_def: 'Giáp', tf_aspd: 'Tốc đánh', tf_crit: 'Chí mạng', tf_heal: 'Hồi máu', tf_spirit: 'Sức Linh Hồn',
  tower: 'Tháp Vô Tận', tower_short: 'Tháp', floor: 'Tầng', best_floor: 'Kỷ lục', tries_left: 'Còn {n} lượt hôm nay', climb: 'Leo tháp nè', tower_end: 'Dừng leo', new_best: 'Kỷ lục mới!',
  tower_hint: 'Leo càng cao thưởng càng ngon lành. Chết là hết lượt luôn, nên ráng tính cho kỹ nha.', tower_mul: 'Quái tầng kế mạnh x{a} (5 tầng nữa: x{b}) so với Arena 1 — độ khó cố định, hổng đổi theo Arena.', tower_boss_hint: 'Cứ 10 tầng là gặp Boss, đánh thắng sẽ rớt trang bị Hiếm trở lên.',
  floors_cleared: 'Vượt được {n} tầng', no_tries: 'Hết lượt hôm nay rồi, mai leo tiếp nha',
  enhance: 'Cường hóa', enhance_max: 'Tối đa', enhance_need: 'Hổng đủ Đá hoặc Vàng để cường hóa',
  help_gold_t: 'Vàng', help_gold: 'Xài để nâng chỉ số Thủ Lĩnh, xây và nâng cấp công trình trong làng, tiến hóa quân, cường hóa trang bị. Kiếm từ làng, quái rớt, Boss và nhiệm vụ.',
  help_stones_t: 'Đá Tinh Thạch', help_stones: 'Xài để mở cây kỹ năng và cường hóa trang bị (cường hóa thì xài hoài hổng hết). Kiếm từ Mỏ Tinh Thạch trong làng, quái, Boss, rã đồ.',
  help_badges_t: 'Huy Hiệu Chiến Trận', help_badges: 'Chỉ dùng để tiến hóa quân và mở cây nâng quân. Rất hiếm: kiếm từ Boss, Tháp, giữ làng, Lò Rèn và nhiệm vụ.',
  help_power_t: 'Lực chiến', help_power: 'Sức mạnh tổng của bạn. Đạt mức khuyến nghị của Arena thì mới đủ sức đánh Boss.',
  tampered: 'Phát hiện dữ liệu bị chỉnh sửa ngoài game, đã khởi tạo lại tiến trình.',
  slot_weapon: 'Vũ khí', slot_helmet: 'Mũ', slot_armor: 'Giáp', slot_boots: 'Ủng', slot_ring: 'Nhẫn', slot_amulet: 'Bùa',
  rarity_0: 'Thường', rarity_1: 'Tốt', rarity_2: 'Hiếm', rarity_3: 'Sử Thi', rarity_4: 'Huyền Thoại',
  stat_atk_p: 'Công', stat_hp_p: 'Máu', stat_def_p: 'Giáp', stat_aspd_p: 'Tốc đánh', stat_crit_p: 'Chí mạng', stat_gold_p: 'Vàng', stat_stone_p: 'Đá Tinh Thạch', stat_troop_p: 'Chỉ số quân',
  ev_merchant: 'Thương nhân ghé {a} nè!',
  ev_raid: 'Địch đánh {a}! Ra giữ làng lẹ!',
  ev_pillage: 'Địch cướp mất {n} Vàng ở {a}!',
  shop_title: 'Thương nhân đường xa',
  offer_crate: 'Rương trang bị hiếm',
  offer_stones: 'Bao Đá Tinh Thạch',
  offer_buff: 'Bùa thu nhập làng +50% (30 phút)',
  defend: 'Giữ làng',
  raid: 'Địch tấn công',
  raid_won: 'Giữ được làng rồi, đã quá!',
  raid_lost: 'Thua rồi, làng bị cướp tiêu...',
  sold_out: 'Hết hàng',
  buff_on: 'Bùa đang chạy nè',
  bought: 'Mua xong rồi nha',
  merchant: 'Thương nhân',
  time_left: 'Còn',
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
  credits: 'Art: Tiny Swords (Pixel Frog), Tiny RPG (Zerie), Super Pixel Effects Gigapack (unTied Games), Anvil RPG Icons (Ponk, CC BY 4.0), Achievement Icon Pack (GTORAVERSE), characters by LuizMelo (CC0)',
  rare_found: 'Rare material!', crit_gold: 'Gold jackpot!', holy_summon: 'Holy Knights!', divine: 'DIVINE FORM!', blackhole: 'BLACK HOLE!',
  invuln: 'Invulnerable!', shield: 'Shield!', rage: 'Fury',
  reward: 'Rewards', first_clear: 'First clear', boss_hp: 'Boss HP', mc_down: 'Chieftain fell — recovering...',
  hold_to_view: 'Tap to view', buy: 'Buy', owned: 'In use', swap: 'Swap',
  world_map: 'World', map_locked_hint: 'Clear every Arena of the previous map (up to Arena {n}) to unlock it.', map_next_goal: '{a} more Arenas to unlock: {n}', map_all_done: 'All maps unlocked!',
  tut_1: 'FARM: your Chieftain and army fight monsters on the selected Arena on their own, dropping Gold and Stones. Just sit back (AFK) or watch with the Battle button.', tut_2: 'VILLAGE: every Arena has one. Upgrade its buildings to earn Gold/Stones every second, even while the game is closed. This is your main income — claim it from the AFK Chest.', tut_3: 'Strong enough? Beat the Boss to unlock a new Arena: another village and tougher monsters (with bigger drops).', tut_4: 'Skills and Army make you stronger and unlock more troop types. Have fun!', tut_tap: 'Tap to continue', tut_skip: 'Skip',
  cloud_title: 'Cloud save', cloud_off: 'Not enabled. Paste your Google Sheet Web App URL into src/config.ts (see docs/CLOUD_SAVE.md).', cloud_code: 'Recovery code', cloud_last: 'Last saved', cloud_sync: 'Save now', cloud_restore: 'Restore with code', cloud_ok: 'Saved to the cloud!', cloud_err: 'Save failed, try again later', cloud_prompt: 'Enter your recovery code (AFK-XXXX-XXXX):', cloud_notfound: 'Code not found', cloud_confirm: 'Progress on this device will be replaced by the cloud copy. Continue?', cloud_bad: 'Cloud data is invalid', cloud_newer: 'The cloud has newer progress than this device!', cloud_use: 'Use cloud copy',
  troop_locked: 'Not recruited', troop_locked_via: 'Unlock the Skill Tree node:', go_skills: 'Open Skill Tree', troop_unlock_hint: 'Unlocks the {n} troop type — pick it in the Army tab.',
  tab_stats: 'Stats', tab_troops: 'Army',
  days: 'days', ready: 'Ready', farm_eff: 'Farm efficiency',
  village: 'Village', site_farm: 'Farm', site_lumber: 'Lumber Camp', site_crystal: 'Crystal Mine', site_forge: 'Forge',
  build: 'Build', village_income: 'Village income', all_villages: 'All villages', per_sec: '/s', buy_gold: 'Not enough Gold',
  village_hint: 'Villagers keep producing even while you are offline.',
  gear: 'Gear', bag: 'Bag', forge_tab: 'Forge', equip: 'Equip', unequip: 'Unequip', salvage: 'Salvage', merge3: 'Merge 3→1', merge_all: 'Merge all',
  bag_full: 'Bag full — new items auto-salvage into Stones', no_items: 'No gear yet', worn: 'Equipped', got_item: 'Got', forge_hint: 'Merge 3 items of the same slot and rarity into one of higher rarity (equipped items excluded).',
  merge_none: 'Need 3 of the same slot', merged: 'Merged', items_total: 'Items', equip_bonus: 'Bonus from gear', item_drop_hint: 'Gear drops from Bosses, Elites and (rarely) normal monsters.',
  quests: 'Quests', daily: 'Daily', ach_tab: 'Achievements', login_tab: 'Login', claimed: 'Claimed', all_done_bonus: 'Complete all 5 quests', day: 'Day',
  login_title: '7-day login rewards', login_hint: 'Log in every day for rewards. Missing a day does not reset progress.', login_claimed: 'Claimed today — see you tomorrow!',
  daily_reset: 'Resets at 00:00', bronze: 'Bronze', silver: 'Silver', gold_t: 'Gold', ach_done: 'Completed', reward_item: 'Gear',
  q_kills: 'Defeat {n} monsters', q_bossTries: 'Challenge a Boss {n} time(s)', q_villageUps: 'Upgrade village buildings {n} time(s)', q_statUps: 'Upgrade Chieftain stats {n} time(s)',
  q_chests: 'Collect the AFK Chest {n} time(s)', q_minutes: 'Play for {n} minutes', q_items: 'Obtain {n} gear item(s)',
  tree: 'Tree', tree_title: 'Troop upgrade tree', tf_hp: 'HP', tf_atk: 'ATK', tf_def: 'DEF', tf_aspd: 'Atk Speed', tf_crit: 'Crit', tf_heal: 'Healing', tf_spirit: 'Spirit power',
  tower: 'Endless Tower', tower_short: 'Tower', floor: 'Floor', best_floor: 'Best', tries_left: '{n} climbs left today', climb: 'Climb', tower_end: 'Stop climbing', new_best: 'New record!',
  tower_hint: 'The higher you climb the better the loot. Dying ends the run, so plan carefully.', tower_mul: 'Next-floor monsters are x{a} (x{b} in 5 floors) of Arena 1 stats — a fixed difficulty that never scales with Arena.', tower_boss_hint: 'A Boss waits every 10 floors and drops Rare+ gear.',
  floors_cleared: 'Cleared {n} floors', no_tries: 'No climbs left today — come back tomorrow',
  enhance: 'Enhance', enhance_max: 'Max', enhance_need: 'Not enough Stones or Gold to enhance',
  help_gold_t: 'Gold', help_gold: 'Spend on Chieftain stats, building and upgrading village sites, evolving troops and enhancing gear. Earned from villages, monster drops, Bosses and quests.',
  help_stones_t: 'Crystal Stones', help_stones: 'Spend on the skill tree and on gear enhancement (a bottomless sink). Earned from Crystal Mines, monsters, Bosses and salvaging gear.',
  help_badges_t: 'Battle Badges', help_badges: 'Used ONLY to evolve troops and unlock troop upgrade trees. Very scarce: from Bosses, the Tower, defending villages, Forges and quests.',
  help_power_t: 'Power', help_power: 'Your overall strength. Reach an Arena recommended power before challenging its Boss.',
  tampered: 'Save data was modified outside the game; progress has been reset.',
  slot_weapon: 'Weapon', slot_helmet: 'Helmet', slot_armor: 'Armor', slot_boots: 'Boots', slot_ring: 'Ring', slot_amulet: 'Amulet',
  rarity_0: 'Common', rarity_1: 'Good', rarity_2: 'Rare', rarity_3: 'Epic', rarity_4: 'Legendary',
  stat_atk_p: 'ATK', stat_hp_p: 'HP', stat_def_p: 'DEF', stat_aspd_p: 'Atk Speed', stat_crit_p: 'Crit', stat_gold_p: 'Gold', stat_stone_p: 'Crystal Stones', stat_troop_p: 'Troop stats',
  ev_merchant: 'A merchant is visiting {a}!', ev_raid: '{a} is under attack! Go defend it!', ev_pillage: 'Raiders stole {n} Gold from {a}!',
  shop_title: 'Travelling merchant', offer_crate: 'Rare gear crate', offer_stones: 'Bag of Crystal Stones', offer_buff: 'Village income +50% charm (30 min)',
  defend: 'Defend', raid: 'Raid', raid_won: 'Village saved!', raid_lost: 'Defeated... the village was looted.', sold_out: 'Sold out', buff_on: 'Charm active', bought: 'Purchased', merchant: 'Merchant', time_left: 'Left',
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
  47: ['Recruit: Pikemen', 'UNLOCKS Pikeman troops: a second frontline that pierces 2 targets.'],
  48: ['Recruit: Spear Hunters', 'UNLOCKS Spear Hunters: mid-line troops whose spears pierce many foes.'],
  49: ['Recruit: Paladins', 'UNLOCKS Paladins: support frontline with a healing aura for the squad.'],
  50: ['War Drums', 'Every 20s, war drums give the whole army +30% attack speed for 6s.'],
  51: ['Reserve Supplies', 'Fallen troops respawn twice as fast and return with a Shield worth 35% HP.'],
  52: ['Elite Conscription', '+1 troop count for EVERY troop type on the field.'],
  53: ['All-Out Assault', 'Every 25s: all fallen troops rise instantly and the army gains +40% attack for 8s.'],
  54: ['Recruit: Rogues', 'UNLOCKS Shadow Rogues: stealth, blink behind the enemy line and assassinate ranged foes.'],
  55: ['Bloodlust', 'Each kill heals the Chieftain for 3% max HP.'],
  56: ['Blade Storm', 'Every 6 hits the Chieftain spins, slashing all nearby foes for 2x attack.'],
  57: ['Phoenix Rebirth', 'Once per battle: a lethal hit revives you at 50% HP with 2s of invulnerability.'],
  58: ['Unbroken Will', 'Each hit shaves 0.8s off War Cry cooldown; War Cry stuns foes for 1.5s.'],
  59: ['Recruit: Wizards', 'UNLOCKS Elemental Wizards: channel for 1s, then hurl fire/frost into the biggest crowd.'],
  60: ['Recruit: Summoners', 'UNLOCKS Summoners: every 7s they call 2 Spirits to fight for you.'],
  61: ['Eternal Treasury', 'AFK chest stores up to 24 hours; villages produce 20% more Gold.'],
  62: ['Treasure Hunter', 'Equipment drop rate x2; every Boss kill drops one extra item.'],
  63: ['Glacial Blizzard', 'Every 14s a blizzard freezes all normal monsters for 2s (Bosses are slowed).'],
  64: ['Doom Meteor', 'Every 16s a meteor deals 3x Chieftain attack to all foes and sets them ablaze.'],
  46: ['Void Rift', 'Summon a Black Hole at battle start that pulls monsters and deals magic damage; +25% AFK yield permanently.'],
};

export function t(key: string, p?: Record<string, string | number>): string {
  const d = lang === 'vi' ? VI : EN;
  let s = d[key] ?? VI[key] ?? key;
  if (p) for (const k of Object.keys(p)) s = s.replace(`{${k}}`, String(p[k]));
  return s;
}

export function specialText(id: string): [string, string] {
  const sp = TROOP_SPECIAL[id as TroopId];
  return lang === 'vi' ? sp.vi : sp.en;
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
  paladin: ['Paladin', 'Frontline · Support', 'Holy aura: heals nearby allies for 2% max HP every 3 seconds.'],
  huntress: ['Spear Hunter', 'Mid · Piercing damage', 'Throws piercing spears through 2 targets, high crit chance.'],
  summoner: ['Summoner', 'Backline · Summoning', 'Summons 2 fighting Spirits every 7 seconds (they last 12 seconds).'],
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
  crusade: ['Holy Crusade', '+15% HP for Knights & Paladins · Paladin aura heals 3% instead of 2%.', 'Long boss fights, heavy area damage.'],
  hunt: ['The Hunt', '+20% crit for ranged units & Rogues · spears pierce one more target.', 'Stages with long lines of weak monsters.'],
  spirits: ['Undying Spirits', 'Spirits are 30% stronger and last 18 seconds.', 'Long stages that need extra meat shields.'],
};
export function synText(id: string, vi: { name: string; desc: string; best: string }) {
  if (lang === 'vi') return vi;
  const e = SYN_EN[id];
  return e ? { name: e[0], desc: e[1], best: e[2] } : vi;
}
