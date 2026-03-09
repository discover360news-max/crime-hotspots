/**
 * Risk Weight Configuration
 *
 * Defines crime severity weights used to calculate weighted risk scores per region.
 * Higher weights = higher severity contribution to the score.
 * Derived from CRIME_SEVERITY_MAP in crimeSchema.ts — do not edit values here directly.
 *
 * How it works (Top Regions card):
 * 1. Each crime's weighted score = weight × victimCount (murder only; all others × 1)
 * 2. Region's total weighted score = sum of all crime weighted scores in that region
 * 3. Region's share = (regionWeightedScore / nationalTotalWeightedScore) × 100
 * 4. Risk label is based on that share — self-calibrating, no hardcoded absolute thresholds:
 *    < 3%  = Low
 *    < 8%  = Medium
 *    < 15% = Concerning
 *    < 25% = High
 *    < 40% = Dangerous
 *    ≥ 40% = Extremely Dangerous
 *
 * Example (10 active regions, ~equal crime):
 * Each region ≈ 10% share → all "Concerning"
 * If one region dominates at 35% → "Dangerous"; the rest score proportionally lower.
 *
 * Full methodology: docs/guides/RISK-SCORING-METHODOLOGY.md
 */

import { CRIME_SEVERITY_MAP } from './crimeSchema';

export const RISK_WEIGHTS: Record<string, number> = CRIME_SEVERITY_MAP;

/**
 * Get risk weight for a crime type (defaults to 1 if not found)
 */
export function getRiskWeight(crimeType: string): number {
  return RISK_WEIGHTS[crimeType] ?? 1;
}
