---
name: Desktop nav — text links only, no mixed buttons
description: Kavell wants the desktop header nav to be all text links with no bordered or filled buttons mixed in
type: feedback
---

All desktop nav items must be styled as plain text links — no bordered buttons, no filled buttons mixed into the nav row. The only allowed non-text elements are icon-only buttons (search, theme toggle) anchored at the far right.

**Why:** Visual inconsistency between `<a>` text links and bordered `<button>` elements was flagged as untidy. Confirmed Apr 4 2026 when Subscribe, Support, and Report a Crime were all converted from buttons to text link style.

**How to apply:** When adding new nav items to the desktop `Header.astro` nav, always use `inactiveNavClass` text link styling. If an item needs to trigger JS (like Subscribe), keep it as a `<button>` element but style it identically to the `<a>` links using the same class. Never introduce a bordered or filled button into the desktop nav row.
