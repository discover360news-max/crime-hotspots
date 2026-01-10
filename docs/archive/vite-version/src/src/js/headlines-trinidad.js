// src/js/headlines-trinidad.js
// Trinidad & Tobago headlines page

import { initHeadlinesPage } from './components/headlinesPage.js';

// Trinidad & Tobago CSV URL
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTB-ktijzh1ySAy3NpfrcPEEEEs90q-0F0V8UxZxCTlTTbk4Qsa1cbLhlPwh38ie2_bGJYQX8n5vy8v/pub?gid=1749261532&single=true&output=csv";

// Initialize headlines page
initHeadlinesPage(CSV_URL);
