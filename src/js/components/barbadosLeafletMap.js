// src/js/components/barbadosLeafletMap.js
// Leaflet map with clustered crime markers for Barbados

import L from 'leaflet';
import 'leaflet.markercluster';
import { getCrimeColor } from '../config/crimeColors.js';

// Barbados center coordinates (Bridgetown)
const BARBADOS_CENTER = [13.1939, -59.5432];
const DEFAULT_ZOOM = 11;

// Reference coordinates for major Barbados locations (parishes and major areas)
const LOCATION_REFERENCES = {
  // Capital and major towns
  'Bridgetown': [13.1939, -59.5432],
  'Speightstown': [13.2378, -59.6433],
  'Oistins': [13.0667, -59.5333],
  'Holetown': [13.1833, -59.6333],

  // Parish centers
  'Christ Church': [13.0833, -59.5333],
  'St. Michael': [13.1000, -59.6167],
  'St. James': [13.1833, -59.6333],
  'St. Peter': [13.2667, -59.6500],
  'St. Lucy': [13.3167, -59.6500],
  'St. Andrew': [13.2833, -59.5667],
  'St. Joseph': [13.2167, -59.5500],
  'St. John': [13.1833, -59.5167],
  'St. George': [13.1500, -59.5500],
  'St. Philip': [13.1333, -59.4333],
  'St. Thomas': [13.1333, -59.5833],

  // Popular areas
  'Black Rock': [13.1667, -59.6333],
  'Six Cross Roads': [13.1333, -59.5833],
  'Holetown': [13.184863, -59.627725],
  'Bathsheba': [13.211278, -59.526519],

  // Christ Church area
  'Rockley/Worthing': [13.075882, -59.588959],
  'St Lawrence Gap': [13.067956, -59.567893],
  'Silver Sands': [13.049101, -59.518782],

  // St Philip area
  'Six Cross Roads': [13.117221, -59.475012],
  'Ocean City': [13.094417, -59.458485],
  'Belair': [13.117770, -59.439314],
  'Marley Vale': [13.160980, -59.435929],

  // St John area
  'Gall Hill': [13.181957, -59.503251],
  "Massiah Street": [13.162822, -59.485891],
  'New Castle': [13.192953, -59.495402],

  // St George area
  'Ellerton': [13.133898, -59.539360],
  'Market Hill': [13.156760, -59.558506],
  'Rowans': [13.136563, -59.567468],
  'Flat Rock': [13.146553, -59.571667],

  // St Michael
  'Richmond Gap': [13.112479, -59.617944],
  'Stanmore': [13.131788, -59.629034],
  'Lodge Hill': [13.134548, -59.611859],
  'Wildey': [13.095263, -59.583318],

  // St James
  'Oxnards': [13.148222, -59.631096],
  'Durants': [13.157059, -59.632793],
  'Holders Hill': [13.165876, -59.632279],
  'Forest Hills': [13.210894, -59.629851],

  // St Thomas
  'Welches Heights': [13.153764, -59.608069],
  'Allen View': [13.184782, -59.577114],
  'Rock Hall': [13.188220, -59.604913],
  'Porey Spring': [13.192463, -59.596649],
  'Hillaby': [13.208335, -59.590939],

  // St Joseph
  'Airy Hill': [13.191768, -59.555645],
  'Bowling Alley Hill': [13.194532, -59.542053],
  'Bathsheba': [13.211651, -59.525700],

  // St Andrew
  'Mose Bottom': [13.218272, -59.586581],
  'Belleplaine': [13.247779, -59.564423],
  'Babylon Rd': [13.248166, -59.569629],

  // St Peter
  'Mullins': [13.237058, -59.639999],
  'Douglas': [13.252379, -59.641360],
  'Mile and A Quarter': [13.266092, -59.620982],

  // St Lucy
  'Fustic': [13.282113, -59.642774],
  'Checker Hall Tenantry': [13.284857, -59.645651],
  'Bromefield': [13.297876, -59.643878],
  'Archers': [13.317122, -59.637613],
  'Coles Cave Rd': [13.321913, -59.635547],
  'Rock Hall': [13.301659, -59.604366],
  'Free Hill': [13.304031, -59.596154],
  'Pie Corner': [13.305419, -59.585543]
};

let mapInstance = null;
let markerClusterGroup = null;

/**
 * Create Leaflet map with clustered crime markers
 * @param {Array} crimeData - Array of crime records with Location (Plus Code), Headline, Crime Type, Date
 * @param {string|null} regionFilter - Optional region filter
 * @returns {Object} Map instance and methods
 */
export function createBarbadosLeafletMap(crimeData, regionFilter = null) {
  const container = document.createElement('div');
  container.className = 'leaflet-map-container bg-white rounded-lg shadow-md overflow-hidden';
  container.innerHTML = `
    <div class="p-4 border-b border-gray-200 flex items-center justify-between">
      <div>
        <h3 class="text-h3 font-semibold text-slate-700">Incidents Map</h3>
        <p class="text-tiny text-gray-600 mt-1">Use two fingers to move map • Click markers for details</p>
      </div>
      <button id="resetMapViewBarbados" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-tiny font-medium text-slate-700 transition flex items-center gap-1">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Reset View
      </button>
    </div>
    <div class="relative">
      <div id="barbadosLeafletMap" style="height: 500px; width: 100%;"></div>
      <!-- Pan instruction overlay (shown on single finger touch) -->
      <div id="mapZoomHintBarbados" class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 pointer-events-none transition-opacity duration-300" style="z-index: 1000;">
        <div class="bg-white rounded-lg px-6 py-4 shadow-xl max-w-xs text-center">
          <p class="text-small font-semibold text-slate-900">Use two fingers to move map</p>
          <p class="text-tiny text-slate-600 mt-1">One finger scrolls the page</p>
        </div>
      </div>
    </div>
  `;

  // Wait for DOM insertion
  setTimeout(() => {
    const mapDiv = container.querySelector('#barbadosLeafletMap');
    const zoomHint = container.querySelector('#mapZoomHintBarbados');
    const resetButton = container.querySelector('#resetMapViewBarbados');
    if (!mapDiv) return;

    // Create map - disable dragging by default (single finger should scroll page, not pan map)
    mapInstance = L.map('barbadosLeafletMap', {
      dragging: false, // Disabled - only enable on two-finger touch
      scrollWheelZoom: true, // Allow mouse wheel zoom on desktop
      touchZoom: true, // Two-finger pinch zoom
      doubleClickZoom: true,
      boxZoom: true,
      tap: true
    }).setView(BARBADOS_CENTER, DEFAULT_ZOOM);

    // Track touch count and movement for enabling/disabling dragging
    let touchCount = 0;
    let hintTimeout;
    let touchStartPos = null;
    let hasMoved = false;

    // On touch start, count fingers and track position
    mapDiv.addEventListener('touchstart', function(e) {
      touchCount = e.touches.length;
      hasMoved = false;

      if (touchCount === 2) {
        // Two fingers - enable map dragging and hide any hint
        mapInstance.dragging.enable();
        if (zoomHint) {
          zoomHint.classList.remove('opacity-100');
          zoomHint.classList.add('opacity-0');
        }
      } else if (touchCount === 1) {
        // One finger - disable map dragging (let page scroll)
        mapInstance.dragging.disable();
        // Track starting position but don't show hint yet (user might just be tapping)
        touchStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }, { passive: true });

    // On touch move, detect if user is trying to drag with one finger
    mapDiv.addEventListener('touchmove', function(e) {
      if (touchCount === 1 && touchStartPos) {
        const currentPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        const distance = Math.sqrt(
          Math.pow(currentPos.x - touchStartPos.x, 2) +
          Math.pow(currentPos.y - touchStartPos.y, 2)
        );

        // If user has moved more than 10px with one finger, they're trying to pan
        if (distance > 10 && !hasMoved) {
          hasMoved = true;

          // Show hint - user is trying to pan with one finger
          if (zoomHint) {
            zoomHint.classList.remove('opacity-0');
            zoomHint.classList.add('opacity-100');

            clearTimeout(hintTimeout);
            hintTimeout = setTimeout(() => {
              zoomHint.classList.remove('opacity-100');
              zoomHint.classList.add('opacity-0');
            }, 2000);
          }
        }
      }
    }, { passive: true });

    // On touch end, disable dragging and reset tracking
    mapDiv.addEventListener('touchend', function(e) {
      if (e.touches.length === 0) {
        mapInstance.dragging.disable();
        touchStartPos = null;
        hasMoved = false;
      }
    }, { passive: true });

    // On desktop, enable dragging with mouse
    mapDiv.addEventListener('mouseenter', function() {
      mapInstance.dragging.enable();
    });

    mapDiv.addEventListener('mouseleave', function() {
      // Keep enabled for mouse interactions
    });

    // Reset view button
    if (resetButton) {
      resetButton.addEventListener('click', () => {
        mapInstance.setView(BARBADOS_CENTER, DEFAULT_ZOOM);
      });
    }

    // Add grey tile layer (CartoDB Positron - clean grey style)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(mapInstance);

    // Create marker cluster group
    markerClusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      maxClusterRadius: 50,
      iconCreateFunction: function(cluster) {
        const count = cluster.getChildCount();
        let size = 'small';
        if (count > 50) size = 'large';
        else if (count > 10) size = 'medium';

        return L.divIcon({
          html: `<div class="cluster-marker cluster-${size}">${count}</div>`,
          className: 'marker-cluster',
          iconSize: L.point(40, 40)
        });
      }
    });

    // Add markers
    addMarkersToMap(crimeData, regionFilter);

    // Add cluster group to map
    mapInstance.addLayer(markerClusterGroup);
  }, 100);

  return {
    element: container,
    updateMarkers: (newData, newRegionFilter) => {
      if (markerClusterGroup) {
        markerClusterGroup.clearLayers();
        addMarkersToMap(newData, newRegionFilter);
      }
    },
    destroy: () => {
      if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
      }
    }
  };
}

/**
 * Add crime markers to the map
 */
function addMarkersToMap(crimeData, regionFilter) {
  if (!markerClusterGroup) return;

  // Filter data if region specified
  let filteredData = crimeData;
  if (regionFilter) {
    filteredData = crimeData.filter(record =>
      record.Region && record.Region.trim() === regionFilter.trim()
    );
  }

  let successCount = 0;
  let failCount = 0;

  // Debug: Log first record to see column names
  if (filteredData.length > 0) {
    console.log('First record columns:', Object.keys(filteredData[0]));
    console.log('First record Latitude:', filteredData[0].Latitude);
    console.log('First record Longitude:', filteredData[0].Longitude);
  }

  filteredData.forEach(record => {
    const location = record.Location;
    const headline = record.Headline || 'No headline';
    const crimeType = record['Crime Type'] || 'Other';
    const date = record.Date || 'Unknown date';

    // Only use Latitude and Longitude columns (K and L)
    // No Plus Code fallback - we have accurate coordinates now
    if (!record.Latitude || !record.Longitude) {
      failCount++;
      return; // Skip records without lat/lng
    }

    const lat = parseFloat(record.Latitude);
    const lng = parseFloat(record.Longitude);

    if (isNaN(lat) || isNaN(lng)) {
      failCount++;
      console.warn(`Invalid Lat/Lng: ${record.Latitude}, ${record.Longitude}`);
      return;
    }

    // Now we have valid lat/lng coordinates
    try {

      // Get color for crime type
      const color = getCrimeColor(crimeType);

      // Create custom marker icon
      const markerIcon = L.divIcon({
        className: 'crime-marker',
        html: `<div class="crime-marker-pin" style="background-color: ${color};"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12]
      });

      // Create marker
      const marker = L.marker([lat, lng], { icon: markerIcon });

      // Create popup content
      const popupContent = `
        <div class="crime-popup">
          <div class="crime-popup-header" style="border-left: 4px solid ${color};">
            <strong class="text-sm font-semibold text-gray-900">${crimeType}</strong>
          </div>
          <div class="crime-popup-body">
            <p class="text-xs text-gray-700 mb-2">${headline}</p>
            <p class="text-xs text-gray-500">
              <span class="font-medium">Date:</span> ${date}
            </p>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 250,
        className: 'crime-marker-popup'
      });

      // Add marker to cluster group
      markerClusterGroup.addLayer(marker);
      successCount++;
    } catch (error) {
      failCount++;
      console.warn(`Failed to create marker: ${location}`, error);
    }
  });

  console.log(`Markers added: ${successCount} successful, ${failCount} failed out of ${filteredData.length} total records`);
}

/**
 * Get CSS for Leaflet map styling
 * Should be injected into the page
 */
export function getLeafletMapStyles() {
  return `
    /* Leaflet Map Custom Styles */

    /* Fix z-index to prevent map from overlapping mobile tray (z-50) and overlay (z-40) */
    .leaflet-map-container {
      position: relative;
      z-index: 1 !important;
    }

    .leaflet-container,
    .leaflet-pane,
    .leaflet-map-pane {
      z-index: 1 !important;
    }

    .leaflet-control-container {
      z-index: 30 !important;
    }

    .leaflet-popup-pane {
      z-index: 35 !important;
    }

    .leaflet-tooltip-pane {
      z-index: 32 !important;
    }

    .crime-marker-pin {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }

    .marker-cluster {
      background: transparent;
    }

    .cluster-marker {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: rgba(225, 29, 72, 0.6);
      color: white;
      font-weight: bold;
      font-size: 14px;
      border: 3px solid rgba(255, 255, 255, 0.8);
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }

    .cluster-marker.cluster-medium {
      width: 50px;
      height: 50px;
      font-size: 16px;
      background-color: rgba(225, 29, 72, 0.7);
    }

    .cluster-marker.cluster-large {
      width: 60px;
      height: 60px;
      font-size: 18px;
      background-color: rgba(225, 29, 72, 0.8);
    }

    .crime-popup {
      font-family: Inter, sans-serif;
    }

    .crime-popup-header {
      padding: 8px 12px;
      background-color: #f9fafb;
      margin: -8px -12px 8px -12px;
    }

    .crime-popup-body {
      padding: 0 4px;
    }

    .crime-marker-popup .leaflet-popup-content-wrapper {
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .crime-marker-popup .leaflet-popup-tip {
      background: white;
    }
  `;
}
