# Crime Hotspots Caribbean

> **Data-driven crime statistics visualization platform for the Caribbean**

**🌐 Live Site:** https://crimehotspots.com
**📍 Coverage:** Trinidad & Tobago (Live)
**⚡ Status:** Production

---

## 📖 Documentation

**For full documentation, see:**
- **[astro-poc/README.md](astro-poc/README.md)** - Complete project documentation
- **[CLAUDE.md](CLAUDE.md)** - Project instructions for AI assistants
- **[docs/](docs/)** - Guides, automation, and architecture docs

---

## 🚀 Quick Start

```bash
# Navigate to production codebase
cd astro-poc

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## 🏗️ Tech Stack

- **Astro 5.16.5** - Static site generator
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **Google Apps Script** - Serverless automation
- **Cloudflare Pages** - Static hosting (free)

---

## 📊 What This Platform Does

Crime Hotspots automatically collects and visualizes crime data from Caribbean news sources:

- **Interactive Dashboards** - Real-time crime statistics and maps
- **1,700+ Indexed Pages** - Individual crime pages for SEO
- **Monthly Archives** - Historical crime data by month/year
- **Anonymous Reporting** - Community crime reporting system
- **Weekly Blog Reports** - AI-generated crime trend analysis

---

## 📁 Project Structure

```
crime-hotspots/
├── astro-poc/              ← Current production site (Astro)
├── google-apps-script/     ← Backend automation (Google Apps Script)
├── docs/                   ← Documentation & guides
│   ├── claude-context/     ← AI assistant context
│   ├── guides/             ← Setup & usage guides
│   ├── automation/         ← Automation documentation
│   └── archive/            ← Historical files
├── google-credentials/     ← API credentials
└── CLAUDE.md               ← Project instructions
```

---

## 🤖 Automation

Crime data is collected automatically via:

- **Google Apps Script** - Serverless data collection
- **Google Sheets** - Data storage + CSV export
- **GitHub Actions** - Daily site rebuilds (6 AM UTC)
- **Manual Entry** - Current workflow (Gemini automation paused)

**Blog posts** are auto-generated weekly and committed to GitHub.

---

## 🌍 Coverage

### Trinidad & Tobago ✅
- **Status:** Live
- **Data Sources:** Trinidad Express, Newsday, Guardian TT
- **Historical Data:** 2025-2026
- **Updates:** Daily (manual entry)

---

## 🔐 Contributing

This is a **proprietary project**. The codebase is public for transparency, but all rights are reserved.

**Before contributing:**
1. Open an issue to discuss your idea
2. Wait for approval before submitting PRs
3. Read `CLAUDE.md` and `astro-poc/README.md`

---

## 📄 License

**Proprietary Software** - All rights reserved.

The code is viewable for transparency, but unauthorized use, modification, or distribution is prohibited.

---

## 📞 Contact

**Issues/Suggestions:** Open a GitHub issue
**Website:** https://crimehotspots.com

---

**Last Updated:** January 10, 2026
**Version:** 2.0.0 (Astro Production)
