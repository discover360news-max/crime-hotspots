/**
 * Year Filter Script
 * Reusable year filtering functionality for crime data dashboards
 * Can be used on any page that needs year-based filtering
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

/**
 * Initialize year filter functionality
 * @param crimes - Array of all crimes data
 * @param callbacks - Functions to call when data updates
 */
export function initializeYearFilter(
  crimes: Crime[],
  callbacks: {
    updateStatsCards: (filteredCrimes: Crime[]) => void;
    updateQuickInsights: (filteredCrimes: Crime[]) => void;
    updateTopRegions: (filteredCrimes: Crime[]) => void;
    updateLeafletMap?: (filteredCrimes: Crime[]) => void;
    updateSubtitleYear?: (selectedValue: string) => void;
  }
) {
  // Validate crimes data
  if (!crimes || !Array.isArray(crimes)) {
    console.error('❌ Invalid crimes data');
    throw new Error('Crimes data is not an array');
  }

  console.log('📅 Year filter initialized with', crimes.length, 'crimes');

  // Store original crimes data
  const allCrimes = crimes;

  // Get available years from data
  const availableYears = [...new Set(allCrimes.map(c => new Date(c.date).getFullYear()))].sort((a, b) => b - a);
  console.log('Available years:', availableYears);

  // Default to current year (highest year number)
  const currentYear = availableYears[0];
  console.log('🎯 Defaulting to current year:', currentYear);

  // Filter to show only current year by default
  let filteredCrimes = allCrimes.filter(c => {
    const crimeYear = new Date(c.date).getFullYear();
    return crimeYear === currentYear;
  });
  console.log(`📊 Showing ${filteredCrimes.length} crimes from ${currentYear}`);

  // Wait for DOM to be ready before attaching event listeners
  function initYearFilter() {
    console.log('🔧 Initializing year filter...');

    const yearFilterElement = document.getElementById('yearFilter') as HTMLSelectElement;
    if (!yearFilterElement) {
      console.error('❌ Year filter dropdown not found!');
      return;
    }

    console.log('✅ Year filter dropdown found');

    // Populate dropdown with available years
    yearFilterElement.innerHTML = '';

    // Add current year option (selected by default)
    const currentOption = document.createElement('option');
    currentOption.value = currentYear.toString();
    currentOption.textContent = `${currentYear} Data`;
    currentOption.selected = true;
    yearFilterElement.appendChild(currentOption);

    // Add other years (if any)
    availableYears.forEach(year => {
      if (year !== currentYear) {
        const option = document.createElement('option');
        option.value = year.toString();
        option.textContent = `${year} Data`;
        yearFilterElement.appendChild(option);
      }
    });

    // Add "All Years" option
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = 'All Years';
    yearFilterElement.appendChild(allOption);

    console.log('✅ Year filter dropdown populated');

    // Note: No initial update needed - data already rendered server-side
    // Callbacks only fire on user interaction (year filter changes)

    // Listen for year filter changes
    yearFilterElement.addEventListener('change', (e) => {
      const selectedValue = (e.target as HTMLSelectElement).value;
      console.log('🔄 Year filter changed to:', selectedValue);

      // Filter crimes based on selection
      if (selectedValue === 'all') {
        filteredCrimes = allCrimes;
        console.log('Showing all years');
      } else {
        const selectedYears = selectedValue.split(',').map(y => parseInt(y.trim()));
        console.log('Selected years:', selectedYears);

        filteredCrimes = allCrimes.filter(crime => {
          const crimeYear = new Date(crime.date).getFullYear();
          return selectedYears.includes(crimeYear);
        });
      }

      console.log('Filtered to', filteredCrimes.length, 'crimes out of', allCrimes.length, 'total');

      // Update all dashboard components
      callbacks.updateStatsCards(filteredCrimes);
      callbacks.updateQuickInsights(filteredCrimes);
      callbacks.updateTopRegions(filteredCrimes);
      if (callbacks.updateLeafletMap) {
        callbacks.updateLeafletMap(filteredCrimes);
      }
      if (callbacks.updateSubtitleYear) {
        callbacks.updateSubtitleYear(selectedValue);
      }
    });

    console.log('✅ Year filter event listener attached');
  }

  // DOM is always ready when initializeYearFilter is called (via waitForCrimesData polling)
  initYearFilter();

  console.log('📌 Year filter setup complete');
}
