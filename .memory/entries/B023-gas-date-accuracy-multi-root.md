---
id: B023
type: bug
status: fixed
created: 2026-03-19
updated: 2026-03-19
related: [B004, B013, F002]
---

## Summary
Crime dates were being stored as the automation run date (not the publish date, not the incident date) due to three compounding bugs discovered Mar 19 2026 via CNC3 human trafficking article (published Mar 17, stored as Mar 18).

## Root Causes

### 1. Empty pubDate from RSS → falsy publishedDate chain
`rssCollector.gs` stored `article.pubDate = ''` when RSS `<pubDate>` was missing/empty.
`processor.gs` read it back as `''` (falsy) → `publishedDate || new Date()` = run date everywhere downstream.

### 2. Claude returned crime_date: null for ongoing-crime articles
Articles about crimes spanning years (trafficking, abuse, fraud) where the specific event is a raid/rescue caused Claude to return `crime_date: null`, silently falling back to run date. No prompt rule existed for this scenario.

### 3. dayOfWeek used getDay() — UTC clock, not script timezone
`buildUserPrompt` computed day-of-week with `pubDate.getDay()` (V8 UTC) while `pubDateStr` used `Utilities.formatDate(..., Session.getScriptTimeZone(), ...)`. Could produce inconsistent prompt like `PUBLISHED: 2026-03-16 (Tuesday)` when March 16 is a Monday.

### 4. No "a day after X" rule in DATE CALCULATION RULES
Multi-event articles ("This development comes a day after...") had no explicit prompt guidance. Claude could misinterpret cross-references as setting the primary crime date.

## Fixes Applied (Mar 19 2026)

**rssCollector.gs:**
- pubDate extraction now tries: (1) `<pubDate>`, (2) Dublin Core `dc:date` namespace, (3) collection timestamp with prominent log warning

**processor.gs:**
- `publishDateMissing` flag: when publishedDate is falsy, logs 🚨 and forces all crimes from that article to Review Queue with ambiguity note
- Null `crime_date` check: if Claude returns no date, forces Review Queue with ambiguity "verify date against article"

**claudeClient.gs:buildUserPrompt:**
- `dayOfWeek` now uses `Utilities.formatDate(pubDate, Session.getScriptTimeZone(), 'EEEE')` — timezone-consistent with pubDateStr

**claudeClient.gs system prompt:**
- Added `"a day after [X]"` and `"two days after [X]"` rows to DATE CALCULATION RULES table
- Added "A DAY AFTER" CROSS-REFERENCE RULE with concrete Rio Claro / Cunupia example
- Added "ONGOING CRIMES WITH A SPECIFIC EVENT DATE" rule block

## Key Diagnostic Signal
If the date stored in Production = the automation run date (matches Timestamp column), `publishedDate` was falsy AND `crime_date` was null. Check RSS pubDate column in Raw Articles sheet first.
