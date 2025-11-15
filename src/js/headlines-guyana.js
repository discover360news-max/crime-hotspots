// src/js/headlines-guyana.js
// Guyana headlines page

import { initHeadlinesPage } from './components/headlinesPage.js';

// Guyana CSV URL
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRLuFajWrjyJk-LaZhN9SkSMMEvWcH74PHYzDJ03su3oGu_9W--2O7aUJ3_6Eul6BVUay1Gez-wWk3H/pub?gid=1749261532&single=true&output=csv";

// Initialize headlines page
initHeadlinesPage(CSV_URL);
