// components/loadingStates.js
// Reusable loading state components for Crime Hotspots

/**
 * Creates a dashboard shimmer skeleton loader
 * Matches typical Looker Studio dashboard layout
 */
export function createDashboardShimmer() {
  const shimmer = document.createElement('div');
  shimmer.className = 'dashboard-shimmer absolute inset-0 bg-white p-6 animate-pulse z-10';
  shimmer.setAttribute('role', 'status');
  shimmer.setAttribute('aria-live', 'polite');
  shimmer.setAttribute('aria-label', 'Loading dashboard');

  shimmer.innerHTML = `
    <div class="space-y-6">
      <!-- Header bar -->
      <div class="flex items-center justify-between">
        <div class="h-8 bg-slate-200 rounded w-1/3"></div>
        <div class="h-8 bg-slate-200 rounded w-24"></div>
      </div>

      <!-- Main chart area -->
      <div class="h-64 bg-slate-200 rounded-lg"></div>

      <!-- Stats cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="h-32 bg-slate-200 rounded-lg"></div>
        <div class="h-32 bg-slate-200 rounded-lg"></div>
        <div class="h-32 bg-slate-200 rounded-lg"></div>
      </div>

      <!-- Data table -->
      <div class="space-y-3">
        <div class="h-10 bg-slate-200 rounded"></div>
        <div class="h-10 bg-slate-200 rounded"></div>
        <div class="h-10 bg-slate-200 rounded"></div>
        <div class="h-10 bg-slate-200 rounded"></div>
      </div>
    </div>
  `;

  return shimmer;
}

/**
 * Creates headline card skeletons for loading state
 * @param {number} count - Number of skeleton cards to create
 */
export function createHeadlineCardSkeleton(count = 4) {
  const container = document.createElement('div');
  container.className = 'grid gap-8 sm:grid-cols-1 lg:grid-cols-2 animate-pulse';
  container.setAttribute('role', 'status');
  container.setAttribute('aria-live', 'polite');
  container.setAttribute('aria-label', 'Loading headlines');

  for (let i = 0; i < count; i++) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-2xl shadow-md p-5';
    card.innerHTML = `
      <div class="flex justify-between items-center mb-3">
        <div class="h-6 w-24 bg-slate-200 rounded-full"></div>
        <div class="h-6 w-20 bg-slate-200 rounded"></div>
      </div>
      <div class="space-y-2 mb-3">
        <div class="h-4 bg-slate-200 rounded w-full"></div>
        <div class="h-4 bg-slate-200 rounded w-3/4"></div>
      </div>
      <div class="h-3 bg-slate-200 rounded w-1/2 mb-2"></div>
      <div class="h-3 bg-slate-200 rounded w-1/3"></div>
    `;
    container.appendChild(card);
  }

  return container;
}

/**
 * Creates a full-screen spinner overlay
 * @param {string} message - Loading message to display
 */
export function createSpinnerOverlay(message = 'Loading...') {
  const overlay = document.createElement('div');
  overlay.className = 'loading-overlay fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50';
  overlay.setAttribute('role', 'status');
  overlay.setAttribute('aria-live', 'polite');

  overlay.innerHTML = `
    <div class="text-center">
      <div class="spinner w-12 h-12 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin mx-auto mb-4"></div>
      <p class="text-slate-600 font-medium">${message}</p>
    </div>
  `;

  return overlay;
}

/**
 * Shows a skeleton loader in a container, replacing existing content
 * @param {HTMLElement} container - Container element
 * @param {HTMLElement} skeleton - Skeleton element to show
 */
export function showSkeleton(container, skeleton) {
  if (!container || !skeleton) return;

  // Clear container
  container.innerHTML = '';
  container.appendChild(skeleton);
}

/**
 * Removes skeleton and shows actual content with fade-in
 * @param {HTMLElement} container - Container element
 * @param {HTMLElement} content - Actual content to show
 */
export function hideSkeleton(container, content) {
  if (!container) return;

  // Remove skeleton
  const skeleton = container.querySelector('[role="status"]');
  if (skeleton) {
    skeleton.remove();
  }

  // Add content with fade-in
  if (content) {
    content.classList.add('opacity-0');
    container.appendChild(content);

    requestAnimationFrame(() => {
      content.classList.remove('opacity-0');
      content.classList.add('opacity-100', 'transition-opacity', 'duration-500');
    });
  }
}
