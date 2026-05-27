'use client';

import { useEffect, useState } from 'react';
import { isNativeApp, showBannerAd, hideBannerAd, removeBannerAd, initializeAdMob } from '@/game/admob';

export default function AdBanner() {
  const [isNative, setIsNative] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);

  useEffect(() => {
    setIsNative(isNativeApp());

    if (isNativeApp()) {
      // Initialize and show banner in native app
      initializeAdMob().then(() => {
        showBannerAd().then(() => setAdLoaded(true));
      });
    }

    return () => {
      if (isNativeApp()) {
        hideBannerAd();
      }
    };
  }, []);

  // In native app, banner is shown by AdMob SDK at the bottom
  if (isNative) {
    return null; // AdMob renders the banner natively
  }

  // Fallback placeholder for web/PWA
  return (
    <div className="w-full px-4 py-2">
      <div className="bg-gray-50 rounded-lg py-2 px-4 text-center text-xs text-gray-400 border border-dashed border-gray-200 flex items-center justify-center gap-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="2" width="20" height="20" rx="2" />
          <path d="M7 12h10M12 7v10" />
        </svg>
        AdMob Banner
      </div>
    </div>
  );
}

export function InterstitialAd({ onClose }: { onClose: () => void }) {
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsNative(isNativeApp());

    if (isNativeApp()) {
      // Show real interstitial ad in native app
      import('@/game/admob').then(({ showInterstitialAd }) => {
        showInterstitialAd().then(() => {
          onClose();
        });
      });
    }
  }, [onClose]);

  // In native app, interstitial is shown by AdMob SDK
  if (isNative) {
    return null;
  }

  // Fallback placeholder for web/PWA
  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
              <rect x="2" y="2" width="20" height="20" rx="2" />
              <path d="M7 12h10M12 7v10" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Sponsored Content</h3>
          <p className="text-gray-500 text-sm">Support us by viewing this ad</p>
        </div>
        <button
          onClick={onClose}
          className="w-full py-3 bg-gray-100 rounded-xl text-gray-600 font-semibold hover:bg-gray-200 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

export function RewardedAdPlaceholder({ onReward, onClose }: { onReward: () => void; onClose: () => void }) {
  const [isNative, setIsNative] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsNative(isNativeApp());
  }, []);

  const handleWatchAd = async () => {
    if (isNative) {
      setLoading(true);
      const { showRewardedAd } = await import('@/game/admob');
      const result = await showRewardedAd();
      setLoading(false);
      if (result.rewarded) {
        onReward();
      } else {
        onClose();
      }
    } else {
      // Fallback for web: simulate ad watch
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        onReward();
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto bg-yellow-50 rounded-2xl flex items-center justify-center mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Watch Ad for +1 Life</h3>
          <p className="text-gray-500 text-sm">Watch a short ad to continue playing with 1 life remaining</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 bg-gray-100 rounded-xl text-gray-600 font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            No Thanks
          </button>
          <button
            onClick={handleWatchAd}
            disabled={loading}
            className="flex-1 py-3 rounded-xl text-white font-semibold shadow-md disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #4A90D9 0%, #357ABD 100%)' }}
          >
            {loading ? 'Loading...' : 'Watch Ad'}
          </button>
        </div>
      </div>
    </div>
  );
}
