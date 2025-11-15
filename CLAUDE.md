# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Crime Hotspots is a web-based data visualization platform for Caribbean crime statistics. The application displays crime data dashboards, headlines, and provides anonymous crime reporting functionality.

**Current Status:** ✅ Production - Trinidad & Tobago and Guyana live
**Live Site:** https://crimehotspots.com
**Last Updated:** November 15, 2025

---

## Tech Stack

**Frontend:**
- Vanilla JavaScript (ES Modules) with Vite
- Tailwind CSS (via CDN)
- PapaParse for CSV parsing
- DOMPurify for XSS protection
- Cloudflare Turnstile for CAPTCHA

**Backend/Automation:**
- Google Apps Script (serverless)
- Google Gemini AI (crime data extraction)
- Google Sheets (data storage + CSV export)
- GitHub Actions (CI/CD)

**Hosting:**
- Cloudflare Pages (auto-deploy from GitHub)
- Custom domain: crimehotspots.com

---

## Development Commands

```bash
npm run dev      # Start dev server (port 5173)
npm run build    # Build for production
npm run preview  # Preview production build
```

**Deployment:** Push to `main` → GitHub Actions builds → Cloudflare Pages deploys automatically

---

## Architecture

### Data-Driven Configuration

The entire application is driven by **`src/js/data/countries.js`**. To add a new country:

1. Add entry to `COUNTRIES` array
2. The header, country grid, and all UI elements automatically update

### Key Files

```
src/js/
├── components/
│   ├── header.js              # Navigation (dynamic from countries.js)
│   ├── dashboardPanel.js      # Dashboard modal with caching
│   ├── headlinesPage.js       # Shared headlines logic
│   └── loadingStates.js       # Shimmer loaders
├── data/
│   └── countries.js           # Single source of truth
└── utils/
    └── dom.js                 # DOM utilities

google-apps-script/
├── trinidad/                  # Trinidad automation
├── guyana/                    # Guyana automation
└── weekly-reports/            # Blog post generation
```

---

## Automated Data Collection

**Location:** `google-apps-script/trinidad/` and `google-apps-script/guyana/`

**How it works:**
1. RSS feeds collected every 2 hours
2. Full article text fetched every hour
3. Gemini AI extracts crime data every hour
4. Data published to Production sheet (public CSV)

**Critical Configuration (NEVER change):**
- `maxOutputTokens: 4096` - Must stay at 4096 to prevent truncation
- Multi-crime detection - crimes must be an array
- API keys stored in Script Properties, never hardcoded

**Documentation:** `google-apps-script/trinidad/README.md`

---

## Weekly Blog Reports

**Location:** `google-apps-script/weekly-reports/weeklyReportGenerator-IMPROVED.gs`

**Runs:** Every Monday at 10 AM

**Safeguards:**
- Minimum 10 crimes required
- Data freshness check (3+ recent crimes)
- Duplicate detection
- Backlog check (skips if > 50 pending)
- Email notifications when skipped

**Documentation:** `docs/automation/WEEKLY-REPORT-SAFEGUARDS.md`

---

## Common Patterns

### Adding a New Page

1. Create HTML file in root
2. Import header component
3. Add to `vite.config.js` input configuration

### Working with CSV Data

- Sheets must be published with `single=true&output=csv`
- PapaParse handles parsing
- Sort/filter client-side

### Styling

- Tailwind utilities for layout
- Rose palette (`rose-600`, `rose-700`) for primary actions
- Custom animations in `src/css/styles.css`

---

## Critical Rules

### When Working on Automation

**NEVER:**
- Change `maxOutputTokens` from 4096
- Remove multi-crime detection
- Hardcode API keys

**ALWAYS:**
- Read automation README first
- Test with `testRSSCollection()` functions
- Verify Script Properties are set

### When Working on Frontend

**DO:**
- Use Read, Edit, Write tools (not bash)
- Prefer editing existing files
- Test with `npm run dev`
- Build successfully before committing

**DON'T:**
- Use emojis unless requested
- Create markdown files unless required
- Modify vite.config.js without understanding

---

## Git/GitHub

**Only commit when user requests.**

**Never:**
- Force push to main
- Skip hooks
- Commit secrets

**Commit format:**
```bash
git commit -m "Short title

- Change details

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Project Status

### ✅ Completed
- Trinidad & Tobago automation (100% functional)
- Guyana automation (launched Nov 15, 2025)
- Automated deployment (GitHub → Cloudflare)
- Blog system with visual components
- Weekly report generator with safeguards

### 🔄 In Progress
- Guyana backfill processing (170 URLs)

### 📋 Planned
- Barbados automation
- Google Analytics
- Social media auto-posting
- SEO optimization

---

## Documentation

**For Developers:**
- README.md - Project overview
- This file (CLAUDE.md) - Architecture
- google-apps-script/*/README.md - Automation details

**For Growth:**
- docs/automation/VIRAL-GROWTH-README.md

**Archived:**
- docs/archive/Development Progress/

---

**Version:** 1.2.0
**Last Updated:** November 15, 2025
