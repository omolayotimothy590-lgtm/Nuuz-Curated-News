import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, Loader } from 'lucide-react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || import.meta.env.GOOGLE_CLIENT_ID || '91768461103-ss664383b8aaoq2l5kjbud3c4m17j7md.apps.googleusercontent.com';

export const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signUp, signInWithGoogle } = useAuth();

  const loadGoogleSDK = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.google?.accounts?.id) {
        console.log('✅ Google Sign-In SDK already loaded');
        resolve();
        return;
      }

      console.log('🔐 Loading Google Sign-In SDK...');
      
      // Check if script already exists
      const existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
      if (existingScript) {
        // Script exists, wait for it to load
        const checkLoaded = setInterval(() => {
          if (window.google?.accounts?.id) {
            clearInterval(checkLoaded);
            console.log('✅ Google Sign-In SDK loaded from existing script');
            resolve();
          }
        }, 100);
        
        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkLoaded);
          if (!window.google?.accounts?.id) {
            reject(new Error('Google SDK failed to load'));
          }
        }, 10000);
        return;
      }

      // Create and load script
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('✅ Google Sign-In SDK script loaded');
        // Wait a bit for the SDK to initialize
        setTimeout(() => {
          if (window.google?.accounts?.id) {
            resolve();
          } else {
            reject(new Error('Google SDK not available after script load'));
          }
        }, 500);
      };
      script.onerror = () => {
        console.error('❌ Failed to load Google Sign-In SDK');
        reject(new Error('Failed to load Google SDK script'));
      };
      document.head.appendChild(script);
    });
  };

  const initializeGoogleSignIn = async () => {
    try {
      // Ensure SDK is loaded
      await loadGoogleSDK();

      if (!window.google?.accounts?.id) {
        console.error('❌ Google Sign-In SDK not available');
        return;
      }

      console.log('🔐 Initializing Google Sign-In with Client ID:', GOOGLE_CLIENT_ID);

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleSignIn,
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: false
      });

      // Render the button - with retry logic for WebView
      const buttonDiv = document.getElementById('google-signin-button');
      if (buttonDiv) {
        // Clear any existing content
        buttonDiv.innerHTML = '';
        
        // Ensure div is visible and has dimensions
        if (buttonDiv.style.display === 'none') {
          buttonDiv.style.display = 'block';
        }
        if (!buttonDiv.style.minHeight) {
          buttonDiv.style.minHeight = '48px';
        }
        
        try {
          window.google.accounts.id.renderButton(buttonDiv, {
            theme: 'outline',
            size: 'large',
            text: isLogin ? 'signin_with' : 'signup_with',
            shape: 'rectangular',
            width: buttonDiv.clientWidth || 320
          });
          console.log('✅ Google Sign-In button rendered successfully');
          
          // Verify button was actually rendered (for WebView debugging)
          setTimeout(() => {
            if (buttonDiv.children.length === 0) {
              console.warn('⚠️ Button render called but no children found - retrying...');
              // Retry render
              buttonDiv.innerHTML = '';
              window.google.accounts.id.renderButton(buttonDiv, {
                theme: 'outline',
                size: 'large',
                text: isLogin ? 'signin_with' : 'signup_with',
                shape: 'rectangular',
                width: 320
              });
            } else {
              console.log('✅ Button verified - children count:', buttonDiv.children.length);
            }
          }, 1000);
        } catch (error) {
          console.error('❌ Error rendering button:', error);
          // Retry after delay
          setTimeout(() => {
            console.log('🔄 Retrying button render after error...');
            initializeGoogleSignIn();
          }, 2000);
        }
      } else {
        console.warn('⚠️ Google Sign-In button div not found');
        // Retry finding the div
        setTimeout(() => {
          const retryDiv = document.getElementById('google-signin-button');
          if (retryDiv) {
            console.log('✅ Button div found on retry');
            initializeGoogleSignIn();
          }
        }, 1000);
      }
    } catch (error) {
      console.error('❌ Error initializing Google Sign-In:', error);
      // Retry after a delay
      setTimeout(() => {
        console.log('🔄 Retrying Google Sign-In initialization...');
        initializeGoogleSignIn();
      }, 2000);
    }
  };

  useEffect(() => {
    // CRITICAL: For WebView, we need to be more aggressive
    // Check if we're in a WebView environment
    const isWebView = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && 
                      !/Chrome|Safari|Firefox|Edge/i.test(navigator.userAgent);
    
    console.log('🔍 Environment detected:', { isWebView, userAgent: navigator.userAgent });

    // Initial attempt - try multiple times for WebView
    let attemptCount = 0;
    const maxAttempts = isWebView ? 10 : 3;
    
    const tryInitialize = () => {
      attemptCount++;
      console.log(`🔄 Initialization attempt ${attemptCount}/${maxAttempts}`);
      initializeGoogleSignIn();
      
      if (attemptCount < maxAttempts) {
        setTimeout(tryInitialize, isWebView ? 1500 : 2000);
      }
    };
    
    tryInitialize();

    // Listen for Google Sign-In SDK ready event (from Android WebView injection)
    const handleGoogleReady = () => {
      console.log('🔔 Google Sign-In SDK ready event received');
      setTimeout(() => {
        initializeGoogleSignIn();
      }, 500);
    };

    window.addEventListener('google-signin-ready', handleGoogleReady);

    // Aggressive checking for WebView - check every second
    const checkInterval = setInterval(() => {
      const buttonDiv = document.getElementById('google-signin-button');
      if (buttonDiv) {
        const hasChildren = buttonDiv.hasChildNodes();
        const hasGoogleSDK = window.google?.accounts?.id;
        
        console.log('🔍 Button check:', { 
          hasChildren, 
          hasGoogleSDK, 
          buttonDivExists: !!buttonDiv 
        });
        
        if (!hasChildren && hasGoogleSDK) {
          console.log('🔄 Button container empty but SDK available - forcing render...');
          initializeGoogleSignIn();
        } else if (!hasGoogleSDK && !hasChildren) {
          // SDK not loaded yet, try to load it
          console.log('🔄 SDK not loaded - attempting to load...');
          loadGoogleSDK().then(() => {
            initializeGoogleSignIn();
          }).catch((err) => {
            console.error('❌ Failed to load SDK:', err);
          });
        }
      } else {
        console.warn('⚠️ Button div not found yet');
      }
    }, isWebView ? 1000 : 2000);

    return () => {
      window.removeEventListener('google-signin-ready', handleGoogleReady);
      clearInterval(checkInterval);
    };
  }, [isLogin]);

  const handleGoogleSignIn = async (response: any) => {
    console.log('🔐 Google Sign-In callback triggered');
    setLoading(true);
    setError('');

    try {
      if (!response.credential) {
        throw new Error('No credential received from Google');
      }

      await signInWithGoogle(response.credential);
    } catch (err: any) {
      console.error('❌ Google Sign-In error:', err);
      setError(err.message || 'Google Sign-In failed');
    } finally {
      setLoading(false);
    }
  };

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
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Nuuz</h1>
          <p className="text-slate-600">Your morning news, simplified</p>
        </div>

        <div className="mb-6">
          <div 
            id="google-signin-button" 
            className="w-full flex justify-center min-h-[48px]"
            style={{ minHeight: '48px' }}
          ></div>
        </div>

        <div className="relative mb-6">
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
                {isLogin ? 'Signing in...' : 'Signing up...'}
              </>
            ) : (
              isLogin ? 'Sign In' : 'Sign Up'
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
  );
};
