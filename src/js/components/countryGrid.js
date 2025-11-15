// src/js/components/countryGrid.js
import { COUNTRIES } from '../data/countries.js';

const el = (sel) => document.querySelector(sel); // Helper for DOM selection

// Create a single country card element
function createCountryCard(country, index, dashboard) {
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

// Render all cards into #countryGrid
export function renderCountryGrid(dashboard) {
  const grid = el('#countryGrid');
  if (!grid) {
    console.warn('countryGrid container not found');
    return;
  }

  // Remove skeleton loading cards
  const skeletons = grid.querySelectorAll('.skeleton-card');
  skeletons.forEach(skeleton => skeleton.remove());

  // Clear any previous content
  grid.innerHTML = '';

  COUNTRIES.forEach((country, index) => {
    // Pass index and dashboard to createCard
    const card = createCountryCard(country, index, dashboard);
    grid.appendChild(card);
  });
}
