// src/js/components/emptyState.js

/**
 * Renders an empty state UI when no data matches the current filters
 * Provides clear feedback and actionable next steps to users
 *
 * @param {Object} options - Configuration options
 * @param {string} options.title - Main heading (e.g., "No Crimes Found")
 * @param {string} options.message - Explanation text
 * @param {string} [options.actionText] - CTA button text (optional)
 * @param {Function} [options.onAction] - CTA button click handler (optional)
 * @returns {HTMLElement} Empty state element
 *
 * @example
 * const emptyState = createEmptyState({
 *   title: 'No Crimes Found',
 *   message: 'No crimes match your current filters. Try adjusting the date range or selecting a different region.',
 *   actionText: 'Reset Filters',
 *   onAction: () => resetAllFilters()
 * });
 * container.appendChild(emptyState);
 */
export function createEmptyState({ title, message, actionText, onAction }) {
  const container = document.createElement('div');
  container.className = 'flex flex-col items-center justify-center py-12 px-4 text-center';
  container.setAttribute('role', 'status');
  container.setAttribute('aria-live', 'polite');

  container.innerHTML = `
    <!-- Empty state icon (sad face) -->
    <svg class="w-16 h-16 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>

    <!-- Title -->
    <h3 class="text-h3 font-semibold text-slate-700 mb-2">${title}</h3>

    <!-- Message -->
    <p class="text-body text-slate-600 max-w-md mb-6">${message}</p>

    <!-- Optional action button -->
    ${actionText ? `
      <button
        id="emptyStateAction"
        class="px-4 py-2 min-h-[44px] flex items-center justify-center rounded-lg border-2 border-rose-600 text-rose-600 hover:bg-rose-50 transition text-nav font-medium"
        aria-label="${actionText}"
      >
        ${actionText}
      </button>
    ` : ''}
  `;

  // Attach click handler if provided
  if (actionText && onAction) {
    const actionBtn = container.querySelector('#emptyStateAction');
    if (actionBtn) {
      actionBtn.addEventListener('click', onAction);
    }
  }

  return container;
}

/**
 * Quick helper for common "no results" scenario
 * @param {Function} resetCallback - Function to call when "Reset Filters" is clicked
 * @returns {HTMLElement} Empty state element
 */
export function createNoResultsState(resetCallback) {
  return createEmptyState({
    title: 'No Crimes Found',
    message: 'No crimes match your current filters. Try adjusting the date range or selecting a different region.',
    actionText: 'Reset Filters',
    onAction: resetCallback
  });
}

/**
 * Quick helper for "no data" scenario (no reset needed)
 * @returns {HTMLElement} Empty state element
 */
export function createNoDataState() {
  return createEmptyState({
    title: 'No Data Available',
    message: 'There is currently no crime data to display. Please check back later.',
    actionText: null,
    onAction: null
  });
}
