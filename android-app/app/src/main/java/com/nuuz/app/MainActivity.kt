package com.nuuz.app

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Bitmap
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.webkit.*
import android.widget.FrameLayout
import android.widget.ProgressBar
import androidx.appcompat.app.AppCompatActivity
import androidx.browser.customtabs.CustomTabsIntent
import androidx.browser.customtabs.CustomTabsCallback
import androidx.lifecycle.lifecycleScope
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.result.ActivityResultLauncher
import com.google.android.gms.ads.*
import com.google.android.gms.ads.interstitial.InterstitialAd
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.google.android.gms.tasks.Task
import com.google.gson.Gson
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
    private var isPageLoaded = false
    private lateinit var googleSignInClient: GoogleSignInClient
    private lateinit var signInLauncher: ActivityResultLauncher<android.content.Intent>

    companion object {
        // TEMPORARY: Using local server for testing (change back to Netlify URL when credits are restored)
        private const val WEB_APP_URL = "http://10.11.225.230:3000/"
        // Original Netlify URL (uncomment when ready):
        // private const val WEB_APP_URL = "https://cool-tartufo-a76644.netlify.app/"
        private const val PREFS_NAME = "NuuzPrefs"
        private const val PREF_SESSION_COUNT = "session_count"
        private const val RC_SIGN_IN = 9001
        private const val GOOGLE_CLIENT_ID = "91768461103-ss664383b8aaoq2l5kjbud3c4m17j7md.apps.googleusercontent.com"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // DISABLED: AdMob not needed - using AdSense in-feed ads only
        // Client wants inline ads (mixed with posts), not banner/interstitial ads
        // Uncomment below to re-enable AdMob if AdSense doesn't work in WebView
        /*
        MobileAds.initialize(this) { initStatus ->
            initStatus.adapterStatusMap.forEach { (adapter, status) ->
                android.util.Log.d("AdMob", "Adapter: $adapter, Status: ${status.initializationState}")
            }
        }
        */

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
        
        // Setup native Google Sign-In (preferred method for WebView)
        setupGoogleSignIn()
        
        // Handle OAuth callback from deep link (when Google redirects back)
        // NOTE: This is now a fallback - native sign-in is preferred
        handleOAuthCallback(intent)
        
        // DISABLED: Interstitial ads not loaded - using AdSense in-feed only
        // loadInterstitialAd()
    }
    
    override fun onNewIntent(intent: android.content.Intent?) {
        super.onNewIntent(intent)
        // Handle OAuth callback when app is already running
        handleOAuthCallback(intent)
    }
    
    /**
     * Setup native Google Sign-In SDK
     * This provides a better experience than OAuth redirects in WebView
     */
    private fun setupGoogleSignIn() {
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(GOOGLE_CLIENT_ID)
            .requestEmail()
            .requestProfile()
            .build()
        
        googleSignInClient = GoogleSignIn.getClient(this, gso)
        
        // Register Activity Result Launcher (modern API - replaces deprecated onActivityResult)
        signInLauncher = registerForActivityResult(
            ActivityResultContracts.StartActivityForResult()
        ) { result ->
            android.util.Log.d("GoogleSignIn", "========== Activity Result Received ==========")
            android.util.Log.d("GoogleSignIn", "Result code: ${result.resultCode} (RESULT_OK: ${android.app.Activity.RESULT_OK})")
            
            if (result.resultCode == android.app.Activity.RESULT_OK && result.data != null) {
                android.util.Log.d("GoogleSignIn", "✅ Result OK, processing sign-in...")
                val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
                handleGoogleSignInResult(task)
            } else {
                android.util.Log.w("GoogleSignIn", "⚠️ Sign-in cancelled or failed (code: ${result.resultCode})")
                webView.post {
                    val script = """
                        (function() {
                            console.log('⚠️ [Android] Sign-in cancelled or failed');
                        })();
                    """.trimIndent()
                    webView.evaluateJavascript(script, null)
                }
            }
        }
        
        android.util.Log.d("GoogleSignIn", "✅ Native Google Sign-In initialized with Activity Result API")
    }
    
    /**
     * Trigger native Google Sign-In flow
     * Called from WebAppInterface when user clicks sign-in button in WebView
     */
    fun triggerNativeGoogleSignIn() {
        android.util.Log.d("GoogleSignIn", "🔐 ========== NATIVE SIGN-IN TRIGGERED ==========")
        android.util.Log.d("GoogleSignIn", "🔐 googleSignInClient initialized: ${::googleSignInClient.isInitialized}")
        android.util.Log.d("GoogleSignIn", "🔐 signInLauncher initialized: ${::signInLauncher.isInitialized}")
        
        try {
            val signInIntent = googleSignInClient.signInIntent
            android.util.Log.d("GoogleSignIn", "🔐 Sign-in intent created, launching with Activity Result API...")
            signInLauncher.launch(signInIntent)
            android.util.Log.d("GoogleSignIn", "✅ Sign-in intent launched successfully")
        } catch (e: Exception) {
            android.util.Log.e("GoogleSignIn", "❌ Error launching sign-in: ${e.message}")
            e.printStackTrace()
            
            // Notify WebView of error
            webView.post {
                val script = """
                    (function() {
                        console.error('❌ [Android] Failed to start native sign-in: ${e.message}');
                        alert('Failed to start sign-in: ${e.message}');
                    })();
                """.trimIndent()
                webView.evaluateJavascript(script, null)
            }
        }
    }
    
    /**
     * Process the Google Sign-In result and pass token to WebView
     */
    private fun handleGoogleSignInResult(completedTask: Task<GoogleSignInAccount>) {
        android.util.Log.d("GoogleSignIn", "========== handleGoogleSignInResult CALLED ==========")
        android.util.Log.d("GoogleSignIn", "Task is complete: ${completedTask.isComplete}")
        android.util.Log.d("GoogleSignIn", "Task is successful: ${completedTask.isSuccessful}")
        
        // Check if task is already complete - process immediately if so
        if (completedTask.isComplete) {
            android.util.Log.d("GoogleSignIn", "Task is already complete, processing immediately")
            processSignInResult(completedTask)
        } else {
            android.util.Log.d("GoogleSignIn", "Task not complete, adding listener")
            completedTask.addOnCompleteListener { task ->
                processSignInResult(task)
            }
        }
    }
    
    /**
     * Process the sign-in result and extract token
     */
    private fun processSignInResult(task: Task<GoogleSignInAccount>) {
        android.util.Log.d("GoogleSignIn", "========== Processing Sign-In Result ==========")
        
        try {
            if (task.isSuccessful) {
                val account = task.result
                val idToken = account.idToken
                
                if (idToken == null) {
                    android.util.Log.e("GoogleSignIn", "❌ ID token is null")
                    showErrorToWebView("No token received")
                    return
                }
                
                android.util.Log.d("GoogleSignIn", "✅ Token received, length: ${idToken.length}")
                android.util.Log.d("GoogleSignIn", "✅ Account: ${account.email}")
                android.util.Log.d("GoogleSignIn", "Token preview: ${idToken.take(50)}...")
                
                // Pass token directly to WebView
                passTokenToWebView(idToken)
                
            } else {
                val exception = task.exception
                android.util.Log.e("GoogleSignIn", "❌ Task failed: ${exception?.message}")
                exception?.printStackTrace()
                
                if (exception is ApiException) {
                    when (exception.statusCode) {
                        12501 -> android.util.Log.d("GoogleSignIn", "User cancelled sign-in")
                        else -> showErrorToWebView("Sign-in failed: ${exception.message}")
                    }
                } else {
                    showErrorToWebView("Sign-in failed: ${exception?.message ?: "Unknown error"}")
                }
            }
        } catch (e: Exception) {
            android.util.Log.e("GoogleSignIn", "❌ Unexpected error: ${e.message}")
            e.printStackTrace()
            showErrorToWebView("Unexpected error: ${e.message}")
        }
    }
    
    /**
     * Pass token to WebView using multiple methods for reliability
     */
    private fun passTokenToWebView(token: String) {
        android.util.Log.d("GoogleSignIn", "Passing token to WebView...")
        
        // Use Gson to properly escape the token as JSON string
        val gson = Gson()
        val jsonToken = gson.toJson(token)
        
        val script = """
            (function() {
                console.log('✅ [Android] Token received from native sign-in');
                const token = $jsonToken;
                console.log('✅ [Android] Token length: ' + token.length);
                console.log('✅ [Android] Token preview: ' + token.substring(0, 50) + '...');
                
                // Store in localStorage immediately as backup
                localStorage.setItem('__google_signin_token', token);
                console.log('✅ [Android] Token stored in localStorage');
                
                // Method 1: Try direct call first
                if (typeof window.signInWithGoogle === 'function') {
                    console.log('✅ [Android] Method 1: Calling window.signInWithGoogle directly');
                    try {
                        const promise = window.signInWithGoogle(token);
                        if (promise && typeof promise.then === 'function') {
                            promise.then(function() {
                                console.log('✅ [Android] signInWithGoogle promise resolved');
                                localStorage.removeItem('__google_signin_token');
                            }).catch(function(err) {
                                console.error('❌ [Android] Direct call failed:', err);
                                triggerTokenEvent(token);
                            });
                        } else {
                            triggerTokenEvent(token);
                        }
                    } catch (err) {
                        console.error('❌ [Android] Error calling signInWithGoogle:', err);
                        triggerTokenEvent(token);
                    }
                } else {
                    console.log('⚠️ [Android] window.signInWithGoogle not available, using event');
                    triggerTokenEvent(token);
                }
                
                function triggerTokenEvent(token) {
                    console.log('✅ [Android] Method 2: Dispatching google-signin-token event');
                    const event = new CustomEvent('google-signin-token', {
                        detail: { credential: token },
                        bubbles: true
                    });
                    window.dispatchEvent(event);
                    console.log('✅ [Android] Event dispatched');
                }
            })();
        """.trimIndent()
        
        webView.post {
            webView.evaluateJavascript(script) { result ->
                android.util.Log.d("GoogleSignIn", "Script executed, result: $result")
            }
        }
    }
    
    /**
     * Show error message to WebView
     */
    private fun showErrorToWebView(message: String) {
        val escaped = message.replace("'", "\\'").replace("\"", "\\\"")
        val script = """
            (function() {
                console.error('❌ [Android] $escaped');
                alert('Sign-in failed: $escaped');
            })();
        """.trimIndent()
        
        webView.post {
            webView.evaluateJavascript(script, null)
        }
    }
    
    // Legacy method - kept for backward compatibility but not used
    @Deprecated("Use Activity Result API instead")
    private fun handleGoogleSignInResultLegacy(completedTask: Task<GoogleSignInAccount>) {
        // This method is no longer used - kept for reference only
        completedTask.addOnCompleteListener { task ->
            android.util.Log.d("GoogleSignIn", "========== Task completed ==========")
            android.util.Log.d("GoogleSignIn", "Task successful: ${task.isSuccessful}")
            
            try {
                if (task.isSuccessful) {
                    val account = task.result
                    android.util.Log.d("GoogleSignIn", "✅ Account retrieved: ${account.email}")
                    val idToken = account.idToken
            
                    if (idToken == null) {
                        android.util.Log.e("GoogleSignIn", "❌ ID token is null")
                        webView.post {
                            val script = """
                                (function() {
                                    console.error('❌ [Android] Google Sign-In failed: ID token is null');
                                    alert('Sign-in failed: No token received');
                                })();
                            """.trimIndent()
                            webView.evaluateJavascript(script, null)
                        }
                        return@addOnCompleteListener
                    }
                    
                    android.util.Log.d("GoogleSignIn", "✅ Sign-in successful, token received (length: ${idToken.length})")
                    android.util.Log.d("GoogleSignIn", "Token preview: ${idToken.take(50)}...")
                    
                    // Check WebView state
                    android.util.Log.d("GoogleSignIn", "WebView URL: ${webView.url}")
                    android.util.Log.d("GoogleSignIn", "WebView is attached: ${webView.isAttachedToWindow}")
                    
                    // CRITICAL: Pass token to WebView using base64 encoding to avoid JavaScript injection issues
                    // JWT tokens contain special characters that can break when injected directly
                    val base64Token = android.util.Base64.encodeToString(
                        idToken.toByteArray(Charsets.UTF_8),
                        android.util.Base64.NO_WRAP
                    )
                    
                    android.util.Log.d("GoogleSignIn", "Token encoded to base64, length: ${base64Token.length}")
                    
                    // Ensure WebView is ready before injecting script
                    webView.post {
                        // Wait a bit to ensure WebView JavaScript context is ready
                        android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
                            val script = """
                                (function() {
                                    console.log('✅ [Android] Native Google Sign-In successful');
                                    console.log('✅ [Android] Processing token...');
                                    
                                    try {
                                        // Decode base64 token
                                        const base64Token = '$base64Token';
                                        const token = atob(base64Token);
                                        console.log('✅ [Android] Token decoded, length: ' + token.length);
                                        console.log('✅ [Android] Token preview: ' + token.substring(0, 50) + '...');
                                        
                                        // Multiple fallback methods to ensure token is processed
                                        
                                        // Method 1: Try global function
                                        if (typeof window.signInWithGoogle === 'function') {
                                            console.log('✅ [Android] Method 1: Calling window.signInWithGoogle');
                                            const promise = window.signInWithGoogle(token);
                                            if (promise && typeof promise.then === 'function') {
                                                promise.then(function() {
                                                    console.log('✅ [Android] signInWithGoogle promise resolved');
                                                }).catch(function(err) {
                                                    console.error('❌ [Android] signInWithGoogle promise rejected:', err);
                                                    // Fall through to event method
                                                    dispatchTokenEvent(token);
                                                });
                                            } else {
                                                // Not a promise, try event method
                                                dispatchTokenEvent(token);
                                            }
                                        } else {
                                            console.log('⚠️ [Android] window.signInWithGoogle not available, using event method');
                                            dispatchTokenEvent(token);
                                        }
                                        
                                        function dispatchTokenEvent(token) {
                                            console.log('✅ [Android] Method 2: Dispatching google-signin-token event');
                                            
                                            // Store token as fallback
                                            window.__pendingGoogleToken = token;
                                            console.log('✅ [Android] Token stored in window.__pendingGoogleToken');
                                            
                                            // Dispatch event
                                            const event = new CustomEvent('google-signin-token', { 
                                                detail: { credential: token },
                                                bubbles: true,
                                                cancelable: true
                                            });
                                            const dispatched = window.dispatchEvent(event);
                                            console.log('✅ [Android] Event dispatched, result: ' + dispatched);
                                            
                                            // Also try direct call to auth service if available
                                            setTimeout(function() {
                                                if (window.__authContext && window.__authContext.signInWithGoogle) {
                                                    console.log('✅ [Android] Method 3: Using __authContext');
                                                    window.__authContext.signInWithGoogle(token);
                                                }
                                            }, 100);
                                            
                                            // Final fallback: try again after a delay
                                            setTimeout(function() {
                                                if (window.__pendingGoogleToken === token) {
                                                    console.log('⚠️ [Android] Token still pending, retrying event dispatch');
                                                    window.dispatchEvent(new CustomEvent('google-signin-token', { 
                                                        detail: { credential: token },
                                                        bubbles: true
                                                    }));
                                                }
                                            }, 1000);
                                        }
                                    } catch (err) {
                                        console.error('❌ [Android] Error processing token:', err);
                                        alert('Error processing sign-in: ' + err.message);
                                    }
                                })();
                            """.trimIndent()
                            
                            android.util.Log.d("GoogleSignIn", "Injecting script into WebView...")
                            webView.evaluateJavascript(script) { result ->
                                android.util.Log.d("GoogleSignIn", "Script executed, result: $result")
                                if (result == null || result == "null") {
                                    android.util.Log.w("GoogleSignIn", "⚠️ Script returned null - WebView might not be ready")
                                }
                            }
                        }, 300) // Wait 300ms to ensure WebView is ready
                    }
                } else {
                    // Task failed
                    val exception = task.exception
                    android.util.Log.e("GoogleSignIn", "❌ Task failed: ${exception?.message}")
                    exception?.printStackTrace()
                    
                    if (exception is ApiException) {
                        handleSignInError(exception)
                    } else {
                        handleSignInError(null, exception?.message ?: "Unknown error")
                    }
                }
            } catch (e: Exception) {
                android.util.Log.e("GoogleSignIn", "❌ Unexpected error in onComplete: ${e.message}")
                e.printStackTrace()
                handleSignInError(null, e.message ?: "Unexpected error")
            }
        }
    }
    
    private fun handleSignInError(apiException: ApiException?, customMessage: String? = null) {
        val errorMessage = if (apiException != null) {
            when (apiException.statusCode) {
                10 -> "Developer error - check configuration"
                12501 -> "Sign-in cancelled by user"
                else -> apiException.message ?: "Unknown error (code: ${apiException.statusCode})"
            }
        } else {
            customMessage ?: "Unknown error"
        }
        
        android.util.Log.e("GoogleSignIn", "❌ Sign-in failed: $errorMessage")
        
        webView.post {
            val escapedError = errorMessage.replace("'", "\\'").replace("\"", "\\\"")
            val script = """
                (function() {
                    console.error('❌ [Android] Google Sign-In failed: $escapedError');
                    // Don't show alert for user cancellation
                    if ('$escapedError'.indexOf('cancelled') === -1) {
                        alert('Sign-in failed: $escapedError');
                    }
                })();
            """.trimIndent()
            webView.evaluateJavascript(script, null)
        }
    }
    
    private fun handleOAuthCallback(intent: android.content.Intent?) {
        val data = intent?.data?.toString()
        if (data != null && data.contains("netlify.app") && (data.contains("id_token=") || data.contains("#id_token="))) {
            android.util.Log.d("WebView", "✅ OAuth callback received via intent: $data")
            android.util.Log.d("WebView", "🔐 Checking for id_token in URL...")
            
            // CRITICAL: Verify hash fragment is preserved
            // Google OAuth returns id_token in hash: https://domain.com/#id_token=...
            // WebView.loadUrl() preserves hash fragments, so this should work
            val hasHashToken = data.contains("#id_token=")
            val hasQueryToken = data.contains("id_token=")
            android.util.Log.d("WebView", "🔐 Hash token present: $hasHashToken, Query token present: $hasQueryToken")
            
            // Load the callback URL in WebView so OAuth handler can process it
            // Use postDelayed to ensure WebView is ready
            webView.post {
                android.util.Log.d("WebView", "🔐 Loading OAuth callback URL in WebView (hash preserved)")
                webView.loadUrl(data)
            }
        } else if (data != null && data.contains("netlify.app")) {
            android.util.Log.w("WebView", "⚠️ OAuth callback URL received but no id_token found: $data")
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        // CRITICAL: Set user agent to Chrome to bypass Google's "disallowed_useragent" error
        // Google blocks WebView user agents, so we need to masquerade as Chrome Mobile
        webView.settings.userAgentString = "Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
        
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            cacheMode = WebSettings.LOAD_NO_CACHE  // Force no cache to get latest version
            mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
            allowFileAccess = false
            allowContentAccess = true
            setSupportZoom(true)
            builtInZoomControls = false
            displayZoomControls = false
            loadWithOverviewMode = true
            useWideViewPort = true
            javaScriptCanOpenWindowsAutomatically = true  // Enable for Google Sign-In
            setSupportMultipleWindows(true)  // CRITICAL: Required for Google Sign-In popups
            mediaPlaybackRequiresUserGesture = false
            blockNetworkLoads = false  // Allow network loads
            blockNetworkImage = false
            // CRITICAL: Allow iframes for Google Sign-In
            allowUniversalAccessFromFileURLs = true
            allowFileAccessFromFileURLs = true
        }

        // Enable third-party cookies for Google Sign-In
        val cookieManager = CookieManager.getInstance()
        cookieManager.setAcceptCookie(true)
        cookieManager.setAcceptThirdPartyCookies(webView, true)

        // Clear WebView cache to always load fresh content from Netlify
        // But DON'T clear cookies (needed for Google Sign-In to work)
        webView.clearCache(true)  // Clear cached files
        android.util.Log.d("WebView", "✅ Cache cleared - will load fresh content from Netlify")

        // Add JavaScript interface for communication
        webView.addJavascriptInterface(WebAppInterface(this), "AndroidBridge")

        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                progressBar.visibility = View.VISIBLE
                
                // Reset page loaded flag on new page start
                if (url == WEB_APP_URL || url?.startsWith(WEB_APP_URL) == true) {
                    isPageLoaded = false
                }
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                progressBar.visibility = View.GONE

                // Prevent duplicate content by ensuring single page load
                if ((url == WEB_APP_URL || url?.startsWith(WEB_APP_URL) == true || url?.contains("netlify.app") == true) && !isPageLoaded) {
                    isPageLoaded = true
                    
                    // Let the web app's native Google Sign-In SDK work
                    // NO CUSTOM INJECTION - this was blocking the device account picker
                    
                    // Wait for React to mount, then inject other scripts
                    lifecycleScope.launch {
                        delay(1500) // Wait for React to mount
                        // Inject diagnostic script to verify AndroidBridge
                        injectAndroidBridgeDiagnostic()
                // Inject JavaScript to detect premium status and scroll
                injectScrollDetectionScript()
                detectPremiumStatus()
                    }
                }
            }
            
            override fun onReceivedHttpError(
                view: WebView?,
                request: WebResourceRequest?,
                errorResponse: android.webkit.WebResourceResponse?
            ) {
                super.onReceivedHttpError(view, request, errorResponse)
                android.util.Log.e("WebView", "HTTP Error loading ${request?.url}: ${errorResponse?.statusCode}")
            }
            
            override fun shouldInterceptRequest(
                view: WebView?,
                request: WebResourceRequest?
            ): WebResourceResponse? {
                val url = request?.url?.toString() ?: return null
                
                // Allow all Google domains to load without interception
                if (url.contains("accounts.google.com") || 
                    url.contains("gstatic.com") || 
                    url.contains("googleapis.com")) {
                    return null  // Let WebView handle it normally
                }
                
                // CRITICAL: Intercept HTML responses to modify CSP headers for WebView
                if (url.contains("netlify.app") && request?.url?.path == "/" || 
                    url.contains("netlify.app") && (request?.url?.path == null || request?.url?.path == "")) {
                    try {
                        val response = super.shouldInterceptRequest(view, request)
                        if (response != null && response.mimeType?.contains("text/html") == true) {
                            // Modify CSP to be more permissive for WebView
                            val headers = response.responseHeaders?.toMutableMap() ?: mutableMapOf()
                            // Remove or modify CSP header to allow Google Sign-In
                            headers.remove("Content-Security-Policy")
                            headers["X-Content-Security-Policy"] = "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline';"
                            
                            android.util.Log.d("WebView", "Modified CSP headers for WebView compatibility")
                            return WebResourceResponse(
                                response.mimeType,
                                response.encoding,
                                response.statusCode,
                                response.reasonPhrase,
                                headers,
                                response.data
                            )
                        }
                        return response
                    } catch (e: Exception) {
                        android.util.Log.e("WebView", "Error intercepting request: ${e.message}")
                    }
                }
                
                return super.shouldInterceptRequest(view, request)
            }

            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false

                // CRITICAL: Check if this is OAuth callback (redirect back to our app with id_token)
                // If it's our domain with id_token, load it in WebView (not Custom Tabs)
                if (url.contains("netlify.app") && (url.contains("id_token=") || url.contains("#id_token="))) {
                    android.util.Log.d("WebView", "✅ OAuth callback detected in shouldOverrideUrlLoading")
                    android.util.Log.d("WebView", "🔐 URL contains id_token, loading in WebView")
                    android.util.Log.d("WebView", "🔐 Full callback URL (truncated): ${url.take(200)}...")
                    
                    // Verify hash fragment is present (Google OAuth uses hash for id_token)
                    val hasHash = url.contains("#id_token=")
                    val hasQuery = url.contains("?id_token=") || url.contains("&id_token=")
                    android.util.Log.d("WebView", "🔐 Hash fragment: $hasHash, Query param: $hasQuery")
                    
                    // Load the callback URL in WebView so the OAuth handler can process it
                    // WebView.loadUrl() preserves hash fragments, so id_token will be accessible
                    view?.loadUrl(url)
                    android.util.Log.d("WebView", "✅ OAuth callback URL loaded in WebView")
                    return true  // We handled it
                }

                // CRITICAL: Open Google OAuth URLs in Custom Tabs (not WebView)
                // This ensures account picker appears instead of manual login form
                // Custom Tabs provide a real browser context that Google recognizes
                if (url.contains("accounts.google.com") && 
                    (url.contains("/o/oauth2/v2/auth") || url.contains("/signin") || url.contains("/accountchooser"))) {
                    try {
                        android.util.Log.d("WebView", "🔐 Opening Google OAuth in Custom Tabs: $url")
                        val builder = CustomTabsIntent.Builder()
                        builder.setShowTitle(true)
                        // Use a light color for toolbar
                        builder.setToolbarColor(0xFFFFFFFF.toInt()) // White
                        
                        val customTabsIntent = builder.build()
                        customTabsIntent.intent.putExtra(
                            CustomTabsIntent.EXTRA_ENABLE_URLBAR_HIDING,
                            true
                        )
                        
                        // Launch Custom Tabs
                        // When Google redirects to our domain, the deep link should trigger automatically
                        // If it doesn't, onResume() will catch it when user returns to app
                        customTabsIntent.launchUrl(this@MainActivity, Uri.parse(url))
                        
                        return true  // We handled it - don't let WebView handle it
                    } catch (e: Exception) {
                        android.util.Log.e("WebView", "❌ Failed to open Custom Tab: ${e.message}")
                        e.printStackTrace()
                        // Fallback to WebView if Custom Tabs fails
                        return false
                    }
                }

                // Allow other Google URLs (non-OAuth) in WebView
                if (url.contains("accounts.google.com") || 
                    url.contains("oauth") || 
                    url.contains("google.com/oauth") ||
                    url.contains("googleapis.com") ||
                    url.contains("supabase.co") ||
                    url.contains("gstatic.com")) {
                    return false  // Let WebView handle it
                }

                // Allow navigation within the app domain
                if (url.startsWith(WEB_APP_URL)) {
                    return false
                }

                // Open other external links in browser
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
                    val level = when (it.messageLevel()) {
                        ConsoleMessage.MessageLevel.ERROR -> "ERROR"
                        ConsoleMessage.MessageLevel.WARNING -> "WARN"
                        ConsoleMessage.MessageLevel.LOG -> "LOG"
                        ConsoleMessage.MessageLevel.DEBUG -> "DEBUG"
                        ConsoleMessage.MessageLevel.TIP -> "TIP"
                    }
                    android.util.Log.d("WebView Console", "[$level] ${it.message()} -- From line ${it.lineNumber()} of ${it.sourceId()}")
                }
                return true
            }
            
            override fun onJsAlert(view: WebView?, url: String?, message: String?, result: android.webkit.JsResult?): Boolean {
                android.util.Log.d("WebView JS Alert", "Alert: $message from $url")
                result?.confirm()
                return true
            }
            
            override fun onJsConfirm(view: WebView?, url: String?, message: String?, result: android.webkit.JsResult?): Boolean {
                android.util.Log.d("WebView JS Confirm", "Confirm: $message from $url")
                result?.confirm()
                return true
            }

            // Enable popups for Google Sign-In
            override fun onCreateWindow(
                view: WebView?,
                isDialog: Boolean,
                isUserGesture: Boolean,
                resultMsg: android.os.Message?
            ): Boolean {
                val newWebView = WebView(this@MainActivity)
                newWebView.webViewClient = object : WebViewClient() {
                    override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                        val url = request?.url?.toString() ?: return true
                        if (url.contains("accounts.google.com") || url.contains("oauth") || url.contains("supabase.co")) {
                            // Load OAuth URLs in the main WebView
                            webView.loadUrl(url)
                            return true
                        }
                        return false
                    }
                }
                val transport = resultMsg?.obj as? android.webkit.WebView.WebViewTransport
                transport?.webView = newWebView
                resultMsg?.sendToTarget()
                return true
            }
        }

        // Load the web app with cache-busting parameter to ensure fresh content
        val cacheBuster = System.currentTimeMillis()
        val urlWithCacheBuster = "$WEB_APP_URL?v=$cacheBuster"
        webView.loadUrl(urlWithCacheBuster)
    }

    private fun injectAndroidBridgeDiagnostic() {
        val script = """
            (function() {
                console.log('🔍 [Android] Checking AndroidBridge availability...');
                console.log('🔍 [Android] AndroidBridge exists:', typeof AndroidBridge !== 'undefined');
                if (typeof AndroidBridge !== 'undefined') {
                    console.log('🔍 [Android] AndroidBridge object:', AndroidBridge);
                    console.log('🔍 [Android] AndroidBridge.triggerGoogleSignIn exists:', typeof AndroidBridge.triggerGoogleSignIn === 'function');
                    console.log('🔍 [Android] AndroidBridge methods:', Object.getOwnPropertyNames(AndroidBridge));
                } else {
                    console.error('❌ [Android] AndroidBridge is NOT available!');
                    console.error('❌ [Android] This means native sign-in will not work.');
                }
                
                // Expose a test function
                window.testAndroidBridge = function() {
                    if (typeof AndroidBridge !== 'undefined' && typeof AndroidBridge.triggerGoogleSignIn === 'function') {
                        console.log('✅ [Android] Testing AndroidBridge.triggerGoogleSignIn()...');
                        try {
                            AndroidBridge.triggerGoogleSignIn();
                            console.log('✅ [Android] triggerGoogleSignIn() called successfully');
                        } catch (err) {
                            console.error('❌ [Android] Error calling triggerGoogleSignIn():', err);
                        }
                    } else {
                        console.error('❌ [Android] AndroidBridge.triggerGoogleSignIn not available');
                    }
                };
            })();
        """.trimIndent()
        
        webView.evaluateJavascript(script) { result ->
            android.util.Log.d("WebView", "AndroidBridge diagnostic injected: $result")
        }
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

    private fun injectGoogleSignInScript() {
        // CRITICAL DIAGNOSTIC SCRIPT - This will tell us exactly what's happening
        val diagnosticScript = """
            (function() {
                console.log('🔍 [DIAGNOSTIC] Starting comprehensive Google Sign-In check...');
                console.log('🔍 [DIAGNOSTIC] User Agent:', navigator.userAgent);
                console.log('🔍 [DIAGNOSTIC] Window.google exists:', typeof window.google !== 'undefined');
                console.log('🔍 [DIAGNOSTIC] Window.google.accounts exists:', typeof window.google?.accounts !== 'undefined');
                console.log('🔍 [DIAGNOSTIC] Window.google.accounts.id exists:', typeof window.google?.accounts?.id !== 'undefined');
                
                // Check if script tag exists
                var scriptTags = document.querySelectorAll('script[src*="accounts.google.com"]');
                console.log('🔍 [DIAGNOSTIC] Google script tags found:', scriptTags.length);
                scriptTags.forEach(function(tag, idx) {
                    console.log('🔍 [DIAGNOSTIC] Script ' + idx + ':', tag.src, 'loaded:', tag.complete || tag.readyState);
                });
                
                // Check button div
                var buttonDiv = document.getElementById('google-signin-button');
                console.log('🔍 [DIAGNOSTIC] Button div exists:', !!buttonDiv);
                if (buttonDiv) {
                    console.log('🔍 [DIAGNOSTIC] Button div children:', buttonDiv.children.length);
                    console.log('🔍 [DIAGNOSTIC] Button div innerHTML length:', buttonDiv.innerHTML.length);
                    console.log('🔍 [DIAGNOSTIC] Button div computed style display:', window.getComputedStyle(buttonDiv).display);
                    console.log('🔍 [DIAGNOSTIC] Button div computed style visibility:', window.getComputedStyle(buttonDiv).visibility);
                }
                
                // Check for CSP violations
                var cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
                if (cspMeta) {
                    console.log('🔍 [DIAGNOSTIC] CSP meta tag found:', cspMeta.content.substring(0, 100) + '...');
                } else {
                    console.log('🔍 [DIAGNOSTIC] No CSP meta tag found');
                }
                
                // Check if React is mounted
                var rootDiv = document.getElementById('root');
                console.log('🔍 [DIAGNOSTIC] Root div exists:', !!rootDiv);
                if (rootDiv) {
                    console.log('🔍 [DIAGNOSTIC] Root div children:', rootDiv.children.length);
                }
                
                // Try to detect if we're in WebView
                var isWebView = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && 
                                !/Chrome|Safari|Firefox|Edge/i.test(navigator.userAgent);
                console.log('🔍 [DIAGNOSTIC] Detected as WebView:', isWebView);
                
                return {
                    googleExists: typeof window.google !== 'undefined',
                    googleAccountsExists: typeof window.google?.accounts !== 'undefined',
                    googleAccountsIdExists: typeof window.google?.accounts?.id !== 'undefined',
                    scriptTagsCount: scriptTags.length,
                    buttonDivExists: !!buttonDiv,
                    buttonDivChildren: buttonDiv ? buttonDiv.children.length : 0,
                    isWebView: isWebView
                };
            })();
        """.trimIndent()
        
        webView.evaluateJavascript(diagnosticScript) { result ->
            android.util.Log.d("WebView Diagnostic", "Google Sign-In Diagnostic Result: $result")
        }
        
        // Now inject the actual Google Sign-In script
        val script = """
            (function() {
                console.log('🔐 [Android] Checking Google Sign-In SDK status...');
                
                // Check if SDK is already loaded and initialized
                if (window.google && window.google.accounts && window.google.accounts.id) {
                    console.log('✅ [Android] Google Sign-In SDK already loaded');
                    // Force trigger re-initialization event
                    if (window.dispatchEvent) {
                        var event = new Event('google-signin-ready', { bubbles: true });
                        window.dispatchEvent(event);
                        console.log('✅ [Android] Dispatched google-signin-ready event');
                    }
                    
                    // Check if button container exists and is empty
                    setTimeout(function() {
                        var buttonDiv = document.getElementById('google-signin-button');
                        if (buttonDiv) {
                            console.log('🔍 [Android] Button div found, children count:', buttonDiv.children.length);
                            if (buttonDiv.children.length === 0) {
                                console.log('🔄 [Android] Button container empty, forcing re-initialization...');
                                if (window.dispatchEvent) {
                                    window.dispatchEvent(new Event('google-signin-ready', { bubbles: true }));
                                }
                            }
                        } else {
                            console.warn('⚠️ [Android] Button div not found yet');
                        }
                    }, 500);
                    return;
                }
                
                // Check if script tag already exists in DOM
                var existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
                if (existingScript) {
                    console.log('📜 [Android] Google Sign-In script tag exists, waiting for load...');
                    console.log('📜 [Android] Script src:', existingScript.src);
                    console.log('📜 [Android] Script async:', existingScript.async);
                    console.log('📜 [Android] Script defer:', existingScript.defer);
                    
                    // Wait for it to load with aggressive polling
                    var attempts = 0;
                    var maxAttempts = 50; // 5 seconds max
                    var checkLoaded = setInterval(function() {
                        attempts++;
                        console.log('📜 [Android] Checking SDK load, attempt:', attempts);
                        if (window.google && window.google.accounts && window.google.accounts.id) {
                            clearInterval(checkLoaded);
                            console.log('✅ [Android] Google Sign-In SDK loaded from existing script');
                            if (window.dispatchEvent) {
                                window.dispatchEvent(new Event('google-signin-ready', { bubbles: true }));
                            }
                        } else if (attempts >= maxAttempts) {
                            clearInterval(checkLoaded);
                            console.error('❌ [Android] Timeout waiting for Google SDK to load after', attempts, 'attempts');
                            console.error('❌ [Android] Window.google:', typeof window.google);
                            console.error('❌ [Android] Window.google?.accounts:', typeof window.google?.accounts);
                            console.error('❌ [Android] Window.google?.accounts?.id:', typeof window.google?.accounts?.id);
                        }
                    }, 100);
                    return;
                }
                
                // Create and load script dynamically
                console.log('🔐 [Android] Creating and loading Google Sign-In SDK script...');
                var script = document.createElement('script');
                script.src = 'https://accounts.google.com/gsi/client';
                script.async = false; // CRITICAL: Remove async for WebView compatibility
                script.defer = false; // CRITICAL: Remove defer for WebView compatibility
                script.crossOrigin = 'anonymous';
                script.onload = function() {
                    console.log('✅ [Android] Google Sign-In SDK script loaded successfully');
                    // Wait for SDK to initialize with multiple checks
                    var initAttempts = 0;
                    var initCheck = setInterval(function() {
                        initAttempts++;
                        if (window.google && window.google.accounts && window.google.accounts.id) {
                            clearInterval(initCheck);
                            console.log('✅ [Android] Google Sign-In SDK initialized successfully');
                            if (window.dispatchEvent) {
                                window.dispatchEvent(new Event('google-signin-ready', { bubbles: true }));
                            }
                        } else if (initAttempts >= 20) {
                            clearInterval(initCheck);
                            console.warn('⚠️ [Android] Google SDK script loaded but not initialized after 2 seconds');
                            console.warn('⚠️ [Android] Window.google:', typeof window.google);
                            // Still dispatch event - React component will retry
                            if (window.dispatchEvent) {
                                window.dispatchEvent(new Event('google-signin-ready', { bubbles: true }));
                            }
                        }
                    }, 100);
                };
                script.onerror = function(error) {
                    console.error('❌ [Android] Failed to load Google Sign-In SDK:', error);
                    console.error('❌ [Android] Error details:', JSON.stringify(error));
                    // Retry after delay
                    setTimeout(function() {
                        console.log('🔄 [Android] Retrying Google Sign-In SDK load...');
                        var retryScript = script.cloneNode(true);
                        document.head.appendChild(retryScript);
                    }, 2000);
                };
                
                // Insert at the beginning of head to ensure early loading
                if (document.head.firstChild) {
                    document.head.insertBefore(script, document.head.firstChild);
                } else {
                    document.head.appendChild(script);
                }
                console.log('📝 [Android] Google Sign-In script tag added to DOM');
            })();
        """.trimIndent()

        webView.evaluateJavascript(script, null)
    }

    private fun injectDirectGoogleSignInButton() {
        val googleClientId = "91768461103-ss664383b8aaoq2l5kjbud3c4m17j7md.apps.googleusercontent.com"
        val redirectUri = "https://cool-tartufo-a76644.netlify.app/" // Must match Google Cloud Console
        
        val script = """
            (function() {
                console.log('🔐 [Android] Injecting direct Google Sign-In button...');
                
                var buttonDiv = document.getElementById('google-signin-button');
                if (!buttonDiv) {
                    console.warn('⚠️ [Android] Button div not found, creating it...');
                    // Try to find the auth form and inject button div
                    var authForm = document.querySelector('form') || document.querySelector('[class*="auth"]') || document.querySelector('[class*="sign"]');
                    if (authForm) {
                        var newDiv = document.createElement('div');
                        newDiv.id = 'google-signin-button';
                        newDiv.className = 'w-full flex justify-center min-h-[48px]';
                        newDiv.style.minHeight = '48px';
                        authForm.insertBefore(newDiv, authForm.firstChild);
                        buttonDiv = newDiv;
                    } else {
                        // Try to find by text content
                        var signInText = Array.from(document.querySelectorAll('*')).find(el => 
                            el.textContent && (el.textContent.includes('Sign In') || el.textContent.includes('Sign Up'))
                        );
                        if (signInText && signInText.parentElement) {
                            var newDiv = document.createElement('div');
                            newDiv.id = 'google-signin-button';
                            newDiv.className = 'w-full flex justify-center min-h-[48px]';
                            newDiv.style.minHeight = '48px';
                            signInText.parentElement.insertBefore(newDiv, signInText);
                            buttonDiv = newDiv;
                        } else {
                            console.error('❌ [Android] Cannot find auth form to inject button');
                            return;
                        }
                    }
                }
                
                // Clear existing content
                buttonDiv.innerHTML = '';
                
                // Create a custom Google Sign-In button that works in WebView
                var button = document.createElement('button');
                button.type = 'button';
                button.className = 'google-sign-in-button';
                button.style.cssText = 'width: 100%; max-width: 320px; height: 48px; background: white; border: 1px solid #dadce0; border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-family: Roboto, sans-serif; font-size: 14px; font-weight: 500; color: #3c4043; box-shadow: 0 1px 2px rgba(0,0,0,0.1); margin: 0 auto;';
                
                // Add Google logo SVG
                var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.setAttribute('width', '18');
                svg.setAttribute('height', '18');
                svg.setAttribute('viewBox', '0 0 18 18');
                svg.style.marginRight = '8px';
                
                var path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path1.setAttribute('fill', '#4285F4');
                path1.setAttribute('d', 'M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z');
                
                var path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path2.setAttribute('fill', '#34A853');
                path2.setAttribute('d', 'M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z');
                
                var path3 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path3.setAttribute('fill', '#FBBC05');
                path3.setAttribute('d', 'M3.964 10.712c-.18-.54-.282-1.117-.282-1.712 0-.595.102-1.172.282-1.712V4.956H.957C.348 6.175 0 7.55 0 9s.348 2.825.957 4.044l3.007-2.332z');
                
                var path4 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path4.setAttribute('fill', '#EA4335');
                path4.setAttribute('d', 'M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.956L3.964 7.288C4.672 5.163 6.656 3.58 9 3.58z');
                
                svg.appendChild(path1);
                svg.appendChild(path2);
                svg.appendChild(path3);
                svg.appendChild(path4);
                
                var text = document.createTextNode('Sign in with Google');
                button.appendChild(svg);
                button.appendChild(text);
                
                // Add hover effect
                button.onmouseenter = function() {
                    button.style.boxShadow = '0 2px 4px rgba(0,0,0,0.15)';
                    button.style.backgroundColor = '#f8f9fa';
                };
                button.onmouseleave = function() {
                    button.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
                    button.style.backgroundColor = 'white';
                };
                
                // Add click handler - Use Google Sign-In SDK credential flow (no redirect URI needed)
                button.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🔐 [Android] Google Sign-In button clicked');
                    
                    // CRITICAL: Use Google Sign-In SDK credential flow (works without redirect URI)
                    if (window.google && window.google.accounts && window.google.accounts.id) {
                        console.log('✅ [Android] Using Google Sign-In SDK credential flow');
                        try {
                            // Initialize if not already done
                            if (!window.google.accounts.id._initialized) {
                                window.google.accounts.id.initialize({
                                    client_id: '$googleClientId',
                                    callback: function(response) {
                                        console.log('✅ [Android] Google Sign-In credential received');
                                        // Send credential to web app's auth handler
                                        if (window.signInWithGoogle) {
                                            window.signInWithGoogle(response.credential);
                                        } else {
                                            // Try to find and trigger the web app's handler
                                            var event = new CustomEvent('google-signin-success', { 
                                                detail: { credential: response.credential } 
                                            });
                                            window.dispatchEvent(event);
                                        }
                                    },
                                    auto_select: false,
                                    cancel_on_tap_outside: true
                                });
                            }
                            // Trigger the sign-in prompt
                            window.google.accounts.id.prompt(function(notification) {
                                console.log('🔐 [Android] Google Sign-In prompt notification:', notification);
                                if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                                    console.warn('⚠️ [Android] Google Sign-In prompt not displayed, trying OAuth fallback');
                                    // Fallback to OAuth with correct redirect URI
                                    var correctRedirectUri = encodeURIComponent('$redirectUri');
                                    var scope = 'openid email profile';
                                    var googleAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' +
                                        'client_id=$googleClientId' +
                                        '&redirect_uri=' + correctRedirectUri +
                                        '&response_type=code' +
                                        '&scope=' + encodeURIComponent(scope) +
                                        '&access_type=offline' +
                                        '&prompt=select_account';
                                    window.location.href = googleAuthUrl;
                                }
                            });
                        } catch (err) {
                            console.error('❌ [Android] SDK error:', err);
                            // Fallback to OAuth with correct redirect URI
                            var correctRedirectUri = encodeURIComponent('$redirectUri');
                            var scope = 'openid email profile';
                            var googleAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' +
                                'client_id=$googleClientId' +
                                '&redirect_uri=' + correctRedirectUri +
                                '&response_type=code' +
                                '&scope=' + encodeURIComponent(scope) +
                                '&access_type=offline' +
                                '&prompt=select_account';
                            window.location.href = googleAuthUrl;
            }
        } else {
                        // SDK not loaded - use OAuth with correct redirect URI
                        console.log('⚠️ [Android] SDK not available, using OAuth redirect');
                        var correctRedirectUri = encodeURIComponent('$redirectUri');
                        var scope = 'openid email profile';
                        var googleAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' +
                            'client_id=$googleClientId' +
                            '&redirect_uri=' + correctRedirectUri +
                            '&response_type=code' +
                            '&scope=' + encodeURIComponent(scope) +
                            '&access_type=offline' +
                            '&prompt=select_account';
                        console.log('🔐 [Android] OAuth URL:', googleAuthUrl);
                        window.location.href = googleAuthUrl;
                    }
                };
                
                buttonDiv.appendChild(button);
                buttonDiv.style.display = 'block';
                buttonDiv.style.visibility = 'visible';
                buttonDiv.style.opacity = '1';
                
                console.log('✅ [Android] Direct Google Sign-In button injected successfully');
            })();
        """.trimIndent()
        
        webView.evaluateJavascript(script, null)
    }

    fun onPremiumStatusDetected(isPremium: Boolean) {
        isPremiumUser = isPremium

        // DISABLED: AdMob banner ads removed per client request
        // Client wants only AdSense in-feed ads (inline with posts), not banner ads
        // Banner containers hidden to provide clean experience
            adContainerTop.visibility = View.GONE
            adContainerBottom.visibility = View.GONE

        if (!isPremium) {
            // AdMob banners disabled - using AdSense in-feed ads only
            // Once AdSense is approved, ads will show inline in the WebView feed
            
            // Optional: Interstitial ads also disabled for clean experience
            // Uncomment below to re-enable popup ads every 3 sessions
            // if (sessionCount % 3 == 0) {
            //     showInterstitialAd()
            // }
        }
    }

    fun onScrollUpdate(scrollPercentage: Float, articleCount: Int, scrollPosition: Int) {
        // Disabled: Native ad overlay removed - web app already handles in-feed ads via AdSense
        // The web app shows ads inline every 7 posts, so we don't need Android overlay ads
        // if (!isPremiumUser && adManager != null) {
        //     adManager?.handleScrollPosition(scrollPercentage, articleCount, scrollPosition)
        // }
    }

    private fun loadInterstitialAd() {
        if (isPremiumUser) return

        val adRequest = AdRequest.Builder().build()
        val adUnitId = if (com.nuuz.app.BuildConfig.DEBUG) {
            "ca-app-pub-3940256099942544/1033173712" // Test ad unit
        } else {
            "ca-app-pub-1594396899801208/4467770069" // Production interstitial ad unit
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
        
        // CRITICAL: Check for OAuth callback when app resumes (e.g., after Custom Tabs closes)
        // This handles the case where Google redirects but deep link doesn't trigger automatically
        val intent = this.intent
        if (intent != null && intent.data != null) {
            val data = intent.data?.toString()
            if (data != null && data.contains("netlify.app") && 
                (data.contains("id_token=") || data.contains("#id_token="))) {
                android.util.Log.d("WebView", "✅ OAuth callback detected in onResume via intent")
                handleOAuthCallback(intent)
            }
        }
        
        // Also check WebView's current URL in case redirect happened there
        try {
            val currentUrl = webView.url
            if (currentUrl != null && currentUrl.contains("netlify.app") && 
                (currentUrl.contains("id_token=") || currentUrl.contains("#id_token="))) {
                android.util.Log.d("WebView", "✅ OAuth callback detected in onResume via WebView URL")
                // Create an intent-like structure to pass to handler
                val fakeIntent = android.content.Intent().apply {
                    data = Uri.parse(currentUrl)
                }
                handleOAuthCallback(fakeIntent)
            }
        } catch (e: Exception) {
            android.util.Log.e("WebView", "Error checking WebView URL in onResume: ${e.message}")
        }
    }
}
