/**
 * Dashboard Map Initializer
 * Polls for crimes data then initializes the Leaflet map with a shimmer transition.
 */

import { initializeLeafletMap } from './leafletMap';

export function initializeDashboardMap(): void {
  const mapShimmerStartTime = Date.now();

  function poll() {
    if (!window.__crimesData) {
      setTimeout(poll, 100);
      return;
    }

    const availableYears = [...new Set(window.__crimesData.map((c: any) => c.year))].sort((a: number, b: number) => b - a);
    const currentYear = availableYears[0];
    const currentYearCrimes = window.__crimesData.filter((c: any) => c.year === currentYear);

    initializeLeafletMap('leafletMap', currentYearCrimes, {
      center: [10.634963, -61.197207],
      zoom: 8,
      country: 'Trinidad',
      crimeDetailPath: '/trinidad/crime/',
      onMapReady: async () => {
        const elapsed = Date.now() - mapShimmerStartTime;
        const remaining = Math.max(0, 500 - elapsed);

        if (remaining > 0) {
          await new Promise(resolve => setTimeout(resolve, remaining));
        }

        const mapShimmer = document.getElementById('mapShimmer');
        const leafletMap = document.getElementById('leafletMap');

        if (mapShimmer) mapShimmer.style.display = 'none';
        if (leafletMap) leafletMap.style.opacity = '1';
      }
    });
  }

  poll();
}
