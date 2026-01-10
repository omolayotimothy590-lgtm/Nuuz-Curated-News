/**
 * Google AdSense Analytics and Performance Tracking
 *
 * This module tracks ad impressions, viewability, errors, and performance metrics.
 * Integrates with Google Analytics if available.
 */

interface AdEvent {
  event: 'loaded' | 'rendered' | 'viewable' | 'error';
  viewType: string;
  adSlot: string;
  position?: number;
  timestamp: number;
}

interface AdPerformanceMetrics {
  totalAds: number;
  loadedAds: number;
  renderedAds: number;
  viewableAds: number;
  errors: number;
  averageLoadTime: number;
  viewability: number;
}

class AdAnalytics {
  private events: AdEvent[] = [];
  private loadTimes: Map<string, number> = new Map();
  private readonly maxEvents = 1000;

  /**
   * Track an ad event
   */
  trackEvent(
    event: 'loaded' | 'rendered' | 'viewable' | 'error',
    viewType: string,
    adSlot: string,
    position?: number
  ): void {
    const adEvent: AdEvent = {
      event,
      viewType,
      adSlot,
      position,
      timestamp: Date.now(),
    };

    this.events.push(adEvent);

    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    if (event === 'loaded') {
      this.loadTimes.set(adSlot, Date.now());
    }

    this.sendToGoogleAnalytics(adEvent);

    if (import.meta.env.DEV) {
      this.logEvent(adEvent);
    }
  }

  /**
   * Send event to Google Analytics if available
   */
  private sendToGoogleAnalytics(adEvent: AdEvent): void {
    if (typeof window === 'undefined') return;

    try {
      if ((window as any).gtag) {
        (window as any).gtag('event', 'ad_event', {
          event_category: 'AdSense',
          event_label: `${adEvent.viewType}_${adEvent.event}`,
          ad_slot: adEvent.adSlot,
          position: adEvent.position,
          non_interaction: true,
        });
      }

      if ((window as any).dataLayer) {
        (window as any).dataLayer.push({
          event: 'adsense_event',
          adsense: {
            type: adEvent.event,
            view: adEvent.viewType,
            slot: adEvent.adSlot,
            position: adEvent.position,
          },
        });
      }
    } catch (error) {
      console.error('Error sending to analytics:', error);
    }
  }

  /**
   * Log event to console in development
   */
  private logEvent(adEvent: AdEvent): void {
    const emoji = {
      loaded: '📥',
      rendered: '🎨',
      viewable: '👁️',
      error: '❌',
    }[adEvent.event];

    console.log(
      `${emoji} AdSense ${adEvent.event}:`,
      `${adEvent.viewType} #${adEvent.position}`,
      `slot: ${adEvent.adSlot}`
    );
  }

  /**
   * Get performance metrics
   */
  getMetrics(): AdPerformanceMetrics {
    const loaded = this.events.filter((e) => e.event === 'loaded').length;
    const rendered = this.events.filter((e) => e.event === 'rendered').length;
    const viewable = this.events.filter((e) => e.event === 'viewable').length;
    const errors = this.events.filter((e) => e.event === 'error').length;

    const loadTimeValues = Array.from(this.loadTimes.values());
    const averageLoadTime =
      loadTimeValues.length > 0
        ? loadTimeValues.reduce((a, b) => a + b, 0) / loadTimeValues.length
        : 0;

    const viewability = rendered > 0 ? (viewable / rendered) * 100 : 0;

    return {
      totalAds: this.events.length,
      loadedAds: loaded,
      renderedAds: rendered,
      viewableAds: viewable,
      errors,
      averageLoadTime,
      viewability,
    };
  }

  /**
   * Get events by type
   */
  getEventsByType(eventType: 'loaded' | 'rendered' | 'viewable' | 'error'): AdEvent[] {
    return this.events.filter((e) => e.event === eventType);
  }

  /**
   * Get events by view type
   */
  getEventsByView(viewType: string): AdEvent[] {
    return this.events.filter((e) => e.viewType === viewType);
  }

  /**
   * Clear all tracked events
   */
  clear(): void {
    this.events = [];
    this.loadTimes.clear();
  }

  /**
   * Export metrics for reporting
   */
  exportMetrics(): string {
    const metrics = this.getMetrics();
    return JSON.stringify(metrics, null, 2);
  }

  /**
   * Log performance summary to console
   */
  logSummary(): void {
    const metrics = this.getMetrics();

    console.group('📊 AdSense Performance Summary');
    console.log('Total Ads:', metrics.totalAds);
    console.log('Loaded:', metrics.loadedAds);
    console.log('Rendered:', metrics.renderedAds);
    console.log('Viewable:', metrics.viewableAds);
    console.log('Errors:', metrics.errors);
    console.log('Average Load Time:', `${metrics.averageLoadTime.toFixed(0)}ms`);
    console.log('Viewability Rate:', `${metrics.viewability.toFixed(1)}%`);
    console.groupEnd();
  }
}

const adAnalytics = new AdAnalytics();

export function trackAdEvent(
  event: 'loaded' | 'rendered' | 'viewable' | 'error',
  viewType: string,
  adSlot: string,
  position?: number
): void {
  adAnalytics.trackEvent(event, viewType, adSlot, position);
}

export function getAdMetrics(): AdPerformanceMetrics {
  return adAnalytics.getMetrics();
}

export function logAdSummary(): void {
  adAnalytics.logSummary();
}

export function clearAdAnalytics(): void {
  adAnalytics.clear();
}

export function exportAdMetrics(): string {
  return adAnalytics.exportMetrics();
}

if (typeof window !== 'undefined') {
  (window as any).__adAnalytics = adAnalytics;
}
