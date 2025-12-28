# Automation Reference

**For:** Google Apps Script automation details

---

## Automated Data Collection

**Location:** `google-apps-script/trinidad/` and `google-apps-script/guyana/`

### Trinidad & Tobago

**Data Sources:**
1. **RSS feeds** collected every 2 hours (Trinidad Express, Guardian, Newsday)
2. **Facebook sources** (manual collection): Ian Alleyne Network, DJ Sherrif
   - These Facebook pages post verified info that doesn't make mainstream media
   - Currently collected manually (automation pending)

**Processing Pipeline:**
1. RSS feeds collected every 2 hours
2. Full article text fetched every 8 hours
3. Gemini AI extracts crime data every hour
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
