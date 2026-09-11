'use client';

import { registerPlugin } from '@capacitor/core';

// ============================================================================
// Arrow Puzzle — Google AdMob Integration
// ============================================================================
// Wraps the native AdMobPlugin (Java) which uses Google Mobile Ads SDK 23.x.
//
// Ad network: Google AdMob
// App ID:     ca-app-pub-4359575771288892~3747572265
// Placements:
//   - Banner:       ca-app-pub-4359575771288892/3918850621
//   - Interstitial:  ca-app-pub-4359575771288892/5070833545
//   - Rewarded:      ca-app-pub-4359575771288892/3075225597
//
// Behaviour:
//   - initialize() runs on app startup (via AdInitializer component)
//   - Interstitial preloads immediately after init
//   - Rewarded preloads immediately after init
//   - Banner shows only when bannerAllowed=true (level-20 rule)
//   - Auto-retry: failed loads retry after 30s
//   - Auto-reload: dismissed/closed ads reload the next ad
//
// Consent: Google UMP SDK (separate ConsentPlugin) handles IAB TCF v2.2
// consent for EEA/UK/CH users. AdMob GMS SDK reads the TC string from
// SharedPreferences automatically — no manual passing required.
// ============================================================================

// ===== AdMob Capacitor plugin interface =====
interface AdMobPluginInterface {
  initialize(options: { testMode: boolean }): Promise<{ success: boolean; alreadyInitialized?: boolean }>;
  isInitialized(): Promise<{ value: boolean }>;
  isInterstitialReady(): Promise<{ value: boolean }>;
  isRewardedReady(): Promise<{ value: boolean }>;
  isBannerShowing(): Promise<{ value: boolean }>;
  loadInterstitial(): Promise<void>;
  showInterstitial(): Promise<void>;
  loadRewarded(): Promise<void>;
  showRewarded(): Promise<void>;
  showBanner(): Promise<void>;
  hideBanner(): Promise<void>;
  addListener(eventName: string, listener: (data: any) => void): Promise<any>;
}

const AdMobPlugin = registerPlugin<AdMobPluginInterface>('AdMobPlugin');

// ===== Ad unit IDs (PRODUCTION) =====
export const ADMOB_APP_ID = 'ca-app-pub-4359575771288892~3747572265';
export const ADMOB_BANNER_ID = 'ca-app-pub-4359575771288892/3918850621';
export const ADMOB_INTERSTITIAL_ID = 'ca-app-pub-4359575771288892/5070833545';
export const ADMOB_REWARDED_ID = 'ca-app-pub-4359575771288892/3075225597';

// ===== Internal state (mirrored from native events for sync UI access) =====
let isInitialized = false;
let bannerShowing = false;
let bannerAllowed = false; // controlled by level-20 rule
let interstitialReady = false;
let rewardedReady = false;
let initializingPromise: Promise<void> | null = null;
let listenersRegistered = false;

// Show-in-flight promise resolvers (resolved when ad closes)
let interstitialShowResolve: ((v: boolean) => void) | null = null;
let rewardedShowResolve: ((v: { rewarded: boolean; type?: string; amount?: number }) => void) | null = null;
let interstitialShowTimeout: ReturnType<typeof setTimeout> | null = null;
let rewardedShowTimeout: ReturnType<typeof setTimeout> | null = null;

// Ad rules constants are computed below based on IS_TEST_MODE.

// ============================================================================
// Logging helper — filterable via `adb logcat | grep AdMob`
// ============================================================================
function log(tag: string, ...args: any[]) {
  console.log(`[AdMob:${tag}]`, ...args);
}
function logError(tag: string, ...args: any[]) {
  console.error(`[AdMob:${tag}:ERROR]`, ...args);
}

// ============================================================================
// Visibility rules (UI-level — do NOT block ad requests)
// ============================================================================
//
// IMPORTANT (v1.9.1): The interstitial trigger has been relaxed from
// "every 5 levels after level 20" to "every level after level 3".
// This is so you can verify interstitial impressions without having to
// play through 20 levels. Once you've confirmed ads are working, you can
// tighten this back to the production rules below.
//
// PRODUCTION rules (uncomment to restore):
//   const INTERSTITIAL_INTERVAL = 5;
//   const INTERSTITIAL_START_LEVEL = 20;
// ============================================================================
const IS_TEST_MODE = ADMOB_BANNER_ID.startsWith('ca-app-pub-3940256099942544');
const BANNER_UNLOCK_LEVEL = IS_TEST_MODE ? 1 : 20;

// RELAXED for testing — interstitial shows on every level after level 3
const INTERSTITIAL_INTERVAL = 1;
const INTERSTITIAL_START_LEVEL = 3;

export function shouldShowBanner(highestCompletedLevel: number): boolean {
  return highestCompletedLevel >= BANNER_UNLOCK_LEVEL;
}

export function shouldShowInterstitial(completedLevel: number): boolean {
  if (completedLevel < INTERSTITIAL_START_LEVEL) return false;
  return (completedLevel - INTERSTITIAL_START_LEVEL) % INTERSTITIAL_INTERVAL === 0;
}

// Exported so other modules can know whether the app is in test mode
export const isTestMode = IS_TEST_MODE;

// ============================================================================
// Native platform detection
// ============================================================================
export function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const cap = (window as any).Capacitor;
    if (!cap) return false;
    if (typeof cap.isNativePlatform === 'function') {
      return !!cap.isNativePlatform();
    }
    if (typeof cap.getPlatform === 'function') {
      const platform = cap.getPlatform();
      return platform === 'android' || platform === 'ios';
    }
    return false;
  } catch {
    return false;
  }
}

// ============================================================================
// Register all event listeners ONCE
// ============================================================================
async function registerListeners(): Promise<void> {
  if (listenersRegistered) return;
  listenersRegistered = true;

  try {
    await AdMobPlugin.addListener('admob_initialized', (data: any) => {
      log('Init', 'Event: admob_initialized', JSON.stringify(data));
      if (data?.success) {
        isInitialized = true;
      } else {
        logError('Init', 'Initialization failed by native side', JSON.stringify(data));
      }
    });
  } catch (e) {
    logError('Init', 'Listener register failed: admob_initialized', e);
  }

  try {
    await AdMobPlugin.addListener('admob_interstitial_loaded', () => {
      interstitialReady = true;
      log('Interstitial', 'Loaded event');
    });
  } catch (e) {
    logError('Init', 'Listener register failed: admob_interstitial_loaded', e);
  }

  try {
    await AdMobPlugin.addListener('admob_interstitial_load_failed', (data: any) => {
      interstitialReady = false;
      logError('Interstitial', 'Load failed', JSON.stringify(data));
    });
  } catch (e) {
    logError('Init', 'Listener register failed: admob_interstitial_load_failed', e);
  }

  try {
    await AdMobPlugin.addListener('admob_interstitial_shown', () => {
      log('Interstitial', 'Show start');
    });
  } catch (e) {
    logError('Init', 'Listener register failed: admob_interstitial_shown', e);
  }

  try {
    await AdMobPlugin.addListener('admob_interstitial_closed', () => {
      interstitialReady = false;
      log('Interstitial', 'Closed — preloading next');
      if (interstitialShowResolve) {
        interstitialShowResolve(true);
        interstitialShowResolve = null;
        if (interstitialShowTimeout) {
          clearTimeout(interstitialShowTimeout);
          interstitialShowTimeout = null;
        }
      }
    });
  } catch (e) {
    logError('Init', 'Listener register failed: admob_interstitial_closed', e);
  }

  try {
    await AdMobPlugin.addListener('admob_rewarded_loaded', () => {
      rewardedReady = true;
      log('Rewarded', 'Loaded event');
    });
  } catch (e) {
    logError('Init', 'Listener register failed: admob_rewarded_loaded', e);
  }

  try {
    await AdMobPlugin.addListener('admob_rewarded_load_failed', (data: any) => {
      rewardedReady = false;
      logError('Rewarded', 'Load failed', JSON.stringify(data));
    });
  } catch (e) {
    logError('Init', 'Listener register failed: admob_rewarded_load_failed', e);
  }

  try {
    await AdMobPlugin.addListener('admob_rewarded_shown', () => {
      log('Rewarded', 'Show start');
    });
  } catch (e) {
    logError('Init', 'Listener register failed: admob_rewarded_shown', e);
  }

  try {
    await AdMobPlugin.addListener('admob_rewarded_closed', (data: any) => {
      rewardedReady = false;
      const earned = data?.rewarded === true;
      log('Rewarded', 'Closed — earned=' + earned + ' — preloading next');
      if (rewardedShowResolve) {
        rewardedShowResolve({
          rewarded: earned,
          type: earned ? data?.type : undefined,
          amount: earned ? data?.amount : undefined,
        });
        rewardedShowResolve = null;
        if (rewardedShowTimeout) {
          clearTimeout(rewardedShowTimeout);
          rewardedShowTimeout = null;
        }
      }
    });
  } catch (e) {
    logError('Init', 'Listener register failed: admob_rewarded_closed', e);
  }

  try {
    await AdMobPlugin.addListener('admob_banner_loaded', () => {
      log('Banner', 'Loaded event');
    });
  } catch (e) {
    logError('Init', 'Listener register failed: admob_banner_loaded', e);
  }

  try {
    await AdMobPlugin.addListener('admob_banner_failed', (data: any) => {
      logError('Banner', 'Failed to load', JSON.stringify(data));
    });
  } catch (e) {
    logError('Init', 'Listener register failed: admob_banner_failed', e);
  }

  try {
    await AdMobPlugin.addListener('admob_log', (data: any) => {
      const msg = `[AdMob:${data?.tag ?? 'Native'}] ${data?.message ?? ''}`;
      if (data?.level === 'error') {
        console.error(msg);
      } else {
        console.log(msg);
      }
    });
  } catch (e) {
    // Silent — non-critical listener
  }

  log('Init', 'All event listeners registered');
}

// ============================================================================
// Initialize AdMob — runs ONCE on app startup
// ============================================================================
export async function initializeAdMob(): Promise<void> {
  if (isInitialized) return;
  if (initializingPromise) return initializingPromise;

  initializingPromise = (async () => {
    log('Init', 'Starting AdMob initialize()');
    log('Init', 'Platform =', isNativeApp() ? 'NATIVE' : 'WEB');
    log('Init', 'App ID =', ADMOB_APP_ID);
    log('Init', 'Banner =', ADMOB_BANNER_ID);
    log('Init', 'Interstitial =', ADMOB_INTERSTITIAL_ID);
    log('Init', 'Rewarded =', ADMOB_REWARDED_ID);
    log('Init', 'testMode = false (production)');

    try {
      // Register listeners FIRST so we catch all events
      await registerListeners();

      // Initialize SDK — returns immediately; native side fires admob_initialized
      // event when init completes (which triggers preload of interstitial + rewarded).
      await AdMobPlugin.initialize({ testMode: false });
      isInitialized = true;
      log('Init', 'initialize() call returned — waiting for native confirmation');

      // If banner was already requested before init completed, show it now.
      if (bannerAllowed) {
        try {
          await showBannerAd();
        } catch (e) {
          logError('Init', 'Deferred banner show failed', e);
        }
      }
    } catch (error) {
      logError('Init', 'FAILED', error);
      isInitialized = false;
      throw error;
    } finally {
      initializingPromise = null;
    }
  })();

  return initializingPromise;
}

// Alias for code clarity
export const initializeAds = initializeAdMob;

// ============================================================================
// Banner Ad
// ============================================================================
export async function showBannerAd(): Promise<void> {
  log('Banner', 'showBannerAd() called. bannerShowing=', bannerShowing, 'bannerAllowed=', bannerAllowed);

  if (bannerShowing) {
    log('Banner', 'Already showing, skipping');
    return;
  }
  if (!bannerAllowed) {
    log('Banner', 'Not allowed yet (level-20 rule). Init will run anyway.');
    try { await initializeAdMob(); } catch {}
    return;
  }

  try {
    await initializeAdMob();
    await AdMobPlugin.showBanner();
    bannerShowing = true;
    log('Banner', 'showBanner() succeeded');
  } catch (error) {
    logError('Banner', 'showBanner() failed', error);
  }
}

export async function hideBannerAd(): Promise<void> {
  if (!bannerShowing) return;
  try {
    await AdMobPlugin.hideBanner();
    bannerShowing = false;
    log('Banner', 'Hidden');
  } catch (error) {
    logError('Banner', 'Hide failed', error);
  }
}

export async function removeBannerAd(): Promise<void> {
  try {
    await AdMobPlugin.hideBanner();
    bannerShowing = false;
    log('Banner', 'Removed');
  } catch (error) {
    logError('Banner', 'Remove failed', error);
  }
}

export function isBannerShowing(): boolean {
  return bannerShowing;
}

export function isInterstitialReady(): boolean {
  return interstitialReady;
}

export function isRewardedReady(): boolean {
  return rewardedReady;
}

export function isAdMobInitialized(): boolean {
  return isInitialized;
}

/** Called by AdBanner component when the level-20 rule flips. */
export function setBannerAllowed(allowed: boolean): void {
  log('Banner', `setBannerAllowed(${allowed}) — was ${bannerAllowed}`);
  if (allowed === bannerAllowed) return;
  bannerAllowed = allowed;
  if (allowed) {
    showBannerAd();
  } else {
    hideBannerAd();
  }
}

// ============================================================================
// Interstitial Ad
// ============================================================================
export async function prepareInterstitialAd(): Promise<void> {
  log('Interstitial', 'prepareInterstitialAd() called');
  try {
    await initializeAdMob();
    await AdMobPlugin.loadInterstitial();
    log('Interstitial', 'loadInterstitial() succeeded');
  } catch (error) {
    logError('Interstitial', 'loadInterstitial() failed', error);
  }
}

export async function showInterstitialAd(): Promise<boolean> {
  log('Interstitial', 'showInterstitialAd() called. Ready=', interstitialReady);
  try {
    if (!interstitialReady) {
      log('Interstitial', 'Not ready — preparing on-demand');
      await prepareInterstitialAd();
      // Wait up to 10s for load
      for (let i = 0; i < 50 && !interstitialReady; i++) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    if (interstitialReady) {
      // Create a promise that resolves when the close event fires.
      const showPromise = new Promise<boolean>((resolve) => {
        interstitialShowResolve = resolve;
        // Fallback timeout: resolve true after 60s (in case close event is missed)
        interstitialShowTimeout = setTimeout(() => {
          if (interstitialShowResolve) {
            log('Interstitial', 'Timeout 60s — resolving true');
            interstitialShowResolve(true);
            interstitialShowResolve = null;
            interstitialShowTimeout = null;
          }
        }, 60000);
      });

      await AdMobPlugin.showInterstitial();
      log('Interstitial', 'showInterstitial() called');
      return showPromise;
    }

    logError('Interstitial', 'Not ready after on-demand prepare');
    return false;
  } catch (error) {
    logError('Interstitial', 'showInterstitial() failed', error);
    interstitialReady = false;
    return false;
  }
}

// ============================================================================
// Rewarded Ad
// ============================================================================
export async function prepareRewardedAd(): Promise<void> {
  log('Rewarded', 'prepareRewardedAd() called');
  try {
    await initializeAdMob();
    await AdMobPlugin.loadRewarded();
    log('Rewarded', 'loadRewarded() succeeded');
  } catch (error) {
    logError('Rewarded', 'loadRewarded() failed', error);
  }
}

export async function showRewardedAd(): Promise<{ rewarded: boolean; type?: string; amount?: number }> {
  log('Rewarded', 'showRewardedAd() called. Ready=', rewardedReady);
  try {
    if (!rewardedReady) {
      log('Rewarded', 'Not ready — preparing on-demand');
      await prepareRewardedAd();
      for (let i = 0; i < 50 && !rewardedReady; i++) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    if (rewardedReady) {
      const showPromise = new Promise<{ rewarded: boolean; type?: string; amount?: number }>((resolve) => {
        rewardedShowResolve = resolve;
        rewardedShowTimeout = setTimeout(() => {
          if (rewardedShowResolve) {
            log('Rewarded', 'Timeout 60s — resolving not rewarded');
            rewardedShowResolve({ rewarded: false });
            rewardedShowResolve = null;
            rewardedShowTimeout = null;
          }
        }, 60000);
      });

      await AdMobPlugin.showRewarded();
      log('Rewarded', 'showRewarded() called');
      return showPromise;
    }

    logError('Rewarded', 'Not ready after on-demand prepare');
    return { rewarded: false };
  } catch (error) {
    logError('Rewarded', 'showRewarded() failed', error);
    rewardedReady = false;
    return { rewarded: false };
  }
}
