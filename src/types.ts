export interface NewsSource {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
  websiteUrl?: string;
}

export interface Article {
  id: string;
  sourceId: string;
  sourceName: string;
  source?: string;
  sourceLogo?: string;
  title: string;
  summary: string;
  content?: string;
  url: string;
  imageUrl?: string;
  publishedAt: Date;
  category: string;
  location?: string;
  readTime?: number;
  isTrending?: boolean;
  author?: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface User {
  id: string;
  email: string;
  fullName?: string;
  location?: string;
  avatar?: string;
  isPremium?: boolean;
  subscriptionExpiresAt?: string;
}

export type CategoryType = 'discover' | 'local' | 'search' | 'saved';

export type TopicCategory = 'all' | 'tech' | 'gaming' | 'politics' | 'sports' | 'entertainment' | 'business' | 'health' | 'science' | 'world' | 'crypto' | 'travel';

export interface TrendingTopic {
  id: TopicCategory;
  name: string;
  icon: string;
  gradient: string;
}

export type EngagementType = 'like' | 'dislike' | 'save';

export interface ArticleEngagement {
  articleId: string;
  type: EngagementType;
  timestamp: Date;
}

export interface UserPreferences {
  likedCategories: Record<string, number>;
  dislikedCategories: Record<string, number>;
  likedSources: Record<string, number>;
  dislikedSources: Record<string, number>;
  engagementHistory: ArticleEngagement[];
}

export interface Ad {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  link_url: string;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}
