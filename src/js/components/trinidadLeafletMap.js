// src/js/components/trinidadLeafletMap.js
// Leaflet map with clustered crime markers for Trinidad & Tobago

import L from 'leaflet';
import 'leaflet.markercluster';
import { getCrimeColor } from '../config/crimeColors.js';

// Trinidad & Tobago center coordinates (adjusted to show both islands)
const TRINIDAD_CENTER = [10.734963, -61.097207];
const DEFAULT_ZOOM = 9;

// Reference coordinates for major Trinidad & Tobago locations (sorted by frequency/importance)
const LOCATION_REFERENCES = {
  // Port of Spain area (most common)
  'Port of Spain': [10.6549, -61.5019],
  'Port-of-Spain': [10.6549, -61.5019],
  'POS': [10.6549, -61.5019],
  'Woodbrook': [10.6717, -61.5219],
  'St. James': [10.6667, -61.5333],
  'Newtown': [10.6581, -61.5086],
  'Belmont': [10.6583, -61.5000],
  'Gonzales': [10.6450, -61.4850],
  'Morvant': [10.6500, -61.4833],
  'Laventille': [10.6500, -61.5000],
  'Sea Lots': [10.6333, -61.5167],
  'East Dry River': [10.6483, -61.5083],

  // Diego Martin area
  'Diego Martin': [10.7297, -61.5536],
  'Petit Valley': [10.7000, -61.5333],
  'Carenage': [10.6833, -61.6167],
  'Chaguaramas': [10.6833, -61.6500],

  // San Juan / Barataria area
  'San Juan': [10.6500, -61.4667],
  'Barataria': [10.6400, -61.4600],
  'El Socorro': [10.6350, -61.4500],

  // Tunapuna / St. Augustine area
  'Tunapuna': [10.6415, -61.3933],
  'St. Augustine': [10.6417, -61.4000],
  'Curepe': [10.6333, -61.4167],
  'Trincity': [10.6583, -61.3667],

  // Arima / D'Abadie area
  'Arima': [10.6339, -61.2826],
  "D'Abadie": [10.6167, -61.3333],
  'Arouca': [10.6333, -61.3500],

  // Sangre Grande / East Trinidad
  'Sangre Grande': [10.5878, -61.1296],
  'Manzanilla': [10.4833, -61.0167],
  'Valencia': [10.6500, -61.2000],
  'Toco': [10.8167, -61.0000],

  // Chaguanas (central)
  'Chaguanas': [10.5169, -61.4111],
  'Cunupia': [10.5333, -61.3833],
  'Caroni': [10.5667, -61.4333],
  'Freeport': [10.5833, -61.4333],

  // Couva / Tabaquite / Talparo
  'Couva': [10.4167, -61.4500],
  'Claxton Bay': [10.3500, -61.4667],
  'California': [10.3667, -61.4500],
  'Carli Bay': [10.3333, -61.4833],

  // San Fernando area (South)
  'San Fernando': [10.2799, -61.4683],
  'Marabella': [10.2950, -61.4500],
  'Gasparillo': [10.3333, -61.4167],
  'Paradise': [10.2667, -61.4333],
  'Cocoyea': [10.2833, -61.4500],

  // Princes Town / Rio Claro
  'Princes Town': [10.2667, -61.3833],
  'Rio Claro': [10.3000, -61.1833],
  'Mayaro': [10.2833, -61.0000],

  // Penal / Debe
  'Penal': [10.1668, -61.4646],
  'Debe': [10.2000, -61.4500],
  'Siparia': [10.1333, -61.5083],

  // Point Fortin / Southwest
  'Point Fortin': [10.1714, -61.6834],
  'La Brea': [10.2500, -61.6167],
  'Cedros': [10.0833, -61.7500],

  // Tobago
  'Scarborough': [11.1833, -60.7333],
  'Crown Point': [11.1500, -60.8333],
  'Canaan': [11.2167, -60.7833],
  'Bon Accord': [11.1500, -60.8000],
  'Signal Hill': [11.1833, -60.7167],
  'Plymouth': [11.2500, -60.6833],
  'Roxborough': [11.2667, -60.5833],
  'Charlotteville': [11.3167, -60.5500]
};

let mapInstance = null;
let markerClusterGroup = null;

/**
 * Create Leaflet map with clustered crime markers
 * @param {Array} crimeData - Array of crime records with Location (Plus Code), Headline, Crime Type, Date
 * @param {string|null} regionFilter - Optional region filter
 * @returns {Object} Map instance and methods
 */
export function createTrinidadLeafletMap(crimeData, regionFilter = null) {
  const container = document.createElement('div');
  container.className = 'leaflet-map-container bg-white rounded-lg shadow-md overflow-hidden';
  container.innerHTML = `
    <div class="p-4 border-b border-gray-200">
      <h3 class="text-h3 font-semibold text-slate-700">Incidents Map</h3>
      <p class="text-tiny text-gray-600 mt-1">Click markers for details • Zoom to see individual incidents</p>
    </div>
    <div id="trinidadLeafletMap" style="height: 500px; width: 100%;"></div>
  `;

  // Wait for DOM insertion
  setTimeout(() => {
    const mapDiv = container.querySelector('#trinidadLeafletMap');
    if (!mapDiv) return;

    // Create map
    mapInstance = L.map('trinidadLeafletMap').setView(TRINIDAD_CENTER, DEFAULT_ZOOM);

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
