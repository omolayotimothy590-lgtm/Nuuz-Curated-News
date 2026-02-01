import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { Compass, MapPin, Search, Bookmark } from 'lucide-react';
import { CategoryType } from '../types';

export const BottomNav = () => {
  const { user } = useAuth();
  const { currentCategory, setCurrentCategory, setShowAuthModal } = useApp();

  const handleCategoryChange = (category: CategoryType) => {
    if (!user && (category === 'saved' || category === 'local')) {
      setShowAuthModal(true);
      return;
    }
    setCurrentCategory(category);
  };

  const navItems = [
    { id: 'discover' as CategoryType, label: 'Discover', icon: Compass },
    { id: 'local' as CategoryType, label: 'Local', icon: MapPin },
    { id: 'search' as CategoryType, label: 'Search', icon: Search },
    { id: 'saved' as CategoryType, label: 'Saved', icon: Bookmark },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 z-40 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentCategory === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleCategoryChange(item.id)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition ${
                isActive ? 'text-nuuz-yellow' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
