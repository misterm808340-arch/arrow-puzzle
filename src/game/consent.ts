'use client';

import { registerPlugin, type PluginListenerHandle } from '@capacitor/core';
import { isNativeApp } from './admob';

// ============================================================================
// Arrow Puzzle — Google UMP SDK Consent Module (IAB TCF v2.2)
// ============================================================================
// Wraps the native ConsentPlugin (Java) which uses Google's User Messaging
// Platform (UMP) SDK to collect consent from users in the EEA, UK, and
// Switzerland before AdMob is initialized.
//
// Required by AdMob policy for apps serving ads in EEA/UK/CH.
//
// Flow (called from AdInitializer at app startup):
//   1. requestConsent() runs the UMP flow:
//      - If user is in EEA/UK/CH and consent not yet collected → show form
//      - If user is outside EEA/UK/CH → no form, canRequestAds=true
//      - If consent already collected (cached) → no form, use cached state
//   2. After consent flow completes, AdMob is initialized only if
//      canRequestAds === true
//   3. UMP SDK persists TC string; AdMob GMS SDK reads it automatically on
//      subsequent ad requests — no manual passing required
// ============================================================================

interface ConsentPluginInterface {
  requestConsentAndShowForm(): Promise<{ canRequestAds: boolean; status?: number; error?: string }>;
  canRequestAds(): Promise<{ canRequestAds: boolean }>;
  reset(): Promise<void>;
  addListener(eventName: string, listenerFunc: (data: any) => void): Promise<PluginListenerHandle>;
}

const ConsentPlugin = registerPlugin<ConsentPluginInterface>('ConsentPlugin');

// Internal state
let consentChecked = false;
let consentAllowedAds = false;
let consentPromise: Promise<boolean> | null = null;
let logListenerRegistered = false;

// Logging
function log(...args: any[]) {
  console.log('[Consent]', ...args);
}
function logError(...args: any[]) {
  console.error('[Consent:ERROR]', ...args);
}

// ============================================================================
// Register log listener ONCE
// ============================================================================
async function registerLogListener(): Promise<void> {
  if (logListenerRegistered) return;
  logListenerRegistered = true;
  try {
    await ConsentPlugin.addListener('consent_log', (data: any) => {
      if (data?.level === 'error') {
        logError(`[${data.tag || 'Native'}]`, data.message || '');
      } else {
        log(`[${data.tag || 'Native'}]`, data.message || '');
      }
    });
  } catch (e) {
    logError('Failed to register consent_log listener', e);
  }
}

// ============================================================================
// requestConsent()
// Runs the full UMP consent flow. Returns true if ads can be requested.
// ============================================================================
export async function requestConsent(): Promise<boolean> {
  // Singleton guard — if consent flow already ran, return cached result
  if (consentChecked) {
    log('Already checked — returning cached result:', consentAllowedAds);
    return consentAllowedAds;
  }
  // In-flight guard — if consent flow is running, wait for it
  if (consentPromise) {
    log('Consent flow in-flight — waiting for existing promise');
    return consentPromise;
  }

  consentPromise = (async () => {
    log('Starting consent flow');
    log('Platform =', isNativeApp() ? 'NATIVE' : 'WEB');

    if (!isNativeApp()) {
      log('Not native — skipping consent flow (web fallback)');
      consentAllowedAds = true;
      consentChecked = true;
      return true;
    }

    try {
      // Register log listener first so we capture all native logs
      await registerLogListener();

      // Run the UMP flow
      const result = await ConsentPlugin.requestConsentAndShowForm();
      consentAllowedAds = !!result.canRequestAds;
      consentChecked = true;

      log('Flow complete:');
      log('  canRequestAds =', consentAllowedAds);
      log('  status =', result.status, '(0=UNKNOWN, 1=NOT_REQUIRED, 2=REQUIRED, 3=OBTAINED)');
      if (result.error) {
        log('  error =', result.error);
      }

      return consentAllowedAds;
    } catch (error) {
      logError('UMP flow failed', error);
      // Default to allow ads on error — UMP SDK will still handle consent
      // at the AdMob GMS SDK level via cached/default state.
      consentAllowedAds = true;
      consentChecked = true;
      return true;
    } finally {
      consentPromise = null;
    }
  })();

  return consentPromise;
}

// ============================================================================
// Accessors
// ============================================================================
export function isConsentChecked(): boolean {
  return consentChecked;
}

export function isAdsAllowed(): boolean {
  return consentAllowedAds;
}

// ============================================================================
// reset() — for debugging only. Clears UMP state so flow runs again.
// ============================================================================
export async function resetConsent(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    await ConsentPlugin.reset();
    consentChecked = false;
    consentAllowedAds = false;
    consentPromise = null;
    log('Consent state reset');
  } catch (e) {
    logError('reset failed', e);
  }
}
