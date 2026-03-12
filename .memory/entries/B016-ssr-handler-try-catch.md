---
id: B016
type: bug
status: active
created: 2026-03-12
related: [D006]
---

## Summary
Wrapping only the DB query portion of an SSR handler in try/catch is insufficient. If any code
OUTSIDE the try/catch throws (e.g. `calculateInsights([])` on empty data, spread of empty array),
Astro catches the unhandled exception and returns a full HTML error page with status 200.
The caller sees `200 text/html`, `r.json()` fails, and the error is silent.

## Symptom
- API endpoint returns `200 text/html` (full site layout HTML) instead of JSON
- `r.json()` throws SyntaxError silently
- Fallback triggers even though the try/catch around DB queries is in place

## Fix
Wrap the ENTIRE handler body in a single top-level try/catch:
```ts
export const GET: APIRoute = async ({ request, locals }) => {
  // early returns for missing DB are fine outside
  if (!db) return new Response(...);

  try {
    // ALL queries AND response-building code here
    const crimes = await getCrimesByYearFromD1(db, year);
    const stats = buildStats(crimes);          // <-- this can throw on empty data
    const insights = calculateInsights(crimes); // <-- this too
    return new Response(JSON.stringify({...}), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error', detail: msg }), { status: 500 });
  }
};
```

## Notes
- `calculateInsights([])` and `Math.min(...[])` can throw in Cloudflare Workers V8 runtime
- All new SSR API endpoints should use this pattern by default
