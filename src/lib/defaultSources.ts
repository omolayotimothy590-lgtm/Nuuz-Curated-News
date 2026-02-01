import { CategoryType } from '../types';

export const CATEGORY_SOURCES: Record<CategoryType | string, string[]> = {
  news: [
    "https://feeds.bbci.co.uk/news/rss.xml",
    "http://rss.cnn.com/rss/edition.rss",
    "http://feeds.reuters.com/Reuters/worldNews",
    "https://www.theguardian.com/world/rss",
    "https://www.aljazeera.com/xml/rss/all.xml",
    "https://apnews.com/rss",
    "https://feeds.npr.org/1001/rss.xml",
    "https://rss.dw.com/rdf/rss-en-all"
  ],
  world: [
    "http://feeds.reuters.com/Reuters/worldNews",
    "https://feeds.bbci.co.uk/news/world/rss.xml",
    "https://www.theguardian.com/world/rss",
    "https://www.aljazeera.com/xml/rss/all.xml",
    "http://rss.cnn.com/rss/edition_world.rss",
    "https://apnews.com/world-news.rss",
    "https://rss.dw.com/rdf/rss-en-all",
    "https://feeds.npr.org/1004/rss.xml",
    "https://www.france24.com/en/rss",
    "https://www.cnbc.com/id/100727362/device/rss/rss.html"
  ],
  tech: [
    "http://feeds.feedburner.com/TechCrunch/",
    "https://www.wired.com/feed/rss",
    "https://www.theverge.com/rss/index.xml",
    "http://feeds.arstechnica.com/arstechnica/index/",
    "http://feeds.mashable.com/Mashable",
    "https://news.ycombinator.com/rss",
    "https://www.engadget.com/rss.xml"
  ],
  business: [
    "https://www.bloomberg.com/feed/podcast/etf-report.xml",
    "https://www.forbes.com/business/feed/",
    "https://www.cnbc.com/id/100003114/device/rss/rss.html",
    "https://www.economist.com/latest/rss.xml",
    "https://hbr.org/feed",
    "https://www.marketwatch.com/rss/topstories",
    "https://www.businessinsider.com/rss"
  ],
  sports: [
    "https://www.espn.com/espn/rss/news",
    "https://feeds.bbci.co.uk/sport/rss.xml",
    "https://www.skysports.com/rss/12040",
    "https://www.si.com/rss/si_topstories.rss",
    "https://www.formula1.com/rss/news/headlines.rss"
  ],
  entertainment: [
    "https://variety.com/feed/",
    "https://www.rollingstone.com/music/music-news/feed/",
    "https://www.billboard.com/feed/",
    "https://www.imdb.com/news/feed",
    "https://www.eonline.com/syndication/feeds/rssfeeds/topstories",
    "https://deadline.com/feed/"
  ],
  health: [
    "https://www.who.int/feeds/entity/mediacentre/news/en/rss.xml",
    "https://www.healthline.com/rss",
    "https://www.medicalnewstoday.com/rss",
    "https://rssfeeds.webmd.com/rss/rss.aspx?RSSSource=RSS_PUBLIC",
    "https://www.health.harvard.edu/blog/feed",
    "https://newsnetwork.mayoclinic.org/feed/"
  ],
  travel: [
    "https://www.lonelyplanet.com/blog.rss",
    "https://www.cntraveler.com/feed/rss",
    "https://www.travelandleisure.com/rss",
    "https://www.nomadicmatt.com/feed/",
    "https://thepointsguy.com/feed/"
  ],
  crypto: [
    "https://www.coindesk.com/arc/outboundfeeds/rss/",
    "https://ambcrypto.com/rss-eng/",
    "https://cointelegraph.com/rss",
    "https://bitcoinist.com/feed",
    "https://cryptopotato.com/feed/"
  ],
  gaming: [
    "https://www.ign.com/news",
    "https://kotaku.com/",
    "https://www.gameinformer.com/news",
    "https://www.gamesradar.com/",
    "https://www.theverge.com/games"
  ],
  politics: [
    "https://www.thenation.com/subject/politics/feed/",
    "https://www.propublica.org/feeds/propublica/main",
    "https://apnews.com/politics.rss",
    "https://feeds.npr.org/1014/rss.xml",
    "https://www.politico.com/rss/politicopicks.xml"
  ],
};

export function getSourcesForCategory(category: CategoryType | string): string[] {
  const categoryKey = category.toLowerCase();
  return CATEGORY_SOURCES[categoryKey] || [];
}

export function hasDefaultSources(category: CategoryType | string): boolean {
  return Boolean(CATEGORY_SOURCES[category]?.length);
}
