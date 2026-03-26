# B029 — escapeHtml() double-encodes in Astro template expressions

**Status:** fixed (Mar 25 2026)
**Affected file:** `src/pages/trinidad/headlines.astro`

## What happened

Headlines displayed raw HTML entity text, e.g. `DG Homes supervisor shot dead ... (Rondell, aka &#39;Patch&#39;)` instead of `'Patch'`.

`escapeHtml()` had been imported and used inside Astro `{expression}` slots:

```astro
<p>{escapeHtml(crime.headline)}</p>
```

## Root cause

Astro already auto-escapes all `{expression}` values as text nodes — it does **not** interpret HTML entities in template output. So the chain was:

1. `escapeHtml()` converts `'` → `&#39;`
2. Astro renders `&#39;` as the literal characters `&#39;` (not as an apostrophe)

This is double-encoding.

## Rule

**`escapeHtml()` is only valid with `set:html` or raw `innerHTML` injection.** Never wrap values in `escapeHtml()` inside Astro `{expr}` — Astro handles escaping automatically.

```astro
<!-- WRONG -->
<p>{escapeHtml(crime.headline)}</p>

<!-- CORRECT -->
<p>{crime.headline}</p>

<!-- CORRECT (set:html needs escaping) -->
<p set:html={escapeHtml(userInput)} />
```

## Fix

Removed all `escapeHtml()` calls from Astro template expressions and the now-unused import in `trinidad/headlines.astro`.

## Recurrence — Mar 26 2026

Same bug appeared on `src/pages/index.astro` homepage headline cards and hotspots widget. `escapeHtml()` had been added to `{crime.headline}`, `{crime.area}`, `{crime.primaryCrimeType}`, and `{area.area}`. All stripped, import removed.

**Pattern to watch:** Any page that renders crime data fields inline is a candidate. Whenever adding crime field rendering, default to bare `{crime.field}` — never wrap in `escapeHtml()` unless using `set:html`.
