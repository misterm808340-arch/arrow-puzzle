package com.arrowpuzzlegame.arrowpuzzlefree;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Register ConsentPlugin (Google UMP SDK) for IAB TCF v2.2 compliance
        // AdMob GMS SDK reads TC string from SharedPreferences automatically.
        registerPlugin(ConsentPlugin.class);
        // Register AdMobPlugin (Google Mobile Ads SDK — banner, interstitial, rewarded)
        registerPlugin(AdMobPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
