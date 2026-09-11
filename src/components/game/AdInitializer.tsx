'use client';

import { useEffect } from 'react';
import { initializeAdMob, isNativeApp, setBannerAllowed, shouldShowBanner } from '@/game/admob';
import { requestConsent } from '@/game/consent';
import { useGameStore } from '@/game/store';

/**
 * AdInitializer
 * =============
 * Mounts ONCE at app startup (in layout) and:
 *   1. Starts Google UMP consent flow (required by AdMob policy for
 *      EEA/UK/CH — AdMob GMS SDK reads TC string from SharedPreferences).
 *   2. Initializes AdMob GMS SDK IN PARALLEL — does NOT wait for consent result.
 *      AdMob GMS SDK respects the TC string automatically when making ad requests.
 *   3. Native plugin preloads interstitial + rewarded automatically on init complete
 *   4. Subscribes to levelProgress to flip bannerAllowed when level 20 reached
 *
 * IMPORTANT: We do NOT gate AdMob init on canRequestAds. AdMob GMS SDK
 * respects UMP consent state internally — we just initialize and let it work.
 */
export default function AdInitializer() {
  const levelProgress = useGameStore((s) => s.levelProgress);
  const removeAds = useGameStore((s) => s.settings.removeAds);

  useEffect(() => {
    const native = isNativeApp();
    console.log('[AdInitializer] mount. native=', native, 'removeAds=', removeAds);

    if (!native) {
      console.log('[AdInitializer] Not native — skipping all ad SDK init');
      return;
    }
    if (removeAds) {
      console.log('[AdInitializer] removeAds=true — skipping all ad SDK init');
      return;
    }

    // Start consent flow (fire-and-forget — UMP handles form display)
    // Do NOT await — we want AdMob to init in parallel.
    requestConsent().catch((e) => {
      console.error('[AdInitializer] Consent flow error (non-blocking)', e);
    });

    // Initialize AdMob immediately, in parallel with consent flow.
    // AdMob GMS SDK will respect UMP consent state when making ad requests.
    initializeAdMob().catch((e) => {
      console.error('[AdInitializer] AdMob init failed', e);
    });
  }, [removeAds]);

  // Update bannerAllowed whenever levelProgress changes
  useEffect(() => {
    if (!isNativeApp()) return;
    if (removeAds) {
      setBannerAllowed(false);
      return;
    }

    const highestCompleted = Object.entries(levelProgress).reduce((max, [key, val]) => {
      const num = parseInt(key, 10);
      if (val && val.stars > 0 && num > max) return num;
      return max;
    }, 0);

    const allowed = shouldShowBanner(highestCompleted);
    console.log('[AdInitializer] highestCompleted=', highestCompleted, 'bannerAllowed=', allowed);
    setBannerAllowed(allowed);
  }, [levelProgress, removeAds]);

  return null;
}
