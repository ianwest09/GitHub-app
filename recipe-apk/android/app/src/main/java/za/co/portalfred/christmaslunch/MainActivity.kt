package za.co.portalfred.christmaslunch

import android.Manifest
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.print.PrintManager
import android.provider.Settings
import android.speech.tts.TextToSpeech
import android.util.Base64
import android.view.WindowManager
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.webkit.ServiceWorkerClientCompat
import androidx.webkit.ServiceWorkerControllerCompat
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewClientCompat
import androidx.webkit.WebViewFeature
import java.util.Locale

class MainActivity : ComponentActivity() {
    private lateinit var webView: WebView
    private lateinit var exportLauncher: ActivityResultLauncher<String>
    private lateinit var importLauncher: ActivityResultLauncher<Array<String>>
    private var pendingExportText = ""
    private var pendingExportName = "backup.json"
    private var tts: TextToSpeech? = null
    private var pendingSpeech: String? = null
    private var cookModeActive = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this).apply {
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                @Suppress("DEPRECATION")
                databaseEnabled = true
                allowFileAccess = false
                allowContentAccess = false
                setGeolocationEnabled(false)
                mediaPlaybackRequiresUserGesture = true
                javaScriptCanOpenWindowsAutomatically = false
                setSupportMultipleWindows(false)
                textZoom = 100
                cacheMode = WebSettings.LOAD_DEFAULT
            }
            webChromeClient = WebChromeClient()
        }
        setContentView(webView)

        val loader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView.webViewClient = object : WebViewClientCompat() {
            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest,
            ): WebResourceResponse? = loader.shouldInterceptRequest(request.url)

            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: WebResourceRequest,
            ): Boolean {
                val url = request.url
                if (url.scheme == "https" && url.host == ASSET_HOST) return false
                // Seed-source links are optional and open in the user's browser;
                // no web content other than our local assets gets the JS bridge.
                return try {
                    startActivity(Intent(Intent.ACTION_VIEW, url))
                    true
                } catch (_: ActivityNotFoundException) {
                    Toast.makeText(this@MainActivity, "No browser available for that link", Toast.LENGTH_SHORT).show()
                    true
                }
            }
        }
        setupServiceWorker(loader)
        webView.addJavascriptInterface(WebAppInterface(this), "Android")

        exportLauncher = registerForActivityResult(ActivityResultContracts.CreateDocument("*/*")) { uri ->
            if (uri == null) return@registerForActivityResult
            try {
                contentResolver.openOutputStream(uri)?.use { out ->
                    out.write(pendingExportText.toByteArray(Charsets.UTF_8))
                }
                Toast.makeText(this@MainActivity, "Saved $pendingExportName", Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                Toast.makeText(this@MainActivity, "Save failed: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
        importLauncher = registerForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
            if (uri == null) return@registerForActivityResult
            try {
                val stream = contentResolver.openInputStream(uri) ?: return@registerForActivityResult
                val text = stream.bufferedReader(Charsets.UTF_8).use { it.readText() }
                val b64 = Base64.encodeToString(text.toByteArray(Charsets.UTF_8), Base64.NO_WRAP)
                webView.evaluateJavascript("window.__nativeImport && window.__nativeImport(\"$b64\")", null)
            } catch (e: Exception) {
                Toast.makeText(this@MainActivity, "Import failed: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })

        webView.loadUrl(BASE_URL)
    }

    private fun setupServiceWorker(loader: WebViewAssetLoader) {
        try {
            if (WebViewFeature.isFeatureSupported(WebViewFeature.SERVICE_WORKER_BASIC_USAGE) &&
                WebViewFeature.isFeatureSupported(WebViewFeature.SERVICE_WORKER_SHOULD_INTERCEPT_REQUEST)
            ) {
                ServiceWorkerControllerCompat.getInstance().setServiceWorkerClient(
                    object : ServiceWorkerClientCompat() {
                        override fun shouldInterceptRequest(
                            request: WebResourceRequest,
                        ): WebResourceResponse? = loader.shouldInterceptRequest(request.url)
                    },
                )
            }
        } catch (_: UnsupportedOperationException) {
            // Older WebView: asset-loader still serves the page, just without SW.
        }
    }

    fun setTextZoom(percent: Int) {
        webView.settings.textZoom = percent.coerceIn(50, 200)
    }

    fun keepScreenOn(enabled: Boolean) {
        if (enabled) window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        else window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    }

    fun setCookMode(active: Boolean) {
        if (cookModeActive == active) return
        cookModeActive = active
        val intent = Intent(this, CookModeService::class.java)
        try {
            if (active) ContextCompat.startForegroundService(this, intent) else stopService(intent)
        } catch (e: SecurityException) {
            Toast.makeText(this, "Foreground service blocked: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

    fun requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), REQ_NOTIFICATIONS)
        }
    }

    fun openExactAlarmSettings() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            try {
                startActivity(
                    Intent(
                        Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,
                        Uri.parse("package:$packageName"),
                    ),
                )
            } catch (_: ActivityNotFoundException) {
                Toast.makeText(this, "Exact-alarm settings are unavailable", Toast.LENGTH_SHORT).show()
            }
        } else {
            Toast.makeText(this, "Exact alarms are already available on this Android version", Toast.LENGTH_SHORT).show()
        }
    }

    fun openBatterySettings() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return
        val power = getSystemService(PowerManager::class.java)
        if (power.isIgnoringBatteryOptimizations(packageName)) {
            Toast.makeText(this, "Battery optimisation is already off", Toast.LENGTH_SHORT).show()
            return
        }
        try {
            startActivity(
                Intent(
                    Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
                    Uri.parse("package:$packageName"),
                ),
            )
        } catch (_: ActivityNotFoundException) {
            startActivity(Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS))
        }
    }

    fun openNotificationSettings() {
        try {
            startActivity(
                Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                    .putExtra(Settings.EXTRA_APP_PACKAGE, packageName),
            )
        } catch (_: ActivityNotFoundException) {
            Toast.makeText(this, "Notification settings are unavailable", Toast.LENGTH_SHORT).show()
        }
    }

    @Suppress("DEPRECATION")
    fun printPage() {
        val manager = getSystemService(Context.PRINT_SERVICE) as PrintManager
        val adapter = webView.createPrintDocumentAdapter("Christmas Lunch Cards")
        manager.print("Christmas Lunch", adapter, null)
    }

    fun exportText(name: String, text: String, mimeType: String) {
        pendingExportText = text
        pendingExportName = name
        try {
            exportLauncher.launch(name)
        } catch (e: Exception) {
            Toast.makeText(this, "Export failed: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

    fun importText() {
        try {
            importLauncher.launch(arrayOf("application/json", "text/plain", "*/*"))
        } catch (e: Exception) {
            Toast.makeText(this, "Import failed: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

    fun speak(text: String) {
        if (tts == null) {
            pendingSpeech = text
            tts = TextToSpeech(this) { status ->
                if (status == TextToSpeech.SUCCESS) {
                    tts?.language = Locale("en", "ZA")
                    pendingSpeech?.let { queued ->
                        tts?.speak(queued, TextToSpeech.QUEUE_FLUSH, null, "christmas-lunch")
                        pendingSpeech = null
                    }
                }
            }
        } else {
            tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "christmas-lunch")
        }
    }

    override fun onDestroy() {
        stopService(Intent(this, CookModeService::class.java))
        tts?.shutdown()
        tts = null
        webView.destroy()
        super.onDestroy()
    }

    companion object {
        const val ASSET_HOST = "appassets.androidplatform.net"
        const val BASE_URL = "https://$ASSET_HOST/assets/www/index.html"
        const val REQ_NOTIFICATIONS = 1001
    }
}
