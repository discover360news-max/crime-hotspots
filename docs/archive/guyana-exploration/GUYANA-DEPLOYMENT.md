# Guyana-Specific Deployment Guide

This guide explains how to deploy a Guyana-only version of Crime Hotspots to `guyana.crimehotspots.com`.

## How It Works

The codebase uses environment-based filtering to show only Guyana content when `VITE_COUNTRY_FILTER=guyana` is set at build time.

**What gets filtered:**
- Homepage country grid (shows only Guyana)
- Navigation menu (only Guyana headlines link)
- All UI components automatically adapt

**What stays the same:**
- All UI styling and improvements
- Report form
- Blog (if Guyana-tagged posts exist)
- About page

---

## Step 1: Hostinger DNS Setup

1. Log into Hostinger
2. Go to **Domains** → Select `crimehotspots.com`
3. Click **DNS / Name Servers**
4. Add a **CNAME record**:
   - **Name/Host:** `guyana`
   - **Points to:** `crime-hotspots-guyana.pages.dev`
   - **TTL:** Automatic or 3600
5. Save changes (DNS propagation takes 5-30 minutes)

---

## Step 2: Cloudflare Pages Setup

### Create New Project

1. Go to [Cloudflare Pages Dashboard](https://dash.cloudflare.com/)
2. Click **Create a project** → **Connect to Git**
3. Select your GitHub account and repository: `crime-hotspots`
4. Click **Begin setup**

### Configure Build Settings

**Project name:** `crime-hotspots-guyana`

**Production branch:** `main`

**Build command:**
```bash
VITE_COUNTRY_FILTER=guyana npm run build
```

**Build output directory:** `dist`

**Root directory:** `/` (leave default)

**Environment variables:**
- Name: `VITE_COUNTRY_FILTER`
- Value: `guyana`

### Deploy

5. Click **Save and Deploy**
6. Wait for first build to complete (~2-3 minutes)

---

## Step 3: Custom Domain

1. After deployment, go to project **Settings** → **Custom domains**
2. Click **Set up a custom domain**
3. Enter: `guyana.crimehotspots.com`
4. Cloudflare will verify the CNAME record from Step 1
5. SSL certificate will be issued automatically (5-10 minutes)

---

## Step 4: Verify Deployment

Visit `https://guyana.crimehotspots.com` and verify:

- [x] Homepage shows only Guyana country card
- [x] Navigation menu shows only "Guyana Headlines"
- [x] Headlines page loads Guyana data
- [x] Dashboard shows Guyana Looker Studio
- [x] Report form works (submits to Guyana sheet)
- [x] SSL certificate is active (green padlock)

---

## Future Updates

### UI Changes

UI updates deploy automatically:
1. Make changes to CSS/components in `main` branch
2. Push to GitHub
3. Both sites rebuild automatically:
   - `crimehotspots.com` (all countries)
   - `guyana.crimehotspots.com` (Guyana only)

### Guyana-Specific Branding (Optional)

To add Guyana-specific messaging:

**Option 1: JavaScript (Dynamic)**

Update `index.html` to use `getCountryFilterName()`:

```javascript
import { getCountryFilterName } from './src/js/data/countries.js';

const countryName = getCountryFilterName(); // Returns "Guyana" when filtered
document.querySelector('h1').textContent = `${countryName} Crime Statistics`;
```

**Option 2: Create Guyana Branch**

For more control:
1. Create `guyana` branch from `main`
2. Update Cloudflare Pages to use `guyana` branch
3. Customize messaging in `guyana` branch
4. Merge `main` → `guyana` when UI changes are made

---

## Build Commands Reference

**Local testing:**
```bash
# Test Guyana build locally
VITE_COUNTRY_FILTER=guyana npm run build
npm run preview

# Test Trinidad build
VITE_COUNTRY_FILTER=trinidad npm run build
npm run preview

# Test default (all countries)
npm run build
npm run preview
```

**Development:**
```bash
# Dev server always shows all countries
npm run dev
```

---

## Troubleshooting

### CNAME not resolving
- Check DNS propagation: https://dnschecker.org
- Wait 30 minutes for propagation
- Verify CNAME points to exact Cloudflare Pages URL

### Build fails
- Check environment variable is set in Cloudflare Pages
- Verify build command includes `VITE_COUNTRY_FILTER=guyana`
- Check build logs for errors

### Wrong country showing
- Clear browser cache
- Verify `VITE_COUNTRY_FILTER=guyana` in build command
- Check deployment was successful

---

## Architecture Notes

**Single Codebase Benefits:**
- One source of truth for UI/UX
- Automatic propagation of improvements
- Easy maintenance
- No code duplication

**How Filtering Works:**
1. `vite.config.js` injects `VITE_COUNTRY_FILTER` at build time
2. `src/js/data/countries.js` filters `COUNTRIES` array
3. All components use filtered `COUNTRIES` array
4. Navigation, grids, and links adapt automatically

**File Structure:**
```
src/js/data/countries.js  - Country filtering logic
vite.config.js            - Environment variable injection
index.html                - Homepage (shows filtered countries)
src/js/components/        - All components use COUNTRIES array
```

---

## Contact

For questions or issues, contact the development team or check the main README.
