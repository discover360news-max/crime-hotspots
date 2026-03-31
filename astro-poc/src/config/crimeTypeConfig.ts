/**
 * Crime Type Configuration
 *
 * Controls how victim counts are handled for different crime types.
 *
 * useVictimCount Rules:
 * - true: Multiply PRIMARY crime type by victimCount (e.g., double murder = 2)
 * - false: Count as 1 incident regardless of victim count
 *
 * IMPORTANT: Victim count ONLY applies to PRIMARY crime type.
 * Related crimes ALWAYS count as +1 (incident-based).
 *
 * Example:
 * - Primary: Murder, victimCount: 3, Related: [Shooting, Robbery]
 * - Stats: Murder +3, Shooting +1, Robbery +1
 *
 * To enable/disable victim counting for a crime type:
 * Just change useVictimCount to true/false - no code changes needed!
 *
 * EXHAUSTIVENESS: Typed as Record<CrimeTypeLabel, ...> so TypeScript errors
 * at `npm run check` time if any crime type from crimeSchema.ts is missing here.
 */

import type { CrimeTypeLabel } from './crimeSchema';

export const CRIME_TYPE_CONFIG: Record<CrimeTypeLabel, { useVictimCount: boolean; hasVictims?: boolean }> = {
  // Victim-count crimes (count each victim for PRIMARY crime only)
  Murder: { useVictimCount: true },
  'Attempted Murder': { useVictimCount: true },
  Assault: { useVictimCount: true },
  'Sexual Assault': { useVictimCount: true },
  Kidnapping: { useVictimCount: true },
  Robbery: { useVictimCount: true },
  Shooting: { useVictimCount: true },

  Carjacking: { useVictimCount: true },
  'Domestic Violence': { useVictimCount: true },

  // Incident-count crimes (always count as 1 incident)
  Extortion: { useVictimCount: false },
  Fraud: { useVictimCount: false },
  Arson: { useVictimCount: false },
  Burglary: { useVictimCount: false },
  'Home Invasion': { useVictimCount: false },
  Seizures: { useVictimCount: false, hasVictims: false },
  Theft: { useVictimCount: false },
};

/**
 * Type-safe access to crime type config.
 * Alias of CrimeTypeLabel — kept for call-site compatibility.
 */
export type CrimeType = CrimeTypeLabel;

/**
 * Helper to check if a crime type uses victim count
 */
export function usesVictimCount(crimeType: string): boolean {
  return CRIME_TYPE_CONFIG[crimeType as CrimeType]?.useVictimCount ?? false;
}

/**
 * Returns false for crime types that have no victims (e.g. Seizures).
 * Used to exclude these from victim totals instead of counting them as 1.
 */
export function crimeHasVictims(crimeType: string): boolean {
  return CRIME_TYPE_CONFIG[crimeType as CrimeType]?.hasVictims !== false;
}
