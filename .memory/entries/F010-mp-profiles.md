# F010 — MP Profiles Feature

**Status:** Active — live as of Mar 10, 2026
**Plan doc:** `docs/civic-extension/P4-01-mp-profiles-plan.md`

---

## What was built

| File | Purpose |
|------|---------|
| `src/data/mps.json` | 41 MP records — single source of truth |
| `src/pages/trinidad/mp/index.astro` | `/trinidad/mp/` — directory grouped by region |
| `src/pages/trinidad/mp/[slug].astro` | `/trinidad/mp/[nameSlug]/` — 41 individual profile pages |
| `public/images/mps/placeholder.svg` | Slate-toned person silhouette; `preserveAspectRatio="xMidYMid slice"` (fills any container like object-cover) |
| `public/images/mps/` | Folder for real photos (empty — all 41 use placeholder until photos are added) |

Region pages updated: `src/pages/trinidad/region/[slug].astro` — "Members of Parliament" card added between stat cards and area ranking.

Routes added: `routes.trinidad.mps`, `buildRoute.mp(nameSlug)`.

Sitemap: `/trinidad/mp/` + 41 profile pages added to `sitemap-0.xml.ts` (priority 0.7, changefreq yearly).

SEO: meta description enriched with live crime stats (incidents 90d, murders YTD from primary region). Person schema enriched with email, telephone, PostalAddress, sameAs parliament URL.

---

## mps.json schema

```json
{
  "nameSlug": "stuart-young",
  "fullName": "Stuart Young",
  "title": "MP",
  "honorific": "Mr",
  "constituency": "Port of Spain North/St. Ann's West",
  "constituencySlug": "port-of-spain-north-st-anns-west",
  "party": "PNM",
  "partyFull": "People's National Movement",
  "electionYear": 2025,
  "regionSlugs": ["port-of-spain"],
  "regionConfidence": "clear",
  "contact": { "email": "", "phone": "", "office": "", "parliamentProfile": "" },
  "website": "",
  "socials": { "facebook": "", "instagram": "", "x": "", "youtube": "" },
  "photo": ""
}
```

**Honorific rules:**
- "The Honourable Dr" in source → `honorific: "The Honourable"`, Dr stays in `fullName` (e.g. "Dr Rishad Seecheran")
- Standalone "Dr" → `honorific: "Dr"`, name without title in `fullName`
- SC stripped from surnames (Stuart Young, Kamla Persad-Bissessar)

**Ambiguous MPs (7):** regionConfidence = "ambiguous", regionSlugs has 2 entries. They appear on both region pages. Profile page shows boundary note + two crime sections.

**Party badge colours:** PNM = red-50/red-700, UNC = orange-50/orange-700, TPP = slate-100/slate-600. Defined inline in each page (3 lines, not worth abstracting).

---

## Profile page layout

2-col card (`grid grid-cols-1 sm:grid-cols-2`, `overflow-hidden`):
- Left: `aspect-square object-cover` image — fills column perfectly at any dimensions
- Right: identity row (name, constituency, party badge, MP since year) + contact rows (email, phone, office, parliament profile, website, socials)

Contact rows render conditionally — empty fields are skipped entirely.

---

## Photo notes

- Store in `public/images/mps/`
- Filename must match `photo` field in mps.json (e.g. `roger-alexander.webp`)
- Note: Khadijah Ameen's filename is `khadija-ameen.webp` (one 'h') — matches existing file
- If `photo` field is empty, placeholder.svg is used automatically

---

## Outstanding / deferred

- **Photos:** Kavell to add real photos to `public/images/mps/`. Filename must match `photo` field in mps.json. All photo fields currently empty → all show placeholder. Known filenames when ready: `roger-alexander.webp`, `khadija-ameen.webp` (one 'h'), `pennelope-beckles.webp`.
- **Socials/website:** All empty — populate when available, no code change needed
- **Area page → MP link:** Phase 2, deferred (only where area→constituency mapping is unambiguous)
- **Next election:** Update mps.json after any by-election or general election. Next general election by April 2030.
