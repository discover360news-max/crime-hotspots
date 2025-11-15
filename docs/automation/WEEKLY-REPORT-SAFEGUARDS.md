# Weekly Report Generator - Safeguards Explained

## Overview

The improved weekly report generator includes 4 critical safeguards to prevent publishing incomplete, duplicate, or stale reports.

---

## 🛡️ Safeguard 1: Minimum Data Threshold

**Problem:** What if only 2-3 crimes were collected this week?

**Solution:**
```javascript
minWeeklyCrimes: 10  // Won't publish if fewer than 10 crimes
```

**How it works:**
- Counts crimes in the last 7 days
- If count < 10, report is **SKIPPED**
- You receive email notification explaining why

**Example:**
```
❌ SKIPPED: Insufficient data
Only 7 crimes this week (minimum: 10)
Action: Check RSS feeds and Gemini processing
```

---

## 🛡️ Safeguard 2: Data Freshness Check

**Problem:** What if all the crimes are old and Gemini hasn't processed new articles?

**Solution:**
```javascript
minDataFreshness: 3  // Must have at least 3 crimes from last 48 hours
```

**How it works:**
- Checks when crimes were added to Production sheet (Timestamp column)
- If fewer than 3 crimes processed in last 48 hours, report is **SKIPPED**
- Ensures pipeline is actively processing, not stalled

**Example:**
```
❌ SKIPPED: Data appears stale
Only 1 crime processed in last 48 hours (minimum: 3)
Action: Check Gemini trigger is running
```

---

## 🛡️ Safeguard 3: Processing Backlog Check

**Problem:** What if there are 200 articles waiting to be processed by Gemini?

**Solution:**
```javascript
maxPendingArticles: 50  // Warn if > 50 articles still pending
```

**How it works:**
- Counts rows in Raw Articles sheet with status "pending" or "ready"
- If count > 50, report is **SKIPPED**
- Prevents publishing incomplete data while backlog is being processed

**Example:**
```
❌ SKIPPED: Processing backlog detected
127 articles still pending (threshold: 50)
Action: Let automation catch up before publishing report
```

**Why this matters:**
- If you just backfilled 170 Guyana URLs on Sunday
- Monday morning, 100+ might still be "pending" or "ready"
- Report should wait until they're processed

---

## 🛡️ Safeguard 4: Duplicate Detection

**Problem:** What if the data is exactly the same as last week's report?

**Solution:**
```javascript
duplicateThreshold: 0.9  // If 90% identical to last week, skip
```

**How it works:**
1. Generates "fingerprint" of this week's data (hash of dates + crime types + areas)
2. Compares to last week's stored fingerprint
3. If similarity ≥ 90%, report is **SKIPPED**
4. Stores current fingerprint in Script Properties for next week

**Example:**
```
❌ SKIPPED: Data appears unchanged
95% identical to last week's report
Action: Verify new crimes are being collected
```

**Technical details:**
- Fingerprint stored as: `LAST_FINGERPRINT_TRINIDAD`
- Uses MD5 hash of sorted crime data
- Resets if script properties are cleared (will publish once as "first run")

---

## 📧 Email Notifications

When a report is skipped, you receive an email like this:

```
Subject: ⚠️ Weekly Report Skipped: Trinidad & Tobago

The weekly crime report for Trinidad & Tobago was skipped due to validation failure.

Reason: Data appears stale: Only 1 crime processed in last 48 hours (minimum: 3)

Details:
{
  "recentCount": 1,
  "threshold": 3
}

Action Required:
- Check your Google Sheets automation
- Verify Gemini processing is running
- Ensure RSS feeds are collecting articles

Next attempt: Next Monday at 10 AM
```

---

## ⏰ Timing Change: 8 AM → 10 AM

**Why changed from Monday 8 AM to Monday 10 AM?**

1. **Weekend processing buffer:**
   - Most articles collected Saturday/Sunday
   - Gemini processing runs Sunday evening
   - 10 AM gives 2 extra hours for processing to complete

2. **Manual intervention window:**
   - If you notice issues Sunday evening
   - You have Monday morning (8-10 AM) to fix before report runs

3. **Reduced false alarms:**
   - Fewer "stale data" warnings
   - More time for backlog to clear

---

## 🔧 Manual Override

If validation is failing incorrectly (you know the data is good), you can force a report:

```javascript
forceGenerateReport('trinidad')  // Bypasses all safeguards
```

**Use cases:**
- Validation logic has a bug
- You manually verified data is correct
- Emergency report needed

**Warning:** This skips ALL safeguards. Use with caution.

---

## 🧪 Testing Functions

### Test validation checks (doesn't publish):
```javascript
testValidation()
```

**Output:**
```
--- Trinidad & Tobago ---
Passed: false
Reason: Data appears stale: Only 1 crime processed in last 48 hours
Details: {
  "recentCount": 1,
  "threshold": 3
}
```

### Test report generation (doesn't publish):
```javascript
testReportGeneration()
```

**Output:**
```
Generated markdown:
---
title: "Trinidad & Tobago Weekly Crime Report - November 15, 2025"
...
```

---

## 📊 Configuration Reference

All thresholds are configurable in `CONFIG` object:

```javascript
const CONFIG = {
  minWeeklyCrimes: 10,        // Minimum crimes to publish report
  minDataFreshness: 3,         // Minimum crimes from last 48 hours
  maxPendingArticles: 50,      // Maximum backlog before skipping
  duplicateThreshold: 0.9      // Similarity % to consider duplicate
};
```

**Recommended settings:**

| Setting | Conservative | Balanced | Aggressive |
|---------|-------------|----------|------------|
| minWeeklyCrimes | 15 | 10 | 5 |
| minDataFreshness | 5 | 3 | 1 |
| maxPendingArticles | 30 | 50 | 100 |
| duplicateThreshold | 0.95 | 0.9 | 0.8 |

**Conservative:** Fewer false reports, may skip valid weeks
**Balanced:** Good default (current setting)
**Aggressive:** Publishes more often, higher risk of stale data

---

## 🚨 Common Scenarios

### Scenario 1: Backfill in progress
**Situation:** You just backfilled 170 Guyana URLs on Sunday night
**Monday 10 AM status:**
- Raw Articles: 50 pending, 80 ready, 40 completed
- Production: Only 40 crimes from this week

**Result:** ❌ SKIPPED (backlog > 50 pending)
**What happens:** Email notification, report deferred to next week
**Action:** None - let automation catch up

---

### Scenario 2: Slow news week
**Situation:** Legitimately only 8 crimes this week
**Monday 10 AM status:**
- Production: 8 crimes (all processed correctly)
- No backlog, data is fresh

**Result:** ❌ SKIPPED (below minimum threshold)
**What happens:** Email notification
**Action:** Either:
1. Accept that some weeks are skipped (recommended)
2. Lower `minWeeklyCrimes` to 5
3. Force publish manually if you want to cover slow weeks

---

### Scenario 3: Gemini quota exceeded
**Situation:** Hit Gemini API quota, processing stopped Friday
**Monday 10 AM status:**
- Raw Articles: 150 pending articles
- Production: Only 12 crimes (all from Mon-Thu last week)

**Result:** ❌ SKIPPED (stale data + backlog)
**What happens:** Email notification
**Action:**
1. Check Gemini quota in Google Cloud Console
2. Wait for quota to reset
3. Report will auto-publish next week

---

### Scenario 4: Normal week (all systems working)
**Situation:** Automation running smoothly
**Monday 10 AM status:**
- Production: 47 crimes this week
- Raw Articles: 12 pending (normal)
- 8 crimes processed yesterday (fresh)
- Data different from last week

**Result:** ✅ PUBLISHED
**What happens:** Report auto-commits to GitHub, deploys to site
**Action:** None - check blog to verify

---

## 📝 Migration from Old Script

If you're currently using `weeklyReportGenerator.gs`:

1. **Backup old script** (copy contents to safe location)
2. **Replace with improved version**
3. **Update Script Properties** (if needed - same keys)
4. **Run test:** `testValidation()`
5. **Verify email** is configured (sends to your Google account)
6. **Update trigger:** Run `setupWeeklyTrigger()` (changes to 10 AM)

**No data loss:** Old fingerprints won't exist, so first run after migration will always publish (treated as "first_run").

---

## 🎯 Summary

**You asked:** "What if there's no new data or data isn't ready?"

**Answer:** The improved script has 4 layers of protection:

1. ✅ **Quantity check** - Ensures enough crimes (min 10)
2. ✅ **Freshness check** - Ensures recent processing (last 48h)
3. ✅ **Backlog check** - Ensures pipeline isn't overwhelmed
4. ✅ **Duplicate check** - Ensures data has changed from last week

If ANY check fails → Report skipped + Email sent

**Net result:** You'll never publish:
- A report with only 3 crimes
- A report with week-old data while backlog is processing
- A duplicate report that's identical to last week

**Trade-off:** You might skip legitimate slow news weeks. Adjust `minWeeklyCrimes` lower if this bothers you.
