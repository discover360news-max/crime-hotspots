// src/js/data/countries.js
export const COUNTRIES = [
  {
    id: 'tt',
    name: 'Trinidad & Tobago',
    short: 'Nationwide coverage',
    flag: '🇹🇹',
    dashboard: 'https://lookerstudio.google.com/embed/reporting/7a34f57b-4fdd-4dd9-adfa-001b5b5ca072/page/LyPbF',
    csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTB-ktijzh1ySAy3NpfrcPEEEEs90q-0F0V8UxZxCTlTTbk4Qsa1cbLhlPwh38ie2_bGJYQX8n5vy8v/pub?gid=1749261532&single=true&output=csv",
    available: true,
    image: './src/assets/images/trinidad.jpg',
    headlinesSlug: 'trinidad-and-tobago',
  },
  {
    id: 'gy',
    name: 'Guyana',
    short: 'Nationwide coverage',
    flag: '🇬🇾',
    dashboard: 'https://lookerstudio.google.com/embed/reporting/da8269b7-4987-4bbc-9206-ca5406b8ef97/page/LyPbF',
    csvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRLuFajWrjyJk-LaZhN9SkSMMEvWcH74PHYzDJ03su3oGu_9W--2O7aUJ3_6Eul6BVUay1Gez-wWk3H/pub?gid=1749261532&single=true&output=csv',
    available: true,
    image: './src/assets/images/guyana.jpg',
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
    image: './src/assets/images/barbados.jpg',
    headlinesSlug: 'barbados',
  }
  // You can easily add more countries here later
];
