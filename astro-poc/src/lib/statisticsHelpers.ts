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
  'Attempted Murder',
  'Kidnapping',
  'Sexual Assault',
  'Shooting',
  'Assault',
  'Home Invasion',
  'Carjacking',
  'Arson',
  'Robbery',
  'Domestic Violence',
  'Extortion',
  'Burglary',
  'Theft',
  'Seizures'
] as const;

export type TrackedCrimeType = typeof TRACKED_CRIME_TYPES[number];

/**
 * Result of a year-over-year comparison for a crime type
 */
export interface YoYComparison {
  type: string;
  countCurrent: number;
  countPrevious: number;
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
 * Compare same period between two years (dynamic — works for any year pair)
 * Example: If today is Jan 23 2026, compare:
 * - currentYear (2026): Jan 1 - Jan 23
 * - previousYear (2025): Jan 1 - Jan 23
 *
 * @param crimesCurrentYear - Current year crimes (will be filtered to YTD)
 * @param crimesPreviousYear - Previous year crimes (will be filtered to same period)
 * @param currentYear - The current year number (e.g. 2026)
 * @param previousYear - The previous year number (e.g. 2025)
 * @returns Array of YoY comparisons for each tracked crime type
 */
export function compareYearToDate(
  crimesCurrentYear: Crime[],
  crimesPreviousYear: Crime[],
  currentYear: number,
  previousYear: number
): YoYComparison[] {
  const crimesPreviousSamePeriod = filterToSamePeriod(crimesPreviousYear, previousYear);
  const crimesCurrentYTD = filterToSamePeriod(crimesCurrentYear, currentYear);

  return TRACKED_CRIME_TYPES.map(type => {
    const countCurrent = countCrimeType(crimesCurrentYTD, type);
    const countPrevious = countCrimeType(crimesPreviousSamePeriod, type);
    const percentChange = calculatePercentChange(countPrevious, countCurrent);

    let direction: 'up' | 'down' | 'same' = 'same';
    if (percentChange > 0.5) direction = 'up';
    else if (percentChange < -0.5) direction = 'down';

    return {
      type,
      countCurrent,
      countPrevious,
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

  // Count primary + related crime types per row (matches "All Crimes" methodology)
  crimes.forEach(crime => {
    const region = crime.region || 'Unknown';
    if (region && region !== 'Unknown' && region.trim() !== '') {
      let crimeCount = crime.primaryCrimeType || crime.crimeType ? 1 : 0;
      if (crime.relatedCrimeTypes) {
        const relatedTypes = crime.relatedCrimeTypes.split(',').map(t => t.trim()).filter(t => t);
        crimeCount += relatedTypes.length;
      }
      regionCount.set(region, (regionCount.get(region) || 0) + crimeCount);
    }
  });

  const total = Array.from(regionCount.values()).reduce((sum, count) => sum + count, 0);

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
