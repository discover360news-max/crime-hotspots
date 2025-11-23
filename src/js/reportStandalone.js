// src/js/reportStandalone.js (FINAL VERSION)

import Papa from "https://cdn.jsdelivr.net/npm/papaparse@5.4.1/+esm";
import { COUNTRIES } from "./data/countries.js";

// === CRITICAL: REPLACE THIS URL ===
// Use the deployed URL from your Google Apps Script, NOT the placeholder.
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbysi5VEpdS2nL9Ci9BWTn0ydXWA_IdR7j_3MR_EW5uK92N62xbt5OB0sKu2wMLGhkb7/exec";
// ===================================

const countrySelect = document.getElementById("reportCountry");
const areaSelect = document.getElementById("reportArea");
const form = document.getElementById("reportForm");
const resultBox = document.getElementById("reportResult");
const submitBtn = document.getElementById("reportSubmit");
const hp = document.getElementById("hp_field");

// --- Utility ---
function generateId(prefix = "REP") {
  const n = new Date();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${n.getFullYear()}${String(n.getMonth() + 1).padStart(2, "0")}${String(
    n.getDate()
  ).padStart(2, "0")}-${rand}`;
}

function cleanAreaName(str) {
  return str.trim(); // Ensure only basic trimming
}

// Validated localStorage getter - prevents XSS and injection attacks
function getValidatedLocalStorage(key, validator) {
  try {
    const value = localStorage.getItem(key);
    if (!value) return null;

    const clean = value.trim();

    // Basic sanitization - remove dangerous characters
    if (/<script|javascript:|data:|vbscript:/i.test(clean)) {
      console.warn(`Blocked suspicious localStorage value for ${key}`);
      localStorage.removeItem(key);
      return null;
    }

    // Run custom validator if provided
    if (validator && !validator(clean)) {
      console.warn(`Invalid localStorage value for ${key}`);
      localStorage.removeItem(key);
      return null;
    }

    return clean;
  } catch (e) {
    console.error('localStorage access error:', e);
    return null;
  }
}

// --- Data & DOM Population ---

function loadCountries() {
  countrySelect.innerHTML = `<option value="">Select a Country</option>`;
  COUNTRIES.filter(c => c.available).forEach((country) => {
    const option = document.createElement("option");
    option.value = country.id;
    option.textContent = country.name;
    countrySelect.appendChild(option);
  });
}

function loadAreas(country) {
  areaSelect.disabled = true;
  areaSelect.innerHTML = `<option>Loading Areas...</option>`;
  
  const csvUrl = country?.csvUrl; // Check for country-specific URL

  if (!csvUrl) {
    // Handle countries without a defined CSV area list
    areaSelect.innerHTML = `<option>N/A (No area data for ${country.name})</option>`;
    areaSelect.value = "N/A"; // Set a default value to submit
    areaSelect.disabled = true;
    return;
  }

  Papa.parse(csvUrl, {
    download: true,
    header: true,
    complete: function (results) {
      const areaNames = results.data
        .map((r) => r.Area)
        .filter((area) => area && area.trim().length > 0)
        .map(cleanAreaName)
        // Deduplicate and sort
        .filter((value, index, self) => self.indexOf(value) === index)
        .sort((a, b) => a.localeCompare(b));

      areaSelect.innerHTML = `<option value="">Select Area (Optional)</option>`;
      areaNames.forEach((area) => {
        const option = document.createElement("option");
        option.value = area;
        option.textContent = area;
        areaSelect.appendChild(option);
      });

      areaSelect.disabled = false;

      // Attempt to restore last selected area with validation
      const savedArea = getValidatedLocalStorage("ccw_selected_area", (val) => {
        // Validate: must be alphanumeric with spaces, hyphens, commas only
        return /^[a-zA-Z0-9\s\-,]+$/.test(val) && val.length < 100 && areaNames.includes(val);
      });
      if (savedArea) {
          areaSelect.value = savedArea;
      }
    },
    error: (err) => {
      console.error("Area CSV parse error:", err);
      areaSelect.innerHTML = `<option>Error loading areas</option>`;
    },
  });
}

// --- Enhanced Honeypot Validation ---
function validateHoneypot() {
  // 1. Check if field was filled
  if (hp && hp.value) {
    console.warn('Honeypot: field filled');
    return false;
  }

  // 2. Check if field was focused (bots rarely trigger focus)
  const wasFocused = hp && hp.dataset.focused === 'true';
  if (wasFocused) {
    console.warn('Honeypot: field focused');
    return false;
  }

  // 3. Time-based check (submissions < 2 seconds are suspicious)
  const formLoadTime = parseInt(sessionStorage.getItem('formLoadTime') || '0');
  const timeDelta = Date.now() - formLoadTime;
  if (timeDelta < 2000) {
    console.warn('Honeypot: too fast submission');
    return false;
  }

  // 4. Mouse movement check (basic human interaction validation)
  const mouseMovements = parseInt(sessionStorage.getItem('mouseMovements') || '0');
  if (mouseMovements < 3) {
    console.warn('Honeypot: insufficient mouse activity');
    return false;
  }

  return true;
}

// --- Rate Limiter Class ---
class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  canMakeRequest() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      return false;
    }

    this.requests.push(now);
    return true;
  }

  getTimeUntilNextRequest() {
    if (this.requests.length === 0) return 0;
    const now = Date.now();
    const oldestRequest = this.requests[0];
    return Math.max(0, this.windowMs - (now - oldestRequest));
  }
}

const submitLimiter = new RateLimiter(3, 3600000); // 3 submissions per hour

// --- Form Validation ---
function validateForm(formData) {
  const errors = [];

  // Date validation
  const dateStr = formData.get('reportDate');
  const date = new Date(dateStr);
  const today = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  if (isNaN(date.getTime())) {
    errors.push('Invalid date format');
  } else if (date > today) {
    errors.push('Date cannot be in the future');
  } else if (date < oneYearAgo) {
    errors.push('Please report incidents from the past year only');
  }

  // Headline validation
  const headline = formData.get('reportHeadline');
  if (!headline || headline.trim().length < 10) {
    errors.push('Headline must be at least 10 characters');
  }
  if (headline && headline.length > 120) {
    errors.push('Headline must be under 120 characters');
  }
  if (headline && /<script|javascript:|data:|vbscript:/i.test(headline)) {
    errors.push('Headline contains invalid characters');
  }

  // Details validation
  const details = formData.get('reportDetails');
  if (!details || details.trim().length < 20) {
    errors.push('Please provide at least 20 characters of details');
  }
  if (details && details.length > 5000) {
    errors.push('Details must be under 5000 characters');
  }

  // Country validation
  const countryId = formData.get('reportCountry');
  if (!countryId || !COUNTRIES.some(c => c.id === countryId)) {
    errors.push('Invalid country selection');
  }

  // Crime type validation
  const validCrimes = ['Assault', 'Burglary', 'Home Invasion', 'Kidnapping', 'Murder', 'Robbery', 'Shooting', 'Theft', 'Other'];
  const crimeType = formData.get('reportCrimeType');
  if (!crimeType || !validCrimes.includes(crimeType)) {
    errors.push('Invalid crime type');
  }

  return errors;
}

// --- Submission Handler ---

form.addEventListener("submit", handleSubmit);

async function handleSubmit(e) {
  e.preventDefault();

  // Rate limiting check
  if (!submitLimiter.canMakeRequest()) {
    const waitTime = Math.ceil(submitLimiter.getTimeUntilNextRequest() / 60000); // Convert to minutes
    resultBox.classList.remove("hidden");
    resultBox.classList.add('bg-rose-50', 'border-rose-200', 'text-rose-700');
    resultBox.textContent = `⏱️ Rate limit exceeded. Please wait ${waitTime} minute(s) before submitting again.`;
    return;
  }

  // Enhanced honeypot validation
  if (!validateHoneypot()) {
    console.warn('Bot detected by honeypot');
    return;
  }

  // Form validation
  const formData = new FormData(form);
  const validationErrors = validateForm(formData);

  if (validationErrors.length > 0) {
    resultBox.classList.remove("hidden");
    resultBox.classList.add('bg-rose-50', 'border-rose-200');
    resultBox.innerHTML = '<p class="font-semibold mb-2 text-rose-700">Please fix the following errors:</p>' +
      validationErrors.map(err => `<p class="text-rose-700">• ${err}</p>`).join('');
    return;
  }

  // --- 1. Get Turnstile Token ---
  const token = formData.get('cf-turnstile-response');

  if (!token) {
    resultBox.classList.remove("hidden");
    resultBox.textContent = "❌ Security check failed. Please refresh the page.";
    return;
  }
  // ---------------------------------

  const countryId = countrySelect.value;
  const country = COUNTRIES.find((c) => c.id === countryId);

  const payload = {
    id: generateId(countryId.toUpperCase()),
    countryId,
    countryName: country?.name || "Unknown",
    date: form.reportDate.value,
    crimeType: form.reportCrimeType.value,
    area: form.reportArea.value,
    street: form.reportStreet.value,
    headline: form.reportHeadline.value,
    details: form.reportDetails.value,
    ua: navigator.userAgent,
    
    // --- 2. Add the token to our payload ---
    "cf-token": token 
  };

  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting…";
  resultBox.classList.add("hidden");

  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    
    if (data.success) {
      const idDisplay = document.getElementById("reportIdDisplay");
      const successScreen = document.getElementById("reportSuccess");
      const copyBtn = document.getElementById("copyIdBtn");
      
      idDisplay.textContent = payload.id;
      successScreen.classList.remove("hidden");
      successScreen.classList.add("opacity-0");
      setTimeout(() => {
        successScreen.classList.remove("opacity-0");
        successScreen.classList.add("opacity-100");
      }, 50);

      copyBtn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(payload.id);
          copyBtn.textContent = "✓ Copied!";
          setTimeout(() => (copyBtn.textContent = "Copy ID"), 2000);
        } catch (err) {
          console.warn('Clipboard API failed, using fallback:', err);

          // Fallback: text selection method
          try {
            const range = document.createRange();
            range.selectNode(idDisplay);
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
            document.execCommand('copy');
            window.getSelection().removeAllRanges();
            copyBtn.textContent = "✓ Copied!";
            setTimeout(() => (copyBtn.textContent = "Copy ID"), 2000);
          } catch (e) {
            copyBtn.textContent = "❌ Copy failed";
            console.error('All copy methods failed:', e);
          }
        }
      });

      form.classList.add("hidden");
      resultBox.classList.add("hidden");

    } else {
      resultBox.classList.remove("hidden");
      resultBox.textContent = `❌ Submission failed. ${data.message || "Please try again."}`;
    }

  } catch (err) {
    resultBox.classList.remove("hidden");
    resultBox.textContent = "❌ Submission failed. Please try again.";
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit";
    // Force Cloudflare to reset the invisible token on failure
    try {
      if (window.turnstile && typeof window.turnstile.reset === 'function') {
        window.turnstile.reset();
      } else {
        console.warn('Turnstile not available for reset');
      }
    } catch (error) {
      console.error('Turnstile reset failed:', error);
    }
  }
}


// --- Initialize ---
document.addEventListener("DOMContentLoaded", () => {
  // Initialize honeypot tracking
  sessionStorage.setItem('formLoadTime', Date.now().toString());
  sessionStorage.setItem('mouseMovements', '0');

  // Track focus on honeypot field
  if (hp) {
    hp.addEventListener('focus', function() {
      this.dataset.focused = 'true';
    });
  }

  // Track mouse movements
  let moveCount = 0;
  document.addEventListener('mousemove', () => {
    moveCount++;
    sessionStorage.setItem('mouseMovements', moveCount.toString());
  });

  // Populate countries
  loadCountries();

  // Initially disable area dropdown
  areaSelect.disabled = true;
  areaSelect.innerHTML = `<option>Select a country first</option>`;

  // Auto-memory: check if last country is saved with validation
  const savedCountryId = getValidatedLocalStorage("ccw_selected_country", (val) => {
    // Validate: must match a valid country ID in our COUNTRIES array
    return COUNTRIES.some(c => c.id === val);
  });
  if (savedCountryId) {
    const country = COUNTRIES.find((c) => c.id === savedCountryId);
    if (country) {
      countrySelect.value = savedCountryId;
      // Pass the whole country object here
      loadAreas(country);
    }
  }

  // Country change event
  countrySelect.addEventListener("change", (e) => {
    const selectedId = e.target.value;

    // Save to localStorage for next visit
    localStorage.setItem("ccw_selected_country", selectedId);

    if (!selectedId) {
      areaSelect.disabled = true;
      areaSelect.innerHTML = `<option>Select a country first</option>`;
      return;
    }

    const country = COUNTRIES.find((c) => c.id === selectedId);
    // Pass the whole country object
    loadAreas(country);
  });

  // Save area selection to localStorage
  areaSelect.addEventListener("change", (e) => {
    const selectedArea = e.target.value;
    if (selectedArea) {
      localStorage.setItem("ccw_selected_area", selectedArea);
    }
  });
});