# CSS Modernisation Plan
**Goal:** Replace JavaScript with native CSS/HTML where browser support is solid and the trade-off is clearly positive.
**Identified:** 13 components, ~1,155 lines of JS, ~781 potentially removable.

---

## Progress

| Group | Status |
|---|---|
| Group 1 — `<details>/<summary>` accordions | [x] Done |
| Group 2 — `<dialog>` modals & menus | [x] Done |
| Group 3 — CSS `@keyframes` rotating banner | [x] Done |
| Group 4 — CSS Anchor Positioning (tooltip) | Deferred — Firefox support not ready |
| Group 5 — Minor cleanup | [x] Done |

---

## Group 1 — `<details>/<summary>` accordions
**Risk:** Low. `<details>` is baseline in every browser.
**What to check after:** Open/close works, chevron rotates, keyboard navigation (Tab + Enter/Space), screen reader announces expanded/collapsed.

### CategoryAccordion.astro
- **Current:** JS adds/removes `is-open` class on click to show/hide content + rotate chevron
- **Replace with:** `<details>/<summary>` + CSS `:open` pseudo-class for chevron rotation
- **JS lines removed:** ~21 (entire script block gone)
- **Status:** [x] Done — `<details>` conversion, CSS drives chevron, minimal JS manages animation timing (e.preventDefault + getBoundingClientRect reflow trick)

### DateAccordion.astro
- **Current:** Same pattern as CategoryAccordion — click header toggles `is-open`
- **Replace with:** `<details>/<summary>` + CSS `:open`
- **JS lines removed:** ~18 (entire script block gone)
- **Bonus:** Removed `backdrop-blur-md` from header (INP improvement)
- **Status:** [x] Done — same pattern as CategoryAccordion

### MapLegend.astro
- **Current:** JS intercepts click, animates grid rows, rotates chevron, swaps labels
- **Outcome:** Already used `<details>`. CSS now handles chevron + label swap. JS fully owns grid-template-rows for both open AND close (CSS `details[open]` override was removed — it fired before reflow, causing first-click jank). JS: ~12 lines.
- **JS lines removed:** ~16 of ~28
- **Status:** [x] Done

### area/[slug].astro (inline accordion)
- **Bonus fix:** Same `classList.toggle` → explicit add/remove + `getBoundingClientRect` reflow applied to the inline "Recent Headlines" accordion on area detail pages
- **Status:** [x] Done

**QA checklist — Group 1:**
- [ ] All three accordions open and close on click
- [ ] Chevron rotates correctly on open
- [ ] Keyboard: Tab to focus, Enter/Space to toggle
- [ ] Works on mobile (Android Chrome)
- [ ] No visual regression (padding, border, spacing unchanged)
- Pages to check: any page with a filter sidebar or map legend

---

## Group 2 — `<dialog>` modals & menus
**Risk:** Medium. Start with simpler modals before touching Header/BottomNav.
**What to check after:** Modal opens/closes, Esc key works, focus returns to trigger, backdrop click closes, scroll lock on body.

### IslandSelectorModal.astro — do first (lowest traffic risk)
- **Current:** JS toggles `opacity/invisible` classes, manual backdrop
- **Replace with:** `<dialog>` + `showModal()`/`close()` + `::backdrop`
- **JS lines removed:** ~50 → ~35 (net)
- **Status:** [x] Done
- **Notes:**
  - Two nested divs (overlay + card) collapsed into single `<dialog>`; `::backdrop` pseudo-element replaces the manual overlay div
  - Open animation: `@starting-style` + `transition` on `dialog[open]` — no `setTimeout` needed
  - Close animation: JS-owned — add `.is-closing` class → `transitionend` → `.close()` (same pattern recommended for all Group 2 modals)
  - Escape key: `cancel` event intercepted with `e.preventDefault()` → runs animated close instead of browser's instant close
  - Backdrop click: `e.target === dialog` check still works — `::backdrop` clicks fire on the `<dialog>` element itself
  - Scroll lock: `document.body.style.overflow = 'hidden'` on open, restored on close and on `astro:before-preparation` (SPA nav guard)
  - `window.openIslandModal(type)` public API + all backward-compat aliases unchanged
  - `<style is:global>` required for `::backdrop` and `@starting-style` rules

### SectionPickerModal.astro
- **Current:** JS shows/hides section lists with `hidden` class
- **Replace with:** `<dialog>` + CSS `:has()` or radio inputs for tab state
- **JS lines removed:** ~40
- **Status:** [x] Done
- **Notes:** Same patterns as IslandSelectorModal. Scroll lock added (was missing in original). `window.openSectionPickerModal(countryId, countryName)` API unchanged.

### SearchModal.astro
- **Current:** `is:inline` script; JS manages open/close, opacity, scale, staggered setTimeout animations
- **Replace with:** `<dialog>` + CSS `@starting-style` for open animation
- **JS lines removed:** ~125
- **Status:** [x] Done
- **Notes:**
  - Converted `is:inline` → module script; `pagefindUI` + `latestCrimesFetched` reset in `astro:page-load` so Pagefind remounts into fresh DOM after each SPA nav
  - `display: flex` scoped to `#searchModal[open]` to avoid fighting UA `dialog:not([open]) { display: none }`
  - Cmd+K listener now added once at module scope (was accumulating duplicate listeners on every SPA nav — bug fixed)
  - Pagefind UI styles consolidated from scoped `:global()` wrappers into `<style is:global>`
  - Scroll lock added (was missing in original)

### Header.astro (mobile menu + subscribe tray)
- **Current:** Multiple classList chains for menu open/close states
- **Replace with:** `<dialog>` elements
- **JS lines removed:** ~95
- **Status:** [x] Done
- **Notes:**
  - Two separate dialogs: `#mobileMenuDialog` (w-72) + `#subscribeDialog` (w-80), both right-side panels
  - Positioned with `inset: 0 0 0 auto; margin: 0; height: 100dvh` in CSS — overrides UA `margin: auto`
  - Both backdrop divs (`#mobileMenuBackdrop`, `#subscribeBackdrop`) and all class-juggling JS removed
  - `.is-closing::backdrop { opacity: 0 }` concurrent fade (backdrop transitions in and out with panel)
  - `aria-controls` on hamburger fixed: was `"mainNav"` (desktop nav) → `"mobileMenuDialog"` (correct)
  - Module-scope Escape keydown listener removed — `cancel` event on each dialog handles it
  - `window.closeMobileMenu` still exposed (Browse button inline onclick depends on it)
  - `astro:before-preparation` guard: immediate `.close()` + `unlockScroll` on SPA nav

### BottomNav.astro (More menu + country indicator)
- **Current:** JS toggles menus; IntersectionObserver drives country strip visibility
- **Replace with:** `<dialog>` for menus; country strip always visible (no JS)
- **JS lines removed:** ~85
- **Status:** [x] Done
- **Notes:**
  - `div[role=dialog]` + `div#moreMenuBackdrop` collapsed into single `<dialog id="moreMenuDialog">`; `::backdrop` replaces the manual overlay div
  - Bottom sheet pattern: `position: fixed; inset: auto 0 0 0; margin: 0` — overrides UA `margin: auto`
  - Open animation: `@starting-style` + `transition` on `dialog[open]` — no `setTimeout` needed
  - Close animation: JS-owned — `is-closing` class → `transitionend` → `.close()` (same pattern as all Group 2 components)
  - `closeMoreMenuThen(callback)` helper chains subscribe/search flows off `transitionend`, keeping scroll lock continuous across the More → Subscribe transition
  - Escape key: `cancel` event intercepted with `e.preventDefault()` → runs animated close
  - Country indicator: IntersectionObserver removed; strip is now always visible (simpler, no JS, no layout change needed)
  - `is:inline` → module script; all listeners in `astro:page-load`; `astro:before-preparation` guard for SPA nav

**QA checklist — Group 2:**
- [ ] Each modal opens on button click
- [ ] Esc key closes modal
- [ ] Clicking backdrop closes modal
- [ ] Focus returns to trigger button on close
- [ ] Body scroll locks while modal is open
- [ ] Animations on open/close look correct
- [ ] Mobile (Android Chrome) — tap targets work

---

## Group 3 — CSS `@keyframes` rotating banner
**Risk:** Low.

### BlogRotatingBanner.astro
- **Current:** `setInterval` every 5s updates `style.opacity/transform` on each title
- **Replace with:** CSS `@keyframes` with `animation-delay` stagger per item; `animation-play-state: paused` on `:hover`
- **JS lines removed:** ~33
- **Status:** [x] Done
- **Notes:**
  - Two `@keyframes` variants (`blog-rotate-2`, `blog-rotate-3`) selected via `[data-post-count="N"]` — that attribute was already on the banner div
  - Item 0 gets `animation-delay: -0.5s` (negative) so it appears already-visible at page load — no slide-in flash
  - Items 1+ get positive delays; `animation-fill-mode: backwards` holds them at the 0% state (hidden) during their delay period
  - Single-post case: no animation rule — item just renders statically visible
  - Entire `<script>` block removed (initBlogRotator + setInterval + astro:page-load listener)

**QA checklist — Group 3:**
- [ ] Titles rotate on expected interval
- [ ] Rotation pauses on hover (desktop)
- [ ] No flash/jump between transitions
- [ ] Works correctly on page load

---

## Group 4 — CSS Anchor Positioning (AreaNameTooltip)
**Status:** Deferred — CSS Anchor Positioning not yet in Firefox (behind flag as of Mar 2026). Revisit when Firefox ships it. Estimated: late 2026.

---

## Group 5 — Minor cleanup
Low priority. Do last or alongside another group.

### FeedbackToggle.astro
- Animation cleanup uses `setTimeout` — replace with `animationend` event listener
- ~5 lines changed, no visible difference
- **Status:** [x] Done — `animationend` on spark element (bubbles from SVG child); `{ once: true }` prevents accumulation

### SiteNotificationBanner.astro
- Uses `style.display = 'none'` — replace with `el.hidden = true`
- 2-line change
- **Status:** [x] Done — HTML `style="display:none"` → `hidden` attribute; JS uses `banner.hidden = false/true`

---

## Notes
- `@starting-style` (for dialog open animations) requires Chrome 117+ / Firefox 129+. Caribbean audience is Chrome/Android — safe to use.
- `<dialog>` `::backdrop` styling is limited compared to a custom overlay div. Acceptable trade-off.
- Do not touch `AreaNameTooltip` until CSS Anchor Positioning is baseline.
