import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getUserSubscription } from '../lib/stripe';
import { Loader2, Crown } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  summary: string;
  source: string;
  category: string;
  image_url: string;
  article_url: string;
  published_at: string;
  read_time: number;
}

export function DiscoverPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const timeoutId = setTimeout(() => {
        console.warn('⏰ Fetch taking too long (10s), forcing completion...');
        setLoading(false);
      }, 10000);

      try {
        console.log('🚀 Starting data fetch...');

        // Get user session with timeout
        console.log('👤 Checking user session...');
        const sessionPromise = supabase.auth.getSession();
        const sessionTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session check timeout')), 3000)
        );

        let session = null;
        try {
          const { data } = await Promise.race([sessionPromise, sessionTimeout]) as any;
          session = data?.session;
          console.log('👤 User session:', session?.user ? 'Authenticated' : 'Anonymous');
          setUser(session?.user || null);
        } catch (sessionError) {
          console.warn('⚠️ Session check timeout, continuing as anonymous');
        }

        // Get subscription if user is logged in
        if (session?.user) {
          try {
            const subscriptionData = await getUserSubscription();
            setSubscription(subscriptionData);
            console.log('💳 Subscription data:', subscriptionData);
          } catch (subError) {
            console.warn('⚠️ Error fetching subscription (non-critical):', subError);
          }
        }

        // Fetch articles - try multiple methods
        console.log('📰 Fetching articles...');

        // Method 1: Try Supabase client with timeout
        try {
          const articlesPromise = supabase
            .from('articles')
            .select('*')
            .order('published_at', { ascending: false })
            .limit(20);

          const articlesTimeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Articles fetch timeout')), 5000)
          );

          const result = await Promise.race([articlesPromise, articlesTimeout]) as any;

          if (result.error) {
            console.warn('⚠️ Supabase client error, trying edge function...', result.error);
            throw result.error;
          } else {
            console.log(`✅ Successfully fetched ${result.data?.length || 0} articles via Supabase client`);
            setArticles(result.data || []);
          }
        } catch (supabaseError) {
          // Method 2: Fallback to edge function
          console.log('🔄 Trying edge function fallback...');
          try {
            const response = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/discover-feed?limit=20`,
              {
                headers: {
                  'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                },
              }
            );

            if (!response.ok) {
              throw new Error(`Edge function failed: ${response.status}`);
            }

            const data = await response.json();
            console.log(`✅ Successfully fetched ${data.articles?.length || 0} articles via edge function`);

            // Transform edge function response to match component format
            const transformedArticles = data.articles?.map((article: any) => ({
              id: article.id,
              title: article.title,
              summary: article.summary,
              source: article.source,
              category: article.category,
              image_url: article.image_url,
              article_url: article.article_url,
              published_at: article.published_at,
              read_time: article.read_time,
            })) || [];

            setArticles(transformedArticles);
          } catch (edgeFunctionError) {
            console.error('❌ Both methods failed:', edgeFunctionError);
            throw edgeFunctionError;
          }
        }
      } catch (error) {
        console.error('❌ Fatal error fetching data:', error);
      } finally {
        clearTimeout(timeoutId);
        console.log('🏁 Data fetch complete, setting loading to false');
        setLoading(false);
      }
    };

    fetchData();

    // Listen for auth changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user || null);
        
        if (session?.user) {
          const subscriptionData = await getUserSubscription();
          setSubscription(subscriptionData);
        } else {
          setSubscription(null);
        }
      }
    );

    return () => authSubscription.unsubscribe();
  }, []);

  const isPremium = subscription?.subscription_status === 'active';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Loading articles...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Premium Status Banner */}
      {user && isPremium && (
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <Crown className="w-5 h-5 text-yellow-600 mr-2" />
            <span className="text-yellow-800 font-medium">
              You're enjoying Nuuz+ Premium - Ad-free and enhanced experience!
            </span>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover</h1>
        <p className="text-gray-600">Stay updated with the latest news from around the world</p>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No articles available at the moment.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <article
              key={article.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              {article.image_url && (
                <img
                  src={article.image_url}
                  alt={article.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-blue-600 font-medium">{article.category}</span>
                  <span className="text-sm text-gray-500">{article.read_time} min read</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                  {article.title}
                </h2>
                <p className="text-gray-600 mb-4 line-clamp-3">{article.summary}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{article.source}</span>
                  <a
                    href={article.article_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    Read more →
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}