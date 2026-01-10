import { useState, useEffect } from 'react';
import { X, ExternalLink, MessageSquare, ThumbsUp, Bookmark, Share2, BookOpen } from 'lucide-react';
import { Article } from '../types';
import { useApp } from '../contexts/AppContext';
import { decodeArticleText } from '../lib/htmlUtils';
import { Comments } from './Comments';
import { ArticleReader } from './ArticleReader';

interface ArticlePreviewProps {
  article: Article;
  onClose: () => void;
}

export const ArticlePreview = ({ article, onClose }: ArticlePreviewProps) => {
  const [likeCount, setLikeCount] = useState<number>(0);
  const [showReader, setShowReader] = useState(false);
  const {
    likedArticles,
    savedArticles,
    toggleLike,
    toggleSave,
    setSelectedArticle,
    setShowAIChat,
    supabase
  } = useApp();

  const isLiked = likedArticles.has(article.id);
  const isSaved = savedArticles.has(article.id);

  useEffect(() => {
    fetchLikeCount();
  }, [article.id]);

  const fetchLikeCount = async () => {
    try {
      const { count } = await supabase
        .from('user_interactions')
        .select('*', { count: 'exact', head: true })
        .eq('article_id', article.id)
        .eq('action', 'thumbs_up');

      setLikeCount(count || 0);
    } catch (error) {
      console.error('Error fetching like count:', error);
    }
  };

  const getTimeAgo = (date: Date) => {
    const hours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  };

  const getReadTime = (summary: string, title: string) => {
    const wordCount = (summary + title).split(' ').length;
    const readTime = Math.ceil(wordCount / 200);
    return `${readTime} min read`;
  };

  const handleAskAI = () => {
    setSelectedArticle(article);
    setShowAIChat(true);
    onClose();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.summary,
          url: article.url
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(article.url);
        alert('Link copied to clipboard!');
      } catch (error) {
        console.error('Error copying to clipboard:', error);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto animate-slide-up">
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-200 z-10">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={onClose}
            className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition active:scale-95"
          >
            <X size={24} className="text-slate-600" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleSave(article.id, article)}
              className={`p-2 rounded-full transition active:scale-95 ${
                isSaved
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-slate-400 hover:bg-slate-100'
              }`}
            >
              <Bookmark size={20} fill={isSaved ? 'currentColor' : 'none'} strokeWidth={2} />
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded-full hover:bg-slate-100 transition active:scale-95"
            >
              <Share2 size={20} className="text-slate-600" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      <div className="pb-24">
        {article.imageUrl && (
          <div className="relative w-full h-64 mb-6">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        )}

        <div className="px-4 space-y-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{article.sourceName}</span>
            <span>·</span>
            <span>{getTimeAgo(article.publishedAt)}</span>
            <span>·</span>
            <span>{getReadTime(article.summary, article.title)}</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 leading-tight">
            {decodeArticleText(article.title)}
          </h1>

          <p className="text-base text-slate-700 leading-relaxed">
            {decodeArticleText(article.summary)}
          </p>

          {article.content && (
            <div className="pt-4 border-t border-slate-200">
              <p className="text-base text-slate-700 leading-relaxed whitespace-pre-line">
                {decodeArticleText(article.content)}
              </p>
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-slate-200">
          {likeCount > 0 && (
            <div className="pb-2">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                {likeCount} {likeCount === 1 ? 'like' : 'likes'}
              </span>
            </div>
          )}
          <div className="flex items-center gap-4">
            <button
              onClick={async () => {
                await toggleLike(article.id, article);
                fetchLikeCount();
              }}
              className="transition active:scale-95"
            >
              <ThumbsUp size={28} fill={isLiked ? 'currentColor' : 'none'} strokeWidth={2} className={isLiked ? 'text-red-500' : 'text-slate-900'} />
            </button>
            <button
              onClick={handleAskAI}
              className="transition active:scale-95"
            >
              <MessageSquare size={28} strokeWidth={2} className="text-slate-900" />
            </button>
            <button
              onClick={handleShare}
              className="transition active:scale-95"
            >
              <Share2 size={28} strokeWidth={2} className="text-slate-900" />
            </button>
            <button
              onClick={() => toggleSave(article.id, article)}
              className="ml-auto transition active:scale-95"
            >
              <Bookmark size={28} fill={isSaved ? 'currentColor' : 'none'} strokeWidth={2} className={isSaved ? 'text-slate-900' : 'text-slate-900'} />
            </button>
          </div>
        </div>

        <div className="px-4 py-6 space-y-3">
          <button
            onClick={() => {
              setShowReader(true);
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition active:scale-95"
          >
            <BookOpen size={20} />
            <span>Read Full Article</span>
          </button>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-slate-300 text-slate-600 font-medium rounded-lg hover:bg-slate-50 transition active:scale-95"
          >
            <ExternalLink size={20} />
            <span>Open in Browser</span>
          </a>
        </div>

        <Comments articleUrl={article.url} collapsed={false} />
      </div>

      {showReader && (
        <ArticleReader article={article} onClose={() => setShowReader(false)} />
      )}
    </div>
  );
};
