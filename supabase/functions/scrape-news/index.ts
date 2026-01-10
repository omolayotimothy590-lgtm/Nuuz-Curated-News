import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface NewsAPIArticle { title: string; description: string; content: string; url: string; urlToImage: string; publishedAt: string; source: { name: string; }; }
interface RSSItem { title: string; description: string; link: string; pubDate: string; enclosure?: { url: string }; }

const RSS_FEEDS = [
  { url: "https://techcrunch.com/feed/", source: "TechCrunch", category: "tech" },
  { url: "https://www.theverge.com/rss/index.xml", source: "The Verge", category: "tech" },
  { url: "https://www.wired.com/feed/rss", source: "Wired", category: "tech" },
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml", source: "NY Times Tech", category: "tech" },
  { url: "https://www.theguardian.com/uk/technology/rss", source: "The Guardian Tech", category: "tech" },
  { url: "https://www.cnet.com/rss/news/", source: "CNET", category: "tech" },
  { url: "https://www.engadget.com/rss.xml", source: "Engadget", category: "tech" },
  { url: "https://feeds.arstechnica.com/arstechnica/index", source: "Ars Technica", category: "tech" },
  { url: "https://www.zdnet.com/news/rss.xml", source: "ZDNet", category: "tech" },
  { url: "https://www.technologyreview.com/feed/", source: "MIT Technology Review", category: "tech" },
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml", source: "NY Times Business", category: "business" },
  { url: "https://www.cnbc.com/id/100003114/device/rss/rss.html", source: "CNBC", category: "business" },
  { url: "https://feeds.a.dj.com/rss/RSSMarketsMain.xml", source: "Wall Street Journal", category: "business" },
  { url: "https://www.forbes.com/business/feed/", source: "Forbes", category: "business" },
  { url: "https://www.businessinsider.com/rss", source: "Business Insider", category: "business" },
  { url: "https://www.marketwatch.com/rss/topstories", source: "MarketWatch", category: "business" },
  { url: "https://www.economist.com/latest/rss.xml", source: "The Economist", category: "business" },
  { url: "https://hbr.org/feed", source: "Harvard Business Review", category: "business" },
  { url: "https://kotaku.com/rss", source: "Kotaku", category: "gaming" },
  { url: "https://www.nintendolife.com/feeds/latest", source: "Nintendo Life", category: "gaming" },
  { url: "https://www.polygon.com/rss/index.xml", source: "Polygon", category: "gaming" },
  { url: "https://www.rockpapershotgun.com/feed", source: "Rock Paper Shotgun", category: "gaming" },
  { url: "https://www.vg247.com/feed", source: "VG247", category: "gaming" },
  { url: "https://www.gamespot.com/feeds/mashup/", source: "GameSpot", category: "gaming" },
  { url: "https://www.ign.com/articles?tags=news&format=rss", source: "IGN", category: "gaming" },
  { url: "https://www.pcgamer.com/rss/", source: "PC Gamer", category: "gaming" },
  { url: "https://www.eurogamer.net/?format=rss", source: "Eurogamer", category: "gaming" },
  { url: "https://www.destructoid.com/feed/", source: "Destructoid", category: "gaming" },
  { url: "https://www.gamesradar.com/all-platforms/news/feed/", source: "GamesRadar", category: "gaming" },
  { url: "https://www.espn.com/espn/rss/news", source: "ESPN", category: "sports" },
  { url: "https://www.espn.com/espn/rss/nfl/news", source: "ESPN NFL", category: "sports" },
  { url: "https://www.espn.com/espn/rss/nba/news", source: "ESPN NBA", category: "sports" },
  { url: "https://www.espn.com/espn/rss/mlb/news", source: "ESPN MLB", category: "sports" },
  { url: "https://www.espn.com/espn/rss/soccer/news", source: "ESPN Soccer", category: "sports" },
  { url: "https://www.cbssports.com/rss/headlines", source: "CBS Sports", category: "sports" },
  { url: "https://www.si.com/rss/si_topstories.rss", source: "Sports Illustrated", category: "sports" },
  { url: "https://sports.yahoo.com/rss/", source: "Yahoo Sports", category: "sports" },
  { url: "https://feeds.bbci.co.uk/sport/rss.xml", source: "BBC Sport", category: "sports" },
  { url: "https://bleacherreport.com/articles/feed", source: "Bleacher Report", category: "sports" },
  { url: "https://www.foxsports.com/rss", source: "FOX Sports", category: "sports" },
  { url: "https://www.skysports.com/rss/12040", source: "Sky Sports", category: "sports" },
  { url: "https://theathletic.com/feed/", source: "The Athletic", category: "sports" },
  { url: "https://www.espn.com/espn/rss/racing/news", source: "ESPN Racing", category: "sports" },
  { url: "https://www.autosport.com/rss/feed/all", source: "Autosport", category: "sports" },
  { url: "https://www.motorsport.com/rss/f1/news/", source: "Motorsport.com", category: "sports" },
  { url: "https://www.skysports.com/rss/12433", source: "Sky Sports F1", category: "sports" },
  { url: "https://the-race.com/feed/", source: "The Race", category: "sports" },
  { url: "https://variety.com/feed/", source: "Variety", category: "entertainment" },
  { url: "https://www.rollingstone.com/music/music-news/feed/", source: "Rolling Stone", category: "entertainment" },
  { url: "https://www.billboard.com/feed/", source: "Billboard", category: "entertainment" },
  { url: "https://deadline.com/feed/", source: "Deadline", category: "entertainment" },
  { url: "https://www.hollywoodreporter.com/feed/", source: "Hollywood Reporter", category: "entertainment" },
  { url: "https://ew.com/feed/", source: "Entertainment Weekly", category: "entertainment" },
  { url: "https://www.who.int/feeds/entity/mediacentre/news/en/rss.xml", source: "WHO News", category: "health" },
  { url: "https://www.healthline.com/rss", source: "Healthline", category: "health" },
  { url: "https://www.medicalnewstoday.com/rss", source: "Medical News Today", category: "health" },
  { url: "https://rssfeeds.webmd.com/rss/rss.aspx?RSSSource=RSS_PUBLIC", source: "WebMD", category: "health" },
  { url: "https://www.health.harvard.edu/blog/feed", source: "Harvard Health Blog", category: "health" },
  { url: "https://newsnetwork.mayoclinic.org/feed/", source: "Mayo Clinic", category: "health" },
  { url: "https://www.england.nhs.uk/feed/", source: "NHS News", category: "health" },
  { url: "https://www.psychologytoday.com/us/rss", source: "Psychology Today", category: "health" },
  { url: "https://www.everydayhealth.com/rss/all.aspx", source: "Everyday Health", category: "health" },
  { url: "https://www.medscape.com/rss/siteupdates.xml", source: "Medscape", category: "health" },
  { url: "https://cryptonews.com/news/feed/", source: "CryptoNews", category: "crypto" },
  { url: "https://www.coindesk.com/arc/outboundfeeds/rss/", source: "CoinDesk", category: "crypto" },
  { url: "https://cointelegraph.com/rss", source: "Cointelegraph", category: "crypto" },
  { url: "https://decrypt.co/feed", source: "Decrypt", category: "crypto" },
  { url: "https://www.lonelyplanet.com/blog.rss", source: "Lonely Planet", category: "travel" },
  { url: "https://www.cntraveler.com/feed/rss", source: "Condé Nast Traveler", category: "travel" },
  { url: "https://www.travelandleisure.com/rss", source: "Travel + Leisure", category: "travel" },
  { url: "https://www.nomadicmatt.com/feed/", source: "Nomadic Matt", category: "travel" },
  { url: "https://thepointsguy.com/feed/", source: "The Points Guy", category: "travel" },
  { url: "https://theculturetrip.com/feed/", source: "Culture Trip", category: "travel" },
  { url: "https://www.luxurytravelmagazine.com/rss", source: "Luxury Travel Magazine", category: "travel" },
  { url: "https://www.smartertravel.com/rss/", source: "Smarter Travel", category: "travel" },
  { url: "https://www.adventure-journal.com/feed/", source: "Adventure Journal", category: "travel" },
  { url: "https://www.nationalgeographic.com/content/nationalgeographic/en_us/travel/rss", source: "National Geographic Travel", category: "travel" },
  { url: "https://feeds.bbci.co.uk/news/rss.xml", source: "BBC News", category: "world" },
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", source: "NY Times World", category: "world" },
];

const CATEGORIES_MAP: Record<string, string> = { technology: "tech", tech: "tech", gaming: "gaming", politics: "politics", sports: "sports", business: "business", health: "health", entertainment: "entertainment", world: "world", general: "general", crypto: "crypto", cryptocurrency: "crypto", travel: "travel" };

function decodeHTMLEntities(text: string): string { return text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&apos;/g, "'"); }

function extractHighQualityImageUrl(url: string | null): string | null {
  if (!url) return null; const decoded = decodeHTMLEntities(url);
  try {
    const urlObj = new URL(decoded);
    if (urlObj.hostname.includes('cnet.com')) { urlObj.searchParams.delete('auto'); urlObj.searchParams.delete('fit'); urlObj.searchParams.delete('height'); urlObj.searchParams.delete('width'); const pathParts = urlObj.pathname.split('/'); const resizeIndex = pathParts.indexOf('resize'); if (resizeIndex !== -1 && resizeIndex > 0) { pathParts.splice(resizeIndex, 1); urlObj.pathname = pathParts.join('/'); } return urlObj.toString(); }
    if (urlObj.hostname.includes('nytimes.com')) { urlObj.searchParams.set('quality', '100'); urlObj.searchParams.set('w', '2000'); return urlObj.toString(); }
    if (urlObj.hostname.includes('theverge.com') || urlObj.hostname.includes('polygon.com')) { urlObj.searchParams.set('quality', '90'); urlObj.searchParams.delete('width'); urlObj.searchParams.delete('height'); return urlObj.toString(); }
    return decoded;
  } catch (e) { return decoded; }
}

function extractImageFromRSSItem(itemXml: string, description: string, content: string): string | null {
  let imageUrl: string | null = null; const mediaContentMatches = itemXml.match(/<media:content[^>]*>/gi) || [];
  if (mediaContentMatches.length > 0) { let maxWidth = 0; let bestUrl = null; for (const mediaTag of mediaContentMatches) { const urlMatch = mediaTag.match(/url=["']([^"']+)["']/i); const widthMatch = mediaTag.match(/width=["'](\d+)["']/i); const mediumMatch = mediaTag.match(/medium=["']([^"']+)["']/i); if (mediumMatch && mediumMatch[1] !== 'image') continue; if (urlMatch) { const url = decodeHTMLEntities(urlMatch[1]); const width = widthMatch ? parseInt(widthMatch[1]) : 0; if (width > maxWidth || !bestUrl) { maxWidth = width; bestUrl = url; } } } if (bestUrl && (bestUrl.startsWith('http://') || bestUrl.startsWith('https://'))) return bestUrl; }
  const mediaThumbnailMatch = itemXml.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i); if (mediaThumbnailMatch && mediaThumbnailMatch[1]) { imageUrl = decodeHTMLEntities(mediaThumbnailMatch[1]); if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl; }
  const enclosureMatch = itemXml.match(/<enclosure[^>]*>/i); if (enclosureMatch) { const typeMatch = enclosureMatch[0].match(/type=["']([^"']+)["']/i); const urlMatch = enclosureMatch[0].match(/url=["']([^"']+)["']/i); if (urlMatch && (!typeMatch || typeMatch[1].startsWith('image/'))) { imageUrl = decodeHTMLEntities(urlMatch[1]); if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl; } }
  const htmlContent = content || description; if (htmlContent) { const imgPatterns = [/<figure[^>]*>\s*<img[^>]+src=["']([^"']+)["']/i, /<div[^>]*>\s*<figure[^>]*>\s*<div[^>]*>\s*<img[^>]+src=["']([^"']+)["']/i, /<img[^>]+src=["']([^"']+)["']/i, /<img[^>]+src=([^\s>]+)/i]; for (const pattern of imgPatterns) { const imgMatch = htmlContent.match(pattern); if (imgMatch && imgMatch[1]) { imageUrl = decodeHTMLEntities(imgMatch[1]); if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl; } } }
  const customImagePatterns = [/<image[^>]*>([^<]+)<\/image>/i, /<thumbnail[^>]*>([^<]+)<\/thumbnail>/i, /<featuredImage[^>]*>([^<]+)<\/featuredImage>/i, /<og:image[^>]*>([^<]+)<\/og:image>/i, /<image[^>]+url=["']([^"']+)["']/i, /<thumbnail[^>]+url=["']([^"']+)["']/i];
  for (const pattern of customImagePatterns) { const match = itemXml.match(pattern); if (match && match[1]) { imageUrl = decodeHTMLEntities(match[1]); if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl; } }
  return null;
}

function calculateReadTime(text: string): number { const words = text.split(/\s+/).length; return Math.max(1, Math.ceil(words / 225)); }

const BLOCKED_SOURCES_FROM_GAMING = ['ny times', 'new york times', 'yahoo sports', 'espn', 'cbs sports', 'fox sports', 'nbc sports', 'sports illustrated', 'bleacher report', 'bbc sport', 'sky sports', 'the athletic', 'reuters', 'bloomberg', 'cnbc', 'forbes', 'wall street journal', 'washington post', 'cnn', 'bbc news', 'deadline', 'variety', 'hollywood reporter'];
const CATEGORY_SOURCE_WHITELIST: Record<string, string[]> = { tech: ['techcrunch', 'wired', 'the verge', 'ars technica', 'engadget', 'cnet', 'zdnet', 'mit technology review', 'mashable', 'gizmodo', 'ny times tech', 'the guardian tech', 'venturebeat', 'techmeme'], gaming: ['kotaku', 'nintendo life', 'polygon', 'rock paper shotgun', 'vg247', 'gamespot', 'ign', 'pc gamer', 'eurogamer', 'destructoid', 'gamesradar', 'game informer', 'gamerant', 'xbox news', 'reddit gaming'], business: ['bloomberg', 'forbes', 'cnbc', 'wall street journal', 'marketwatch', 'the economist', 'harvard business review', 'business insider', 'ny times business', 'financial times'], sports: ['espn', 'bbc sport', 'sky sports', 'sports illustrated', 'yahoo sports', 'fox sports', 'cbs sports', 'bleacher report', 'the athletic', 'nfl', 'nba', 'mlb', 'nhl', 'soccer', 'autosport', 'motorsport', 'racing', 'the race', 'f1'], entertainment: ['variety', 'rolling stone', 'billboard', 'deadline', 'hollywood reporter', 'entertainment weekly', 'imdb', 'mtv'], health: ['who news', 'healthline', 'medical news today', 'webmd', 'harvard health', 'mayo clinic', 'nhs news', 'psychology today', 'everyday health', 'medscape'], crypto: ['cryptonews', 'coindesk', 'cointelegraph', 'decrypt', 'the block'], travel: ['lonely planet', 'condé nast traveler', 'conde nast', 'travel + leisure', 'nomadic matt', 'the points guy', 'culture trip', 'luxury travel magazine', 'smarter travel', 'adventure journal', 'national geographic'] };

function isBlockedFromGaming(source: string): boolean { const lowerSource = source.toLowerCase(); return BLOCKED_SOURCES_FROM_GAMING.some(blocked => lowerSource.includes(blocked)); }
function isSourceAllowedForCategory(source: string, category: string): boolean { if (category === 'gaming' && isBlockedFromGaming(source)) return false; const whitelist = CATEGORY_SOURCE_WHITELIST[category]; if (!whitelist) return true; const lowerSource = source.toLowerCase(); return whitelist.some(allowed => lowerSource.includes(allowed)); }
function getCorrectCategoryForSource(source: string): string | null { const lowerSource = source.toLowerCase(); for (const [category, sources] of Object.entries(CATEGORY_SOURCE_WHITELIST)) { if (sources.some(allowed => lowerSource.includes(allowed))) return category; } return null; }
function isActuallyGamingContent(title: string, description: string): boolean { const text = `${title} ${description}`.toLowerCase(); const nonGamingIndicators = ['tariff', 'trade war', 'trade controls', 'trade deal', 'u.s.', 'china', 'politics', 'election', 'government', 'policy', 'economy', 'market', 'stock', 'wall street', 'congress', 'senate', 'president', 'game of chicken', 'played games', 'power game', 'end game', 'waiting game', 'blame game', 'long game', 'sports team', 'football', 'basketball', 'baseball', 'soccer', 'nfl', 'nba', 'mlb', 'nhl']; if (nonGamingIndicators.some(indicator => text.includes(indicator))) return false; const gamingIndicators = ['video game', 'playstation', 'xbox', 'nintendo', 'steam', 'pc gaming', 'console', 'gamer', 'gameplay', 'multiplayer', 'single-player', 'fps', 'rpg', 'mmorpg', 'esports', 'twitch', 'streamer', 'dlc', 'patch', 'game developer', 'game studio', 'character', 'level', 'quest']; const gamingCount = gamingIndicators.filter(indicator => text.includes(indicator)).length; return gamingCount >= 2; }
function verifyCategoryWithKeywords(title: string, description: string): Record<string, number> { const text = `${title} ${description}`.toLowerCase(); const categoryKeywords = { crypto: ['crypto', 'bitcoin', 'ethereum', 'blockchain', 'cryptocurrency', 'defi', 'nft', 'coin', 'token', 'btc', 'eth', 'web3', 'altcoin', 'binance', 'coinbase'], gaming: ['video game', 'playstation', 'xbox', 'nintendo', 'steam', 'console', 'esports', 'rpg', 'fps', 'mmorpg', 'pc gaming', 'gamer'], tech: ['technology', 'software', 'hardware', 'ai', 'artificial intelligence', 'robot', 'computer', 'app', 'smartphone', 'internet', 'cyber', 'digital', 'startup', 'tech company', 'silicon valley', 'coding', 'programming', 'developer'], politics: ['politics', 'government', 'election', 'president', 'congress', 'senate', 'law', 'policy', 'vote', 'campaign', 'trump', 'biden', 'republican', 'democrat', 'governor', 'mayor', 'white house'], sports: ['sports', 'match', 'team', 'player', 'score', 'championship', 'tournament', 'league', 'coach', 'athlete', 'nfl', 'nba', 'mlb', 'football', 'basketball', 'baseball', 'soccer', 'f1', 'formula 1', 'grand prix', 'racing', 'verstappen', 'hamilton', 'ferrari', 'red bull', 'mclaren', 'mercedes'], business: ['business', 'economy', 'market', 'stock', 'finance', 'investment', 'trade', 'tariff', 'company', 'corporate', 'ceo', 'earnings', 'revenue', 'profit', 'merger', 'acquisition', 'wall street'], health: ['health', 'medical', 'disease', 'doctor', 'hospital', 'patient', 'treatment', 'medicine', 'vaccine', 'virus', 'mental health', 'wellness', 'fitness', 'nutrition'], entertainment: ['movie', 'film', 'music', 'celebrity', 'actor', 'actress', 'singer', 'concert', 'album', 'show', 'entertainment', 'hollywood', 'netflix', 'streaming'], travel: ['travel', 'tourism', 'vacation', 'destination', 'hotel', 'flight', 'trip', 'tourist', 'journey', 'adventure', 'resort', 'cruise'], world: ['international', 'global', 'world', 'foreign', 'country', 'nation', 'embassy', 'diplomat'] }; const scores: Record<string, number> = {}; for (const [category, keywords] of Object.entries(categoryKeywords)) { scores[category] = keywords.filter(keyword => text.includes(keyword)).length; } return scores; }
function isPoliticalContent(title: string, description: string): boolean { const text = `${title} ${description}`.toLowerCase(); const politicalKeywords = ['trump', 'biden', 'president', 'white house', 'congress', 'senate', 'republican', 'democrat', 'election', 'vote', 'campaign', 'governor', 'mayor', 'legislation', 'bill']; const politicalCount = politicalKeywords.filter(keyword => text.includes(keyword)).length; return politicalCount >= 3; }
function resolveCategoryConflicts(scores: Record<string, number>, feedCategory: string): string { if (scores.gaming > 0 && scores.tech > 0 && scores.gaming >= scores.tech) return 'gaming'; if (scores.crypto > 0 && scores.business > 0 && scores.crypto >= 2) return 'crypto'; if (scores.sports > 0 && scores.entertainment > 0 && scores.sports >= scores.entertainment) return 'sports'; if (scores.tech > 0 && scores.business > 0 && scores.tech >= scores.business) return 'tech'; const topCategories = Object.entries(scores).filter(([_, score]) => score > 0).sort((a, b) => b[1] - a[1]); if (topCategories.length > 0 && topCategories[0][1] >= 2) return topCategories[0][0]; return feedCategory; }
function verifyAndCorrectCategory(title: string, description: string, assignedCategory: string, source: string): string { if (!isSourceAllowedForCategory(source, assignedCategory)) { const correctCategory = getCorrectCategoryForSource(source); if (correctCategory) return correctCategory; const text = `${title} ${description}`.toLowerCase(); if (text.includes('tariff') || text.includes('trade')) return 'business'; if (text.includes('team') || text.includes('player') || text.includes('nfl') || text.includes('nba')) return 'sports'; return 'general'; } if (assignedCategory === 'gaming') { if (!isActuallyGamingContent(title, description)) { const scores = verifyCategoryWithKeywords(title, description); const bestCategory = Object.entries(scores).filter(([cat]) => cat !== 'gaming').sort((a, b) => b[1] - a[1])[0]; if (bestCategory && bestCategory[1] >= 2) return bestCategory[0]; return 'tech'; } } if (isPoliticalContent(title, description)) return 'politics'; const scores = verifyCategoryWithKeywords(title, description); if (scores[assignedCategory] === 0) { const resolvedCategory = resolveCategoryConflicts(scores, assignedCategory); if (resolvedCategory !== assignedCategory && scores[resolvedCategory] >= 2) return resolvedCategory; } return assignedCategory; }

async function fetchNewsAPI(apiKey: string, category?: string): Promise<any[]> { try { const url = category ? `https://newsapi.org/v2/top-headlines?category=${category}&language=en&pageSize=20&apiKey=${apiKey}` : `https://newsapi.org/v2/top-headlines?country=us&pageSize=20&apiKey=${apiKey}`; const response = await fetch(url); if (!response.ok) throw new Error(`NewsAPI error: ${response.status}`); const data = await response.json(); return (data.articles || []).map((article: NewsAPIArticle) => { const title = decodeHTMLEntities(article.title); const description = decodeHTMLEntities(article.description || ""); const sourceName = article.source.name; const assignedCategory = CATEGORIES_MAP[category || "general"] || "general"; const verifiedCategory = verifyAndCorrectCategory(title, description, assignedCategory, sourceName); return { title, summary: description, full_content: decodeHTMLEntities(article.content || article.description || ""), source: sourceName, source_logo: null, category: verifiedCategory, image_url: extractHighQualityImageUrl(article.urlToImage), article_url: article.url, published_at: new Date(article.publishedAt).toISOString(), read_time: calculateReadTime(article.content || article.description || "") }; }); } catch (error) { console.error("NewsAPI fetch error:", error); return []; } }

async function parseRSSFeed(feedUrl: string, source: string, category: string, skipCategoryVerification = false): Promise<any[]> { try { const response = await fetch(feedUrl); if (!response.ok) throw new Error(`RSS fetch error: ${response.status}`); const xml = await response.text(); const items: any[] = []; const itemMatches = xml.match(/<item[^>]*>([\s\S]*?)<\/item>/g) || []; const limit = category === 'sports' ? 25 : 15; for (const itemXml of itemMatches.slice(0, limit)) { const titleMatch = itemXml.match(/<title><!\[CDATA\[([^\]]+)\]\]><\/title>|<title>([^<]+)<\/title>/); const title = decodeHTMLEntities(titleMatch?.[1] || titleMatch?.[2] || ""); const descMatch = itemXml.match(/<description><!\[CDATA\[([^\]]+)\]\]><\/description>|<description>([^<]+)<\/description>/); const description = descMatch?.[1] || descMatch?.[2] || ""; const contentMatch = itemXml.match(/<content:encoded><!\[CDATA\[([^\]]+)\]\]><\/content:encoded>/); const fullContent = contentMatch?.[1] || description; const link = itemXml.match(/<link>([^<]+)<\/link>/)?.[1] || ""; const pubDate = itemXml.match(/<pubDate>([^<]+)<\/pubDate>/)?.[1] || new Date().toISOString(); const imageUrl = extractImageFromRSSItem(itemXml, description, fullContent); if (title && link) { const cleanDescription = decodeHTMLEntities(description.replace(/<[^>]+>/g, "")).substring(0, 500); const verifiedCategory = skipCategoryVerification ? category : verifyAndCorrectCategory(title.trim(), cleanDescription.trim(), category, source); items.push({ title: title.trim(), summary: cleanDescription.trim(), full_content: cleanDescription.trim(), source, source_logo: null, category: verifiedCategory, image_url: extractHighQualityImageUrl(imageUrl), article_url: link.trim(), published_at: new Date(pubDate).toISOString(), read_time: calculateReadTime(cleanDescription) }); } } return items; } catch (error) { console.error(`RSS parse error for ${source}:`, error); return []; } }

Deno.serve(async (req: Request) => { if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders }); try { const supabaseUrl = Deno.env.get("SUPABASE_URL")!; const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!; const newsApiKey = Deno.env.get("NEWSAPI_KEY"); const supabase = createClient(supabaseUrl, supabaseServiceKey); const allArticles: any[] = []; if (newsApiKey) { const categories = ["technology", "business", "sports", "entertainment", "health"]; for (const category of categories) { const articles = await fetchNewsAPI(newsApiKey, category); allArticles.push(...articles); } } for (const feed of RSS_FEEDS) { const articles = await parseRSSFeed(feed.url, feed.source, feed.category); allArticles.push(...articles); } const { data: customSources, error: customSourcesError } = await supabase.from('custom_sources').select('*').eq('enabled', true); if (customSourcesError) { console.error('Error fetching custom sources:', customSourcesError); } else if (customSources && customSources.length > 0) { console.log(`Fetching articles from ${customSources.length} custom sources`); for (const source of customSources) { try { const articles = await parseRSSFeed(source.url, source.name, source.category, true); console.log(`Fetched ${articles.length} articles from ${source.name} (category: ${source.category})`); allArticles.push(...articles); } catch (error) { console.error(`Error parsing custom source ${source.name}:`, error); } } } let inserted = 0, skipped = 0; for (const article of allArticles) { const { error } = await supabase.from("articles").upsert(article, { onConflict: "article_url", ignoreDuplicates: true }); if (error) { if (error.code === "23505") skipped++; else console.error("Insert error:", error); } else inserted++; } return new Response(JSON.stringify({ success: true, message: `Scraped ${allArticles.length} articles, inserted ${inserted}, skipped ${skipped} duplicates`, inserted, skipped }), { headers: { ...corsHeaders, "Content-Type": "application/json" } }); } catch (error) { console.error("Scrape error:", error); return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }); } });