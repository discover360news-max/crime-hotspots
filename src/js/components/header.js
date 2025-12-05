// src/js/components/header.js
import { COUNTRIES } from '../data/countries.js';

export function renderHeader(activeOverride = '') {
  // Check if we're on the homepage
  const path = window.location.pathname.split('/').pop() || 'index.html';
  const isHomepage = path === 'index.html' || path === '';

  // Build headlines dropdown from COUNTRIES
  const headlinesDropdownItems = COUNTRIES.map(c => {
    if (c.available) {
      return `
        <a href="headlines-${c.headlinesSlug}.html" data-island="${c.headlinesSlug}"
           class="block px-4 py-2 text-nav text-slate-700 hover:bg-rose-50 hover:text-rose-600"
           role="menuitem">
          ${c.flag} ${c.name}
        </a>`;
    } else {
      return `
        <a href="#" data-island="${c.headlinesSlug}"
           class="block px-4 py-2 text-nav text-slate-400 cursor-not-allowed"
           role="menuitem" aria-disabled="true">
          ${c.flag} ${c.name} (Coming Soon)
        </a>`;
    }
  }).join('');

  // Build dashboard dropdown from COUNTRIES (only show when NOT on homepage)
  const dashboardDropdownItems = COUNTRIES.map(c => {
    if (c.available) {
      return `
        <a href="${c.dashboard}" data-dashboard="${c.id}"
           class="block px-4 py-2 text-nav text-slate-700 hover:bg-rose-50 hover:text-rose-600"
           role="menuitem">
          ${c.flag} ${c.name}
        </a>`;
    } else {
      return `
        <a href="#" data-dashboard="${c.id}"
           class="block px-4 py-2 text-nav text-slate-400 cursor-not-allowed"
           role="menuitem" aria-disabled="true">
          ${c.flag} ${c.name} (Coming Soon)
        </a>`;
    }
  }).join('');

  const headerHTML = `
    <header class="bg-white shadow-sm sticky top-0 z-40">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <a href="index.html" class="flex items-center" data-nav="home">
            <img src="./assets/images/logo.png" alt="Crime Hotspots logo" class="h-12 md:h-16 w-auto" />
          </a>

          <!-- Mobile subscribe + hamburger menu (right side) -->
          <div class="flex md:hidden items-center gap-2 ml-auto">
            <button id="subscribeToggleMobile"
                    class="px-3 py-1.5 rounded-lg border border-rose-600 text-rose-600 hover:bg-rose-50 transition text-small font-medium"
                    aria-label="Subscribe to our channels">
              Subscribe
            </button>
            <button id="menuToggle"
                    class="inline-flex items-center justify-center p-2 rounded-md text-slate-700 hover:bg-slate-100 active:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-300 transition-all"
                    aria-controls="mainNav"
                    aria-expanded="false">
              <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          <!-- Desktop nav -->
          <nav id="mainNav" class="hidden md:flex items-center gap-6" role="navigation" aria-label="Primary">

            ${!isHomepage ? `
            <div class="relative group" data-nav="dashboard">
              <button id="navDashboardBtn"
                class="text-nav text-slate-700 hover:text-rose-600 font-medium flex items-center gap-1 focus:outline-none"
                aria-haspopup="true" aria-expanded="false">
                View Dashboard
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div id="navDashboardMenu"
                   class="absolute right-0 w-56 bg-white border border-slate-200 rounded-lg shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200"
                   role="menu"
                   aria-label="Dashboard by island">
                ${dashboardDropdownItems}
              </div>
            </div>
            ` : ''}

            <div class="relative group" data-nav="headlines">
              <button id="navHeadlinesBtn"
                class="text-nav text-slate-700 hover:text-rose-600 font-medium flex items-center gap-1 focus:outline-none"
                aria-haspopup="true" aria-expanded="false">
                View Headlines
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div id="navHeadlinesMenu"
                   class="absolute right-0 w-56 bg-white border border-slate-200 rounded-lg shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200"
                   role="menu"
                   aria-label="Headlines by island">
                ${headlinesDropdownItems}
              </div>
            </div>

            <a href="blog.html" data-nav="blog"
               class="text-nav text-slate-700 hover:text-rose-600 font-medium">Blog</a>

            <a href="report.html" class="px-3 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition text-nav">
              Report a Crime
            </a>

            <a href="about.html" data-nav="about"
               class="text-nav text-slate-700 hover:text-rose-600 font-medium">About</a>

            <button id="subscribeToggle"
                    class="px-4 py-1.5 rounded-lg border border-rose-600 text-rose-600 hover:bg-rose-50 transition text-nav font-medium"
                    aria-label="Subscribe to our channels">
              Subscribe
            </button>
          </nav>
        </div>

        <!-- Separator (top of pills) - MOBILE ONLY -->
        <div class="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent md:hidden"></div>

        <!-- Quick Access Pills (horizontal scroll) - MOBILE ONLY -->
        <div class="bg-white md:hidden">
          <div class="relative">
              <div id="pillsContainer" class="flex items-center gap-2 py-2.5 overflow-x-auto snap-x snap-mandatory hide-scrollbar px-4">
                <a href="report.html"
                   class="flex-shrink-0 snap-start px-4 py-1.5 min-h-[22px] flex items-center justify-center rounded-full border border-slate-300 text-rose-600 hover:bg-rose-700 transition text-small font-medium whitespace-nowrap">
                  Report Crime
                </a>
                <a href="headlines-trinidad-and-tobago.html"
                   class="flex-shrink-0 snap-start px-4 py-1.5 min-h-[22px] flex items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:border-rose-600 hover:text-rose-600 transition text-small font-medium whitespace-nowrap">
                  T & T+
                </a>
                <a href="headlines-guyana.html"
                   class="flex-shrink-0 snap-start px-4 py-1.5 min-h-[22px] flex items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:border-rose-600 hover:text-rose-600 transition text-small font-medium whitespace-nowrap">
                  GY+
                </a>
                <a href="dashboard-barbados.html"
                   class="flex-shrink-0 snap-start px-4 py-1.5 min-h-[22px] flex items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:border-rose-600 hover:text-rose-600 transition text-small font-medium whitespace-nowrap">
                  Barbados+
                </a>
                <a href="dashboard-guyana.html"
                   class="flex-shrink-0 snap-start px-4 py-1.5 min-h-[22px] flex items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:border-rose-600 hover:text-rose-600 transition text-small font-medium whitespace-nowrap">
                  GY Dashboard
                </a>
                <a href="blog.html"
                   class="flex-shrink-0 snap-start px-4 py-1.5 min-h-[22px] flex items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:border-rose-600 hover:text-rose-600 transition text-small font-medium whitespace-nowrap">
                  Blog+
                </a>
                <a href="about.html"
                   class="flex-shrink-0 snap-start px-4 py-1.5 min-h-[22px] flex items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:border-rose-600 hover:text-rose-600 transition text-small font-medium whitespace-nowrap">
                  About
                </a>
                <a href="faq.html"
                   class="flex-shrink-0 snap-start px-4 py-1.5 min-h-[22px] flex items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:border-rose-600 hover:text-rose-600 transition text-small font-medium whitespace-nowrap">
                  FAQ
                </a>
                <a href="methodology.html"
                   class="flex-shrink-0 snap-start px-4 py-1.5 min-h-[22px] flex items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:border-rose-600 hover:text-rose-600 transition text-small font-medium whitespace-nowrap">
                  Methodology
                </a>
              </div>

            <!-- Fade gradient + pulsing arrow (right side) -->
            <div id="pillsScrollHint" class="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white via-white/90 to-transparent pointer-events-none flex items-center justify-end pr-2">
              <svg class="w-4 h-4 text-rose-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
            </div>
          </div>
        </div>

        <!-- Separator (bottom of pills) - MOBILE ONLY -->
        <div class="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent md:hidden"></div>
      </div>
    </header>

    <!-- Subscribe tray backdrop -->
    <div id="subscribeBackdrop" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 hidden opacity-0 transition-opacity duration-300"></div>

    <!-- Subscribe tray -->
    <div id="subscribeTray" class="fixed top-0 right-0 bottom-0 w-72 bg-white/60 backdrop-blur-lg shadow-2xl rounded-l-2xl z-50 transform translate-x-full transition-transform duration-300 ease-out overflow-y-auto">
      <div class="p-6">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-h3 font-bold text-slate-800">Follow Us</h2>
          <button id="subscribeClose" class="p-2 rounded-full text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-all" aria-label="Close subscribe menu">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p class="text-body text-slate-600 mb-6">
          Stay updated with the latest Caribbean crime news and insights.
        </p>

        <div class="space-y-4">
          <a href="https://x.com/crimehotsp0ts" target="_blank" rel="noopener noreferrer"
             class="flex items-center gap-4 p-4 rounded-lg border border-slate-200 hover:border-rose-600 hover:bg-rose-50 transition-all group">
            <svg class="w-8 h-8 text-slate-700 group-hover:text-rose-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <div>
              <div class="text-nav font-semibold text-slate-800 group-hover:text-rose-600">X (Twitter)</div>
              <div class="text-small text-slate-600">@crimehotsp0ts</div>
            </div>
          </a>

          <a href="https://facebook.com/caribbeancrimehotspots" target="_blank" rel="noopener noreferrer"
             class="flex items-center gap-4 p-4 rounded-lg border border-slate-200 hover:border-rose-600 hover:bg-rose-50 transition-all group">
            <svg class="w-8 h-8 text-slate-700 group-hover:text-rose-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <div>
              <div class="text-nav font-semibold text-slate-800 group-hover:text-rose-600">Facebook</div>
              <div class="text-small text-slate-600">@caribbeancrimehotspots</div>
            </div>
          </a>

          <a href="https://whatsapp.com/channel/0029VbBD2mC3gvWTuWxMO21P" target="_blank" rel="noopener noreferrer"
             class="flex items-center gap-4 p-4 rounded-lg border border-slate-200 hover:border-rose-600 hover:bg-rose-50 transition-all group">
            <svg class="w-8 h-8 text-slate-700 group-hover:text-rose-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            <div>
              <div class="text-nav font-semibold text-slate-800 group-hover:text-rose-600">WhatsApp Channel</div>
              <div class="text-small text-slate-600">Get updates</div>
            </div>
          </a>

          <a href="https://instagram.com/crimehotspots" target="_blank" rel="noopener noreferrer"
             class="flex items-center gap-4 p-4 rounded-lg border border-slate-200 hover:border-rose-600 hover:bg-rose-50 transition-all group">
            <svg class="w-8 h-8 text-slate-700 group-hover:text-rose-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            <div>
              <div class="text-nav font-semibold text-slate-800 group-hover:text-rose-600">Instagram</div>
              <div class="text-small text-slate-600">@crimehotspots</div>
            </div>
          </a>
        </div>
      </div>
    </div>

    <!-- Mobile menu backdrop -->
    <div id="mobileMenuBackdrop" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 hidden opacity-0 transition-opacity duration-300 md:hidden"></div>

    <!-- Mobile menu overlay -->
    <nav id="mobileNav" class="fixed top-0 right-0 bottom-0 w-72 bg-white/60 backdrop-blur-lg shadow-2xl rounded-l-2xl z-50 transform translate-x-full transition-transform duration-300 ease-out md:hidden overflow-y-auto" role="navigation" aria-label="Mobile menu">
      <div class="p-6">
        <div class="flex items-center justify-end mb-8">
          <button id="mobileMenuClose" class="p-2 rounded-full text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-all" aria-label="Close menu">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="space-y-1">
          ${!isHomepage ? `
          <div data-nav="dashboard">
            <button id="mobileDashboardBtn" class="w-full text-left text-nav text-slate-700 hover:text-rose-600 font-medium flex items-center gap-2 py-3 border-b border-slate-200" aria-haspopup="true" aria-expanded="false">
              <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span class="flex-1">Dashboard</span>
              <svg class="w-5 h-5 transform transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div id="mobileDashboardMenu" class="hidden mt-2 ml-4 space-y-2">
              ${dashboardDropdownItems.replace(/block px-4 py-2 text-nav/g, 'block py-2 text-nav')}
            </div>
          </div>
          ` : ''}

          <div data-nav="headlines">
            <button id="mobileHeadlinesBtn" class="w-full text-left text-nav text-slate-700 hover:text-rose-600 font-medium flex items-center gap-2 py-3 border-b border-slate-200" aria-haspopup="true" aria-expanded="false">
              <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <span class="flex-1">Headlines</span>
              <svg class="w-5 h-5 transform transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div id="mobileHeadlinesMenu" class="hidden mt-2 ml-4 space-y-2">
              ${headlinesDropdownItems.replace(/block px-4 py-2 text-nav/g, 'block py-2 text-nav')}
            </div>
          </div>

          <a href="blog.html" data-nav="blog" class="flex items-center gap-2 text-nav text-slate-700 hover:text-rose-600 font-medium py-3 border-b border-slate-200">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Blog
          </a>

          <a href="report.html" class="flex items-center gap-2 text-nav text-rose-600 hover:text-rose-700 font-medium py-3 border-b border-slate-200">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Report a Crime
          </a>

          <a href="about.html" data-nav="about" class="flex items-center gap-2 text-nav text-slate-700 hover:text-rose-600 font-medium py-3 border-b border-slate-200">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            About
          </a>
        </div>
      </div>
    </nav>
  `;

  // Inject header and mobile menu
  const tempContainer = document.createElement('div');
  tempContainer.innerHTML = headerHTML.trim();

  // Insert all elements (header, backdrop, mobile nav)
  while (tempContainer.firstChild) {
    document.body.prepend(tempContainer.lastChild);
  }

  // ---------- Auto-active highlight ----------
  let active = activeOverride || '';

  if (!active) {
    if (/^headlines-/.test(path)) active = 'headlines';
    else if (/^dashboard-/.test(path)) active = 'dashboard';
    else if (path === 'index.html' || path === '') active = 'home';
    else if (path === 'about.html') active = 'about';
    else if (path === 'report.html') active = 'report';
    else if (path === 'blog.html' || path === 'blog-post.html') active = 'blog';
  }

  // Highlight nav section (desktop and mobile)
  const navLinks = document.querySelectorAll('header [data-nav], #mobileNav [data-nav]');
  navLinks.forEach(el => {
    if (el.dataset.nav === active) {
      el.classList.add('text-rose-600', 'font-semibold');
      el.setAttribute('aria-current', 'page');
    } else {
      el.classList.remove('text-rose-600', 'font-semibold');
      el.removeAttribute('aria-current');
    }
  });

  // Highlight specific dashboard (for dashboard pages)
  if (active === 'dashboard') {
    const match = path.match(/^dashboard-([a-z0-9-]+)\.html$/i);
    if (match) {
      const dashboardSlug = match[1];
      // Match by the dashboard path
      const items = document.querySelectorAll('#navDashboardMenu a[data-dashboard], #mobileDashboardMenu a[data-dashboard]');
      items.forEach(a => {
        const href = a.getAttribute('href');
        if (href && href.includes(`dashboard-${dashboardSlug}.html`)) {
          a.classList.add('text-rose-600', 'font-semibold');
          a.setAttribute('aria-current', 'true');
        }
      });
      const btn = document.getElementById('navDashboardBtn');
      if (btn) btn.classList.add('text-rose-600', 'font-semibold');
      const mobileBtn = document.getElementById('mobileDashboardBtn');
      if (mobileBtn) mobileBtn.classList.add('text-rose-600', 'font-semibold');
    }
  }

  // Highlight specific island (for headlines pages)
  if (active === 'headlines') {
    const match = path.match(/^headlines-([a-z0-9-]+)\.html$/i);
    if (match) {
      const islandSlug = match[1];
      const items = document.querySelectorAll('#navHeadlinesMenu a[data-island], #mobileHeadlinesMenu a[data-island]');
      items.forEach(a => {
        if (a.dataset.island === islandSlug) {
          a.classList.add('text-rose-600', 'font-semibold');
          a.setAttribute('aria-current', 'true');
        }
      });
      const btn = document.getElementById('navHeadlinesBtn');
      if (btn) btn.classList.add('text-rose-600', 'font-semibold');
      const mobileBtn = document.getElementById('mobileHeadlinesBtn');
      if (mobileBtn) mobileBtn.classList.add('text-rose-600', 'font-semibold');
    }
  }

  // ---------- Mobile overlay menu ----------
  const menuToggle = document.getElementById('menuToggle');
  const mobileNav = document.getElementById('mobileNav');
  const mobileBackdrop = document.getElementById('mobileMenuBackdrop');
  const mobileMenuClose = document.getElementById('mobileMenuClose');

  function openMobileMenu() {
    mobileBackdrop.classList.remove('hidden');
    mobileNav.classList.remove('translate-x-full');
    mobileNav.classList.add('translate-x-0');
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => {
      mobileBackdrop.classList.remove('opacity-0');
      mobileBackdrop.classList.add('opacity-100');
    });

    menuToggle.setAttribute('aria-expanded', 'true');
  }

  function closeMobileMenu() {
    mobileNav.classList.remove('translate-x-0');
    mobileNav.classList.add('translate-x-full');
    mobileBackdrop.classList.remove('opacity-100');
    mobileBackdrop.classList.add('opacity-0');
    document.body.style.overflow = '';

    setTimeout(() => {
      mobileBackdrop.classList.add('hidden');
    }, 300);

    menuToggle.setAttribute('aria-expanded', 'false');
  }

  if (menuToggle && mobileNav) {
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
      if (isOpen) closeMobileMenu();
      else openMobileMenu();
    });

    if (mobileMenuClose) {
      mobileMenuClose.addEventListener('click', closeMobileMenu);
    }

    if (mobileBackdrop) {
      mobileBackdrop.addEventListener('click', closeMobileMenu);
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
        closeMobileMenu();
      }
    });

    // Close menu when links are clicked
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        closeMobileMenu();
      });
    });
  }

  // Mobile dashboard dropdown
  const mobileDashboardBtn = document.getElementById('mobileDashboardBtn');
  const mobileDashboardMenu = document.getElementById('mobileDashboardMenu');

  if (mobileDashboardBtn && mobileDashboardMenu) {
    mobileDashboardBtn.addEventListener('click', () => {
      const isExpanded = mobileDashboardBtn.getAttribute('aria-expanded') === 'true';

      if (isExpanded) {
        mobileDashboardMenu.classList.add('hidden');
        mobileDashboardBtn.setAttribute('aria-expanded', 'false');
        mobileDashboardBtn.querySelectorAll('svg')[1].classList.remove('rotate-180');
      } else {
        mobileDashboardMenu.classList.remove('hidden');
        mobileDashboardBtn.setAttribute('aria-expanded', 'true');
        mobileDashboardBtn.querySelectorAll('svg')[1].classList.add('rotate-180');
      }
    });
  }

  // Mobile headlines dropdown
  const mobileHeadlinesBtn = document.getElementById('mobileHeadlinesBtn');
  const mobileHeadlinesMenu = document.getElementById('mobileHeadlinesMenu');

  if (mobileHeadlinesBtn && mobileHeadlinesMenu) {
    mobileHeadlinesBtn.addEventListener('click', () => {
      const isExpanded = mobileHeadlinesBtn.getAttribute('aria-expanded') === 'true';

      if (isExpanded) {
        mobileHeadlinesMenu.classList.add('hidden');
        mobileHeadlinesBtn.setAttribute('aria-expanded', 'false');
        mobileHeadlinesBtn.querySelectorAll('svg')[1].classList.remove('rotate-180');
      } else {
        mobileHeadlinesMenu.classList.remove('hidden');
        mobileHeadlinesBtn.setAttribute('aria-expanded', 'true');
        mobileHeadlinesBtn.querySelectorAll('svg')[1].classList.add('rotate-180');
      }
    });
  }

  // ---------- Desktop dropdown tap behavior for Dashboard ----------
  const navDashboardBtn = document.getElementById('navDashboardBtn');
  const navDashboardMenu = document.getElementById('navDashboardMenu');

  if (navDashboardBtn && navDashboardMenu) {
    function openDashboardDropdown() {
      navDashboardMenu.classList.add('opacity-100', 'visible');
      navDashboardMenu.classList.remove('opacity-0', 'invisible');
      navDashboardBtn.setAttribute('aria-expanded', 'true');
    }

    function closeDashboardDropdown() {
      navDashboardMenu.classList.remove('opacity-100', 'visible');
      navDashboardMenu.classList.add('opacity-0', 'invisible');
      navDashboardBtn.setAttribute('aria-expanded', 'false');
    }

    const isMobile = () => window.innerWidth < 768;

    navDashboardBtn.addEventListener('click', (e) => {
      if (!isMobile()) return; // keep hover behavior on desktop
      e.preventDefault();
      e.stopPropagation();
      const expanded = navDashboardBtn.getAttribute('aria-expanded') === 'true';
      if (expanded) closeDashboardDropdown();
      else openDashboardDropdown();
    });

    document.addEventListener('click', (e) => {
      if (isMobile() && !navDashboardBtn.contains(e.target) && !navDashboardMenu.contains(e.target)) {
        closeDashboardDropdown();
      }
    });

    window.addEventListener('resize', () => {
      if (!isMobile()) {
        closeDashboardDropdown();
      } else {
        if (navDashboardBtn.getAttribute('aria-expanded') !== 'true') {
          closeDashboardDropdown();
        }
      }
    });
  }

  // ---------- Desktop dropdown tap behavior for Headlines ----------
  const navHeadlinesBtn = document.getElementById('navHeadlinesBtn');
  const navHeadlinesMenu = document.getElementById('navHeadlinesMenu');

  if (navHeadlinesBtn && navHeadlinesMenu) {
    function openDropdown() {
      navHeadlinesMenu.classList.add('opacity-100', 'visible');
      navHeadlinesMenu.classList.remove('opacity-0', 'invisible');
      navHeadlinesBtn.setAttribute('aria-expanded', 'true');
    }

    function closeDropdown() {
      navHeadlinesMenu.classList.remove('opacity-100', 'visible');
      navHeadlinesMenu.classList.add('opacity-0', 'invisible');
      navHeadlinesBtn.setAttribute('aria-expanded', 'false');
    }

    const isMobile = () => window.innerWidth < 768;

    navHeadlinesBtn.addEventListener('click', (e) => {
      if (!isMobile()) return; // keep hover behavior on desktop
      e.preventDefault();
      e.stopPropagation();
      const expanded = navHeadlinesBtn.getAttribute('aria-expanded') === 'true';
      if (expanded) closeDropdown();
      else openDropdown();
    });

    document.addEventListener('click', (e) => {
      if (isMobile() && !navHeadlinesBtn.contains(e.target) && !navHeadlinesMenu.contains(e.target)) {
        closeDropdown();
      }
    });

    window.addEventListener('resize', () => {
      if (!isMobile()) {
        // Close menu explicitly on desktop resize so CSS hover takes over.
        closeDropdown();
      } else {
        // Close on mobile resize unless already open by tap
        if (navHeadlinesBtn.getAttribute('aria-expanded') !== 'true') {
            closeDropdown();
        }
      }
    });
  }

  // ---------- Subscribe tray ----------
  const subscribeToggle = document.getElementById('subscribeToggle');
  const subscribeToggleMobile = document.getElementById('subscribeToggleMobile');
  const subscribeTray = document.getElementById('subscribeTray');
  const subscribeBackdrop = document.getElementById('subscribeBackdrop');
  const subscribeClose = document.getElementById('subscribeClose');

  function openSubscribeTray() {
    subscribeBackdrop.classList.remove('hidden');
    subscribeTray.classList.remove('translate-x-full');
    subscribeTray.classList.add('translate-x-0');
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => {
      subscribeBackdrop.classList.remove('opacity-0');
      subscribeBackdrop.classList.add('opacity-100');
    });
  }

  function closeSubscribeTray() {
    subscribeTray.classList.remove('translate-x-0');
    subscribeTray.classList.add('translate-x-full');
    subscribeBackdrop.classList.remove('opacity-100');
    subscribeBackdrop.classList.add('opacity-0');
    document.body.style.overflow = '';

    setTimeout(() => {
      subscribeBackdrop.classList.add('hidden');
    }, 300);
  }

  // Desktop subscribe button
  if (subscribeToggle && subscribeTray) {
    subscribeToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      openSubscribeTray();
    });
  }

  // Mobile subscribe button
  if (subscribeToggleMobile && subscribeTray) {
    subscribeToggleMobile.addEventListener('click', (e) => {
      e.stopPropagation();
      openSubscribeTray();
    });
  }

  // Close handlers
  if (subscribeClose) {
    subscribeClose.addEventListener('click', closeSubscribeTray);
  }

  if (subscribeBackdrop) {
    subscribeBackdrop.addEventListener('click', closeSubscribeTray);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && subscribeTray && subscribeTray.classList.contains('translate-x-0')) {
      closeSubscribeTray();
    }
  });

  // ---------- Pills scroll hint ----------
  const pillsContainer = document.getElementById('pillsContainer');
  const pillsScrollHint = document.getElementById('pillsScrollHint');

  if (pillsContainer && pillsScrollHint) {
    function checkPillsScroll() {
      const isScrollable = pillsContainer.scrollWidth > pillsContainer.clientWidth;
      const isAtEnd = pillsContainer.scrollLeft + pillsContainer.clientWidth >= pillsContainer.scrollWidth - 10;

      if (!isScrollable || isAtEnd) {
        pillsScrollHint.style.opacity = '0';
      } else {
        pillsScrollHint.style.opacity = '1';
      }
    }

    pillsContainer.addEventListener('scroll', checkPillsScroll);
    window.addEventListener('resize', checkPillsScroll);

    // Check on load
    setTimeout(checkPillsScroll, 100);
  }
}