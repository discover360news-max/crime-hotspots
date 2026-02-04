/**
 * Dashboard Helper Functions
 * Server-side utilities for calculating crime statistics and insights
 */

import type { Crime } from './crimeData';
import { usesVictimCount } from '../config/crimeTypeConfig';

/**
 * Count crimes by type across both primaryCrimeType and relatedCrimeTypes
 *
 * VICTIM COUNT RULES:
 * - Only applies to PRIMARY crime type (not related crimes)
 * - Only for crime types configured with useVictimCount=true
 * - Related crimes ALWAYS count as +1 (incident-based)
 *
 * Example:
 * - Primary: Murder, victimCount: 3, Related: [Shooting]
 * - Result: Murder +3, Shooting +1
 *
 * @param crimeData - Array of crime data
 * @param targetType - Crime type to count (e.g., "Murder", "Robbery")
 * @returns Count of crimes matching the target type (with victim multiplier if applicable)
 */
export const countCrimeType = (crimeData: Crime[], targetType: string): number => {
  let totalCount = 0;

  crimeData.forEach(crime => {
    // Check if primaryCrimeType matches
    if (crime.primaryCrimeType === targetType) {
      // Apply victim count ONLY if this crime type uses it AND it's the primary crime
      if (usesVictimCount(targetType) && crime.victimCount && crime.victimCount > 1) {
        totalCount += crime.victimCount;
      } else {
        totalCount += 1;
      }
      return; // Don't check related types if primary matches
    }

    // Check if crimeType matches (fallback for old data - always count as 1)
    if (crime.crimeType === targetType) {
      totalCount += 1;
      return;
    }

    // Check if relatedCrimeTypes contains the target type (always count as 1)
    if (crime.relatedCrimeTypes) {
      const relatedTypes = crime.relatedCrimeTypes.split(',').map(t => t.trim());
      if (relatedTypes.includes(targetType)) {
        totalCount += 1;
      }
    }
  });

  return totalCount;
};

/**
 * Calculate dashboard insights from crime data
 * @param crimeData - Array of crime data
 * @returns Object containing calculated insights
 */
export const calculateInsights = (crimeData: Crime[]) => {
  // Get unique dates and calculate date range
  const dates = crimeData.map(c => new Date(c.date)).filter(d => !isNaN(d.getTime()));
  const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
  const daysDiff = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Calculate total crimes (primary + related)
  const totalCrimes = crimeData.reduce((sum, crime) => {
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

  // Calculate total victims (victimCount is per INCIDENT, not per crime type)
  // Each row counts as victimCount victims, regardless of how many crime types it has
  const totalVictims = crimeData.reduce((sum, crime) => {
    // Use victimCount if present (including 0), otherwise default to 1
    const victimCount = crime.victimCount !== undefined && crime.victimCount !== null
      ? Number(crime.victimCount)
      : 1;
    return sum + victimCount;
  }, 0);

  // Average crimes per day
  const avgPerDay = (totalCrimes / daysDiff).toFixed(1);
  const victimsPerDay = Math.round(totalVictims / daysDiff);

  // Most dangerous day of week
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayCount = new Map<string, number>();
  dates.forEach(date => {
    const day = dayNames[date.getDay()];
    dayCount.set(day, (dayCount.get(day) || 0) + 1);
  });
  const mostDangerousDay = Array.from(dayCount.entries())
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  // Busiest month
  const monthCount = new Map<string, number>();
  dates.forEach(date => {
    const month = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    monthCount.set(month, (monthCount.get(month) || 0) + 1);
  });
  const busiestMonth = Array.from(monthCount.entries())
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  // Area stats
  const areaCount = new Map<string, number>();
  crimeData.forEach(crime => {
    const area = crime.area || 'Unknown';
    areaCount.set(area, (areaCount.get(area) || 0) + 1);
  });
  const areaArray = Array.from(areaCount.entries()).sort((a, b) => b[1] - a[1]);

  // Find safest area (exclude "Unknown" and empty values)
  const validAreas = areaArray.filter(([area]) => area && area !== 'Unknown' && area.trim() !== '');
  const safestRegion = validAreas[validAreas.length - 1]?.[0] || 'N/A';
  const safestRegionCount = validAreas[validAreas.length - 1]?.[1] || 0;

  const mostDangerousRegion = areaArray[0]?.[0] || 'N/A';
  const mostDangerousRegionCount = areaArray[0]?.[1] || 0;

  // Top 3 areas concentration
  const top3Count = areaArray.slice(0, 3).reduce((sum, [_, count]) => sum + count, 0);
  const top3Percentage = ((top3Count / crimeData.length) * 100).toFixed(0);

  return {
    avgPerDay,
    victimsPerDay,
    mostDangerousDay,
    busiestMonth,
    safestRegion,
    safestRegionCount,
    mostDangerousRegion,
    mostDangerousRegionCount,
    top3Percentage,
    dayCount: daysDiff
  };
};
