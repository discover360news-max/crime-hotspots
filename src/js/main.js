// src/js/main.js
// --- COMPLETE, CORRECTED FILE ---

import { initDashboardPanel } from './components/dashboardPanel.js';
import { COUNTRIES } from './data/countries.js';

// === DOM Helper ===
const el = (sel) => document.querySelector(sel);

// Create a single country card element
function createCountryCard(country, index) { // <-- Takes 'index'
  const cardButton = document.createElement('button');
  
  // Base classes for all cards (non-conditional presentation/transition)
  const baseClasses = `
    group block w-40 sm:w-48 rounded-2xl shadow-md overflow-hidden
    transition-all duration-500 transform 
  `;
  
  let dynamicClasses;

  if (country.available) {
    // Available cards: Add hover effects (scale/zoom & shadow), animation, and active styling
    dynamicClasses = `
      bg-white hover:shadow-lg focus:ring-4 focus:ring-rose-400
      hover:scale-125 cursor-pointer
      opacity-0 animate-fadeInCard
    `;
    cardButton.style.animationDelay = `${index * 120}ms`; // Apply sequential delay
  } else {
    // Unavailable cards: Apply static 40% opacity and disabled styling (no hover/zoom)
    dynamicClasses = 'bg-slate-100 opacity-40 cursor-not-allowed'; 
  }

  cardButton.className = baseClasses + dynamicClasses;

  // Card HTML structure (square and neat)
  cardButton.innerHTML = `
    <div class="flex flex-col items-center">
      <div class="relative w-full aspect-square overflow-hidden bg-slate-100 flex items-center justify-center">
        <img
          src="${country.image || '../assets/images/placeholder.jpg'}"
          alt="${country.name} image"
          class="w-full h-full object-cover object-center"
        />
        ${
          !country.available
            ? `<span class="absolute top-2 right-2 text-[10px] bg-rose-600 text-white px-2 py-[2px] rounded-full shadow">
                Coming Soon
              </span>`
            : ''
        }
      </div>
      <div class="mt-2 text-center bg-white w-full py-2">
        <h3 class="text-sm font-semibold">${country.flag} ${country.name}</h3>
        <p class="mt-1 text-xs text-slate-500">${country.short}</p>
      </div>
    </div>
  `;

  // Attach the click handler only if available
  if (country.available) {
    cardButton.addEventListener('click', () => {
      dashboard.loadDashboard(country.dashboard, country.name, country.headlinesSlug);
    });
  }

  return cardButton;
}

// === Initialize ===
let dashboard;

function renderGrid() {
  const grid = el('#countryGrid');
  grid.innerHTML = '';

  COUNTRIES.forEach((country, index) => {
    
    // --- THIS IS THE CORRECTED LINE ---
    // We pass 'index' now, not a callback.
    const card = createCountryCard(country, index);
    
    // This line was already correct in your file, but was
    // moved inside createCountryCard for simplicity.
    // We'll keep it as you had it to be safe.
    grid.appendChild(card);
  });

  requestAnimationFrame(() => {
    grid.style.transition = 'opacity 0.4s ease-out';
    grid.style.opacity = '1';
  });
} // <-- The extra '}' error was near here

document.addEventListener('DOMContentLoaded', () => {
  dashboard = initDashboardPanel();
  renderGrid();
});