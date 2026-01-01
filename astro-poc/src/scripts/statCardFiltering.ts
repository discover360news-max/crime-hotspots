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

        // Sync checkbox state
        if ((window as any).syncCrimeTypeCheckbox) {
          (window as any).syncCrimeTypeCheckbox(crimeType, false);
        }
      } else {
        activeCrimeTypeFilter = crimeType;

        // Update visual state
        statCards.forEach(c => c.classList.remove('active'));
        this.classList.add('active');

        console.log(`🎯 Filtering by crime type: ${crimeType}`);

        // Update Quick Insights title
        updateQuickInsightsTitle(crimeType);

        // Sync checkbox state
        if ((window as any).syncCrimeTypeCheckbox) {
          (window as any).syncCrimeTypeCheckbox(crimeType, true);
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
 * Initialize tray checkbox sync with stat cards
 */
export function initializeTraySync() {
  // Global function to sync checkbox state with stat card
  (window as any).syncCrimeTypeCheckbox = function(crimeType: string, isActive: boolean) {
    const checkboxes = document.querySelectorAll('.crime-type-checkbox');
    checkboxes.forEach(checkbox => {
      const checkboxType = checkbox.getAttribute('data-crime-type');
      if (checkboxType === crimeType) {
        (checkbox as HTMLInputElement).checked = isActive;
      } else if (crimeType === 'All') {
        (checkbox as HTMLInputElement).checked = false; // Clear all checkboxes when "All" is selected
      }
    });
  };

  // Listen for checkbox changes in tray
  const checkboxes = document.querySelectorAll('.crime-type-checkbox');

  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function(this: HTMLInputElement) {
      const crimeType = this.getAttribute('data-crime-type');
      const isChecked = this.checked;

      if (!crimeType) return;

      // Uncheck all other checkboxes (single selection to match stat card behavior)
      checkboxes.forEach(cb => {
        if (cb !== this) (cb as HTMLInputElement).checked = false;
      });

      // Find and click the corresponding stat card
      const statCards = document.querySelectorAll('.stat-card');
      statCards.forEach(card => {
        const cardType = card.getAttribute('data-crime-type');

        if (isChecked && cardType === crimeType) {
          // Activate this card
          (card as HTMLElement).click();
        } else if (!isChecked && cardType === crimeType) {
          // Deactivate this card (click again to toggle off)
          if (card.classList.contains('active')) {
            (card as HTMLElement).click();
          }
        }
      });
    });
  });

  console.log('✅ Tray checkbox sync initialized');
}
