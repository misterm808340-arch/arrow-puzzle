package com.arrowpuzzlegame.arrowpuzzlefree;

import android.app.Activity;
import android.util.Log;
import android.view.Gravity;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.AdView;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.initialization.InitializationStatus;
import com.google.android.gms.ads.initialization.OnInitializationCompleteListener;
import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;
import com.google.android.gms.ads.rewarded.RewardedAd;
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback;
import com.google.android.gms.ads.rewarded.RewardItem;

/**
 * AdMobPlugin
 * ===========
 * Capacitor plugin wrapping Google Mobile Ads SDK 23.x for serving banner,
 * interstitial, and rewarded video ads.
 *
 * Ad network: Google AdMob
 * App ID:     ca-app-pub-4359575771288892~3747572265
 *   (declared in AndroidManifest.xml as APPLICATION_ID meta-data)
 * Ad units (declared as constants below):
 *   - Banner:       ca-app-pub-4359575771288892/3918850621
 *   - Interstitial:  ca-app-pub-4359575771288892/5070833545
 *   - Rewarded:      ca-app-pub-4359575771288892/3075225597
 *
 * Methods exposed to JS:
 *   - initialize({ testMode }) — initializes GMS Ads SDK
 *   - isInitialized()           — returns { value: boolean }
 *   - isInterstitialReady()     — returns { value: boolean }
 *   - isRewardedReady()         — returns { value: boolean }
 *   - isBannerShowing()         — returns { value: boolean }
 *   - loadInterstitial()        — preload interstitial
 *   - showInterstitial()        — show interstitial
 *   - loadRewarded()            — preload rewarded
 *   - showRewarded()            — show rewarded
 *   - showBanner()              — show banner at bottom of screen
 *   - hideBanner()              — hide + destroy banner
 *
 * Events forwarded to JS (subscribe via AdMobPlugin.addListener):
 *   - admob_initialized            { success, error?, message? }
 *   - admob_interstitial_loaded    {}
 *   - admob_interstitial_load_failed { error, message }
 *   - admob_interstitial_shown     {}
 *   - admob_interstitial_closed    {}
 *   - admob_rewarded_loaded        {}
 *   - admob_rewarded_load_failed   { error, message }
 *   - admob_rewarded_shown         {}
 *   - admob_rewarded_closed        { rewarded, type?, amount? }
 *   - admob_banner_loaded          {}
 *   - admob_banner_failed          { error }
 *   - admob_log                    { tag, message, level? }
 *
 * Auto-retry: failed loads automatically retry after 30 seconds.
 * Auto-reload: dismissed/closed ads automatically reload the next ad.
 */
@CapacitorPlugin(name = "AdMobPlugin")
public class AdMobPlugin extends Plugin {

    private static final String TAG = "AdMobPlugin";

    // ===== Ad unit IDs (PRODUCTION) =====
    private static final String AD_UNIT_BANNER = "ca-app-pub-4359575771288892/3918850621";
    private static final String AD_UNIT_INTERSTITIAL = "ca-app-pub-4359575771288892/5070833545";
    private static final String AD_UNIT_REWARDED = "ca-app-pub-4359575771288892/3075225597";

    private boolean initialized = false;
    private boolean interstitialReady = false;
    private boolean rewardedReady = false;
    private boolean bannerShowing = false;
    private boolean zOrderFixApplied = false; // cached — only run the expensive fix once

    private InterstitialAd interstitialAd;
    private RewardedAd rewardedAd;
    private AdView bannerView;
    private android.webkit.WebView cachedWebView = null; // cached reference

    // =====================================================================
    // Logging helpers — forward to JS via admob_log event
    // =====================================================================
    private void log(String msg) {
        Log.i(TAG, "[AdMob] " + msg);
        try {
            JSObject payload = new JSObject();
            payload.put("tag", "AdMob");
            payload.put("message", msg);
            notifyListeners("admob_log", payload);
        } catch (Exception ignored) {}
    }

    private void logError(String msg) {
        Log.e(TAG, "[AdMob:ERROR] " + msg);
        try {
            JSObject payload = new JSObject();
            payload.put("tag", "AdMob");
            payload.put("message", msg);
            payload.put("level", "error");
            notifyListeners("admob_log", payload);
        } catch (Exception ignored) {}
    }

    // =====================================================================
    // initialize()
    // =====================================================================
    @PluginMethod
    public void initialize(PluginCall call) {
        if (initialized) {
            call.resolve(new JSObject().put("success", true).put("alreadyInitialized", true));
            return;
        }

        log("Starting AdMob initialize");
        log("App ID declared in AndroidManifest as APPLICATION_ID meta-data");
        log("Banner ad unit: " + AD_UNIT_BANNER);
        log("Interstitial ad unit: " + AD_UNIT_INTERSTITIAL);
        log("Rewarded ad unit: " + AD_UNIT_REWARDED);

        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity is null");
            return;
        }

        boolean testMode = call.getBoolean("testMode", false);
        log("testMode=" + testMode);

        try {
            // MobileAds.initialize is async; callback fires when complete.
            MobileAds.initialize(activity, new OnInitializationCompleteListener() {
                @Override
                public void onInitializationComplete(InitializationStatus status) {
                    initialized = true;
                    log("Initialization complete — preloading interstitial + rewarded");
                    try {
                        notifyListeners("admob_initialized",
                            new JSObject().put("success", true));
                    } catch (Exception ignored) {}

                    // Preload interstitial + rewarded
                    try {
                        loadInterstitialAd();
                    } catch (Exception e) {
                        logError("Preload interstitial failed: " + e.getMessage());
                    }
                    try {
                        loadRewardedAd();
                    } catch (Exception e) {
                        logError("Preload rewarded failed: " + e.getMessage());
                    }
                }
            });
            call.resolve(new JSObject().put("success", true));
        } catch (Exception e) {
            logError("MobileAds.initialize() threw: " + e.getMessage());
            call.reject("AdMob init failed: " + e.getMessage());
        }
    }

    // =====================================================================
    // State accessors
    // =====================================================================
    @PluginMethod
    public void isInitialized(PluginCall call) {
        call.resolve(new JSObject().put("value", initialized));
    }

    @PluginMethod
    public void isInterstitialReady(PluginCall call) {
        call.resolve(new JSObject().put("value", interstitialReady && interstitialAd != null));
    }

    @PluginMethod
    public void isRewardedReady(PluginCall call) {
        call.resolve(new JSObject().put("value", rewardedReady && rewardedAd != null));
    }

    @PluginMethod
    public void isBannerShowing(PluginCall call) {
        call.resolve(new JSObject().put("value", bannerShowing));
    }

    // =====================================================================
    // Interstitial: load + show
    // =====================================================================
    private void loadInterstitialAd() {
        if (!initialized) {
            logError("Cannot load interstitial — not initialized");
            return;
        }
        Activity activity = getActivity();
        if (activity == null) return;

        AdRequest adRequest = new AdRequest.Builder().build();
        InterstitialAd.load(activity, AD_UNIT_INTERSTITIAL, adRequest,
            new InterstitialAdLoadCallback() {
                @Override
                public void onAdLoaded(InterstitialAd ad) {
                    interstitialAd = ad;
                    interstitialReady = true;
                    log("Interstitial loaded");
                    try {
                        notifyListeners("admob_interstitial_loaded", new JSObject());
                    } catch (Exception ignored) {}

                    // Set full-screen callback so we know when it closes
                    ad.setFullScreenContentCallback(new FullScreenContentCallback() {
                        @Override
                        public void onAdShowedFullScreenContent() {
                            log(">>> Interstitial IMPRESSION: onAdShowedFullScreenContent fired — ad is now visible on screen <<<");
                            try {
                                notifyListeners("admob_interstitial_shown", new JSObject());
                            } catch (Exception ignored) {}
                        }

                        @Override
                        public void onAdDismissedFullScreenContent() {
                            interstitialAd = null;
                            interstitialReady = false;
                            log("Interstitial dismissed — preloading next");
                            try {
                                notifyListeners("admob_interstitial_closed", new JSObject());
                            } catch (Exception ignored) {}
                            // Preload next
                            loadInterstitialAd();
                        }

                        @Override
                        public void onAdFailedToShowFullScreenContent(AdError error) {
                            interstitialAd = null;
                            interstitialReady = false;
                            logError("Interstitial show FAILED: code=" + error.getCode()
                                + " msg=" + error.getMessage());
                            try {
                                notifyListeners("admob_interstitial_closed",
                                    new JSObject().put("error", error.getMessage()));
                            } catch (Exception ignored) {}
                            loadInterstitialAd();
                        }

                        @Override
                        public void onAdImpression() {
                            log(">>> Interstitial onAdImpression — AdMob dashboard will count this <<<");
                        }

                        @Override
                        public void onAdClicked() {
                            log("Interstitial ad clicked");
                        }
                    });
                }

                @Override
                public void onAdFailedToLoad(LoadAdError error) {
                    interstitialAd = null;
                    interstitialReady = false;
                    logError("Interstitial load failed: code=" + error.getCode()
                        + " msg=" + error.getMessage());
                    try {
                        notifyListeners("admob_interstitial_load_failed", new JSObject()
                            .put("error", String.valueOf(error.getCode()))
                            .put("message", error.getMessage()));
                    } catch (Exception ignored) {}
                    // Auto-retry after 30s
                    scheduleRetry(AD_UNIT_INTERSTITIAL, 30000);
                }
            });
    }

    @PluginMethod
    public void loadInterstitial(PluginCall call) {
        if (!initialized) {
            call.reject("AdMob not initialized");
            return;
        }
        try {
            loadInterstitialAd();
            call.resolve();
        } catch (Exception e) {
            call.reject("loadInterstitial failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void showInterstitial(PluginCall call) {
        if (!initialized) {
            call.reject("AdMob not initialized");
            return;
        }
        if (interstitialAd == null || !interstitialReady) {
            logError("showInterstitial called but ad not ready (interstitialAd=" + interstitialAd
                + " ready=" + interstitialReady + ")");
            call.reject("Interstitial not ready");
            return;
        }
        Activity activity = getActivity();
        if (activity == null) {
            logError("showInterstitial: Activity is null");
            call.reject("Activity is null");
            return;
        }
        try {
            log(">>> showInterstitial() calling interstitialAd.show(activity) — this should display full-screen ad on top of WebView <<<");
            interstitialAd.show(activity);
            call.resolve();
        } catch (Exception e) {
            logError("showInterstitial FAILED: " + e.getMessage());
            call.reject("showInterstitial failed: " + e.getMessage());
        }
    }

    // =====================================================================
    // Rewarded: load + show
    // =====================================================================
    private void loadRewardedAd() {
        if (!initialized) {
            logError("Cannot load rewarded — not initialized");
            return;
        }
        Activity activity = getActivity();
        if (activity == null) return;

        AdRequest adRequest = new AdRequest.Builder().build();
        RewardedAd.load(activity, AD_UNIT_REWARDED, adRequest,
            new RewardedAdLoadCallback() {
                @Override
                public void onAdLoaded(RewardedAd ad) {
                    rewardedAd = ad;
                    rewardedReady = true;
                    log("Rewarded loaded");
                    try {
                        notifyListeners("admob_rewarded_loaded", new JSObject());
                    } catch (Exception ignored) {}

                    ad.setFullScreenContentCallback(new FullScreenContentCallback() {
                        @Override
                        public void onAdShowedFullScreenContent() {
                            log(">>> Rewarded IMPRESSION: onAdShowedFullScreenContent fired — ad is now visible on screen <<<");
                            try {
                                notifyListeners("admob_rewarded_shown", new JSObject());
                            } catch (Exception ignored) {}
                        }

                        @Override
                        public void onAdDismissedFullScreenContent() {
                            rewardedAd = null;
                            rewardedReady = false;
                            log("Rewarded dismissed — preloading next");
                            try {
                                notifyListeners("admob_rewarded_closed",
                                    new JSObject().put("rewarded", lastRewardEarned)
                                        .put("type", lastRewardType)
                                        .put("amount", lastRewardAmount));
                            } catch (Exception ignored) {}
                            lastRewardEarned = false;
                            lastRewardType = null;
                            lastRewardAmount = 0;
                            loadRewardedAd();
                        }

                        @Override
                        public void onAdFailedToShowFullScreenContent(AdError error) {
                            rewardedAd = null;
                            rewardedReady = false;
                            logError("Rewarded show FAILED: code=" + error.getCode()
                                + " msg=" + error.getMessage());
                            try {
                                notifyListeners("admob_rewarded_closed",
                                    new JSObject().put("rewarded", false)
                                        .put("error", error.getMessage()));
                            } catch (Exception ignored) {}
                            loadRewardedAd();
                        }

                        @Override
                        public void onAdImpression() {
                            log(">>> Rewarded onAdImpression — AdMob dashboard will count this <<<");
                        }

                        @Override
                        public void onAdClicked() {
                            log("Rewarded ad clicked");
                        }
                    });
                }

                @Override
                public void onAdFailedToLoad(LoadAdError error) {
                    rewardedAd = null;
                    rewardedReady = false;
                    logError("Rewarded load failed: code=" + error.getCode()
                        + " msg=" + error.getMessage());
                    try {
                        notifyListeners("admob_rewarded_load_failed", new JSObject()
                            .put("error", String.valueOf(error.getCode()))
                            .put("message", error.getMessage()));
                    } catch (Exception ignored) {}
                    scheduleRetry(AD_UNIT_REWARDED, 30000);
                }
            });
    }

    // Last reward state — captured by the onUserEarnedReward callback fired
    // during the show() call, then forwarded when onAdDismissedFullScreen fires.
    private boolean lastRewardEarned = false;
    private String lastRewardType = null;
    private int lastRewardAmount = 0;

    @PluginMethod
    public void loadRewarded(PluginCall call) {
        if (!initialized) {
            call.reject("AdMob not initialized");
            return;
        }
        try {
            loadRewardedAd();
            call.resolve();
        } catch (Exception e) {
            call.reject("loadRewarded failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void showRewarded(PluginCall call) {
        if (!initialized) {
            call.reject("AdMob not initialized");
            return;
        }
        if (rewardedAd == null || !rewardedReady) {
            logError("showRewarded called but ad not ready (rewardedAd=" + rewardedAd
                + " ready=" + rewardedReady + ")");
            call.reject("Rewarded not ready");
            return;
        }
        Activity activity = getActivity();
        if (activity == null) {
            logError("showRewarded: Activity is null");
            call.reject("Activity is null");
            return;
        }
        try {
            log(">>> showRewarded() calling rewardedAd.show(activity, listener) — this should display full-screen rewarded ad on top of WebView <<<");
            // The OnUserEarnedRewardListener fires when the user has earned
            // the reward (typically after watching the full video).
            rewardedAd.show(activity, new com.google.android.gms.ads.OnUserEarnedRewardListener() {
                @Override
                public void onUserEarnedReward(RewardItem reward) {
                    lastRewardEarned = true;
                    lastRewardType = reward.getType();
                    lastRewardAmount = reward.getAmount();
                    log(">>> Reward EARNED: type=" + lastRewardType + " amount=" + lastRewardAmount + " <<<");
                }
            });
            call.resolve();
        } catch (Exception e) {
            logError("showRewarded FAILED: " + e.getMessage());
            call.reject("showRewarded failed: " + e.getMessage());
        }
    }

    // =====================================================================
    // Banner: show + hide
    // =====================================================================
    //
    // CAPACITOR-SPECIFIC BANNER VISIBILITY FIX (v1.9.0)
    // ==================================================
    //
    // Problem: AdMob dashboard shows ad requests (e.g., 45) with 100%
    // match rate but 0 impressions. This means ads are being fetched
    // successfully but never become visible to the user.
    //
    // Root cause: Capacitor's BridgeActivity creates a full-screen
    // WebView that fills the entire screen. When we addView() a banner
    // AdView, it ends up hidden behind the WebView — either because:
    //   (a) The WebView is opaque and covers the banner
    //   (b) The WebView is nested inside a Fragment container, so
    //       modifying its LayoutParams doesn't affect the actual layout
    //   (c) Capacitor re-layouts the WebView after our code runs,
    //       undoing our bottom margin
    //
    // Fix (v1.9.0): Multiple layers of defense:
    //   1. Recursively search the ENTIRE view tree for any WebView
    //      (not just direct children of android.R.id.content)
    //   2. Set the AdView's elevation HIGHER than the WebView (setElevation
    //      is more reliable than setZ on API 21+)
    //   3. Make the WebView's background TRANSPARENT so even if there's
    //      overlap, the banner shows through
    //   4. Post the layout change to the next frame using rootView.post()
    //      so it runs AFTER Capacitor's own layout pass
    //   5. Force requestLayout() + invalidate() on both views
    //   6. Log actual dimensions in onAdLoaded so we can verify the banner
    //      has a non-zero width/height
    // =====================================================================

    /**
     * Recursively search the view tree for a WebView.
     * Capacitor may nest the WebView inside a Fragment container, so
     * we can't assume it's a direct child of android.R.id.content.
     */
    private android.webkit.WebView findWebViewInViewHierarchy(android.view.View root) {
        if (root instanceof android.webkit.WebView) {
            return (android.webkit.WebView) root;
        }
        if (root instanceof ViewGroup) {
            ViewGroup group = (ViewGroup) root;
            for (int i = 0; i < group.getChildCount(); i++) {
                android.webkit.WebView found = findWebViewInViewHierarchy(group.getChildAt(i));
                if (found != null) return found;
            }
        }
        return null;
    }

    @PluginMethod
    public void showBanner(PluginCall call) {
        if (!initialized) {
            call.reject("AdMob not initialized");
            return;
        }
        // PERFORMANCE: if banner is already showing, return immediately.
        // Previously this created a NEW AdView on every call, ran the
        // expensive recursive WebView search, set transparent background,
        // forced requestLayout() — all of which tanked the frame rate.
        if (bannerShowing && bannerView != null) {
            call.resolve();
            return;
        }

        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity is null");
            return;
        }

        try {
            bannerView = new AdView(activity);
            bannerView.setAdUnitId(AD_UNIT_BANNER);
            bannerView.setAdSize(AdSize.BANNER); // 320x50 dp

            bannerView.setAdListener(new com.google.android.gms.ads.AdListener() {
                @Override
                public void onAdLoaded() {
                    int w = bannerView.getWidth();
                    int h = bannerView.getHeight();
                    log("Banner loaded — dimensions: " + w + "x" + h + "px");
                    if (w == 0 || h == 0) {
                        logError("Banner has ZERO dimensions — forcing requestLayout()");
                        bannerView.requestLayout();
                    }
                    try {
                        notifyListeners("admob_banner_loaded", new JSObject());
                    } catch (Exception ignored) {}
                }

                @Override
                public void onAdFailedToLoad(LoadAdError error) {
                    logError("Banner failed to load: code=" + error.getCode()
                        + " msg=" + error.getMessage()
                        + " (0=INTERNAL_ERROR, 1=INVALID_REQUEST, 2=NETWORK_ERROR, 3=NO_FILL)");
                    try {
                        notifyListeners("admob_banner_failed",
                            new JSObject().put("error", String.valueOf(error.getCode())));
                    } catch (Exception ignored) {}
                }

                @Override
                public void onAdImpression() {
                    log(">>> Banner IMPRESSION recorded <<<");
                }
            });

            // Banner LayoutParams: full width, wrap-content height, at bottom
            FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.WRAP_CONTENT
            );
            params.gravity = Gravity.BOTTOM;
            bannerView.setLayoutParams(params);

            // Add to the root content view
            ViewGroup contentView = (ViewGroup) activity.findViewById(android.R.id.content);
            if (contentView == null) {
                logError("android.R.id.content is null — cannot attach banner");
                call.reject("Content view is null");
                return;
            }
            contentView.addView(bannerView);

            // Calculate banner height in pixels (50dp for BANNER size)
            final int bannerHeightPx = (int) (50 * activity.getResources().getDisplayMetrics().density);

            // =========================================================
            // Z-ORDER FIX — only run ONCE per Activity lifetime.
            //
            // Previously this ran on every showBanner() call, which
            // happened every time the user navigated between screens
            // (Home → Game → LevelComplete → Game...). Each call:
            //   - Recursively searched the entire view tree for WebView
            //   - Set WebView background to transparent (forces redraw)
            //   - Called requestLayout() + invalidate() on WebView
            //
            // This caused severe frame drops and made the game feel
            // sluggish. Now we cache the WebView reference and skip
            // the fix if it's already been applied.
            // =========================================================
            if (!zOrderFixApplied) {
                contentView.post(() -> {
                    try {
                        // Cache the WebView reference (search once)
                        if (cachedWebView == null) {
                            cachedWebView = findWebViewInViewHierarchy(contentView);
                        }
                        android.webkit.WebView webView = cachedWebView;
                        if (webView != null) {
                            try {
                                webView.setBackgroundColor(android.graphics.Color.TRANSPARENT);
                            } catch (Exception ignored) {}

                            try {
                                ViewGroup.LayoutParams lp = webView.getLayoutParams();
                                if (lp instanceof FrameLayout.LayoutParams) {
                                    FrameLayout.LayoutParams flp = (FrameLayout.LayoutParams) lp;
                                    flp.bottomMargin = bannerHeightPx;
                                    flp.height = FrameLayout.LayoutParams.MATCH_PARENT;
                                    flp.gravity = Gravity.TOP;
                                    webView.setLayoutParams(flp);
                                } else if (lp instanceof ViewGroup.MarginLayoutParams) {
                                    ViewGroup.MarginLayoutParams mlp = (ViewGroup.MarginLayoutParams) lp;
                                    mlp.bottomMargin = bannerHeightPx;
                                    webView.setLayoutParams(mlp);
                                }
                            } catch (Exception e) {
                                logError("Could not set WebView margin: " + e.getMessage());
                            }

                            try {
                                webView.setElevation(0f);
                            } catch (Exception ignored) {}

                            log("WebView cached + Z-order fix applied (one-time)");
                        } else {
                            logError("WebView NOT FOUND in view hierarchy — banner may be hidden");
                        }

                        // Bring banner to front with high elevation
                        bannerView.setElevation(10f);
                        bannerView.bringToFront();
                        bannerView.setVisibility(android.view.View.VISIBLE);
                        bannerView.requestLayout();

                        zOrderFixApplied = true;
                    } catch (Exception e) {
                        logError("Z-order fix failed: " + e.getMessage());
                    }
                });
            } else {
                // Z-order fix already applied — just bring banner to front
                bannerView.setElevation(10f);
                bannerView.bringToFront();
                bannerView.setVisibility(android.view.View.VISIBLE);
            }

            // Load the ad
            bannerView.loadAd(new AdRequest.Builder().build());
            bannerShowing = true;
            log("showBanner() called — ad load initiated");
            call.resolve();
        } catch (Exception e) {
            logError("showBanner failed: " + e.getMessage());
            call.reject("showBanner failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void hideBanner(PluginCall call) {
        try {
            if (bannerView != null) {
                ViewGroup parent = (ViewGroup) bannerView.getParent();
                if (parent != null) {
                    parent.removeView(bannerView);
                }
                try {
                    bannerView.destroy();
                } catch (Exception ignored) {}
                bannerView = null;
            }
            bannerShowing = false;

            // Restore the WebView — remove bottom margin and restore background
            // Use cached reference (no recursive search needed)
            if (cachedWebView != null) {
                try {
                    cachedWebView.setBackgroundColor(android.graphics.Color.WHITE);
                } catch (Exception ignored) {}
                try {
                    ViewGroup.LayoutParams lp = cachedWebView.getLayoutParams();
                    if (lp instanceof FrameLayout.LayoutParams) {
                        ((FrameLayout.LayoutParams) lp).bottomMargin = 0;
                        cachedWebView.setLayoutParams(lp);
                    } else if (lp instanceof ViewGroup.MarginLayoutParams) {
                        ((ViewGroup.MarginLayoutParams) lp).bottomMargin = 0;
                        cachedWebView.setLayoutParams(lp);
                    }
                    cachedWebView.setElevation(0f);
                } catch (Exception ignored) {}
                log("WebView restored — bg=white, bottomMargin=0");
            }
            // Reset z-order flag so next showBanner() re-applies the fix
            zOrderFixApplied = false;
            cachedWebView = null;
            log("Banner hidden + destroyed");
            call.resolve();
        } catch (Exception e) {
            logError("hideBanner failed: " + e.getMessage());
            call.resolve();
        }
    }

    // =====================================================================
    // Schedule auto-retry for failed loads
    // =====================================================================
    private void scheduleRetry(String adUnitId, long delayMs) {
        android.os.Handler handler = new android.os.Handler(android.os.Looper.getMainLooper());
        handler.postDelayed(() -> {
            if (initialized) {
                log("Auto-retry load: " + adUnitId);
                try {
                    if (AD_UNIT_INTERSTITIAL.equals(adUnitId)) {
                        loadInterstitialAd();
                    } else if (AD_UNIT_REWARDED.equals(adUnitId)) {
                        loadRewardedAd();
                    }
                } catch (Exception e) {
                    logError("Auto-retry failed: " + e.getMessage());
                }
            }
        }, delayMs);
    }

    // =====================================================================
    // Lifecycle — clean up banner AdView when the Activity is destroyed.
    // Without this, the AdView leaks (it holds a strong reference to the
    // Activity via its parent ViewGroup) and can cause "Activity leaked"
    // warnings in logcat, plus "You must call destroy() on the AdView"
    // crashes when the Activity is recreated.
    // =====================================================================
    @Override
    public void handleOnDestroy() {
        try {
            if (bannerView != null) {
                ViewGroup parent = (ViewGroup) bannerView.getParent();
                if (parent != null) {
                    parent.removeView(bannerView);
                }
                try {
                    bannerView.destroy();
                } catch (Exception ignored) {}
                bannerView = null;
                bannerShowing = false;
                log("Banner destroyed on activity destroy");
            }
            // Restore WebView bottom margin to 0 (in case the banner was visible)
            Activity activity = getActivity();
            if (activity != null) {
                ViewGroup rootView = (ViewGroup) activity.findViewById(android.R.id.content);
                if (rootView != null) {
                    for (int i = 0; i < rootView.getChildCount(); i++) {
                        android.view.View child = rootView.getChildAt(i);
                        if (child instanceof android.webkit.WebView) {
                            android.webkit.WebView webView = (android.webkit.WebView) child;
                            FrameLayout.LayoutParams webParams = (FrameLayout.LayoutParams) webView.getLayoutParams();
                            if (webParams.bottomMargin != 0) {
                                webParams.bottomMargin = 0;
                                webView.setLayoutParams(webParams);
                            }
                            break;
                        }
                    }
                }
            }
        } catch (Exception e) {
            logError("handleOnDestroy failed: " + e.getMessage());
        }
        // Drop references to interstitial/rewarded ads so they can be GC'd.
        interstitialAd = null;
        rewardedAd = null;
        interstitialReady = false;
        rewardedReady = false;
        // Reset banner state so next Activity gets a fresh Z-order fix
        zOrderFixApplied = false;
        cachedWebView = null;
    }
}
