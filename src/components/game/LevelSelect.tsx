'use client';

import { motion } from 'framer-motion';
import { useGameStore } from '@/game/store';
import { ArrowLeft, Star, Lock } from 'lucide-react';
import { generateLevel } from '@/game/logic';

const TOTAL_LEVELS = 2000;

export default function LevelSelect() {
  const setScreen = useGameStore((s) => s.setScreen);
  const startLevel = useGameStore((s) => s.startLevel);
  const levelProgress = useGameStore((s) => s.levelProgress);
  const totalStars = useGameStore((s) => s.totalStars);

  // Group levels into pages/sections
  const sections = [
    { name: 'Beginner', range: [1, 5], color: '#7ED321' },
    { name: 'Easy', range: [6, 12], color: '#4A90D9' },
    { name: 'Medium', range: [13, 20], color: '#F5A623' },
    { name: 'Hard', range: [21, 50], color: '#D0021B' },
    { name: 'Expert', range: [51, 100], color: '#9B59B6' },
    { name: 'Master', range: [101, 200], color: '#E91E63' },
    { name: 'Grandmaster', range: [201, 500], color: '#00BCD4' },
    { name: 'Legend', range: [501, 1000], color: '#FF5722' },
    { name: 'Extreme', range: [1001, 2000], color: '#8B0000' },
  ];

  // Determine the highest unlocked level
  const highestUnlocked = Object.entries(levelProgress).reduce((max, [key, val]) => {
    const num = parseInt(key);
    if (val.unlocked && num > max) return num;
    return max;
  }, 1);

  // Auto-unlock levels based on progress
  const isLevelUnlocked = (levelNum: number): boolean => {
    if (levelNum <= 1) return true;
    if (levelProgress[levelNum]?.unlocked) return true;
    // Auto-unlock: if the previous level is completed
    if (levelProgress[levelNum - 1]?.stars > 0) return true;
    if (levelNum <= highestUnlocked + 1) return true;
    return false;
  };

  const getStars = (levelNum: number): number => {
    return levelProgress[levelNum]?.stars || 0;
  };

  const handleLevelTap = (levelNum: number) => {
    if (!isLevelUnlocked(levelNum)) return;
    startLevel(levelNum);
  };

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(180deg, #E8EAF6 0%, #F5F5F5 100%)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-100">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setScreen('home')}
          className="p-2 rounded-xl hover:bg-gray-100"
        >
          <ArrowLeft size={24} className="text-gray-600" />
        </motion.button>
        <h1 className="text-xl font-bold text-gray-800">Select Level</h1>
        <div className="flex items-center gap-1">
          <Star size={18} fill="#F5A623" className="text-yellow-500" />
          <span className="font-semibold text-gray-600">{totalStars}</span>
        </div>
      </div>

      {/* Level sections */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        {sections.map((section, si) => {
          const [start, end] = section.range;
          // Only show sections that have unlocked levels or are adjacent
          if (start > highestUnlocked + 10) return null;

          return (
            <motion.div
              key={section.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: si * 0.05 }}
              className="mb-6"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: section.color }} />
                <h2 className="text-lg font-bold text-gray-700">{section.name}</h2>
                <span className="text-sm text-gray-400">({start}-{end})</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: end - start + 1 }, (_, i) => {
                  const levelNum = start + i;
                  const unlocked = isLevelUnlocked(levelNum);
                  const stars = getStars(levelNum);
                  const level = generateLevel(levelNum);
                  const gridSize = level.grid_size;

                  return (
                    <motion.button
                      key={levelNum}
                      whileTap={unlocked ? { scale: 0.9 } : {}}
                      onClick={() => handleLevelTap(levelNum)}
                      disabled={!unlocked}
                      className={`
                        relative aspect-square rounded-xl flex flex-col items-center justify-center
                        text-sm font-bold shadow-sm border-2 transition-colors
                        ${unlocked
                          ? 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 active:bg-gray-50'
                          : 'bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed'
                        }
                      `}
                    >
                      {unlocked ? (
                        <>
                          <span className="text-base">{levelNum}</span>
                          <div className="flex gap-0.5 mt-0.5">
                            {[1, 2, 3].map((s) => (
                              <Star
                                key={s}
                                size={8}
                                className={s <= stars ? 'text-yellow-400' : 'text-gray-200'}
                                fill={s <= stars ? '#F5A623' : '#E5E7EB'}
                              />
                            ))}
                          </div>
                          <span className="text-[8px] text-gray-400 mt-0.5">{gridSize}x{gridSize}</span>
                        </>
                      ) : (
                        <Lock size={16} className="text-gray-300" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Ad placeholder */}
      <div className="sticky bottom-0 bg-white/90 backdrop-blur-sm px-4 py-2 border-t border-gray-100">
        <div className="bg-gray-50 rounded-lg py-2 px-4 text-center text-xs text-gray-400 border border-dashed border-gray-200">
          AdMob Banner Placeholder
        </div>
      </div>
    </div>
  );
}
