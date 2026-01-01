/**
 * Stat Card Filtering Script
 * Handles clickable stat card behavior and crime type filtering
 * Syncs with filter tray checkboxes
 */

interface Crime {
  date: string;
  headline: string;
  crimeType: string;
  primaryCrimeType?: string; // New 2026 field
  relatedCrimeTypes?: string; // New 2026 field (comma-separated)
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

let activeCrimeTypeFilter: string | null = null;
let scrollResetTimer: NodeJS.Timeout | null = null;

/**
 * Update Quick Insights title based on active filter
 */
function updateQuickInsightsTitle(crimeType: string | null) {
  const titleEl = document.getElementById('quickInsightsTitle');
  if (!titleEl) return;

  if (crimeType === null || crimeType === 'All') {
    titleEl.textContent = 'Quick Insights';
  } else {
    // Handle pluralization
    const pluralMap: Record<string, string> = {
      'Murder': 'Murders',
      'Robbery': 'Robberies',
      'Home Invasion': 'Home Invasions',
      'Theft': 'Thefts',
      'Shooting': 'Shootings',
      'Assault': 'Assaults',
      'Burglary': 'Burglaries',
      'Seizures': 'Seizures',
      'Kidnapping': 'Kidnappings'
    };

    const plural = pluralMap[crimeType] || crimeType;
    titleEl.textContent = `${plural} Insights`;
  }
}

/**
 * Scroll active card to center of container
 */
function scrollCardIntoView(card: HTMLElement, container: HTMLElement) {
  if (!card || !container) return;

  const cardRect = card.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const cardCenter = cardRect.left + cardRect.width / 2;
  const containerCenter = containerRect.left + containerRect.width / 2;
  const scrollOffset = cardCenter - containerCenter;

  container.scrollBy({
    left: scrollOffset,
    behavior: 'smooth'
  });
}

/**
 * Apply all active filters (year + crime type) and update dashboard
 */
function applyAllFilters(callbacks: {
  updateQuickInsights: (crimes: Crime[]) => void;
  updateTopRegions: (crimes: Crime[]) => void;
  updateLeafletMap: (crimes: Crime[], path: string) => void;
}) {
  if (!(window as any).__crimesData) return;

  let filteredCrimes = (window as any).__crimesData;

  // Apply year filter (if any)
  const yearFilter = document.getElementById('yearFilter') as HTMLSelectElement;
  if (yearFilter && yearFilter.value !== 'all') {
    const selectedYears = yearFilter.value.split(',').map(y => parseInt(y.trim()));
    filteredCrimes = filteredCrimes.filter((crime: Crime) => {
      const crimeYear = new Date(crime.date).getFullYear();
      return selectedYears.includes(crimeYear);
    });
  }

  // Apply crime type filter (check primary, legacy, and related crime types)
  if (activeCrimeTypeFilter && activeCrimeTypeFilter !== 'All') {
    filteredCrimes = filteredCrimes.filter((crime: Crime) => {
      // Check if primaryCrimeType matches
      if (crime.primaryCrimeType === activeCrimeTypeFilter) return true;

      // Check if crimeType matches (fallback for old data)
      if (crime.crimeType === activeCrimeTypeFilter) return true;

      // Check if relatedCrimeTypes contains the target type
      if (crime.relatedCrimeTypes) {
        const relatedTypes = crime.relatedCrimeTypes.split(',').map(t => t.trim());
        if (relatedTypes.includes(activeCrimeTypeFilter)) return true;
      }

      return false;
    });
    console.log(`📊 Filtered to ${filteredCrimes.length} ${activeCrimeTypeFilter} incidents`);
  }

  // Update dashboard components (but NOT stats cards - they show year totals)
  callbacks.updateQuickInsights(filteredCrimes);
  callbacks.updateTopRegions(filteredCrimes);
  callbacks.updateLeafletMap(filteredCrimes, '/trinidad/crime/');
}

/**
 * Initialize stat card click filtering
 */
export function initializeStatCardFiltering(callbacks: {
  updateQuickInsights: (crimes: Crime[]) => void;
  updateTopRegions: (crimes: Crime[]) => void;
  updateLeafletMap: (crimes: Crime[], path: string) => void;
}) {
  const statCards = document.querySelectorAll('.stat-card');
  const statsScrollContainer = document.querySelector('.stats-scroll-container') as HTMLElement;

  statCards.forEach(card => {
    card.addEventListener('click', function(this: HTMLElement) {
      const crimeType = this.getAttribute('data-crime-type');

      if (!crimeType) return;

      // Toggle behavior: if clicking same card, clear filter
      if (activeCrimeTypeFilter === crimeType) {
        activeCrimeTypeFilter = null;
        statCards.forEach(c => c.classList.remove('active'));
        console.log('🔄 Crime type filter cleared');

        // Reset Quick Insights title
        updateQuickInsightsTitle(null);

        // Sync dropdown state
        if ((window as any).syncCrimeTypeDropdown) {
          (window as any).syncCrimeTypeDropdown(crimeType, false);
        }
      } else {
        activeCrimeTypeFilter = crimeType;

        // Update visual state
        statCards.forEach(c => c.classList.remove('active'));
        this.classList.add('active');

        console.log(`🎯 Filtering by crime type: ${crimeType}`);

        // Update Quick Insights title
        updateQuickInsightsTitle(crimeType);

        // Sync dropdown state
        if ((window as any).syncCrimeTypeDropdown) {
          (window as any).syncCrimeTypeDropdown(crimeType, true);
        }
      }

      // Scroll active card into view
      scrollCardIntoView(this, statsScrollContainer);

      // Re-filter all dashboard components
      applyAllFilters(callbacks);
    });
  });

  // Auto-scroll back to active card after user scrolls away
  if (statsScrollContainer) {
    statsScrollContainer.addEventListener('scroll', () => {
      if (activeCrimeTypeFilter) {
        if (scrollResetTimer) clearTimeout(scrollResetTimer);
        scrollResetTimer = setTimeout(() => {
          const activeCard = document.querySelector('.stat-card.active') as HTMLElement;
          if (activeCard) {
            scrollCardIntoView(activeCard, statsScrollContainer);
          }
        }, 3000); // 3 seconds after user stops scrolling
      }
    });
  }

  console.log('✅ Stat card filtering initialized');
}

/**
 * Initialize tray dropdown sync with stat cards
 */
export function initializeTraySync() {
  const crimeTypeDropdown = document.getElementById('crimeTypeFilter') as HTMLSelectElement;

  if (!crimeTypeDropdown) {
    console.log('⚠️ Crime type filter dropdown not found');
    return;
  }

  // Global function to sync dropdown with stat card selection
  (window as any).syncCrimeTypeDropdown = function(crimeType: string, isActive: boolean) {
    if (isActive) {
      crimeTypeDropdown.value = crimeType;
    } else {
      // If deactivating, reset to "All Crime Types"
      crimeTypeDropdown.value = '';
    }
  };

  // Listen for dropdown changes in tray
  crimeTypeDropdown.addEventListener('change', function(this: HTMLSelectElement) {
    const selectedCrimeType = this.value;

    // Find all stat cards
    const statCards = document.querySelectorAll('.stat-card');

    if (selectedCrimeType === '') {
      // "All Crime Types" selected - deactivate all stat cards
      statCards.forEach(card => {
        if (card.classList.contains('active')) {
          (card as HTMLElement).click(); // Click to deactivate
        }
      });
    } else {
      // Specific crime type selected
      statCards.forEach(card => {
        const cardType = card.getAttribute('data-crime-type');

        if (cardType === selectedCrimeType) {
          // Activate this card if not already active
          if (!card.classList.contains('active')) {
            (card as HTMLElement).click();
          }
        } else {
          // Deactivate all other cards
          if (card.classList.contains('active')) {
            (card as HTMLElement).click();
          }
        }
      });
    }
  });

  console.log('✅ Tray dropdown sync initialized');
}
