'use client';

import { motion } from 'framer-motion';
import { useGameStore } from '@/game/store';
import { loadDailyCompleted } from '@/game/storage';
import { Play, CalendarDays, Settings, Star } from 'lucide-react';

export default function HomeScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const totalStars = useGameStore((s) => s.totalStars);
  const dailyCompleted = useGameStore((s) => s.dailyCompleted);

  const today = new Date().toISOString().split('T')[0];
  const dailyDone = dailyCompleted === today;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-8 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #E8EAF6 0%, #F3E5F5 50%, #E8F5E9 100%)' }}
    >
      {/* Floating background arrows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        {['↑', '↓', '←', '→'].map((arrow, i) => (
          <motion.div
            key={i}
            className="absolute text-6xl font-bold"
            style={{ color: ['#4A90D9', '#F5A623', '#7ED321', '#D0021B'][i] }}
            initial={{
              x: [50, 350, 200, 300][i],
              y: [100, 400, 200, 500][i],
              rotate: 0,
            }}
            animate={{
              y: [[100, 50, 100], [400, 350, 400], [200, 150, 200], [500, 450, 500]][i],
              rotate: 360,
            }}
            transition={{
              duration: [8, 10, 7, 9][i],
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            {arrow}
          </motion.div>
        ))}
      </div>

      {/* Title */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="text-center mb-12"
      >
        <h1 className="text-6xl font-black tracking-tight mb-2"
          style={{
            background: 'linear-gradient(135deg, #4A90D9 0%, #7ED321 50%, #F5A623 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: 'var(--font-geist-sans)',
          }}
        >
          Arrow
        </h1>
        <h2 className="text-5xl font-black tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #D0021B 0%, #F5A623 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Puzzle
        </h2>
        <p className="text-gray-500 mt-4 text-lg font-medium">Clear the arrows. Think ahead.</p>
      </motion.div>

      {/* Arrow animation demo */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="flex gap-3 mb-12"
      >
        {[
          { dir: '↑', color: '#4A90D9', bg: '#E8F0FE' },
          { dir: '→', color: '#D0021B', bg: '#FDE8EA' },
          { dir: '↓', color: '#F5A623', bg: '#FEF3E2' },
          { dir: '←', color: '#7ED321', bg: '#E8F8D4' },
        ].map((item, i) => (
          <motion.div
            key={i}
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-bold shadow-lg"
            style={{ backgroundColor: item.bg, color: item.color }}
            animate={{
              y: [0, -8, 0],
            }}
            transition={{
              duration: 1.5,
              delay: i * 0.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {item.dir}
          </motion.div>
        ))}
      </motion.div>

      {/* Buttons */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="flex flex-col gap-4 w-full max-w-xs"
      >
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setScreen('levelSelect')}
          className="w-full py-4 px-6 rounded-2xl text-white font-bold text-xl shadow-lg flex items-center justify-center gap-3"
          style={{ background: 'linear-gradient(135deg, #4A90D9 0%, #357ABD 100%)' }}
        >
          <Play size={24} fill="white" />
          Play
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            const store = useGameStore.getState();
            store.startDailyChallenge();
          }}
          className="w-full py-4 px-6 rounded-2xl font-bold text-xl shadow-lg flex items-center justify-center gap-3 border-2"
          style={{
            background: dailyDone ? '#F0F0F0' : 'linear-gradient(135deg, #FEF3E2 0%, #FDE8EA 100%)',
            borderColor: dailyDone ? '#CCC' : '#F5A623',
            color: dailyDone ? '#999' : '#F5A623',
          }}
        >
          <CalendarDays size={24} />
          {dailyDone ? 'Daily Done ✓' : 'Daily Challenge'}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setScreen('settings')}
          className="w-full py-3 px-6 rounded-2xl font-semibold text-lg flex items-center justify-center gap-3 bg-white/80 text-gray-600 border border-gray-200 shadow-sm"
        >
          <Settings size={22} />
          Settings
        </motion.button>
      </motion.div>

      {/* Stars counter */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-8 flex items-center gap-2 text-gray-500"
      >
        <Star size={20} fill="#F5A623" className="text-yellow-500" />
        <span className="font-semibold text-lg">{totalStars} Stars Collected</span>
      </motion.div>

      {/* Ad placeholder */}
      <div className="mt-6 w-full max-w-xs">
        <div className="bg-gray-100 rounded-xl py-3 px-4 text-center text-xs text-gray-400 border border-dashed border-gray-300">
          AdMob Banner Placeholder
        </div>
      </div>
    </div>
  );
}
