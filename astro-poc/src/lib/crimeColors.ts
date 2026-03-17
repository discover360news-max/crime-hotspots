/**
 * Crime Type Color Mappings
 * Reusable across all components
 *
 * EXHAUSTIVENESS: Typed as Record<CrimeTypeLabel, ...> so TypeScript errors
 * at `npm run check` time if any crime type from crimeSchema.ts is missing here.
 */

import type { CrimeTypeLabel } from '../config/crimeSchema';

export const CRIME_COLORS: Record<CrimeTypeLabel, { tailwind: string; hex: string }> = {
  'Murder': {
    tailwind: 'bg-rose-600',
    hex: '#e11d48'
  },
  'Attempted Murder': {
    tailwind: 'bg-rose-500',
    hex: '#f43f5e'
  },
  'Shooting': {
    tailwind: 'bg-red-600',
    hex: '#dc2626'
  },
  'Robbery': {
    tailwind: 'bg-orange-500',
    hex: '#f97316'
  },
  'Burglary': {
    tailwind: 'bg-yellow-500',
    hex: '#eab308'
  },
  'Theft': {
    tailwind: 'bg-cyan-500',
    hex: '#06b6d4'
  },
  'Home Invasion': {
    tailwind: 'bg-purple-600',
    hex: '#9333ea'
  },
  'Kidnapping': {
    tailwind: 'bg-pink-600',
    hex: '#ec4899'
  },
  'Sexual Assault': {
    tailwind: 'bg-fuchsia-600',
    hex: '#c026d3'
  },
  'Assault': {
    tailwind: 'bg-violet-500',
    hex: '#8b5cf6'
  },
  'Carjacking': {
    tailwind: 'bg-amber-500',
    hex: '#f59e0b'
  },
  'Domestic Violence': {
    tailwind: 'bg-rose-400',
    hex: '#fb7185'
  },
  'Arson': {
    tailwind: 'bg-orange-600',
    hex: '#ea580c'
  },
  'Extortion': {
    tailwind: 'bg-emerald-600',
    hex: '#059669'
  },
  'Fraud': {
    tailwind: 'bg-teal-500',
    hex: '#14b8a6'
  },
  'Seizures': {
    tailwind: 'bg-blue-500',
    hex: '#3b82f6'
  },
};

export const DEFAULT_CRIME_COLOR = {
  tailwind: 'bg-slate-500',
  hex: '#64748b'
};

/**
 * Get Tailwind class for crime type (for server-side rendering)
 */
export function getCrimeTailwindColor(crimeType: string): string {
  return CRIME_COLORS[crimeType as keyof typeof CRIME_COLORS]?.tailwind || DEFAULT_CRIME_COLOR.tailwind;
}

/**
 * Get hex color for crime type (for client-side inline styles)
 */
export function getCrimeHexColor(crimeType: string): string {
  return CRIME_COLORS[crimeType as keyof typeof CRIME_COLORS]?.hex || DEFAULT_CRIME_COLOR.hex;
}

/**
 * Get all available crime types
 */
export function getAllCrimeTypes(): string[] {
  return Object.keys(CRIME_COLORS);
}
