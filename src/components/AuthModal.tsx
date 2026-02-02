import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { Mail, Lock, User, Loader, X, Sparkles, Heart, MapPin } from 'lucide-react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || import.meta.env.GOOGLE_CLIENT_ID || '91768461103-ss664383b8aaoq2l5kjbud3c4m17j7md.apps.googleusercontent.com';

export const AuthModal = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const { showAuthModal, setShowAuthModal } = useApp();

  const handleGoogleSignIn = async (response: any) => {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/68cfcee5-bad9-41d1-b318-97472c48b54e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthModal.tsx:handleGoogleSignIn',message:'handleGoogleSignIn called',data:{hasCredential:!!response?.credential,responseType:typeof response},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    setLoading(true);
    setError('');

    try {
      await signInWithGoogle(response.credential);
      console.log('✅ Google Sign-In successful');
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/68cfcee5-bad9-41d1-b318-97472c48b54e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthModal.tsx:google-signin-success',message:'Google Sign-In success',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      setShowAuthModal(false);
    } catch (err: any) {
      console.error('❌ Google Sign-In error:', err);
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/68cfcee5-bad9-41d1-b318-97472c48b54e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthModal.tsx:google-signin-error',message:'Google Sign-In error',data:{error:err?.message,errorType:typeof err},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      setError(err.message || 'Google Sign-In failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle OAuth callback with id_token from URL (for WebView manual redirect)
  // NOTE: This is a backup handler - the global handler in App.tsx should handle it first
  useEffect(() => {
    // Check for id_token in URL hash or query params (OAuth callback)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const queryParams = new URLSearchParams(window.location.search);
    const idToken = hashParams.get('id_token') || queryParams.get('id_token');
    
    if (idToken) {
      console.log('✅ [AuthModal] OAuth callback detected - processing id_token');
      console.log('🔐 [AuthModal] Token length:', idToken.length);
      
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/68cfcee5-bad9-41d1-b318-97472c48b54e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthModal.tsx:oauth-callback',message:'OAuth callback detected',data:{hasIdToken:!!idToken,source:hashParams.get('id_token')?'hash':'query'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      
      // Clean URL immediately to prevent re-processing
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      
      // Process the token
      handleGoogleSignIn({ credential: idToken });
    }
  }, [handleGoogleSignIn]); // Include handleGoogleSignIn in dependencies

  useEffect(() => {
    if (!showAuthModal) return;

    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/68cfcee5-bad9-41d1-b318-97472c48b54e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthModal.tsx:18',message:'useEffect started',data:{showAuthModal},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // Detect if running in Android WebView
    const userAgent = navigator.userAgent;
    const hasWv = /wv|WebView/i.test(userAgent);
    const hasWvString = userAgent.includes('wv');
    const hasAndroidBridge = (window as any).AndroidBridge !== undefined;
    const isWebView = hasWv || hasWvString || hasAndroidBridge;

    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/68cfcee5-bad9-41d1-b318-97472c48b54e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthModal.tsx:25',message:'WebView detection result',data:{userAgent,hasWv,hasWvString,hasAndroidBridge,isWebView},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    const buttonDiv = document.getElementById('google-signin-button-modal');
    
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/68cfcee5-bad9-41d1-b318-97472c48b54e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthModal.tsx:30',message:'Button div check',data:{buttonDivExists:!!buttonDiv},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    if (!buttonDiv) return;

    const hasGoogleSDK = !!(window.google && window.google.accounts && window.google.accounts.id);
    
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/68cfcee5-bad9-41d1-b318-97472c48b54e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthModal.tsx:35',message:'Google SDK check',data:{hasGoogleSDK,hasWindowGoogle:!!window.google,hasAccounts:!!window.google?.accounts,hasId:!!window.google?.accounts?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    if (hasGoogleSDK) {
      const uxMode = isWebView ? 'redirect' : 'popup';
      
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/68cfcee5-bad9-41d1-b318-97472c48b54e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthModal.tsx:42',message:'Initializing Google SDK',data:{uxMode,isWebView,clientId:GOOGLE_CLIENT_ID},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      // Initialize Google Sign-In SDK
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleSignIn,
        auto_select: false,
        cancel_on_tap_outside: true,
        // Use redirect mode in WebView - this will show account picker
        ux_mode: uxMode,
        itp_support: true
      });

      buttonDiv.innerHTML = '';
      
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/68cfcee5-bad9-41d1-b318-97472c48b54e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthModal.tsx:55',message:'Rendering button',data:{isWebView,uxMode},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      if (isWebView) {
        // In WebView, use custom button that triggers native Android Google Sign-In
        // This shows the native account picker instead of OAuth redirect
        buttonDiv.innerHTML = '';
        
        // Listen for native sign-in token event
        const handleNativeSignIn = (event: CustomEvent) => {
          const token = event.detail?.credential;
          if (token) {
            console.log('✅ [WebView] Received token from native Android sign-in');
            handleGoogleSignIn({ credential: token });
          }
        };
        
        window.addEventListener('google-signin-token', handleNativeSignIn as EventListener);
        
        // Create custom Google Sign-In button
        const customButton = document.createElement('button');
        customButton.type = 'button';
        customButton.className = 'google-signin-custom-button';
        customButton.style.cssText = 'width: 100%; max-width: 320px; height: 48px; background: white; border: 1px solid #dadce0; border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-family: Roboto, sans-serif; font-size: 14px; font-weight: 500; color: #3c4043; box-shadow: 0 1px 2px rgba(0,0,0,0.1); margin: 0 auto; transition: background-color 0.2s, box-shadow 0.2s;';
        
        // Add Google logo SVG
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '18');
        svg.setAttribute('height', '18');
        svg.setAttribute('viewBox', '0 0 18 18');
        svg.style.marginRight = '8px';
        svg.innerHTML = '<path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/><path fill="#FBBC05" d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.712 0-.595.102-1.172.282-1.712V4.956H.957C.348 6.175 0 7.55 0 9s.348 2.825.957 4.044l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.956L3.964 7.288C4.672 5.163 6.656 3.58 9 3.58z"/>';
        
        const text = document.createTextNode(isLogin ? 'Sign in with Google' : 'Sign up with Google');
        customButton.appendChild(svg);
        customButton.appendChild(text);
        
        // Add hover effect
        customButton.onmouseenter = () => {
          customButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.15)';
          customButton.style.backgroundColor = '#f8f9fa';
        };
        customButton.onmouseleave = () => {
          customButton.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
          customButton.style.backgroundColor = 'white';
        };
        
        // Click handler - trigger native Android Google Sign-In
        customButton.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          console.log('🔐 [WebView] Button clicked - triggering native Android Google Sign-In');
          console.log('🔍 [WebView] Checking AndroidBridge availability...');
          console.log('🔍 [WebView] AndroidBridge exists:', !!(window as any).AndroidBridge);
          console.log('🔍 [WebView] AndroidBridge.triggerGoogleSignIn exists:', !!((window as any).AndroidBridge?.triggerGoogleSignIn));
          
          // #region agent log
          fetch('http://127.0.0.1:7244/ingest/68cfcee5-bad9-41d1-b318-97472c48b54e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthModal.tsx:webview-button-click',message:'WebView custom button clicked - triggering native sign-in',data:{hasAndroidBridge:!!(window as any).AndroidBridge,hasTriggerMethod:!!((window as any).AndroidBridge?.triggerGoogleSignIn)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
          
          // Use native Android Google Sign-In SDK (shows native account picker)
          // Check multiple times with a small delay in case AndroidBridge loads asynchronously
          const tryNativeSignIn = (attempts = 0) => {
            if ((window as any).AndroidBridge && typeof (window as any).AndroidBridge.triggerGoogleSignIn === 'function') {
              console.log('✅ [WebView] AndroidBridge.triggerGoogleSignIn available, calling it...');
              try {
                (window as any).AndroidBridge.triggerGoogleSignIn();
                console.log('✅ [WebView] triggerGoogleSignIn() called successfully');
              } catch (err) {
                console.error('❌ [WebView] Error calling triggerGoogleSignIn:', err);
                alert('Error triggering sign-in: ' + (err as Error).message);
              }
            } else if (attempts < 5) {
              // Wait a bit and try again (AndroidBridge might be loading)
              console.log(`⏳ [WebView] AndroidBridge not ready, retrying... (attempt ${attempts + 1}/5)`);
              setTimeout(() => tryNativeSignIn(attempts + 1), 200);
            } else {
              // After 5 attempts, show error and don't fall back to OAuth
              console.error('❌ [WebView] AndroidBridge.triggerGoogleSignIn not available after 5 attempts');
              alert('Native sign-in not available. Please ensure you are using the latest version of the app.');
            }
          };
          
          tryNativeSignIn();
        };
        
        buttonDiv.appendChild(customButton);
      } else {
        // Normal browser - use SDK popup mode (works perfectly)
        window.google.accounts.id.renderButton(buttonDiv, {
          theme: 'outline',
          size: 'large',
          text: isLogin ? 'signin_with' : 'signup_with',
          shape: 'rectangular',
          width: '100%'
        });
      }
      
      // Prevent Google SDK from auto-rendering additional buttons
      window.google.accounts.id.cancel();
      
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/68cfcee5-bad9-41d1-b318-97472c48b54e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthModal.tsx:75',message:'Button rendered',data:{buttonDivChildren:buttonDiv.children.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      
      // Add click listener to track button interactions
      setTimeout(() => {
        const renderedButton = buttonDiv.querySelector('div[role="button"], button, iframe');
        if (renderedButton) {
          // #region agent log
          fetch('http://127.0.0.1:7244/ingest/68cfcee5-bad9-41d1-b318-97472c48b54e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthModal.tsx:80',message:'Button element found',data:{tagName:renderedButton.tagName,isIframe:renderedButton.tagName==='IFRAME'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          
          // Monitor for redirects
          const originalLocation = window.location.href;
          const checkRedirect = setInterval(() => {
            if (window.location.href !== originalLocation) {
              // #region agent log
              fetch('http://127.0.0.1:7244/ingest/68cfcee5-bad9-41d1-b318-97472c48b54e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthModal.tsx:87',message:'Page redirect detected',data:{newUrl:window.location.href,originalUrl:originalLocation},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
              // #endregion
              clearInterval(checkRedirect);
            }
          }, 100);
          
          // Clean up after 10 seconds
          setTimeout(() => clearInterval(checkRedirect), 10000);
        }
      }, 500);
    } else {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/68cfcee5-bad9-41d1-b318-97472c48b54e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthModal.tsx:78',message:'Google SDK not available',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
    }
  }, [isLogin, showAuthModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, fullName);
      }
      setShowAuthModal(false);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!showAuthModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative my-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => setShowAuthModal(false)}
          className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-lg transition"
        >
          <X size={24} className="text-slate-600" />
        </button>

        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              {isLogin ? 'Welcome back' : 'Join Nuuz'}
            </h2>
            <p className="text-slate-600">
              {isLogin
                ? 'Sign in to access your personalized feed'
                : 'Create an account to unlock premium features'}
            </p>
          </div>

          {!isLogin && typeof window !== 'undefined' && window.innerWidth >= 640 && (
            <div className="mb-6 space-y-3">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <Heart className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">Save Your Favorites</h3>
                  <p className="text-xs text-slate-600">Bookmark articles to read later</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <MapPin className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">Local News</h3>
                  <p className="text-xs text-slate-600">Get news relevant to your area</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <Sparkles className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">Sync Across Devices</h3>
                  <p className="text-xs text-slate-600">Access your preferences anywhere</p>
                </div>
              </div>
            </div>
          )}

          <div className="mb-4">
            <div id="google-signin-button-modal" className="w-full flex justify-center"></div>
          </div>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
