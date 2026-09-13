package com.arrowpuzzlegame.arrowpuzzlefree;

import android.app.Activity;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.google.android.ump.ConsentForm;
import com.google.android.ump.ConsentInformation;
import com.google.android.ump.ConsentRequestParameters;
import com.google.android.ump.FormError;
import com.google.android.ump.UserMessagingPlatform;

/**
 * ConsentPlugin
 * =============
 * Capacitor plugin wrapping Google's User Messaging Platform (UMP) SDK 3.0.0
 * to collect IAB TCF v2.2 consent from users in EEA, UK, and Switzerland
 * before AdMob requests ads.
 *
 * Required by AdMob policy for apps serving ads in EEA/UK/CH regions.
 *
 * UMP 3.0.0 API notes:
 *   - OnConsentFormLoadSuccessListener is nested inside UserMessagingPlatform
 *     and ONLY contains onConsentFormLoadSuccess(ConsentForm).
 *   - OnConsentFormLoadFailureListener is a separate nested interface inside
 *     UserMessagingPlatform containing onConsentFormLoadFailure(FormError).
 *   - loadConsentForm() takes 3 args: Context, successListener, failureListener.
 *   - OnConsentFormDismissedListener is nested inside ConsentForm.
 *
 * Flow:
 *   1. JS calls requestConsentAndShowForm()
 *   2. Plugin requests consent info update from UMP backend
 *   3. If consent form is required, plugin loads and shows it
 *   4. Plugin returns { canRequestAds, status }
 *   5. AdMob GMS SDK reads the TC string from SharedPreferences automatically
 *
 * Status codes (ConsentInformation.ConsentStatus):
 *   0 = UNKNOWN, 1 = NOT_REQUIRED, 2 = REQUIRED, 3 = OBTAINED
 */
@CapacitorPlugin(name = "ConsentPlugin")
public class ConsentPlugin extends Plugin {

    private static final String TAG = "ConsentPlugin";
    private ConsentInformation consentInformation;

    private void log(String msg) {
        Log.i(TAG, "[Consent] " + msg);
        try {
            JSObject payload = new JSObject();
            payload.put("tag", "Consent");
            payload.put("message", msg);
            notifyListeners("consent_log", payload);
        } catch (Exception ignored) {}
    }

    private void logError(String msg) {
        Log.e(TAG, "[Consent:ERROR] " + msg);
        try {
            JSObject payload = new JSObject();
            payload.put("tag", "Consent");
            payload.put("message", msg);
            payload.put("level", "error");
            notifyListeners("consent_log", payload);
        } catch (Exception ignored) {}
    }

    @PluginMethod
    public void requestConsentAndShowForm(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity is null");
            return;
        }

        consentInformation = UserMessagingPlatform.getConsentInformation(activity);

        try {
            // Tag for under-age of consent = false (this is not a children's app)
            ConsentRequestParameters params = new ConsentRequestParameters.Builder()
                .setTagForUnderAgeOfConsent(false)
                .build();

            log("Requesting consent info update");

            consentInformation.requestConsentInfoUpdate(
                activity,
                params,
                new ConsentInformation.OnConsentInfoUpdateSuccessListener() {
                    @Override
                    public void onConsentInfoUpdateSuccess() {
                        int status = consentInformation.getConsentStatus();
                        log("Consent info updated. status=" + status
                            + " (0=UNKNOWN, 1=NOT_REQUIRED, 2=REQUIRED, 3=OBTAINED)");
                        log("canRequestAds=" + consentInformation.canRequestAds());
                        log("isConsentFormAvailable="
                            + consentInformation.isConsentFormAvailable());

                        // If consent form is available and required, show it.
                        if (consentInformation.isConsentFormAvailable()
                            && status == ConsentInformation.ConsentStatus.REQUIRED) {
                            log("Consent form required — loading form");
                            // UMP 3.0.0: loadConsentForm takes 3 args:
                            //   Context, OnConsentFormLoadSuccessListener, OnConsentFormLoadFailureListener
                            UserMessagingPlatform.loadConsentForm(
                                activity,
                                new UserMessagingPlatform.OnConsentFormLoadSuccessListener() {
                                    @Override
                                    public void onConsentFormLoadSuccess(ConsentForm consentForm) {
                                        log("Consent form loaded — showing");
                                        // OnConsentFormDismissedListener is nested inside ConsentForm
                                        consentForm.show(activity,
                                            new ConsentForm.OnConsentFormDismissedListener() {
                                                @Override
                                                public void onConsentFormDismissed(FormError error) {
                                                    if (error != null) {
                                                        logError("Consent form dismissed with error: "
                                                            + error.getErrorCode() + " " + error.getMessage());
                                                    } else {
                                                        log("Consent form dismissed. New status="
                                                            + consentInformation.getConsentStatus()
                                                            + " canRequestAds=" + consentInformation.canRequestAds());
                                                    }
                                                    try {
                                                        call.resolve(new JSObject()
                                                            .put("canRequestAds", consentInformation.canRequestAds())
                                                            .put("status", consentInformation.getConsentStatus())
                                                            .put("error", error != null ? error.getMessage() : null));
                                                    } catch (Exception ignored) {}
                                                }
                                            });
                                    }
                                },
                                new UserMessagingPlatform.OnConsentFormLoadFailureListener() {
                                    @Override
                                    public void onConsentFormLoadFailure(FormError error) {
                                        logError("Consent form load failed: "
                                            + error.getErrorCode() + " " + error.getMessage());
                                        // Default to allow ads on form-load error — AdMob SDK
                                        // will respect cached consent state if present.
                                        try {
                                            call.resolve(new JSObject()
                                                .put("canRequestAds", consentInformation.canRequestAds())
                                                .put("status", consentInformation.getConsentStatus())
                                                .put("error", error.getMessage()));
                                        } catch (Exception ignored) {}
                                    }
                                });
                        } else {
                            log("Consent form not required — canRequestAds="
                                + consentInformation.canRequestAds());
                            try {
                                call.resolve(new JSObject()
                                    .put("canRequestAds", consentInformation.canRequestAds())
                                    .put("status", consentInformation.getConsentStatus()));
                            } catch (Exception ignored) {}
                        }
                    }
                },
                new ConsentInformation.OnConsentInfoUpdateFailureListener() {
                    @Override
                    public void onConsentInfoUpdateFailure(FormError error) {
                        logError("Consent info update failed: "
                            + error.getErrorCode() + " " + error.getMessage());
                        // Default to allow ads on info-update failure — AdMob SDK
                        // will respect cached consent state if present.
                        try {
                            call.resolve(new JSObject()
                                .put("canRequestAds", true)
                                .put("status", ConsentInformation.ConsentStatus.UNKNOWN)
                                .put("error", error.getMessage()));
                        } catch (Exception ignored) {}
                    }
                });
        } catch (Exception e) {
            logError("requestConsentAndShowForm threw: " + e.getMessage());
            call.reject("Consent flow failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void canRequestAds(PluginCall call) {
        if (consentInformation == null) {
            call.resolve(new JSObject().put("canRequestAds", true));
            return;
        }
        call.resolve(new JSObject().put("canRequestAds", consentInformation.canRequestAds()));
    }

    @PluginMethod
    public void reset(PluginCall call) {
        if (consentInformation != null) {
            consentInformation.reset();
            log("Consent state reset");
        }
        call.resolve();
    }
}
