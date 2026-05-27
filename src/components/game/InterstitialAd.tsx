'use client';

import { useEffect } from 'react';
import { useGameStore } from '@/game/store';
import { InterstitialAd } from './AdBanner';
import { isNativeApp, showInterstitialAd } from '@/game/admob';

export default function InterstitialAdScreen() {
  const dismissInterstitial = useGameStore((s) => s.dismissInterstitial);

  useEffect(() => {
    if (isNativeApp()) {
      // Show real interstitial ad on native
      showInterstitialAd().then(() => {
        dismissInterstitial();
      });
    }
  }, [dismissInterstitial]);

  // In native app, interstitial is shown by AdMob SDK
  if (isNativeApp()) {
    return null;
  }

  // Fallback for web/PWA
  return (
    <div className="fixed inset-0 z-[100]">
      <InterstitialAd onClose={dismissInterstitial} />
    </div>
  );
}
