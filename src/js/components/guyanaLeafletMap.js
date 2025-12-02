// src/js/components/guyanaLeafletMap.js
// Leaflet map with clustered crime markers using Plus Codes

import L from 'leaflet';
import 'leaflet.markercluster';
import { OpenLocationCode } from 'open-location-code';
import { getCrimeColor } from '../config/crimeColors.js';

// Initialize Plus Code decoder
const olc = new OpenLocationCode();

// Guyana center coordinates
const GUYANA_CENTER = [4.8604, -58.9302];
const DEFAULT_ZOOM = 7;

// Reference coordinates for major Guyanese locations (sorted by frequency)
const LOCATION_REFERENCES = {
  // Most common - Georgetown area
  'Georgetown': [6.8013, -58.1551],
  'Kitty': [6.8000, -58.1333],
  'Campbellville': [6.8100, -58.1500],
  'Alberttown': [6.8100, -58.1400],
  'Bel Air': [6.8000, -58.1200],
  'Lodge': [6.8200, -58.1550],
  'Sophia': [6.8000, -58.1000],
  'East Bank': [6.7833, -58.1833],
  'West Bank': [6.7833, -58.2167],
  'Diamond': [6.7667, -58.2000],
  'Grove': [6.7500, -58.2167],
  'Vreed-en-Hoop': [6.8081, -58.1736],
  'Paradise': [6.8761, -58.1031],
  'Better Hope': [6.7667, -58.0167],

  // East Coast Demerara
  'Buxton': [6.7500, -58.0500],
  'Mahaica': [6.6833, -57.9167],
  'Enmore': [6.7667, -57.9833],

  // West Demerara
  'Uitvlugt': [6.7667, -58.2667],
  'Leonora': [6.7833, -58.2833],

  // Berbice
  'New Amsterdam': [6.2489, -57.5181],
  'Rose Hall': [6.1500, -57.3167],
  'Corriverton': [5.9000, -57.1333],

  // Upper Demerara
  'Linden': [5.9943, -58.3078],
  'Mackenzie': [5.9833, -58.2833],

  // Essequibo Coast
  'Anna Regina': [7.2641, -58.5088],
  'Charity': [7.4028, -58.5986],

  // Interior
  'Bartica': [6.4025, -58.6178],
  'Lethem': [3.3781, -59.7971],
  'Mabaruma': [8.2000, -59.7833],
  'Mahdia': [5.2667, -59.1500]
};

let mapInstance = null;
let markerClusterGroup = null;

/**
 * Create Leaflet map with clustered crime markers
 * @param {Array} crimeData - Array of crime records with Location (Plus Code), Headline, Crime Type, Date
 * @param {string|null} regionFilter - Optional region filter
 * @returns {Object} Map instance and methods
 */
export function createGuyanaLeafletMap(crimeData, regionFilter = null) {
  const container = document.createElement('div');
  container.className = 'leaflet-map-container bg-white rounded-lg shadow-md overflow-hidden';
  container.innerHTML = `
    <div class="p-4 border-b border-gray-200 flex items-center justify-between">
      <div>
        <h3 class="text-h3 font-semibold text-slate-700">Incidents Map</h3>
        <p class="text-tiny text-gray-600 mt-1">Use two fingers to zoom • Click markers for details</p>
      </div>
      <button id="resetMapView" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-tiny font-medium text-slate-700 transition flex items-center gap-1">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Reset View
      </button>
    </div>
    <div class="relative">
      <div id="guyanaLeafletMap" style="height: 500px; width: 100%;"></div>
      <!-- Zoom instruction overlay (shown on scroll attempt) -->
      <div id="mapZoomHint" class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 pointer-events-none transition-opacity duration-300" style="z-index: 1000;">
        <div class="bg-white rounded-lg px-6 py-4 shadow-xl max-w-xs text-center">
          <p class="text-small font-semibold text-slate-900">Use two fingers to zoom</p>
          <p class="text-tiny text-slate-600 mt-1">Or use the zoom buttons</p>
        </div>
      </div>
    </div>
  `;

  // Wait for DOM insertion
  setTimeout(() => {
    const mapDiv = container.querySelector('#guyanaLeafletMap');
    const zoomHint = container.querySelector('#mapZoomHint');
    const resetButton = container.querySelector('#resetMapView');
    if (!mapDiv) return;

    // Create map with scroll wheel zoom disabled (requires Ctrl+scroll on desktop, two fingers on mobile)
    mapInstance = L.map('guyanaLeafletMap', {
      scrollWheelZoom: false, // Disabled by default
      dragging: true,
      touchZoom: true, // Two-finger zoom works
      doubleClickZoom: true,
      boxZoom: true,
      tap: true
    }).setView(GUYANA_CENTER, DEFAULT_ZOOM);

    // Enable scroll wheel zoom only when user holds Ctrl (desktop) or uses two fingers (mobile)
    mapInstance.scrollWheelZoom.enable();
    mapInstance.scrollWheelZoom.disable(); // Start disabled

    // Show hint when user tries to scroll without Ctrl/two fingers
    let hintTimeout;
    mapInstance.on('wheel', function(e) {
      if (!mapInstance.scrollWheelZoom.enabled() && !e.originalEvent.ctrlKey) {
        // User is trying to scroll but scroll zoom is disabled
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
    });

    // Reset view button
    if (resetButton) {
      resetButton.addEventListener('click', () => {
        mapInstance.setView(GUYANA_CENTER, DEFAULT_ZOOM);
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

  filteredData.forEach(record => {
    const location = record.Location;
    const headline = record.Headline || 'No headline';
    const crimeType = record['Crime Type'] || 'Other';
    const date = record.Date || 'Unknown date';

    let lat, lng;

    // First, try to use Latitude and Longitude if available (most accurate)
    if (record.Latitude && record.Longitude) {
      lat = parseFloat(record.Latitude);
      lng = parseFloat(record.Longitude);

      if (isNaN(lat) || isNaN(lng)) {
        failCount++;
        console.warn(`Invalid Lat/Lng: ${record.Latitude}, ${record.Longitude}`);
        return;
      }
    }
    // Fallback to Plus Code if no Lat/Lng
    else if (location && location.trim() !== '') {
      // Extract Plus Code from location string
      const plusCodeMatch = location.match(/([23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,3})/i);
      if (!plusCodeMatch) {
        failCount++;
        console.warn(`No Lat/Lng or Plus Code found for: ${location}`);
        return;
      }

      let plusCode = plusCodeMatch[1];

      // Check if it's a short code (needs recovery) or full code
      if (!olc.isFull(plusCode)) {
        // Short code - need to recover to full code
        let refLat = GUYANA_CENTER[0];
        let refLng = GUYANA_CENTER[1];

        // Check if location string contains a known place name
        for (const [place, coords] of Object.entries(LOCATION_REFERENCES)) {
          if (location.includes(place)) {
            refLat = coords[0];
            refLng = coords[1];
            break;
          }
        }

        try {
          plusCode = olc.recoverNearest(plusCode, refLat, refLng);
        } catch (error) {
          failCount++;
          console.warn(`Failed to recover short Plus Code: ${plusCode}`, error);
          return;
        }
      }

      // Validate and decode the Plus Code
      if (!olc.isValid(plusCode)) {
        failCount++;
        console.warn(`Invalid Plus Code: ${plusCode}`);
        return;
      }

      try {
        const decoded = olc.decode(plusCode);
        lat = decoded.latitudeCenter;
        lng = decoded.longitudeCenter;
      } catch (error) {
        failCount++;
        console.warn(`Failed to decode Plus Code: ${plusCode}`, error);
        return;
      }
    } else {
      failCount++;
      return; // No location data available
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
      console.warn(`Failed to decode Plus Code: ${location}`, error);
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
      justify-center;
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
