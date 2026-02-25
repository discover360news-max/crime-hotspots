# Layout
Part of [DESIGN-TOKENS.md](../DESIGN-TOKENS.md)

---

## Standard Page Layout

**Established:** February 23–24, 2026

| Page Type | Outer container | Inner wrapper |
|-----------|-----------------|---------------|
| Browse/Selection (Headlines, Compare) | `max-w-6xl` | `max-w-3xl mx-auto` |
| Article/Content (About, Crime Detail, Blog) | — | `max-w-3xl mx-auto` |

---

## Browse / Selection Pages (no Hero)

Headlines island selector, Compare Areas. H1 + description sit directly in the page.

```astro
<main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
  <div class="max-w-3xl mx-auto">
    <Breadcrumbs items={breadcrumbs} />
    <div class="text-center mb-12">
      <h1 class="text-display font-bold text-slate-700 dark:text-[hsl(0_0%_90%)] leading-tight mb-3">Page Title</h1>
      <p class="text-body text-slate-600 dark:text-[hsl(0_0%_70%)] max-w-2xl mx-auto">Subtitle</p>
    </div>
    <!-- Selection grid, tool, or content here -->
  </div>
</main>
```

**Pages using this pattern:** Headlines (`src/pages/headlines.astro`), Compare (`src/pages/trinidad/compare.astro`)

---

## Pages With Hero

Section-level pages with generic titles (Archive Index, Monthly Archive).

```astro
<Hero
  title="Page Title"
  subtitle="Supporting description"
  compact={true}
  narrowContainer={true}
  primaryCTA={{ text: "Dashboard", href: routes.trinidad.dashboard, icon: "dashboard" }}
  secondaryCTA={{ text: "Headlines", href: routes.trinidad.headlines }}
>
  <Breadcrumbs items={breadcrumbs} slot="before" />
</Hero>

<main class="max-w-3xl mx-auto px-4 sm:px-6 py-5">
  <div class="bg-white/70 dark:bg-[hsl(0_0%_8%_/_0.7)] backdrop-blur-md rounded-3xl shadow-md p-6 sm:p-8 border border-slate-100 dark:border-[hsl(0_0%_18%)]">
    <!-- Page content here -->
  </div>
</main>
```

**`narrowContainer={true}`:** Removes padding from Hero's `<section>`, places it on inner `max-w-3xl` div — identical left edge to `<main class="max-w-3xl mx-auto px-4 sm:px-6">`.

---

## Pages Without Hero (Article/Content)

Crime detail, blog posts, About, Methodology.

```astro
<main class="max-w-3xl mx-auto px-4 sm:px-6 py-5">
  <Breadcrumbs items={breadcrumbs} />
  <div class="bg-white/70 dark:bg-[hsl(0_0%_8%_/_0.7)] backdrop-blur-md rounded-3xl shadow-md p-6 sm:p-8 border border-slate-100 dark:border-[hsl(0_0%_18%)]">
    <!-- Article content here -->
  </div>
</main>
```

---

## Footer Structure

3 columns desktop, 2 mobile. Brand signature uses `max-w-6xl` (matches header). Nav links in `max-w-3xl`.

`grid grid-cols-2 sm:grid-cols-3` in `Layout.astro`
- **Browse** — Dashboard, Headlines, Archive, Murder Count, Blog
- **Explore** — Areas, Regions, Compare, Statistics
- **Help** — About, FAQ, Methodology, Contact, Report, Privacy, Business Solutions. On mobile (`col-span-2 sm:col-span-1`) uses a 2-column inner grid.

---

## Dividers

```html
<div class="w-full h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-[hsl(0_0%_22%)] to-transparent my-6"></div>
```

**Never use** `border-t border-slate-200` between sections. Hard borders are only for card outer borders (`border border-slate-100`).

---

## The `max-w-3xl` Column

- **Width:** 768px (`48rem`)
- **Shared by:** Browse/selection inner wrapper, article card container, footer nav
- **Pages:** Headlines, Compare, About, Archive Index, Monthly Archive, Crime Detail, Statistics, Areas, Regions, Area Detail, Region Detail, Blog Index, Blog Post, Dashboard

---

## Spacing & Layout

### Container Padding
- Page containers: `px-4 py-6` (`max-w-7xl` or `max-w-3xl mx-auto`)
- Card padding: `p-4` (standard) / `p-6` (spacious)
- Section vertical: `py-8`

### Border Radius
```css
rounded      /* 8px — DEFAULT, tight use cases */
rounded-lg   /* 12px — Standard (buttons, inputs, cards) */
rounded-xl   /* 16px — Large (panels, containers) */
rounded-2xl  /* 24px — Modals, slide trays */
rounded-md   /* DEPRECATED — use rounded-lg */
```

**Note (Feb 2026):** `rounded-lg` was updated 8px → 12px in tailwind.config.mjs. `rounded` (DEFAULT) is 8px.

---

## Background Treatment

### Page Background Pattern
```css
body {
  background-image:
    linear-gradient(to bottom, rgba(241,245,249,0) 0%, rgba(241,245,249,0.5) 5%, #f1f5f9 25%),
    url('/assets/images/trinidad-page-bg.png');
  background-repeat: no-repeat;
  background-position: top center;
  background-size: 100% auto;
  background-attachment: fixed;
}
```

---

## Breadcrumb Rules

- **ALWAYS** use full country name: `{ label: 'Trinidad & Tobago', href: '/trinidad/dashboard' }` — NEVER just "Trinidad"
- The folder path is `/trinidad/` but display is always "Trinidad & Tobago"

```astro
<Breadcrumbs items={[
  { label: 'Home', href: '/' },
  { label: 'Trinidad & Tobago', href: '/trinidad/dashboard' },
  { label: 'Page Name' }
]} />
```

---

## Hero Sections (Full-Width Gradient)

For landing pages, business pages, major feature announcements.

```html
<section class="w-full bg-gradient-to-br from-rose-50 via-white to-slate-50 py-12 sm:py-20 px-4">
  <div class="max-w-4xl mx-auto text-center">
    <h1 class="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-800 mb-4 sm:mb-6 leading-tight">
      Main Value Proposition Headline
    </h1>
    <p class="text-base sm:text-lg text-slate-600 mb-6 max-w-3xl mx-auto leading-relaxed">
      Supporting description.
    </p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
      <a href="#section" class="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 transition text-sm font-medium shadow-lg hover:shadow-xl min-h-[44px]">
        Primary Action
      </a>
      <a href="mailto:..." class="inline-flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-slate-300 text-slate-700 hover:border-rose-600 hover:text-rose-600 active:bg-rose-50 transition text-sm font-medium min-h-[44px]">
        Secondary Action
      </a>
    </div>
  </div>
</section>
```

**Hero Rules:**
- Gradient: `from-rose-50 via-white to-slate-50`
- Typography scale: `text-3xl` (mobile) → `text-4xl` (tablet) → `text-5xl` (desktop)
- Subtitle color: `text-slate-600` (not 700)
- Spacing: `py-12 sm:py-20`
- CTAs use `min-h-[44px]` (larger than standard `min-h-button`)
