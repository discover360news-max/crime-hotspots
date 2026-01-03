# Area Name Tooltip Pattern

**Version:** 1.0
**Created:** January 3, 2026
**Status:** Active

---

## Overview

Many areas in Trinidad have **official Google Maps names** that differ from **locally-known names**. The Area Tooltip Pattern provides a consistent way to display both names using a hover tooltip.

**Visual Example:**
```
Warrenville (with dotted underline)
   ↓ (on hover)
┌─────────────────────────────┐
│ Also known as: Diego Martin │
│             North           │
└─────────────────────────────┘
```

---

## When to Use

Use the `<AreaNameTooltip>` component whenever displaying area/location names:

✅ **Use in:**
- Headlines page (crime locations)
- Crime detail pages (location metadata)
- Dashboard filters (area dropdowns)
- Map markers (popup text)
- Archive pages (location filters)

❌ **Don't use for:**
- Regions (these are standardized, no aliases)
- Divisions (these are standardized, no aliases)

---

## Component API

### Import

```astro
---
import AreaNameTooltip from '../components/AreaNameTooltip.astro';
import { loadAreaAliases, getLocalName } from '../lib/areaAliases';
---
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `area` | `string` | ✅ Yes | Official Google Maps area name |
| `localName` | `string` | ❌ No | Locally-known name (optional) |

### Behavior

- **If `localName` exists and differs from `area`:** Shows dotted underline + tooltip on hover
- **If `localName` is empty or identical to `area`:** Shows plain text (no underline/tooltip)

---

## Usage Examples

### Basic Usage

```astro
---
import AreaNameTooltip from '../components/AreaNameTooltip.astro';
import { loadAreaAliases, getLocalName } from '../lib/areaAliases';

// Load aliases once
const areaAliases = await loadAreaAliases();
const localName = getLocalName(areaAliases, 'Warrenville');
---

<AreaNameTooltip area="Warrenville" localName={localName} />
```

### In a Loop (Headlines)

```astro
---
import AreaNameTooltip from '../components/AreaNameTooltip.astro';
import { loadAreaAliases, getLocalName } from '../lib/areaAliases';

const areaAliases = await loadAreaAliases();
const crimes = await getCrimes();
---

{crimes.map(crime => {
  const localName = getLocalName(areaAliases, crime.area);

  return (
    <div class="crime-card">
      <h3>{crime.headline}</h3>
      <p>
        Location: <AreaNameTooltip area={crime.area} localName={localName} />
      </p>
    </div>
  );
})}
```

### Without Aliases (Graceful Fallback)

```astro
<!-- If you don't have aliases loaded, it just shows plain text -->
<AreaNameTooltip area="San Juan" />
<!-- Renders as: San Juan (no underline, no tooltip) -->
```

---

## Data Source

**CSV URL:** RegionData Sheet
**Columns:**
- `Area` - Official Google Maps name
- `Region` - Administrative region
- `Division` - Geographic division
- `known_as` - Locally-known name (user-populated)

**CSV Export:** https://docs.google.com/spreadsheets/d/e/2PACX-1vTB-ktijzh1ySAy3NpfrcPEEEEs90q-0F0V8UxZxCTlTTbk4Qsa1cbLhlPwh38ie2_bGJYQX8n5vy8v/pub?gid=910363151&single=true&output=csv

---

## Styling Details

### Desktop
- **Trigger:** Dotted underline (2px, slate-400)
- **Hover:** Border turns rose-600
- **Tooltip:** Appears **above** the text with 8px gap
- **Arrow:** Points down to the underlined text

### Mobile (< 640px)
- **Tooltip:** Appears **below** the text (to avoid cutoff at top of screen)
- **Arrow:** Points up to the underlined text

### Colors
- Border: `slate-400` (normal), `rose-600` (hover)
- Tooltip background: `white`
- Tooltip text: `slate-600`
- Tooltip border: `slate-200`

---

## Integration Checklist

When adding area tooltips to a new page:

- [ ] Import `AreaNameTooltip` component
- [ ] Import `loadAreaAliases` and `getLocalName` from `lib/areaAliases`
- [ ] Call `loadAreaAliases()` once at page load
- [ ] For each area name, call `getLocalName(areaAliases, areaName)`
- [ ] Pass result to `<AreaNameTooltip area={...} localName={...} />`
- [ ] Test hover behavior on desktop and mobile

---

## Performance Notes

- **CSS-only tooltips:** No JavaScript required, works everywhere
- **Single data fetch:** `loadAreaAliases()` fetches CSV once per page load
- **No DOM nesting issues:** Pure CSS (unlike `TextInfoPopup.astro` which had modal conflicts)
- **Lightweight:** ~165 rows = ~10KB CSV download

---

## Future Enhancements

- [ ] Add search/filter support for local names (not just official names)
- [ ] Add local name display in map popups
- [ ] Consider adding "Search by local name" helper text in filters

---

## Related Patterns

- **INFO-ICON-PATTERN.md** - Info icon hover pattern (similar tooltip concept)
- **DESIGN-TOKENS.md** - Design system reference (colors, spacing, borders)

---

## Questions?

See `astro-poc/src/components/AreaNameTooltip.astro` for component implementation.
See `astro-poc/src/lib/areaAliases.ts` for data loading logic.
