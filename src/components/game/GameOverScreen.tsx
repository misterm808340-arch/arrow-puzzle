'use client';

import { motion } from 'framer-motion';
import { useGameStore } from '@/game/store';
import { Heart, RotateCcw, Play, Home } from 'lucide-react';
import { useState } from 'react';
import { RewardedAdPlaceholder } from './AdBanner';

export default function GameOverScreen() {
  const retryLevel = useGameStore((s) => s.retryLevel);
  const setScreen = useGameStore((s) => s.setScreen);
  const watchAdForLife = useGameStore((s) => s.watchAdForLife);
  const currentLevel = useGameStore((s) => s.currentLevel);
  const settings = useGameStore((s) => s.settings);

  const [showRewardedAd, setShowRewardedAd] = useState(false);

  const handleWatchAd = () => {
    setShowRewardedAd(false);
    // Simulate ad completion
    setTimeout(() => {
      watchAdForLife();
    }, 500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-8"
      style={{ background: 'linear-gradient(180deg, #FDE8EA 0%, #F5F5F5 100%)' }}
    >
      {/* Broken heart animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 1] }}
        transition={{ type: 'spring', damping: 10, stiffness: 200 }}
        className="mb-6"
      >
        <div className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-lg bg-red-50">
          <motion.div
            animate={{ rotate: [0, -5, 5, -5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
          >
            <Heart size={48} className="text-red-400" />
          </motion.div>
        </div>
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-4xl font-black text-gray-800 mb-2"
      >
        Out of Lives
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-gray-500 mb-8 text-center text-lg"
      >
        {currentLevel === -1 ? 'The daily challenge got you!' : `Level ${currentLevel} was tricky!`}
      </motion.p>

      {/* Action buttons */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col gap-3 w-full max-w-xs"
      >
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={retryLevel}
          className="w-full py-4 px-6 rounded-2xl text-white font-bold text-lg shadow-lg flex items-center justify-center gap-3"
          style={{ background: 'linear-gradient(135deg, #4A90D9 0%, #357ABD 100%)' }}
        >
          <RotateCcw size={22} />
          Try Again
        </motion.button>

        {!settings.removeAds && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowRewardedAd(true)}
            className="w-full py-4 px-6 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 border-2 border-yellow-400"
            style={{ background: 'linear-gradient(135deg, #FEF3E2 0%, #FDE8EA 100%)', color: '#F5A623' }}
          >
            <Play size={20} fill="#F5A623" />
            Watch Ad for +1 Life
          </motion.button>
        )}

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setScreen('levelSelect')}
          className="w-full py-3 px-6 rounded-2xl font-semibold text-lg flex items-center justify-center gap-3 bg-white/80 text-gray-500"
        >
          <Home size={20} />
          Level Select
        </motion.button>
      </motion.div>

      {/* Rewarded ad modal */}
      {showRewardedAd && (
        <RewardedAdPlaceholder
          onReward={handleWatchAd}
          onClose={() => setShowRewardedAd(false)}
        />
      )}
    </div>
  );
}
