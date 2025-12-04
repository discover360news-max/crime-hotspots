// src/js/headlines-trinidad.js
// Barbados headlines page

import { initHeadlinesPage } from './components/headlinesPage.js';

// Barbados CSV URL
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT6y1Btbcvj2U1hlQD4-AMiOLDx-NgZc3IVYxXWYGb88vWs8D1EMWU3-BYxwy1fEAw9IqGiv8-KokeO/pub?gid=1749261532&single=true&output=csv";

// Initialize headlines page
initHeadlinesPage(CSV_URL);
