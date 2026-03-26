---
id: L016
type: learning
status: active
created: 2026-03-26
---

# L016 — Dark section texture overlay: mix-blend-screen + radial mask

## Pattern

For adding a subtle texture/background image to dark sections without it overwhelming text:

1. **`mix-blend-screen`** — makes the dark parts of the image transparent. Only light elements (dots, lines) show through. No need to fight the image's dark background.
2. **CSS `mask-image` radial gradient** — fades the image out in the centre so the hero's base colour shows cleanly behind text.
3. **Low opacity** (`opacity-[0.15]`) — controls overall intensity.

```astro
<Image
  src={textureBgImg}
  alt=""
  aria-hidden="true"
  class="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-[0.15] pointer-events-none select-none"
  style="mask-image: radial-gradient(ellipse 55% 75% at 50% 50%, transparent 25%, black 65%);
         -webkit-mask-image: radial-gradient(ellipse 55% 75% at 50% 50%, transparent 25%, black 65%);"
  loading="eager"
  width={1200}
  height={400}
  format="webp"
  quality={80}
/>
```

The parent `<section>` must have `relative overflow-hidden`.

## Mask gradient breakdown

- `transparent 25%` — fully hidden at centre (base colour shows = clean text contrast)
- `black 65%` — fully visible at edges (texture shows)
- Ellipse `55% 75%` — slightly taller than wide, suits landscape hero sections

## Implementation on this site

- **Hero sections:** `src/components/HeroBg.astro` — drop `<HeroBg />` as first child of any `relative overflow-hidden` dark hero `<section>`. Applied to 13 pages.
- **Footer:** inline `<Image>` in `Layout.astro` footer with `hidden dark:block` (footer is light in light mode — image only shown in dark mode).
- Images: `src/assets/images/hero-bg.webp` + `src/assets/images/footer-bg.webp`

## Tuning

- More subtle: lower `opacity-[0.15]` → `opacity-[0.08]`
- Bigger clear centre zone: push first stop out → `transparent 40%`
- Busier edges: `black 50%` (transition starts earlier)
