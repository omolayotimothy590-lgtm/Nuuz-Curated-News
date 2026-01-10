import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { MessageSquare, ThumbsUp, ThumbsDown, Bookmark, Share2, Check, X as XIcon, BookOpen } from 'lucide-react';
import { Article } from '../types';
import { useApp } from '../contexts/AppContext';
import { ArticleReader } from './ArticleReader';
import { getCategoryGradient, getCategoryIcon } from '../lib/categoryUtils';
import { decodeArticleText } from '../lib/htmlUtils';
import { imageScraper } from '../lib/imageScraper';

interface ArticleCardProps {
  article: Article;
}

export const ArticleCard = ({ article }: ArticleCardProps) => {
  const [showReader, setShowReader] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [swipeAction, setSwipeAction] = useState<'like' | 'dislike' | null>(null);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [scrapedImage, setScrapedImage] = useState<string | null>(null);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isDragging = useRef(false);

  const CategoryIcon = useMemo(() => getCategoryIcon(article.category), [article.category]);

  const {
    setSelectedArticle,
    setShowAIChat,
    likedArticles,
    dislikedArticles,
    savedArticles,
    toggleLike,
    toggleDislike,
    toggleSave,
    supabase
  } = useApp();
  const isLiked = useMemo(() => likedArticles.has(article.id), [likedArticles, article.id]);
  const isDisliked = useMemo(() => dislikedArticles.has(article.id), [dislikedArticles, article.id]);
  const isSaved = useMemo(() => savedArticles.has(article.id), [savedArticles, article.id]);

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

  const getTimeAgo = useCallback((date: Date) => {
    const hours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  }, []);

  const getReadTime = useCallback((summary: string, title: string) => {
    const wordCount = (summary + title).split(' ').length;
    const readTime = Math.ceil(wordCount / 200);
    return `${readTime} min read`;
  }, []);

  const handleAskAI = () => {
    setSelectedArticle(article);
    setShowAIChat(true);
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const copyLink = async () => {
    try {
      const shareUrl = `${window.location.origin}/?article=${article.id}`;
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      console.log('✅ Link copied to clipboard');
      setTimeout(() => {
        setShowShareModal(false);
        setTimeout(() => setLinkCopied(false), 300);
      }, 1500);
    } catch (error) {
      console.error('❌ Copy error:', error);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      isDragging.current = true;
      e.preventDefault();
      setSwipeOffset(deltaX);

      if (deltaX > 50) {
        setSwipeAction('like');
      } else if (deltaX < -50) {
        setSwipeAction('dislike');
      } else {
        setSwipeAction(null);
      }
    }
  };

  const handleTouchEnd = () => {
    if (isDragging.current) {
      if (swipeOffset > 100) {
        toggleLike(article.id, article);
      } else if (swipeOffset < -100) {
        toggleDislike(article.id, article);
      }
    }

    setSwipeOffset(0);
    setSwipeAction(null);
    isDragging.current = false;
  };

  const handleCardClick = () => {
    if (!isDragging.current && swipeOffset === 0) {
      console.log('🖱️ Article card clicked - opening article reader immediately');
      openArticleReader();
    }
  };

  const openArticleReader = () => {
    console.log('📖 Opening article reader for:', article.title);
    console.log('📄 Article URL:', article.url);
    console.log('📦 Full article object:', article);
    console.log('🎬 Setting showReader to true');
    setShowReader(true);
    console.log('✅ showReader state updated');
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !article.imageUrl && article.url && !scrapedImage && !imageError) {
          imageScraper.scrapeImageAsync(article.url, (image) => {
            if (image) {
              setScrapedImage(image);
            } else {
              setImageError(true);
            }
          });
        }
      },
      { rootMargin: '200px' }
    );

    const element = document.getElementById(`article-${article.id}`);
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [article.imageUrl, article.url, article.id, scrapedImage, imageError]);

  const handleImageError = () => {
    console.warn(`Failed to load image for article: ${article.title}`);
    if (!scrapedImage && article.url) {
      imageScraper.scrapeImageAsync(article.url, (image) => {
        if (image && image !== article.imageUrl) {
          setScrapedImage(image);
          setImageError(false);
          setImageLoaded(false);
        } else {
          setImageError(true);
        }
      });
    } else {
      setImageError(true);
    }
  };

  const displayImage = useMemo(() => article.imageUrl || scrapedImage || '', [article.imageUrl, scrapedImage]);
  const showImagePlaceholder = useMemo(() => !displayImage || imageError, [displayImage, imageError]);

  return (
    <>
      <article
        id={`article-${article.id}`}
        className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 pb-4 relative overflow-hidden"
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isDragging.current ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        {swipeAction === 'like' && (
          <div className="absolute inset-0 bg-green-500 flex items-center justify-start pl-8">
            <Check size={48} className="text-white" strokeWidth={3} />
          </div>
        )}
        {swipeAction === 'dislike' && (
          <div className="absolute inset-0 bg-red-500 flex items-center justify-end pr-8">
            <XIcon size={48} className="text-white" strokeWidth={3} />
          </div>
        )}
        <div
          className="relative bg-white dark:bg-slate-900 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850 active:bg-slate-100 dark:active:bg-slate-800 transition-colors duration-150"
          onClick={handleCardClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
        {showImagePlaceholder ? (
          <div
            className="relative w-full h-[350px] overflow-hidden flex items-center justify-center"
            style={{ background: getCategoryGradient(article.category) }}
          >
            <CategoryIcon size={64} className="text-white opacity-30" />
          </div>
        ) : (
          <div className="relative w-full h-[350px] overflow-hidden bg-slate-100 dark:bg-slate-800">
            {!imageLoaded && (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: getCategoryGradient(article.category) }}
              >
                <CategoryIcon size={64} className="text-white opacity-30" />
              </div>
            )}
            <img
              src={displayImage}
              alt={article.title}
              onError={handleImageError}
              onLoad={() => setImageLoaded(true)}
              className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              loading="lazy"
              decoding="async"
            />
          </div>
        )}

        <div className="px-4 pt-4">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-3">
            <span className="font-semibold text-slate-900 dark:text-white">{article.sourceName}</span>
            <span>·</span>
            <span>{getTimeAgo(article.publishedAt)}</span>
            <span>·</span>
            <span>{getReadTime(article.summary, article.title)}</span>
          </div>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 leading-snug">
            {decodeArticleText(article.title)}
          </h2>

          <p className="text-slate-600 dark:text-slate-400 mb-3 leading-relaxed text-sm">
            {decodeArticleText(article.summary)}
          </p>
        </div>
      </div>

        <div className="px-4 space-y-3">
          <div className="flex items-center justify-center gap-6">
            <button
            onClick={async (e) => {
              e.stopPropagation();
              await toggleLike(article.id, article);
              fetchLikeCount();
            }}
            className={`p-2 rounded-full transition active:scale-95 flex flex-col items-center gap-0.5 ${
              isLiked
                ? 'text-blue-600'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <ThumbsUp size={24} fill={isLiked ? 'currentColor' : 'none'} strokeWidth={2} />
            {likeCount > 0 && (
              <span className="text-xs font-semibold">{likeCount}</span>
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleDislike(article.id, article);
            }}
            className={`p-2 rounded-full transition active:scale-95 ${
              isDisliked
                ? 'text-red-600'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <ThumbsDown size={24} fill={isDisliked ? 'currentColor' : 'none'} strokeWidth={2} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log('🖱️ MessageSquare button clicked');
              openArticleReader();
            }}
            className="p-2 rounded-full transition active:scale-95 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-400"
          >
            <MessageSquare size={24} strokeWidth={2} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleSave(article.id, article);
            }}
            className={`p-2 rounded-full transition active:scale-95 ${
              isSaved
                ? 'text-nuuz-yellow'
                : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-400'
            }`}
          >
            <Bookmark size={24} fill={isSaved ? 'currentColor' : 'none'} strokeWidth={2} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleShare();
            }}
            className="p-2 rounded-full transition active:scale-95 text-slate-400 hover:text-slate-600"
          >
            <Share2 size={24} strokeWidth={2} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log('🖱️ Read button clicked');
              openArticleReader();
            }}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium rounded-lg transition active:scale-95 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <BookOpen size={14} strokeWidth={2} />
            <span className="text-xs">Read</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAskAI();
            }}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-nuuz-yellow hover:bg-yellow-500 active:bg-yellow-600 text-white font-medium rounded-lg transition active:scale-95 shadow-sm"
          >
            <MessageSquare size={14} strokeWidth={2} />
            <span className="text-xs">Ask AI</span>
          </button>
          </div>
        </div>
      </article>

      {showReader && (
        <ArticleReader
          article={article}
          onClose={() => {
            console.log('🔒 Closing article reader');
            setShowReader(false);
          }}
        />
      )}

      {showShareModal && (
        <div
          className="fixed inset-0 bg-black/50 z-[200] flex items-end sm:items-center justify-center animate-fade-in"
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Share Article</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition"
              >
                <XIcon size={20} className="text-slate-500" />
              </button>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              {article.title}
            </p>

            <button
              onClick={copyLink}
              disabled={linkCopied}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 font-medium rounded-xl transition ${
                linkCopied
                  ? 'bg-green-500 text-white'
                  : 'bg-nuuz-yellow hover:bg-yellow-500 active:bg-yellow-600 text-white active:scale-95 shadow-sm'
              }`}
            >
              {linkCopied ? (
                <>
                  <Check size={18} />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 size={18} />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
