/**
 * Countries configuration for Crime Hotspots
 * Currently focusing on Trinidad & Tobago only
 */

export interface Country {
  id: string;
  name: string;
  short: string;
  csvUrl: string;
  available: boolean;
  headlinesUrl?: string;
  dashboardUrl?: string;
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
  },
  {
    id: 'gy',
    name: 'Guyana',
    short: 'Coming Soon',
    csvUrl: "",
    available: false,
    headlinesUrl: '/guyana/headlines',
    dashboardUrl: '/guyana/dashboard',
  },
  {
    id: 'bb',
    name: 'Barbados',
    short: 'Coming Soon',
    csvUrl: "",
    available: false,
    headlinesUrl: '/barbados/headlines',
    dashboardUrl: '/barbados/dashboard',
  },
  {
    id: 'jm',
    name: 'Jamaica',
    short: 'Coming Soon',
    csvUrl: "",
    available: false,
    headlinesUrl: '/jamaica/headlines',
    dashboardUrl: '/jamaica/dashboard',
  },
];

export const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw2vo5sahU-YNY5S-HbB9Ryga_4v68NcR58k1UjPkEXijvxptIqHoUFGVR3uVUeCpP_/exec";
