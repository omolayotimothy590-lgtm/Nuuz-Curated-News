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
// Handles OAuth redirects from Custom Tabs when user completes Google Sign-In
const OAuthCallbackHandler = () => {
  const { signInWithGoogle } = useAuth();
  const { setShowAuthModal } = useApp();
  
  useEffect(() => {
    // Check for id_token in URL hash or query params (OAuth callback from Custom Tabs)
    // Google OAuth typically returns id_token in the hash fragment: #id_token=...
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const queryParams = new URLSearchParams(window.location.search);
    const idToken = hashParams.get('id_token') || queryParams.get('id_token');
    
    if (idToken) {
      console.log('✅ [Global] OAuth callback detected - processing id_token');
      console.log('🔐 [Global] Token length:', idToken.length);
      console.log('🔐 [Global] Token source:', hashParams.get('id_token') ? 'hash' : 'query');
      
      // Clean URL immediately to prevent re-processing
      // Use replaceState to avoid page reload which would clear React state
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      console.log('🔧 [Global] URL cleaned, navigating to:', cleanUrl);
      
      // Process the token - this will save to localStorage and update React state
      signInWithGoogle(idToken)
        .then(() => {
          console.log('✅ [Global] Sign-in successful - user state saved to localStorage');
          console.log('✅ [Global] Closing auth modal');
          setShowAuthModal(false);
          
          // CRITICAL: Do NOT reload page - it clears React state before it's saved
          // Auth state is already persisted in localStorage and React context
          // Navigation without reload preserves the authenticated state
          console.log('✅ [Global] Auth state persisted - no reload needed');
        })
        .catch((err) => {
          console.error('❌ [Global] OAuth callback failed:', err);
          console.error('❌ [Global] Error details:', JSON.stringify(err, null, 2));
          alert('Sign-in failed: ' + (err.message || 'Unknown error'));
        });
    }
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