function safeUrl(u) {
  if (!u) return null;
  try {
    const url = new URL(u, window.location.href);
    return (url.protocol === 'http:' || url.protocol === 'https:') ? url.href : null;
  } catch (e) {
    return null;
  }
}

// dashboardPanel.js
// Handles dashboard tray animation, caching, and headline linking.

import { createDashboardShimmer } from './loadingStates.js';

export function initDashboardPanel() {
  const panel = document.getElementById('dashboardPanel');
  const iframe = document.getElementById('dashboardIframe');
  // Removed progress, progressTrack, progressContainer, message, submessage (no longer needed)
  const errorBox = document.getElementById('dashboardError');
  const openNewLink = document.getElementById('dashboardOpenNew');
  const headlinesLink = document.getElementById('dashboardHeadlinesLink');
  const closeBtn = document.getElementById('dashboardClose');
  const backdrop = document.getElementById('dashboardBackdrop');

  if (!panel || !iframe) {
    console.warn("Dashboard panel missing required DOM elements (panel or iframe).");
    return { loadDashboard() {} };
  }

  // Cache stores { url: string, headlineSlug: string }
  const cache = new Map();
  let currentId = null;
  let fallbackTimer = null; // Still keep for iframe timeout

  // Race condition prevention
  let isLoading = false;
  let loadAbortController = null;

  // === Helpers ===
  function clearTimers() {
    clearTimeout(fallbackTimer);
    fallbackTimer = null;
    // Removed resetProgress() call
  }

  // === Animations ===
  function showPanel() {
    document.body.style.overflow = 'hidden';

    if (backdrop) {
      backdrop.classList.remove('hidden');
      requestAnimationFrame(() => {
        backdrop.classList.remove('opacity-0');
        backdrop.classList.add('opacity-100');
      });
    }

    panel.classList.remove('hidden');
    panel.classList.add('translate-y-full', 'opacity-0');
    requestAnimationFrame(() => {
      panel.classList.remove('translate-y-full', 'opacity-0');
      panel.classList.add('translate-y-0', 'opacity-100');
    });
  }

  function hidePanel() {
    if (backdrop) {
      backdrop.classList.add('opacity-0');
      setTimeout(() => backdrop.classList.add('hidden'), 500);
    }

    document.body.style.overflow = '';

    panel.classList.remove('translate-y-0', 'opacity-100');
    panel.classList.add('translate-y-full', 'opacity-0');

    setTimeout(() => {
      panel.classList.add('hidden');
    }, 500);
  }

  // === Error handling ===
  function showError(msg, dashboardUrl = null) {
    if (!errorBox) return;

    // Remove shimmer loader if present
    const existingShimmer = document.getElementById('dashboardShimmer');
    if (existingShimmer) {
      existingShimmer.remove();
    }

    // We expect the iframe to be loaded/faded in already in the success path
    // For error path, ensure iframe is hidden/cleared if possible
    iframe.classList.remove("opacity-100");
    iframe.classList.add("opacity-0");

    // Update error message while preserving HTML structure
    errorBox.innerHTML = `
      <strong>Unable to load dashboard.</strong>
      <p class="mt-2">
        ${msg || "The dashboard might not allow embedding or there was a connection issue."}
        You can
        <a
          id="dashboardOpenNew"
          class="underline font-medium"
          href="${dashboardUrl || '#'}"
          target="_blank"
          rel="noreferrer noopener"
        >
        open it in a new tab
        </a>.
      </p>
    `;
    errorBox.classList.remove("hidden");

    // Hide the headlines link on error
    if (headlinesLink) headlinesLink.classList.add("opacity-0", "pointer-events-none");
  }

  function clearError() {
    if (errorBox) errorBox.classList.add("hidden");
  }

  // === Main load logic ===
  function loadDashboard(rawUrl, title, headlineSlug) {
    // Prevent concurrent loads
    if (isLoading) {
      console.warn('Dashboard load already in progress, ignoring duplicate request');
      return;
    }

    const safe = safeUrl(rawUrl);
    if (!safe) {
      showError("Invalid dashboard URL.");
      return;
    }

    const countryId = headlineSlug || title;
    currentId = countryId; // Set current ID for onload/cache use

    // Mark as loading
    isLoading = true;

    // 1. Setup UI state
    showPanel();
    clearError();
    clearTimers();
    
    // Hide Headline link until loaded/cached
    if (headlinesLink) {
      headlinesLink.classList.add("opacity-0", "pointer-events-none");
    }
    if (openNewLink) openNewLink.classList.add('hidden');
    
    // --- CACHED LOAD ---
    if (cache.has(countryId)) {
      const cached = cache.get(countryId);
      iframe.src = cached.url;

      // Reveal link immediately
      if (headlinesLink && cached.headlineSlug) {
        headlinesLink.href = `headlines-${cached.headlineSlug}.html`;
        headlinesLink.classList.remove("opacity-0", "pointer-events-none");
      }

      // Ensure iframe is faded in for cached views
      iframe.classList.remove("opacity-0");
      iframe.classList.add("opacity-100");

      // Reset loading flag for cached loads
      isLoading = false;
      return;
    }

    // --- FRESH LOAD ---

    // Hide dashboard iframe initially to start fade-in after loading
    iframe.classList.add("opacity-0");
    iframe.src = "about:blank"; // Reset src first for smoother transition

    // Create and inject shimmer loader
    const shimmer = createDashboardShimmer();
    shimmer.id = 'dashboardShimmer';

    const iframeContainer = iframe.parentElement;
    iframeContainer.style.position = 'relative';
    iframeContainer.appendChild(shimmer);

    // Start loading the dashboard
    iframe.src = safe;
    cache.set(countryId, { url: safe, headlineSlug });

    // Set fallback timer (10s is a good buffer for Looker Studio/heavy dashboards)
    fallbackTimer = setTimeout(() => {
      clearTimers();
      showError("Dashboard timed out.", safe);
      isLoading = false;
    }, 10000); 
  }

  iframe.onload = () => {
    try {
      clearTimers();

      // Reset loading flag on successful load
      isLoading = false;

      // Remove shimmer loader if present
      const existingShimmer = document.getElementById('dashboardShimmer');
      if (existingShimmer) {
        existingShimmer.remove();
      }

      // 1. Fade in iframe
      iframe.classList.remove("opacity-0");
      iframe.classList.add("opacity-100");

      // 2. Reveal "View Headlines" link
      const cached = cache.get(currentId);
      const slug = cached?.headlineSlug;

      if (headlinesLink && slug) {
        const headlinePath = `headlines-${slug}.html`;

        headlinesLink.href = headlinePath;
        headlinesLink.removeAttribute("target");
        headlinesLink.removeAttribute("rel");

        // Reveal the link
        headlinesLink.classList.remove("opacity-0", "pointer-events-none");

        headlinesLink.onclick = (e) => {
            e.preventDefault();
            panel.classList.remove('opacity-100', 'translate-y-0');
            panel.classList.add("opacity-0", "translate-y-full");

            // Wait for panel close animation before navigating
            setTimeout(() => {
                window.location.href = headlinePath;
            }, 400);
        };
      }

      // Ensure the "open in new tab" link stays hidden
      if (openNewLink) openNewLink.classList.add("hidden");

    } catch (e) {
      console.warn("iframe onload handler error", e);
      // Reset loading flag even on error
      isLoading = false;
    }
  };

  iframe.onerror = () => {
    clearTimers();
    // Reset loading flag on error
    isLoading = false;
    showError("An error occurred while loading the dashboard.");
  };

  // === Close handlers ===
  function closeDashboard() {
    try {
      // Hide the tray with animation
      hidePanel();

      // Reset loading flag when closing
      isLoading = false;

      // Ensure detached handlers don't fire during load/close
      iframe.onload = null;
      iframe.onerror = null;

      clearTimers();

      // Reset iframe source
      iframe.src = "about:blank";

      // Hide "View Headlines →" link
      if (headlinesLink) {
        headlinesLink.classList.add("opacity-0", "pointer-events-none");
        headlinesLink.href = "#";
      }

      // Hide "open in new tab" link
      if (openNewLink) openNewLink.classList.add("hidden");

      // Allow scrolling on background again
      document.body.style.overflow = "";

    } catch (e) {
      console.warn("closeDashboard handler error", e);
    }
  }

  // Close button
  if (closeBtn) {
    closeBtn.addEventListener("click", closeDashboard);
  }

  // Click outside to close (backdrop)
  if (backdrop) {
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) {
        closeDashboard();
      }
    });
  }

  // Escape key to close
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.classList.contains("hidden")) {
      closeDashboard();
    }
  });

  return { loadDashboard };
}