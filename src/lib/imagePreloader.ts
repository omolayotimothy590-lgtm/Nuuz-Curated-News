import { Article } from '../types';
import { imageScraper } from './imageScraper';

class ImagePreloader {
  private preloadedUrls = new Set<string>();
  private preloadQueue: string[] = [];
  private isProcessing = false;

  preloadArticleImages(articles: Article[]) {
    articles.forEach(article => {
      if (article.url && !this.preloadedUrls.has(article.url) && !article.imageUrl) {
        this.preloadQueue.push(article.url);
        this.preloadedUrls.add(article.url);
      }
    });

    this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessing || this.preloadQueue.length === 0) return;

    this.isProcessing = true;

    const batch = this.preloadQueue.splice(0, 5);

    await Promise.all(
      batch.map(url =>
        imageScraper.scrapeImageAsync(url, () => {})
      )
    );

    this.isProcessing = false;

    if (this.preloadQueue.length > 0) {
      setTimeout(() => this.processQueue(), 200);
    }
  }

  clearCache() {
    this.preloadedUrls.clear();
    this.preloadQueue = [];
  }
}

export const imagePreloader = new ImagePreloader();
