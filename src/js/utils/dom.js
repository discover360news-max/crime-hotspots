// utils/dom.js - small helpers for safe DOM operations and UI feedback
import DOMPurify from 'dompurify';

export function safeSetHTML(el, html) {
  if (!el) return;
  try {
    // Sanitize HTML with DOMPurify to prevent XSS attacks
    const clean = DOMPurify.sanitize(String(html), {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'span', 'div'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id']
    });
    el.innerHTML = clean;
  } catch (e) {
    console.warn('safeSetHTML failed', e);
  }
}

// Add safer alternative using textContent
export function safeSetText(el, text) {
  if (!el) return;
  try {
    el.textContent = String(text); // Always safe - no HTML interpretation
  } catch (e) {
    console.warn('safeSetText failed', e);
  }
}

export function safeCreateEl(tag, attrs = {}, text = '') {
  const el = document.createElement(tag);
  for (const k in attrs) {
    if (k === 'class') el.className = attrs[k];
    else if (k === 'aria') {
      for (const a in attrs[k]) el.setAttribute(a, attrs[k][a]);
    } else {
      el.setAttribute(k, attrs[k]);
    }
  }
  if (text) el.textContent = text;
  return el;
}

// fade in / fade out helpers (basic)
export function fadeIn(el, duration = 200) {
  if (!el) return;
  el.style.transition = `opacity ${duration}ms ease`;
  el.style.opacity = 0;
  el.style.display = '';
  requestAnimationFrame(() => {
    el.style.opacity = 1;
  });
}

export function fadeOut(el, duration = 200) {
  if (!el) return;
  el.style.transition = `opacity ${duration}ms ease`;
  el.style.opacity = 1;
  requestAnimationFrame(() => {
    el.style.opacity = 0;
  });
  setTimeout(() => {
    try { el.style.display = 'none'; } catch(e){}
  }, duration);
}

// SVG spinner + message (returns a container element)
export function createSpinner(message = 'Loading...') {
  const wrapper = document.createElement('div');
  wrapper.className = 'flex items-center gap-3 justify-center py-6';
  wrapper.setAttribute('role', 'status');
  wrapper.setAttribute('aria-live', 'polite');

  // SVG spinner (accessible)
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 50 50');
  svg.setAttribute('width', '28');
  svg.setAttribute('height', '28');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = `
    <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="5" stroke-opacity="0.2"></circle>
    <path d="M45 25a20 20 0 0 1-20 20" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"></path>
  `;
  svg.style.animation = 'spin 1s linear infinite';

  // message
  const span = document.createElement('div');
  span.className = 'text-sm text-slate-500';
  span.textContent = message;

  // spinner style (keyframes) - injected once
  if (!document.getElementById('utils-spinner-style')) {
    const style = document.createElement('style');
    style.id = 'utils-spinner-style';
    style.textContent = `@keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }`;
    document.head.appendChild(style);
  }

  wrapper.appendChild(svg);
  wrapper.appendChild(span);
  return wrapper;
}

export function showSpinnerIn(container, message = 'Loading...') {
  if (!container) return null;
  // remove existing spinner if any
  const existing = container.querySelector('.utils-spinner');
  if (existing) existing.remove();
  const wrap = createSpinner(message);
  wrap.classList.add('utils-spinner');
  container.prepend(wrap);
  return wrap;
}

export function hideSpinner(container) {
  if (!container) return;
  const existing = container.querySelector('.utils-spinner');
  if (existing) {
    try { existing.remove(); } catch(e) {}
  }
}
