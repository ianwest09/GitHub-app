# Keep JavascriptInterface methods reachable when minification is enabled.
-keepclassmembers class za.co.portalfred.christmaslunch.WebAppInterface {
    @android.webkit.JavascriptInterface <methods>;
}
