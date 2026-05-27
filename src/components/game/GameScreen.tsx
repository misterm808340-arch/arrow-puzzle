'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/game/store';
import { Direction } from '@/game/types';
import ArrowCell from './ArrowCell';
import { ArrowLeft, Heart, Lightbulb, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import Confetti from './Confetti';
import AdBanner from './AdBanner';

export default function GameScreen() {
  const grid = useGameStore((s) => s.grid);
  const gridSize = useGameStore((s) => s.gridSize);
  const arrowsRemaining = useGameStore((s) => s.arrowsRemaining);
  const totalArrows = useGameStore((s) => s.totalArrows);
  const lives = useGameStore((s) => s.lives);
  const maxLives = useGameStore((s) => s.maxLives);
  const hints = useGameStore((s) => s.hints);
  const currentLevel = useGameStore((s) => s.currentLevel);
  const levelComplete = useGameStore((s) => s.levelComplete);
  const showCombo = useGameStore((s) => s.showCombo);
  const comboText = useGameStore((s) => s.comboText);
  const animatingArrows = useGameStore((s) => s.animatingArrows);
  const invalidMessage = useGameStore((s) => s.invalidMessage);
  const setScreen = useGameStore((s) => s.setScreen);
  const useHint = useGameStore((s) => s.useHint);
  const clearCombo = useGameStore((s) => s.clearCombo);

  const [showConfetti, setShowConfetti] = useState(false);

  // Calculate cell size based on viewport
  const cellSize = useMemo(() => {
    if (typeof window === 'undefined') return 60;
    const maxWidth = Math.min(window.innerWidth - 32, 400);
    const gap = 4;
    return Math.floor((maxWidth - (gridSize - 1) * gap) / gridSize);
  }, [gridSize]);

  // Show confetti on level complete
  if (levelComplete && !showConfetti) {
    setShowConfetti(true);
  }

  // Build animation lookup from the store's animatingArrows map
  const animLookup = useMemo(() => {
    const map = new Map<string, Direction>();
    animatingArrows.forEach((dir, id) => {
      map.set(id, dir);
    });
    return map;
  }, [animatingArrows]);

  return (
    <div className="min-h-screen flex flex-col relative"
      style={{ background: 'linear-gradient(180deg, #E8EAF6 0%, #F5F5F5 100%)' }}
    >
      {/* Confetti */}
      {showConfetti && <Confetti />}

      {/* Combo text */}
      <AnimatePresence>
        {showCombo && (
          <motion.div
            className="fixed top-1/3 left-0 right-0 text-center z-40 pointer-events-none"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.3, 1], opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.4 }}
            onAnimationComplete={() => {
              setTimeout(() => clearCombo(), 1000);
            }}
          >
            <span
              className="text-4xl font-black px-6 py-2 rounded-2xl shadow-lg inline-block"
              style={{
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                color: '#FFF',
                textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
              }}
            >
              {comboText}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invalid tap message */}
      <AnimatePresence>
        {invalidMessage && (
          <motion.div
            className="fixed top-1/3 left-0 right-0 text-center z-40 pointer-events-none"
            initial={{ scale: 0, opacity: 0, y: 0 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <span
              className="text-xl font-bold px-6 py-3 rounded-2xl shadow-lg inline-flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #D0021B 0%, #C0392B 100%)',
                color: '#FFF',
              }}
            >
              <XCircle size={22} />
              {invalidMessage}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setScreen('levelSelect')}
          className="p-2 rounded-xl hover:bg-gray-100"
        >
          <ArrowLeft size={22} className="text-gray-600" />
        </motion.button>

        <div className="text-center">
          <span className="text-sm font-bold text-gray-800">
            {currentLevel === -1 ? 'Daily Challenge' : `Level ${currentLevel}`}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {Array.from({ length: maxLives }, (_, i) => (
            <motion.div
              key={i}
              animate={i >= lives ? { scale: [1, 1.3, 0], opacity: [1, 1, 0] } : {}}
              transition={{ duration: 0.3 }}
            >
              <Heart
                size={20}
                className={i < lives ? 'text-red-500' : 'text-gray-300'}
                fill={i < lives ? '#EF4444' : '#D1D5DB'}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Arrow counter */}
      <div className="flex items-center justify-center py-3">
        <motion.div
          className="flex items-center gap-2 bg-white/80 rounded-full px-4 py-1.5 shadow-sm border border-gray-100"
        >
          <span className="text-sm text-gray-500">Arrows remaining:</span>
          <AnimatePresence mode="wait">
            <motion.span
              className="text-lg font-bold text-gray-800"
              key={`count-${arrowsRemaining}`}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {arrowsRemaining}
            </motion.span>
          </AnimatePresence>
          <span className="text-sm text-gray-400">/ {totalArrows}</span>
        </motion.div>
      </div>

      {/* Hint button */}
      <div className="flex justify-center mb-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={useHint}
          disabled={hints <= 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-sm border text-sm font-semibold transition-colors
            ${hints > 0 ? 'bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100' : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'}`}
        >
          <Lightbulb size={16} fill={hints > 0 ? '#F5A623' : '#D1D5DB'} />
          Hint ({hints})
        </motion.button>
      </div>

      {/* Game grid */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${gridSize}, ${cellSize}px)`,
          }}
        >
          {Array.from({ length: gridSize * gridSize }, (_, i) => {
            const r = Math.floor(i / gridSize);
            const c = i % gridSize;
            const arrow = grid[r]?.[c] ?? null;
            const arrowId = arrow?.id ?? '';
            const isAnimating = animLookup.has(arrowId);
            const animDirection = animLookup.get(arrowId) ?? null;

            return (
              <ArrowCell
                key={`cell-${r}-${c}`}
                arrow={arrow}
                row={r}
                col={c}
                gridSize={gridSize}
                cellSize={cellSize}
                isAnimating={isAnimating}
                animDirection={animDirection}
                onAnimationComplete={() => {}}
              />
            );
          })}
        </div>
      </div>

      {/* Bottom section */}
      <div className="pb-4">
        <AdBanner />
      </div>
    </div>
  );
}
