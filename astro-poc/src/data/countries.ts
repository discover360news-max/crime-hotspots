/**
 * Countries configuration for Crime Hotspots
 * Currently focusing on Trinidad & Tobago only
 */
import { routes } from '../config/routes';

export interface CountrySection {
  id: string;
  label: string;
  description: string;
  url: string;
  /** If true, shows in bottom tab bar. If false/undefined, shows in "More" menu */
  showInBottomNav?: boolean;
  /** Icon identifier for bottom nav (e.g., 'dashboard', 'headlines', 'areas') */
  icon?: string;
}

export interface Country {
  id: string;
  name: string;
  /** Flag emoji for country indicator UI */
  flag: string;
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
    flag: '\u{1F1F9}\u{1F1F9}',
    short: 'Nationwide coverage',
    csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTB-ktijzh1ySAy3NpfrcPEEEEs90q-0F0V8UxZxCTlTTbk4Qsa1cbLhlPwh38ie2_bGJYQX8n5vy8v/pub?gid=1749261532&single=true&output=csv",
    available: true,
    headlinesUrl: routes.trinidad.headlines,
    dashboardUrl: routes.trinidad.dashboard,
    areasUrl: routes.trinidad.areas,
    sections: [
      { id: 'dashboard', label: 'Dashboard', description: 'Interactive map and crime statistics overview', url: routes.trinidad.dashboard, showInBottomNav: true, icon: 'dashboard' },
      { id: 'headlines', label: 'Headlines', description: 'Latest crime news and reports', url: routes.trinidad.headlines, showInBottomNav: true, icon: 'headlines' },
      { id: 'areas', label: 'Areas', description: 'Crime data by area and neighbourhood', url: routes.trinidad.areas, showInBottomNav: true, icon: 'areas' },
      { id: 'archive', label: 'Archive', description: 'Historical crime data records', url: routes.trinidad.archive },
      { id: 'compare', label: 'Compare', description: 'Year-over-year crime comparisons', url: routes.trinidad.compare },
      { id: 'statistics', label: 'Statistics', description: 'Detailed crime breakdowns and trends', url: routes.trinidad.statistics },
      { id: 'regions', label: 'Regions', description: 'Regional crime analysis', url: routes.trinidad.regions },
      { id: 'murder-count', label: 'Murder Count', description: 'Live murder count tracker', url: routes.trinidad.murderCount },
    ],
  },
  {
    id: 'gy',
    name: 'Guyana',
    flag: '\u{1F1EC}\u{1F1FE}',
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
    flag: '\u{1F1E7}\u{1F1E7}',
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
    flag: '\u{1F1EF}\u{1F1F2}',
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

/**
 * Get sections for bottom nav (showInBottomNav: true)
 */
export function getBottomNavSections(countryId: string): CountrySection[] {
  const country = getCountryById(countryId);
  return country?.sections?.filter(s => s.showInBottomNav) || [];
}

/**
 * Get sections for "More" menu (showInBottomNav: false/undefined)
 */
export function getMoreMenuSections(countryId: string): CountrySection[] {
  const country = getCountryById(countryId);
  return country?.sections?.filter(s => !s.showInBottomNav) || [];
}
