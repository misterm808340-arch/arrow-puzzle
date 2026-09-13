'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/game/store';
import { ArrowLeft, Star, Lock, ChevronDown } from 'lucide-react';

// Lightweight grid size formula (matches generateLevel logic without running full generation)
function getGridSize(levelNum: number): number {
  if (levelNum <= 5) return 3;       // Beginner: 3x3
  if (levelNum <= 12) return 4;      // Easy: 4x4
  if (levelNum <= 50) return 5;      // Medium + Hard: 5x5
  if (levelNum <= 100) return 6;     // Expert: 6x6
  if (levelNum <= 500) return 6;     // Master + Grandmaster: 6x6
  if (levelNum <= 2000) return 7;    // Legend + Extreme: 7x7
  if (levelNum <= 5000) return 8;    // Titan + Immortal: 8x8
  if (levelNum <= 9000) return 9;    // Mythic + Celestial: 9x9
  return 10;                          // Godlike + Transcend: 10x10
}

const TOTAL_LEVELS = 12000;
const LEVELS_PER_PAGE = 50;

export default function LevelSelect() {
  const setScreen = useGameStore((s) => s.setScreen);
  const startLevel = useGameStore((s) => s.startLevel);
  const levelProgress = useGameStore((s) => s.levelProgress);
  const totalStars = useGameStore((s) => s.totalStars);

  const totalPages = Math.ceil(TOTAL_LEVELS / LEVELS_PER_PAGE);

  const sections = [
    { name: 'Beginner', range: [1, 5] as const, color: '#7ED321' },
    { name: 'Easy', range: [6, 12] as const, color: '#4A90D9' },
    { name: 'Medium', range: [13, 20] as const, color: '#F5A623' },
    { name: 'Hard', range: [21, 50] as const, color: '#D0021B' },
    { name: 'Expert', range: [51, 100] as const, color: '#9B59B6' },
    { name: 'Master', range: [101, 200] as const, color: '#E91E63' },
    { name: 'Grandmaster', range: [201, 500] as const, color: '#00BCD4' },
    { name: 'Legend', range: [501, 1000] as const, color: '#FF5722' },
    { name: 'Extreme', range: [1001, 2000] as const, color: '#8B0000' },
    { name: 'Titan', range: [2001, 3000] as const, color: '#4B0082' },
    { name: 'Immortal', range: [3001, 5000] as const, color: '#FF1493' },
    { name: 'Mythic', range: [5001, 7000] as const, color: '#00FF7F' },
    { name: 'Celestial', range: [7001, 9000] as const, color: '#FFD700' },
    { name: 'Godlike', range: [9001, 10000] as const, color: '#FF0000' },
    { name: 'Transcend', range: [10001, 12000] as const, color: '#8A2BE2' },
  ];

  const highestUnlocked = Object.entries(levelProgress).reduce((max, [key, val]) => {
    const num = parseInt(key);
    if (val.unlocked && num > max) return num;
    return max;
  }, 1);

  // Initialize currentPage lazily so we don't flash page 0 before jumping
  // to the user's progress page (avoids cascading renders per React 19 lint).
  const [currentPage, setCurrentPage] = useState(() =>
    Math.floor((highestUnlocked - 1) / LEVELS_PER_PAGE)
  );
  const [showPageMenu, setShowPageMenu] = useState(false);

  const isLevelUnlocked = (levelNum: number): boolean => {
    if (levelNum <= 1) return true;
    if (levelProgress[levelNum]?.unlocked) return true;
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

  const pageStart = currentPage * LEVELS_PER_PAGE + 1;
  const pageEnd = Math.min((currentPage + 1) * LEVELS_PER_PAGE, TOTAL_LEVELS);

  const visibleSections = sections.filter((section) => {
    const [sStart, sEnd] = section.range;
    return sStart <= pageEnd && sEnd >= pageStart;
  });

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #E8EAF6 0%, #F5F5F5 100%)',
      }}
    >
      {/* Header */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        backgroundColor: 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #f1f1f1',
      }}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setScreen('home')}
          style={{ padding: 8, borderRadius: 12 }}
        >
          <ArrowLeft size={24} className="text-gray-600" />
        </motion.button>
        <h1 style={{ fontSize: 20, fontWeight: 'bold', color: '#374151' }}>Select Level</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Star size={18} fill="#F5A623" className="text-yellow-500" />
          <span style={{ fontWeight: 600, color: '#6B7280' }}>{totalStars}</span>
        </div>
      </div>

      {/* Page selector */}
      <div style={{
        flexShrink: 0,
        padding: '8px 16px',
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderBottom: '1px solid #f1f1f1',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              opacity: currentPage === 0 ? 0.3 : 1,
            }}
          >
            ◀ Prev
          </button>

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowPageMenu(!showPageMenu)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 'bold',
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
              }}
            >
              <span>{pageStart}-{pageEnd}</span>
              <ChevronDown size={14} />
            </button>

            {showPageMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginTop: 4,
                backgroundColor: '#fff',
                borderRadius: 12,
                boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                border: '1px solid #e5e7eb',
                zIndex: 50,
                maxHeight: 240,
                overflowY: 'auto',
                width: 160,
                WebkitOverflowScrolling: 'touch',
              }}>
                {Array.from({ length: totalPages }, (_, i) => {
                  const pStart = i * LEVELS_PER_PAGE + 1;
                  const pEnd = Math.min((i + 1) * LEVELS_PER_PAGE, TOTAL_LEVELS);
                  return (
                    <button
                      key={i}
                      onClick={() => { setCurrentPage(i); setShowPageMenu(false); }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        fontSize: 13,
                        textAlign: 'left',
                        backgroundColor: i === currentPage ? '#DBEAFE' : 'transparent',
                        fontWeight: i === currentPage ? 'bold' : 'normal',
                        color: i === currentPage ? '#1D4ED8' : '#6B7280',
                        border: 'none',
                        borderBottom: '1px solid #f3f4f6',
                      }}
                    >
                      {pStart} - {pEnd}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage === totalPages - 1}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              opacity: currentPage === totalPages - 1 ? 0.3 : 1,
            }}
          >
            Next ▶
          </button>
        </div>

        {/* Page indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>
            Page {currentPage + 1} of {totalPages}
          </span>
        </div>
      </div>

      {/* Scrollable level grid - THIS IS THE KEY FIX */}
      <div
        className="scroll-container"
        style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
          overscrollBehaviorY: 'contain',
          padding: '12px 16px',
        }}
      >
        {visibleSections.map((section, si) => {
          const [sStart, sEnd] = section.range;
          const start = Math.max(sStart, pageStart);
          const end = Math.min(sEnd, pageEnd);

          if (start > end) return null;

          return (
            <motion.div
              key={section.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: si * 0.03 }}
              style={{ marginBottom: 20 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: section.color }} />
                <h2 style={{ fontSize: 16, fontWeight: 'bold', color: '#374151' }}>{section.name}</h2>
                <span style={{ fontSize: 12, color: '#9CA3AF' }}>({start}-{end})</span>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: 8,
              }}>
                {Array.from({ length: end - start + 1 }, (_, i) => {
                  const levelNum = start + i;
                  const unlocked = isLevelUnlocked(levelNum);
                  const stars = getStars(levelNum);
                  const gridSize = getGridSize(levelNum);

                  return (
                    <motion.button
                      key={levelNum}
                      whileTap={unlocked ? { scale: 0.9 } : {}}
                      onClick={() => handleLevelTap(levelNum)}
                      disabled={!unlocked}
                      style={{
                        aspectRatio: '1',
                        borderRadius: 12,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        fontWeight: 'bold',
                        border: '2px solid',
                        borderColor: unlocked ? (stars > 0 ? '#e5e7eb' : '#BFDBFE') : '#e5e7eb',
                        backgroundColor: unlocked ? '#fff' : '#f3f4f6',
                        color: unlocked ? '#374151' : '#d1d5db',
                        touchAction: 'manipulation',
                      }}
                    >
                      {unlocked ? (
                        <>
                          <span style={{ fontSize: 14, lineHeight: 1 }}>{levelNum}</span>
                          <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                            {[1, 2, 3].map((s) => (
                              <Star
                                key={s}
                                size={7}
                                className={s <= stars ? 'text-yellow-400' : 'text-gray-200'}
                                fill={s <= stars ? '#F5A623' : '#E5E7EB'}
                              />
                            ))}
                          </div>
                          <span style={{ fontSize: 7, color: '#9CA3AF', lineHeight: 1, marginTop: 2 }}>{gridSize}x{gridSize}</span>
                        </>
                      ) : (
                        <Lock size={14} className="text-gray-300" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          );
        })}

        {/* Bottom spacing */}
        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}
