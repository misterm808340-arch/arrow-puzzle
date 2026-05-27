# Capacitor ProGuard Rules
-keep class com.getcapacitor.** { *; }
-keep class com.capacitorjs.** { *; }
-keep class com.arrowpuzzlegame.** { *; }

# WebView JavaScript Interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep Capacitor plugin classes
-keep class * extends com.getcapacitor.Plugin { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.annotation.CapacitorPlugin <methods>;
    @com.getcapacitor.annotation.PluginMethod <methods>;
}

# AdMob ProGuard Rules
-keep class com.google.android.gms.ads.** { *; }
-keep class com.google.android.gms.internal.** { *; }
-keep class com.google.android.gms.common.** { *; }
-dontwarn com.google.android.gms.ads.**

# Keep AdMob plugin
-keep class com.getcapacitor.community.admob.** { *; }

# Keep native bridge
-keep class com.getcapacitor.BridgeActivity { *; }
-keep class com.getcapacitor.CapacitorWebView { *; }

# General WebView rules
-keep class android.webkit.** { *; }
-keepclassmembers class * {
    @org.greenrobot.eventbus.Subscribe <methods>;
}

# Source file and line numbers for debugging
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
