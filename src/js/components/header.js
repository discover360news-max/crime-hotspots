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
            <img src="./assets/images/logo.png" alt="Crime Hotspots logo" class="h-16 w-auto" />
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
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
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

          <nav id="mainNav"
                class="relative z-50 hidden md:flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6
                        bg-white md:bg-transparent absolute md:static left-auto right-4 top-16 md:top-auto
                        border border-slate-200 md:border-0 rounded-lg md:rounded-none shadow-lg md:shadow-none
                        px-5 py-4 pb-6 md:p-0
                        max-h-0 md:max-h-none overflow-visible
                        opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto
                        transition-[max-height,opacity] duration-200 ease-in-out"
                role="navigation"
                aria-label="Primary">

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
  `;

  // Inject header
  const container = document.createElement('div');
  container.innerHTML = headerHTML.trim();
  document.body.prepend(container.firstChild);

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

  // Highlight nav section
  const navLinks = document.querySelectorAll('header [data-nav]');
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
      const items = document.querySelectorAll('#navHeadlinesMenu a[data-island]');
      items.forEach(a => {
        if (a.dataset.island === islandSlug) {
          a.classList.add('text-rose-600', 'font-semibold');
          a.setAttribute('aria-current', 'true');
        }
      });
      const btn = document.getElementById('navHeadlinesBtn');
      if (btn) btn.classList.add('text-rose-600', 'font-semibold');
    }
  }

  // ---------- Mobile toggle (improved for animated open/close) ----------
  const menuToggle = document.getElementById('menuToggle');
  const mainNav = document.getElementById('mainNav');

  if (menuToggle && mainNav) {
    function openNav() {
      mainNav.classList.remove('hidden');
      mainNav.classList.add('flex');
      // compute natural height
      mainNav.style.maxHeight = mainNav.scrollHeight + 'px';
      mainNav.classList.remove('opacity-0', 'pointer-events-none', 'overflow-hidden');
      mainNav.classList.add('opacity-100');
      menuToggle.setAttribute('aria-expanded', 'true');
    }

    function closeNav() {
      // collapse
      mainNav.style.maxHeight = '0px';
      mainNav.classList.remove('opacity-100');
      mainNav.classList.add('opacity-0', 'pointer-events-none', 'overflow-hidden');
      menuToggle.setAttribute('aria-expanded', 'false');
      // Hide after animation completes
      setTimeout(() => {
        if (menuToggle.getAttribute('aria-expanded') === 'false') {
          mainNav.classList.add('hidden');
          mainNav.classList.remove('flex');
        }
      }, 200);
    }

    // Initialize based on screen width
    if (window.innerWidth < 768) {
      // Already hidden by default on mobile
      menuToggle.setAttribute('aria-expanded', 'false');
    } else {
      // visible on desktop
      mainNav.style.maxHeight = 'none';
      mainNav.classList.remove('opacity-0', 'pointer-events-none', 'overflow-hidden', 'hidden');
      mainNav.classList.add('opacity-100');
    }

    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
      if (expanded) closeNav();
      else openNav();
    });

    // close if clicking outside header
    document.addEventListener('click', (e) => {
      const headerEl = document.querySelector('header');
      if (!headerEl.contains(e.target) && menuToggle.getAttribute('aria-expanded') === 'true') {
        closeNav();
      }
    });

    // close on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
        closeNav();
      }
    });

    // when resizing to desktop, reset inline styles so desktop layout shows normally
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 768) {
        mainNav.style.maxHeight = null;
        mainNav.classList.remove('opacity-0', 'pointer-events-none', 'overflow-hidden', 'hidden');
        mainNav.classList.add('opacity-100');
        menuToggle.setAttribute('aria-expanded', 'false');
      } else {
        // ensure collapsed when moving to small screens
        if (menuToggle.getAttribute('aria-expanded') !== 'true') {
          mainNav.style.maxHeight = '0px';
          mainNav.classList.add('opacity-0', 'pointer-events-none', 'overflow-hidden', 'hidden');
          mainNav.classList.remove('flex');
        }
      }
    });

    // Close menu when any nav link is clicked (mobile)
    mainNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth < 768) closeNav();
      });
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