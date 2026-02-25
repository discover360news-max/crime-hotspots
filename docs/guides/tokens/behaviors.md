# Behaviors
Part of [DESIGN-TOKENS.md](../DESIGN-TOKENS.md)

---

## Leaflet Map (Dashboard)

One Leaflet map on the site — Crime Incidents Map on the dashboard.

### Tile URLs

```js
const cartoLight = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const cartoDark  = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
```

**CRITICAL:** Dark variant is `dark_all` — NOT `dark_matter` (`dark_matter` returns 404).

### Dark Mode Tile Swap (Reactive)

```js
const isDark = () => document.documentElement.classList.contains('dark');

const tileLayer = L.tileLayer(isDark() ? cartoDark : cartoLight, {
  attribution: '...',
  subdomains: 'abcd',
  maxZoom: 18
}).addTo(map);

const themeObserver = new MutationObserver(() => {
  tileLayer.setUrl(isDark() ? cartoDark : cartoLight);
});
themeObserver.observe(document.documentElement, { attributeFilter: ['class'] });
```

- Watches only `class` on `<html>` — fires only on theme change
- `setUrl()` auto-calls `redraw()` — no manual redraw needed
- Crime markers (`divIcon`) in `.leaflet-marker-pane` — unaffected by tile swap

### Dark Mode Tile Brightness

CARTO `dark_all` tiles are very dark — apply brightness boost:

```css
/* In dashboard.css */
:root.dark .leaflet-tile-pane {
  filter: brightness(1.4);
}
```

Tuning: `1.2` (subtle), `1.4` (default), `1.6` (bright). Markers unaffected (sibling pane).

---

## Scroll Lock (Overlay/Tray Pattern)

When opening mobile nav, subscribe tray, or any full-screen overlay:

```js
function lockScroll() {
  var scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  document.body.style.overflow = 'hidden';
  if (scrollbarWidth > 0) {
    document.body.style.paddingRight = scrollbarWidth + 'px';
  }
}

function unlockScroll() {
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
}
```

**NEVER** use `document.body.style.overflow = 'hidden'` directly — causes layout shift when scrollbar disappears. The padding compensation prevents the page from jumping left.

Helpers defined in `Header.astro`.

---

## Collapsible Animation (Grid Trick)

For smooth height transitions. **Not** `height: 0 → auto` (can't be transitioned). **Not** native `<details>` `group-open:` (unreliable in Tailwind).

```html
<details id="myDetails">
  <summary>...</summary>
  <div id="myBody" style="display:grid; grid-template-rows:0fr; transition:grid-template-rows 300ms ease">
    <div style="overflow:hidden">
      <!-- Actual content here -->
    </div>
  </div>
</details>
```

```js
details.querySelector('summary').addEventListener('click', function(e) {
  e.preventDefault();
  if (details.open) {
    body.style.gridTemplateRows = '0fr';
    setTimeout(() => { details.removeAttribute('open'); }, 300);
  } else {
    details.setAttribute('open', '');
    requestAnimationFrame(() => { body.style.gridTemplateRows = '1fr'; });
  }
});
```

**Rules:**
- Always `e.preventDefault()` on summary — take full control of open/close
- `requestAnimationFrame` before `1fr` — ensures browser registers open state before animating
- 300ms matches Tailwind `transition-300` convention

**Currently used on:** Dashboard map legend (`#legendDetails`)
