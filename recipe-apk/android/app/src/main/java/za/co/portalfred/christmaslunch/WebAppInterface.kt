package za.co.portalfred.christmaslunch

import android.webkit.JavascriptInterface

/**
 * Injected as `window.Android`. Only the local https://appassets.androidplatform.net
 * page is loaded into this WebView; external links are opened in the browser.
 */
class WebAppInterface(private val activity: MainActivity) {

    @JavascriptInterface
    fun isAndroid(): Boolean = true

    @JavascriptInterface
    fun speak(text: String): Boolean {
        activity.runOnUiThread { activity.speak(text) }
        return true
    }

    @JavascriptInterface
    fun setTextZoom(percent: Int): Boolean {
        activity.runOnUiThread { activity.setTextZoom(percent) }
        return true
    }

    @JavascriptInterface
    fun keepScreenOn(enabled: Boolean): Boolean {
        activity.runOnUiThread { activity.keepScreenOn(enabled) }
        return true
    }

    @JavascriptInterface
    fun setCookMode(active: Boolean): Boolean {
        activity.runOnUiThread { activity.setCookMode(active) }
        return true
    }

    @JavascriptInterface
    fun scheduleTimer(label: String, minutes: Int, requestCode: Int): Boolean {
        activity.runOnUiThread { activity.requestNotificationPermission() }
        return TimerScheduler.schedule(activity, label, minutes, requestCode)
    }

    @JavascriptInterface
    fun cancelTimer(requestCode: Int): Boolean {
        TimerScheduler.cancel(activity, requestCode)
        return true
    }

    @JavascriptInterface
    fun cancelAllTimers(): Boolean {
        TimerScheduler.cancelAll(activity)
        return true
    }

    @JavascriptInterface
    fun requestNotificationPermission(): Boolean {
        activity.runOnUiThread { activity.requestNotificationPermission() }
        return true
    }

    @JavascriptInterface
    fun openBatterySettings(): Boolean {
        activity.runOnUiThread { activity.openBatterySettings() }
        return true
    }

    @JavascriptInterface
    fun openExactAlarmSettings(): Boolean {
        activity.runOnUiThread { activity.openExactAlarmSettings() }
        return true
    }

    @JavascriptInterface
    fun openNotificationSettings(): Boolean {
        activity.runOnUiThread { activity.openNotificationSettings() }
        return true
    }

    @JavascriptInterface
    fun printPage(): Boolean {
        activity.runOnUiThread { activity.printPage() }
        return true
    }

    @JavascriptInterface
    fun exportText(name: String, text: String, mimeType: String): Boolean {
        activity.runOnUiThread { activity.exportText(name, text, mimeType) }
        return true
    }

    @JavascriptInterface
    fun importText(): Boolean {
        activity.runOnUiThread { activity.importText() }
        return true
    }
}
