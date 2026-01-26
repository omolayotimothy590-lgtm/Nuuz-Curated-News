/**
 * Google AdSense Configuration
 *
 * This file manages all AdSense settings including test/live mode switching,
 * ad slots, intervals, and publisher information.
 */

export interface AdSlotConfig {
  id: string;
  description: string;
}

export interface AdConfig {
  publisherId: string;
  testMode: boolean;
  testAdSlot: string;
  adSlots: {
    feed: AdSlotConfig[];
    search: AdSlotConfig[];
    saved: AdSlotConfig[];
  };
  intervals: {
    feed: number;
    search: number;
    saved: number;
  };
  responsive: boolean;
  adFormat: 'fluid' | 'auto' | 'rectangle';
  layoutKey: string;
}

// Main AdSense Configuration
export const AD_CONFIG: AdConfig = {
  // Publisher ID (from AdSense account)
  publisherId: 'ca-pub-9934433795401149',

  // Test Mode: Set to true to use test ads, false for live ads
  testMode: true,

  // Test ad slot (used when testMode is true)
  testAdSlot: '1234567890',

  // Live Ad Slots (used when testMode is false)
  adSlots: {
    // Main news feed ad slots
    feed: [
      { id: '1193300078', description: 'Feed Ad Slot 1' },
      { id: '6248856644', description: 'Feed Ad Slot 2' },
      { id: '2945365445', description: 'Feed Ad Slot 3' },
      { id: '2547400884', description: 'Feed Ad Slot 4' },
    ],
    // Search results ad slots
    search: [
      { id: '5678901234', description: 'Search Ad Slot 1' },
      { id: '6789012345', description: 'Search Ad Slot 2' },
      { id: '7890123456', description: 'Search Ad Slot 3' },
    ],
    // Saved articles ad slots
    saved: [
      { id: '8901234567', description: 'Saved Ad Slot 1' },
      { id: '9012345678', description: 'Saved Ad Slot 2' },
      { id: '0123456789', description: 'Saved Ad Slot 3' },
    ],
  },

  // Ad placement intervals (every N items)
  intervals: {
    feed: 7,    // Show ad every 7 feed items
    search: 7,  // Show ad every 7 search results
    saved: 6,   // Show ad every 6 saved articles
  },

  // Responsive ads (recommended)
  responsive: true,

  // Ad format (fluid blends with content)
  adFormat: 'fluid',

  // Layout key for in-feed ads
  layoutKey: '-6t+eh+16-3z-5g',
};

/**
 * Get the appropriate ad slot based on view type and index
 */
export function getAdSlot(viewType: 'feed' | 'search' | 'saved', index: number): string {
  if (AD_CONFIG.testMode) {
    return AD_CONFIG.testAdSlot;
  }

  const slots = AD_CONFIG.adSlots[viewType];
  const slotIndex = index % slots.length;
  return slots[slotIndex].id;
}

/**
 * Get ad interval for specific view type
 */
export function getAdInterval(viewType: 'feed' | 'search' | 'saved'): number {
  return AD_CONFIG.intervals[viewType];
}

/**
 * Check if ads should be placed at this position
 */
export function shouldPlaceAd(itemIndex: number, viewType: 'feed' | 'search' | 'saved'): boolean {
  const interval = getAdInterval(viewType);
  return (itemIndex + 1) % interval === 0;
}

/**
 * Log ad configuration for debugging
 */
export function logAdConfig(): void {
  console.group('📢 AdSense Configuration');
  console.log('Mode:', AD_CONFIG.testMode ? '🧪 TEST MODE' : '✅ LIVE MODE');
  console.log('Publisher ID:', AD_CONFIG.publisherId);
  console.log('Ad Intervals:', AD_CONFIG.intervals);
  console.log('Responsive:', AD_CONFIG.responsive);
  console.log('Format:', AD_CONFIG.adFormat);
  console.groupEnd();
}

/**
 * Instructions for switching from test to live ads:
 *
 * 1. Set testMode to false in AD_CONFIG
 * 2. Replace ad slot IDs with your actual AdSense ad unit IDs
 * 3. Verify publisher ID matches your AdSense account
 * 4. Test in production environment
 * 5. Monitor AdSense dashboard for impressions
 */
