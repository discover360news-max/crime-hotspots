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
 */

export const CRIME_TYPE_CONFIG = {
  // Victim-count crimes (count each victim for PRIMARY crime only)
  Murder: { useVictimCount: true },
  Assault: { useVictimCount: true },
  'Sexual Assault': { useVictimCount: true },
  Kidnapping: { useVictimCount: true },
  Robbery: { useVictimCount: true },
  Shooting: { useVictimCount: true },

  // Incident-count crimes (always count as 1 incident)
  
  Burglary: { useVictimCount: false },
  'Home Invasion': { useVictimCount: false },
  Seizures: { useVictimCount: false },
  Theft: { useVictimCount: false },
} as const;

/**
 * Type-safe access to crime type config
 */
export type CrimeType = keyof typeof CRIME_TYPE_CONFIG;

/**
 * Helper to check if a crime type uses victim count
 */
export function usesVictimCount(crimeType: string): boolean {
  return CRIME_TYPE_CONFIG[crimeType as CrimeType]?.useVictimCount ?? false;
}
