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

### Expanded Wrapper (Container)

When expanded, the `.date-accordion` wrapper visually groups the header and cards together:

- **Background:** `bg-slate-50/60 dark:bg-[hsl(0_0%_6%)]/60` (subtle tint)
- **Border:** `border border-rose-200 dark:border-rose-900/40` (rose accent)
- **Shape:** `rounded-xl` (container-level radius)
- **Transition:** `transition-colors duration-300`
- **When collapsed:** No wrapper styling (transparent, borderless)

### Accordion Header

- **Background:** `bg-white/85 dark:bg-[hsl(0_0%_8%)]/85 backdrop-blur-md` (frosted glass)
- **Border:** `border` with `border-color:#e11d48` when expanded, `var(--ch-border)` when collapsed
- **Shape:** `rounded-lg`
- **Padding:** `px-4 py-3`
- **Hover state:** `hover:bg-white/90 dark:hover:bg-[hsl(0_0%_10%)]/90`
- **Layout:** Flexbox with space-between (content left, badge + hint right)

### Header Content (Left Side)
- **Chevron icon:**
  - Size: `w-5 h-5`
  - Color: `text-slate-400 dark:text-[hsl(0_0%_50%)]`
  - Rotation: `rotate-90` when expanded, `rotate-0` when collapsed
  - Transition: `transition-transform duration-200`
- **Date text:**
  - Font: `text-caption font-bold`
  - Color: `#e11d48` when expanded, `var(--ch-text)` when collapsed
  - Format: "Weekday, Month Day, Year" (e.g., "Friday, January 3, 2026")
- **Subtext:**
  - Font: `text-caption text-slate-500 dark:text-[hsl(0_0%_55%)]`
  - Content: "{N} incidents affecting {N} victims" with pluralization

### Right Side (Badge + Tap Hint)

- **"Tap to view" hint:**
  - Font: `text-caption text-slate-400 dark:text-[hsl(0_0%_45%)]`
  - Visibility: Shown when collapsed, hidden when expanded
  - Purpose: UX affordance — tells users the accordion is clickable
- **Count badge:**
  - Background: `bg-slate-200 dark:bg-[hsl(0_0%_20%)]`
  - Text: `text-slate-600 dark:text-[hsl(0_0%_55%)] text-caption font-medium`
  - Padding: `px-1.5 py-0.5 min-h-[20px]`
  - Shape: `rounded-full`
  - Content: Incident count number

### Accordion Content
- **Overflow:** `overflow-hidden` (required for smooth height transitions)
- **Transition:** `transition-all duration-300`
- **Height:** `max-h-0` when collapsed, `max-h-[10000px]` when expanded
- **Top margin:** `mt-3` when expanded (spacing from header)
- **Padding:** `px-3 pb-3` when expanded (inset within wrapper container)
- **Grid layout:** `grid gap-4 sm:grid-cols-2 lg:grid-cols-3` (matches CrimeCard grid)
- **Mobile timeline:** `pl-8` with dotted vertical line and rose-600 dots

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
