# Info Icon Tooltip Pattern

**Created:** December 9, 2025
**Status:** Production-Ready
**Example:** Trinidad Incidents Map (`src/js/components/trinidadLeafletMap.js`)

This document explains how to add info icon tooltips to dashboard widgets. The pattern supports **desktop hover** and **mobile tap** with smart positioning.

---

## 🎯 What You Get

✅ **Desktop:** Hover to show tooltip
✅ **Mobile:** Tap to toggle tooltip
✅ **Smart Positioning:** Automatically avoids screen edges
✅ **Accessible:** Works with keyboard (future enhancement)
✅ **Consistent Design:** Matches site's frosted glass aesthetic

---

## 📋 Copy-Paste Pattern (HTML)

### Basic Structure
```html
<div class="flex items-center gap-2">
  <h3 class="text-h3 font-semibold text-slate-600">Your Widget Title</h3>

  <!-- Info Icon with Tooltip -->
  <div class="relative info-icon-container">
    <svg class="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>

    <!-- Tooltip (CUSTOMIZE THE TEXT BELOW) -->
    <div class="info-tooltip absolute left-1/2 transform -translate-x-1/2 mt-2 w-64 p-3 bg-white/80 backdrop-blur-md border border-slate-200 rounded-lg shadow-lg text-tiny text-slate-600 opacity-0 invisible transition-all duration-300 z-20 pointer-events-none">
      <p class="font-semibold mb-1">Your Title Here</p>
      <p class="mb-2">Your explanation text here. Describe what this widget shows and how the data is calculated.</p>
      <p class="font-semibold mb-1">Additional Section (Optional):</p>
      <ul class="list-disc list-inside space-y-1 text-tiny">
        <li>Point 1</li>
        <li>Point 2</li>
        <li>Point 3</li>
      </ul>
    </div>
  </div>
</div>
```

### Size Variants

**Small Tooltip** (Short explanations):
```html
<div class="info-tooltip ... w-48 ...">  <!-- Changed from w-64 to w-48 -->
  <p class="font-semibold mb-1">Title</p>
  <p>Short explanation.</p>
</div>
```

**Medium Tooltip** (Default - Most widgets):
```html
<div class="info-tooltip ... w-64 ...">  <!-- Default size -->
  <p class="font-semibold mb-1">Title</p>
  <p>Standard explanation with more detail.</p>
</div>
```

**Large Tooltip** (Complex explanations):
```html
<div class="info-tooltip ... w-80 ...">  <!-- Changed from w-64 to w-80 -->
  <p class="font-semibold mb-1">Title</p>
  <p class="mb-2">Detailed explanation with multiple paragraphs.</p>
  <ul class="list-disc list-inside space-y-1">
    <li>Multiple points</li>
    <li>More details</li>
  </ul>
</div>
```

---

## 🔧 What You Can Change (Simple)

### ✅ Safe to Change (You Can Do This)

1. **Tooltip Title** (line with `font-semibold mb-1`)
   ```html
   <p class="font-semibold mb-1">Crime Count Calculation</p>
   ```

2. **Tooltip Content** (paragraph text)
   ```html
   <p class="mb-2">This shows total verified crimes from Trinidad Express, Guardian TT, and Newsday since January 2025.</p>
   ```

3. **Bullet Points** (inside `<ul>` tag)
   ```html
   <ul class="list-disc list-inside space-y-1 text-tiny">
     <li>Data refreshes every 24 hours</li>
     <li>Includes murders, robberies, assaults</li>
     <li>Filtered by selected date range</li>
   </ul>
   ```

4. **Tooltip Width** (change `w-64` to `w-48`, `w-56`, `w-72`, or `w-80`)
   ```html
   <div class="info-tooltip ... w-72 ...">  <!-- Wider tooltip -->
   ```

5. **Add/Remove Sections**
   ```html
   <!-- Add another section: -->
   <p class="font-semibold mb-1 mt-2">Data Sources:</p>
   <p>Trinidad Express, Guardian TT, Newsday</p>
   ```

---

## ⚠️ What NOT to Change (Complex - Ask Claude)

### ❌ Don't Touch These Classes (Break Functionality)

1. **Container Classes:**
   ```html
   class="relative info-icon-container"  <!-- DO NOT CHANGE -->
   ```

2. **Tooltip Classes:**
   ```html
   class="info-tooltip absolute left-1/2 transform -translate-x-1/2 mt-2 ... opacity-0 invisible transition-all duration-300 z-20 pointer-events-none"
   <!-- DO NOT REMOVE: opacity-0, invisible, transition-all, z-20, pointer-events-none -->
   ```

3. **SVG Icon:**
   ```html
   <!-- DO NOT CHANGE the viewBox or path -->
   <svg class="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
   ```

4. **JavaScript Hooks:**
   - Class names: `.info-icon-container`, `.info-tooltip`
   - If you change these, JavaScript won't work!

---

## 🎨 Real-World Examples

### Example 1: Total Crimes Metric
```html
<div class="flex items-center gap-2">
  <h3 class="text-h3 font-semibold text-slate-600">Total Crimes</h3>

  <div class="relative info-icon-container">
    <svg class="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>

    <div class="info-tooltip absolute left-1/2 transform -translate-x-1/2 mt-2 w-64 p-3 bg-white/80 backdrop-blur-md border border-slate-200 rounded-lg shadow-lg text-tiny text-slate-600 opacity-0 invisible transition-all duration-300 z-20 pointer-events-none">
      <p class="font-semibold mb-1">How We Count Crimes</p>
      <p class="mb-2">This number represents all verified serious crimes reported by major news outlets since January 2025.</p>
      <p class="font-semibold mb-1">Included Crime Types:</p>
      <ul class="list-disc list-inside space-y-1 text-tiny">
        <li>Murder</li>
        <li>Robbery</li>
        <li>Home Invasion</li>
        <li>Assault</li>
        <li>Sexual Assault</li>
      </ul>
    </div>
  </div>
</div>
```

### Example 2: Crime Types Chart
```html
<div class="flex items-center gap-2 mb-3">
  <h3 class="text-h3 font-semibold text-slate-600">Crime Type Breakdown</h3>

  <div class="relative info-icon-container">
    <svg class="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>

    <div class="info-tooltip absolute left-1/2 transform -translate-x-1/2 mt-2 w-72 p-3 bg-white/80 backdrop-blur-md border border-slate-200 rounded-lg shadow-lg text-tiny text-slate-600 opacity-0 invisible transition-all duration-300 z-20 pointer-events-none">
      <p class="font-semibold mb-1">Understanding Crime Categories</p>
      <p class="mb-2">Crimes are classified using Gemini AI analysis of news reports. Each incident is assigned one primary crime type based on the severity and nature of the offense.</p>
      <p class="font-semibold mb-1">Classification Rules:</p>
      <ul class="list-disc list-inside space-y-1 text-tiny">
        <li>Murder takes priority over all other crimes</li>
        <li>Sexual assaults are always categorized separately</li>
        <li>Robberies include armed and unarmed theft with victim present</li>
      </ul>
    </div>
  </div>
</div>
```

### Example 3: Weekly Trend Widget (Small Tooltip)
```html
<div class="flex items-center gap-2">
  <span class="text-small text-slate-500">Weekly Trend</span>

  <div class="relative info-icon-container">
    <svg class="w-3 h-3 text-slate-400 cursor-pointer hover:text-slate-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>

    <div class="info-tooltip absolute left-1/2 transform -translate-x-1/2 mt-2 w-48 p-2 bg-white/80 backdrop-blur-md border border-slate-200 rounded-lg shadow-lg text-tiny text-slate-600 opacity-0 invisible transition-all duration-300 z-20 pointer-events-none">
      <p class="font-semibold mb-1">Trend Calculation</p>
      <p>Compares this week's total to last week's total. Positive = more crimes, Negative = fewer crimes.</p>
    </div>
  </div>
</div>
```

---

## 🚨 JavaScript Required

**IMPORTANT:** The info icon HTML alone only works for desktop hover. For mobile tap support, you need JavaScript.

### If Adding to Static HTML Page (like dashboard-trinidad.html):

Add this script **at the end of your page** (before `</body>`):

```javascript
<script>
  // Info icon tooltip behavior (desktop hover + mobile tap)
  document.querySelectorAll('.info-icon-container').forEach(container => {
    const icon = container.querySelector('svg');
    const tooltip = container.querySelector('.info-tooltip');

    if (icon && tooltip) {
      let isTooltipOpen = false;

      // Desktop: Show on hover
      container.addEventListener('mouseenter', () => {
        tooltip.classList.remove('opacity-0', 'invisible');
        tooltip.classList.add('opacity-100', 'visible');
        isTooltipOpen = true;
      });

      container.addEventListener('mouseleave', () => {
        tooltip.classList.remove('opacity-100', 'visible');
        tooltip.classList.add('opacity-0', 'invisible');
        isTooltipOpen = false;
      });

      // Mobile: Toggle on tap
      icon.addEventListener('click', (e) => {
        e.stopPropagation();

        if (isTooltipOpen) {
          tooltip.classList.remove('opacity-100', 'visible');
          tooltip.classList.add('opacity-0', 'invisible');
          isTooltipOpen = false;
        } else {
          tooltip.classList.remove('opacity-0', 'invisible');
          tooltip.classList.add('opacity-100', 'visible');
          isTooltipOpen = true;

          // Smart positioning
          setTimeout(() => {
            const tooltipRect = tooltip.getBoundingClientRect();
            const viewportWidth = window.innerWidth;

            if (tooltipRect.right > viewportWidth - 10) {
              tooltip.classList.remove('left-1/2', 'transform', '-translate-x-1/2');
              tooltip.classList.add('right-0');
            } else if (tooltipRect.left < 10) {
              tooltip.classList.remove('left-1/2', 'transform', '-translate-x-1/2');
              tooltip.classList.add('left-0');
            }
          }, 10);
        }
      });

      // Close when clicking outside
      document.addEventListener('click', (e) => {
        if (isTooltipOpen && !container.contains(e.target)) {
          tooltip.classList.remove('opacity-100', 'visible');
          tooltip.classList.add('opacity-0', 'invisible');
          isTooltipOpen = false;
        }
      });
    }
  });
</script>
```

### If Adding to Dynamically Created Widgets (JavaScript):

See `trinidadLeafletMap.js:253-316` for the complete JavaScript implementation.

---

## 📍 Where to Add Info Icons

### High Priority (Add These First)
1. **Total Crimes Metric** - Explain how crimes are counted
2. **Crime Type Breakdown Chart** - Explain classification system
3. **7-Day Trend Chart** - Explain calculation method
4. **Top 10 Locations Chart** - Explain ranking criteria
5. **Incidents Map** - ✅ DONE (Example implementation)

### Medium Priority
6. **Most Dangerous Area Metric** - Explain ranking algorithm
7. **Most Common Crime Metric** - Explain tie-breaking rules
8. **Weekly Trend Percentage** - Explain percentage calculation

### Low Priority
9. **Date Range Filter** - Explain data refresh frequency
10. **Region Filter** - Explain region boundaries

---

## 🎓 Step-by-Step Tutorial

### Adding Info Icon to "Total Crimes" Metric Card

**Step 1:** Find the metric card HTML
```html
<div class="metric-card ...">
  <h3>Total Crimes</h3>
  <p class="text-h1">1,234</p>
</div>
```

**Step 2:** Wrap the title in a flex container and add icon
```html
<div class="metric-card ...">
  <!-- ADDED: Flex container -->
  <div class="flex items-center gap-2">
    <h3>Total Crimes</h3>

    <!-- ADDED: Info icon -->
    <div class="relative info-icon-container">
      <svg class="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>

      <!-- ADDED: Tooltip -->
      <div class="info-tooltip absolute left-1/2 transform -translate-x-1/2 mt-2 w-64 p-3 bg-white/80 backdrop-blur-md border border-slate-200 rounded-lg shadow-lg text-tiny text-slate-600 opacity-0 invisible transition-all duration-300 z-20 pointer-events-none">
        <p class="font-semibold mb-1">How We Count Crimes</p>
        <p>This shows total verified crimes from Trinidad Express, Guardian TT, and Newsday since January 2025.</p>
      </div>
    </div>
  </div>

  <p class="text-h1">1,234</p>
</div>
```

**Step 3:** Add the JavaScript (if not already on page)
- Copy the JavaScript code from the section above
- Paste it at the end of your HTML file (before `</body>`)
- The JavaScript handles all info icons automatically

**Step 4:** Test
- Desktop: Hover over the icon - tooltip should appear
- Mobile: Tap the icon - tooltip should toggle open/closed
- Edge positioning: Open tooltip near screen edge - should auto-adjust

---

## 🐛 Troubleshooting

### Tooltip Doesn't Show on Hover
**Problem:** CSS classes missing or JavaScript not loaded
**Fix:** Check that all classes are present (especially `opacity-0`, `invisible`, `transition-all`)

### Tooltip Doesn't Work on Mobile
**Problem:** JavaScript not added or not finding elements
**Fix:** Ensure the JavaScript code is on the page and runs after DOM is loaded

### Tooltip Gets Cut Off at Screen Edge
**Problem:** Smart positioning not working
**Fix:** Check that the JavaScript smart positioning code is present (lines that check `tooltipRect`)

### Icon Doesn't Change Color on Hover
**Problem:** Missing Tailwind classes
**Fix:** Ensure `hover:text-slate-600` is in the SVG classes

### Multiple Tooltips Stay Open
**Problem:** State tracking issue
**Fix:** Each tooltip should have its own `isTooltipOpen` variable in the JavaScript

---

## 📝 Checklist for Adding Info Icons

- [ ] Copy HTML structure from this guide
- [ ] Change tooltip title and content to match your widget
- [ ] Adjust tooltip width if needed (`w-48`, `w-64`, `w-72`, `w-80`)
- [ ] Add JavaScript if not already on page
- [ ] Test on desktop (hover)
- [ ] Test on mobile (tap to open, tap to close, tap outside to close)
- [ ] Test near screen edges (smart positioning)
- [ ] Verify icon color matches design (slate-400, hover slate-600)

---

## 📞 When to Ask Claude

Ask Claude to help when:
- Tooltip positioning is wrong (off-center, cut off)
- JavaScript isn't working (mobile tap not responding)
- Need to add tooltips to dynamically created content
- Want to customize animation/transition
- Need keyboard accessibility
- Want different tooltip positions (above, left, right)

---

**Questions?** Check `src/js/components/trinidadLeafletMap.js` lines 115-135 (HTML) and 253-316 (JavaScript) for the working example.
