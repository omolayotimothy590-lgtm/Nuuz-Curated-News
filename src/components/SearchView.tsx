import { useState, useEffect, useMemo } from 'react';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { ArticleCard } from './ArticleCard';
import { GoogleAdCard } from './GoogleAdCard';
import { newsApi } from '../lib/newsApi';
import { Article } from '../types';
import { shouldShowAds } from '../lib/adUtils';
import { getAdSlot, shouldPlaceAd } from '../lib/adConfig';

export const SearchView = () => {
  const {
    searchQuery,
    setSearchQuery,
    searchHistory,
    addSearchHistory,
    setCurrentCategory
  } = useApp();
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const [searchResults, setSearchResults] = useState<Article[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const trendingSearches = [
    'AI Technology',
    'Climate Change',
    'Space Exploration',
    'Cryptocurrency',
    'Electric Vehicles',
    'Health Research',
    'Gaming News',
    'Tech Startups'
  ];

  const handleSearch = async (query: string) => {
    if (query.trim()) {
      setSearchQuery(query);
      addSearchHistory(query);
      setInputValue(query);
      setIsSearching(true);

      try {
        const backendArticles = await newsApi.searchArticles(query, undefined, 50);
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
        setSearchResults(converted);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setInputValue('');
  };

  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const resultsWithAds = useMemo(() => {
    if (!shouldShowAds(user) || searchResults.length === 0) {
      return searchResults.map(article => ({ type: 'article' as const, content: article }));
    }

    const result: Array<{ type: 'article' | 'google-ad'; content: any }> = [];
    let googleAdIndex = 0;

    searchResults.forEach((article, index) => {
      result.push({ type: 'article', content: article });

      if (shouldPlaceAd(index, 'search')) {
        const adSlot = getAdSlot('search', googleAdIndex);
        result.push({
          type: 'google-ad',
          content: { slot: adSlot, position: googleAdIndex, viewType: 'search' }
        });
        googleAdIndex++;
      }
    });

    return result;
  }, [searchResults, user]);

  return (
    <div className="pb-20">
      <div className="sticky top-14 bg-white border-b border-slate-200 px-4 py-3 z-30">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search articles, sources, topics..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch(inputValue);
              }
            }}
            className="w-full pl-10 pr-10 py-2.5 bg-slate-100 border-none rounded-full text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {inputValue && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {!searchQuery && (
        <div className="px-4 pt-4 space-y-6">
          {searchHistory.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Clock size={16} />
                Recent Searches
              </h3>
              <div className="space-y-2">
                {searchHistory.map((query, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(query)}
                    className="flex items-center justify-between w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg transition text-left"
                  >
                    <span className="text-slate-700">{query}</span>
                    <Search size={16} className="text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <TrendingUp size={16} />
              Trending Searches
            </h3>
            <div className="flex flex-wrap gap-2">
              {trendingSearches.map((search) => (
                <button
                  key={search}
                  onClick={() => handleSearch(search)}
                  className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full text-sm font-medium transition"
                >
                  {search}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick Filters</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setCurrentCategory('local')}
                className="px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-left transition"
              >
                <div className="text-sm font-semibold text-slate-900">Local News</div>
                <div className="text-xs text-slate-500 mt-0.5">From your area</div>
              </button>
              <button
                onClick={() => setCurrentCategory('saved')}
                className="px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-left transition"
              >
                <div className="text-sm font-semibold text-slate-900">Saved Articles</div>
                <div className="text-xs text-slate-500 mt-0.5">Your bookmarks</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {searchQuery && (
        <div>
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
            <p className="text-sm text-slate-600">
              {isSearching ? 'Searching...' : `${searchResults.length} ${searchResults.length === 1 ? 'result' : 'results'} for "${searchQuery}"`}
            </p>
          </div>
          {isSearching ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : resultsWithAds.length > 0 ? (
            <div>
              {resultsWithAds.map((item, index) => {
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
          ) : (
            <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
              <Search size={48} className="text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No results found</h3>
              <p className="text-slate-600 mb-6">Try searching with different keywords or browse trending topics</p>
              <button
                onClick={handleClearSearch}
                className="px-6 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition"
              >
                Clear Search
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
