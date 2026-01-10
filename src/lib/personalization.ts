import { Article, UserPreferences } from '../types';

export const calculateArticleScore = (
  article: Article,
  preferences: UserPreferences
): number => {
  let score = 0;

  const categoryLikes = preferences.likedCategories[article.category] || 0;
  const categoryDislikes = preferences.dislikedCategories[article.category] || 0;
  const sourceLikes = preferences.likedSources[article.sourceId] || 0;
  const sourceDislikes = preferences.dislikedSources[article.sourceId] || 0;

  score += categoryLikes * 3;
  score -= categoryDislikes * 5;

  score += sourceLikes * 2;
  score -= sourceDislikes * 4;

  const totalEngagements = preferences.engagementHistory.length;
  if (totalEngagements > 0) {
    const categoryTotal = categoryLikes + categoryDislikes;
    if (categoryTotal > 0) {
      const categoryWeight = categoryTotal / totalEngagements;
      score += categoryWeight * 10;
    }
  }

  const recencyBoost = Math.max(0, 10 - (Date.now() - article.publishedAt.getTime()) / (1000 * 60 * 60));
  score += recencyBoost;

  return score;
};

export const personalizeArticles = (
  articles: Article[],
  preferences: UserPreferences
): Article[] => {
  if (preferences.engagementHistory.length === 0) {
    return articles.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  }

  const scoredArticles = articles.map(article => ({
    article,
    score: calculateArticleScore(article, preferences)
  }));

  return scoredArticles
    .sort((a, b) => b.score - a.score)
    .map(({ article }) => article);
};
