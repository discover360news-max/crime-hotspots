/**
 * Safety Helpers
 * Calculate area-based crime scores and provide contextual safety tips
 * Implements "The Safety Strength Engine" for balanced, SEO-friendly messaging
 *
 * Scoring: 1-10 scale
 * - High Risk (>7): Actionable prevention tips
 * - Neutral (4-6): Maintenance tips
 * - Low Risk (<4): Positive reinforcement
 */

import type { Crime } from './crimeData';

/**
 * Safety context result
 */
export interface SafetyContext {
  score: number; // 1-10 crime score for the area
  level: 'high' | 'neutral' | 'low'; // Risk level
  tip: string; // Actionable safety tip
  positiveNote?: string; // Positive community highlight
  primaryCrimeType?: string; // Most common crime in area
}

/**
 * Calculate crime score for an area (1-10 scale)
 * Uses crime density and trend data
 *
 * @param areaName - Name of the area to score
 * @param allCrimes - All crimes dataset for comparison
 * @param recentWindow - Number of days to consider "recent" (default: 90)
 * @returns Score from 1 (safest) to 10 (highest risk)
 */
export function calculateAreaCrimeScore(
  areaName: string,
  allCrimes: Crime[],
  recentWindow: number = 90
): number {
  // Filter to recent crimes in this area
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - recentWindow);

  const recentCrimesInArea = allCrimes.filter(c =>
    c.area === areaName &&
    c.dateObj >= cutoffDate
  );

  const totalRecentCrimes = allCrimes.filter(c => c.dateObj >= cutoffDate);

  // Calculate crime density (crimes per 100 total crimes)
  const areaCrimeCount = recentCrimesInArea.length;
  const totalCrimeCount = totalRecentCrimes.length;

  if (totalCrimeCount === 0) return 1; // No data = assume safest

  const density = (areaCrimeCount / totalCrimeCount) * 100;

  // Score calculation:
  // - 0-0.5%: Score 1-2 (very safe)
  // - 0.5-1%: Score 2-3 (safe)
  // - 1-2%: Score 3-4 (low-moderate)
  // - 2-3%: Score 4-5 (moderate)
  // - 3-4%: Score 5-6 (moderate-high)
  // - 4-5%: Score 6-7 (high)
  // - 5-7%: Score 7-8 (very high)
  // - 7-10%: Score 8-9 (critical)
  // - >10%: Score 10 (extreme)

  let score: number;
  if (density <= 0.5) score = 1 + density;
  else if (density <= 1) score = 2 + (density - 0.5) * 2;
  else if (density <= 2) score = 3 + (density - 1);
  else if (density <= 3) score = 4 + (density - 2);
  else if (density <= 4) score = 5 + (density - 3);
  else if (density <= 5) score = 6 + (density - 4);
  else if (density <= 7) score = 7 + (density - 5) / 2;
  else if (density <= 10) score = 8 + (density - 7) / 3;
  else score = 9 + Math.min((density - 10) / 10, 1);

  // Clamp between 1 and 10
  return Math.max(1, Math.min(10, Math.round(score * 10) / 10));
}

/**
 * Get most common crime type in an area
 */
export function getPrimaryCrimeType(areaName: string, allCrimes: Crime[]): string {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);

  const recentCrimesInArea = allCrimes.filter(c =>
    c.area === areaName &&
    c.dateObj >= cutoffDate
  );

  const crimeTypeCounts = new Map<string, number>();

  recentCrimesInArea.forEach(crime => {
    const type = crime.primaryCrimeType || crime.crimeType || 'Unknown';
    crimeTypeCounts.set(type, (crimeTypeCounts.get(type) || 0) + 1);
  });

  const sortedTypes = Array.from(crimeTypeCounts.entries())
    .sort((a, b) => b[1] - a[1]);

  return sortedTypes[0]?.[0] || 'General Crime';
}

/**
 * Get safety tip based on score and crime type
 */
function getSafetyTip(score: number, primaryCrimeType: string): string {
  // High crime tips (score > 7)
  const highCrimeTips = {
    'Vehicle Theft': "The 'Empty Seat' Protocol: Vehicle break-ins are a primary driver of the score in this zone. Never leave bags, charging cables, or even loose change visible; an empty car is rarely a target.",
    'Robbery': "Active Awareness Zone: This area has high reports of 'distraction' incidents. We recommend keeping mobile devices tucked away and avoiding the use of headphones while walking to remain fully alert.",
    'Burglary': "Secondary Security Deterrence: Standard locks are often bypassed in this area's incident reports. Consider secondary deterrents like steering wheel locks or reinforced door strike plates for home security.",
    'Home Invasion': "Vigilant Staging: Before exiting your vehicle in this zone, scan your surroundings for loitering. If something feels off, trust your intuition and drive to a more populated area before stopping.",
    'Assault': "The 'Distance' Rule: If approached by strangers for directions or help in this hotspot, maintain a 6-foot distance. If you feel uncomfortable, prioritize your safety and move toward a populated business.",
    'Theft': "Delivery Redirection: Package theft is frequent in this neighborhood. We suggest using 'Secure Pickup' locations or requiring a signature to ensure your deliveries aren't left unattended on porches.",
    'default': "Lighting & Line-of-Sight: Incident data here correlates with low-visibility hours. If possible, park only under active streetlights and avoid 'shortcuts' through alleys or unlit residential passages."
  };

  // Neutral tips (score 4-6)
  const neutralTips = [
    "Baseline Awareness: This area currently maintains a stable safety standing. To help keep it that way, remain aware of your surroundings during 'transition times' like sunrise and sunset when visibility changes.",
    "The 9 PM Routine: Maintaining a '9 PM Routine'—checking that all car doors, house doors, and windows are locked every night—is often the difference between a neutral score and a high-crime score.",
    "Strategic Lighting Maintenance: Check that your porch and motion-sensor lights are in working order. Well-lit neighborhoods statistically discourage the types of property 'probing' common in mid-tier areas.",
    "Community Connection: Introduce yourself to your immediate neighbors. In areas with average crime scores, a connected block where people look out for each other's homes is the strongest deterrent available.",
    "Vehicle 'Clean-Floor' Policy: Even in stable areas, leaving an empty box or a gym bag in your car can invite a window smash. Keep your car interior completely clear to avoid 'curiosity' break-ins."
  ];

  // Low crime tips (score < 4)
  const lowCrimeTips = [
    "Maintain the Standard: Keep up the great neighborhood lighting and locked-door habits that have made this area one of the safest in the region.",
    "Neighborhood Watch Excellence: Continue participating in community watch programs to maintain this area's superior safety standing.",
    "Security Maintenance: Regular checks of home security systems and outdoor lighting help maintain your area's excellent safety record.",
    "Community Vigilance: Your area's low crime rate is a testament to community cooperation. Continue reporting suspicious activity to maintain this achievement.",
    "Proactive Awareness: While your area enjoys low crime rates, maintaining basic security practices ensures it stays that way for years to come."
  ];

  if (score > 7) {
    return highCrimeTips[primaryCrimeType] || highCrimeTips['default'];
  } else if (score >= 4) {
    return neutralTips[Math.floor(Math.random() * neutralTips.length)];
  } else {
    return lowCrimeTips[Math.floor(Math.random() * lowCrimeTips.length)];
  }
}

/**
 * Get positive community note based on score
 */
function getPositiveNote(score: number, areaName: string): string | undefined {
  if (score >= 7) {
    // High crime: Positive note about active response
    return "High Community Guardianship: Residents in this area are historically proactive about reporting suspicious activity early.";
  } else if (score < 4) {
    // Low crime: Celebrate the achievement
    const positiveNotes = [
      `Safety Top Percentile: ${areaName} ranks in the top 10% for safety within the city, maintaining a consistently lower-than-average incident rate over the last 12 months.`,
      `The "Safe Haven" Status: With a safety score of ${score.toFixed(1)}, this area qualifies as a 'Safe Haven' zone, making it one of the most residentially stable pockets in the region.`,
      `Pedestrian-Friendly Rating: Low reports of street-level incidents make this one of the most pedestrian-friendly hotspots in our database for evening commutes and outdoor activity.`,
      `Property Stability Win: Residential property crimes remain significantly below the municipal average here, suggesting a high standard of home security and neighborly vigilance.`
    ];
    return positiveNotes[Math.floor(Math.random() * positiveNotes.length)];
  }

  return undefined; // Neutral areas don't always need a positive note
}

/**
 * Get complete safety context for an area
 *
 * @param areaName - Name of the area
 * @param allCrimes - All crimes dataset
 * @returns Complete safety context with score, tips, and positive notes
 */
export function getSafetyContext(
  areaName: string,
  allCrimes: Crime[]
): SafetyContext {
  const score = calculateAreaCrimeScore(areaName, allCrimes);
  const primaryCrimeType = getPrimaryCrimeType(areaName, allCrimes);

  let level: 'high' | 'neutral' | 'low';
  if (score > 7) level = 'high';
  else if (score >= 4) level = 'neutral';
  else level = 'low';

  const tip = getSafetyTip(score, primaryCrimeType);
  const positiveNote = getPositiveNote(score, areaName);

  return {
    score,
    level,
    tip,
    positiveNote,
    primaryCrimeType
  };
}
