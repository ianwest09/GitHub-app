package za.co.portalfred.christmaslunch

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import androidx.core.app.NotificationCompat

class TimerReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val label = intent.getStringExtra(EXTRA_LABEL) ?: "Timer"
        val code = intent.getIntExtra(EXTRA_CODE, -1)
        if (code >= 0) TimerScheduler.forget(context, code)

        val manager = context.getSystemService(NotificationManager::class.java)
        createChannel(context, manager)
        val open = PendingIntent.getActivity(
            context,
            code + 10_000,
            Intent(context, MainActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )
        val notification = NotificationCompat.Builder(context, CHANNEL)
            .setSmallIcon(R.drawable.ic_stat_cook)
            .setContentTitle(context.getString(R.string.app_name))
            .setContentText("$label — time's up")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(true)
            .setContentIntent(open)
            .setVibrate(longArrayOf(0, 250, 200, 250))
            .build()
        try {
            manager.notify(code, notification)
        } catch (_: SecurityException) {
            // POST_NOTIFICATIONS not granted: the in-app toast still fires.
        }
    }

    private fun createChannel(context: Context, manager: NotificationManager) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        if (manager.getNotificationChannel(CHANNEL) != null) return
        val channel = NotificationChannel(
            CHANNEL,
            context.getString(R.string.timer_channel),
            NotificationManager.IMPORTANCE_HIGH,
        ).apply {
            description = "Named cooking timers"
            enableVibration(true)
            vibrationPattern = longArrayOf(0, 250, 200, 250)
            setSound(
                RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM),
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build(),
            )
        }
        manager.createNotificationChannel(channel)
    }

    companion object {
        const val CHANNEL = "cook_timers"
        const val EXTRA_LABEL = "timer_label"
        const val EXTRA_CODE = "timer_code"
    }
}
