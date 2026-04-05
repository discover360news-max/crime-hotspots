---
name: Homepage island card — always two-column beside Headlines/Hotspots
description: The Trinidad card and Headlines/Hotspots panel are intentionally always two-column, including on mobile
type: project
---

The T&T section on the homepage uses `grid grid-cols-[1fr_1.6fr]` with no breakpoint gate — it is always two-column, including on mobile. This is intentional.

**Why:** 85% of traffic is mobile. Collapsing to single-column on mobile put the island card full-width, forcing users to scroll past it to reach Headlines and Hotspots. The compact two-column layout mirrors the "more countries" card grid and surfaces relevant content immediately.

**How to apply:** Do not add an `lg:` gate back to this grid. The island card image is always `aspect-square`. Stats footer shows 2 columns on mobile (crimes + murders), 3 on `sm+` (top area shown at sm).

**Related mobile truncation decisions (Apr 4 2026):**
- Headlines capped at `line-clamp-1` on mobile, `line-clamp-2` on sm+
- 3rd headline hidden on mobile (`hidden sm:block`), shown on sm+
- 2nd and 3rd hotspot rows hidden on mobile (`hidden sm:flex`), shown on sm+
- Desktop shows full 3 headlines + 3 hotspots unchanged
