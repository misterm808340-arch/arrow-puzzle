'use client';

import { useEffect, useMemo, useState } from 'react';
import { isNativeApp, setBannerAllowed, ADMOB_BANNER_ID } from '@/game/admob';
import { useGameStore } from '@/game/store';

/**
 * AdBanner
 * --------
 * Banner is served by Google AdMob (sole ad network).
 *
 * Visibility logic:
 *   - In TEST MODE (Google sample ad units): banner appears from level 1
 *     so you can verify ads work without having to play through 20 levels.
 *   - In PRODUCTION: banner appears only after level 20 (BANNER_UNLOCK_LEVEL = 20).
 *
 * Platform behavior:
 *   - Native: drives AdMob banner show/hide via setBannerAllowed()
 *   - Web: renders a placeholder "Ad" div (no real ad call)
 */

// Detect test mode by checking whether the banner ad unit ID starts with
// Google's test publisher prefix (ca-app-pub-3940256099942544).
const IS_TEST_MODE = ADMOB_BANNER_ID.startsWith('ca-app-pub-3940256099942544');
const BANNER_UNLOCK_LEVEL = IS_TEST_MODE ? 1 : 20;

export default function AdBanner() {
  // Start as false on SSR/SSG (window unavailable at build time), then
  // sync to actual platform in useEffect on the client. This is the
  // canonical pattern for platform detection in static-exported Next.js.
  const [isNative, setIsNative] = useState(false);
  const levelProgress = useGameStore((s) => s.levelProgress);
  const removeAds = useGameStore((s) => s.settings.removeAds);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsNative(isNativeApp());
  }, []);

  const highestCompleted = useMemo(
    () =>
      Object.entries(levelProgress).reduce((max, [key, val]) => {
        const num = parseInt(key, 10);
        if (val && val.stars > 0 && num > max) return num;
        return max;
      }, 0),
    [levelProgress],
  );

  const canShowBanner = highestCompleted >= BANNER_UNLOCK_LEVEL;

  // Keep AdMob banner visibility in sync with the unlock rule.
  useEffect(() => {
    if (!isNative) return;
    setBannerAllowed(canShowBanner && !removeAds);
  }, [isNative, canShowBanner, removeAds]);

  // Native: banner is drawn by AdMob SDK, render nothing.
  if (isNative) return null;

  // Web fallback placeholder — only after unlock level
  if (!canShowBanner || removeAds) return null;

  return (
    <div className="w-full px-4 py-2">
      <div className="bg-gray-50 rounded-lg py-2 px-4 text-center text-xs text-gray-400 border border-dashed border-gray-200 flex items-center justify-center gap-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="2" width="20" height="20" rx="2" />
          <path d="M7 12h10M12 7v10" />
        </svg>
        Ad
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
          <p className="text-gray-500 text-sm">Watch a short ad to continue playing</p>
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

