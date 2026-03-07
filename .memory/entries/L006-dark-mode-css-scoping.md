---
id: L006
type: learning
status: active
created: 2026-03-01
updated: 2026-03-07
related: [L005, B009]
---

## Summary
Astro's scoped CSS cannot directly select `.dark` on `<html>` from inside a component. The `.dark` class is on the `<html>` element, outside the component's scoped style boundary. Use `:global(.dark)` for dark mode overrides inside `<style>` blocks.

## Implementation Details

**Pattern for component dark mode:**
```astro
<style>
  /* WRONG — scoped selector can't reach html.dark */
  .dark .my-element { background: #222; }

  /* CORRECT — :global escapes scoping */
  :global(.dark) .my-element { background: #222; }
</style>
```

**BlogRotatingBanner example (fixed Mar 1):**
```astro
<style>
  :global(.dark) .blog-rotating-banner {
    border-color: hsl(0 0% 25%);
  }
  :global(.dark) .blog-rotating-banner .icon {
    color: hsl(0 0% 55% / 0.72);
  }
</style>
```

## Known Issues / Gotchas
- Tailwind dark: utilities work normally (they generate global CSS) — this issue only affects Astro `<style>` blocks
- See B009 for Tailwind v4 HSL opacity syntax inside `dark:bg-[hsl(...)]` utilities

## Change Log
- 2026-03-01: Discovered when BlogRotatingBanner dark mode wasn't applying
