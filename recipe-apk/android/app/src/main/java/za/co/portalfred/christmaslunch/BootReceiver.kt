package za.co.portalfred.christmaslunch

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** Re-arm exact alarms after a reboot. Their labels/times live in SharedPreferences. */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            TimerScheduler.restore(context.applicationContext)
        }
    }
}
