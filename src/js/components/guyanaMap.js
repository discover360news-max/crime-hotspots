// src/js/components/guyanaMap.js
// Interactive SVG map of Guyana's 10 administrative regions

/**
 * Simplified SVG map of Guyana showing 10 administrative regions
 * Regions are clickable and trigger filtering in the dashboard
 */
export function createGuyanaMap(onRegionClick) {
  const container = document.createElement('div');
  container.className = 'guyana-map-container bg-white rounded-lg shadow-md p-4';

  container.innerHTML = `
    <div class="mb-4">
      <h3 class="text-lg font-semibold text-slate-800 text-center">Click a Region</h3>
      <p class="text-xs text-slate-500 text-center mt-1">Filter dashboard by administrative region</p>
    </div>

    <svg
      viewBox="0 0 400 600"
      class="w-full h-auto max-w-md mx-auto"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Interactive map of Guyana showing 10 administrative regions"
    >
      <defs>
        <style>
          .region {
            fill: #e0e7ff;
            stroke: #4338ca;
            stroke-width: 2;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          .region:hover {
            fill: #c7d2fe;
            stroke: #3730a3;
            stroke-width: 3;
          }
          .region.active {
            fill: #e11d48;
            stroke: #be123c;
          }
          .region-label {
            fill: #1e293b;
            font-size: 12px;
            font-weight: 600;
            pointer-events: none;
            text-anchor: middle;
          }
        </style>
      </defs>

      <!-- Region 1: Barima-Waini (Northwest) -->
      <path
        class="region"
        data-region="1"
        data-name="Barima-Waini"
        d="M 50,50 L 150,50 L 170,100 L 140,150 L 80,140 L 50,100 Z"
      />
      <text class="region-label" x="110" y="100">1</text>

      <!-- Region 2: Pomeroon-Supenaam (Northwest coast) -->
      <path
        class="region"
        data-region="2"
        data-name="Pomeroon-Supenaam"
        d="M 80,140 L 140,150 L 160,200 L 130,240 L 70,230 Z"
      />
      <text class="region-label" x="110" y="190">2</text>

      <!-- Region 3: Essequibo Islands-West Demerara (Central coast) -->
      <path
        class="region"
        data-region="3"
        data-name="Essequibo Islands-West Demerara"
        d="M 70,230 L 130,240 L 150,280 L 120,310 L 60,300 Z"
      />
      <text class="region-label" x="100" y="275">3</text>

      <!-- Region 4: Demerara-Mahaica (Georgetown - most populated) -->
      <path
        class="region"
        data-region="4"
        data-name="Demerara-Mahaica"
        d="M 120,310 L 150,280 L 190,290 L 200,330 L 170,360 L 130,350 Z"
      />
      <text class="region-label" x="160" y="325">4</text>
      <!-- Georgetown marker -->
      <circle cx="160" cy="315" r="4" fill="#e11d48" />

      <!-- Region 5: Mahaica-Berbice (East central coast) -->
      <path
        class="region"
        data-region="5"
        data-name="Mahaica-Berbice"
        d="M 170,360 L 200,330 L 240,340 L 250,380 L 220,410 L 180,400 Z"
      />
      <text class="region-label" x="210" y="370">5</text>

      <!-- Region 6: East Berbice-Corentyne (East coast - large) -->
      <path
        class="region"
        data-region="6"
        data-name="East Berbice-Corentyne"
        d="M 220,410 L 250,380 L 300,390 L 320,440 L 310,490 L 260,500 L 230,460 Z"
      />
      <text class="region-label" x="270" y="445">6</text>

      <!-- Region 7: Cuyuni-Mazaruni (Northwest interior - large) -->
      <path
        class="region"
        data-region="7"
        data-name="Cuyuni-Mazaruni"
        d="M 150,50 L 250,60 L 280,120 L 260,180 L 200,200 L 170,100 Z"
      />
      <text class="region-label" x="215" y="130">7</text>

      <!-- Region 8: Potaro-Siparuni (Central interior) -->
      <path
        class="region"
        data-region="8"
        data-name="Potaro-Siparuni"
        d="M 200,200 L 260,180 L 290,240 L 270,300 L 210,310 L 190,290 L 160,200 Z"
      />
      <text class="region-label" x="230" y="250">8</text>

      <!-- Region 9: Upper Takutu-Upper Essequibo (South - largest) -->
      <path
        class="region"
        data-region="9"
        data-name="Upper Takutu-Upper Essequibo"
        d="M 120,310 L 130,350 L 180,400 L 230,460 L 250,520 L 200,550 L 150,540 L 100,500 L 80,450 L 90,380 Z"
      />
      <text class="region-label" x="165" y="460">9</text>

      <!-- Region 10: Upper Demerara-Berbice (Central) -->
      <path
        class="region"
        data-region="10"
        data-name="Upper Demerara-Berbice"
        d="M 210,310 L 270,300 L 290,360 L 280,420 L 250,440 L 220,410 L 180,400 L 170,360 Z"
      />
      <text class="region-label" x="235" y="370">10</text>
    </svg>

    <!-- Legend -->
    <div class="mt-4 text-xs text-slate-600 space-y-1">
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 bg-indigo-200 border-2 border-indigo-600 rounded"></div>
        <span>Click region to filter data</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 bg-rose-600 border-2 border-rose-800 rounded"></div>
        <span>Active region filter</span>
      </div>
    </div>

    <!-- Active region display -->
    <div id="activeRegion" class="mt-3 p-2 bg-slate-50 rounded text-center hidden">
      <span class="text-sm font-medium text-slate-700">Filtering: </span>
      <span id="activeRegionName" class="text-sm font-semibold text-rose-600"></span>
      <button id="clearRegionFilter" class="ml-2 text-xs text-slate-500 hover:text-rose-600 underline">
        Clear filter
      </button>
    </div>
  `;

  // Set up event listeners
  const svg = container.querySelector('svg');
  const regions = svg.querySelectorAll('.region');
  const activeRegionDisplay = container.querySelector('#activeRegion');
  const activeRegionName = container.querySelector('#activeRegionName');
  const clearButton = container.querySelector('#clearRegionFilter');

  let currentActiveRegion = null;

  regions.forEach(region => {
    region.addEventListener('click', () => {
      const regionNumber = region.dataset.region;
      const regionName = region.dataset.name;

      // Remove active class from all regions
      regions.forEach(r => r.classList.remove('active'));

      // Add active class to clicked region
      region.classList.add('active');
      currentActiveRegion = regionNumber;

      // Show active region display
      activeRegionDisplay.classList.remove('hidden');
      activeRegionName.textContent = `Region ${regionNumber} - ${regionName}`;

      // Trigger callback
      if (onRegionClick) {
        onRegionClick(regionNumber, regionName);
      }
    });

    // Accessibility: keyboard support
    region.setAttribute('tabindex', '0');
    region.setAttribute('role', 'button');
    region.setAttribute('aria-label', `Filter by ${region.dataset.name}`);

    region.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        region.click();
      }
    });
  });

  // Clear filter button
  clearButton.addEventListener('click', () => {
    regions.forEach(r => r.classList.remove('active'));
    activeRegionDisplay.classList.add('hidden');
    currentActiveRegion = null;

    // Trigger clear callback
    if (onRegionClick) {
      onRegionClick(null, null);
    }
  });

  return {
    element: container,
    clearFilter: () => clearButton.click(),
    getActiveRegion: () => currentActiveRegion
  };
}

/**
 * Region name mapping for filtering
 */
export const GUYANA_REGIONS = {
  '1': 'Barima-Waini',
  '2': 'Pomeroon-Supenaam',
  '3': 'Essequibo Islands-West Demerara',
  '4': 'Demerara-Mahaica',
  '5': 'Mahaica-Berbice',
  '6': 'East Berbice-Corentyne',
  '7': 'Cuyuni-Mazaruni',
  '8': 'Potaro-Siparuni',
  '9': 'Upper Takutu-Upper Essequibo',
  '10': 'Upper Demerara-Berbice'
};
