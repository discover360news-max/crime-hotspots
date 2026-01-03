# Accordion Pattern

**Component:** `src/components/DateAccordion.astro`
**First Implementation:** Headlines page (`src/pages/trinidad/headlines.astro`)
**Created:** January 3, 2026

---

## Purpose

The DateAccordion component provides a collapsible container for grouping content by date. It improves content organization and reduces cognitive load by allowing users to focus on specific time periods.

---

## When to Use

✅ **Use DateAccordion when:**
- Grouping time-based content (headlines, archive entries, logs)
- Content spans multiple dates with varying item counts per date
- Users need chronological organization with the ability to focus on specific dates
- Screen space is limited and all content shouldn't be visible at once

❌ **Don't use DateAccordion when:**
- Filtering/searching is active (show flat grid instead for scannability)
- Content has fewer than 3 date groups (overhead not worth it)
- Users need to compare items across different dates simultaneously

---

## Design Specifications

### Accordion Header
- **Background:** `bg-white/70 backdrop-blur-md` (frosted glass)
- **Border:** `border border-slate-200` with `rounded-lg`
- **Padding:** `px-4 py-3`
- **Hover state:** `hover:bg-white/90` (subtle increase in opacity)
- **Layout:** Flexbox with space-between (content left, badge right)

### Header Content (Left Side)
- **Chevron icon:**
  - Size: `w-5 h-5`
  - Color: `text-slate-400`
  - Rotation: `rotate-90` when expanded, `rotate-0` when collapsed
  - Transition: `transition-transform duration-200`
- **Date text:**
  - Font: `text-small font-semibold text-slate-700`
  - Format: "Weekday, Month Day, Year" (e.g., "Friday, January 3, 2026")
- **Subtext:**
  - Font: `text-xs text-slate-500`
  - Content: Dynamic metric with pluralization (e.g., "5 victims", "1 victim")

### Badge (Right Side)
- **Background:** `bg-rose-100`
- **Text:** `text-rose-600 text-xs font-medium`
- **Padding:** `px-3 py-1`
- **Shape:** `rounded-full`
- **Content:** Numeric value matching subtext metric

### Accordion Content
- **Overflow:** `overflow-hidden` (required for smooth height transitions)
- **Transition:** `transition-all duration-300`
- **Height:** `max-h-0` when collapsed, `max-h-[10000px]` when expanded
- **Top margin:** `mt-3` when expanded (spacing from header)
- **Bottom padding:** `pb-4` (prevents shadow clipping on nested content)
- **Grid layout:** `grid gap-4 sm:grid-cols-2 lg:grid-cols-3` (matches CrimeCard grid)

---

## Props Interface

```typescript
interface Props {
  date: string;          // YYYY-MM-DD format
  crimeCount: number;    // Number of items in this date group
  victimCount: number;   // Calculated metric to display
  isExpanded?: boolean;  // Default: false
}
```

---

## Usage Example

```astro
---
import DateAccordion from '../../components/DateAccordion.astro';
import CrimeCard from '../../components/CrimeCard.astro';

const crimesByDate = new Map(); // Group your data by date
const sortedDates = Array.from(crimesByDate.keys()).sort();

function calculateVictimCount(crimes) {
  return crimes.reduce((total, crime) => {
    return total + (crime.victimCount || 1);
  }, 0);
}
---

{sortedDates.map((date, index) => {
  const crimes = crimesByDate.get(date);
  const victimCount = calculateVictimCount(crimes);
  return (
    <DateAccordion
      date={date}
      crimeCount={crimes.length}
      victimCount={victimCount}
      isExpanded={index === 0}
    >
      {crimes.map(crime => (
        <CrimeCard crime={crime} />
      ))}
    </DateAccordion>
  );
})}
```

---

## Context-Aware Rendering Pattern

For optimal UX, switch between accordion and flat grid based on user context:

```javascript
function renderCrimes() {
  const container = document.getElementById('crimeAccordions');

  if (isFiltered) {
    // FILTERED MODE: Flat grid for easy scanning
    container.innerHTML = `
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        ${crimes.map(crime => createCrimeCardHTML(crime)).join('')}
      </div>
    `;
  } else {
    // ACCORDION MODE: Grouped by date
    const crimesByDate = groupByDate(crimes);
    container.innerHTML = createAccordionsHTML(crimesByDate);
    attachAccordionListeners(); // Re-attach after innerHTML replacement
  }
}
```

---

## Accessibility

- Uses semantic `<button>` for accordion headers (keyboard accessible)
- `aria-expanded` attribute reflects current state
- Smooth transitions provide visual feedback
- Keyboard navigation: Tab to header, Enter/Space to toggle

---

## Performance Considerations

1. **Initial Render:** Server-side render first 30 items to avoid layout shift
2. **Dynamic Updates:** Only re-render when filters change or "Load More" is clicked
3. **Event Delegation:** Attach listeners at container level, not individual accordions
4. **Max Height:** Use large fixed value (`10000px`) instead of `auto` for smooth CSS transitions

---

## Design Rationale

### Why `max-h-[10000px]` instead of `auto`?
CSS transitions can't animate `height: auto`. Using a large fixed value allows smooth transitions while accommodating any realistic content height.

### Why bottom padding on content grid?
The accordion uses `overflow: hidden` which clips shadows on nested elements. Bottom padding ensures shadows on the last row of cards remain visible.

### Why show badge AND subtext?
- **Badge:** Quick visual scanning (number stands out)
- **Subtext:** Provides context and units ("5 victims" vs just "5")

### Why rotate chevron instead of up/down icons?
- Single icon (smaller bundle, less DOM)
- Clear directional indicator (right = collapsed, down = expanded)
- Smooth rotation animation feels more polished

---

## Future Enhancements

- **Expand All / Collapse All buttons** - Bulk controls for power users
- **Keyboard shortcuts** - Arrow keys to navigate between accordions
- **Persist state** - Remember which accordions were expanded via localStorage
- **Animation variants** - Optional slide vs fade transitions
- **Nested accordions** - Support for hierarchical grouping (year > month > day)

---

## Related Patterns

- **Info Icon Pattern** - `docs/guides/INFO-ICON-PATTERN.md`
- **Frosted Glass** - `docs/guides/DESIGN-TOKENS.md` (Glassmorphism section)
- **Crime Cards** - `src/components/CrimeCard.astro`
