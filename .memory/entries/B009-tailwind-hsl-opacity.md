---
id: B009
type: bug
status: active
created: 2026-03-01
updated: 2026-03-07
related: [L005, L006]
---

## Summary
Tailwind v4 broke the arbitrary HSL-with-opacity syntax. The old slash-outside pattern silently produces no output.

## Fix
```css
/* BROKEN — Tailwind v4 */
dark:bg-[hsl(0_0%_8%)/70]

/* CORRECT — alpha inside the HSL function */
dark:bg-[hsl(0_0%_8%_/_0.7)]
```
Applies to: `bg-`, `text-`, `border-`, `via-`, `from-`, `to-` — any color utility with arbitrary HSL.

## Known Issues / Gotchas
- The broken syntax fails silently — no build error, just no visible styling
- Use `0.7` (decimal) not `70` (integer) as the alpha value inside the function
- This affects all dark mode overrides using the `[hsl(...)]` pattern

## Change Log
- 2026-03-01: Discovered during muted UI rollout; fixed across ui-design system
