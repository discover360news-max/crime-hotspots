---
id: B021
type: bug
status: fixed
created: 2026-03-15
related: [B001]
---

## Summary
A bare ternary expression in an Astro template (outside `{}`) renders as literal text on the page, not as HTML.

## The Bug
```astro
<!-- WRONG — renders the text "embedded ? ( ... ) : ( ... )" literally -->
embedded ? (
  <div>Embedded content</div>
) : (
  <section>Standalone content</section>
)
```

```astro
<!-- CORRECT — JSX-style expression, must be wrapped in {} -->
{embedded ? (
  <div>Embedded content</div>
) : (
  <section>Standalone content</section>
)}
```

## Where It Hit
`src/components/HomepagePulse.astro` — the entire embedded/standalone conditional was a bare ternary. Manifested as raw JS-like text visible inside the Trinidad card on the homepage. Fixed Mar 15 2026 (commit 35c8ab3).

## Rule
Every expression in an Astro template that returns JSX/HTML must be wrapped in `{}`. This includes ternaries, `.map()` calls, and logical `&&` expressions. Astro's template section is HTML-first — anything outside `{}` is treated as raw text output.

## Related
B001 covers a similar gotcha for `<script>` tags: `{expr}` inside `<script>` is NOT evaluated server-side either. Both are Astro template boundary issues but in different contexts.
