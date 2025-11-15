# Quick Reference: Spot Checking Crime Data

**⏱️ Daily Task: 10-15 minutes**

---

## 🚀 Quick Start (First Time)

### 1. Open Your Google Sheets
- **Production Sheet** - Auto-approved crimes (confidence ≥7)
- **Review Queue** - Manual review needed (confidence 1-6)

### 2. Add Validation Script to Apps Script
1. Open your Google Sheet
2. Extensions → Apps Script
3. Click ➕ to add new file
4. Name it: `validationHelpers.gs`
5. Copy code from: `Kavell Automation Live Code/validationHelpers.gs`
6. Save (Ctrl/Cmd + S)

### 3. Run Your First Check
```javascript
// In Apps Script editor, run:
dailyHealthCheck()

// Check Execution log (Ctrl/Cmd + Enter) for results
```

---

## 📅 Daily Routine (Every Morning)

### Step 1: Run Auto-Check (2 minutes)
```javascript
// Apps Script → Run:
dailyHealthCheck()
```

**What it checks:**
- ✅ Last 20 entries for common issues
- ✅ Duplicates
- ✅ Multi-crime extraction
- ✅ Geocoding quality

### Step 2: Review Results (5 minutes)

**Check the log output:**

```
========== SPOT CHECK SUMMARY ==========
✅ Perfect: 17 (85%)
⚠️ Minor Issues: 2 (10%)
❌ Major Issues: 1 (5%)

Target: 85%+ perfect, <5% major issues
========================================
```

**What the numbers mean:**
- **85%+ Perfect** = System working well ✅
- **<70% Perfect** = Investigation needed ⚠️
- **Major Issues >5%** = Systemic problem ❌

### Step 3: Fix Issues (5-10 minutes)

**If log shows issues:**

```
Row 45 (Man shot in Arima):
  ❌ MAJOR: Date is 2024, expected 2024-2026
  ⚠️ Minor: Area too vague: "Trinidad"
```

**Fix it:**
1. Open Production sheet → Go to Row 45
2. Click source_url to read article
3. Fix crime_date (if wrong year)
4. Add note in ambiguities column: "Date corrected from 2024-11-09 to 2025-11-09"

---

## 🔧 Common Fixes

### Fix #1: Wrong Date (Year)
**Problem:** Date shows 2024 instead of 2025
**Fix:**
1. Open article → Find when crime happened
2. Update crime_date in sheet
3. Note in ambiguities: "Date corrected"

**If 5+ crimes have wrong dates:**
```javascript
// Systemic issue - read SPOT-CHECKING-GUIDE.md
// Section: "Error Type 1: Wrong Dates"
```

---

### Fix #2: Multi-Crime Article - Only 1 Crime Extracted
**Problem:** Article says "three shootings" but only 1 in Production

**Fix:**
1. Find article in **Raw Articles** sheet (search by URL)
2. Change status column: "processed" → "ready_for_processing"
3. Clear Column F (extracted_data)
4. Wait 1 hour OR run `processReadyArticles()` manually
5. Check Production - all 3 crimes should now appear

**If this happens often:**
```javascript
// Check token limit in config.gs
// Must be 4096, not 2048
```

---

### Fix #3: Duplicate Crimes
**Problem:** Same crime appears 2-3 times

**Fix:**
1. Compare headline + URL + date
2. Keep first entry
3. Delete duplicates
4. Note: "Duplicate removed"

**If duplicates keep appearing:**
```javascript
// Check processor.gs - isDuplicateCrime()
// Read SPOT-CHECKING-GUIDE.md Section: "Error Type 6"
```

---

### Fix #4: Missing Geocoding
**Problem:** lat/lng/plus_code are empty

**Fix (Individual):**
1. Google Maps → Search "[area], Trinidad and Tobago"
2. Right-click location → Copy coordinates
3. Paste into lat/lng columns
4. Click coordinates → Copy Plus Code
5. Paste into plus_code column

**Fix (Systemic):**
```javascript
// Run in Apps Script:
testGeocoding()

// If failing, check:
// - Geocoding API enabled?
// - Quota exceeded?
```

---

## 📊 What To Look For

### Red Flags 🚩

| Issue | What It Looks Like | Action |
|-------|-------------------|--------|
| **Wrong Year** | Dates in 2023, 2024 | Individual fix in sheet |
| **Missing Multi-Crimes** | "Three robberies" but only 1 entry | Reprocess article |
| **Duplicates** | Same headline 2-3 times | Delete extras |
| **All Same Date** | Every crime has same date | Check publication date handling |
| **No Coordinates** | 50%+ missing lat/lng | Check geocoding API |
| **Generic Crime Type** | "Crime" instead of "Shooting" | Update individual entries |

---

## 🎯 Accuracy Targets

### Week 1 (System Stabilizing)
- ✅ 80%+ Perfect
- ✅ <10% Major Issues

### Week 2+ (Mature System)
- ✅ 85%+ Perfect
- ✅ <5% Major Issues

### Month 1+ (Production Quality)
- ✅ 90%+ Perfect
- ✅ <3% Major Issues

---

## ⚠️ When To Investigate Deeper

### Run weekly deep dive if:
- Accuracy drops below 70%
- Same error appears 5+ times
- Major issues >10%
- Duplicates flooding sheet

### How to run:
```javascript
// Apps Script → Run:
weeklyDeepDive()

// Checks last 100 entries instead of 20
```

---

## 📞 Need Help?

### For specific error patterns:
→ Read: `SPOT-CHECKING-GUIDE.md`
(Detailed fixes for all 7 common error types)

### For systemic code issues:
→ Read: `AGENT-BRIEFING.md`
→ Read: `PROJECT-CONTEXT.md`

### For validation script questions:
→ Review: `validationHelpers.gs`
(All functions documented with examples)

---

## 🛠️ Useful Apps Script Functions

### Daily Use
```javascript
dailyHealthCheck()           // Quick 20-entry check
spotCheckProduction(10)      // Check specific number
checkForDuplicates(50)       // Duplicate scan
```

### Weekly Use
```javascript
weeklyDeepDive()             // Check 100 entries
runFullValidation(100)       // Complete analysis
checkMultiCrimeExtraction()  // Verify multi-crime working
```

### Troubleshooting
```javascript
testGeminiExtraction()       // Test AI extraction
testMultiCrimeExtraction()   // Test multi-crime
testGeocoding()              // Test geocoding API
```

---

## 📋 Weekly Checklist (Mondays)

- [ ] Run `weeklyDeepDive()`
- [ ] Review Review Queue for patterns
- [ ] Check quota usage (Apps Script dashboard)
- [ ] Document any fixes in notes
- [ ] Archive old Raw Articles if >1000 rows

**Time: 15-20 minutes**

---

## 🎓 Learning Resources

| Document | When to Read |
|----------|-------------|
| **QUICK-REFERENCE-SPOT-CHECKING.md** | Daily reference (this file) |
| **SPOT-CHECKING-GUIDE.md** | When investigating issues |
| **AGENT-BRIEFING.md** | Before modifying code |
| **PROJECT-CONTEXT.md** | Understanding full system |

---

**Version:** 1.0
**Last Updated:** November 9, 2025
**Quick Questions?** Check SPOT-CHECKING-GUIDE.md
