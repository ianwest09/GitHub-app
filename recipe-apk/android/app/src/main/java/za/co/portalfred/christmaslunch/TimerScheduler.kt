package za.co.portalfred.christmaslunch

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build

/** Exact alarms survive app kill, Doze and (with BootReceiver) a reboot. */
object TimerScheduler {
    private const val PREFS = "christmas_timers"
    private const val KEY_CODES = "codes"
    private val labelKey = { code: Int -> "label.$code" }
    private val atKey = { code: Int -> "at.$code" }

    private fun prefs(context: Context) = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    fun canScheduleExactAlarms(context: Context): Boolean =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            context.getSystemService(AlarmManager::class.java).canScheduleExactAlarms()
        } else {
            true
        }

    fun schedule(context: Context, label: String, minutes: Int, code: Int): Boolean {
        if (minutes <= 0) return false
        return scheduleAt(context, label, System.currentTimeMillis() + minutes * 60_000L, code)
    }

    private fun scheduleAt(context: Context, label: String, triggerAt: Long, code: Int): Boolean {
        val manager = context.getSystemService(AlarmManager::class.java)
        val pending = pendingIntent(context, label, code)
        val exact = canScheduleExactAlarms(context)
        if (exact) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                manager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pending)
            } else {
                manager.setExact(AlarmManager.RTC_WAKEUP, triggerAt, pending)
            }
        } else {
            // User has not granted "Alarms & reminders": a windowed alarm is the
            // documented fallback. WebAppInterface opens the settings screen.
            manager.setWindow(AlarmManager.RTC_WAKEUP, triggerAt, 10 * 60_000L, pending)
        }
        val p = prefs(context)
        val codes = (p.getStringSet(KEY_CODES, emptySet()) ?: emptySet()).toMutableSet()
        codes.add(code.toString())
        p.edit()
            .putStringSet(KEY_CODES, codes)
            .putString(labelKey(code), label)
            .putLong(atKey(code), triggerAt)
            .apply()
        return exact
    }

    fun cancel(context: Context, code: Int) {
        context.getSystemService(AlarmManager::class.java).cancel(pendingIntent(context, "", code))
        forget(context, code)
    }

    fun cancelAll(context: Context) {
        val p = prefs(context)
        val codes = (p.getStringSet(KEY_CODES, emptySet()) ?: emptySet()).mapNotNull { it.toIntOrNull() }
        codes.forEach { cancel(context, it) }
        p.edit().clear().apply()
    }

    fun forget(context: Context, code: Int) {
        val p = prefs(context)
        val codes = (p.getStringSet(KEY_CODES, emptySet()) ?: emptySet()).toMutableSet()
        codes.remove(code.toString())
        p.edit()
            .putStringSet(KEY_CODES, codes)
            .remove(labelKey(code))
            .remove(atKey(code))
            .apply()
    }

    fun restore(context: Context) {
        val p = prefs(context)
        val now = System.currentTimeMillis()
        val codes = (p.getStringSet(KEY_CODES, emptySet()) ?: emptySet()).mapNotNull { it.toIntOrNull() }
        for (code in codes) {
            val at = p.getLong(atKey(code), 0L)
            if (at <= now) {
                forget(context, code)
                continue
            }
            scheduleAt(context, p.getString(labelKey(code), "Timer") ?: "Timer", at, code)
        }
    }

    private fun pendingIntent(context: Context, label: String, code: Int): PendingIntent {
        val intent = Intent(context, TimerReceiver::class.java)
            .putExtra(TimerReceiver.EXTRA_LABEL, label)
            .putExtra(TimerReceiver.EXTRA_CODE, code)
        return PendingIntent.getBroadcast(
            context,
            code,
            intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )
    }
}
