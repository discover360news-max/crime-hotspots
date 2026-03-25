/**
 * Crime Type Thumbnail URL resolver.
 * Crime type images are manually curated WebP files in public/images/crime-types/.
 * The build-time PNG generator (generateAllCrimeTypeThumbnails) was retired Mar 2026
 * in favour of the manual curation workflow.
 */

import type { CrimeTypeLabel } from '../config/crimeSchema';

/** Slugify a crime type name for use as filename */
function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

/** Known crime types — used to validate URL paths. */
const KNOWN_TYPES: CrimeTypeLabel[] = [
  'Murder', 'Attempted Murder', 'Shooting', 'Robbery', 'Burglary', 'Theft',
  'Home Invasion', 'Kidnapping', 'Sexual Assault', 'Assault', 'Carjacking',
  'Domestic Violence', 'Arson', 'Extortion', 'Fraud', 'Seizures',
];

/**
 * Get the thumbnail URL for a given crime type.
 * Returns absolute URL suitable for og:image meta tag.
 */
export function getCrimeTypeThumbnailUrl(crimeType: string, baseUrl = 'https://crimehotspots.com'): string {
  const slug = slugify(crimeType);
  const knownSlugs = KNOWN_TYPES.map(slugify);
  const path = knownSlugs.includes(slug)
    ? `/images/crime-types/${slug}.webp`
    : '/images/crime-types/generic.webp';
  return `${baseUrl}${path}`;
}
