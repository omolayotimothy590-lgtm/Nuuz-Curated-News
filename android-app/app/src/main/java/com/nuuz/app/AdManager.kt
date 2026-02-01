package com.nuuz.app

import android.content.Context
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.widget.FrameLayout
import android.widget.TextView
import com.google.android.gms.ads.*
import com.google.android.gms.ads.nativead.NativeAd
import com.google.android.gms.ads.nativead.NativeAdOptions
import com.google.android.gms.ads.nativead.NativeAdView
import kotlinx.coroutines.*

/**
 * Manages all ad operations including banner, native, and interstitial ads
 */
class AdManager(
    private val context: Context,
    private val topContainer: FrameLayout,
    private val bottomContainer: FrameLayout
) {

    private var topBannerAd: AdView? = null
    private var bottomBannerAd: AdView? = null
    private var nativeAdOverlay: View? = null
    private var currentNativeAd: NativeAd? = null

    private var lastAdArticleCount = 0
    private val articlesBetweenAds = 6 // Show ad every 6-8 articles
    private var isNativeAdLoading = false

    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    companion object {
        private const val TAG = "AdManager"

        // Test ad units (use these during development)
        private const val TEST_BANNER_AD_UNIT = "ca-app-pub-3940256099942544/6300978111"
        private const val TEST_NATIVE_AD_UNIT = "ca-app-pub-3940256099942544/2247696110"

        // Production ad units (replace with your actual ad units)
        private const val PROD_BANNER_AD_UNIT = "ca-app-pub-1594396899801208/4807208076"
        private const val PROD_NATIVE_AD_UNIT = "ca-app-pub-1594396899801208/9290035104"
    }

    fun loadBannerAds() {
        loadTopBanner()
        loadBottomBanner()
    }

    private fun loadTopBanner() {
        val adUnitId = if (com.nuuz.app.BuildConfig.DEBUG) TEST_BANNER_AD_UNIT else PROD_BANNER_AD_UNIT

        topBannerAd = AdView(context).apply {
            setAdUnitId(adUnitId)
            setAdSize(AdSize.BANNER)

            adListener = object : AdListener() {
                override fun onAdLoaded() {
                    Log.d(TAG, "Top banner ad loaded")
                    topContainer.visibility = View.VISIBLE
                }

                override fun onAdFailedToLoad(error: LoadAdError) {
                    Log.e(TAG, "Top banner failed to load: ${error.message}")
                    topContainer.visibility = View.GONE
                }

                override fun onAdClicked() {
                    Log.d(TAG, "Top banner ad clicked")
                }
            }
        }

        topContainer.removeAllViews()
        topContainer.addView(topBannerAd)

        val adRequest = AdRequest.Builder().build()
        topBannerAd?.loadAd(adRequest)
    }

    private fun loadBottomBanner() {
        val adUnitId = if (com.nuuz.app.BuildConfig.DEBUG) TEST_BANNER_AD_UNIT else PROD_BANNER_AD_UNIT

        bottomBannerAd = AdView(context).apply {
            setAdUnitId(adUnitId)
            setAdSize(AdSize.BANNER)

            adListener = object : AdListener() {
                override fun onAdLoaded() {
                    Log.d(TAG, "Bottom banner ad loaded")
                    bottomContainer.visibility = View.VISIBLE
                }

                override fun onAdFailedToLoad(error: LoadAdError) {
                    Log.e(TAG, "Bottom banner failed to load: ${error.message}")
                    bottomContainer.visibility = View.GONE
                }

                override fun onAdClicked() {
                    Log.d(TAG, "Bottom banner ad clicked")
                }
            }
        }

        bottomContainer.removeAllViews()
        bottomContainer.addView(bottomBannerAd)

        val adRequest = AdRequest.Builder().build()
        bottomBannerAd?.loadAd(adRequest)
    }

    fun handleScrollPosition(scrollPercentage: Float, articleCount: Int, scrollPosition: Int) {
        // Show native ad overlay every 6-8 articles
        if (articleCount >= lastAdArticleCount + articlesBetweenAds && !isNativeAdLoading) {
            lastAdArticleCount = articleCount
            loadAndShowNativeAd()
        }
    }

    private fun loadAndShowNativeAd() {
        if (isNativeAdLoading) return

        isNativeAdLoading = true
        val adUnitId = if (com.nuuz.app.BuildConfig.DEBUG) TEST_NATIVE_AD_UNIT else PROD_NATIVE_AD_UNIT

        val adLoader = AdLoader.Builder(context, adUnitId)
            .forNativeAd { nativeAd ->
                currentNativeAd?.destroy()
                currentNativeAd = nativeAd
                displayNativeAd(nativeAd)
            }
            .withAdListener(object : AdListener() {
                override fun onAdFailedToLoad(error: LoadAdError) {
                    Log.e(TAG, "Native ad failed to load: ${error.message}")
                    isNativeAdLoading = false
                }

                override fun onAdLoaded() {
                    Log.d(TAG, "Native ad loaded successfully")
                    isNativeAdLoading = false
                }
            })
            .withNativeAdOptions(
                NativeAdOptions.Builder()
                    .setAdChoicesPlacement(NativeAdOptions.ADCHOICES_TOP_RIGHT)
                    .build()
            )
            .build()

        adLoader.loadAd(AdRequest.Builder().build())
    }

    private fun displayNativeAd(nativeAd: NativeAd) {
        // Remove existing overlay if present
        nativeAdOverlay?.let {
            (it.parent as? FrameLayout)?.removeView(it)
        }

        // Inflate native ad layout
        val inflater = LayoutInflater.from(context)
        val adView = inflater.inflate(R.layout.native_ad_layout, null) as NativeAdView

        // Populate ad view
        populateNativeAdView(nativeAd, adView)

        // Create overlay container
        val overlay = FrameLayout(context).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                setMargins(16, 16, 16, 16)
            }
            elevation = 8f
            addView(adView)
        }

        nativeAdOverlay = overlay

        // Add to activity's root view
        if (context is MainActivity) {
            val rootView = (context as MainActivity).findViewById<FrameLayout>(R.id.rootContainer)
            rootView?.addView(overlay)
        }

        // Auto-dismiss after 10 seconds
        scope.launch {
            delay(10000)
            dismissNativeAdOverlay()
        }
    }

    private fun populateNativeAdView(nativeAd: NativeAd, adView: NativeAdView) {
        // Headline
        adView.headlineView = adView.findViewById(R.id.ad_headline)
        (adView.headlineView as? TextView)?.text = nativeAd.headline

        // Body
        adView.bodyView = adView.findViewById(R.id.ad_body)
        if (nativeAd.body != null) {
            (adView.bodyView as? TextView)?.text = nativeAd.body
            adView.bodyView?.visibility = View.VISIBLE
        } else {
            adView.bodyView?.visibility = View.GONE
        }

        // Call to action
        adView.callToActionView = adView.findViewById(R.id.ad_call_to_action)
        if (nativeAd.callToAction != null) {
            (adView.callToActionView as? TextView)?.text = nativeAd.callToAction
            adView.callToActionView?.visibility = View.VISIBLE
        } else {
            adView.callToActionView?.visibility = View.GONE
        }

        // Ad attribution
        val sponsoredLabel = adView.findViewById<TextView>(R.id.ad_sponsored)
        sponsoredLabel?.text = "Sponsored"

        // Icon
        adView.iconView = adView.findViewById(R.id.ad_icon)
        if (nativeAd.icon != null) {
            (adView.iconView as? android.widget.ImageView)?.setImageDrawable(nativeAd.icon?.drawable)
            adView.iconView?.visibility = View.VISIBLE
        } else {
            adView.iconView?.visibility = View.GONE
        }

        // Close button
        val closeButton = adView.findViewById<View>(R.id.ad_close_button)
        closeButton?.setOnClickListener {
            dismissNativeAdOverlay()
        }

        adView.setNativeAd(nativeAd)
    }

    private fun dismissNativeAdOverlay() {
        nativeAdOverlay?.let { overlay ->
            (overlay.parent as? FrameLayout)?.removeView(overlay)
        }
        nativeAdOverlay = null
    }

    fun pause() {
        topBannerAd?.pause()
        bottomBannerAd?.pause()
    }

    fun resume() {
        topBannerAd?.resume()
        bottomBannerAd?.resume()
    }

    fun destroy() {
        scope.cancel()
        topBannerAd?.destroy()
        bottomBannerAd?.destroy()
        currentNativeAd?.destroy()
        dismissNativeAdOverlay()

        topBannerAd = null
        bottomBannerAd = null
        currentNativeAd = null
    }
}
