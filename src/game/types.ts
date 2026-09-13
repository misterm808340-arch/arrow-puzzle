export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface ArrowData {
  row: number;
  col: number;
  direction: Direction;
  id: string;
}

export interface LevelData {
  level: number;
  grid_size: number;
  arrows: { row: number; col: number; direction: Direction }[];
}

export type Screen =
  | 'home'
  | 'levelSelect'
  | 'game'
  | 'levelComplete'
  | 'gameOver'
  | 'settings';

export interface GameSettings {
  sound: boolean;
  music: boolean;
  vibration: boolean;
  removeAds: boolean;
}

export interface LevelProgress {
  unlocked: boolean;
  stars: number; // 0 = not completed, 1-3 = stars earned
  bestLives: number;
}

export interface GameState {
  currentScreen: Screen;
  currentLevel: number;
  grid: (ArrowData | null)[][];
  arrowsRemaining: number;
  lives: number;
  maxLives: number;
  hints: number;
  maxHints: number;
  combo: number;
  lastValidRemoval: boolean;
  highlightedArrow: string | null;
  animatingArrows: Set<string>;
  invalidArrow: string | null;
  showCombo: boolean;
  comboText: string;
  isDailyChallenge: boolean;
}

export const DIRECTION_COLORS: Record<Direction, string> = {
  UP: '#4A90D9',     // Blue
  DOWN: '#F5A623',   // Orange
  LEFT: '#7ED321',   // Green
  RIGHT: '#D0021B',  // Red
};

export const DIRECTION_BG: Record<Direction, string> = {
  UP: '#E8F0FE',
  DOWN: '#FEF3E2',
  LEFT: '#E8F8D4',
  RIGHT: '#FDE8EA',
};

export const DIRECTION_EMOJI: Record<Direction, string> = {
  UP: '↑',
  DOWN: '↓',
  LEFT: '←',
  RIGHT: '→',
};
