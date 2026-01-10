import { supabase } from './supabase';

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || 'https://itnxliunzuzlvtaswesi.supabase.co'}/functions/v1`;

interface Article {
  id: string;
  title: string;
  summary: string;
  full_content: string;
  source: string;
  source_logo: string | null;
  category: string;
  image_url: string | null;
  article_url: string;
  published_at: string;
  read_time: number;
  is_trending: boolean;
  engagement_score: number;
  created_at: string;
}

interface DiscoverFeedResponse {
  success: boolean;
  articles: Article[];
  total: number;
  personalized: boolean;
}

interface InteractionResponse {
  success: boolean;
  message?: string;
  error?: string;
}

interface AskAIResponse {
  success: boolean;
  answer?: string;
  article_title?: string;
  error?: string;
}

interface SearchResponse {
  success: boolean;
  articles: Article[];
  total: number;
  query: string;
}

interface ScrapeResponse {
  success: boolean;
  message?: string;
  inserted?: number;
  skipped?: number;
  error?: string;
}

const getHeaders = () => ({
  'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0bnhsaXVuenV6bHZ0YXN3ZXNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NDgxNzUsImV4cCI6MjA3ODEyNDE3NX0.q3sP2NKUT3_2GX8Fjq3PkWsUfPHyfHM5ut9SitE0bE0'}`,
  'Content-Type': 'application/json',
});

export const newsApi = {
  async getDiscoverFeed(userId?: string, category?: string, limit = 20): Promise<Article[]> {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('user_id', userId);
      if (category) params.append('category', category);
      params.append('limit', limit.toString());

      const response = await fetch(
        `${FUNCTIONS_URL}/discover-feed?${params}`,
        { headers: getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch discover feed: ${response.status}`);
      }

      const data: DiscoverFeedResponse = await response.json();
      return data.articles || [];
    } catch (error) {
      console.error('Error fetching discover feed:', error);
      return [];
    }
  },

  async getArticlesByCategory(category: string, limit = 20): Promise<Article[]> {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('category', category)
        .order('published_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching articles by category:', error);
      return [];
    }
  },

  async getSavedArticles(userId: string): Promise<Article[]> {
    try {
      const { data, error } = await supabase
        .from('user_interactions')
        .select('articles(*)')
        .eq('user_id', userId)
        .eq('action', 'save')
        .order('timestamp', { ascending: false });

      if (error) throw error;
      return (data || []).map((item: any) => item.articles).filter(Boolean);
    } catch (error) {
      console.error('Error fetching saved articles:', error);
      return [];
    }
  },

  async recordInteraction(
    userId: string,
    articleId: string,
    action: 'thumbs_up' | 'thumbs_down' | 'save' | 'read' | 'share'
  ): Promise<boolean> {
    try {
      const response = await fetch(`${FUNCTIONS_URL}/article-interactions`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ user_id: userId, article_id: articleId, action }),
      });

      if (!response.ok) {
        throw new Error(`Failed to record interaction: ${response.status}`);
      }

      const data: InteractionResponse = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error recording interaction:', error);
      return false;
    }
  },

  async getUserInteractions(userId: string, action?: string) {
    try {
      const params = new URLSearchParams({ user_id: userId });
      if (action) params.append('action', action);

      const response = await fetch(
        `${FUNCTIONS_URL}/article-interactions?${params}`,
        { headers: getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch interactions: ${response.status}`);
      }

      const data = await response.json();
      return data.interactions || [];
    } catch (error) {
      console.error('Error fetching user interactions:', error);
      return [];
    }
  },

  async askAI(articleId: string, question: string, userId?: string): Promise<string | null> {
    try {
      const response = await fetch(`${FUNCTIONS_URL}/ask-ai`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ article_id: articleId, question, user_id: userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ask AI: ${response.status}`);
      }

      const data: AskAIResponse = await response.json();
      return data.answer || null;
    } catch (error) {
      console.error('Error asking AI:', error);
      throw error;
    }
  },

  async getConversationHistory(articleId: string): Promise<any[]> {
    try {
      const params = new URLSearchParams({ article_id: articleId });

      const response = await fetch(
        `${FUNCTIONS_URL}/get-conversation-history?${params}`,
        { headers: getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch conversation history: ${response.status}`);
      }

      const data = await response.json();
      return data.conversations || [];
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      return [];
    }
  },

  async searchArticles(query: string, category?: string, limit = 20): Promise<Article[]> {
    try {
      const params = new URLSearchParams({ query, limit: limit.toString() });
      if (category) params.append('category', category);

      const response = await fetch(
        `${FUNCTIONS_URL}/search-articles?${params}`,
        { headers: getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`Failed to search articles: ${response.status}`);
      }

      const data: SearchResponse = await response.json();
      return data.articles || [];
    } catch (error) {
      console.error('Error searching articles:', error);
      return [];
    }
  },

  async scrapeNews(): Promise<ScrapeResponse> {
    try {
      const response = await fetch(`${FUNCTIONS_URL}/scrape-news`, {
        method: 'POST',
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to scrape news: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error scraping news:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async getTrendingArticles(limit = 10): Promise<Article[]> {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('is_trending', true)
        .order('engagement_score', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching trending articles:', error);
      return [];
    }
  },

  async getCategories(): Promise<{ category: string; count: number }[]> {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('category')
        .order('category');

      if (error) throw error;

      const categoryCounts = (data || []).reduce((acc: Record<string, number>, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(categoryCounts).map(([category, count]) => ({
        category,
        count: count as number,
      }));
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },

  async getLocalFeed(zipCode: string, city: string, state: string, limit = 50): Promise<Article[]> {
    try {
      const params = new URLSearchParams({
        zip_code: zipCode,
        city,
        state,
        limit: limit.toString(),
      });

      const response = await fetch(
        `${FUNCTIONS_URL}/get-local-feed?${params}`,
        { headers: getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch local feed: ${response.status}`);
      }

      const data = await response.json();
      return data.articles || [];
    } catch (error) {
      console.error('Error fetching local feed:', error);
      return [];
    }
  },

  async updateUserLocation(userId: string, location: { zipCode: string; city: string; state: string; stateCode: string }): Promise<boolean> {
    try {
      const response = await fetch(`${FUNCTIONS_URL}/update-user-location`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          user_id: userId,
          zip_code: location.zipCode,
          city: location.city,
          state: location.state,
          state_code: location.stateCode,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update user location: ${response.status}`);
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error updating user location:', error);
      return false;
    }
  },

  async getActiveAds(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching ads:', error);
      return [];
    }
  },

  async checkUserSubscription(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('is_subscribed, subscription_expires_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (!data || !data.is_subscribed) {
        return false;
      }

      if (data.subscription_expires_at) {
        const expiryDate = new Date(data.subscription_expires_at);
        return expiryDate > new Date();
      }

      return data.is_subscribed;
    } catch (error) {
      console.error('Error checking subscription:', error);
      return false;
    }
  },
};

export type { Article };
