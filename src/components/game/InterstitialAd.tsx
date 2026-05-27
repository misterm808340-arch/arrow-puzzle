'use client';

import { motion } from 'framer-motion';
import { InterstitialAd } from './AdBanner';
import { useGameStore } from '@/game/store';

export default function InterstitialAdScreen() {
  const dismissInterstitial = useGameStore((s) => s.dismissInterstitial);

  return (
    <div className="fixed inset-0 z-[100]">
      <InterstitialAd onClose={dismissInterstitial} />
    </div>
  );
}
