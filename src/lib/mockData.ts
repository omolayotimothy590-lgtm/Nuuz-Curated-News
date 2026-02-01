import { Article, NewsSource } from '../types';

export const mockSources: NewsSource[] = [
  {
    id: '1',
    name: 'TechCrunch',
    slug: 'techcrunch',
    logoUrl: 'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=100',
    description: 'Technology and startup news',
    websiteUrl: 'https://techcrunch.com'
  },
  {
    id: '2',
    name: 'BBC News',
    slug: 'bbc-news',
    logoUrl: 'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=100',
    description: 'Global news coverage',
    websiteUrl: 'https://bbc.com/news'
  },
  {
    id: '3',
    name: 'The Guardian',
    slug: 'the-guardian',
    logoUrl: 'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=100',
    description: 'Independent journalism',
    websiteUrl: 'https://theguardian.com'
  },
  {
    id: '4',
    name: 'Reuters',
    slug: 'reuters',
    logoUrl: 'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=100',
    description: 'International news agency',
    websiteUrl: 'https://reuters.com'
  }
];

export const mockArticles: Article[] = [
  {
    id: '1',
    sourceId: '1',
    sourceName: 'TechCrunch',
    title: 'AI Startup Raises $500M in Series C Funding Round',
    summary: 'A leading artificial intelligence company has secured $500 million in funding from top venture capital firms. The company plans to use the funds to expand its AI research team and develop next-generation language models.',
    content: 'Full article content about AI startup funding...',
    url: 'https://example.com/article-1',
    imageUrl: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=800',
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    category: 'technology'
  },
  {
    id: '2',
    sourceId: '2',
    sourceName: 'BBC News',
    title: 'Climate Summit Reaches Historic Agreement on Emissions',
    summary: 'World leaders have signed a landmark agreement to reduce carbon emissions by 50% by 2035. The accord includes binding commitments from major economies and establishes a global carbon trading system.',
    content: 'Full article content about climate agreement...',
    url: 'https://example.com/article-2',
    imageUrl: 'https://images.pexels.com/photos/1268076/pexels-photo-1268076.jpeg?auto=compress&cs=tinysrgb&w=800',
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    category: 'world'
  },
  {
    id: '3',
    sourceId: '3',
    sourceName: 'The Guardian',
    title: 'New Study Shows Mediterranean Diet Extends Lifespan',
    summary: 'Researchers have found compelling evidence that a Mediterranean diet can add up to 10 years to life expectancy. The study followed 100,000 participants over 20 years and found significant health benefits.',
    content: 'Full article content about diet study...',
    url: 'https://example.com/article-3',
    imageUrl: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
    publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    category: 'health'
  },
  {
    id: '4',
    sourceId: '4',
    sourceName: 'Reuters',
    title: 'Global Markets Rally on Economic Recovery Signs',
    summary: 'Stock markets worldwide surged today as economic indicators point to strong recovery. The S&P 500 reached a new record high while European and Asian markets also posted significant gains.',
    content: 'Full article content about market rally...',
    url: 'https://example.com/article-4',
    imageUrl: 'https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg?auto=compress&cs=tinysrgb&w=800',
    publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    category: 'business'
  },
  {
    id: '5',
    sourceId: '2',
    sourceName: 'BBC News',
    title: 'Space Agency Announces Plans for Mars Colony by 2040',
    summary: 'A major space agency has unveiled ambitious plans to establish a permanent human settlement on Mars within the next 15 years. The project will involve multiple missions and international collaboration.',
    content: 'Full article content about Mars colony...',
    url: 'https://example.com/article-5',
    imageUrl: 'https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800',
    publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    category: 'science'
  },
  {
    id: '6',
    sourceId: '1',
    sourceName: 'TechCrunch',
    title: 'Electric Vehicle Sales Exceed Expectations in Q4',
    summary: 'Electric vehicle manufacturers reported record sales in the fourth quarter, surpassing analyst predictions by 30%. The surge in demand is attributed to improved battery technology and expanded charging infrastructure.',
    content: 'Full article content about EV sales...',
    url: 'https://example.com/article-6',
    imageUrl: 'https://images.pexels.com/photos/110844/pexels-photo-110844.jpeg?auto=compress&cs=tinysrgb&w=800',
    publishedAt: new Date(Date.now() - 15 * 60 * 60 * 1000),
    category: 'technology',
    location: 'San Francisco'
  },
  {
    id: '7',
    sourceId: '3',
    sourceName: 'The Guardian',
    title: 'Local Community Garden Project Wins National Award',
    summary: 'A grassroots urban farming initiative has been recognized with a prestigious national sustainability award. The project has transformed unused city lots into productive gardens serving thousands of residents.',
    content: 'Full article content about community garden...',
    url: 'https://example.com/article-7',
    imageUrl: 'https://images.pexels.com/photos/1072824/pexels-photo-1072824.jpeg?auto=compress&cs=tinysrgb&w=800',
    publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    category: 'health',
    location: 'San Francisco'
  },
  {
    id: '8',
    sourceId: '4',
    sourceName: 'Reuters',
    title: 'Breakthrough in Quantum Computing Announced',
    summary: 'Scientists have achieved a major milestone in quantum computing, demonstrating a new type of quantum processor that maintains stability at higher temperatures. This could accelerate practical quantum computing applications.',
    content: 'Full article content about quantum computing...',
    url: 'https://example.com/article-8',
    imageUrl: 'https://images.pexels.com/photos/2599244/pexels-photo-2599244.jpeg?auto=compress&cs=tinysrgb&w=800',
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    category: 'science'
  },
  {
    id: '9',
    sourceId: '1',
    sourceName: 'TechCrunch',
    title: 'New AAA Game Breaks Launch Day Sales Records',
    summary: 'The highly anticipated action-adventure game sold 10 million copies in its first 24 hours, setting a new industry record. Players praise the immersive storyline and cutting-edge graphics.',
    content: 'Full article content about game launch...',
    url: 'https://example.com/article-9',
    imageUrl: 'https://images.pexels.com/photos/3945683/pexels-photo-3945683.jpeg?auto=compress&cs=tinysrgb&w=800',
    publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    category: 'gaming'
  },
  {
    id: '10',
    sourceId: '2',
    sourceName: 'BBC News',
    title: 'Senate Passes Landmark Infrastructure Bill',
    summary: 'Congress approved a $1.2 trillion infrastructure package with bipartisan support. The bill includes funding for roads, bridges, broadband internet, and clean energy initiatives.',
    content: 'Full article content about infrastructure bill...',
    url: 'https://example.com/article-10',
    imageUrl: 'https://images.pexels.com/photos/1047930/pexels-photo-1047930.jpeg?auto=compress&cs=tinysrgb&w=800',
    publishedAt: new Date(Date.now() - 7 * 60 * 60 * 1000),
    category: 'politics'
  },
  {
    id: '11',
    sourceId: '4',
    sourceName: 'Reuters',
    title: 'Championship Final Draws Record Viewership',
    summary: 'The championship game attracted 120 million viewers worldwide, becoming the most-watched sporting event of the year. The thrilling overtime finish kept fans on the edge of their seats.',
    content: 'Full article content about championship...',
    url: 'https://example.com/article-11',
    imageUrl: 'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=800',
    publishedAt: new Date(Date.now() - 9 * 60 * 60 * 1000),
    category: 'sports'
  },
  {
    id: '12',
    sourceId: '3',
    sourceName: 'The Guardian',
    title: 'Award-Winning Film Director Announces New Project',
    summary: 'The acclaimed filmmaker revealed plans for an ambitious sci-fi epic set to begin production next year. The star-studded cast includes several Oscar winners and rising talents.',
    content: 'Full article content about film project...',
    url: 'https://example.com/article-12',
    imageUrl: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=800',
    publishedAt: new Date(Date.now() - 11 * 60 * 60 * 1000),
    category: 'entertainment'
  }
];
