---
id: B001
type: bug
status: active
created: 2026-02-27
updated: 2026-03-07
related: [L001, L004]
---

## Summary
`{expression}` syntax inside ANY Astro `<script>` tag is NOT evaluated at runtime — even in `type="application/ld+json"`. The raw template source renders verbatim. This broke all 486 crime pages' NewsArticle JSON-LD (GSC error: "Missing '}'").

## Context
Discovered Feb 27 when GSC flagged invalid structured data. The expression `{JSON.stringify(data)}` appeared literally in the output instead of being interpolated.

## Fix
Use `set:html` on the script tag:
```astro
<script type="application/ld+json" set:html={JSON.stringify(schemaData)} />
```
For exposing data to client scripts, use `define:vars`:
```astro
<script define:vars={{ myData }}>
  // myData is now available here
</script>
```

## Known Issues / Gotchas
- `define:vars` makes the script inline and deduplication-exempt — only use it for exposing data (`window.__x = x`), never for logic
- See L004 for the full data-passing pattern decision

## Change Log
- 2026-02-27: Discovered, fixed across all crime pages
