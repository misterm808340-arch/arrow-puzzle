'use client';

import { motion } from 'framer-motion';
import { ArrowData, DIRECTION_COLORS, DIRECTION_BG, Direction } from '@/game/types';
import { getArrowExitOffset } from '@/game/logic';
import { useGameStore } from '@/game/store';
import { useMemo, useCallback } from 'react';

interface ArrowCellProps {
  arrow: ArrowData | null;
  row: number;
  col: number;
  gridSize: number;
  cellSize: number;
  isAnimating: boolean;
  animDirection: Direction | null;
  onAnimationComplete: (id: string) => void;
}

export default function ArrowCell({
  arrow,
  row,
  col,
  gridSize,
  cellSize,
  isAnimating,
  animDirection,
  onAnimationComplete,
}: ArrowCellProps) {
  const tapArrow = useGameStore((s) => s.tapArrow);
  const highlightedArrow = useGameStore((s) => s.highlightedArrow);
  const invalidArrow = useGameStore((s) => s.invalidArrow);
  const finishAnimation = useGameStore((s) => s.finishAnimation);
  const settings = useGameStore((s) => s.settings);

  const handleTap = useCallback(() => {
    if (!arrow || isAnimating) return;
    tapArrow(row, col);
  }, [arrow, isAnimating, row, col, tapArrow]);

  if (!arrow && !isAnimating) {
    // Empty cell
    return (
      <div
        className="rounded-xl border border-gray-100 bg-gray-50/50"
        style={{ width: cellSize, height: cellSize }}
      />
    );
  }

  if (isAnimating && animDirection && arrow) {
    // Animating arrow - fly off screen
    const offset = getArrowExitOffset(animDirection, gridSize, cellSize);
    const color = DIRECTION_COLORS[arrow.direction];
    const bg = DIRECTION_BG[arrow.direction];

    return (
      <motion.div
        className="rounded-xl flex items-center justify-center font-bold shadow-lg"
        style={{
          width: cellSize,
          height: cellSize,
          backgroundColor: bg,
          color: color,
          fontSize: cellSize * 0.5,
        }}
        initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
        animate={{ x: offset.x, y: offset.y, opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.35, ease: 'easeIn' }}
        onAnimationComplete={() => {
          finishAnimation(arrow.id);
        }}
      >
        {arrow.direction === 'UP' && '↑'}
        {arrow.direction === 'DOWN' && '↓'}
        {arrow.direction === 'LEFT' && '←'}
        {arrow.direction === 'RIGHT' && '→'}
      </motion.div>
    );
  }

  if (!arrow) return null;

  const isHighlighted = highlightedArrow === arrow.id;
  const isInvalid = invalidArrow === arrow.id;
  const color = DIRECTION_COLORS[arrow.direction];
  const bg = DIRECTION_BG[arrow.direction];

  return (
    <motion.button
      onClick={handleTap}
      className="rounded-xl flex items-center justify-center font-bold shadow-sm border-2 relative overflow-hidden"
      style={{
        width: cellSize,
        height: cellSize,
        backgroundColor: isHighlighted ? '#FFF9C4' : bg,
        color: color,
        fontSize: cellSize * 0.5,
        borderColor: isHighlighted ? '#F5A623' : isInvalid ? '#D0021B' : 'transparent',
        cursor: 'pointer',
      }}
      animate={
        isInvalid
          ? { x: [0, -8, 8, -6, 6, -3, 3, 0] }
          : isHighlighted
          ? { scale: [1, 1.05, 1] }
          : {}
      }
      transition={
        isInvalid
          ? { duration: 0.5 }
          : { duration: 0.8, repeat: isHighlighted ? Infinity : 0 }
      }
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
    >
      {/* Glow effect for highlighted */}
      {isHighlighted && (
        <motion.div
          className="absolute inset-0 rounded-xl"
          style={{ backgroundColor: '#FFF9C4' }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}

      {/* Invalid flash overlay */}
      {isInvalid && (
        <motion.div
          className="absolute inset-0 rounded-xl"
          style={{ backgroundColor: '#D0021B' }}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      )}

      {/* Arrow symbol */}
      <span className="relative z-10">
        {arrow.direction === 'UP' && '↑'}
        {arrow.direction === 'DOWN' && '↓'}
        {arrow.direction === 'LEFT' && '←'}
        {arrow.direction === 'RIGHT' && '→'}
      </span>

      {/* Direction indicator dot */}
      <div
        className="absolute w-2 h-2 rounded-full"
        style={{
          backgroundColor: color,
          opacity: 0.4,
          ...getDirectionDotStyle(arrow.direction),
        }}
      />
    </motion.button>
  );
}

function getDirectionDotStyle(direction: Direction): React.CSSProperties {
  switch (direction) {
    case 'UP':
      return { top: 4, left: '50%', transform: 'translateX(-50%)' };
    case 'DOWN':
      return { bottom: 4, left: '50%', transform: 'translateX(-50%)' };
    case 'LEFT':
      return { left: 4, top: '50%', transform: 'translateY(-50%)' };
    case 'RIGHT':
      return { right: 4, top: '50%', transform: 'translateY(-50%)' };
  }
}
