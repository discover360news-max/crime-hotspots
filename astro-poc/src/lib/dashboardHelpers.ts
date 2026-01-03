/**
 * Dashboard Helper Functions
 * Server-side utilities for calculating crime statistics and insights
 */

import type { Crime } from './crimeData';
import { usesVictimCount } from '../config/crimeTypeConfig';

/**
 * Count crimes by type across both primaryCrimeType and relatedCrimeTypes
 * @param crimeData - Array of crime data
 * @param targetType - Crime type to count (e.g., "Murder", "Robbery")
 * @returns Count of crimes matching the target type
 */
export const countCrimeType = (crimeData: Crime[], targetType: string): number => {
  return crimeData.filter(crime => {
    // Check if primaryCrimeType matches
    if (crime.primaryCrimeType === targetType) return true;

    // Check if crimeType matches (fallback for old data)
    if (crime.crimeType === targetType) return true;

    // Check if relatedCrimeTypes contains the target type
    if (crime.relatedCrimeTypes) {
      const relatedTypes = crime.relatedCrimeTypes.split(',').map(t => t.trim());
      if (relatedTypes.includes(targetType)) return true;
    }

    return false;
  }).length;
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

  // Calculate total victims (respecting victimCount config)
  const totalVictims = crimeData.reduce((sum, crime) => {
    const primaryType = crime.primaryCrimeType || crime.crimeType;

    if (primaryType && usesVictimCount(primaryType)) {
      const victimCount = Number(crime.victimCount) || 1;
      return sum + victimCount;
    }

    return sum + 1; // Count as 1 if crime type doesn't use victim count
  }, 0);

  // Average crimes per day
  const avgPerDay = (totalCrimes / daysDiff).toFixed(1);

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
    totalVictims,
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
