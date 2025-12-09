// src/js/components/headlineSummaryModal.js
// Headline summary modal - displays crime summary with social sharing and attribution

import DOMPurify from 'dompurify';

/**
 * Creates and manages the headline summary modal
 * @returns {Object} Modal controller with show/hide methods
 */
export function createHeadlineSummaryModal() {
  // Create modal HTML - slide-up tray design
  const modalHtml = `
    <div id="headlineSummaryModal" class="fixed inset-0 z-50 hidden">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 opacity-0" id="modalBackdrop"></div>

      <!-- Tray -->
      <div class="fixed bottom-0 left-0 right-0 max-h-[90vh] overflow-hidden transform transition-all duration-500 translate-y-full" id="modalContent">
        <!-- Frosted glass container -->
        <div class="bg-white/80 backdrop-blur-lg shadow-2xl rounded-t-2xl overflow-hidden">

          <!-- Drag handle -->
          <div class="flex justify-center pt-3">
            <div class="w-12 h-1.5 bg-slate-300 rounded-full"></div>
          </div>

          <!-- Header with close button -->
          <div class="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <h3 class="text-small font-semibold text-slate-500">Incident Summary</h3>
            <button id="closeSummaryModal" class="p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors" aria-label="Close">
              <svg class="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Scrollable content -->
          <div class="overflow-y-auto max-h-[calc(90vh-4rem)] px-4">
            <!-- Header badges -->
            <div class="flex flex-wrap gap-2 mb-3">
              <span id="crimeTypeBadge" class="py-4 text-rose-600 text-sm font-semibold rounded-md uppercase"></span>
              <span class="py-5 text-tiny text-slate-300">|</span><span id="dateBadge" class="px-2 py-5 bg-slate-100 text-slate-500 text-xs font-medium rounded-md"></span>
            </div>

            <!-- Headline -->
            <h2 id="summaryHeadline" class="text-h2 font-bold text-slate-700 mb-3 leading-tight"></h2>

            <!-- Summary text -->
            <div id="summaryText" class="text-body max-w-none mb-4 text-slate-500 leading-relaxed"></div>

            <!-- Location -->
            <div id="locationSection" class="flex items-start pb-5 mb-4 bg-slate-50/50 rounded-lg">
              <svg class="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div class="flex-1">
                <div id="locationText" class="pt-1 px-3 text-tiny text-rose-600"></div>
              </div>
            </div>

            <!-- Compact action buttons in single row -->
            <a id="sourceBtn" href="#" target="_blank" rel="noopener noreferrer" 
              class="px-3 py-3 mb-3 w-full bg-slate-200 text-slate-500 rounded-md hover:bg-slate-200 transition text-tiny font-medium flex items-center gap-1 flex-shrink-0">
              
              <svg class="w-5 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              
              <span class="text-slate-500">Source:</span>
              <span id="sourceName" class="font-semibold underline-offset-2 hover:underline"></span>
            </a>

            <div class="flex gap-2 mb-4 overflow-x-auto">
              
              <a id="readFullStoryBtn" href="#" target="_blank" rel="noopener noreferrer nofollow" class="px-3 py-2 border-2 border-rose-400 text-rose-400 rounded-lg hover:bg-rose-50 transition text-tiny font-medium flex items-center gap-1 whitespace-nowrap flex-shrink-0">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Read Article
              </a>
              
              <button id="viewOnMapBtn" class="px-3 py-2 border-2 border-rose-400 text-rose-400 rounded-lg hover:bg-rose-50 transition text-tiny font-medium flex items-center gap-1 whitespace-nowrap flex-shrink-0">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                View Map
              </button>
            </div>

            <!-- Social sharing -->
            <div class="border-t border-slate-200/50">
              <p class="text-tiny text-slate-500 font-medium mb-2">Share</p>
              <div class="gap-2 flex flex-wrap">
                <button id="shareTwitter" class="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors" aria-label="Share on Twitter">
                  <svg class="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </button>
                <button id="shareFacebook" class="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors" aria-label="Share on Facebook">
                  <svg class="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </button>
                <button id="shareWhatsApp" class="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors" aria-label="Share on WhatsApp">
                  <svg class="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Report Issue -->
            <div class="py-4 border-t border-slate-200/50">
              <button id="reportIssueToggle" class="text-tiny text-slate-400 hover:text-rose-600 font-medium flex items-center gap-1">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Report an issue with this story
              </button>

              <!-- Dropdown and form (hidden initially) -->
              <div id="issueFormContainer" class="hidden mt-3">
                <select id="issueSelect" class="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-tiny text-slate-700 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 mb-2">
                  <option value="">Select issue type...</option>
                  <option value="incorrect-location">Incorrect location</option>
                  <option value="wrong-crime-type">Wrong crime type</option>
                  <option value="duplicate">Duplicate entry</option>
                  <option value="inaccurate-info">Inaccurate information</option>
                  <option value="other">Other issue</option>
                </select>

                <!-- Additional info textarea (shown after selection) -->
                <div id="issueDetailsContainer" class="hidden">
                  <textarea id="issueDetails" placeholder="Additional details (optional)" maxlength="500" rows="3" class="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-tiny text-slate-700 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 resize-none"></textarea>
                  <!-- Honeypot field (hidden from users, catches bots) -->
                  <input type="text" id="issueHoneypot" class="hidden" tabindex="-1" autocomplete="off" />
                  <div class="flex items-center justify-between mt-2">
                    <span id="charCount" class="text-tiny text-slate-400">0/500</span>
                    <button id="submitIssueBtn" class="px-3 py-1.5 border-2 border-rose-600 text-rose-600 rounded-lg hover:bg-rose-50 transition text-tiny font-medium">
                      Submit
                    </button>
                  </div>
                </div>
              </div>

              <div id="issueSuccess" class="hidden mt-2 p-2 bg-slate-100 rounded-lg">
                <p class="text-tiny text-slate-700">Thank you! We'll review this report.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Insert modal into DOM
  const container = document.createElement('div');
  container.innerHTML = modalHtml;
  document.body.appendChild(container);

  // Get modal elements
  const modal = document.getElementById('headlineSummaryModal');
  const backdrop = document.getElementById('modalBackdrop');
  const content = document.getElementById('modalContent');
  const closeBtn = document.getElementById('closeSummaryModal');
  const sourceBtn = document.getElementById('sourceBtn');
  const sourceName = document.getElementById('sourceName');
  const readFullStoryBtn = document.getElementById('readFullStoryBtn');
  const viewOnMapBtn = document.getElementById('viewOnMapBtn');
  const shareTwitterBtn = document.getElementById('shareTwitter');
  const shareFacebookBtn = document.getElementById('shareFacebook');
  const shareWhatsAppBtn = document.getElementById('shareWhatsApp');

  // Current crime data
  let currentCrime = null;
  let currentCountrySlug = null;

  /**
   * Sanitize text for display
   */
  function sanitize(text) {
    if (!text) return '';
    return DOMPurify.sanitize(String(text), {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    });
  }

  /**
   * Format date for display
   */
  function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  /**
   * Get source name from URL
   * Returns domain name from URL, or null if URL is invalid/empty
   */
  function getSourceName(url) {
    if (!url || !url.trim()) return null;

    try {
      const hostname = new URL(url).hostname.toLowerCase();

      // Trinidad sources
      if (hostname.includes('trinidadexpress')) return 'Trinidad Express';
      if (hostname.includes('guardian')) return 'Trinidad Guardian';
      if (hostname.includes('newsday')) return 'Newsday';
      if (hostname.includes('cnc3')) return 'CNC3';
      if (hostname.includes('looptt')) return 'Loop News';

      // Guyana sources
      if (hostname.includes('kaieteurnews')) return 'Kaieteur News';
      if (hostname.includes('stabroeknews')) return 'Stabroek News';
      if (hostname.includes('demerarawaves')) return 'Demerara Waves';
      if (hostname.includes('inewsguyana')) return 'iNews Guyana';

      // Barbados sources
      if (hostname.includes('barbadostoday')) return 'Barbados Today';
      if (hostname.includes('nationnews')) return 'Nation News';
      if (hostname.includes('barbadosunderground')) return 'Barbados Underground';

      // Fallback: Extract domain name (e.g., "example.com" → "example")
      return hostname.replace('www.', '').split('.')[0];
    } catch (e) {
      return null;
    }
  }

  /**
   * Show the modal with crime data
   */
  function show(crime, countrySlug = null) {
    currentCrime = crime;
    currentCountrySlug = countrySlug;

    // Populate content
    document.getElementById('crimeTypeBadge').textContent = sanitize(crime['Crime Type'] || 'Crime');
    document.getElementById('dateBadge').textContent = formatDate(crime.Date);
    document.getElementById('summaryHeadline').textContent = sanitize(crime.Headline);

    // Summary text (if available, otherwise show placeholder)
    const summaryEl = document.getElementById('summaryText');
    if (crime.Summary && crime.Summary.trim()) {
      summaryEl.innerHTML = `<p>${sanitize(crime.Summary)}</p>`;
    } else {
      summaryEl.innerHTML = `<p class="text-slate-500 italic">Summary not available for this article.</p>`;
    }

    // Location
    const locationParts = [];
    if (crime['Street Address']) locationParts.push(crime['Street Address']);
    if (crime.Area) locationParts.push(crime.Area);
    if (crime.Country) locationParts.push(crime.Country);
    document.getElementById('locationText').textContent = sanitize(locationParts.join(', ') || 'Location not specified');

    // Source button - hierarchy: 1) Source column, 2) domain from URL, 3) "Source Unverified"
    let sourceNameText;
    if (crime.Source && crime.Source.trim()) {
      // Priority 1: Use Source column if available
      sourceNameText = crime.Source.trim();
    } else if (crime.URL && crime.URL.trim()) {
      // Priority 2: Extract domain name from URL
      sourceNameText = getSourceName(crime.URL) || 'Source Unverified';
    } else {
      // Priority 3: No URL available
      sourceNameText = 'Source Unverified';
    }

    sourceName.textContent = sourceNameText;

    if (crime.URL && crime.URL.trim()) {
      sourceBtn.href = crime.URL;
      sourceBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'pointer-events-none');
    } else {
      sourceBtn.href = '#';
      sourceBtn.classList.add('opacity-50', 'cursor-not-allowed', 'pointer-events-none');
    }

    // Read full story button
    readFullStoryBtn.href = crime.URL || '#';
    if (!crime.URL || !crime.URL.trim()) {
      readFullStoryBtn.classList.add('opacity-50', 'cursor-not-allowed', 'pointer-events-none');
    } else {
      readFullStoryBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'pointer-events-none');
    }

    // Show tray with slide-up animation
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => {
      backdrop.classList.remove('opacity-0');
      backdrop.classList.add('opacity-100');
      content.classList.remove('translate-y-full');
      content.classList.add('translate-y-0');
    });
  }

  /**
   * Hide the tray
   */
  function hide() {
    backdrop.classList.remove('opacity-100');
    backdrop.classList.add('opacity-0');
    content.classList.remove('translate-y-0');
    content.classList.add('translate-y-full');

    setTimeout(() => {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    }, 500);
  }

  /**
   * Share on Twitter
   */
  function shareOnTwitter() {
    if (!currentCrime) return;

    const text = `${currentCrime.Headline} - Crime Hotspots`;
    const url = window.location.origin;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  }

  /**
   * Share on Facebook
   */
  function shareOnFacebook() {
    if (!currentCrime) return;

    const url = window.location.href;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  }

  /**
   * Share on WhatsApp
   */
  function shareOnWhatsApp() {
    if (!currentCrime) return;

    const text = `${currentCrime.Headline}\n\nView crime data: ${window.location.origin}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  }

  /**
   * View on map (navigate to dashboard)
   */
  function viewOnMap() {
    if (!currentCountrySlug) return;

    // Navigate to the country's dashboard
    const dashboardUrl = `/dashboard-${currentCountrySlug}.html`;
    window.location.href = dashboardUrl;
  }

  // Event listeners
  closeBtn.addEventListener('click', hide);
  backdrop.addEventListener('click', hide);
  viewOnMapBtn.addEventListener('click', viewOnMap);
  shareTwitterBtn.addEventListener('click', shareOnTwitter);
  shareFacebookBtn.addEventListener('click', shareOnFacebook);
  shareWhatsAppBtn.addEventListener('click', shareOnWhatsApp);

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      hide();
    }
  });

  // Issue reporting functionality with abuse protection
  const reportIssueToggle = document.getElementById('reportIssueToggle');
  const issueFormContainer = document.getElementById('issueFormContainer');
  const issueSelect = document.getElementById('issueSelect');
  const issueDetailsContainer = document.getElementById('issueDetailsContainer');
  const issueDetails = document.getElementById('issueDetails');
  const issueHoneypot = document.getElementById('issueHoneypot');
  const charCount = document.getElementById('charCount');
  const submitIssueBtn = document.getElementById('submitIssueBtn');
  const issueSuccess = document.getElementById('issueSuccess');

  // Session-based rate limiting (max 3 reports per session)
  const RATE_LIMIT_KEY = 'crimeHotspots_issueReports';
  const MAX_REPORTS = 3;

  function getReportCount() {
    return parseInt(sessionStorage.getItem(RATE_LIMIT_KEY) || '0');
  }

  function incrementReportCount() {
    const count = getReportCount() + 1;
    sessionStorage.setItem(RATE_LIMIT_KEY, count.toString());
    return count;
  }

  function isRateLimited() {
    return getReportCount() >= MAX_REPORTS;
  }

  // Toggle form visibility
  reportIssueToggle.addEventListener('click', () => {
    if (isRateLimited()) {
      alert('You have reached the maximum number of reports for this session. Please refresh if you need to report more issues.');
      return;
    }
    issueFormContainer.classList.toggle('hidden');
  });

  // Show textarea when issue type selected
  issueSelect.addEventListener('change', (e) => {
    if (e.target.value) {
      issueDetailsContainer.classList.remove('hidden');
      issueDetails.focus();
    } else {
      issueDetailsContainer.classList.add('hidden');
      issueDetails.value = '';
      charCount.textContent = '0/500';
    }
  });

  // Update character count
  issueDetails.addEventListener('input', (e) => {
    const length = e.target.value.length;
    charCount.textContent = `${length}/500`;
  });

  // Text sanitization
  function sanitizeInput(text) {
    return text
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/script/gi, '') // Remove script keyword
      .trim();
  }

  // Submit issue report
  submitIssueBtn.addEventListener('click', async () => {
    const issueType = issueSelect.value;
    const details = sanitizeInput(issueDetails.value);
    const honeypot = issueHoneypot.value;

    // Honeypot check - if filled, it's a bot
    if (honeypot) {
      console.warn('Bot detected via honeypot');
      issueSuccess.classList.remove('hidden');
      setTimeout(() => issueSuccess.classList.add('hidden'), 3000);
      return;
    }

    // Rate limit check
    if (isRateLimited()) {
      alert('You have reached the maximum number of reports for this session.');
      return;
    }

    if (!issueType || !currentCrime) return;

    try {
      // Use Web3Forms - simple, free, no CORS issues
      const formData = new FormData();
      formData.append('access_key', 'c3ca4fbb-23f5-43ef-80b5-66236933b403');
      formData.append('subject', `Crime Hotspots Issue Report: ${issueType}`);
      formData.append('from_name', 'Crime Hotspots User');

      // Issue details
      formData.append('Issue Type', issueType);
      formData.append('User Details', details || 'None provided');
      formData.append('Timestamp', new Date().toISOString());

      // Crime details
      formData.append('Headline', currentCrime.Headline || '');
      formData.append('Crime Type', currentCrime['Crime Type'] || '');
      formData.append('Date', currentCrime.Date || '');
      formData.append('Location', currentCrime['Street Address'] || currentCrime.Area || '');
      formData.append('Area', currentCrime.Area || '');
      formData.append('Country', currentCrime.Country || '');
      formData.append('Source URL', currentCrime.URL || '');
      formData.append('Plus Code', currentCrime.Location || '');
      formData.append('Report Page', window.location.href);

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Submission failed');
      }

      // Increment rate limit counter
      incrementReportCount();

      // Reset form and show success
      issueSelect.value = '';
      issueDetails.value = '';
      charCount.textContent = '0/500';
      issueDetailsContainer.classList.add('hidden');
      issueFormContainer.classList.add('hidden');
      issueSuccess.classList.remove('hidden');
      setTimeout(() => issueSuccess.classList.add('hidden'), 3000);
    } catch (error) {
      console.error('Failed to submit:', error);
      alert('Failed to submit report. Please try again.');
    }
  });

  return {
    show,
    hide
  };
}
