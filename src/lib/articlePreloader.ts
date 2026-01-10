import { TopicCategory } from '../types';
import { CATEGORY_SOURCES } from './defaultSources';
import { setCachedArticles, shouldPreload, markPreloadComplete } from './articleCache';
import { supabase } from './supabase';

const PRELOAD_TOPICS: TopicCategory[] = ['tech', 'business', 'sports', 'gaming'];

async function fetchArticlesForTopic(topic: TopicCategory): Promise<void> {
  try {
    console.log(`📥 Preloading ${topic}...`);

    const sources = CATEGORY_SOURCES[topic] || [];
    if (sources.length === 0) {
      console.log(`⚠️ No sources for ${topic}, skipping preload`);
      return;
    }

    const response = await supabase.functions.invoke('scrape-news', {
      body: {
        category: topic,
        sources: sources.slice(0, 3)
      }
    });

    if (response.data?.articles && response.data.articles.length > 0) {
      setCachedArticles('discover', response.data.articles, topic);
      console.log(`✅ Preloaded ${response.data.articles.length} ${topic} articles`);
    } else {
      console.log(`⚠️ No articles returned for ${topic}`);
    }
  } catch (error) {
    console.error(`❌ Failed to preload ${topic}:`, error);
  }
}

export async function preloadArticles(): Promise<void> {
  if (!shouldPreload()) {
    console.log('⏭️ Skipping preload (recently completed)');
    return;
  }

  console.log('🚀 Starting article preload in background...');

  for (const topic of PRELOAD_TOPICS) {
    await fetchArticlesForTopic(topic);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  markPreloadComplete();
  console.log('✅ Article preload complete');
}

export function startBackgroundPreload(): void {
  setTimeout(() => {
    preloadArticles().catch(error => {
      console.error('❌ Background preload failed:', error);
    });
  }, 2000);
}
