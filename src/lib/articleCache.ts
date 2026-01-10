import { Article, CategoryType, TopicCategory } from '../types';

const CACHE_KEY = 'nuunz_articles_cache';
const CACHE_DURATION = 30 * 60 * 1000;
const PRELOAD_KEY = 'nuuz_last_preload';
const PRELOAD_INTERVAL = 60 * 60 * 1000;

interface CachedData {
  articles: Article[];
  timestamp: number;
}

interface ArticleCache {
  [key: string]: CachedData;
}

function getCacheKey(category: CategoryType, topic?: TopicCategory): string {
  return topic && topic !== 'all' ? `${category}_${topic}` : category;
}

export function getCachedArticles(category: CategoryType, topic?: TopicCategory): Article[] | null {
  try {
    const cacheStr = localStorage.getItem(CACHE_KEY);
    if (!cacheStr) return null;

    const cache: ArticleCache = JSON.parse(cacheStr);
    const key = getCacheKey(category, topic);
    const categoryCache = cache[key];

    if (categoryCache && categoryCache.articles && categoryCache.articles.length > 0) {
      const age = Date.now() - categoryCache.timestamp;
      const ageMinutes = Math.round(age / 60000);

      if (age < CACHE_DURATION) {
        console.log(`⚡ INSTANT: Fresh cache for ${key} (${ageMinutes}min old, ${categoryCache.articles.length} articles)`);
      } else {
        console.log(`⚡ INSTANT: Stale cache for ${key} (${ageMinutes}min old, ${categoryCache.articles.length} articles) - will refresh in background`);
      }

      const articlesWithDates = categoryCache.articles.map(article => ({
        ...article,
        publishedAt: new Date(article.publishedAt)
      }));

      return articlesWithDates;
    }
  } catch (error) {
    console.error('❌ Cache read error:', error);
  }
  return null;
}

export function isCacheStale(category: CategoryType, topic?: TopicCategory): boolean {
  try {
    const cacheStr = localStorage.getItem(CACHE_KEY);
    if (!cacheStr) return true;

    const cache: ArticleCache = JSON.parse(cacheStr);
    const key = getCacheKey(category, topic);
    const categoryCache = cache[key];

    if (categoryCache) {
      return Date.now() - categoryCache.timestamp >= CACHE_DURATION;
    }
  } catch (error) {
    console.error('❌ Cache stale check error:', error);
  }
  return true;
}

export function setCachedArticles(
  category: CategoryType,
  articles: Article[],
  topic?: TopicCategory
): void {
  try {
    const cacheStr = localStorage.getItem(CACHE_KEY);
    const cache: ArticleCache = cacheStr ? JSON.parse(cacheStr) : {};

    const key = getCacheKey(category, topic);
    cache[key] = {
      articles,
      timestamp: Date.now()
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    console.log(`💾 Cached ${articles.length} articles for ${key}`);
  } catch (error) {
    console.error('❌ Cache write error:', error);

    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.warn('⚠️ Storage quota exceeded, clearing old cache');
      clearOldCache();

      try {
        const cache: ArticleCache = {};
        const key = getCacheKey(category, topic);
        cache[key] = {
          articles,
          timestamp: Date.now()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      } catch (retryError) {
        console.error('❌ Cache write failed after cleanup:', retryError);
      }
    }
  }
}

export function clearOldCache(): void {
  try {
    const cacheStr = localStorage.getItem(CACHE_KEY);
    if (!cacheStr) return;

    const cache: ArticleCache = JSON.parse(cacheStr);
    let cleaned = false;
    const maxAge = 2 * 60 * 60 * 1000;

    Object.keys(cache).forEach(key => {
      if (Date.now() - cache[key].timestamp > maxAge) {
        delete cache[key];
        cleaned = true;
        console.log(`🗑️ Removed expired cache for ${key}`);
      }
    });

    if (cleaned) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      console.log('✅ Cache cleanup complete');
    }
  } catch (error) {
    console.error('❌ Cache cleanup error:', error);
  }
}

export function clearAllCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
    console.log('🗑️ Cleared all article cache');
  } catch (error) {
    console.error('❌ Failed to clear cache:', error);
  }
}

export function clearCategoryCache(category: CategoryType): void {
  try {
    const cacheStr = localStorage.getItem(CACHE_KEY);
    if (!cacheStr) return;

    const cache: ArticleCache = JSON.parse(cacheStr);

    Object.keys(cache).forEach(key => {
      if (key.startsWith(category)) {
        delete cache[key];
        console.log(`🗑️ Cleared cache for ${key}`);
      }
    });

    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('❌ Failed to clear category cache:', error);
  }
}

export function getCacheStats(): {
  totalCategories: number;
  totalArticles: number;
  cacheSize: number;
} {
  try {
    const cacheStr = localStorage.getItem(CACHE_KEY);
    if (!cacheStr) return { totalCategories: 0, totalArticles: 0, cacheSize: 0 };

    const cache: ArticleCache = JSON.parse(cacheStr);
    const totalCategories = Object.keys(cache).length;
    const totalArticles = Object.values(cache).reduce(
      (sum, data) => sum + data.articles.length,
      0
    );
    const cacheSize = new Blob([cacheStr]).size;

    return { totalCategories, totalArticles, cacheSize };
  } catch (error) {
    console.error('❌ Failed to get cache stats:', error);
    return { totalCategories: 0, totalArticles: 0, cacheSize: 0 };
  }
}

export function shouldPreload(): boolean {
  try {
    const lastPreload = localStorage.getItem(PRELOAD_KEY);
    if (!lastPreload) return true;

    const elapsed = Date.now() - parseInt(lastPreload, 10);
    return elapsed >= PRELOAD_INTERVAL;
  } catch (error) {
    return true;
  }
}

export function markPreloadComplete(): void {
  try {
    localStorage.setItem(PRELOAD_KEY, Date.now().toString());
  } catch (error) {
    console.error('❌ Failed to mark preload complete:', error);
  }
}

export function getAllCachedCategories(): string[] {
  try {
    const cacheStr = localStorage.getItem(CACHE_KEY);
    if (!cacheStr) return [];

    const cache: ArticleCache = JSON.parse(cacheStr);
    return Object.keys(cache);
  } catch (error) {
    console.error('❌ Failed to get cached categories:', error);
    return [];
  }
}
