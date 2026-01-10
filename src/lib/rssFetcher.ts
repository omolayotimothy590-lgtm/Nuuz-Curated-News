import { Article, TopicCategory } from '../types';
import { supabase, supabaseEnabled } from './supabase';
import { getSourcesForCategory } from './defaultSources';

interface RSSFeed {
  url: string;
  source: string;
  category: TopicCategory;
}

const RSS_FEEDS: RSSFeed[] = [
  { url: "https://techcrunch.com/feed/", source: "TechCrunch", category: "tech" },
  { url: "https://www.theverge.com/rss/index.xml", source: "The Verge", category: "tech" },
  { url: "https://www.wired.com/feed/rss", source: "Wired", category: "tech" },
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml", source: "NY Times Tech", category: "tech" },
  { url: "https://www.engadget.com/rss.xml", source: "Engadget", category: "tech" },
  { url: "https://feeds.arstechnica.com/arstechnica/index", source: "Ars Technica", category: "tech" },
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml", source: "NY Times Business", category: "business" },
  { url: "https://www.cnbc.com/id/100003114/device/rss/rss.html", source: "CNBC", category: "business" },
  { url: "https://www.businessinsider.com/rss", source: "Business Insider", category: "business" },
  { url: "https://www.polygon.com/rss/index.xml", source: "Polygon", category: "gaming" },
  { url: "https://www.ign.com/articles?tags=news&format=rss", source: "IGN", category: "gaming" },
  { url: "https://www.pcgamer.com/rss/", source: "PC Gamer", category: "gaming" },
  { url: "https://www.espn.com/espn/rss/news", source: "ESPN", category: "sports" },
  { url: "https://www.cbssports.com/rss/headlines", source: "CBS Sports", category: "sports" },
  { url: "https://variety.com/feed/", source: "Variety", category: "entertainment" },
  { url: "https://deadline.com/feed/", source: "Deadline", category: "entertainment" },
  { url: "https://www.healthline.com/rss", source: "Healthline", category: "health" },
  { url: "https://www.medicalnewstoday.com/rss", source: "Medical News Today", category: "health" },
  { url: "https://cointelegraph.com/rss", source: "Cointelegraph", category: "crypto" },
  { url: "https://decrypt.co/feed", source: "Decrypt", category: "crypto" },
  { url: "https://www.cntraveler.com/feed/rss", source: "Condé Nast Traveler", category: "travel" },
  { url: "https://www.travelandleisure.com/rss", source: "Travel + Leisure", category: "travel" },
  { url: "https://feeds.bbci.co.uk/news/rss.xml", source: "BBC News", category: "world" },
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", source: "NY Times World", category: "world" },
];

const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
];

function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function upgradeImageQuality(imageUrl: string | null, source: string): string | null {
  if (!imageUrl) return null;

  const decoded = decodeHTMLEntities(imageUrl);
  const lowerSource = source.toLowerCase();

  try {
    const urlObj = new URL(decoded);

    if (lowerSource.includes('bbc') && urlObj.hostname.includes('ichef.bbci.co.uk')) {
      const originalUrl = decoded;
      const upgradedUrl = decoded.replace(
        /(ichef\.bbci\.co\.uk\/[^\/]+\/)\d+\//,
        '$1976/'
      );
      if (upgradedUrl !== originalUrl) {
        console.log(`🖼️  BBC image upgraded to 976px width`);
      }
      return upgradedUrl;
    }

    if (urlObj.hostname.includes('cnet.com')) {
      urlObj.searchParams.delete('auto');
      urlObj.searchParams.delete('fit');
      urlObj.searchParams.delete('height');
      urlObj.searchParams.delete('width');
      const pathParts = urlObj.pathname.split('/');
      const resizeIndex = pathParts.indexOf('resize');
      if (resizeIndex !== -1 && resizeIndex > 0) {
        pathParts.splice(resizeIndex, 1);
        urlObj.pathname = pathParts.join('/');
      }
      console.log(`🖼️  CNET image upgraded - removed resize constraints`);
      return urlObj.toString();
    }

    if (urlObj.hostname.includes('nytimes.com')) {
      urlObj.searchParams.set('quality', '100');
      urlObj.searchParams.set('w', '2000');
      console.log(`🖼️  NY Times image upgraded to 2000px width, 100% quality`);
      return urlObj.toString();
    }

    if (urlObj.hostname.includes('theverge.com') || urlObj.hostname.includes('polygon.com')) {
      urlObj.searchParams.set('quality', '90');
      urlObj.searchParams.delete('width');
      urlObj.searchParams.delete('height');
      console.log(`🖼️  ${lowerSource.includes('verge') ? 'The Verge' : 'Polygon'} image upgraded to 90% quality`);
      return urlObj.toString();
    }

    if (urlObj.hostname.includes('engadget.com')) {
      urlObj.searchParams.delete('resize');
      urlObj.searchParams.delete('crop');
      console.log(`🖼️  Engadget image upgraded - removed resize constraints`);
      return urlObj.toString();
    }

    if (urlObj.hostname.includes('wired.com')) {
      urlObj.searchParams.set('quality', '90');
      urlObj.searchParams.set('width', '2000');
      console.log(`🖼️  Wired image upgraded to 2000px width`);
      return urlObj.toString();
    }

    return decoded;
  } catch (e) {
    return decoded;
  }
}

function extractImageFromContent(xmlString: string, description: string, source?: string, enableDiagnostics = false): string | null {
  if (enableDiagnostics && source) {
    console.group(`🔍 Image Diagnostic: ${source}`);
  }

  const mediaContentMatches = xmlString.match(/<media:content[^>]*>/gi) || [];
  if (mediaContentMatches.length > 0) {
    if (enableDiagnostics) {
      console.log(`📦 Found ${mediaContentMatches.length} media:content tag(s)`);
    }

    let maxWidth = 0;
    let bestUrl = null;
    const allImages: Array<{url: string; width: number; medium?: string}> = [];

    for (const mediaTag of mediaContentMatches) {
      const urlMatch = mediaTag.match(/url=["']([^"']+)["']/i);
      const widthMatch = mediaTag.match(/width=["'](\d+)["']/i);
      const heightMatch = mediaTag.match(/height=["'](\d+)["']/i);
      const mediumMatch = mediaTag.match(/medium=["']([^"']+)["']/i);

      if (mediumMatch && mediumMatch[1] !== 'image') continue;

      if (urlMatch) {
        const url = decodeHTMLEntities(urlMatch[1]);
        const width = widthMatch ? parseInt(widthMatch[1]) : 0;
        const height = heightMatch ? parseInt(heightMatch[1]) : 0;

        allImages.push({ url, width, medium: mediumMatch?.[1] });

        if (enableDiagnostics) {
          console.log(`  → Image: ${width}x${height}px`);
          console.log(`    URL: ${url.substring(0, 80)}...`);
          if (mediumMatch) console.log(`    Medium: ${mediumMatch[1]}`);
        }

        if (width > maxWidth || !bestUrl) {
          maxWidth = width;
          bestUrl = url;
        }
      }
    }

    if (enableDiagnostics && allImages.length > 0) {
      console.log(`✅ Selected: ${maxWidth}px image`);
      console.log(`   URL: ${bestUrl?.substring(0, 80)}...`);
    }

    if (bestUrl && (bestUrl.startsWith('http://') || bestUrl.startsWith('https://'))) {
      if (enableDiagnostics) console.groupEnd();
      return bestUrl;
    }
  }

  const mediaThumbnailMatches = xmlString.match(/<media:thumbnail[^>]+>/gi) || [];
  if (mediaThumbnailMatches.length > 0 && enableDiagnostics) {
    console.log(`📦 Found ${mediaThumbnailMatches.length} media:thumbnail tag(s)`);
    mediaThumbnailMatches.forEach((tag, i) => {
      const urlMatch = tag.match(/url=["']([^"']+)["']/i);
      const widthMatch = tag.match(/width=["'](\d+)["']/i);
      const heightMatch = tag.match(/height=["'](\d+)["']/i);
      if (urlMatch) {
        console.log(`  → Thumbnail ${i + 1}: ${widthMatch?.[1] || '?'}x${heightMatch?.[1] || '?'}px`);
        console.log(`    URL: ${decodeHTMLEntities(urlMatch[1]).substring(0, 80)}...`);
      }
    });
  }

  const mediaThumbnailMatch = xmlString.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i);
  if (mediaThumbnailMatch) {
    const url = decodeHTMLEntities(mediaThumbnailMatch[1]);
    if (enableDiagnostics) {
      console.log(`⚠️  Fallback to media:thumbnail`);
      console.groupEnd();
    }
    return url;
  }

  const enclosureMatches = xmlString.match(/<enclosure[^>]*>/gi) || [];
  if (enclosureMatches.length > 0 && enableDiagnostics) {
    console.log(`📦 Found ${enclosureMatches.length} enclosure tag(s)`);
    enclosureMatches.forEach((tag, i) => {
      const urlMatch = tag.match(/url=["']([^"']+)["']/i);
      const typeMatch = tag.match(/type=["']([^"']+)["']/i);
      const lengthMatch = tag.match(/length=["'](\d+)["']/i);
      if (urlMatch) {
        console.log(`  → Enclosure ${i + 1}: ${typeMatch?.[1] || 'unknown type'}`);
        console.log(`    URL: ${decodeHTMLEntities(urlMatch[1]).substring(0, 80)}...`);
        if (lengthMatch) console.log(`    Size: ${(parseInt(lengthMatch[1]) / 1024).toFixed(0)} KB`);
      }
    });
  }

  const enclosureMatch = xmlString.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
  if (enclosureMatch) {
    const typeMatch = xmlString.match(/<enclosure[^>]+type=["']([^"']+)["']/i);
    if (!typeMatch || typeMatch[1].startsWith('image/')) {
      const url = decodeHTMLEntities(enclosureMatch[1]);
      if (enableDiagnostics) {
        console.log(`⚠️  Fallback to enclosure`);
        console.groupEnd();
      }
      return url;
    }
  }

  const imgMatches = description.match(/<img[^>]+>/gi) || [];
  if (imgMatches.length > 0 && enableDiagnostics) {
    console.log(`📦 Found ${imgMatches.length} <img> tag(s) in description`);
    imgMatches.forEach((tag, i) => {
      const srcMatch = tag.match(/src=["']([^"']+)["']/i);
      const widthMatch = tag.match(/width=["'](\d+)["']/i);
      const heightMatch = tag.match(/height=["'](\d+)["']/i);
      if (srcMatch) {
        console.log(`  → IMG ${i + 1}: ${widthMatch?.[1] || '?'}x${heightMatch?.[1] || '?'}px`);
        console.log(`    URL: ${decodeHTMLEntities(srcMatch[1]).substring(0, 80)}...`);
      }
    });
  }

  const imgMatch = description.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch) {
    const url = decodeHTMLEntities(imgMatch[1]);
    if (enableDiagnostics) {
      console.log(`⚠️  Fallback to <img> tag in description`);
      console.groupEnd();
    }
    return url;
  }

  if (enableDiagnostics) {
    console.log(`❌ No images found`);
    console.groupEnd();
  }

  return null;
}

function stripHTML(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function calculateReadTime(text: string): number {
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 225));
}

async function fetchWithTimeout(url: string, timeout = 30000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function fetchFeedWithCORSFallback(feedUrl: string): Promise<string> {
  try {
    const response = await fetchWithTimeout(feedUrl);
    if (response.ok) {
      return await response.text();
    }
  } catch (error) {
    console.log(`Direct fetch failed for ${feedUrl}, trying CORS proxy...`);
  }

  for (const proxy of CORS_PROXIES) {
    try {
      const proxyUrl = `${proxy}${encodeURIComponent(feedUrl)}`;
      console.log(`Trying CORS proxy: ${proxy.slice(0, 30)}...`);
      const response = await fetchWithTimeout(proxyUrl);
      if (response.ok) {
        const text = await response.text();
        console.log(`✓ Successfully fetched via proxy: ${proxy.slice(0, 30)}...`);
        return text;
      }
    } catch (error) {
      console.log(`Proxy ${proxy.slice(0, 30)}... failed, trying next...`);
      continue;
    }
  }

  throw new Error(`Failed to fetch feed from all sources`);
}

async function parseRSSFeed(feed: RSSFeed): Promise<Article[]> {
  console.log(`Fetching ${feed.source}...`);

  try {
    const xml = await fetchFeedWithCORSFallback(feed.url);
    const articles: Article[] = [];

    const isAtom = xml.includes('<feed xmlns="http://www.w3.org/2005/Atom"');

    if (isAtom) {
      const entryMatches = xml.match(/<entry>([\s\S]*?)<\/entry>/g) || [];

      for (const entryXml of entryMatches.slice(0, 15)) {
        const titleMatch = entryXml.match(/<title[^>]*>(.*?)<\/title>/);
        const title = titleMatch ? decodeHTMLEntities(stripHTML(titleMatch[1])) : '';

        const summaryMatch = entryXml.match(/<summary[^>]*>(.*?)<\/summary>/);
        const contentMatch = entryXml.match(/<content[^>]*>(.*?)<\/content>/);
        const description = summaryMatch ? stripHTML(summaryMatch[1]) : '';
        const content = contentMatch ? stripHTML(contentMatch[1]) : description;

        const linkMatch = entryXml.match(/<link[^>]+href=["']([^"']+)["']/);
        const link = linkMatch ? linkMatch[1] : '';

        const publishedMatch = entryXml.match(/<published>(.*?)<\/published>/) ||
                              entryXml.match(/<updated>(.*?)<\/updated>/);
        const pubDate = publishedMatch ? publishedMatch[1] : new Date().toISOString();

        const isWorldNews = feed.category === 'world';
        const imageUrl = extractImageFromContent(entryXml, content || description, feed.source, isWorldNews);
        const upgradedImageUrl = upgradeImageQuality(imageUrl, feed.source);

        if (title && link) {
          articles.push({
            id: `${feed.source}-${Date.now()}-${Math.random()}`,
            title: title.trim(),
            summary: decodeHTMLEntities(description).substring(0, 500).trim(),
            content: decodeHTMLEntities(content).substring(0, 1000).trim(),
            source: feed.source,
            sourceId: feed.source.toLowerCase().replace(/\s+/g, '-'),
            sourceName: feed.source,
            sourceLogo: '',
            author: 'Staff Writer',
            category: feed.category,
            imageUrl: upgradedImageUrl || '',
            url: link.trim(),
            publishedAt: new Date(pubDate),
            readTime: calculateReadTime(content || description),
            isTrending: false,
            location: 'General'
          });
        }
      }
    } else {
      const itemMatches = xml.match(/<item[^>]*>([\s\S]*?)<\/item>/g) || [];

      for (const itemXml of itemMatches.slice(0, 15)) {
        const titleMatch = itemXml.match(/<title><!\[CDATA\[([^\]]+)\]\]><\/title>|<title>([^<]+)<\/title>/);
        const title = titleMatch ? decodeHTMLEntities(titleMatch[1] || titleMatch[2]) : '';

        const descMatch = itemXml.match(/<description><!\[CDATA\[([^\]]+)\]\]><\/description>|<description>([^<]+)<\/description>/);
        const description = descMatch ? stripHTML(descMatch[1] || descMatch[2]) : '';

        const contentMatch = itemXml.match(/<content:encoded><!\[CDATA\[([^\]]+)\]\]><\/content:encoded>/);
        const content = contentMatch ? stripHTML(contentMatch[1]) : description;

        const linkMatch = itemXml.match(/<link>([^<]+)<\/link>/);
        const link = linkMatch ? linkMatch[1] : '';

        const pubDateMatch = itemXml.match(/<pubDate>([^<]+)<\/pubDate>/);
        const pubDate = pubDateMatch ? pubDateMatch[1] : new Date().toISOString();

        const isWorldNews = feed.category === 'world';
        const imageUrl = extractImageFromContent(itemXml, description, feed.source, isWorldNews);
        const upgradedImageUrl = upgradeImageQuality(imageUrl, feed.source);

        if (title && link) {
          articles.push({
            id: `${feed.source}-${Date.now()}-${Math.random()}`,
            title: title.trim(),
            summary: decodeHTMLEntities(description).substring(0, 500).trim(),
            content: decodeHTMLEntities(content).substring(0, 1000).trim(),
            source: feed.source,
            sourceId: feed.source.toLowerCase().replace(/\s+/g, '-'),
            sourceName: feed.source,
            sourceLogo: '',
            author: 'Staff Writer',
            category: feed.category,
            imageUrl: upgradedImageUrl || '',
            url: link.trim(),
            publishedAt: new Date(pubDate),
            readTime: calculateReadTime(content || description),
            isTrending: false,
            location: 'General'
          });
        }
      }
    }

    console.log(`✓ Successfully fetched ${articles.length} articles from ${feed.source}`);
    return articles;
  } catch (error) {
    console.error(`✗ Error fetching ${feed.source}:`, error instanceof Error ? error.message : 'Unknown error');
    return [];
  }
}

async function processFeedsInBatches(feeds: RSSFeed[], _batchSize = 10): Promise<Article[]> {
  console.log(`⚡ Fetching ALL ${feeds.length} feeds simultaneously (no batching for speed)...`);

  // Fetch all feeds at once with 8 second timeout
  const results = await Promise.allSettled(
    feeds.map(feed => parseRSSFeedWithTimeout(feed, 8000))
  );

  const allArticles: Article[] = [];
  let successCount = 0;
  let failCount = 0;

  results.forEach(result => {
    if (result.status === 'fulfilled' && result.value && result.value.length > 0) {
      allArticles.push(...result.value);
      successCount++;
    } else {
      failCount++;
    }
  });

  console.log(`✅ Fetched ${allArticles.length} articles from ${successCount}/${feeds.length} sources (${failCount} failed)`);

  return allArticles;
}

async function parseRSSFeedWithTimeout(feed: RSSFeed, timeout: number): Promise<Article[]> {
  return new Promise((resolve, _reject) => {
    const timer = setTimeout(() => {
      console.warn(`⏱️ Timeout: ${feed.source} (${timeout}ms)`);
      resolve([]);
    }, timeout);

    parseRSSFeed(feed)
      .then(articles => {
        clearTimeout(timer);
        resolve(articles);
      })
      .catch(error => {
        clearTimeout(timer);
        console.error(`❌ Error from ${feed.source}:`, error.message);
        resolve([]);
      });
  });
}

async function loadCustomSources(category?: TopicCategory): Promise<RSSFeed[]> {
  if (!supabaseEnabled || !supabase) {
    console.log('⚠️ Supabase not available - skipping custom sources');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('custom_sources')
      .select('*')
      .eq('enabled', true);

    if (error) {
      console.error('Error loading custom sources:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log('No custom sources found');
      return [];
    }

    const customFeeds: RSSFeed[] = data.map(source => ({
      url: source.url,
      source: source.name,
      category: source.category as TopicCategory
    }));

    if (category && category !== 'all') {
      const filtered = customFeeds.filter(feed => {
        const matches = feed.category.toLowerCase() === category.toLowerCase();
        if (matches) {
          console.log(`✓ Custom source "${feed.source}" matches category: ${category}`);
        }
        return matches;
      });
      console.log(`📂 Found ${filtered.length} custom sources for category: ${category}`);
      return filtered;
    }

    console.log(`📂 Loaded ${customFeeds.length} custom sources (all categories)`);
    return customFeeds;
  } catch (error) {
    console.error('Failed to load custom sources:', error);
    return [];
  }
}

function getDefaultFeedsForCategory(category?: TopicCategory): RSSFeed[] {
  if (!category || category === 'all') {
    return RSS_FEEDS;
  }

  const categoryKey = category.toLowerCase();
  const defaultSources = getSourcesForCategory(categoryKey);

  if (defaultSources.length > 0) {
    console.log(`📦 Using ${defaultSources.length} default sources for ${category}`);
    return defaultSources.map((url, _index) => {
      const sourceName = new URL(url).hostname.replace('www.', '').split('.')[0];
      return {
        url,
        source: sourceName.charAt(0).toUpperCase() + sourceName.slice(1),
        category: category
      };
    });
  }

  const builtInFeeds = RSS_FEEDS.filter(feed =>
    feed.category.toLowerCase() === categoryKey
  );

  console.log(`📚 Using ${builtInFeeds.length} built-in RSS feeds for ${category}`);
  return builtInFeeds;
}

export async function fetchRSSFeeds(category?: TopicCategory): Promise<Article[]> {
  console.log(`📰 Fetching feeds for ${category || 'all categories'}...`);

  const defaultFeeds = getDefaultFeedsForCategory(category);
  const customFeeds = await loadCustomSources(category);

  const allFeeds = [...defaultFeeds, ...customFeeds];

  console.log(`📊 Total feeds to fetch: ${allFeeds.length} (${defaultFeeds.length} default + ${customFeeds.length} custom)`);

  if (allFeeds.length === 0) {
    console.log('❌ No feeds found for category:', category);
    return [];
  }

  const articles = await processFeedsInBatches(allFeeds, 10);

  const sortedArticles = articles.sort((a, b) =>
    b.publishedAt.getTime() - a.publishedAt.getTime()
  );

  console.log(`✅ Total articles fetched: ${sortedArticles.length}`);
  return sortedArticles;
}

export { RSS_FEEDS };
