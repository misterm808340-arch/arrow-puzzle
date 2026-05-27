import { GameSettings, LevelProgress } from './types';

const STORAGE_KEYS = {
  SETTINGS: 'arrow_puzzle_settings',
  LEVEL_PROGRESS: 'arrow_puzzle_level_progress',
  CURRENT_LEVEL: 'arrow_puzzle_current_level',
  DAILY_COMPLETED: 'arrow_puzzle_daily_completed',
  TOTAL_STARS: 'arrow_puzzle_total_stars',
};

const DEFAULT_SETTINGS: GameSettings = {
  sound: true,
  music: true,
  vibration: true,
  removeAds: false,
};

export function loadSettings(): GameSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: GameSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch {}
}

export function loadLevelProgress(): Record<number, LevelProgress> {
  if (typeof window === 'undefined') return {};
  try {
    const data = localStorage.getItem(STORAGE_KEYS.LEVEL_PROGRESS);
    if (!data) return { 1: { unlocked: true, stars: 0, bestLives: 0 } };
    return JSON.parse(data);
  } catch {
    return { 1: { unlocked: true, stars: 0, bestLives: 0 } };
  }
}

export function saveLevelProgress(progress: Record<number, LevelProgress>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.LEVEL_PROGRESS, JSON.stringify(progress));
  } catch {}
}

export function updateLevelResult(
  levelNum: number,
  livesRemaining: number,
  maxLives: number
): Record<number, LevelProgress> {
  const progress = loadLevelProgress();
  const stars = livesRemaining >= maxLives ? 3 : livesRemaining >= 2 ? 2 : 1;

  if (!progress[levelNum]) {
    progress[levelNum] = { unlocked: true, stars: 0, bestLives: 0 };
  }

  if (stars > progress[levelNum].stars) {
    progress[levelNum].stars = stars;
  }
  if (livesRemaining > progress[levelNum].bestLives) {
    progress[levelNum].bestLives = livesRemaining;
  }

  // Unlock next level
  const nextLevel = levelNum + 1;
  if (!progress[nextLevel]) {
    progress[nextLevel] = { unlocked: true, stars: 0, bestLives: 0 };
  } else {
    progress[nextLevel].unlocked = true;
  }

  saveLevelProgress(progress);
  return progress;
}

export function loadDailyCompleted(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(STORAGE_KEYS.DAILY_COMPLETED) || '';
  } catch {
    return '';
  }
}

export function saveDailyCompleted(): void {
  if (typeof window === 'undefined') return;
  try {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(STORAGE_KEYS.DAILY_COMPLETED, today);
  } catch {}
}

export function getTotalStars(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const cached = localStorage.getItem(STORAGE_KEYS.TOTAL_STARS);
    if (cached) return parseInt(cached, 10);
    const progress = loadLevelProgress();
    const total = Object.values(progress).reduce((sum, p) => sum + p.stars, 0);
    localStorage.setItem(STORAGE_KEYS.TOTAL_STARS, total.toString());
    return total;
  } catch {
    return 0;
  }
}

export function updateTotalStars(): number {
  const progress = loadLevelProgress();
  const total = Object.values(progress).reduce((sum, p) => sum + p.stars, 0);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.TOTAL_STARS, total.toString());
    } catch {}
  }
  return total;
}
