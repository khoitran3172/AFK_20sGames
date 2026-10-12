import '@fontsource/vt323/latin-400.css';
import '@fontsource/vt323/latin-ext-400.css';
import '@fontsource/vt323/vietnamese-400.css';
import '@fontsource/baloo-2/latin-600.css';
import '@fontsource/baloo-2/latin-ext-600.css';
import '@fontsource/baloo-2/vietnamese-600.css';
import '@fontsource/pixelify-sans/latin-400.css';
import '@fontsource/pixelify-sans/latin-ext-400.css';
import '@fontsource/pixelify-sans/latin-700.css';
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { WorldScene } from './scenes/WorldScene';
import { BattleScene } from './scenes/BattleScene';
import { SkillScene } from './scenes/SkillScene';
import { ArmyScene } from './scenes/ArmyScene';
import { SettingsScene } from './scenes/SettingsScene';
import { ResultScene } from './scenes/ResultScene';
import { VillageScene } from './scenes/VillageScene';
import { ItemsScene } from './scenes/ItemsScene';
import { QuestScene } from './scenes/QuestScene';
import { TowerScene } from './scenes/TowerScene';
import { Farm } from './core/farm';
import { getSave } from './core/state';
import { rollItem } from './data/items';
import { installCursors } from './ui/cursor';
import { startCloud } from './core/cloud';

export const W = 1280;
export const H = 720;

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: W,
  height: H,
  backgroundColor: '#12202a',
  pixelArt: true,
  roundPixels: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, WorldScene, VillageScene, ItemsScene, QuestScene, TowerScene, BattleScene, SkillScene, ArmyScene, SettingsScene, ResultScene],
  input: { activePointers: 2 },
  fps: { forceSetTimeOut: location.search.includes('debug') },
});

installCursors(game.canvas);
startCloud();
// Trình duyệt nhúng (Facebook...) đổi kích thước khung khi cuộn/hiện thanh công cụ: ép Phaser tính lại tỉ lệ
const refit = () => { try { game.scale.refresh(); } catch { /* ignore */ } };
window.addEventListener('resize', refit);
window.addEventListener('orientationchange', () => setTimeout(refit, 250));
window.visualViewport?.addEventListener('resize', refit);
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false }); // chặn kéo-để-tải-lại / cuộn trang
if (location.search.includes('debug')) (window as unknown as { __game: Phaser.Game }).__game = game;
if (location.search.includes('debug')) (window as unknown as Record<string, unknown>).__dbg = { Farm, getSave, rollItem };
