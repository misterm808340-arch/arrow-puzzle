'use client';

import { useEffect } from 'react';
import { useGameStore } from '@/game/store';
import { isNativeApp, showInterstitialAd } from '@/game/admob';

export default function InterstitialAdScreen() {
  const dismissInterstitial = useGameStore((s) => s.dismissInterstitial);
  const removeAds = useGameStore((s) => s.settings.removeAds);

  useEffect(() => {
    // If user removed ads, skip interstitial
    if (removeAds) {
      dismissInterstitial();
      return;
    }

    if (isNativeApp()) {
      showInterstitialAd().then(() => {
        dismissInterstitial();
      });
    } else {
      // Web: no interstitial, dismiss immediately
      dismissInterstitial();
    }
  }, [dismissInterstitial, removeAds]);

  return null;
}
