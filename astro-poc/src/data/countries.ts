/**
 * Countries configuration for Crime Hotspots
 * Currently focusing on Trinidad & Tobago only
 */

export interface CountrySection {
  id: string;
  label: string;
  description: string;
  url: string;
}

export interface Country {
  id: string;
  name: string;
  short: string;
  csvUrl: string;
  available: boolean;
  headlinesUrl?: string;
  dashboardUrl?: string;
  areasUrl?: string;
  sections?: CountrySection[];
}

export const COUNTRIES: Country[] = [
  {
    id: 'tt',
    name: 'Trinidad & Tobago',
    short: 'Nationwide coverage',
    csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTB-ktijzh1ySAy3NpfrcPEEEEs90q-0F0V8UxZxCTlTTbk4Qsa1cbLhlPwh38ie2_bGJYQX8n5vy8v/pub?gid=1749261532&single=true&output=csv",
    available: true,
    headlinesUrl: '/trinidad/headlines',
    dashboardUrl: '/trinidad/dashboard',
    areasUrl: '/trinidad/areas',
    sections: [
      { id: 'dashboard', label: 'Dashboard', description: 'Interactive map and crime statistics overview', url: '/trinidad/dashboard' },
      { id: 'headlines', label: 'Headlines', description: 'Latest crime news and reports', url: '/trinidad/headlines' },
      { id: 'archive', label: 'Archive', description: 'Historical crime data records', url: '/trinidad/archive' },
      { id: 'areas', label: 'Areas', description: 'Crime data by area and neighbourhood', url: '/trinidad/areas' },
      { id: 'compare', label: 'Compare', description: 'Year-over-year crime comparisons', url: '/trinidad/compare' },
      { id: 'statistics', label: 'Statistics', description: 'Detailed crime breakdowns and trends', url: '/trinidad/statistics' },
      { id: 'regions', label: 'Regions', description: 'Regional crime analysis', url: '/trinidad/regions' },
      { id: 'murder-count', label: 'Murder Count', description: 'Live murder count tracker', url: '/trinidad/murder-count' },
    ],
  },
  {
    id: 'gy',
    name: 'Guyana',
    short: 'Coming Soon',
    csvUrl: "",
    available: false,
    headlinesUrl: '/guyana/headlines',
    dashboardUrl: '/guyana/dashboard',
    areasUrl: '/guyana/areas',
  },
  {
    id: 'bb',
    name: 'Barbados',
    short: 'Coming Soon',
    csvUrl: "",
    available: false,
    headlinesUrl: '/barbados/headlines',
    dashboardUrl: '/barbados/dashboard',
    areasUrl: '/barbados/areas',
  },
  {
    id: 'jm',
    name: 'Jamaica',
    short: 'Coming Soon',
    csvUrl: "",
    available: false,
    headlinesUrl: '/jamaica/headlines',
    dashboardUrl: '/jamaica/dashboard',
    areasUrl: '/jamaica/areas',
  },
];

export const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw2vo5sahU-YNY5S-HbB9Ryga_4v68NcR58k1UjPkEXijvxptIqHoUFGVR3uVUeCpP_/exec";

/**
 * Get country by ID
 * Provides single source of truth for country names in breadcrumbs and UI
 */
export function getCountryById(id: string): Country | undefined {
  return COUNTRIES.find(country => country.id === id);
}

/**
 * Get country name by ID
 * Convenience function for breadcrumbs
 */
export function getCountryName(id: string): string {
  const country = getCountryById(id);
  return country?.name || id.toUpperCase();
}
