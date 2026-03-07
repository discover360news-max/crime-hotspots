---
id: L003
type: learning
status: active
created: 2026-03-01
updated: 2026-03-07
related: [L001, C001]
---

## Summary
CSS height transitions from `0` to `auto` require `interpolate-size: allow-keywords` on the html element (set globally in Layout.astro). Never use the `max-height` hack — it causes animation timing issues. Never toggle `hidden` class for animated expand.

## Implementation Details

**Global setup in Layout.astro:**
```css
html { interpolate-size: allow-keywords; }
```

**Pattern for any expandable element:**
```css
.accordion-content {
  height: 0;
  overflow: hidden;
  transition: height 300ms ease;
}
.accordion-content.is-open {
  height: auto;
}
```

**Class naming conventions (do not mix):**
- `accordion-content` / `.is-open` — DateAccordion date groups
- `cat-content` / `.cat-open` — CategoryAccordion tip categories
- `more-stats-content` — area/region "more stats" expandable tray
- `faq-answer` / `.open` — FAQ page answers

## Known Issues / Gotchas
- Different accordions use different class names intentionally — they must NOT conflict
- `CategoryAccordion.astro` and `DateAccordion.astro` are separate components with separate namespaces
- The `max-height` hack was removed from `faq.astro` — do not re-introduce it
- Toggle logic must use `is-open` class, not `hidden` attribute, for CSS transitions to work

## Change Log
- 2026-03-01: Pattern established and FAQ migrated from max-height to height:auto
- 2026-03-02: Applied to CategoryAccordion
