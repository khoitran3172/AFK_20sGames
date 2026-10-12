import '@fontsource/vt323/latin-400.css';
import '@fontsource/vt323/latin-ext-400.css';
import '@fontsource/vt323/vietnamese-400.css';
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
import { Farm } from './core/farm';
import { getSave } from './core/state';

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
  scene: [BootScene, WorldScene, BattleScene, SkillScene, ArmyScene, SettingsScene, ResultScene],
  input: { activePointers: 2 },
  fps: { forceSetTimeOut: location.search.includes('debug') },
});

(window as unknown as { __game: Phaser.Game }).__game = game;
if (location.search.includes('debug')) (window as unknown as Record<string, unknown>).__dbg = { Farm, getSave };
