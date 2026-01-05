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
 * 3. Risk percentage = (area risk score / max risk score across all areas) × 100
 * 4. Bar color based on percentage: 0-33% green, 34-66% yellow, 67-100% red
 *
 * Example:
 * Area A: 2 murders (weight 10 each) + 3 robberies (weight 4 each) = (2×10) + (3×4) = 32 points
 * Area B: 10 thefts (weight 2 each) = 10×2 = 20 points
 * Max risk = 32, so Area A = 100% (red), Area B = 62.5% (yellow)
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
