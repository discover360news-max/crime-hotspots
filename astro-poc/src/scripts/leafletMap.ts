/**
 * Leaflet Map Initialization Script
 * Reusable Leaflet map functionality for crime data visualization
 * Handles map initialization, markers, clustering, and touch interactions
 */

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
    // Load fullscreen plugin first
    const fullscreenScript = document.createElement('script');
    fullscreenScript.src = 'https://cdn.jsdelivr.net/npm/leaflet.fullscreen@3.0.1/Control.FullScreen.js';
    fullscreenScript.onload = () => {
      // Then load marker cluster
      const clusterScript = document.createElement('script');
      clusterScript.src = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js';
      clusterScript.onload = () => initMap();
      document.head.appendChild(clusterScript);
    };
    document.head.appendChild(fullscreenScript);
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
      fullscreenControl: true
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

      marker.bindPopup(`
        <div class="p-2">
          <div class="text-xs text-slate-500 mb-2">${crime.date}</div>
          <div class="text-xs bg-white/50 text-rose-600 mb-1">${crime.crimeType}</div>
          <div class="text-h3 font-bold text-slate-600 mb-4">${crime.headline}</div>
          <div class="text-xs text-slate-500 mb-1">${crime.street}</div>
          <div class="text-xs text-rose-600">${crime.area}</div>
          <a href="${config.crimeDetailPath}${crime.slug}" class="text-tiny text-rose-600 hover:underline mt-4 inline-block">View Details →</a>
        </div>
      `);
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

    marker.bindPopup(`
      <div class="p-2">
        <div class="text-xs text-slate-500 mb-2">${crime.date}</div>
        <div class="text-xs bg-white/50 text-rose-600 mb-1">${crime.crimeType}</div>
        <div class="text-h3 font-bold text-slate-600 mb-4">${crime.headline}</div>
        <div class="text-xs text-slate-500 mb-1">${crime.street}</div>
        <div class="text-xs text-rose-600">${crime.area}</div>
        <a href="${crimeDetailPath}${crime.slug}" class="text-tiny text-rose-600 hover:underline mt-4 inline-block">View Details →</a>
      </div>
    `);

    leafletMarkersGroup.addLayer(marker);
  });

  leafletMapInstance.addLayer(leafletMarkersGroup);

  // Store updated markers group globally
  (window as any).__leafletMarkersGroup = leafletMarkersGroup;

  console.log('✅ Leaflet map updated with', crimes.length, 'markers');
}
