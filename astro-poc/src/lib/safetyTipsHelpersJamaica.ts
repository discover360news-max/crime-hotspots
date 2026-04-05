/**
 * Safety Tips Helpers — Jamaica
 * Jamaica-typed equivalents of safetyTipsHelpers.ts.
 * Pure utility functions (normalizedCrimeType, slugifyCategory) are re-exported from the T&T module.
 */

import type { CollectionEntry } from 'astro:content';

// Re-export pure helpers — no collection-specific types
export { normalizedCrimeType, slugifyCategory } from './safetyTipsHelpers';

/** Sort Jamaica tips: area-match first, national second. Preserves order within groups. */
export function sortJamaicaTipsByAreaRelevance(
  tips: CollectionEntry<'tipsJamaica'>[],
  crimeArea: string
): CollectionEntry<'tipsJamaica'>[] {
  const area = crimeArea.trim().toLowerCase();

  const areaMatch = tips.filter(t => t.data.area.trim().toLowerCase() === area);
  const national = tips.filter(t => !t.data.area.trim());
  const other = tips.filter(
    t => t.data.area.trim() && t.data.area.trim().toLowerCase() !== area
  );

  return [...areaMatch, ...national, ...other];
}
