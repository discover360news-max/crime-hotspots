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
];

export const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbysi5VEpdS2nL9Ci9BWTn0ydXWA_IdR7j_3MR_EW5uK92N62xbt5OB0sKu2wMLGhkb7/exec";
