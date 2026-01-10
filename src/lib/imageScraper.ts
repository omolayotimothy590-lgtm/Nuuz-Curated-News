import { supabase } from './supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface ImageCache {
  [articleUrl: string]: string | null;
}

class ImageScraper {
  private memoryCache: ImageCache = {};
  private scrapeQueue: Array<{ articleUrl: string; callback: (image: string | null) => void }> = [];
  private isScraping = false;
  private readonly LOCAL_CACHE_KEY = 'nuunz_image_cache';
  private readonly MAX_CACHE_SIZE = 100;

  constructor() {
    this.loadLocalCache();
  }

  private loadLocalCache() {
    try {
      const cached = localStorage.getItem(this.LOCAL_CACHE_KEY);
      if (cached) {
        this.memoryCache = JSON.parse(cached);
      }
    } catch (error) {
      console.error('Failed to load image cache:', error);
      this.memoryCache = {};
    }
  }

  private saveLocalCache() {
    try {
      const cacheEntries = Object.entries(this.memoryCache);
      if (cacheEntries.length > this.MAX_CACHE_SIZE) {
        const trimmedCache = Object.fromEntries(
          cacheEntries.slice(-this.MAX_CACHE_SIZE)
        );
        this.memoryCache = trimmedCache;
      }
      localStorage.setItem(this.LOCAL_CACHE_KEY, JSON.stringify(this.memoryCache));
    } catch (error) {
      console.error('Failed to save image cache:', error);
    }
  }

  async scrapeImage(articleUrl: string): Promise<string | null> {
    if (this.memoryCache[articleUrl] !== undefined) {
      return this.memoryCache[articleUrl];
    }

    const dbCached = await this.checkDatabaseCache(articleUrl);
    if (dbCached !== undefined) {
      this.memoryCache[articleUrl] = dbCached;
      this.saveLocalCache();
      return dbCached;
    }

    return new Promise((resolve) => {
      this.scrapeQueue.push({
        articleUrl,
        callback: (image) => {
          this.memoryCache[articleUrl] = image;
          this.saveLocalCache();
          resolve(image);
        }
      });

      this.processScrapeQueue();
    });
  }

  scrapeImageAsync(articleUrl: string, onComplete: (image: string | null) => void) {
    if (this.memoryCache[articleUrl] !== undefined) {
      onComplete(this.memoryCache[articleUrl]);
      return;
    }

    this.checkDatabaseCache(articleUrl).then((dbCached) => {
      if (dbCached !== undefined) {
        this.memoryCache[articleUrl] = dbCached;
        this.saveLocalCache();
        onComplete(dbCached);
        return;
      }

      this.scrapeQueue.push({
        articleUrl,
        callback: (image) => {
          this.memoryCache[articleUrl] = image;
          this.saveLocalCache();
          onComplete(image);
        }
      });

      this.processScrapeQueue();
    });
  }

  private async checkDatabaseCache(articleUrl: string): Promise<string | null | undefined> {
    try {
      const { data, error } = await supabase
        .from('scraped_images')
        .select('image_url')
        .eq('article_url', articleUrl)
        .maybeSingle();

      if (error) {
        console.error('Database cache check failed:', error);
        return undefined;
      }

      return data ? data.image_url : undefined;
    } catch (error) {
      console.error('Database cache check failed:', error);
      return undefined;
    }
  }

  private async processScrapeQueue() {
    if (this.isScraping || this.scrapeQueue.length === 0) return;

    this.isScraping = true;

    while (this.scrapeQueue.length > 0) {
      const { articleUrl, callback } = this.scrapeQueue.shift()!;

      try {
        const image = await this.fetchArticleImage(articleUrl);
        callback(image);
      } catch (error) {
        callback(null);
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.isScraping = false;
  }

  private async fetchArticleImage(articleUrl: string): Promise<string | null> {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/scrape-article-image?url=${encodeURIComponent(articleUrl)}`,
        {
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.image || null;
    } catch (error) {
      return null;
    }
  }

  clearCache() {
    this.memoryCache = {};
    localStorage.removeItem(this.LOCAL_CACHE_KEY);
  }
}

export const imageScraper = new ImageScraper();
