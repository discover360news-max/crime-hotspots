# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Crime Hotspots is a web-based data visualization platform for Caribbean crime statistics. The application displays crime data dashboards, headlines, and provides anonymous crime reporting functionality. Currently focused on Trinidad & Tobago, with Guyana and Barbados planned for future releases.

**Tech Stack:**
- Vanilla JavaScript (ES Modules) with Vite as the build tool
- Tailwind CSS (via CDN) for styling
- Google Looker Studio for embedded dashboards
- Google Sheets as CSV data source
- Google Apps Script as serverless backend for form submissions
- PapaParse for CSV parsing
- Cloudflare Turnstile for CAPTCHA

## Development Commands

```bash
# Start development server with hot reload (default port: 5173)
npm run dev

# Build for production (outputs to dist/)
npm run build

# Preview production build locally
npm run preview
```

**Note:** No testing, linting, or deployment scripts are currently configured.

## Architecture

### Data-Driven Configuration

The entire application is driven by the `src/js/data/countries.js` file. To add a new country:

1. Add entry to the `COUNTRIES` array with required fields:
   - `id`: unique identifier
   - `name`: full country name
   - `flag`: emoji flag
   - `dashboard`: Looker Studio embed URL
   - `csvUrl`: Google Sheets CSV export URL
   - `available`: boolean (false shows "Coming Soon")
   - `image`: path to header image
   - `headlinesSlug`: URL slug for headlines page

2. The header navigation, country grid, and all UI elements will automatically update based on this configuration.

### Component Architecture

**Header Component (`src/js/components/header.js`):**
- Dynamically builds navigation from `COUNTRIES` array
- Auto-highlights active page/section based on URL
- Responsive mobile menu with hamburger toggle
- Dropdown for "View Headlines" with island-specific links

**Dashboard Panel (`src/js/components/dashboardPanel.js`):**
- Manages modal/drawer for embedded Looker Studio dashboards
- Implements iframe caching strategy (dashboards persist after first load)
- Handles 10-second timeout with fallback error messaging
- Smooth fade-in transitions on load
- Links to corresponding headlines page after dashboard loads

**Page-Specific Scripts:**
- `main.js`: Homepage country grid rendering and dashboard panel initialization
- `headlines-trinidad.js`: CSV parsing, area filtering, pagination (10 headlines per batch)
- `reportStandalone.js`: Form validation, honeypot, Turnstile CAPTCHA, Google Apps Script submission

### Key Implementation Details

**Dashboard Loading Flow:**
1. User clicks country card → `loadDashboard()` called
2. Check cache for existing iframe source
3. If cached: instant display, else: load iframe and set 10s timeout
4. On successful load: fade in dashboard, reveal "View Headlines" link
5. Dashboard iframe remains cached for subsequent views

**Headlines Processing:**
- CSV fetched from Google Sheets via public URL
- Client-side parsing with PapaParse
- Headlines sorted by date (newest first)
- Area dropdown populated dynamically from unique CSV values
- "Load More" pagination adds 10 headlines at a time

**Form Submission:**
- Data posted to Google Apps Script webhook URL
- Honeypot field (`website`) must be empty (bot detection)
- Cloudflare Turnstile token validated server-side
- Success/error states shown with visual feedback

## File Structure

```
src/
├── js/
│   ├── main.js                    # Homepage initialization
│   ├── headlines-trinidad.js      # Headlines page logic
│   ├── reportStandalone.js        # Crime report form
│   ├── components/
│   │   ├── header.js              # Navigation header (responsive)
│   │   └── dashboardPanel.js      # Dashboard modal/drawer
│   ├── data/
│   │   └── countries.js           # Country metadata (single source of truth)
│   └── utils/
│       └── dom.js                 # DOM utilities (spinner, fade animations)
└── css/
    └── styles.css                 # Custom animations & Tailwind overrides
```

## Important Notes

- **No TypeScript:** Pure JavaScript with ES modules
- **No Testing Framework:** Tests not currently implemented
- **No Linting:** ESLint/Prettier not configured
- **External Dependencies:** React is listed in package.json but not actively used in codebase
- **Not a Git Repository:** Project is not version-controlled (consider initializing with `git init`)

## Common Patterns

**Adding a New Page:**
1. Create HTML file in root directory
2. Import `header.js` component in page script
3. Call `renderHeader()` with optional active section override
4. Add navigation link to header component if needed

**Working with CSV Data:**
- Google Sheets CSVs must be published with "single=true&output=csv" parameters
- PapaParse handles parsing automatically
- Always sort/filter data client-side for responsiveness

**Styling Conventions:**
- Tailwind utility classes for layout and common styles
- Custom animations defined in `src/css/styles.css`
- Rose color palette (`rose-600`, `rose-700`) for primary actions
- Slate palette for text and borders

---

## Automated Data Collection System

This project includes a **production-ready automated crime data collection system** (Google Apps Script) that processes 100-120 articles/day from Trinidad & Tobago news sources using Google Gemini AI.

### Critical Implementation Details

**Multi-Crime Detection:**
Articles often contain multiple crime incidents. The system extracts crimes as an array, not single objects:
```javascript
{
  "crimes": [{crime1}, {crime2}, {crime3}],
  "confidence": 9
}
```

**Key Configuration Values (NEVER change these):**
- `maxOutputTokens: 4096` - Token limit must stay at 4096 (not 2048) to prevent truncation
- Publication date ≠ crime date - Pass `publishedDate` to Gemini for relative date calculation
- Duplicate detection uses URL + headline (not just URL) to avoid blocking multi-crime articles

**Automation Files Location:**
`Development Progress/Agent - Workflow Architect/Kavell Automation Live Code/`
- config.gs - Configuration & API management (API keys in Script Properties)
- geminiClient.gs - AI extraction (multi-crime detection logic)
- processor.gs - Main orchestrator (routing based on confidence)
- rssCollector.gs, articleFetcher.gs, geocoder.gs

**Critical References:**
- `PROJECT-CONTEXT.md` - Complete automation system history and technical decisions
- `AGENT-BRIEFING.md` - Quick reference for agents working on automation
- `GO-LIVE-CHECKLIST.md` - Production deployment checklist

**When Working on Automation:**
Read `AGENT-BRIEFING.md` first. Never decrease token limits, remove multi-crime detection, or hardcode API keys.
- Add to memory. NEVER Assume, as questions about or ask to be pointed to files to review for context, accuracy, continuity at all times you are unsure or lacking key details.