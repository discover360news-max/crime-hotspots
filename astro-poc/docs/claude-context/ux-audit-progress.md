# UX / Design System Audit Progress

Started: 2026-03-20

---

## P0 — Critical (All Done)

- [x] `about.astro` — typography fixes (font-semibold → font-bold on headings)
- [x] `contact.astro` — font-semibold violation on headings fixed
- [x] SEO: sitemap + deploy improvements

---

## P1 — High Priority

- [x] **font-semibold sweep** — `faq.astro`, `terms.astro`, `privacy.astro`, `methodology.astro`, `business-solutions.astro` — all heading font-semibold → font-bold
- [x] **methodology.astro** — missing responsive spacing: `py-4` → `py-4 sm:py-12`; removed undefined `animate-fadeIn` class
- [x] **trinidad/murders.astro** — H1 `text-2xl sm:text-3xl` → `text-display`
- [x] **trinidad/dashboard.astro** — H1 `text-heading` → `text-display`
- [x] **business-solutions.astro** — hand-rolled hero migrated to `<Hero>` component

---

## P2 — Medium Priority

*(Not yet started)*

---

## P3 — Low Priority

*(Not yet started)*
