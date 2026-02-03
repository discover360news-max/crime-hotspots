# Automation Reference

**For:** Google Apps Script automation details

**Last Updated:** February 2, 2026

---

## Automated Data Collection

**Location:** `google-apps-script/trinidad/` and `google-apps-script/guyana/`

### Trinidad & Tobago

**AI Model:** Claude Haiku 4.5 (`claude-3-5-haiku-20241022`)
- Migrated from Groq/Gemini in January 2026
- Prompt caching enabled (5-min TTL, ~90% input token savings)
- Cost: ~$2.70/month for 20 articles/day
- **File:** `google-apps-script/trinidad/claudeClient.gs`

**Data Sources:**
1. **RSS feeds** collected 3x daily (CNC3, Trinidad Express)
   - Newsday disabled (closed January 2026)
   - Trinidad Guardian has NO RSS feed (site is fully JS-rendered, archive pages return 404)
2. **Facebook sources** via Facebook Post Submitter web app: Ian Alleyne Network, DJ Sherrif, Trinidad Guardian
   - **File:** `google-apps-script/trinidad/facebookSubmitter.gs`
   - Web app: paste text + URL → Claude Haiku extracts → Production sheet
   - Year toggle: 2026 → pipeline Production sheet, 2025 → FR1 sheet (spreadsheet `1ornc_adllfJeA9V984qFCDdwfrEEX2H6rNH6nNQUHCQ`)
   - Confidence bypass: manual submissions always go to Production (user-vetted)
   - Deploy: Apps Script → Web app (Execute as: Me, Access: Only myself)

**Processing Pipeline:**
1. RSS feeds collected every 2 hours
2. Full article text fetched every 8 hours
3. **Claude AI extracts crime data** (replaced Gemini)
4. Data published to duplicated Production sheet (public CSV)
5. **Update frequency:** Live Data refreshed every 24 hours

---

## Critical Configuration (NEVER Change)

- **`maxOutputTokens: 4096`** - Must stay at 4096 to prevent truncation
- **Multi-crime detection** - crimes must be an array
- **API keys** - Stored in Script Properties, never hardcoded

---

## When Working on Automation

**NEVER:**
- Change `maxOutputTokens` from 4096
- Remove multi-crime detection
- Hardcode API keys

**ALWAYS:**
- Read automation README first
- Test with `testRSSCollection()` functions
- Verify Script Properties are set

---

## Documentation

- `google-apps-script/trinidad/README.md` - Trinidad automation
- `docs/FACEBOOK-DATA-COLLECTION.md` - Facebook sources
- `docs/automation/WEEKLY-REPORT-SAFEGUARDS.md` - Blog automation safeguards
- `docs/automation/DUPLICATE-DETECTION-ARCHIVE.md` - Enhanced duplicate detection
- `docs/automation/SEIZURES-CRIME-TYPE.md` - Seizures crime type

---

## Weekly Blog Reports

**Status:** Needs to be updated and fixed (future To-Do)

**Documentation:** `docs/automation/WEEKLY-REPORT-SAFEGUARDS.md`
