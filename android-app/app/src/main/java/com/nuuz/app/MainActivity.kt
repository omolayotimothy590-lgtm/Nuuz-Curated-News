package com.nuuz.app

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Bitmap
import android.os.Bundle
import android.view.View
import android.webkit.*
import android.widget.FrameLayout
import android.widget.ProgressBar
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.google.android.gms.ads.*
import com.google.android.gms.ads.interstitial.InterstitialAd
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar
    private lateinit var adContainerTop: FrameLayout
    private lateinit var adContainerBottom: FrameLayout

    private var adManager: AdManager? = null
    private var isPremiumUser = false
    private var interstitialAd: InterstitialAd? = null
    private var sessionCount = 0

    companion object {
        private const val WEB_APP_URL = "https://nuuz-curated-news-ai-lj3c.bolt.host/"
        private const val PREFS_NAME = "NuuzPrefs"
        private const val PREF_SESSION_COUNT = "session_count"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Initialize AdMob
        MobileAds.initialize(this) { initStatus ->
            initStatus.adapterStatusMap.forEach { (adapter, status) ->
                android.util.Log.d("AdMob", "Adapter: $adapter, Status: ${status.initializationState}")
            }
        }

        // Initialize views
        webView = findViewById(R.id.webView)
        progressBar = findViewById(R.id.progressBar)
        adContainerTop = findViewById(R.id.adContainerTop)
        adContainerBottom = findViewById(R.id.adContainerBottom)

        // Load session count
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        sessionCount = prefs.getInt(PREF_SESSION_COUNT, 0)
        sessionCount++
        prefs.edit().putInt(PREF_SESSION_COUNT, sessionCount).apply()

        setupWebView()
        loadInterstitialAd()
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            cacheMode = WebSettings.LOAD_DEFAULT
            mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
            allowFileAccess = false
            allowContentAccess = true
            setSupportZoom(true)
            builtInZoomControls = false
            displayZoomControls = false
            loadWithOverviewMode = true
            useWideViewPort = true
        }

        // Add JavaScript interface for communication
        webView.addJavascriptInterface(WebAppInterface(this), "AndroidBridge")

        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                progressBar.visibility = View.VISIBLE
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                progressBar.visibility = View.GONE

                // Inject JavaScript to detect premium status and scroll
                injectScrollDetectionScript()
                detectPremiumStatus()
            }

            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false

                // Allow navigation within the app domain
                if (url.startsWith(WEB_APP_URL)) {
                    return false
                }

                // Open external links in browser
                return true
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                android.util.Log.e("WebView", "Error: ${error?.description}")
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                super.onProgressChanged(view, newProgress)
                progressBar.progress = newProgress
            }

            override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                consoleMessage?.let {
                    android.util.Log.d("WebView Console", "${it.message()} -- From line ${it.lineNumber()} of ${it.sourceId()}")
                }
                return true
            }
        }

        // Load the web app
        webView.loadUrl(WEB_APP_URL)
    }

    private fun injectScrollDetectionScript() {
        val script = """
            (function() {
                let lastScrollTop = 0;
                let articleCount = 0;

                function countArticles() {
                    const articles = document.querySelectorAll('article, [class*="article"], [class*="card"], [data-article]');
                    return articles.length;
                }

                function onScroll() {
                    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
                    const scrollHeight = document.documentElement.scrollHeight;
                    const clientHeight = document.documentElement.clientHeight;
                    const scrollPercentage = (currentScroll / (scrollHeight - clientHeight)) * 100;

                    const newArticleCount = countArticles();

                    // Notify native app of scroll position and article count
                    if (typeof AndroidBridge !== 'undefined') {
                        AndroidBridge.onScroll(scrollPercentage, newArticleCount, currentScroll);
                    }

                    lastScrollTop = currentScroll;
                    articleCount = newArticleCount;
                }

                // Debounce scroll events
                let scrollTimeout;
                window.addEventListener('scroll', function() {
                    clearTimeout(scrollTimeout);
                    scrollTimeout = setTimeout(onScroll, 100);
                }, { passive: true });

                // Initial count
                setTimeout(() => {
                    onScroll();
                }, 1000);

                // Observe DOM changes to detect new articles
                const observer = new MutationObserver(function() {
                    onScroll();
                });

                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            })();
        """.trimIndent()

        webView.evaluateJavascript(script, null)
    }

    private fun detectPremiumStatus() {
        val script = """
            (function() {
                // Check for premium status indicators
                const isPremium = localStorage.getItem('isPremium') === 'true' ||
                                 sessionStorage.getItem('isPremium') === 'true' ||
                                 document.querySelector('[data-premium="true"]') !== null ||
                                 document.body.classList.contains('premium-user');

                if (typeof AndroidBridge !== 'undefined') {
                    AndroidBridge.setPremiumStatus(isPremium);
                }

                return isPremium;
            })();
        """.trimIndent()

        webView.evaluateJavascript(script, null)
    }

    fun onPremiumStatusDetected(isPremium: Boolean) {
        isPremiumUser = isPremium

        if (!isPremium) {
            // Initialize ad manager for non-premium users
            if (adManager == null) {
                adManager = AdManager(this, adContainerTop, adContainerBottom)
                adManager?.loadBannerAds()
            }

            // Show interstitial ad every 3 sessions
            if (sessionCount % 3 == 0) {
                showInterstitialAd()
            }
        } else {
            // Hide ads for premium users
            adContainerTop.visibility = View.GONE
            adContainerBottom.visibility = View.GONE
            adManager?.destroy()
            adManager = null
        }
    }

    fun onScrollUpdate(scrollPercentage: Float, articleCount: Int, scrollPosition: Int) {
        if (!isPremiumUser && adManager != null) {
            // Show native ad overlay every 6-8 articles
            adManager?.handleScrollPosition(scrollPercentage, articleCount, scrollPosition)
        }
    }

    private fun loadInterstitialAd() {
        if (isPremiumUser) return

        val adRequest = AdRequest.Builder().build()
        val adUnitId = if (BuildConfig.DEBUG) {
            "ca-app-pub-3940256099942544/1033173712" // Test ad unit
        } else {
            "ca-app-pub-1594396899801208/[YOUR_INTERSTITIAL_AD_UNIT]" // Replace with your ad unit
        }

        InterstitialAd.load(
            this,
            adUnitId,
            adRequest,
            object : InterstitialAdLoadCallback() {
                override fun onAdLoaded(ad: InterstitialAd) {
                    interstitialAd = ad
                    android.util.Log.d("AdMob", "Interstitial ad loaded")
                }

                override fun onAdFailedToLoad(error: LoadAdError) {
                    interstitialAd = null
                    android.util.Log.e("AdMob", "Interstitial ad failed to load: ${error.message}")
                }
            }
        )
    }

    private fun showInterstitialAd() {
        interstitialAd?.let { ad ->
            ad.fullScreenContentCallback = object : FullScreenContentCallback() {
                override fun onAdDismissedFullScreenContent() {
                    interstitialAd = null
                    loadInterstitialAd()
                }

                override fun onAdFailedToShowFullScreenContent(error: AdError) {
                    interstitialAd = null
                    android.util.Log.e("AdMob", "Failed to show interstitial: ${error.message}")
                }

                override fun onAdShowedFullScreenContent() {
                    android.util.Log.d("AdMob", "Interstitial ad shown")
                }
            }

            ad.show(this)
        }
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        adManager?.destroy()
        webView.destroy()
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
        adManager?.pause()
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
        adManager?.resume()
    }
}
