package com.nuuz.app

import android.webkit.JavascriptInterface
import android.util.Log

/**
 * JavaScript interface to bridge communication between web app and native Android
 */
class WebAppInterface(private val activity: MainActivity) {

    @JavascriptInterface
    fun setPremiumStatus(isPremium: Boolean) {
        Log.d("WebAppInterface", "Premium status: $isPremium")
        activity.runOnUiThread {
            activity.onPremiumStatusDetected(isPremium)
        }
    }

    @JavascriptInterface
    fun onScroll(scrollPercentage: Float, articleCount: Int, scrollPosition: Int) {
        activity.runOnUiThread {
            activity.onScrollUpdate(scrollPercentage, articleCount, scrollPosition)
        }
    }

    @JavascriptInterface
    fun logMessage(message: String) {
        Log.d("WebApp", message)
    }

    @JavascriptInterface
    fun notifyArticleView(articleId: String, articleTitle: String) {
        Log.d("WebAppInterface", "Article viewed: $articleTitle (ID: $articleId)")
        // Can be used for analytics
    }

    @JavascriptInterface
    fun requestNativeAd(position: Int) {
        Log.d("WebAppInterface", "Native ad requested at position: $position")
        activity.runOnUiThread {
            // Trigger native ad display
        }
    }
}
