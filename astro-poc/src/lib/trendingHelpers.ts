/**
 * Trending Helpers
 * Shared logic for "Hot Areas This Week" (server + client) and
 * "Your Recent Views" (client-side localStorage tracking).
 *
 * Created: February 8, 2026
 */

import type { Crime } from './crimeData';
import { toDate } from './safetyHelpers';

// ============================================================================
// Interfaces
// ============================================================================

export interface HotArea {
  area: string;
  areaSlug: string;
  count: number;
  rank: number;
}

export interface RecentView {
  slug: string;
  headline: string;
  area: string;
  timestamp: number;
}

// ============================================================================
// Hot Areas (server-side + client-side)
// ============================================================================

/**
 * Returns the top N areas by crime count in the last 7 days.
 * Works with both server-side Crime objects (dateObj is Date) and
 * client-side JSON-serialized objects (dateObj is string).
 */
export function getHotAreas(allCrimes: Crime[], limit: number = 5): HotArea[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  cutoff.setHours(0, 0, 0, 0);

  // Filter to last 7 days
  const recentCrimes = allCrimes.filter(c => {
    const d = toDate(c.dateObj, c.date);
    return d >= cutoff;
  });

  // Aggregate by area
  const areaCount = new Map<string, number>();
  recentCrimes.forEach(crime => {
    const area = crime.area || 'Unknown';
    areaCount.set(area, (areaCount.get(area) || 0) + 1);
  });

  // Sort descending by count, take top N
  return Array.from(areaCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([area, count], index) => ({
      area,
      areaSlug: area.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      count,
      rank: index + 1,
    }));
}

// ============================================================================
// Recent Views (client-side localStorage)
// ============================================================================

const STORAGE_KEY = 'crimehotspots_recent_views';
const MAX_ENTRIES = 20;

/**
 * Records a crime page view in localStorage.
 * Deduplicates by slug and keeps a rolling buffer of MAX_ENTRIES.
 */
export function trackRecentView(slug: string, headline: string, area: string): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    let entries: RecentView[] = stored ? JSON.parse(stored) : [];

    // Remove existing entry for this slug (prevent duplicates)
    entries = entries.filter(e => e.slug !== slug);

    // Add new entry
    entries.push({ slug, headline, area, timestamp: Date.now() });

    // Keep only most recent MAX_ENTRIES
    if (entries.length > MAX_ENTRIES) {
      entries = entries.slice(-MAX_ENTRIES);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage unavailable (SSR, private browsing, quota exceeded)
  }
}

/**
 * Retrieves recent crime page views from localStorage.
 * Excludes the current slug and returns most recent N entries.
 */
export function getRecentViews(excludeSlug: string, limit: number = 3): RecentView[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const entries: RecentView[] = JSON.parse(stored);
    return entries
      .filter(e => e.slug !== excludeSlug)
      .reverse() // Most recent first
      .slice(0, limit);
  } catch {
    return [];
  }
}
