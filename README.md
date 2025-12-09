# Crime Hotspots Caribbean

> **Data-driven crime statistics visualization platform for the Caribbean**

**Live Site:** https://crimehotspots.com
**Current Coverage:** Trinidad & Tobago, Guyana
**Planned:** Barbados

---

## 📊 What This Project Does

**Crime Hotspots** automatically collects, processes, and visualizes crime data from Caribbean news sources using AI-powered extraction. The platform provides:

- **Interactive Dashboards** - Real-time crime statistics via Google Looker Studio
- **Headlines Database** - Searchable, filterable crime incidents
- **Weekly Blog Reports** - AI-generated crime trend analysis
- **Anonymous Reporting** - Community crime reporting with Cloudflare Turnstile protection

---

## 🏗️ Tech Stack

### Frontend
- **Vanilla JavaScript** (ES Modules) - No framework bloat
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** (CDN) - Utility-first styling
- **PapaParse** - CSV data parsing
- **DOMPurify** - XSS protection

### Backend & Automation
- **Google Apps Script** - Serverless automation (100% free)
- **Google Gemini AI** - Crime data extraction (1.5M free requests/day)
- **Google Sheets** - Data storage & CSV export
- **Cloudflare Turnstile** - CAPTCHA for form submissions
- **GitHub Actions** - CI/CD pipeline

### Deployment
- **Cloudflare Pages** - Static hosting (free tier, global CDN)
- **GitHub** - Version control & automated deployments

---

## 📁 Project Structure

```
crime-hotspots/
├── src/                          # Source code
│   ├── js/
│   │   ├── components/          # Reusable UI components
│   │   ├── data/                # Country configurations
│   │   └── utils/               # Helper functions
│   ├── css/                     # Custom styles
│   └── assets/                  # Images, fonts
│
├── public/                       # Static assets (copied to dist/)
│   └── assets/images/           # Country images, logos
│
├── google-apps-script/          # Automation scripts
│   ├── trinidad/                # Trinidad & Tobago automation
│   ├── guyana/                  # Guyana automation
│   └── weekly-reports/          # Blog post generation
│
├── docs/                        # Documentation
│   ├── automation/              # Automation guides
│   ├── guides/                  # Setup & usage guides
│   └── archive/                 # Historical development docs
│
├── scripts/                     # Build scripts
│   ├── generateBlogManifest.js
│   ├── generateRSS.js
│   └── generateSitemap.js
│
├── .github/workflows/           # CI/CD pipelines
│   └── deploy.yml               # Automated deployment
│
├── vite.config.js               # Build configuration
├── package.json                 # Dependencies
└── CLAUDE.md                    # AI assistant instructions
```

---

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Deployment

**Automated (Current Setup):**
1. Push to `main` branch
2. GitHub Actions builds site
3. Cloudflare Pages deploys automatically
4. Live at https://crimehotspots.com

**Manual (if needed):**
```bash
npm run build
# Upload dist/ folder to Cloudflare Pages dashboard
```

---

## 🤖 Automation System

### Trinidad & Tobago Automation
**Location:** `google-apps-script/trinidad/`

**What it does:**
1. Collects articles from 3 RSS feeds every 2 hours
2. Fetches full article text every hour
3. Extracts crime data with Gemini AI every hour
4. Publishes to Production sheet (public CSV)

**Current Performance:**
- 100-120 articles processed per day
- 30-35 crime incidents extracted daily
- 99% uptime since Nov 6, 2025

**Setup:** Copy all `.gs` files to Google Apps Script project linked to Trinidad Google Sheet

---

### Guyana Automation
**Location:** `google-apps-script/guyana/`

**What it does:**
- Same process as Trinidad
- Collects from 5 Guyana news sources
- Independent Google Sheet & Apps Script project

**Status:** Live as of Nov 15, 2025
**Backfill:** 170 historical URLs processed (Jan-Nov 2025)

**Setup:** Copy all `.gs` files to separate Google Apps Script project for Guyana

---

### Weekly Blog Reports
**Location:** `google-apps-script/weekly-reports/`

**What it does:**
1. Runs every Monday at 10 AM
2. Analyzes last 7 days of crime data
3. Generates markdown blog post
4. Commits to GitHub via API
5. Auto-deploys to live site

**Safeguards:**
- Minimum 10 crimes required
- Data freshness check (3+ recent crimes)
- Duplicate detection (won't republish same data)
- Backlog check (skips if processing behind)
- Email notifications when skipped

**Documentation:** `docs/automation/WEEKLY-REPORT-SAFEGUARDS.md`

---

## 📖 Key Documentation

### For Developers
- **CLAUDE.md** - AI assistant instructions (project overview, architecture, patterns)
- **docs/automation/** - Automation setup & maintenance guides
- **google-apps-script/trinidad/README.md** - Trinidad automation details
- **google-apps-script/guyana/SEPARATE-SCRIPTS-SETUP.md** - Guyana setup guide

### For Growth & Marketing
- **docs/automation/VIRAL-GROWTH-README.md** - 30-minute viral growth setup
- **docs/automation/IMPLEMENTATION-ROADMAP.md** - 4-week growth plan
- **docs/automation/VIRAL-GROWTH-PLAYBOOK.md** - Caribbean-specific tactics

### Archived (Historical Reference)
- **docs/archive/Development Progress/** - Development history (Nov 2025)

---

## 🔑 Configuration

### Adding a New Country

1. **Add to `src/js/data/countries.js`:**
```javascript
{
  id: 'bdos',
  name: 'Barbados',
  flag: '🇧🇧',
  dashboard: 'https://lookerstudio.google.com/...',
  csvUrl: 'https://docs.google.com/spreadsheets/...',
  available: true,
  image: '/assets/images/barbados.jpg',
  headlinesSlug: 'barbados'
}
```

2. **Create Google Sheet** with tabs: Raw Articles, Production, Review Queue, Processing Queue, Archive

3. **Set up Google Apps Script:**
   - Copy scripts from `google-apps-script/trinidad/`
   - Update `config.gs` with Barbados RSS feeds
   - Set up 3 triggers (RSS collection, article fetching, Gemini processing)

4. **Publish CSV:**
   - File → Share → Publish to web
   - Select "Production" sheet, CSV format
   - Update `csvUrl` in countries.js

5. **Create Dashboard:**
   - Import Production sheet to Google Looker Studio
   - Create visualizations
   - Publish & embed
   - Update `dashboard` URL in countries.js

**That's it!** The frontend automatically adapts to new countries.

---

## 🐛 Common Issues

### Issue: Dashboard won't load
**Solution:** Check Content Security Policy in `index.html`. Add dashboard domain to `frame-src` directive.

### Issue: Headlines not updating
**Solution:** Check if Production sheet CSV is published. Verify CSV URL is public.

### Issue: Gemini processing stopped
**Solution:**
1. Check Script Properties for GEMINI_API_KEY
2. Verify quota in Google Cloud Console
3. Check trigger execution logs in Apps Script

### Issue: Weekly blog report didn't publish
**Solution:** Check email for skip notification. Common reasons:
- Not enough crimes (< 10)
- Data is stale (no recent processing)
- Backlog too large (> 50 pending articles)
- Data unchanged from last week

---

## 📊 Performance Metrics

**Current Site Stats (as of Nov 15, 2025):**
- **Page Load Time:** 1.2s (First Contentful Paint)
- **Build Time:** ~400ms
- **Bundle Size:** 60KB total (22KB vendor, 38KB custom)
- **Lighthouse Score:** 98/100

**Automation Performance:**
- **Trinidad:** 100-120 articles/day, 30-35 crimes/day
- **Guyana:** 40-50 articles/day, 20-25 crimes/day (estimated)
- **API Cost:** $0/month (Gemini free tier: 1.5M requests/day)
- **Hosting Cost:** $0/month (Cloudflare Pages free tier)

---

## 🤝 Contributing

This is a personal project, but suggestions are welcome!

**Before contributing:**
1. Read `CLAUDE.md` for architecture patterns
2. Check `docs/guides/` for setup instructions
3. Test locally with `npm run dev`
4. Build successfully with `npm run build`

---

## 📄 License

**This project is proprietary software.** All rights reserved.

**Contact:** crime-hotspots@example.com (update with actual email)

---

## 🙏 Acknowledgments

- **Data Sources:** Trinidad Express, Newsday, CNC3, Demerara Waves, INews Guyana, Kaieteur News, News Room Guyana, Guyana Times
- **AI Processing:** Google Gemini 1.5 Flash
- **Infrastructure:** Cloudflare, Google Workspace, GitHub

---

**Last Updated:** November 15, 2025
**Version:** 1.2.0
**Status:** ✅ Production (Trinidad & Guyana Live)
# Trigger deployment
