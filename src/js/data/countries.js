// src/js/data/countries.js

/**
 * All available countries - Master list
 */
const ALL_COUNTRIES = [
  {
    id: 'tt',
    name: 'Trinidad & Tobago',
    short: 'Nationwide coverage',
    flag: '🇹🇹',
    dashboard: '/dashboard-trinidad.html',
    csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTB-ktijzh1ySAy3NpfrcPEEEEs90q-0F0V8UxZxCTlTTbk4Qsa1cbLhlPwh38ie2_bGJYQX8n5vy8v/pub?gid=1749261532&single=true&output=csv",
    available: true,
    image: '/assets/images/trinidad.jpg',
    headlinesSlug: 'trinidad-and-tobago',
  },
  {
    id: 'gy',
    name: 'Guyana',
    short: 'Nationwide coverage',
    flag: '🇬🇾',
    dashboard: '/dashboard-guyana.html',
    csvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRLuFajWrjyJk-LaZhN9SkSMMEvWcH74PHYzDJ03su3oGu_9W--2O7aUJ3_6Eul6BVUay1Gez-wWk3H/pub?gid=1749261532&single=true&output=csv',
    available: true,
    image: '/assets/images/guyana.jpg',
    headlinesSlug: 'guyana',
  },
  {
    id: 'bdos',
    name: 'Barbados',
    short: 'Coming Soon',
    flag: '🇧🇧',
    dashboard: '',
    csvUrl: '',
    available: false,
    image: '/assets/images/barbados.jpg',
    headlinesSlug: 'barbados',
  }
  // You can easily add more countries here later
];

/**
 * Get the country filter from build-time environment variable
 * Supports: 'all', 'guyana', 'trinidad'
 */
const COUNTRY_FILTER = import.meta.env.VITE_COUNTRY_FILTER || 'all';

/**
 * Exported countries list - filtered based on VITE_COUNTRY_FILTER environment variable
 *
 * Usage:
 * - Default build: shows all countries
 * - VITE_COUNTRY_FILTER=guyana: shows only Guyana
 * - VITE_COUNTRY_FILTER=trinidad: shows only Trinidad & Tobago
 */
export const COUNTRIES = (() => {
  if (COUNTRY_FILTER === 'guyana') {
    return ALL_COUNTRIES.filter(c => c.id === 'gy');
  }
  if (COUNTRY_FILTER === 'trinidad') {
    return ALL_COUNTRIES.filter(c => c.id === 'tt');
  }
  // Default: show all countries
  return ALL_COUNTRIES;
})();

/**
 * Helper to check if site is country-specific
 */
export const isCountrySpecific = () => COUNTRY_FILTER !== 'all';

/**
 * Get the active country filter name (for branding)
 */
export const getCountryFilterName = () => {
  const country = COUNTRIES[0];
  return country ? country.name : 'Caribbean';
};
