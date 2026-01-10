import { useState, useEffect, useMemo } from 'react';
import { Bookmark } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { ArticleCard } from './ArticleCard';
import { GoogleAdCard } from './GoogleAdCard';
import { newsApi } from '../lib/newsApi';
import { Article } from '../types';
import { shouldShowAds } from '../lib/adUtils';
import { getAdSlot, shouldPlaceAd } from '../lib/adConfig';

export const SavedView = () => {
  const { savedArticles } = useApp();
  const { user } = useAuth();
  const [savedArticlesList, setSavedArticlesList] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getUserId = () => user?.id || `device-${localStorage.getItem('deviceId') || Math.random().toString(36).substring(7)}`;

  useEffect(() => {
    const fetchSavedArticles = async () => {
      setIsLoading(true);
      try {
        const backendArticles = await newsApi.getSavedArticles(getUserId());
        const converted = backendArticles.map(article => ({
          id: article.id,
          title: article.title,
          summary: article.summary,
          content: article.full_content,
          source: article.source,
          sourceId: article.source.toLowerCase().replace(/\s+/g, '-'),
          sourceName: article.source,
          sourceLogo: article.source_logo || '',
          author: 'Staff Writer',
          category: article.category as any,
          imageUrl: article.image_url || '',
          url: article.article_url,
          publishedAt: new Date(article.published_at),
          readTime: article.read_time,
          isTrending: article.is_trending,
          location: 'General'
        }));
        setSavedArticlesList(converted);
      } catch (error) {
        console.error('Error fetching saved articles:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavedArticles();
  }, [savedArticles, user]);

  const articlesWithAds = useMemo(() => {
    if (!shouldShowAds(user) || savedArticlesList.length === 0) {
      return savedArticlesList.map(article => ({ type: 'article' as const, content: article }));
    }

    const result: Array<{ type: 'article' | 'google-ad'; content: any }> = [];
    let googleAdIndex = 0;

    savedArticlesList.forEach((article, index) => {
      result.push({ type: 'article', content: article });

      if (shouldPlaceAd(index, 'saved')) {
        const adSlot = getAdSlot('saved', googleAdIndex);
        result.push({
          type: 'google-ad',
          content: { slot: adSlot, position: googleAdIndex, viewType: 'saved' }
        });
        googleAdIndex++;
      }
    });

    return result;
  }, [savedArticlesList, user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (savedArticlesList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center min-h-[60vh]">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
          <Bookmark size={36} className="text-blue-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">No saved articles yet</h3>
        <p className="text-slate-600 max-w-sm">
          Tap the bookmark icon on any article to save it for later reading
        </p>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <div className="sticky top-14 bg-white border-b border-slate-200 px-4 py-3 z-30">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Saved Articles</h2>
          <span className="text-sm text-slate-600">{savedArticlesList.length} saved</span>
        </div>
      </div>

      <div>
        {articlesWithAds.map((item, index) => {
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
      </div>
    </div>
  );
};
