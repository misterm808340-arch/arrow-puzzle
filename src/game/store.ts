import { create } from 'zustand';
import { ArrowData, Direction, GameSettings, LevelProgress, Screen } from './types';
import { createGridFromLevel, generateLevel, generateDailyChallenge, getValidArrows, isValidRemoval, removeArrow } from './logic';
import { loadSettings, saveSettings, loadLevelProgress, updateLevelResult, saveDailyCompleted, loadDailyCompleted, updateTotalStars } from './storage';
import { playTapValid, playTapInvalid, playLevelComplete, playCombo, playHint, playLoseLife, resumeAudioContext } from './sounds';

interface GameStore {
  // Screen state
  currentScreen: Screen;
  setScreen: (screen: Screen) => void;

  // Level data
  currentLevel: number;
  grid: (ArrowData | null)[][];
  gridSize: number;
  arrowsRemaining: number;
  totalArrows: number;

  // Game state
  lives: number;
  maxLives: number;
  hints: number;
  maxHints: number;
  combo: number;
  gameOver: boolean;
  levelComplete: boolean;

  // UI state
  highlightedArrow: string | null;
  animatingArrows: Map<string, Direction>;
  invalidArrow: string | null;
  invalidMessage: string;
  showCombo: boolean;
  comboText: string;

  // Settings
  settings: GameSettings;
  updateSettings: (settings: Partial<GameSettings>) => void;

  // Progress
  levelProgress: Record<number, LevelProgress>;
  totalStars: number;
  dailyCompleted: string;

  // Ad state
  showInterstitial: boolean;
  levelsCompleted: number;

  // Actions
  startLevel: (levelNum: number) => void;
  startDailyChallenge: () => void;
  tapArrow: (row: number, col: number) => void;
  useHint: () => void;
  retryLevel: () => void;
  nextLevel: () => void;
  finishAnimation: (id: string) => void;
  clearInvalid: () => void;
  clearCombo: () => void;
  clearHighlight: () => void;
  dismissInterstitial: () => void;
  watchAdForLife: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  currentScreen: 'home',
  setScreen: (screen) => {
    if (get().settings.sound) resumeAudioContext();
    set({ currentScreen: screen });
  },

  currentLevel: 1,
  grid: [],
  gridSize: 3,
  arrowsRemaining: 0,
  totalArrows: 0,

  lives: 3,
  maxLives: 3,
  hints: 3,
  maxHints: 3,
  combo: 0,
  gameOver: false,
  levelComplete: false,

  highlightedArrow: null,
  animatingArrows: new Map(),
  invalidArrow: null,
  invalidMessage: '',
  showCombo: false,
  comboText: '',

  settings: (typeof window !== 'undefined') ? loadSettings() : { sound: true, music: true, vibration: true, removeAds: false },
  updateSettings: (partial) => {
    const newSettings = { ...get().settings, ...partial };
    saveSettings(newSettings);
    set({ settings: newSettings });
  },

  levelProgress: (typeof window !== 'undefined') ? loadLevelProgress() : {},
  totalStars: (typeof window !== 'undefined') ? updateTotalStars() : 0,
  dailyCompleted: (typeof window !== 'undefined') ? loadDailyCompleted() : '',

  showInterstitial: false,
  levelsCompleted: 0,

  startLevel: (levelNum) => {
    const level = generateLevel(levelNum);
    const grid = createGridFromLevel(level);
    const arrowCount = level.arrows.length;

    if (get().settings.sound) resumeAudioContext();

    set({
      currentLevel: levelNum,
      grid,
      gridSize: level.grid_size,
      arrowsRemaining: arrowCount,
      totalArrows: arrowCount,
      lives: 3,
      maxLives: 3,
      hints: 3,
      maxHints: 3,
      combo: 0,
      gameOver: false,
      levelComplete: false,
      highlightedArrow: null,
      animatingArrows: new Map(),
      invalidArrow: null,
      invalidMessage: '',
      showCombo: false,
      comboText: '',
      currentScreen: 'game',
    });
  },

  startDailyChallenge: () => {
    const level = generateDailyChallenge();
    const grid = createGridFromLevel(level);
    const arrowCount = level.arrows.length;

    if (get().settings.sound) resumeAudioContext();

    set({
      currentLevel: -1,
      grid,
      gridSize: level.grid_size,
      arrowsRemaining: arrowCount,
      totalArrows: arrowCount,
      lives: 3,
      maxLives: 3,
      hints: 3,
      maxHints: 3,
      combo: 0,
      gameOver: false,
      levelComplete: false,
      highlightedArrow: null,
      animatingArrows: new Map(),
      invalidArrow: null,
      invalidMessage: '',
      showCombo: false,
      comboText: '',
      currentScreen: 'game',
    });
  },

  tapArrow: (row, col) => {
    const state = get();
    if (state.gameOver || state.levelComplete) return;

    const arrow = state.grid[row][col];
    if (!arrow) return;

    // Don't allow tapping animating arrows
    if (state.animatingArrows.has(arrow.id)) return;

    if (isValidRemoval(state.grid, arrow)) {
      // Valid removal
      const newGrid = removeArrow(state.grid, arrow);
      const newRemaining = state.arrowsRemaining - 1;
      const newCombo = state.combo + 1;

      const newAnimating = new Map(state.animatingArrows);
      newAnimating.set(arrow.id, arrow.direction);

      // Sound
      if (state.settings.sound) {
        if (newCombo >= 3) {
          playCombo();
        } else {
          playTapValid();
        }
      }

      // Vibration
      if (state.settings.vibration && navigator.vibrate) {
        navigator.vibrate(30);
      }

      // Combo text
      let showCombo = false;
      let comboText = '';
      if (newCombo >= 3) {
        showCombo = true;
        comboText = `COMBO x${newCombo}!`;
      }

      set({
        grid: newGrid,
        arrowsRemaining: newRemaining,
        combo: newCombo,
        animatingArrows: newAnimating,
        highlightedArrow: null,
        showCombo,
        comboText,
      });

      // Check if level complete
      if (newRemaining === 0) {
        setTimeout(() => {
          if (state.settings.sound) playLevelComplete();
          if (state.settings.vibration && navigator.vibrate) {
            navigator.vibrate([50, 50, 50, 50, 100]);
          }

          const currentLevel = get().currentLevel;
          const currentLives = get().lives;
          const maxLives = get().maxLives;

          // Update progress
          if (currentLevel > 0) {
            const progress = updateLevelResult(currentLevel, currentLives, maxLives);
            const totalStars = updateTotalStars();
            const levelsCompleted = get().levelsCompleted + 1;
            const showInterstitial = levelsCompleted % 3 === 0 && !get().settings.removeAds;
            set({
              levelComplete: true,
              levelProgress: progress,
              totalStars,
              levelsCompleted,
              showInterstitial,
              currentScreen: showInterstitial ? get().currentScreen : 'levelComplete',
            });
            if (!showInterstitial) {
              set({ currentScreen: 'levelComplete' });
            }
          } else {
            // Daily challenge
            saveDailyCompleted();
            set({
              levelComplete: true,
              dailyCompleted: new Date().toISOString().split('T')[0],
              currentScreen: 'levelComplete',
            });
          }
        }, 400);
      }
    } else {
      // Invalid removal
      const newLives = state.lives - 1;
      const newCombo = 0;

      // Sound
      if (state.settings.sound) {
        playTapInvalid();
        playLoseLife();
      }

      // Vibration
      if (state.settings.vibration && navigator.vibrate) {
        navigator.vibrate([50, 100, 50]);
      }

      set({
        lives: newLives,
        combo: newCombo,
        invalidArrow: arrow.id,
        invalidMessage: 'Path blocked!',
        showCombo: false,
        comboText: '',
      });

      // Clear invalid feedback after 1 second
      setTimeout(() => {
        if (get().invalidArrow === arrow.id) {
          set({ invalidArrow: null, invalidMessage: '' });
        }
      }, 800);

      // Check game over
      if (newLives <= 0) {
        setTimeout(() => {
          set({
            gameOver: true,
            currentScreen: 'gameOver',
          });
        }, 600);
      }
    }
  },

  useHint: () => {
    const state = get();
    if (state.hints <= 0 || state.gameOver || state.levelComplete) return;

    const validArrows = getValidArrows(state.grid);
    if (validArrows.length === 0) return;

    // Pick a random valid arrow
    const hintArrow = validArrows[Math.floor(Math.random() * validArrows.length)];

    if (state.settings.sound) playHint();
    if (state.settings.vibration && navigator.vibrate) navigator.vibrate(20);

    set({
      hints: state.hints - 1,
      highlightedArrow: hintArrow.id,
    });

    // Clear highlight after 2 seconds
    setTimeout(() => {
      if (get().highlightedArrow === hintArrow.id) {
        set({ highlightedArrow: null });
      }
    }, 2000);
  },

  retryLevel: () => {
    const level = get().currentLevel;
    if (level > 0) {
      get().startLevel(level);
    } else {
      get().startDailyChallenge();
    }
  },

  nextLevel: () => {
    const next = get().currentLevel + 1;
    get().startLevel(next);
  },

  finishAnimation: (id) => {
    const newAnimating = new Map(get().animatingArrows);
    newAnimating.delete(id);
    set({ animatingArrows: newAnimating });
  },

  clearInvalid: () => set({ invalidArrow: null, invalidMessage: '' }),
  clearCombo: () => set({ showCombo: false, comboText: '' }),
  clearHighlight: () => set({ highlightedArrow: null }),

  dismissInterstitial: () => {
    set({ showInterstitial: false, currentScreen: 'levelComplete' });
  },

  watchAdForLife: () => {
    // Real AdMob rewarded ad integration
    const state = get();
    if (state.lives <= 0) {
      // Check if running natively - if so, the RewardedAdPlaceholder component
      // handles the real AdMob call. If web, it simulates the ad.
      set({ lives: 1, gameOver: false, currentScreen: 'game' });
    }
  },
}));
