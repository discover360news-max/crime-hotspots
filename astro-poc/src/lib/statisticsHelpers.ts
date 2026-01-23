/**
 * Statistics Helpers
 * Utility functions for year-over-year comparisons and statistics aggregations
 * Used by /trinidad/statistics/ page
 */

import type { Crime } from './crimeData';
import { countCrimeType } from './dashboardHelpers';

/**
 * Crime types to track in statistics (ordered by severity/importance)
 */
export const TRACKED_CRIME_TYPES = [
  'Murder',
  'Robbery',
  'Shooting',
  'Home Invasion',
  'Assault',
  'Burglary',
  'Kidnapping',
  'Theft',
  'Seizures'
] as const;

export type TrackedCrimeType = typeof TRACKED_CRIME_TYPES[number];

/**
 * Result of a year-over-year comparison for a crime type
 */
export interface YoYComparison {
  type: string;
  count2026: number;
  count2025: number;
  percentChange: number;
  direction: 'up' | 'down' | 'same';
}

/**
 * Regional crime data
 */
export interface RegionStats {
  region: string;
  count: number;
  percentage: number;
}

/**
 * Calculate percentage change between two values
 * @returns Percentage change (positive = increase, negative = decrease)
 */
export function calculatePercentChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) {
    return newValue > 0 ? 100 : 0;
  }
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Filter crimes to same period in previous year
 * If today is Jan 23 2026, returns 2025 crimes from Jan 1 - Jan 23
 */
export function filterToSamePeriod(crimes: Crime[], targetYear: number): Crime[] {
  const today = new Date();
  const currentMonth = today.getMonth() + 1; // 1-indexed
  const currentDay = today.getDate();

  return crimes.filter(c => {
    if (c.year !== targetYear) return false;

    // Include if month is before current month
    if (c.month < currentMonth) return true;

    // If same month, include if day is <= current day
    if (c.month === currentMonth && c.day <= currentDay) return true;

    return false;
  });
}

/**
 * Compare same period between two years
 * Example: If today is Jan 23 2026, compare:
 * - 2026: Jan 1 - Jan 23
 * - 2025: Jan 1 - Jan 23
 *
 * @param crimes2026 - Full year 2026 crimes (will be filtered to YTD)
 * @param crimes2025 - Full year 2025 crimes (will be filtered to same period)
 * @returns Array of YoY comparisons for each tracked crime type
 */
export function compareYearToDate(
  crimes2026: Crime[],
  crimes2025: Crime[]
): YoYComparison[] {
  // Filter 2025 to same period as current date
  const crimes2025SamePeriod = filterToSamePeriod(crimes2025, 2025);

  // 2026 crimes are already filtered to current year, but ensure YTD only
  const crimes2026YTD = filterToSamePeriod(crimes2026, 2026);

  return TRACKED_CRIME_TYPES.map(type => {
    const count2026 = countCrimeType(crimes2026YTD, type);
    const count2025 = countCrimeType(crimes2025SamePeriod, type);
    const percentChange = calculatePercentChange(count2025, count2026);

    let direction: 'up' | 'down' | 'same' = 'same';
    if (percentChange > 0.5) direction = 'up';
    else if (percentChange < -0.5) direction = 'down';

    return {
      type,
      count2026,
      count2025,
      percentChange,
      direction
    };
  });
}

/**
 * Get crime counts by type for a given set of crimes
 */
export function getCrimeTypeBreakdown(crimes: Crime[]): Map<string, number> {
  const breakdown = new Map<string, number>();

  TRACKED_CRIME_TYPES.forEach(type => {
    const count = countCrimeType(crimes, type);
    if (count > 0) {
      breakdown.set(type, count);
    }
  });

  return breakdown;
}

/**
 * Get top regions by crime count
 */
export function getTopRegions(crimes: Crime[], limit: number = 5): RegionStats[] {
  const regionCount = new Map<string, number>();

  crimes.forEach(crime => {
    const region = crime.region || 'Unknown';
    if (region && region !== 'Unknown' && region.trim() !== '') {
      regionCount.set(region, (regionCount.get(region) || 0) + 1);
    }
  });

  const total = crimes.filter(c => c.region && c.region !== 'Unknown').length;

  return Array.from(regionCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([region, count]) => ({
      region,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0
    }));
}

/**
 * Calculate total crimes for a dataset
 * Counts both primary and related crime types
 */
export function getTotalCrimeCount(crimes: Crime[]): number {
  return crimes.reduce((sum, crime) => {
    let crimeCount = 0;

    // Count primary crime type
    if (crime.primaryCrimeType || crime.crimeType) {
      crimeCount += 1;
    }

    // Count related crimes
    if (crime.relatedCrimeTypes) {
      const relatedTypes = crime.relatedCrimeTypes.split(',').map(t => t.trim()).filter(t => t);
      crimeCount += relatedTypes.length;
    }

    return sum + crimeCount;
  }, 0);
}

/**
 * Format percentage change with sign and arrow
 */
export function formatPercentChange(percentChange: number): string {
  const sign = percentChange > 0 ? '+' : '';
  return `${sign}${percentChange.toFixed(1)}%`;
}

/**
 * Get description of current period for display
 * e.g., "January 1 - January 23, 2026"
 */
export function getCurrentPeriodDescription(): string {
  const today = new Date();
  const monthName = today.toLocaleDateString('en-US', { month: 'long' });
  const day = today.getDate();
  const year = today.getFullYear();

  return `January 1 - ${monthName} ${day}, ${year}`;
}
