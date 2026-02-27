/**
 * Risk Weight Configuration
 *
 * Defines risk severity weights for each crime type used in risk level calculations.
 * Higher weights = higher risk/severity.
 *
 * These weights are used to calculate area risk scores, which are then normalized
 * relative to the highest-risk area to generate risk level bars.
 *
 * How it works:
 * 1. Each crime's risk contribution = weight × victimCount (for victim-based crimes)
 * 2. Area's total risk score = sum of all crime risk contributions in that area
 * 3. Risk percentage = (area risk score / TOTAL risk across ALL areas) × 100
 *    — each area's label reflects its share of the overall crime burden
 * 4. Label thresholds: ≤3% Low, ≤8% Medium, ≤15% Concerning, ≤25% High, ≤40% Dangerous, >40% Extremely Dangerous
 *
 * Example:
 * Area A: 2 murders (weight 10 each) + 3 robberies (weight 4 each) = 32 points
 * Area B: 10 thefts (weight 2 each) = 20 points
 * Total risk = 52 points, so Area A = 62% (Dangerous), Area B = 38% (Dangerous)
 * If total across all areas = 320 points: Area A = 10% (Concerning), Area B = 6% (Medium)
 *
 * Adjust weights to reflect your assessment of crime severity.
 */

export const RISK_WEIGHTS = {
  // High severity crimes
  Murder: 10,
  Kidnapping: 9,
  'Sexual Assault': 8,

  // Medium-high severity crimes
  Shooting: 7,
  Assault: 6,
  'Home Invasion': 5,

  // Medium severity crimes
  Robbery: 4,
  Burglary: 3,

  // Lower severity crimes
  Theft: 2,
  Seizures: 1,
} as const;

/**
 * Type-safe access to risk weights
 */
export type RiskCrimeType = keyof typeof RISK_WEIGHTS;

/**
 * Get risk weight for a crime type (defaults to 1 if not found)
 */
export function getRiskWeight(crimeType: string): number {
  return RISK_WEIGHTS[crimeType as RiskCrimeType] ?? 1;
}
