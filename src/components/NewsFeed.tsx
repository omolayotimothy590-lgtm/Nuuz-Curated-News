import { useMemo, useEffect, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { ArticleCard } from './ArticleCard';
import { GoogleAdCard } from './GoogleAdCard';
import { TrendingCategories } from './TrendingCategories';
import { LocalSetup } from './LocalSetup';
import { Toast } from './Toast';
import { personalizeArticles } from '../lib/personalization';
import { Newspaper, MapPin, Bookmark, Loader, Settings } from 'lucide-react';
import { shouldShowAds } from '../lib/adUtils';
import { imagePreloader } from '../lib/imagePreloader';
import { getAdSlot, shouldPlaceAd } from '../lib/adConfig';

export const NewsFeed = () => {
  const { articles, currentCategory, userLocation, selectedTopic, savedArticles, userPreferences, setShowAuthModal, isLoadingArticles, isRefreshing, setCurrentCategory, handleLocationSet } = useApp();
  const { user } = useAuth();
  const [showPremiumToast, setShowPremiumToast] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(10);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const filteredArticles = useMemo(() => {
    let filtered = articles.filter(article => {
      let categoryMatch = true;
      if (currentCategory === 'discover') categoryMatch = true;
      else if (currentCategory === 'local') categoryMatch = true;
      else if (currentCategory === 'saved') categoryMatch = savedArticles.has(article.id);

      const topicMatch = selectedTopic === 'all' || article.category === selectedTopic;

      return categoryMatch && topicMatch;
    });

    if (currentCategory === 'discover') {
      filtered = personalizeArticles(filtered, userPreferences);
    }

    return filtered;
  }, [articles, currentCategory, selectedTopic, savedArticles, userPreferences]);

  const displayedArticles = useMemo(() => {
    return filteredArticles.slice(0, displayLimit);
  }, [filteredArticles, displayLimit]);

  const feedWithAds = useMemo(() => {
    if (!shouldShowAds(user) || displayedArticles.length === 0) {
      return displayedArticles.map(article => ({ type: 'article' as const, content: article }));
    }

    const result: Array<{ type: 'article' | 'google-ad'; content: any }> = [];
    let googleAdIndex = 0;

    displayedArticles.forEach((article, index) => {
      result.push({ type: 'article', content: article });

      if (shouldPlaceAd(index, 'feed')) {
        const adSlot = getAdSlot('feed', googleAdIndex);
        result.push({
          type: 'google-ad',
          content: { slot: adSlot, position: googleAdIndex, viewType: 'feed' }
        });
        googleAdIndex++;
      }
    });

    return result;
  }, [displayedArticles, user]);

  useEffect(() => {
    setDisplayLimit(10);
  }, [currentCategory, selectedTopic]);

  useEffect(() => {
    if (displayedArticles.length > 0) {
      imagePreloader.preloadArticleImages(displayedArticles.slice(0, 5));
    }
  }, [displayedArticles]);

  useEffect(() => {
    const handleScroll = () => {
      if (isLoadingMore || displayLimit >= filteredArticles.length) return;

      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const clientHeight = window.innerHeight;

      if (scrollHeight - scrollTop - clientHeight < 800) {
        setIsLoadingMore(true);
        setTimeout(() => {
          setDisplayLimit(prev => Math.min(prev + 5, filteredArticles.length));
          setIsLoadingMore(false);
        }, 300);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoadingMore, displayLimit, filteredArticles.length]);

  useEffect(() => {
    const justActivated = localStorage.getItem('subscription_just_activated');
    if (justActivated === 'true' && user?.isPremium) {
      setShowPremiumToast(true);
      localStorage.removeItem('subscription_just_activated');
    }
  }, [user]);

  if (currentCategory === 'local' && !userLocation) {
    return <LocalSetup onLocationSet={handleLocationSet} />;
  }

  const handleSettingsClick = () => {
    setCurrentCategory('discover');
    setTimeout(() => {
      const settingsBtn = document.querySelector('[data-settings-btn]') as HTMLButtonElement;
      settingsBtn?.click();
    }, 100);
  };

  return (
    <>
      {currentCategory === 'local' && userLocation && (
        <div className="sticky top-14 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Local News</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                📍 {userLocation}
              </p>
            </div>
            <button
              onClick={handleSettingsClick}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
            >
              <Settings size={20} className="text-slate-600 dark:text-slate-400" />
            </button>
          </div>
        </div>
      )}
      {currentCategory !== 'local' && <TrendingCategories />}
      {isLoadingArticles ? (
        <div className="flex flex-col items-center justify-center px-6 py-16 min-h-[calc(100vh-14rem)]">
          <Loader className="text-blue-600 animate-spin mb-4" size={48} strokeWidth={2} />
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-2">Loading articles...</p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mb-4">
            Fetched {articles.length} articles so far
          </p>
          {articles.length > 0 && (
            <button
              onClick={() => {
                console.log('🔧 Manual override: Forcing loading to false');
                window.location.reload();
              }}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition active:scale-95"
            >
              Show Articles Now ({articles.length})
            </button>
          )}
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-16 min-h-[calc(100vh-14rem)]">
          <div className="inline-block p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
            {currentCategory === 'saved' ? (
              <Bookmark className="text-slate-400" size={48} />
            ) : currentCategory === 'local' ? (
              <MapPin className="text-slate-400" size={48} />
            ) : (
              <Newspaper className="text-slate-400" size={48} />
            )}
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2 text-center">
            {currentCategory === 'saved'
              ? 'No saved articles'
              : currentCategory === 'local'
              ? 'No local news available'
              : 'No articles found'}
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6 text-center text-sm leading-relaxed">
            {currentCategory === 'saved'
              ? 'Save articles by tapping the bookmark button to read them later'
              : currentCategory === 'local'
              ? userLocation
                ? 'Loading local news for your area. This may take a moment...'
                : 'Set your location to get personalized local news'
              : 'Check back later for more news'}
          </p>
          {!user && currentCategory === 'local' && (
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold active:bg-blue-700 transition active:scale-95"
            >
              Sign In to Continue
            </button>
          )}
        </div>
      ) : (
        <>
          {isRefreshing && (
            <div className="sticky top-14 z-20 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-4 py-2">
              <div className="flex items-center justify-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                <Loader className="animate-spin" size={16} />
                <span>Refreshing articles...</span>
              </div>
            </div>
          )}
          <div className="pb-20">
            {feedWithAds.map((item, index) => {
              if (item.type === 'article') {
                return <ArticleCard key={`article-${item.content.id}`} article={item.content} />;
              } else {
                return (
                  <GoogleAdCard
                    key={`google-ad-${index}`}
                    adSlot={item.content.slot}
                    viewType={item.content.viewType}
                    position={item.content.position}
                  />
                );
              }
            })}
            {isLoadingMore && (
              <div className="flex items-center justify-center py-8">
                <Loader className="text-blue-600 animate-spin" size={24} />
              </div>
            )}
          </div>
        </>
      )}
      {showPremiumToast && (
        <Toast
          message="Premium activated! You're now enjoying an ad-free experience."
          type="success"
          onClose={() => setShowPremiumToast(false)}
        />
      )}
    </>
  );
};
