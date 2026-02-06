/**
 * Crime Type Color Mappings
 * Reusable across all components
 */

export const CRIME_COLORS = {
  'Murder': {
    tailwind: 'bg-rose-600',
    hex: '#e11d48'
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
  'Seizures': {
    tailwind: 'bg-blue-500',
    hex: '#3b82f6'
  },
  'Vehicle Theft': {
    tailwind: 'bg-sky-500',
    hex: '#0ea5e9'
  }
} as const;

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
