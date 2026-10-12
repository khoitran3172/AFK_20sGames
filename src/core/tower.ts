// Tháp vô tận: mỗi ngày 3 lượt leo; boss mỗi 10 tầng; thưởng theo số tầng vượt.
import { Item, rollItem } from '../data/items';
import { Save } from './state';
import { reward, today } from './progress';

export const TOWER_TRIES = 3;

export function ensureTower(S: Save) {
  const d = today();
  if (S.tower.day !== d) { S.tower.day = d; S.tower.used = 0; }
  return S.tower;
}
export const triesLeft = (S: Save) => Math.max(0, TOWER_TRIES - ensureTower(S).used);

export interface TowerReward { gold: number; stones: number; badges: number; items: Item[]; newBest: boolean }

/** Tổng thưởng cho lượt leo vượt `cleared` tầng */
export function towerRewards(S: Save, cleared: number): TowerReward {
  const prev = S.tower.best;
  let gold = 0, stones = 0, badges = 0;
  const items: Item[] = [];
  for (let f = 1; f <= cleared; f++) {
    const r = reward(S, 1.2 + f * 0.15, 0.8 + f * 0.1, f % 5 === 0 ? 2 : 0);
    gold += r.gold; stones += r.stones; badges += r.badges;
    if (f % 10 === 0) { items.push(rollItem(S.unlocked, 2, 2)); badges += 5; }
  }
  const newBest = cleared > prev;
  if (newBest) { // thưởng lần đầu chạm tầng mới
    const r = reward(S, 0, 3 * (cleared - prev), 0);
    stones += r.stones;
  }
  return { gold, stones, badges, items, newBest };
}

export function nextBossFloor(cleared: number) { return (Math.floor(cleared / 10) + 1) * 10; }
