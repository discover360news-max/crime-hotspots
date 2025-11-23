// src/js/components/header.js
import { COUNTRIES } from '../data/countries.js';

export function renderHeader(activeOverride = '') {
  // dynamically build dropdown from COUNTRIES
  const dropdownItems = COUNTRIES.map(c => {
    if (c.available) {
      return `
        <a href="headlines-${c.headlinesSlug}.html" data-island="${c.headlinesSlug}"
           class="block px-4 py-2 text-sm text-slate-700 hover:bg-rose-50 hover:text-rose-600"
           role="menuitem">
          ${c.flag} ${c.name}
        </a>`;
    } else {
      return `
        <a href="#" data-island="${c.headlinesSlug}"
           class="block px-4 py-2 text-sm text-slate-400 cursor-not-allowed"
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

          <!-- Mobile icons + hamburger menu (right side) -->
          <div class="flex md:hidden items-center gap-3 ml-auto">
            <a href="report.html"
               class="p-2 rounded-full text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-all"
               aria-label="Report a Crime"
               title="Report a Crime">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </a>
            <a href="blog.html"
               class="p-2 rounded-full text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-all"
               aria-label="Blog"
               title="Blog">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </a>
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

            <div class="relative group" data-nav="headlines">
              <button id="navHeadlinesBtn"
                class="text-sm text-slate-700 hover:text-rose-600 font-medium flex items-center gap-1 focus:outline-none"
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
                ${dropdownItems}
              </div>
            </div>

            <a href="blog.html" data-nav="blog"
               class="text-sm text-slate-700 hover:text-rose-600 font-medium">Blog</a>

            <a href="report.html" class="px-3 py-2 rounded-full bg-rose-600 text-white hover:bg-rose-700 transition">
              Report a Crime
            </a>

            <a href="about.html" data-nav="about"
               class="text-sm text-slate-700 hover:text-rose-600 font-medium">About</a>
          </nav>
        </div>
      </div>
    </header>

    <!-- Mobile menu backdrop -->
    <div id="mobileMenuBackdrop" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 hidden opacity-0 transition-opacity duration-300 md:hidden"></div>

    <!-- Mobile menu overlay -->
    <nav id="mobileNav" class="fixed top-0 right-0 bottom-0 w-72 bg-white shadow-2xl z-50 transform translate-x-full transition-transform duration-300 ease-out md:hidden overflow-y-auto" role="navigation" aria-label="Mobile menu">
      <div class="p-6">
        <div class="flex items-center justify-end mb-8">
          <button id="mobileMenuClose" class="p-2 rounded-full text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-all" aria-label="Close menu">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="space-y-1">
          <div data-nav="headlines">
            <button id="mobileHeadlinesBtn" class="w-full text-left text-base text-slate-700 hover:text-rose-600 font-medium flex items-center gap-2 py-3 border-b border-slate-200" aria-haspopup="true" aria-expanded="false">
              <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <span class="flex-1">Headlines</span>
              <svg class="w-5 h-5 transform transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div id="mobileHeadlinesMenu" class="hidden mt-2 ml-4 space-y-2">
              ${dropdownItems.replace(/block px-4 py-2 text-sm/g, 'block py-2 text-sm')}
            </div>
          </div>

          <a href="blog.html" data-nav="blog" class="flex items-center gap-2 text-base text-slate-700 hover:text-rose-600 font-medium py-3 border-b border-slate-200">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Blog
          </a>

          <a href="report.html" class="flex items-center gap-2 text-base text-rose-600 hover:text-rose-700 font-medium py-3 border-b border-slate-200">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Report a Crime
          </a>

          <a href="about.html" data-nav="about" class="flex items-center gap-2 text-base text-slate-700 hover:text-rose-600 font-medium py-3 border-b border-slate-200">
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

  // ---------- Auto-active highlight (unchanged) ----------
  const path = window.location.pathname.split('/').pop() || 'index.html';
  let active = activeOverride || '';

  if (!active) {
    if (/^headlines-/.test(path)) active = 'headlines';
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

  // Mobile headlines dropdown
  const mobileHeadlinesBtn = document.getElementById('mobileHeadlinesBtn');
  const mobileHeadlinesMenu = document.getElementById('mobileHeadlinesMenu');

  if (mobileHeadlinesBtn && mobileHeadlinesMenu) {
    mobileHeadlinesBtn.addEventListener('click', () => {
      const isExpanded = mobileHeadlinesBtn.getAttribute('aria-expanded') === 'true';

      if (isExpanded) {
        mobileHeadlinesMenu.classList.add('hidden');
        mobileHeadlinesBtn.setAttribute('aria-expanded', 'false');
        mobileHeadlinesBtn.querySelector('svg').classList.remove('rotate-180');
      } else {
        mobileHeadlinesMenu.classList.remove('hidden');
        mobileHeadlinesBtn.setAttribute('aria-expanded', 'true');
        mobileHeadlinesBtn.querySelector('svg').classList.add('rotate-180');
      }
    });
  }

  // ---------- Mobile dropdown tap behavior (unchanged) ----------
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
}