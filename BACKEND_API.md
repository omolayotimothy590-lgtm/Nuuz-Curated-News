# Nuuz Backend API Documentation

## Overview

The Nuuz backend is built on **Supabase Edge Functions** (serverless TypeScript/Deno) with PostgreSQL database. It provides news aggregation, AI-powered features, personalization, and user interactions.

## Database Tables

### 1. Articles
Stores all news articles from various sources.

**Columns:**
- `id` (uuid) - Primary key
- `title` (varchar 500) - Article title
- `summary` (text) - Brief summary
- `full_content` (text) - Full article content
- `source` (varchar 100) - Source name (e.g., "TechCrunch")
- `source_logo` (text) - URL to source logo
- `category` (varchar 50) - Category (tech, gaming, politics, sports, business, health, entertainment, crypto, travel, general, local)
- `image_url` (text) - Article image URL
- `article_url` (text, unique) - Original article URL
- `published_at` (timestamptz) - Publication date
- `read_time` (integer) - Estimated read time in minutes
- `is_trending` (boolean) - Trending status
- `engagement_score` (integer) - User engagement score
- `city` (varchar 100) - Location: city name (for local news)
- `state` (varchar 50) - Location: state name (for local news)
- `zip_code` (varchar 10) - Location: ZIP code (for local news)
- `created_at` (timestamptz) - Record creation date
- `updated_at` (timestamptz) - Last update date

### 2. User Interactions
Tracks all user actions on articles.

**Columns:**
- `id` (uuid) - Primary key
- `user_id` (text) - User or device ID
- `article_id` (uuid) - Foreign key to articles
- `action` (text) - Action type: thumbs_up, thumbs_down, save, read, share
- `timestamp` (timestamptz) - Action timestamp

### 3. User Settings
Stores user preferences and location information.

**Columns:**
- `id` (uuid) - Primary key
- `user_id` (text, unique) - User or device ID
- `category_scores` (jsonb) - Category preference scores
- `source_scores` (jsonb) - Source preference scores
- `zip_code` (varchar 5) - User's ZIP code for local news
- `city` (text) - User's city name
- `state` (text) - User's state name
- `state_code` (varchar 2) - Two-letter state code
- `location_updated_at` (timestamptz) - When location was last set
- `updated_at` (timestamptz) - Last preference update

## Edge Functions (API Endpoints)

All Edge Functions are deployed at:
```
https://[YOUR_PROJECT_ID].supabase.co/functions/v1/[function-name]
```

### 1. Discover Feed
**Endpoint:** `GET /discover-feed`

Returns personalized article feed based on user preferences.

**Query Parameters:**
- `user_id` (optional) - User ID for personalization
- `category` (optional) - Filter by category
- `limit` (optional, default: 20) - Number of articles

**Response:**
```json
{
  "success": true,
  "articles": [...],
  "total": 20,
  "personalized": true
}
```

**Personalization Algorithm:**
- Category preference weight: 2x
- Source preference weight: 1x
- Trending bonus: 0.5x
- Engagement score bonus: 0.1x
- Recency score: Higher for recent articles

### 2. Article Interactions
**Endpoint:** `POST /article-interactions` (record interaction)
**Endpoint:** `GET /article-interactions` (fetch interactions)

**POST Body:**
```json
{
  "user_id": "user-123",
  "article_id": "article-uuid",
  "action": "thumbs_up"
}
```

**Actions:**
- `thumbs_up` - Like article (+1.0 preference)
- `thumbs_down` - Dislike article (-1.0 preference)
- `save` - Save article (+0.8 preference)
- `read` - Read article (+0.5 preference)
- `share` - Share article (+0.7 preference)

**Response:**
```json
{
  "success": true,
  "message": "Interaction recorded"
}
```

**GET Query Parameters:**
- `user_id` (required) - User ID
- `action` (optional) - Filter by action type

### 3. Ask AI
**Endpoint:** `POST /ask-ai`

Ask questions about an article using AI. The AI provides intelligent, helpful answers even when specific information isn't in the article.

**Request Body:**
```json
{
  "article_id": "article-uuid",
  "question": "What are the main points?",
  "user_id": "user-123"
}
```

**Response:**
```json
{
  "success": true,
  "answer": "The main points are...",
  "article_title": "Article Title"
}
```

**Enhanced AI Features:**
- **Always helpful**: Provides comprehensive answers even if details aren't in the article
- **Contextual knowledge**: Supplements article information with general knowledge
- **Smart fallback**: Automatically retries with different prompts if disclaimers detected
- **Natural responses**: Conversational, engaging, and informative answers
- **Post-processing**: Filters out unhelpful "article doesn't mention" responses

**Example Behavior:**
- Question: "How will this affect my mortgage?" (Article: Federal Reserve Raises Rates)
- ✅ Provides full explanation of mortgage impact using general knowledge
- ❌ NEVER says: "The article doesn't mention mortgages"

**Rate Limiting:**
- 20 questions per hour per user
- Returns 429 status if limit exceeded

### 4. Search Articles
**Endpoint:** `GET /search-articles`

Search articles by query.

**Query Parameters:**
- `query` or `q` (required) - Search term
- `category` (optional) - Filter by category
- `limit` (optional, default: 20) - Number of results

**Response:**
```json
{
  "success": true,
  "articles": [...],
  "total": 15,
  "query": "ai technology"
}
```

Searches in: title, summary, and full_content fields.

### 5. Scrape News
**Endpoint:** `POST /scrape-news`

Triggers news aggregation from multiple sources.

**Sources:**
- NewsAPI.org (if API key configured)
- RSS Feeds:
  - TechCrunch
  - The Verge
  - Wired
  - BBC News
  - ESPN

**Response:**
```json
{
  "success": true,
  "message": "Scraped 50 articles, inserted 30, skipped 20 duplicates",
  "inserted": 30,
  "skipped": 20
}
```

**Note:** Should be called via scheduled task (e.g., GitHub Actions, Cron-job.org)

### 6. Summarize Article
**Endpoint:** `POST /summarize-article`

Generate AI summary for article.

**Request Body:**
```json
{
  "article_id": "article-uuid"
}
```
OR
```json
{
  "text": "Long article text to summarize..."
}
```

**Response:**
```json
{
  "success": true,
  "summary": "This article discusses..."
}
```

Uses OpenAI GPT-4o-mini or Google Gemini Flash.

### 7. Get Local Feed
**Endpoint:** `GET /get-local-feed`

Get local news articles for a specific location.

**Query Parameters:**
- `zip_code` (optional) - User's ZIP code
- `city` (optional) - City name
- `state` (optional) - State name
- `limit` (optional, default: 50) - Number of articles

**Response:**
```json
{
  "success": true,
  "articles": [...],
  "total": 25,
  "location": {
    "zip_code": "10001",
    "city": "New York",
    "state": "New York"
  }
}
```

**Features:**
- Searches for articles matching the location (city/state in metadata or title/summary)
- Falls back to general news if less than 10 local articles found
- Automatically triggers local news scraping if no articles exist

### 8. Update User Location
**Endpoint:** `POST /update-user-location`

Save user's location and trigger local news scraping.

**Request Body:**
```json
{
  "user_id": "user-123",
  "zip_code": "10001",
  "city": "New York",
  "state": "New York",
  "state_code": "NY"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "user-123",
    "zip_code": "10001",
    "city": "New York",
    "state": "New York",
    "location_updated_at": "2025-10-15T18:00:00Z"
  }
}
```

**Side Effects:**
- Saves location to user_settings table
- Triggers `scrape-local-news` function in background
- Future local feed requests will use this location

### 9. Scrape Local News
**Endpoint:** `POST /scrape-local-news`

Fetch and save local news from Google News RSS for a specific location.

**Request Body:**
```json
{
  "zip_code": "10001",
  "city": "New York",
  "state": "New York"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Scraped local news for New York, New York",
  "inserted": 25,
  "skipped": 5
}
```

**Features:**
- Fetches from Google News RSS with location search query
- Parses and cleans HTML from titles/summaries
- Extracts source name from article titles
- Finds and saves article images
- Prevents duplicate articles
- Tags articles with location metadata (city, state, zip_code)

**Google News RSS Query:**
```
https://news.google.com/rss/search?q={city}+{state}+when:7d&hl=en-US&gl=US&ceid=US:en
```

Searches for articles mentioning the location from the past 7 days.

## Frontend Integration

Use the provided `newsApi` service in `src/lib/newsApi.ts`:

```typescript
import { newsApi } from './lib/newsApi';

// Fetch personalized feed
const articles = await newsApi.getDiscoverFeed(userId, category);

// Fetch local news for user's location
const localArticles = await newsApi.getLocalFeed(zipCode, city, state);

// Update user's location
await newsApi.updateUserLocation(userId, zipCode, city, state, stateCode);

// Record user interaction
await newsApi.recordInteraction(userId, articleId, 'thumbs_up');

// Ask AI about article
const answer = await newsApi.askAI(articleId, 'What is this about?');

// Search articles
const results = await newsApi.searchArticles('technology');

// Get saved articles
const saved = await newsApi.getSavedArticles(userId);
```

## Environment Variables

Required environment variables (automatically configured in Supabase):

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Public anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side only)

Optional API keys (configure in Supabase dashboard):

- `NEWSAPI_KEY` - NewsAPI.org API key
- `OPENAI_API_KEY` - OpenAI API key for AI features
- `GEMINI_API_KEY` - Google Gemini API key (fallback)

## Scheduled Tasks

### News Scraping (Recommended: Every 30 minutes)

**Option 1: GitHub Actions**
```yaml
name: Scrape News
on:
  schedule:
    - cron: '*/30 * * * *'
  workflow_dispatch:

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger general news scrape
        run: |
          curl -X POST \
            "${{ secrets.SUPABASE_URL }}/functions/v1/scrape-news" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}"
```

**Option 2: Cron-job.org**
1. Sign up at https://cron-job.org
2. Create new cron job
3. Set URL: `https://[project-id].supabase.co/functions/v1/scrape-news`
4. Set schedule: Every 30 minutes
5. Add header: `Authorization: Bearer [ANON_KEY]`

### Local News Scraping (Recommended: Every 2 hours)

Local news is automatically triggered when:
- User sets their location for the first time
- User requests local feed and no articles exist

For proactive scraping of all user locations, create a scheduled task that queries active user locations and triggers scraping:

```sql
-- Get all unique locations from active users
SELECT DISTINCT zip_code, city, state
FROM user_settings
WHERE zip_code IS NOT NULL
  AND location_updated_at > NOW() - INTERVAL '30 days';
```

Then call `/scrape-local-news` for each location.

### Trending Calculator

Run SQL directly in Supabase (via cron):
```sql
UPDATE articles
SET is_trending = (
  engagement_score > (SELECT AVG(engagement_score) * 1.5 FROM articles WHERE published_at > NOW() - INTERVAL '24 hours')
  AND published_at > NOW() - INTERVAL '24 hours'
);
```

## Error Handling

All endpoints return consistent error format:
```json
{
  "success": false,
  "error": "Error message here"
}
```

HTTP Status Codes:
- `200` - Success
- `400` - Bad request (missing parameters)
- `404` - Resource not found
- `429` - Rate limit exceeded
- `500` - Server error

## Security

- All tables use Row Level Security (RLS)
- Articles are publicly readable
- User interactions/preferences require matching user_id
- Edge Functions validate all inputs
- Rate limiting on AI endpoints
- CORS enabled for frontend access

## Performance Optimization

**Indexes:**
- Articles: category, published_at, is_trending, engagement_score
- User interactions: user_id, article_id, action, timestamp
- User preferences: user_id

**Caching:**
- Frontend should cache articles locally
- Implement client-side pagination
- Use request deduplication

## Getting Started

1. Deploy all Edge Functions (already done)
2. Run database migrations (already done)
3. Configure API keys in Supabase dashboard (Settings → Edge Functions → Secrets)
4. Set up scheduled scraping task
5. Use `newsApi` service in frontend code

## Support & Troubleshooting

Check Edge Function logs in Supabase dashboard:
1. Go to Edge Functions
2. Select function
3. View logs tab
4. Check for errors

Common issues:
- **No articles returned:** Run scrape-news function manually
- **AI not working:** Check OPENAI_API_KEY or GEMINI_API_KEY is set
- **Rate limiting:** Wait 1 hour or increase limits in code
