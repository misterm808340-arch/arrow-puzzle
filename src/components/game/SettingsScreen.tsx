'use client';

import { motion } from 'framer-motion';
import { useGameStore } from '@/game/store';
import { ArrowLeft, Volume2, VolumeX, Music, Smartphone, Shield, ExternalLink } from 'lucide-react';

export default function SettingsScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const settings = useGameStore((s) => s.settings);
  const updateSettings = useGameStore((s) => s.updateSettings);

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(180deg, #E8EAF6 0%, #F5F5F5 100%)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-100">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setScreen('home')}
          className="p-2 rounded-xl hover:bg-gray-100"
        >
          <ArrowLeft size={24} className="text-gray-600" />
        </motion.button>
        <h1 className="text-xl font-bold text-gray-800">Settings</h1>
      </div>

      {/* Settings list */}
      <div className="flex-1 px-4 py-6">
        <div className="space-y-3 max-w-md mx-auto">
          {/* Sound */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              {settings.sound ? (
                <Volume2 size={22} className="text-blue-500" />
              ) : (
                <VolumeX size={22} className="text-gray-400" />
              )}
              <div>
                <p className="font-semibold text-gray-800">Sound Effects</p>
                <p className="text-sm text-gray-500">Tap and game sounds</p>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ sound: !settings.sound })}
              className={`w-12 h-7 rounded-full transition-colors relative ${
                settings.sound ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <motion.div
                className="w-5 h-5 bg-white rounded-full absolute top-1 shadow-sm"
                animate={{ left: settings.sound ? '24px' : '4px' }}
                transition={{ type: 'spring', damping: 15, stiffness: 300 }}
              />
            </button>
          </motion.div>

          {/* Music */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              {settings.music ? (
                <Music size={22} className="text-purple-500" />
              ) : (
                <VolumeX size={22} className="text-gray-400" />
              )}
              <div>
                <p className="font-semibold text-gray-800">Music</p>
                <p className="text-sm text-gray-500">Background music</p>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ music: !settings.music })}
              className={`w-12 h-7 rounded-full transition-colors relative ${
                settings.music ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <motion.div
                className="w-5 h-5 bg-white rounded-full absolute top-1 shadow-sm"
                animate={{ left: settings.music ? '24px' : '4px' }}
                transition={{ type: 'spring', damping: 15, stiffness: 300 }}
              />
            </button>
          </motion.div>

          {/* Vibration */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Smartphone size={22} className={settings.vibration ? 'text-orange-500' : 'text-gray-400'} />
              <div>
                <p className="font-semibold text-gray-800">Vibration</p>
                <p className="text-sm text-gray-500">Haptic feedback on taps</p>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ vibration: !settings.vibration })}
              className={`w-12 h-7 rounded-full transition-colors relative ${
                settings.vibration ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <motion.div
                className="w-5 h-5 bg-white rounded-full absolute top-1 shadow-sm"
                animate={{ left: settings.vibration ? '24px' : '4px' }}
                transition={{ type: 'spring', damping: 15, stiffness: 300 }}
              />
            </button>
          </motion.div>

          {/* Divider */}
          <div className="pt-4 pb-2">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Ads</h3>
          </div>

          {/* AdMob Info - transparent about ad usage (Play Store policy requirement) */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-blue-50 rounded-2xl p-4 border border-blue-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <Shield size={18} className="text-blue-600" />
              <h4 className="font-semibold text-blue-700">About Ads</h4>
            </div>
            <p className="text-sm text-blue-600 leading-relaxed">
              This app uses Google AdMob to show ads:
            </p>
            <ul className="text-sm text-blue-600 mt-2 space-y-1">
              <li>• Banner ads at the bottom of screens</li>
              <li>• Interstitial ads between every 3rd level</li>
              <li>• Rewarded video ads for extra lives</li>
            </ul>
            <p className="text-xs text-blue-400 mt-3">
              Ads help keep this game free. AdMob may collect device info for ad personalization.
            </p>
          </motion.div>

          {/* Divider */}
          <div className="pt-4 pb-2">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Legal</h3>
          </div>

          {/* Privacy Policy - REQUIRED by Google Play for apps with ads */}
          <motion.a
            href="https://arrow-puzzle-privacy.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer active:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <Shield size={22} className="text-green-600" />
              <div>
                <p className="font-semibold text-gray-800">Privacy Policy</p>
                <p className="text-sm text-gray-500">How we handle your data</p>
              </div>
            </div>
            <ExternalLink size={18} className="text-gray-400" />
          </motion.a>

          {/* App info */}
          <div className="pt-6 text-center">
            <p className="text-sm text-gray-400">Arrow Puzzle v1.0.0</p>
            <p className="text-xs text-gray-300 mt-1">com.arrowpuzzlegame.arrowpuzzle</p>
          </div>
        </div>
      </div>
    </div>
  );
}
