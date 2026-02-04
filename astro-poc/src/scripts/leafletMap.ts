/**
 * Leaflet Map Initialization Script
 * Reusable Leaflet map functionality for crime data visualization
 * Handles map initialization, markers, clustering, and touch interactions
 */

/**
 * Format date for popup display
 * @param dateObj - Date object
 * @returns Formatted date string (e.g., "Jan 2, 2026")
 */
function formatPopupDate(dateObj: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[dateObj.getMonth()];
  const day = dateObj.getDate();
  const year = dateObj.getFullYear();
  return `${month} ${day}, ${year}`;
}

interface Crime {
  date: string;
  headline: string;
  crimeType: string;
  street: string;
  area: string;
  region: string;
  url: string;
  source: string;
  latitude: number;
  longitude: number;
  summary: string;
  slug: string;
  dateObj: Date;
  year: number;
  month: number;
  day: number;
}

// Crime type color mappings
const CRIME_COLORS: Record<string, string> = {
  'Murder': '#e11d48',
  'Shooting': '#dc2626',
  'Robbery': '#f97316',
  'Home Invasion': '#9333ea',
  'Theft': '#06b6d4',
  'Kidnapping': '#ec4899',
  'Sexual Assault': '#c026d3',
  'Assault': '#8b5cf6',
  'Seizures': '#3b82f6',
  'Burglary': '#eab308'
};

/**
 * Get crime type icon for map markers
 */
function getCrimeIcon(crimeType: string) {
  const color = CRIME_COLORS[crimeType] || '#64748b';

  return (window as any).L.divIcon({
    html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    className: 'custom-crime-marker',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    popupAnchor: [0, -6]
  });
}

/**
 * SVG icons for expand/collapse button
 */
const EXPAND_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`;

const COLLAPSE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`;

/**
 * Add expand/collapse control to the map
 */
function addExpandControl(map: any, containerId: string) {
  const L = (window as any).L;
  const container = document.getElementById(containerId)?.parentElement;
  if (!container || container.id !== 'mapContainer') return;

  let isExpanded = false;
  let resizeInterval: ReturnType<typeof setInterval> | null = null;

  const ExpandControl = L.Control.extend({
    options: { position: 'topright' },
    onAdd: function () {
      const div = L.DomUtil.create('div', 'leaflet-control-expand leaflet-bar');
      const link = L.DomUtil.create('a', '', div);
      link.href = '#';
      link.title = 'Expand map';
      link.innerHTML = EXPAND_ICON;
      link.setAttribute('role', 'button');
      link.setAttribute('aria-label', 'Expand map');

      L.DomEvent.disableClickPropagation(div);

      L.DomEvent.on(link, 'click', function (e: Event) {
        e.preventDefault();
        isExpanded = !isExpanded;

        if (isExpanded) {
          container.classList.add('map-expanded');
          link.innerHTML = COLLAPSE_ICON;
          link.title = 'Collapse map';
          link.setAttribute('aria-label', 'Collapse map');

          // Scroll map into view
          container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          container.classList.remove('map-expanded');
          link.innerHTML = EXPAND_ICON;
          link.title = 'Expand map';
          link.setAttribute('aria-label', 'Expand map');
        }

        // Progressive invalidateSize during transition to avoid grey tiles
        if (resizeInterval) clearInterval(resizeInterval);
        resizeInterval = setInterval(() => {
          map.invalidateSize({ animate: false });
        }, 50);

        // Clean up interval after transition ends
        const onTransitionEnd = () => {
          if (resizeInterval) {
            clearInterval(resizeInterval);
            resizeInterval = null;
          }
          map.invalidateSize({ animate: true });
          container.removeEventListener('transitionend', onTransitionEnd);
        };
        container.addEventListener('transitionend', onTransitionEnd);
      });

      return div;
    }
  });

  map.addControl(new ExpandControl());
}

/**
 * Initialize Leaflet map with crime markers
 * @param containerId - ID of the map container element
 * @param crimes - Array of crime data to display
 * @param config - Map configuration options
 */
export function initializeLeafletMap(
  containerId: string,
  crimes: Crime[],
  config: {
    center: [number, number];
    zoom: number;
    country: string;
    crimeDetailPath: string;
    onMapReady?: () => void;
  }
) {
  console.log('🗺️ Initializing Leaflet map...');

  // Load Leaflet scripts
  const leafletScript = document.createElement('script');
  leafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  leafletScript.onload = () => {
    // Load marker cluster plugin
    const clusterScript = document.createElement('script');
    clusterScript.src = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js';
    clusterScript.onload = () => initMap();
    document.head.appendChild(clusterScript);
  };
  document.head.appendChild(leafletScript);

  function initMap() {
    // Check if map is already initialized
    const mapContainer = document.getElementById(containerId);
    if (!mapContainer) {
      console.error(`❌ Map container #${containerId} not found`);
      return;
    }

    if ((mapContainer as any)._leaflet_id) {
      console.log('⚠️ Map already initialized, skipping');
      return;
    }

    const L = (window as any).L;

    // Initialize map
    const map = L.map(containerId, {
      dragging: true,
      scrollWheelZoom: false,
      tap: false  // Disable tap handler to prevent blocking touch scroll
    }).setView(config.center, config.zoom);

    // Force Leaflet to recalculate size (fixes gray tiles issue)
    map.invalidateSize();

    // Store map instance globally for external access
    (window as any).__leafletMapInstance = map;

    // Two-finger scroll/zoom implementation
    const mapDiv = document.getElementById(containerId)!;
    const hint = document.getElementById(`mapZoomHint${config.country}`);
    let touchCount = 0;
    let touchStartPos: { x: number; y: number } | null = null;
    let hintTimeout: NodeJS.Timeout | null = null;

    mapDiv.addEventListener('touchstart', (e: TouchEvent) => {
      touchCount = e.touches.length;
      touchStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };

      if (touchCount === 2) {
        map.dragging.enable();
        map.scrollWheelZoom.enable();
      } else if (touchCount === 1) {
        map.dragging.disable();
        map.scrollWheelZoom.disable();
      }
    }, { passive: true });

    mapDiv.addEventListener('touchmove', (e: TouchEvent) => {
      if (touchCount === 1 && touchStartPos && hint) {
        const deltaX = Math.abs(e.touches[0].clientX - touchStartPos.x);
        const deltaY = Math.abs(e.touches[0].clientY - touchStartPos.y);
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Only show hint if horizontal movement > vertical (trying to pan map, not scroll page)
        if (distance > 10 && deltaX > deltaY) {
          hint.style.opacity = '1';
          hint.style.pointerEvents = 'none';

          if (hintTimeout) clearTimeout(hintTimeout);
          hintTimeout = setTimeout(() => {
            hint.style.opacity = '0';
          }, 2000);
        }
      }
    }, { passive: true });

    mapDiv.addEventListener('touchend', () => {
      touchCount = 0;
      map.dragging.enable();
    }, { passive: true });

    // Add expand/collapse control
    addExpandControl(map, containerId);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 18
    }).addTo(map);

    // Create marker cluster group
    const markers = L.markerClusterGroup({
      chunkedLoading: true,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      maxClusterRadius: 50,
      iconCreateFunction: function(cluster: any) {
        const count = cluster.getChildCount();
        let size = 'small';
        if (count > 50) size = 'large';
        else if (count > 10) size = 'medium';

        return L.divIcon({
          html: `<div class="cluster-${size}">${count}</div>`,
          className: 'custom-cluster-icon',
          iconSize: L.point(40, 40)
        });
      }
    });

    // Add crime markers
    crimes.forEach(crime => {
      const latitude = Number(crime.latitude);
      const longitude = Number(crime.longitude);

      if (isNaN(latitude) || isNaN(longitude) || !isFinite(latitude) || !isFinite(longitude)) {
        return;
      }

      const marker = L.marker([latitude, longitude], {
        icon: getCrimeIcon(crime.crimeType)
      });

      // Get local name for area if available
      const areaAliases = (window as any).__areaAliases || {};
      const localName = areaAliases[crime.area];
      const areaDisplay = localName && localName !== crime.area
        ? `${crime.area} (${localName})`
        : crime.area;

      marker.bindPopup(`
        <div class="p-2">
          <div class="text-xs text-slate-500 mb-2">${formatPopupDate(crime.dateObj)}</div>
          <div class="text-xs bg-white/50 text-rose-600 mb-1">${crime.crimeType}</div>
          <div class="text-small font-bold text-slate-600 mb-4">${crime.headline}</div>
          <div class="text-xs text-slate-500 mb-1">${crime.street}</div>
          <div class="text-xs text-rose-600">${areaDisplay}</div>
          <button
            onclick="window.openCrimeDetailModal('${crime.slug}')"
            class="text-tiny text-rose-600 border border-rose-600 hover:bg-rose-600 hover:text-white active:bg-rose-700 transition px-3 py-1.5 rounded-lg mt-4 inline-block font-medium"
          >
            View Details
          </button>
        </div>
      `, { autoPanPaddingTopLeft: L.point(10, 50), autoPanPaddingBottomRight: L.point(10, 10) });
      markers.addLayer(marker);
    });

    map.addLayer(markers);

    // Store markers group globally for external access
    (window as any).__leafletMarkersGroup = markers;

    console.log('✅ Leaflet map initialized with', crimes.length, 'markers');

    // Call onMapReady callback if provided
    if (config.onMapReady) {
      config.onMapReady();
    }
  }
}

/**
 * Update map markers with filtered crime data
 * @param crimes - Filtered crimes array
 * @param crimeDetailPath - Path to crime detail pages
 */
export function updateLeafletMap(crimes: Crime[], crimeDetailPath: string) {
  const leafletMapInstance = (window as any).__leafletMapInstance;

  if (!leafletMapInstance) {
    console.warn('⚠️ Leaflet map not ready yet');
    return;
  }

  const L = (window as any).L;

  // Clear existing markers
  if ((window as any).__leafletMarkersGroup) {
    leafletMapInstance.removeLayer((window as any).__leafletMarkersGroup);
  }

  // Create new marker cluster group
  const leafletMarkersGroup = L.markerClusterGroup({
    chunkedLoading: true,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    maxClusterRadius: 50,
    iconCreateFunction: function(cluster: any) {
      const count = cluster.getChildCount();
      let size = 'small';
      if (count > 50) size = 'large';
      else if (count > 10) size = 'medium';

      return L.divIcon({
        html: `<div class="cluster-${size}">${count}</div>`,
        className: 'custom-cluster-icon',
        iconSize: L.point(40, 40)
      });
    }
  });

  // Add filtered crime markers
  crimes.forEach(crime => {
    const latitude = Number(crime.latitude);
    const longitude = Number(crime.longitude);

    if (isNaN(latitude) || isNaN(longitude) || !isFinite(latitude) || !isFinite(longitude)) {
      return;
    }

    const marker = L.marker([latitude, longitude], {
      icon: getCrimeIcon(crime.crimeType)
    });

    // Get local name for area if available
    const areaAliases = (window as any).__areaAliases || {};
    const localName = areaAliases[crime.area];
    const areaDisplay = localName && localName !== crime.area
      ? `${crime.area} (${localName})`
      : crime.area;

    marker.bindPopup(`
      <div class="p-2">
        <div class="text-xs text-slate-500 mb-2">${formatPopupDate(crime.dateObj)}</div>
        <div class="text-xs bg-white/50 text-rose-600 mb-1">${crime.crimeType}</div>
        <div class="text-h3 font-bold text-slate-600 mb-4">${crime.headline}</div>
        <div class="text-xs text-slate-500 mb-1">${crime.street}</div>
        <div class="text-xs text-rose-600">${areaDisplay}</div>
        <button
          onclick="window.openCrimeDetailModal('${crime.slug}')"
          class="text-tiny text-rose-600 border border-rose-600 hover:bg-rose-600 hover:text-white active:bg-rose-700 transition px-3 py-1.5 rounded-lg mt-4 inline-block font-medium"
        >
          View Details
        </button>
      </div>
    `, { autoPanPaddingTopLeft: L.point(10, 50), autoPanPaddingBottomRight: L.point(10, 10) });

    leafletMarkersGroup.addLayer(marker);
  });

  leafletMapInstance.addLayer(leafletMarkersGroup);

  // Store updated markers group globally
  (window as any).__leafletMarkersGroup = leafletMarkersGroup;

  console.log('✅ Leaflet map updated with', crimes.length, 'markers');
}
