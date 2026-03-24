# Design Alignment Guide — Bringing Pages In Line With the Dashboard

**Reference page:** `src/pages/trinidad/dashboard.astro` (JNews hierarchy, Mar 24 2026)
**For:** All data-facing pages — statistics, region, area, murder-count, regions index, headlines

---

## Why the Dashboard Changed

The old dashboard opened with the generic `Hero.astro` component — a soft gradient, centred text, two CTAs. It looked like a marketing landing page. The new design treats crime data like a newspaper: the most important numbers hit you first, before anything else. The dark hero signals authority. The gradient vitals cards are the headline. Everything below is the body.

The principle is **progressive disclosure**: macro → meso → micro.
1. Dark hero — who you are, what's happening right now, one-line pulse
2. Vitals row — the four numbers anyone cares about, above the fold
3. Breakdown — drill down by type, region, area
4. Detail — tables, maps, individual incidents

Keep this hierarchy in mind for every page. A statistics page should surface "here is the year in four numbers" before it shows tables. A region page should surface "here is this region in three numbers" before it shows area rankings.

---

## Pre-Flight Checklist — Before Touching Any Page

Run through this before starting any redesign work.

```
[ ] Is it currently using Hero.astro? → Replace with a custom <section> (see Dark Hero Pattern below)
[ ] What are the 2-4 numbers a user most wants to see? → These become GradientStatCard vitals
[ ] Is there natural "what's happening" + "here's the breakdown" hierarchy in the data?
[ ] Is this page pre-rendered or SSR? (affects whether shimmer patterns are needed)
[ ] Check for existing section IDs used by JS — don't rename them
[ ] Check page line count — stay under 500 (content) or 600 (interactive) lines; extract if needed
[ ] Does dark mode work? Test every new bg/text combo against the CSS var system
[ ] Does it have a sticky control bar? (year filter, compare selector) — position below hero, sticky top-16
[ ] Are all internal hrefs using trailing slashes? (trailingSlash: 'always' in astro.config.mjs)
[ ] Does any slug-not-found path use Astro.redirect? → Use 302, never 301 (see B027)
[ ] Run npm run build before committing
```

---

## The Core Design Vocabulary

### 1. Dark Hero Section

The opening of any data page. Full viewport width, slate-900 gradient. This is the only place on the page that goes edge-to-edge.

```astro
<section class="w-full bg-gradient-to-br from-slate-900 to-slate-800">
  <div class="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

    <!-- Breadcrumb — always light slate, never rose -->
    <nav aria-label="Breadcrumb" class="mb-4">
      <ol class="flex items-center gap-1.5 text-xs text-slate-500">
        <li><a href="/" class="hover:text-slate-300 transition">Home</a></li>
        <li><!-- chevron svg --></li>
        <li class="text-slate-400">Page Name</li>
      </ol>
    </nav>

    <!-- H1: big, black weight, white -->
    <h1 class="text-4xl sm:text-5xl font-black text-white leading-tight mb-2">
      Page Title
    </h1>

    <!-- Subtitle: muted slate, not white -->
    <p class="text-slate-400 text-sm mb-5">Supporting context here</p>

    <!-- Live pulse (only if data is recent/live) -->
    <div class="flex items-start gap-2.5 mb-5 bg-white/5 rounded-lg px-4 py-3 border border-white/10">
      <span class="relative flex h-2 w-2 mt-1 shrink-0">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
      </span>
      <p class="text-slate-300 text-sm leading-relaxed">
        Key live stat or context sentence here.
      </p>
    </div>

    <!-- CTAs: rose primary + ghost secondary -->
    <div class="flex gap-3 flex-wrap">
      <a href="..." class="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-500 transition font-medium text-xs">
        Primary Action
      </a>
      <a href="..." class="px-4 py-2 rounded-lg border border-slate-500 text-slate-300 hover:border-slate-400 hover:text-white transition font-medium text-xs">
        Secondary Action
      </a>
    </div>

    <!-- Freshness line — builds trust -->
    <p class="text-slate-500 text-xs mt-5 flex items-center gap-1">
      <!-- clock svg -->
      Data as of {freshnessText}
    </p>

  </div>
</section>
```

**Rules:**
- Use `from-slate-900 to-slate-800` — no other gradient on the hero
- H1 is always `font-black` (900 weight), never `font-bold`
- Never put rose text inside the dark hero (rose is for CTAs and accents only)
- The live pulse only appears if there is actually something live to report — do not show it with placeholder text
- The optional right-column card (blog post, summary card) uses `bg-white/8 border border-white/10`

---

### 2. Gradient Vitals Row (`GradientStatCard`)

The four numbers that matter most, immediately after the hero. Use the existing `GradientStatCard.astro` component.

```astro
import GradientStatCard from '../../components/GradientStatCard.astro';

<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
  <GradientStatCard variant="slate"   value={totalCount}   label="Total Crimes"  sublabel="year to date" id="vitals-total" />
  <GradientStatCard variant="crimson" value={murderCount}  label="Murders"       sublabel="year to date" id="vitals-murders" />
  <GradientStatCard variant="amber"   value={crimePerDay}  label="Crimes / Day"  sublabel="30-day avg"   id="vitals-daily" />
  <GradientStatCard variant="violet"  value={areaCount}    label="Hottest Area"  sublabel={topAreaName}  id="vitals-hotspot" href={areaLink} />
</div>
```

**Variant guidance:**
| Variant | Gradient | Use for |
|---------|----------|---------|
| `slate` | Dark slate | Volume / totals (neutral) |
| `crimson` | Deep red → rose | Violent crime (murders, serious incidents) |
| `amber` | Amber → orange | Rate / pace metrics (per day, per week) |
| `violet` | Violet → purple | Comparative / hotspot data |

**Rules:**
- Always 4 cards. If a page only has 3 meaningful vitals, use the 4th for a contextual comparison (e.g. "vs last year").
- On 2-wide mobile, pair the cards logically: volume + violence on row 1, rate + hotspot on row 2.
- The `id` prop is required for any card updated by JS (trend indicators). Use `id="vitals-{type}"`.
- If a value might be NaN (e.g. dividing by 0 when data is empty), guard it: `Number.isNaN(+value) ? '—' : value`.
- Cards with `href` get a hover lift effect (`hover:-translate-y-0.5`) automatically.
- Sublabel updates dynamically via JS using `id="{id}-sub"` — keep sublabels short (they truncate).

---

### 3. Dark Separator Band

Breaks the page into major zones. Used once per logical section boundary. Full viewport width.

```astro
<div class="w-full bg-slate-900 dark:bg-[hsl(0_0%_5%)] py-4">
  <div class="max-w-5xl mx-auto px-4 sm:px-6">
    <p class="text-xs font-semibold text-slate-400 uppercase tracking-widest">Section Label</p>
    <h2 class="text-white font-black text-lg mt-0.5">Section Title</h2>
  </div>
</div>
```

**Rules:**
- Use at most once per page (the dashboard uses it once, before the map zone).
- The label (`uppercase tracking-widest`) is the category; the `h2` below is the specific section.
- Do not put interactive elements or links inside the separator band.
- In dark mode this is already correct — `hsl(0_0%_5%)` is darker than the page background.

---

### 4. Section Labels (Within Content Zones)

For sub-sections inside a content zone — not a full band, just a label.

```astro
<!-- Simple label -->
<h2 class="text-sm font-bold text-slate-500 dark:text-[var(--ch-text-muted)]">Section Label</h2>

<!-- Label + right-side action link -->
<div class="flex items-center gap-2 px-1 mb-3">
  <h2 class="text-sm font-bold text-slate-500 dark:text-[var(--ch-text-muted)]">Section Label</h2>
  <InfoPopup id="...">...</InfoPopup>
  <a href="..." class="ml-auto text-xs text-rose-600 hover:text-rose-700 font-medium transition">
    See All →
  </a>
</div>
```

**Rules:**
- Section labels are always `text-sm font-bold text-slate-500` (muted) — they are signposts, not headings.
- The actual data/content below should have more visual weight than the label above it.
- Never use `font-black` or dark text on section labels — that hierarchy belongs to H1 in the hero.
- Add `px-1` to align with card padding when placed above a card grid.

---

### 5. Two-Column Content Zones

For pairing primary + secondary content side by side on desktop.

```astro
<!-- 3:2 split — primary content left, supporting content right -->
<div class="grid lg:grid-cols-[3fr_2fr] gap-6 items-start">
  <div><!-- primary: map, main table, primary stat --></div>
  <div><!-- secondary: top areas, sidebar stats, related links --></div>
</div>

<!-- Even split — two comparable panels -->
<div class="lg:grid lg:grid-cols-[1fr_256px] lg:gap-8 lg:items-start">
  <main><!-- main content --></main>
  <!-- sidebar: MPSidebar, related, share --></div>
</div>
```

**Rules:**
- `lg:grid-cols-[3fr_2fr]` for map/data + supporting (dashboard Zone 2 pattern).
- `lg:grid-cols-[1fr_256px]` for main content + fixed-width sidebar (region/area page pattern).
- Always `items-start` — let columns grow independently, don't force equal height.
- Never use two-column below `sm:` — always stacks to single column on mobile first.
- The right column should only contain secondary information. Never put the most important content in the right column on any viewport.

---

### 6. Content Zone Wrapper

All content below the hero lives in a standard max-width container. Do not break out to full width here (only the hero and separator band do that).

```astro
<div class="max-w-5xl mx-auto px-4 sm:px-6 py-6">
  <!-- all sections live here -->
</div>
```

**Always `max-w-5xl`.** This is the global site width standard. Never `max-w-3xl` on a data page (that's for content/editorial pages like methodology, about).

---

### 7. Sticky Filter / Control Bar

For pages with year filters, area selectors, or similar controls.

```astro
<div id="filterBar" class="sticky top-16 z-30 bg-white/95 dark:bg-[var(--ch-surface)]/95 backdrop-blur-sm border-b border-slate-200 dark:border-[var(--ch-border-subtle)]">
  <div class="max-w-5xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-3 flex-wrap">
    <!-- controls here -->
  </div>
</div>
```

**Rules:**
- `top-16` because the site header is `h-16` (64px). If the bar goes higher it clips the header.
- `z-30` keeps it above content but below modals (`z-40`).
- Use `backdrop-blur-sm` for the frosted glass effect — `bg-white/95` alone looks flat.
- Place the sticky bar **between** the dark hero and the first content zone — never inside either.

---

## Page-by-Page Assessment

### `statistics.astro` — HIGH PRIORITY
**Current:** `Hero.astro` (generic gradient) → tables below.
**Problem:** The most important numbers (total crimes, murder rate, YoY change) are buried in a table, not surfaced above the fold.
**Approach:**
1. Replace `Hero.astro` with custom dark hero. H1: "Trinidad Crime Statistics {year}". Live pulse: YTD summary sentence.
2. Add vitals row: Total Crimes YTD / Murders YTD / YoY Change / Annualized Rate.
3. Dark separator band before the detailed tables section.
4. Existing tables remain unchanged below.
5. `max-w-5xl` container for all content zones.

---

### `murders.astro` — MEDIUM PRIORITY
**Current:** Has its own dark-ish flip counter layout — already somewhat on-brand.
**Problem:** The entry experience is a sidebar layout without a strong hero moment.
**Approach:**
1. Add dark hero with murder count as H1, YoY comparison as the live pulse.
2. The flip counter becomes the vitals row (1 wide card or 2-card row: YTD count + annualized rate).
3. The date-grouped list below continues unchanged.

---

### `region/[slug].astro` — HIGH PRIORITY
**Current:** `Hero.astro` → stat cards → area ranking → headlines.
**Problem:** Generic hero doesn't convey the severity of a specific region's data. Stat cards are the same style as every other page.
**Approach:**
1. Replace `Hero.astro` with custom dark hero. H1: "{regionName} Region". Live pulse: "X incidents in the last 90 days across Y areas."
2. Add vitals row: Incidents (90d) / Murders (YTD) / Risk Score / Most Active Area. Use `variant="crimson"` for murders, `variant="amber"` for risk score.
3. Dark separator before the area ranking section.
4. Existing area ranking + crime breakdown tables continue unchanged.

---

### `area/[slug].astro` — HIGH PRIORITY
**Current:** `Hero.astro` → AreaNarrative → stat cards → headlines.
**Problem:** Same generic hero problem. Risk score (the most impactful number) is buried in the stat cards, not foregrounded.
**Approach:**
1. Replace `Hero.astro` with dark hero. H1: "{areaName}". Live pulse: risk score + 90d incident count.
2. Add vitals row: Risk Score / Incidents (90d) / Murders (YTD) / Top Crime Type.
3. `AreaNarrative` moves below the vitals (it's context, not headline).
4. Keep `MPSidebar` — it already fits the 1fr/256px sidebar pattern.

---

### `regions.astro` — MEDIUM PRIORITY
**Current:** `Hero.astro` → grid of region cards.
**Problem:** Generic hero. No data above the fold.
**Approach:**
1. Replace `Hero.astro` with a compact dark hero. H1: "Crime by Region". No vitals row needed (this is a directory, not a data page). Add a one-line pulse: "X regions tracked. Sorted by crime volume."
2. Cards below remain the same — they are already well-designed.

---

### `headlines.astro` — LOW PRIORITY
**Current:** `Hero.astro` → date-accordion list.
**Problem:** Fine as-is for a listing page. Hero gives good context.
**Approach:** Consider a compact dark hero with the count of crimes in the last 30 days as the live pulse. This is optional — the listing page pattern is acceptable without the full JNews treatment.

---

### `compare.astro` — ALREADY ALIGNED
Already has "rose gradient hero + sticky selector bar". Only minor tweak: swap the rose gradient hero to the dark slate hero pattern for consistency. Not urgent.

---

## UX Patterns and Tips

### Show the pulse before the filter
On any page with a year filter, populate the hero pulse with the **current year** data before the filter loads. Users should see "2026: 842 crimes" as the hero text, not a blank or shimmer. The filter is a secondary control — the current year is the default reality.

### The muted section label pattern
Section headings on this site are deliberately muted (`text-slate-500`). This is intentional. The data has more visual weight than the label. A big number next to a muted "Murders YTD" label draws the eye correctly — to the number. Avoid bold dark section headings that compete with data.

### Trust signals in the hero
Always include a freshness line (`Data as of {date}`) in the hero or immediately below it. Crime data has a lag (3-day pipeline delay). Users need to know how fresh what they're seeing is. This is a trust signal, not a disclaimer — show it proudly, don't hide it in a footer.

### Never orphan a rose-tinted card
The rose-tinted card (like the Murder Count link at the bottom of the dashboard) should only be used for the single most critical action on the page. If everything is rose, nothing is. On a region page, the rose card could be "Report a Crime in {region}". One per page, maximum.

### The Info Popup placement rule
`InfoPopup` sits next to its section label, never inside data cards. Pattern:
```astro
<div class="flex items-center gap-2">
  <h2 class="text-sm font-bold text-slate-500 ...">Top Areas</h2>
  <InfoPopup id="top-areas-info">...</InfoPopup>
</div>
```
The popup explains methodology, not the data itself. If the explanation belongs on the page as visible text, write it as visible text.

### Shimmer before real content — SSR pages only
Shimmer placeholders (opacity-0 content + LoadingShimmer cover) are only needed when the HTML arrives without data and JS fills it in. For SSR pages (data rendered server-side), shimmers should be hidden immediately on load. Check whether the page is SSR + JS-updated (like the dashboard's year filter) or just SSR-static (like region pages). Shimmers on static SSR pages are a user experience problem — they flash a skeleton that disappears immediately, which is worse than nothing.

### The `bg-white/5` overlay pattern for dark backgrounds
For info boxes, callouts, or secondary cards inside the dark hero:
```
bg-white/5   border border-white/10   ← subtle, barely visible
bg-white/8   border border-white/12   ← slightly more visible (for cards like the blog post)
bg-white/12  border border-white/20   ← hover state (use as hover:bg-white/12)
```
Never use solid colours or named tailwind colours inside the dark hero — they break the dark palette.

### Grid collapse order matters
When a two-column desktop layout collapses to single-column on mobile, the right column falls below. Always put the right column content in the order you want it to appear on mobile. If the sidebar has "share buttons + MPs + Ko-fi", that order is fine below the main content. If it has critical stats (like a vitals card), it should be in the HTML before the main content and hidden/repositioned via CSS grid.

### Hover states on cards within dark backgrounds
Cards inside the dark hero use `hover:bg-white/12 hover:border-white/20`. Cards in the light content zone use `hover:border-rose-300 hover:shadow-md` (for bordered cards) or `hover:bg-slate-100` (for inline list items). Never use rose as a hover background — only as a hover border or text color.

---

## Dark Mode — What to Check

Every new element needs a dark mode pair. Rules:

| Light mode | Dark mode pair |
|-----------|----------------|
| `bg-white` | `dark:bg-[var(--ch-surface)]` |
| `bg-slate-50` / `bg-white/85` | `dark:bg-[var(--ch-surface)]/85` |
| `bg-slate-100` (hover) | `dark:bg-[hsl(0_0%_14%)]` (hover) |
| `text-slate-800` (heading) | `dark:text-[var(--ch-text-heading)]` |
| `text-slate-600` (body) | `dark:text-[var(--ch-text)]` |
| `text-slate-500` (muted) | `dark:text-[var(--ch-text-muted)]` |
| `text-slate-400` (faint) | `dark:text-[var(--ch-text-faint)]` |
| `border-slate-200` | `dark:border-[var(--ch-border-card)]` |
| `border-slate-100` | `dark:border-[var(--ch-border-subtle)]` |

**The dark hero does not need dark mode pairs** — it's already dark. The `bg-slate-900` sections look identical in both modes. Only the light content zones need paired dark mode classes.

**Never hardcode `hsl()` values for page backgrounds** — use `var(--ch-*)` vars. The only exceptions are for shimmer overlays and one-off darkening effects where a specific shade is needed that doesn't map to a token.

---

## What NOT to Do

**Don't replace Hero.astro on content pages.** Hero.astro is correct for About, Methodology, FAQ, Contact, Help articles, Safety Tips. Those pages are editorial/informational — the light gradient is right. Only data pages get the dark hero.

**Don't add a vitals row to every page.** If a page doesn't have 3-4 distinct headline numbers, don't force it. A region page with 1 area and 5 crimes doesn't need four gradient cards — it needs a clear statement of the data it has.

**Don't put the dark separator band at the top.** The hero IS the dark opening. The separator band creates a second dark moment mid-page, which gives a visual rhythm (dark → light → dark → light). If you start with a separator band, you lose that rhythm.

**Don't use `is:inline` scripts.** Per CLAUDE.md hard rules: no `is:inline`, no `astro:page-load`. Always use `<script>` + `DOMContentLoaded`.

**Don't remove trailing slashes from hrefs.** `trailingSlash: 'always'` is set in `astro.config.mjs`. Missing trailing slashes on internal links cause Cloudflare to silently serve wrong content in some edge cases (B015).

**Don't overuse GradientStatCard.** Four cards per page, maximum. They're meant to be the "lead" of the page. More than four dilutes the impact — use `StatCard.astro` for secondary metrics.

**Don't nest dark sections.** One dark hero + one optional dark separator per page. Nesting dark backgrounds (e.g. dark hero inside dark page background) makes the page feel heavy and hard to scan.

---

## Quick Reference — Implementation Order for a Page Redesign

1. Read the existing page in full — understand every data variable before touching layout
2. Identify the 4 most important numbers → plan the vitals row
3. Replace `Hero.astro` with the dark hero `<section>` (copy from dashboard.astro, edit content)
4. Add the vitals row using `GradientStatCard` with appropriate variants and IDs
5. Add the content zone wrapper (`max-w-5xl mx-auto px-4 sm:px-6 py-6`)
6. Add the dark separator band before the densest data section (if it benefits from a visual break)
7. Convert section headings to `text-sm font-bold text-slate-500` pattern
8. If there's a primary + secondary content split, apply `lg:grid-cols-[3fr_2fr]`
9. Check every background/text/border colour for dark mode pairs
10. Run `npm run build` and verify no TypeScript errors
11. Test on mobile (320px) and desktop (1280px) before considering done
