'use client';

import { useGameStore } from '@/game/store';
import HomeScreen from '@/components/game/HomeScreen';
import LevelSelect from '@/components/game/LevelSelect';
import GameScreen from '@/components/game/GameScreen';
import LevelCompleteScreen from '@/components/game/LevelCompleteScreen';
import GameOverScreen from '@/components/game/GameOverScreen';
import SettingsScreen from '@/components/game/SettingsScreen';
import InterstitialAdScreen from '@/components/game/InterstitialAd';
import { useEffect } from 'react';

export default function Home() {
  const currentScreen = useGameStore((s) => s.currentScreen);
  const showInterstitial = useGameStore((s) => s.showInterstitial);

  // Load progress on mount
  useEffect(() => {
    // Rehydrate from localStorage
    const store = useGameStore.getState();
    const settings = store.settings;
    // Force settings reload
    try {
      const saved = localStorage.getItem('arrow_puzzle_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        store.updateSettings(parsed);
      }
    } catch {}
  }, []);

  return (
    <main className="min-h-screen max-h-screen overflow-hidden">
      {currentScreen === 'home' && <HomeScreen />}
      {currentScreen === 'levelSelect' && <LevelSelect />}
      {currentScreen === 'game' && <GameScreen />}
      {currentScreen === 'levelComplete' && <LevelCompleteScreen />}
      {currentScreen === 'gameOver' && <GameOverScreen />}
      {currentScreen === 'settings' && <SettingsScreen />}

      {/* Interstitial ad overlay */}
      {showInterstitial && <InterstitialAdScreen />}
    </main>
  );
}
