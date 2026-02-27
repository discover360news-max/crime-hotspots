/**
 * Safety Tips Helpers
 * Utility functions for matching crime types to tip categories and sorting tips by area relevance.
 */

import type { CollectionEntry } from 'astro:content';

export type TipCategory =
  | 'Robbery' | 'Carjacking' | 'Home Invasion' | 'ATM Crime' | 'Online Scam'
  | 'Kidnapping' | 'Sexual Violence' | 'Fraud' | 'Assault' | 'Other';

/** Map CSV crime type strings to tip category enum values */
export function normalizedCrimeType(crimeType: string): TipCategory {
  if (!crimeType) return 'Other';
  const type = crimeType.trim().toLowerCase();

  if (type === 'robbery' || type === 'theft' || type === 'burglary') return 'Robbery';
  if (type === 'carjacking') return 'Carjacking';
  if (type === 'home invasion') return 'Home Invasion';
  if (type === 'kidnapping') return 'Kidnapping';
  if (type === 'sexual assault') return 'Sexual Violence';
  if (type === 'assault' || type === 'shooting') return 'Assault';
  if (type === 'fraud') return 'Fraud';
  if (type === 'murder') return 'Assault'; // Murder → Assault prevention tips (closest match)

  return 'Other';
}

/** Slugify a category or context string for URL path segments */
export function slugifyCategory(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

/** Sort tips: area-match first, national second. Preserves order within groups. */
export function sortTipsByAreaRelevance(
  tips: CollectionEntry<'tips'>[],
  crimeArea: string
): CollectionEntry<'tips'>[] {
  const area = crimeArea.trim().toLowerCase();

  const areaMatch = tips.filter(t => t.data.area.trim().toLowerCase() === area);
  const national = tips.filter(t => !t.data.area.trim());
  const other = tips.filter(
    t => t.data.area.trim() && t.data.area.trim().toLowerCase() !== area
  );

  return [...areaMatch, ...national, ...other];
}
