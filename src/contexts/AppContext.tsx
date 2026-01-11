import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Article, CategoryType, TopicCategory, UserPreferences } from '../types';
import { newsApi, Article as BackendArticle } from '../lib/newsApi';
import { useAuth } from './AuthContext';
import { loadLocationFromStorage, saveLocationToStorage, LocationData } from '../lib/zipCodeUtils';
import { supabase, supabaseEnabled } from '../lib/supabase';
import { getCachedArticles, setCachedArticles, clearOldCache, isCacheStale, clearCategoryCache } from '../lib/articleCache';

interface AppContextType {
  currentCategory: CategoryType;
  setCurrentCategory: (category: CategoryType) => void;
  selectedTopic: TopicCategory;
  setSelectedTopic: (topic: TopicCategory) => void;
  articles: Article[];
  isLoadingArticles: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  hasMoreArticles: boolean;
  loadMoreArticles: () => Promise<void>;
  favorites: Set<string>;
  toggleFavorite: (articleId: string) => void;
  likedArticles: Set<string>;
  dislikedArticles: Set<string>;
  savedArticles: Set<string>;
  toggleLike: (articleId: string, article: Article) => void;
  toggleDislike: (articleId: string, article: Article) => void;
  toggleSave: (articleId: string, article: Article) => void;
  followedSources: Set<string>;
  toggleFollowSource: (sourceId: string) => void;
  selectedArticle: Article | null;
  setSelectedArticle: (article: Article | null) => void;
  showAIChat: boolean;
  setShowAIChat: (show: boolean) => void;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  showPremiumModal: boolean;
  setShowPremiumModal: (show: boolean) => void;
  userLocation: string;
  setUserLocation: (location: string) => void;
  userZipCode: string;
  handleLocationSet: (location: LocationData) => Promise<void>;
  userPreferences: UserPreferences;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchHistory: string[];
  addSearchHistory: (query: string) => void;
  supabase: typeof supabase;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

const loadFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToLocalStorage = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors
  }
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [currentCategory, setCurrentCategory] = useState<CategoryType>('discover');
  const [selectedTopic, setSelectedTopic] = useState<TopicCategory>('all');
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreArticles, setHasMoreArticles] = useState(true);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(new Set(loadFromLocalStorage<string[]>('favorites', [])));
  const [likedArticles, setLikedArticles] = useState<Set<string>>(new Set(loadFromLocalStorage<string[]>('likedArticles', [])));
  const [dislikedArticles, setDislikedArticles] = useState<Set<string>>(new Set(loadFromLocalStorage<string[]>('dislikedArticles', [])));
  const [savedArticles, setSavedArticles] = useState<Set<string>>(new Set(loadFromLocalStorage<string[]>('savedArticles', [])));
  const [followedSources, setFollowedSources] = useState<Set<string>>(new Set());
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [userZipCode, setUserZipCode] = useState('');
  const [userLocation, setUserLocation] = useState('');
  const [userPreferences, setUserPreferences] = useState<UserPreferences>(loadFromLocalStorage('userPreferences', {
    likedCategories: {},
    dislikedCategories: {},
    likedSources: {},
    dislikedSources: {},
    engagementHistory: []
  }));
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>(loadFromLocalStorage<string[]>('searchHistory', []));
  const [articleCache] = useState<Map<string, Article[]>>(new Map());

  useEffect(() => {
    const savedLocation = loadLocationFromStorage();
    if (savedLocation) {
      setUserZipCode(savedLocation.zipCode);
      setUserLocation(`${savedLocation.city}, ${savedLocation.stateCode}`);
    }

    clearOldCache();
    checkAndAutoScrape();
  }, []);

  const checkAndAutoScrape = async () => {
    try {
      const lastScrapeTime = localStorage.getItem('lastScrapeTime');
      const now = Date.now();
      const sixHours = 6 * 60 * 60 * 1000;

      if (!lastScrapeTime || now - parseInt(lastScrapeTime) > sixHours) {
        console.log('🤖 Auto-scraping: Articles are stale, fetching fresh content...');
        const result = await newsApi.scrapeNews();

        if (result.success) {
          console.log(`✅ Auto-scrape complete: ${result.inserted} new articles added`);
          localStorage.setItem('lastScrapeTime', now.toString());
          clearCategoryCache('discover');
          articleCache.clear();
        }
      } else {
        const timeSinceLastScrape = Math.floor((now - parseInt(lastScrapeTime)) / (60 * 1000));
        console.log(`✅ Articles are fresh (scraped ${timeSinceLastScrape} minutes ago)`);
      }
    } catch (error) {
      console.error('❌ Auto-scrape failed:', error);
    }
  };

  useEffect(() => {
    saveToLocalStorage('favorites', Array.from(favorites));
  }, [favorites]);

  useEffect(() => {
    saveToLocalStorage('likedArticles', Array.from(likedArticles));
  }, [likedArticles]);

  useEffect(() => {
    saveToLocalStorage('dislikedArticles', Array.from(dislikedArticles));
  }, [dislikedArticles]);

  useEffect(() => {
    saveToLocalStorage('savedArticles', Array.from(savedArticles));
  }, [savedArticles]);

  useEffect(() => {
    saveToLocalStorage('userPreferences', userPreferences);
  }, [userPreferences]);

  useEffect(() => {
    saveToLocalStorage('searchHistory', searchHistory);
  }, [searchHistory]);

  const getUserId = () => user?.id || `device-${localStorage.getItem('deviceId') || Math.random().toString(36).substring(7)}`;

  useEffect(() => {
    if (!localStorage.getItem('deviceId')) {
      localStorage.setItem('deviceId', Math.random().toString(36).substring(7));
    }
  }, []);

  const convertBackendArticle = (article: BackendArticle): Article => {
    const converted = {
      id: article.id,
      title: article.title,
      summary: article.summary,
      content: article.full_content,
      source: article.source,
      sourceId: article.source.toLowerCase().replace(/\s+/g, '-'),
      sourceName: article.source,
      sourceLogo: article.source_logo || '',
      author: 'Staff Writer',
      category: article.category as TopicCategory,
      imageUrl: article.image_url || '',
      url: article.article_url,
      publishedAt: new Date(article.published_at),
      readTime: article.read_time,
      isTrending: article.is_trending,
      location: 'General'
    };

    if (!converted.imageUrl && converted.url && supabaseEnabled) {
      setTimeout(() => {
        scrapeImageForArticle(converted.id, converted.url);
      }, 100);
    }

    return converted;
  };

  const scrapeImageForArticle = async (articleId: string, articleUrl: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrape-article-image?url=${encodeURIComponent(articleUrl)}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.image) {
          await supabase
            .from('articles')
            .update({ image_url: data.image })
            .eq('id', articleId);

          setArticles(prevArticles =>
            prevArticles.map(a =>
              a.id === articleId ? { ...a, imageUrl: data.image } : a
            )
          );
        }
      }
    } catch (error) {
      console.error('Failed to scrape image:', error);
    }
  };

  useEffect(() => {
    setCurrentOffset(0);
    setHasMoreArticles(true);
  }, [currentCategory, selectedTopic]);

  const loadMoreArticles = async () => {
    if (isLoadingMore || !hasMoreArticles) return;

    setIsLoadingMore(true);
    try {
      const userId = getUserId();
      const nextOffset = articles.length;
      let newArticles: Article[] = [];

      if (currentCategory === 'discover' || currentCategory === 'saved') {
        const backendArticles = await newsApi.getDiscoverFeed(
          userId,
          selectedTopic === 'all' ? undefined : selectedTopic,
          20,
          nextOffset
        );
        newArticles = backendArticles.map(convertBackendArticle);
      } else if (currentCategory === 'local') {
        const savedLocation = loadLocationFromStorage();
        if (savedLocation) {
          const localArticles = await newsApi.getLocalFeed(
            savedLocation.zipCode,
            savedLocation.city,
            savedLocation.state,
            20,
            nextOffset
          );
          newArticles = localArticles.map(convertBackendArticle);
        }
      } else {
        const backendArticles = await newsApi.getArticlesByCategory(currentCategory, 20, nextOffset);
        newArticles = backendArticles.map(convertBackendArticle);
      }

      if (newArticles.length < 20) {
        setHasMoreArticles(false);
      }

      if (newArticles.length > 0) {
        setArticles(prev => [...prev, ...newArticles]);
        setCurrentOffset(nextOffset + newArticles.length);
        console.log(`✅ Loaded ${newArticles.length} more articles (total: ${articles.length + newArticles.length})`);
      } else {
        setHasMoreArticles(false);
        console.log('📭 No more articles to load');
      }
    } catch (error) {
      console.error('❌ Error loading more articles:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    const fetchArticles = async () => {
      const cachedArticles = getCachedArticles(currentCategory, selectedTopic);

      if (cachedArticles && cachedArticles.length > 0) {
        console.log('⚡ INSTANT LOAD: Showing cached articles immediately');
        setArticles(cachedArticles);
        setIsLoadingArticles(false);
        setHasMoreArticles(true);

        // Check if cache is stale and refresh in background
        if (isCacheStale(currentCategory, selectedTopic)) {
          console.log('🔄 Cache is stale, refreshing in background...');
          setIsRefreshing(true);
          fetchFreshArticles(true).finally(() => setIsRefreshing(false));
        } else {
          console.log('✅ Cache is fresh, no refresh needed');
        }
      } else {
        console.log('📡 No cache found, fetching articles...');
        setIsLoadingArticles(true);
        await fetchFreshArticles(false);
      }
    };

    const fetchFreshArticles = async (isBackground: boolean) => {
      const timeoutId = setTimeout(() => {
        if (!isBackground) {
          console.warn('⚠️ Loading timeout reached (15s), forcing stop');
          setIsLoadingArticles(false);
        }
      }, 15000);

      try {
        if (!isBackground) {
          console.log(`📰 Fetching articles for category: ${currentCategory}, topic: ${selectedTopic}`);
        }

        const userId = getUserId();
        let fetchedArticles: Article[] = [];

        if (currentCategory === 'discover' || currentCategory === 'saved') {
          const backendArticles = await newsApi.getDiscoverFeed(
            userId,
            selectedTopic === 'all' ? undefined : selectedTopic,
            20
          );

          fetchedArticles = backendArticles.map(convertBackendArticle);

          fetchedArticles.sort((a, b) =>
            b.publishedAt.getTime() - a.publishedAt.getTime()
          );

          if (isBackground) {
            console.log(`🔄 Background refresh: ${fetchedArticles.length} articles from backend`);
          } else {
            console.log(`✅ Total articles loaded: ${fetchedArticles.length} from backend`);
          }
        } else if (currentCategory === 'local') {
          const savedLocation = loadLocationFromStorage();
          if (savedLocation) {
            const localArticles = await newsApi.getLocalFeed(savedLocation.zipCode, savedLocation.city, savedLocation.state);
            fetchedArticles = localArticles.map(convertBackendArticle);
            console.log(`✅ Loaded ${fetchedArticles.length} local articles`);
          }
        } else {
          const backendArticles = await newsApi.getArticlesByCategory(currentCategory, 20);
          fetchedArticles = backendArticles.map(convertBackendArticle);

          fetchedArticles.sort((a, b) =>
            b.publishedAt.getTime() - a.publishedAt.getTime()
          );

          if (isBackground) {
            console.log(`🔄 Background refresh: ${fetchedArticles.length} articles`);
          } else {
            console.log(`✅ Total articles loaded: ${fetchedArticles.length} from backend`);
          }
        }

        setCachedArticles(currentCategory, fetchedArticles, selectedTopic);
        setArticles(fetchedArticles);
      } catch (error) {
        console.error('❌ Error fetching articles:', error);
        if (!isBackground) {
          setArticles([]);
        }
      } finally {
        clearTimeout(timeoutId);
        if (!isBackground) {
          console.log('🏁 [FETCH END] Setting loading to false');
          setIsLoadingArticles(false);
        }
      }
    };

    fetchArticles();
  }, [currentCategory, selectedTopic, user]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 App became visible, checking for updates...');
        checkAndAutoScrape();

        const userId = getUserId();
        const fetchFreshArticles = async () => {
          try {
            let fetchedArticles: Article[] = [];

            if (currentCategory === 'discover' || currentCategory === 'saved') {
              const backendArticles = await newsApi.getDiscoverFeed(userId, selectedTopic === 'all' ? undefined : selectedTopic, 20);
              fetchedArticles = backendArticles.map(convertBackendArticle);
              fetchedArticles.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
            } else if (currentCategory === 'local') {
              const savedLocation = loadLocationFromStorage();
              if (savedLocation) {
                const localArticles = await newsApi.getLocalFeed(savedLocation.zipCode, savedLocation.city, savedLocation.state);
                fetchedArticles = localArticles.map(convertBackendArticle);
              }
            } else {
              const backendArticles = await newsApi.getArticlesByCategory(currentCategory, 20);
              fetchedArticles = backendArticles.map(convertBackendArticle);
              fetchedArticles.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
            }

            setArticles(fetchedArticles);
            console.log('✅ Articles refreshed');
          } catch (error) {
            console.error('❌ Error refreshing articles on visibility:', error);
          }
        };

        fetchFreshArticles();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [currentCategory, selectedTopic, user]);

  useEffect(() => {
    const interval = setInterval(() => {
      console.log('⏰ Periodic check: Looking for new articles...');
      checkAndAutoScrape();
    }, 2 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const addSearchHistory = (query: string) => {
    if (!query.trim()) return;
    setSearchHistory(prev => {
      const filtered = prev.filter(q => q !== query);
      return [query, ...filtered].slice(0, 10);
    });
  };

  const toggleFavorite = (articleId: string) => {
    setFavorites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(articleId)) {
        newSet.delete(articleId);
      } else {
        newSet.add(articleId);
      }
      return newSet;
    });
  };

  const toggleFollowSource = (sourceId: string) => {
    setFollowedSources(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sourceId)) {
        newSet.delete(sourceId);
      } else {
        newSet.add(sourceId);
      }
      return newSet;
    });
  };

  const toggleLike = (articleId: string, article: Article) => {
    setLikedArticles(prev => {
      const newSet = new Set(prev);
      const isLiking = !newSet.has(articleId);

      if (isLiking) {
        newSet.add(articleId);
        setDislikedArticles(prevDisliked => {
          const newDisliked = new Set(prevDisliked);
          newDisliked.delete(articleId);
          return newDisliked;
        });

        newsApi.recordInteraction(getUserId(), articleId, 'thumbs_up').catch(console.error);

        setUserPreferences(prev => ({
          ...prev,
          likedCategories: {
            ...prev.likedCategories,
            [article.category]: (prev.likedCategories[article.category] || 0) + 1
          },
          likedSources: {
            ...prev.likedSources,
            [article.sourceId]: (prev.likedSources[article.sourceId] || 0) + 1
          },
          engagementHistory: [
            ...prev.engagementHistory,
            { articleId, type: 'like', timestamp: new Date() }
          ]
        }));
      } else {
        newSet.delete(articleId);
      }
      return newSet;
    });
  };

  const toggleDislike = (articleId: string, article: Article) => {
    setDislikedArticles(prev => {
      const newSet = new Set(prev);
      const isDisliking = !newSet.has(articleId);

      if (isDisliking) {
        newSet.add(articleId);
        setLikedArticles(prevLiked => {
          const newLiked = new Set(prevLiked);
          newLiked.delete(articleId);
          return newLiked;
        });

        newsApi.recordInteraction(getUserId(), articleId, 'thumbs_down').catch(console.error);

        setUserPreferences(prev => ({
          ...prev,
          dislikedCategories: {
            ...prev.dislikedCategories,
            [article.category]: (prev.dislikedCategories[article.category] || 0) + 1
          },
          dislikedSources: {
            ...prev.dislikedSources,
            [article.sourceId]: (prev.dislikedSources[article.sourceId] || 0) + 1
          },
          engagementHistory: [
            ...prev.engagementHistory,
            { articleId, type: 'dislike', timestamp: new Date() }
          ]
        }));
      } else {
        newSet.delete(articleId);
      }
      return newSet;
    });
  };

  const toggleSave = (articleId: string, _article: Article) => {
    setSavedArticles(prev => {
      const newSet = new Set(prev);
      const isSaving = !newSet.has(articleId);

      if (isSaving) {
        newSet.add(articleId);
        newsApi.recordInteraction(getUserId(), articleId, 'save').catch(console.error);

        setUserPreferences(prev => ({
          ...prev,
          engagementHistory: [
            ...prev.engagementHistory,
            { articleId, type: 'save', timestamp: new Date() }
          ]
        }));
      } else {
        newSet.delete(articleId);
      }
      return newSet;
    });
  };

  const handleLocationSet = async (location: LocationData) => {
    saveLocationToStorage(location);
    setUserZipCode(location.zipCode);
    setUserLocation(`${location.city}, ${location.stateCode}`);

    if (user) {
      try {
        await newsApi.updateUserLocation(user.id, location);
      } catch (error) {
        console.error('Failed to update user location in database:', error);
      }
    }

    clearCategoryCache('local');
    articleCache.clear();

    if (currentCategory === 'local') {
      setIsLoadingArticles(true);
      try {
        const fetchedArticles = await newsApi.getLocalFeed(location.zipCode, location.city, location.state);
        const converted = fetchedArticles.map(convertBackendArticle);
        setArticles(converted);
        setCachedArticles('local', converted, selectedTopic);
      } catch (error) {
        console.error('Error fetching local articles:', error);
      } finally {
        setIsLoadingArticles(false);
      }
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentCategory,
        setCurrentCategory,
        selectedTopic,
        setSelectedTopic,
        articles,
        isLoadingArticles,
        isRefreshing,
        isLoadingMore,
        hasMoreArticles,
        loadMoreArticles,
        favorites,
        toggleFavorite,
        likedArticles,
        dislikedArticles,
        savedArticles,
        toggleLike,
        toggleDislike,
        toggleSave,
        followedSources,
        toggleFollowSource,
        selectedArticle,
        setSelectedArticle,
        showAIChat,
        setShowAIChat,
        showAuthModal,
        setShowAuthModal,
        showPremiumModal,
        setShowPremiumModal,
        userLocation,
        setUserLocation,
        userZipCode,
        handleLocationSet,
        userPreferences,
        searchQuery,
        setSearchQuery,
        searchHistory,
        addSearchHistory,
        supabase
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
