# Cloudflare Turnstile Testing Guide

**Last Updated:** January 8, 2026
**Status:** Active
**Related Files:** `turnstile-test.html`, `astro-poc/src/layouts/Layout.astro`

---

## Overview

This guide explains how to test Cloudflare Turnstile CAPTCHA locally before deploying to production. Testing locally avoids the 12-minute build/deploy cycle.

---

## Quick Start

### 1. Open the Local Test File

```bash
# From project root
open turnstile-test.html

# Or double-click the file in Finder
```

### 2. Test All Three Widgets

The test file includes:
- **Visible Widget (Always Passes)** - Shows checkbox, uses test key that always succeeds
- **Visible Widget (Always Fails)** - Shows checkbox, uses test key that always fails
- **Invisible Widget** - Auto-verifies in background, always succeeds

### 3. Verify in Browser Console

Open DevTools (Cmd+Option+I) and check for:
- ✅ "Turnstile API loaded successfully"
- ✅ "Rendered widget 1 (visible, always passes)"
- ✅ "Rendered widget 2 (visible, always fails)"
- ✅ "Rendered widget 3 (invisible, auto-passes)"
- ✅ Token values when forms are submitted

---

## Test Keys vs Production Keys

### Test Site Keys (for local testing only)

| Key | Behavior | Use Case |
|-----|----------|----------|
| `1x00000000000000000000AA` | Always passes | Happy path testing |
| `2x00000000000000000000AB` | Always fails | Error handling testing |
| `3x00000000000000000000BB` | Requires interaction | Challenge testing |

### Production Site Key

| Key | Behavior | Use Case |
|-----|----------|----------|
| `0x4AAAAAAB_ThEy2ACY1KEYQ` | Real verification | Live site only |

**⚠️ NEVER use test keys in production!**

---

## Implementation Architecture

### Explicit Rendering (Current Implementation)

We use **explicit rendering** to control when Turnstile widgets initialize. This prevents errors on pages without widgets.

#### Layout.astro (Global Script Load)

```html
<!-- Loads script with render=explicit parameter -->
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" defer></script>
```

**Key Points:**
- `?render=explicit` prevents auto-rendering
- `defer` ensures script loads after DOM is ready
- Loaded globally on ALL pages (but only renders where needed)

#### report.astro (Invisible Widget)

```typescript
// Explicit rendering function
function renderTurnstile() {
  if (typeof window.turnstile === 'undefined') {
    console.warn('Turnstile not loaded yet, retrying...');
    setTimeout(renderTurnstile, 100);
    return;
  }

  try {
    const container = document.getElementById('reportTurnstile');
    if (container && !container.hasAttribute('data-rendered')) {
      window.turnstile.render('#reportTurnstile', {
        sitekey: '0x4AAAAAAB_ThEy2ACY1KEYQ',
        size: 'invisible',
        theme: 'light',
        callback: window.onReportTurnstileSuccess
      });
      container.setAttribute('data-rendered', 'true');
      console.log('Turnstile widget rendered explicitly');
    }
  } catch (error) {
    console.error('Turnstile render error:', error);
  }
}

// Call on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  renderTurnstile();
  // ... rest of initialization
});
```

**Key Points:**
- Checks if Turnstile is loaded before rendering
- Retries every 100ms if not ready
- Prevents double-rendering with `data-rendered` attribute
- Uses invisible mode for seamless UX

#### ReportIssueModal.astro (Visible Widget)

```typescript
let turnstileRendered = false;

function renderTurnstileWidget() {
  if (turnstileRendered) return;

  if (typeof window.turnstile === 'undefined') {
    setTimeout(renderTurnstileWidget, 100);
    return;
  }

  try {
    const container = document.getElementById('reportIssueTurnstile');
    if (container && !container.hasAttribute('data-rendered')) {
      window.turnstile.render('#reportIssueTurnstile', {
        sitekey: '0x4AAAAAAB_ThEy2ACY1KEYQ',
        theme: 'light',
        callback: window.onTurnstileSuccess
      });
      container.setAttribute('data-rendered', 'true');
      turnstileRendered = true;
    }
  } catch (error) {
    console.error('Turnstile render error:', error);
  }
}

// Render when modal opens
openBtn?.addEventListener('click', () => {
  // ... modal opening logic
  renderTurnstileWidget();
});
```

**Key Points:**
- Renders only when modal opens (lazy loading)
- Visible checkbox mode for user interaction
- Prevents re-rendering on subsequent modal opens

---

## Common Issues & Solutions

### Issue 1: "Could not find Turnstile valid script tag"

**Symptom:** Console warning on pages without Turnstile widgets

**Cause:** Script tries to auto-render but finds no widgets

**Solution:** ✅ Fixed with explicit rendering (`?render=explicit`)

---

### Issue 2: Widget not rendering

**Symptom:** Empty div where widget should be

**Troubleshooting:**
1. Check browser console for errors
2. Verify script loaded: `typeof window.turnstile !== 'undefined'`
3. Check network tab for script load failures
4. Verify site key is correct for environment (test vs production)

**Common Causes:**
- Script blocked by ad blocker
- Content Security Policy (CSP) blocking script
- Wrong site key for environment

---

### Issue 3: Token not captured on form submit

**Symptom:** `cf-turnstile-response` field is empty

**Troubleshooting:**
1. Check widget rendered successfully (console logs)
2. For invisible mode: Ensure callback fires before form submit
3. Check form data: `new FormData(form).get('cf-turnstile-response')`

**Solution for Invisible Mode:**
```typescript
// Wait for token if not ready
if (!token || token === '') {
  submitBtn.disabled = true;
  submitBtn.textContent = "Verifying...";

  await new Promise(resolve => setTimeout(resolve, 1500));

  const newFormData = new FormData(form);
  token = newFormData.get('cf-turnstile-response');
}
```

---

### Issue 4: Widget renders on every modal open

**Symptom:** Multiple widgets stack on top of each other

**Solution:**
```typescript
let turnstileRendered = false; // Track rendering state

function renderWidget() {
  if (turnstileRendered) return; // Prevent double render
  // ... render logic
  turnstileRendered = true;
}
```

---

## Testing Checklist

Before deploying Turnstile changes to production:

### Local Testing (turnstile-test.html)

- [ ] All three widgets render without errors
- [ ] Visible widgets show checkbox UI
- [ ] Invisible widget has no visible UI
- [ ] Form submits capture tokens successfully
- [ ] Console shows no errors or warnings
- [ ] Browser DevTools Network tab shows script loads

### Astro Dev Server Testing (localhost:4321)

- [ ] Navigate to `/report` - invisible widget works
- [ ] Navigate to any crime story page - open "Report Issue" modal
- [ ] Modal widget renders when opened
- [ ] No console errors on pages WITHOUT Turnstile (e.g., `/headlines`)
- [ ] Form submissions work end-to-end

### Production Testing (after deploy)

- [ ] Test report form submission
- [ ] Test Report Issue modal on crime pages
- [ ] Verify no console errors site-wide
- [ ] Check Google Apps Script logs for successful verification
- [ ] Test on mobile devices (iOS Safari, Android Chrome)

---

## Development Workflow

### Making Changes to Turnstile Implementation

1. **Test locally first**
   ```bash
   open turnstile-test.html
   ```

2. **Make changes in Astro**
   ```bash
   cd astro-poc
   npm run dev
   ```

3. **Test on dev server**
   - Visit http://localhost:4321/report
   - Test all Turnstile interactions

4. **Build and verify**
   ```bash
   npm run build
   npm run preview
   ```

5. **Deploy to production**
   ```bash
   git add .
   git commit -m "Update Turnstile implementation"
   git push origin main
   ```

6. **Wait 12 minutes for build**
   - Monitor Cloudflare Pages build
   - Test on live site when deployed

---

## Debugging Tips

### Enable Verbose Logging

Add to your page script:
```typescript
// Enable Turnstile debug mode
window.turnstile?.ready(function() {
  console.log('Turnstile ready!');
});
```

### Check Widget State

```typescript
// Get widget ID
const widgetId = window.turnstile.render(...);

// Check if widget completed
window.turnstile.getResponse(widgetId);

// Reset widget
window.turnstile.reset(widgetId);

// Remove widget
window.turnstile.remove(widgetId);
```

### Inspect Form Data

```typescript
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(form);

  console.log('All form fields:');
  for (let [key, value] of formData.entries()) {
    console.log(`${key}: ${value}`);
  }
});
```

---

## Best Practices

### ✅ DO

- Use test keys for local development
- Test both success and failure scenarios
- Implement proper error handling
- Reset widget after form submission
- Add loading states during verification
- Log to console for debugging

### ❌ DON'T

- Use test keys in production
- Remove `async`/`defer` without `render=explicit`
- Auto-render widgets on all pages
- Skip local testing before deploying
- Ignore console warnings
- Trust auto-rendering without explicit control

---

## Related Documentation

- [Cloudflare Turnstile Docs](https://developers.cloudflare.com/turnstile/)
- [Turnstile Client-Side Rendering](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/)
- [Astro Content Security Policy](../claude-context/development-workflow.md#security)

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-08 | Created guide, implemented explicit rendering | Claude |
| 2025-12-XX | Original implementation with auto-rendering | Kavell |

---

**Need Help?** Check the [Crime Hotspots Issues](https://github.com/crimehotspots/issues) or the Cloudflare community forum.
