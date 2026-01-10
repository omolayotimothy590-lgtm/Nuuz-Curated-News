import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { Settings } from 'lucide-react';
import { SettingsView } from './SettingsView';
import { Logo } from './Logo';

export const Header = () => {
  const { user } = useAuth();
  const { setShowAuthModal, setCurrentCategory } = useApp();
  const [showSettings, setShowSettings] = useState(false);

  const handleProfileClick = () => {
    if (user) {
      setShowSettings(true);
    } else {
      setShowAuthModal(true);
    }
  };

  const handleLogoClick = () => {
    setCurrentCategory('discover');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center justify-between h-14 px-4">
          <button
            onClick={handleLogoClick}
            className="hover:opacity-80 transition active:scale-95"
          >
            <Logo />
          </button>

          {user && user.avatar ? (
            <button
              onClick={handleProfileClick}
              className="flex items-center gap-2 hover:opacity-80 transition active:scale-95"
              title="Settings"
            >
              <img
                src={user.avatar}
                alt={user.fullName || user.email}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700"
                width="32"
                height="32"
              />
            </button>
          ) : (
            <button
              onClick={handleProfileClick}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
              title={user ? 'Settings' : 'Sign In'}
            >
              <Settings size={20} className="text-slate-600 dark:text-slate-400" />
            </button>
          )}
        </div>
      </header>

      {showSettings && <SettingsView onClose={() => setShowSettings(false)} />}
    </>
  );
};
