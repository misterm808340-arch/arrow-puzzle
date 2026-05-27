'use client';

import { AdMob, BannerAdSize, BannerAdPosition, AdOptions, RewardAdOptions } from '@capacitor-community/admob';

// ===== REAL ADMOB AD UNIT IDs =====
export const ADMOB_IDS = {
  // Publisher ID: 9252468896971676
  // App ID (for AndroidManifest - use your actual App ID from AdMob Console)
  APP_ID: 'ca-app-pub-9252468896971676~9252468896971676',

  // Banner Ad
  BANNER: 'ca-app-pub-9252468896971676/6731169696',

  // Interstitial Ad
  INTERSTITIAL: 'ca-app-pub-9252468896971676/9894035026',

  // Rewarded Video Ad
  REWARDED: 'ca-app-pub-9252468896971676/6385657557',
};

let isInitialized = false;
let bannerShowing = false;
let interstitialReady = false;
let rewardedReady = false;

// ===== Initialize AdMob =====
export async function initializeAdMob() {
  if (isInitialized) return;

  try {
    await AdMob.initialize({
      testingDevices: [],
      initializeForTesting: false,
    });
    isInitialized = true;
    console.log('[AdMob] Initialized successfully');
  } catch (error) {
    console.error('[AdMob] Initialization failed:', error);
    // Fallback: mark as initialized to avoid repeated attempts
    isInitialized = true;
  }
}

// ===== Banner Ad =====
export async function showBannerAd() {
  if (bannerShowing) return;

  try {
    await initializeAdMob();

    const options: AdOptions = {
      adId: ADMOB_IDS.BANNER,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: false,
    };

    await AdMob.showBanner(options);
    bannerShowing = true;
    console.log('[AdMob] Banner ad shown');
  } catch (error) {
    console.error('[AdMob] Banner ad failed:', error);
  }
}

export async function hideBannerAd() {
  if (!bannerShowing) return;

  try {
    await AdMob.hideBanner();
    bannerShowing = false;
    console.log('[AdMob] Banner ad hidden');
  } catch (error) {
    console.error('[AdMob] Hide banner failed:', error);
  }
}

export async function removeBannerAd() {
  try {
    await AdMob.removeBanner();
    bannerShowing = false;
    console.log('[AdMob] Banner ad removed');
  } catch (error) {
    console.error('[AdMob] Remove banner failed:', error);
  }
}

// ===== Interstitial Ad =====
export async function prepareInterstitialAd() {
  try {
    await initializeAdMob();

    const options: AdOptions = {
      adId: ADMOB_IDS.INTERSTITIAL,
      isTesting: false,
    };

    await AdMob.prepareInterstitial(options);
    interstitialReady = true;
    console.log('[AdMob] Interstitial prepared');
  } catch (error) {
    console.error('[AdMob] Prepare interstitial failed:', error);
  }
}

export async function showInterstitialAd(): Promise<boolean> {
  try {
    if (!interstitialReady) {
      await prepareInterstitialAd();
    }

    await AdMob.showInterstitial();
    interstitialReady = false;
    console.log('[AdMob] Interstitial shown');

    // Prepare the next interstitial in the background
    setTimeout(() => prepareInterstitialAd(), 30000);

    return true;
  } catch (error) {
    console.error('[AdMob] Show interstitial failed:', error);
    interstitialReady = false;
    return false;
  }
}

// ===== Rewarded Ad =====
export async function prepareRewardedAd() {
  try {
    await initializeAdMob();

    const options: RewardAdOptions = {
      adId: ADMOB_IDS.REWARDED,
      isTesting: false,
    };

    await AdMob.prepareRewardVideoAd(options);
    rewardedReady = true;
    console.log('[AdMob] Rewarded ad prepared');
  } catch (error) {
    console.error('[AdMob] Prepare rewarded failed:', error);
  }
}

export async function showRewardedAd(): Promise<{ rewarded: boolean; type?: string; amount?: number }> {
  try {
    if (!rewardedReady) {
      await prepareRewardedAd();
    }

    const result = await AdMob.showRewardVideoAd();
    rewardedReady = false;
    console.log('[AdMob] Rewarded ad shown, result:', result);

    // Prepare next rewarded ad in background
    setTimeout(() => prepareRewardedAd(), 30000);

    return {
      rewarded: true,
      type: result.type,
      amount: result.amount,
    };
  } catch (error) {
    console.error('[AdMob] Show rewarded failed:', error);
    rewardedReady = false;
    return { rewarded: false };
  }
}

// ===== Helper: Check if running in Capacitor native app =====
export function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as any).Capacitor?.isNativePlatform?.();
}
