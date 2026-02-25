# Patterns
Part of [DESIGN-TOKENS.md](../DESIGN-TOKENS.md)

---

## InfoPopup Pattern

Component: `src/components/InfoPopup.astro`. All instances must follow these rules.

### Container (Handled by Component)
```html
<!-- Trigger -->
<button class="cursor-pointer p-1 rounded hover:bg-slate-100 active:bg-slate-200 transition">
  <svg class="w-5 h-5 text-slate-500 hover:text-slate-700 transition"><!-- info circle --></svg>
</button>

<!-- Overlay -->
<div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]">

<!-- Content Card -->
<div class="absolute top-4 left-1/2 -translate-x-1/2 w-[calc(100vw-2rem)] md:w-auto md:max-w-md bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl p-8">

<!-- Close Button -->
<button class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded hover:bg-slate-200 transition text-slate-500 hover:text-slate-700">
```

**Container Rules:**
- Frosted glass: `bg-white/80` (Level 3)
- Border radius: `rounded-2xl`
- Padding: `p-8`
- Z-index: `z-[9999]`
- Content wrapper: `text-sm text-slate-600 pr-6`

### Content Styling (Passed via Slot)

```html
<!-- Main title — ALWAYS text-slate-700, ALWAYS font-bold -->
<p class="font-bold mb-2 text-slate-700 dark:text-[hsl(0_0%_90%)]">Section Title</p>

<!-- Body (inherits text-sm text-slate-600 from wrapper) -->
<p class="mb-3">Descriptive text.</p>

<!-- Subheadings -->
<p class="font-bold mb-2 text-slate-700 dark:text-[hsl(0_0%_90%)]">Subsection Title</p>

<!-- Lists -->
<ul class="list-disc list-inside space-y-1">
  <li><span class="font-medium text-slate-700">Bold Term</span> — Description</li>
</ul>

<!-- Feature Card (optional, richer popups) -->
<div class="p-4">
  <div class="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-3">
    <svg class="w-6 h-6 text-slate-500"><!-- icon --></svg>
  </div>
  <h3 class="text-caption font-bold text-rose-600 mb-2">Feature Name</h3>
  <p class="text-caption text-slate-500">Feature description</p>
</div>

<!-- CTA (optional, bottom of popup) -->
<div class="mt-8">
  <a href="/link" class="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border border-rose-600 text-rose-600 hover:bg-rose-600 hover:text-white active:bg-rose-700 transition text-xs font-medium">
    Action Text
    <svg class="w-4 h-4"><!-- arrow --></svg>
  </a>
</div>
```

### Content Variants

| Variant | When | Example |
|---------|------|---------|
| **Rich** (icons + cards) | Marketing/informational on landing pages | Homepage "Verified Crime Intelligence" |
| **Reference** (title + list) | Definition lists, glossaries | Dashboard "Crime Type Definitions" |
| **Instructional** (title + steps) | Feature explanations | Dashboard "Understanding the Map" |

### InfoPopup Common Mistakes
```html
<!-- WRONG: rose accent on titles -->
<p class="font-semibold mb-2 text-rose-700">Title</p>

<!-- WRONG: font-semibold -->
<p class="font-semibold mb-2 text-slate-700">Title</p>

<!-- CORRECT: neutral bold, dark mode aware -->
<p class="font-bold mb-2 text-slate-700 dark:text-[hsl(0_0%_90%)]">Title</p>
```

---

## Live Pulse Indicator

Animated dot for live/active data. Used by HomepagePulse, AreaNarrative, DashboardStory.

```html
<span class="relative flex h-2 w-2 shrink-0">
  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
  <span class="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
</span>
```

**Rules:**
- Outer: `relative flex h-2 w-2 shrink-0` — prevents layout shift
- Ping: `animate-ping absolute` + `bg-rose-400 opacity-75`
- Solid dot: `relative` + `bg-rose-500`
- Always pair with `shrink-0` and `mt-1.5` when alongside text

**Container pattern (narrative card):**
```html
<div class="rounded-lg border border-slate-200 dark:border-[hsl(0_0%_15%)] bg-white/70 dark:bg-[hsl(0_0%_5%)] p-3">
  <div class="flex items-start gap-2">
    <!-- pulse dot here -->
    <p class="text-sm text-slate-600 dark:text-[hsl(0_0%_80%)] leading-relaxed">
      Narrative with <span class="font-bold text-slate-700 dark:text-[hsl(0_0%_90%)]">bold callouts</span>.
    </p>
  </div>
</div>
```

---

## Alert Badge Pattern

Notification-style badge for "new since last visit". Client-side rendered, hidden by default.

```html
<div class="rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 p-3 flex items-center gap-2">
  <svg class="w-4 h-4 text-rose-500 shrink-0"><!-- bell icon --></svg>
  <p class="text-sm text-rose-700 dark:text-rose-300">
    <span class="font-bold">3</span> new incidents since your last visit
  </p>
</div>
```

**Rules:**
- Light: `bg-rose-50`, `border-rose-200`, `text-rose-700`
- Dark: `bg-rose-950/30`, `border-rose-800/50`, `text-rose-300`
- Icon: `text-rose-500` (same both modes)
- Hidden by default (`hidden`), shown via JS when count > 0
- Uses localStorage timestamp pattern (see `trendingHelpers.ts`)

**Currently used on:** Area detail "New Since Last Visit" badge

---

## Contextual CTA Links

Inline text-based CTAs within narrative blocks for cross-page navigation.

```html
<!-- Inline within narrative text -->
<a href="/trinidad/compare/?a=slug" class="text-rose-600 hover:text-rose-700 font-medium underline">
  How does this compare?
</a>

<!-- Standalone compare prompt card -->
<div class="rounded-lg border border-slate-200 dark:border-[hsl(0_0%_15%)] bg-slate-50 dark:bg-[hsl(0_0%_5%)] p-3">
  <p class="text-sm text-slate-600 dark:text-[hsl(0_0%_70%)]">
    See how <span class="font-bold text-slate-700 dark:text-[hsl(0_0%_90%)]">Area Name</span> compares to
    <span class="font-bold text-slate-700 dark:text-[hsl(0_0%_90%)]">Other Area</span>
  </p>
  <a href="/trinidad/compare/?a=slug&b=slug"
     class="inline-flex items-center gap-1 mt-2 text-sm text-rose-600 hover:text-rose-700 font-medium">
    Compare areas
    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
    </svg>
  </a>
</div>
```

**Rules:**
- Inline: `text-rose-600 hover:text-rose-700 font-medium underline`
- Standalone card: `bg-slate-50` (not `bg-white`) — visually distinct from content cards
- Arrow: `w-3 h-3`, `stroke-width="2"` (small icon exception)
- Pass slugs as query params (`?a=slug&b=slug`) to pre-populate compare page

**Currently used on:** AreaNarrative CTAs, Compare Prompt card on area detail pages
