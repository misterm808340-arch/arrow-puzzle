'use client';

import { motion } from 'framer-motion';
import { useGameStore } from '@/game/store';
import { Star, ArrowRight, RotateCcw, Trophy } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function LevelCompleteScreen() {
  const currentLevel = useGameStore((s) => s.currentLevel);
  const lives = useGameStore((s) => s.lives);
  const maxLives = useGameStore((s) => s.maxLives);
  const nextLevel = useGameStore((s) => s.nextLevel);
  const retryLevel = useGameStore((s) => s.retryLevel);
  const setScreen = useGameStore((s) => s.setScreen);

  const stars = lives >= maxLives ? 3 : lives >= 2 ? 2 : 1;
  const [animatedStars, setAnimatedStars] = useState(0);

  useEffect(() => {
    // Animate stars appearing one by one
    const timers: NodeJS.Timeout[] = [];
    for (let i = 1; i <= stars; i++) {
      timers.push(setTimeout(() => setAnimatedStars(i), i * 300));
    }
    return () => timers.forEach(clearTimeout);
  }, [stars]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-8"
      style={{ background: 'linear-gradient(180deg, #FFF9C4 0%, #E8F5E9 50%, #E8EAF6 100%)' }}
    >
      {/* Trophy animation */}
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 10, stiffness: 200 }}
        className="mb-6"
      >
        <div className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-lg"
          style={{ background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' }}
        >
          <Trophy size={48} className="text-white" />
        </div>
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-4xl font-black text-gray-800 mb-2"
      >
        Level Complete!
      </motion.h1>

      {currentLevel === -1 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-lg font-semibold text-purple-600 mb-4"
        >
          Daily Challenge Completed!
        </motion.p>
      )}

      {/* Stars */}
      <div className="flex gap-4 mb-8 mt-4">
        {[1, 2, 3].map((s) => (
          <motion.div
            key={s}
            initial={{ scale: 0, rotate: -180 }}
            animate={
              s <= animatedStars
                ? { scale: [0, 1.4, 1], rotate: 0 }
                : { scale: 1, rotate: 0 }
            }
            transition={
              s <= animatedStars
                ? { type: 'spring', damping: 8, stiffness: 200, delay: s * 0.2 }
                : {}
            }
          >
            <Star
              size={56}
              className={s <= animatedStars ? 'text-yellow-400 drop-shadow-lg' : 'text-gray-200'}
              fill={s <= animatedStars ? '#FFD700' : '#E5E7EB'}
            />
          </motion.div>
        ))}
      </div>

      {/* Lives info */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-gray-500 mb-8 text-center"
      >
        {lives} {lives === 1 ? 'life' : 'lives'} remaining
        {stars === 3 && ' — Perfect!'}
      </motion.p>

      {/* Action buttons */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1 }}
        className="flex flex-col gap-3 w-full max-w-xs"
      >
        {currentLevel > 0 && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={nextLevel}
            className="w-full py-4 px-6 rounded-2xl text-white font-bold text-lg shadow-lg flex items-center justify-center gap-3"
            style={{ background: 'linear-gradient(135deg, #7ED321 0%, #5CB318 100%)' }}
          >
            Next Level
            <ArrowRight size={22} />
          </motion.button>
        )}

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={retryLevel}
          className="w-full py-3 px-6 rounded-2xl font-semibold text-lg flex items-center justify-center gap-3 bg-white border-2 border-gray-200 text-gray-600 shadow-sm"
        >
          <RotateCcw size={20} />
          Replay
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setScreen('levelSelect')}
          className="w-full py-3 px-6 rounded-2xl font-semibold text-lg flex items-center justify-center gap-3 bg-white/80 text-gray-500"
        >
          Level Select
        </motion.button>
      </motion.div>

      {/* Ad placeholder */}
      <div className="mt-8 w-full max-w-xs">
        <div className="bg-gray-100 rounded-xl py-3 px-4 text-center text-xs text-gray-400 border border-dashed border-gray-300">
          AdMob Banner Placeholder
        </div>
      </div>
    </div>
  );
}
