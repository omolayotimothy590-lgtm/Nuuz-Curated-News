import { useState, useEffect } from 'react';
import { X, Share2, ExternalLink, Loader, AlertCircle, BookOpen, MessageSquare, Sparkles, Check } from 'lucide-react';
import { Article } from '../types';
import { Comments } from './Comments';
import { useApp } from '../contexts/AppContext';

interface ArticleReaderProps {
  article: Article;
  onClose: () => void;
}

interface ParsedArticle {
  title: string | null;
  content: string;
  author: string | null;
  publishedDate: string | null;
  excerpt: string | null;
  wordCount: number;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://itnxliunzuzlvtaswesi.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0bnhsaXVuenV6bHZ0YXN3ZXNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NDgxNzUsImV4cCI6MjA3ODEyNDE3NX0.q3sP2NKUT3_2GX8Fjq3PkWsUfPHyfHM5ut9SitE0bE0';

export const ArticleReader = ({ article, onClose }: ArticleReaderProps) => {
  const { setSelectedArticle, setShowAIChat } = useApp();
  const [parsedArticle, setParsedArticle] = useState<ParsedArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'article' | 'comments' | 'ai'>('article');
  const [showShareModal, setShowShareModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    console.log('🎯 Article reader opened for:', article.url);
    console.log('📊 Article data:', {
      title: article.title,
      source: article.source,
      url: article.url
    });

    // Lock body scroll when modal opens
    document.body.style.overflow = 'hidden';

    fetchArticleContent();

    // Unlock body scroll when modal closes
    return () => {
      console.log('🔒 Article reader closing');
      document.body.style.overflow = '';
    };
  }, [article.url]);

  const fetchArticleContent = async () => {
    setIsLoading(true);
    setError(null);

    console.log('📖 Loading article from edge function:', article.url);

    const maxRetries = 3;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${maxRetries}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/fetch-article-content`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ url: article.url }),
            signal: controller.signal
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to load article');
        }

        console.log('✅ Successfully loaded article');
        setParsedArticle(data.data);
        setError(null);
        setIsLoading(false);
        return;

      } catch (err) {
        console.error(`❌ Attempt ${attempt} failed:`, err);
        lastError = err;

        if (attempt < maxRetries) {
          console.log(`⏳ Waiting before retry ${attempt + 1}...`);
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        }
      }
    }

    console.error('❌ All attempts failed. Last error:', lastError);
    const errorMessage = lastError instanceof Error
      ? lastError.message
      : 'Failed to load article content. Please try again or open in browser.';
    setError(errorMessage);
    setIsLoading(false);
  };

  const getSourceFavicon = (url: string) => {
    try {
      const urlObj = new URL(url);
      return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
    } catch {
      return null;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const calculateReadTime = (wordCount: number) => {
    const minutes = Math.ceil(wordCount / 200);
    return `${minutes} min read`;
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

  console.log('🎨 ArticleReader rendering, isLoading:', isLoading, 'error:', error, 'hasArticle:', !!parsedArticle);

  return (
    <div className="fixed inset-0 bg-white dark:bg-slate-900 z-[100] flex flex-col animate-fade-in">
      <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 z-10">
        <div className="flex items-center justify-between px-4 h-14 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => {
              console.log('❌ Close button clicked');
              onClose();
            }}
            className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          >
            <X size={20} className="text-slate-600 dark:text-slate-400" />
            <span className="text-sm font-medium text-slate-900 dark:text-white">Close</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition"
              title="Share"
            >
              <Share2 size={20} className="text-slate-600 dark:text-slate-400" />
            </button>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition"
              title="Open in browser"
            >
              <ExternalLink size={20} className="text-slate-600 dark:text-slate-400" />
            </a>
          </div>
        </div>

        <div className="flex border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('article')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition ${
              activeTab === 'article'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen size={18} />
            <span>Article</span>
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition ${
              activeTab === 'comments'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MessageSquare size={18} />
            <span>Comments</span>
          </button>
          <button
            onClick={() => {
              const articleForAI = {
                id: article.id,
                sourceId: article.sourceId,
                sourceName: article.sourceName || article.source || 'Unknown',
                source: article.source || article.sourceName,
                sourceLogo: article.sourceLogo,
                title: article.title,
                summary: article.summary,
                content: article.content,
                url: article.url,
                imageUrl: article.imageUrl,
                publishedAt: article.publishedAt,
                category: article.category,
                location: article.location,
                readTime: article.readTime,
                isTrending: article.isTrending,
                author: article.author
              };
              setSelectedArticle(articleForAI);
              setShowAIChat(true);
              onClose();
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          >
            <Sparkles size={18} />
            <span>AI</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'article' && (
          <div className="h-full overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 py-8">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                  <Loader className="animate-spin text-blue-600" size={40} />
                  <p className="text-slate-600 dark:text-slate-400">Loading article...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-4">
                  <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                    <AlertCircle className="text-red-600 dark:text-red-400" size={48} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                      Failed to Load Article
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
                      {error}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <button
                        onClick={() => fetchArticleContent()}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        <Loader size={18} />
                        Retry Loading
                      </button>
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                      >
                        <ExternalLink size={18} />
                        Open in Browser
                      </a>
                    </div>
                  </div>
                </div>
              ) : parsedArticle ? (
                <>
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                      {getSourceFavicon(article.url) && (
                        <img
                          src={getSourceFavicon(article.url) || undefined}
                          alt={article.source}
                          className="w-5 h-5 rounded"
                          width="20"
                          height="20"
                        />
                      )}
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {article.source}
                      </span>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 leading-tight">
                      {parsedArticle.title || article.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      {parsedArticle.author && (
                        <>
                          <span>{parsedArticle.author}</span>
                          <span>•</span>
                        </>
                      )}
                      {parsedArticle.publishedDate && (
                        <>
                          <span>{formatDate(parsedArticle.publishedDate)}</span>
                          <span>•</span>
                        </>
                      )}
                      <span>{calculateReadTime(parsedArticle.wordCount)}</span>
                    </div>
                  </div>

                  <div className="article-content prose prose-slate dark:prose-invert max-w-none">
                    <div className="text-slate-700 dark:text-slate-300 leading-relaxed text-lg whitespace-pre-wrap">
                      {parsedArticle.content}
                    </div>
                  </div>

                  <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
                    <div className="text-center p-6 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <p className="text-slate-600 dark:text-slate-400 mb-3">
                        This article was originally published on {article.source}
                      </p>
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                      >
                        <ExternalLink size={18} />
                        Read Original Article
                      </a>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="h-full overflow-hidden flex flex-col">
            <Comments articleUrl={article.url} />
          </div>
        )}
      </div>

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
                <X size={20} className="text-slate-500" />
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
    </div>
  );
};
