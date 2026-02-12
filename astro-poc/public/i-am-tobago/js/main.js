// ===========================================
// I AM TOBAGO - Landing Page Interactions
// ===========================================

(function () {
  'use strict';

  // --- Hero firefly light flares ---
  var canvas = document.getElementById('hero-fireflies');
  var ctx = canvas.getContext('2d');
  var fireflies = [];
  var fireflyCount = 18;
  var heroEl = document.getElementById('hero');
  var animating = true;

  function resizeCanvas() {
    canvas.width = heroEl.offsetWidth;
    canvas.height = heroEl.offsetHeight;
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  function createFirefly() {
    // Weighted random: 60% warm gold, 25% pale green, 15% soft orange
    var roll = Math.random();
    var hue, sat, light;
    if (roll < 0.60) {
      // Warm gold / amber
      hue = 38 + Math.random() * 12;    // 38-50
      sat = 85 + Math.random() * 15;
      light = 60 + Math.random() * 15;
    } else if (roll < 0.85) {
      // Pale ghostly green
      hue = 100 + Math.random() * 30;   // 100-130
      sat = 40 + Math.random() * 20;
      light = 55 + Math.random() * 20;
    } else {
      // Soft ember orange
      hue = 15 + Math.random() * 15;    // 15-30
      sat = 80 + Math.random() * 20;
      light = 55 + Math.random() * 15;
    }

    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: 1.5 + Math.random() * 2.5,
      glowRadius: 20 + Math.random() * 35,
      // Drift velocity — very slow, ethereal movement
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.2,
      // Each firefly pulses at its own rhythm
      pulseSpeed: 0.008 + Math.random() * 0.015,
      pulseOffset: Math.random() * Math.PI * 2,
      // Wander — slow directional changes
      wanderAngle: Math.random() * Math.PI * 2,
      wanderSpeed: 0.002 + Math.random() * 0.005,
      hue: hue,
      sat: sat,
      light: light
    };
  }

  for (var i = 0; i < fireflyCount; i++) {
    fireflies.push(createFirefly());
  }

  function drawFireflies(time) {
    if (!animating) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (var i = 0; i < fireflies.length; i++) {
      var f = fireflies[i];

      // Pulse opacity (smooth sine wave)
      var pulse = Math.sin(time * f.pulseSpeed + f.pulseOffset);
      // Map from [-1,1] to [0.05, 0.7] — never fully invisible, never too bright
      var opacity = 0.05 + (pulse + 1) * 0.325;

      // Wander — slowly change direction
      f.wanderAngle += (Math.random() - 0.5) * f.wanderSpeed;
      f.vx += Math.cos(f.wanderAngle) * 0.01;
      f.vy += Math.sin(f.wanderAngle) * 0.01;

      // Dampen velocity so they don't accelerate forever
      f.vx *= 0.99;
      f.vy *= 0.99;

      f.x += f.vx;
      f.y += f.vy;

      // Wrap around edges with padding
      if (f.x < -50) f.x = canvas.width + 50;
      if (f.x > canvas.width + 50) f.x = -50;
      if (f.y < -50) f.y = canvas.height + 50;
      if (f.y > canvas.height + 50) f.y = -50;

      // Outer glow
      var glow = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.glowRadius);
      glow.addColorStop(0, 'hsla(' + f.hue + ', ' + f.sat + '%, ' + f.light + '%, ' + (opacity * 0.4) + ')');
      glow.addColorStop(0.4, 'hsla(' + f.hue + ', ' + f.sat + '%, ' + f.light + '%, ' + (opacity * 0.15) + ')');
      glow.addColorStop(1, 'hsla(' + f.hue + ', ' + f.sat + '%, ' + f.light + '%, 0)');

      ctx.beginPath();
      ctx.arc(f.x, f.y, f.glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // Bright core
      var core = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius);
      core.addColorStop(0, 'hsla(' + f.hue + ', 100%, 85%, ' + opacity + ')');
      core.addColorStop(1, 'hsla(' + f.hue + ', ' + f.sat + '%, ' + f.light + '%, 0)');

      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
      ctx.fillStyle = core;
      ctx.fill();
    }

    requestAnimationFrame(drawFireflies);
  }

  requestAnimationFrame(drawFireflies);

  // Pause when hero is not visible (save battery)
  var heroObserver = new IntersectionObserver(function (entries) {
    animating = entries[0].isIntersecting;
    if (animating) requestAnimationFrame(drawFireflies);
  }, { threshold: 0 });
  heroObserver.observe(heroEl);

  // --- Navbar scroll effect ---
  const nav = document.getElementById('nav');

  function handleNavScroll() {
    if (window.scrollY > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll();

  // --- Mobile menu toggle ---
  const navToggle = document.getElementById('nav-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  let menuOpen = false;

  navToggle.addEventListener('click', function () {
    menuOpen = !menuOpen;
    if (menuOpen) {
      mobileMenu.classList.add('open');
      navToggle.setAttribute('aria-expanded', 'true');
    } else {
      mobileMenu.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Close mobile menu when a link is clicked
  mobileMenu.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      menuOpen = false;
      mobileMenu.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  // --- Scroll-based fade-in animations ---
  var animatedElements = document.querySelectorAll(
    '.about-card, .feature, .review-card, .about-excerpt, .author-layout, .buy-layout'
  );

  animatedElements.forEach(function (el) {
    el.classList.add('fade-in');
  });

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  animatedElements.forEach(function (el) {
    observer.observe(el);
  });

  // --- Smooth scroll for anchor links (fallback for older browsers) ---
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var targetId = this.getAttribute('href');
      if (targetId === '#') return;

      var target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        var offset = 70; // nav height
        var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });
})();
