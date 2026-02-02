import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { Header } from './components/Header';
import { NewsFeed } from './components/NewsFeed';
import { BottomNav } from './components/BottomNav';
import { AIChat } from './components/AIChat';
import { AuthModal } from './components/AuthModal';
import { PremiumModal } from './components/PremiumModal';
import { SearchView } from './components/SearchView';
import { SavedView } from './components/SavedView';
import { ScrollToTop } from './components/ScrollToTop';
import { useApp } from './contexts/AppContext';

// Global OAuth callback handler - works even if AuthModal isn't mounted
// Handles both OAuth redirects from Custom Tabs and native Android sign-in tokens
const OAuthCallbackHandler = () => {
  const { signInWithGoogle } = useAuth();
  const { setShowAuthModal } = useApp();
  
  useEffect(() => {
    // Helper function to process token
    const processToken = (token: string, source: string) => {
      console.log(`✅ [Global] Processing token from ${source}`);
      console.log('🔐 [Global] Token length:', token.length);
      console.log('🔐 [Global] Token preview:', token.substring(0, 50) + '...');
      
      signInWithGoogle(token)
        .then(() => {
          console.log('✅ [Global] Sign-in successful - user state saved');
          setShowAuthModal(false);
        })
        .catch((err) => {
          console.error('❌ [Global] Sign-in failed:', err);
          console.error('❌ [Global] Error details:', JSON.stringify(err, null, 2));
          alert('Sign-in failed: ' + (err.message || 'Unknown error'));
        });
    };
    
    // 1. Check localStorage for token (from native Android sign-in - most reliable)
    const checkLocalStorageToken = () => {
      const storedToken = localStorage.getItem('__google_signin_token');
      if (storedToken) {
        console.log('✅ [Global] Found token in localStorage');
        localStorage.removeItem('__google_signin_token');
        processToken(storedToken, 'localStorage');
        return true;
      }
      return false;
    };
    
    // Check immediately
    if (checkLocalStorageToken()) {
      // Token found and processed, set up polling to catch any missed tokens
      const interval = setInterval(() => {
        if (!checkLocalStorageToken()) {
          clearInterval(interval);
        }
      }, 500);
      
      return () => clearInterval(interval);
    }
    
    // 2. Check for id_token in URL hash or query params (OAuth callback from Custom Tabs)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const queryParams = new URLSearchParams(window.location.search);
    const idToken = hashParams.get('id_token') || queryParams.get('id_token');
    
    if (idToken) {
      console.log('✅ [Global] OAuth callback detected - processing id_token');
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      processToken(idToken, 'URL');
    }
    
    // 3. Listen for native Android Google Sign-In token events
    const handleNativeSignIn = (event: CustomEvent) => {
      const token = event.detail?.credential;
      if (token) {
        processToken(token, 'event');
      } else {
        console.error('❌ [Global] Token missing in event detail:', event.detail);
      }
    };
    
    window.addEventListener('google-signin-token', handleNativeSignIn as EventListener);
    console.log('✅ [Global] Event listener registered for google-signin-token');
    
    // 4. Check window object (fallback)
    const checkWindowToken = () => {
      const storedToken = (window as any).__pendingGoogleToken;
      if (storedToken) {
        console.log('✅ [Global] Found token in window object');
        delete (window as any).__pendingGoogleToken;
        processToken(storedToken, 'window object');
        return true;
      }
      return false;
    };
    
    // Set up polling for localStorage and window object
    const tokenCheckInterval = setInterval(() => {
      checkLocalStorageToken() || checkWindowToken();
    }, 500);
    
    // Cleanup
    return () => {
      window.removeEventListener('google-signin-token', handleNativeSignIn as EventListener);
      clearInterval(tokenCheckInterval);
    };
  }, [signInWithGoogle, setShowAuthModal]);
  
  return null; // This component doesn't render anything
};

const AppContent = () => {
  const { currentCategory, showAIChat, showAuthModal, showPremiumModal, setShowPremiumModal } = useApp();
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Header />
      {currentCategory === 'search' ? (
        <SearchView />
      ) : currentCategory === 'saved' ? (
        <SavedView />
      ) : (
        <NewsFeed />
      )}
      <BottomNav />
      {showAIChat && <AIChat />}
      {showAuthModal && <AuthModal />}
      {showPremiumModal && <PremiumModal onClose={() => setShowPremiumModal(false)} />}
      {showScrollToTop && <ScrollToTop />}
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SettingsProvider>
          <AppProvider>
            <OAuthCallbackHandler />
            <AppContent />
          </AppProvider>
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;