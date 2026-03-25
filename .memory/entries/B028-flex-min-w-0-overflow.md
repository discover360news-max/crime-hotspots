# B028 — Flex min-w-0 Missing Causes Overflow in Narrow Containers

**Status:** active
**Discovered:** March 25, 2026
**File:** `src/components/NewsletterSignup.astro` (card variant)

## Problem

The `card` variant newsletter form overflowed its bounding card when placed in narrow flex containers (e.g., the 272px headlines sidebar). The email input + Subscribe button row was wider than the available space.

## Root Cause

Two missing `min-w-0` declarations:

1. `<div class="flex-1">` — the content wrapper inside the icon/text flex row
2. `<input class="newsletter-email flex-1 ...">` — the email input

Without `min-w-0`, CSS flexbox defaults to `min-width: auto` for flex children, which means they refuse to shrink below their intrinsic (content) width. The email input's intrinsic width (set by browser default + placeholder "your@email.com") was ~130px. Combined with the "Subscribe" button (~73px) and gap, the form needed ~211px — wider than the ~200px available in the 272px sidebar after padding and the icon column.

## Fix

```astro
<!-- Before -->
<div class="flex-1">
  ...
  <input class="newsletter-email flex-1 px-3 ...">

<!-- After -->
<div class="flex-1 min-w-0">
  ...
  <input class="newsletter-email flex-1 min-w-0 px-3 ...">
```

## Rule

**Any `flex-1` element that contains text inputs or long strings must also have `min-w-0`**, or it will overflow its container at narrow widths. This applies to both the wrapper div and the input itself.

## Change Log

- Mar 25 2026: Fixed in `NewsletterSignup.astro` card variant. Also affects `variant="card"` on area pages and murder-count pages — now correct in all contexts.
