import { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
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
            <AppContent />
          </AppProvider>
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;