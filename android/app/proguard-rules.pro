# =============================================================================
# Arrow Puzzle — ProGuard / R8 rules
# =============================================================================
# minifyEnabled is currently OFF for release builds, but these rules are
# provided so that future builds with R8 enabled will not break the Google
# Mobile Ads SDK, UMP SDK, or Capacitor plugin bridge.
# =============================================================================

# ---- Generic: keep line numbers for crash reports ----
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
-keepattributes Signature
-keepattributes *Annotation*
-keepattributes EnclosingMethod
-keepattributes InnerClasses
-keepattributes Exceptions

# =============================================================================
# Google Mobile Ads SDK (AdMob)
# =============================================================================
-keep class com.google.android.gms.ads.** { *; }
-keep interface com.google.android.gms.ads.** { *; }
-dontwarn com.google.android.gms.ads.**

# Mediation adapters (if any future adapters are added)
-keep class com.google.android.gms.ads.mediation.** { *; }

# =============================================================================
# Google User Messaging Platform (UMP) SDK — IAB TCF v2.2 consent
# =============================================================================
-keep class com.google.android.ump.** { *; }
-keep interface com.google.android.ump.** { *; }
-dontwarn com.google.android.ump.**

# Keep custom app classes
-keep class com.arrowpuzzlegame.arrowpuzzlefree.** { *; }

# =============================================================================
# Capacitor — keep plugin bridge (reflection-heavy)
# =============================================================================
-keep class com.getcapacitor.** { *; }
-keep interface com.getcapacitor.** { *; }
-keepclassmembers class * {
    @com.getcapacitor.annotation.* <methods>;
    @com.getcapacitor.annotation.* <fields>;
}
-keep class com.arrowpuzzlegame.arrowpuzzlefree.MainActivity { *; }
-keep class com.arrowpuzzlegame.arrowpuzzlefree.AdMobPlugin { *; }
-keep class com.arrowpuzzlegame.arrowpuzzlefree.ConsentPlugin { *; }

# =============================================================================
# WebView / JS bridge safety
# =============================================================================
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# =============================================================================
# AndroidX — generally safe with R8 defaults but be defensive
# =============================================================================
-dontwarn androidx.**

# =============================================================================
# OkHttp (used internally by GMS Ads SDK)
# =============================================================================
-dontwarn okhttp3.**
-dontwarn okio.**
