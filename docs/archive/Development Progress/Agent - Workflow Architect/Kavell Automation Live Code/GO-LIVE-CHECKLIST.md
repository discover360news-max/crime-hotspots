# 🚀 GO LIVE CHECKLIST - Crime Hotspots Automation v1.0

**Date Created:** November 8, 2025
**Status:** Production Ready
**Target Go-Live:** Immediate (post-checklist completion)

---

## ✅ PRE-DEPLOYMENT CHECKLIST

### 1. Security & Configuration ⚠️ CRITICAL

- [ ] **API Key Security**
  - [ ] API key stored in Script Properties (NOT hardcoded)
  - [ ] Verified by running `verifyApiKey()` - should show ✅
  - [ ] Original hardcoded key removed from config.gs line 23
  - [ ] API key restrictions enabled in Google Cloud Console

- [ ] **Google Cloud APIs Enabled**
  - [ ] Gemini API (Generative Language API) enabled
  - [ ] Geocoding API enabled
  - [ ] API key restricted to these 2 APIs only
  - [ ] Project name: "Crime Hotspots Automation"

- [ ] **Configuration Values**
  - [ ] `maxOutputTokens: 4096` in config.gs (NOT 2048)
  - [ ] `BATCH_SIZE: 10` in articleFetcher.gs
  - [ ] `NOTIFICATION_EMAIL` set to your email
  - [ ] `CONFIDENCE_THRESHOLD: 7` in config.gs

---

### 2. Google Sheets Setup

- [ ] **Raw Articles Sheet**
  - [ ] Sheet exists with exact name "Raw Articles"
  - [ ] Headers: Timestamp | Source | Title | URL | Full Text | Published Date | Status | Notes
  - [ ] Row 1 frozen
  - [ ] Test data cleared (run `cleanUpTestData()`)

- [ ] **Production Sheet**
  - [ ] Sheet exists with exact name "Production"
  - [ ] Headers: Date | Headline | Crime Type | Street Address | Plus Code | Area | Island | URL | Latitude | Longitude
  - [ ] Row 1 frozen
  - [ ] Test data cleared

- [ ] **Review Queue Sheet**
  - [ ] Sheet exists with exact name "Review Queue"
  - [ ] Headers: Date | Headline | Crime Type | Street | Plus Code | Area | Island | URL | Lat | Lng | Confidence | Ambiguities | Status | Notes
  - [ ] Row 1 frozen
  - [ ] Test data cleared

---

### 3. Code Deployment

- [ ] **All 6 Scripts Deployed**
  - [ ] config.gs - Configuration & API management
  - [ ] rssCollector.gs - RSS feed collection
  - [ ] articleFetcher.gs - Article text fetching
  - [ ] geminiClient.gs - AI extraction with Gemini
  - [ ] processor.gs - Main orchestrator
  - [ ] geocoder.gs - Geocoding service

- [ ] **Critical Functions Updated**
  - [ ] `extractCrimeData()` accepts publishedDate parameter
  - [ ] `buildExtractionPrompt()` uses simplified prompt
  - [ ] `processReadyArticles()` loops through crimes array
  - [ ] `isDuplicateCrime()` uses URL + headline matching
  - [ ] `isResponseTruncated()` function added

---

### 4. Testing Verification ✅

- [ ] **Individual Component Tests**
  - [ ] `testRSSCollection()` → Collected 15-30 articles
  - [ ] `fetchPendingArticleText()` → Column E populated
  - [ ] `testGeminiExtraction()` → Single crime extracted
  - [ ] `testMultiCrimeExtraction()` → 3 crimes extracted
  - [ ] `testGeocoding()` → Plus Codes generated

- [ ] **End-to-End Pipeline Test**
  - [ ] `processReadyArticles()` → Articles routed correctly
  - [ ] Production sheet has entries
  - [ ] Dates match article content (NOT just publication date)
  - [ ] URLs all correct
  - [ ] All 3 crimes from multi-crime article added

- [ ] **Multi-Crime Validation**
  - [ ] Article with 3 crimes → 3 rows in Production ✅
  - [ ] Each crime has unique headline
  - [ ] Each crime has correct date
  - [ ] All share same source URL
  - [ ] No duplicate detection false positives

---

### 5. Trigger Configuration 🎯

- [ ] **Delete Test Triggers**
  - [ ] All old/test triggers removed
  - [ ] No duplicate triggers

- [ ] **Production Triggers Set**
  
  **Trigger 1: RSS Collection**
  - [ ] Function: `collectAllFeeds`
  - [ ] Event: Time-driven → Hour timer
  - [ ] Interval: Every 2 hours
  - [ ] Status: Active

  **Trigger 2: Article Fetching**
  - [ ] Function: `fetchPendingArticleText`
  - [ ] Event: Time-driven → Hour timer
  - [ ] Interval: Every 1 hour
  - [ ] Status: Active

  **Trigger 3: AI Processing**
  - [ ] Function: `processReadyArticles`
  - [ ] Event: Time-driven → Hour timer
  - [ ] Interval: Every 1 hour
  - [ ] Status: Active

---

### 6. Quota Verification

- [ ] **Baseline Established**
  - [ ] Apps Script runtime: Expected ~34 min/day (38% of 90 min limit)
  - [ ] Gemini API calls: Expected ~100/day (6.7% of 1,500 limit)
  - [ ] Geocoding API: Expected ~20/day (1.5% of quota)

- [ ] **Monitoring Set Up**
  - [ ] Know how to check Apps Script executions log
  - [ ] Know how to check Google Cloud Console API usage
  - [ ] Understand quota limits and warnings

---

## 🎯 GO-LIVE PROCEDURE

### Step 1: Final Pre-Flight (5 minutes)

```javascript
// Run these functions in order:
1. verifyApiKey()           // Should show ✅ API key is set
2. logConfigStatus()        // Review all config values
3. cleanUpTestData()        // Clear all test data from sheets
```

**Expected Output:**
```
✅ API key is set (length: 39 characters)
=== CONFIGURATION STATUS ===
Gemini API Endpoint: ...gemini-flash-latest...
API Key Set: YES
Active News Sources: 3
Confidence Threshold: 7
===========================
✅ All test data cleared - ready for production!
```

---

### Step 2: Set Production Triggers (5 minutes)

1. Apps Script → Triggers (clock icon)
2. Delete ALL existing triggers
3. Add 3 new triggers (see Trigger Configuration above)
4. Verify all show "Active" status

---

### Step 3: Initial Collection Test (10 minutes)

**Manually trigger first collection:**
```javascript
// Run in this order:
1. collectAllFeeds()        // Wait for completion
2. fetchPendingArticleText() // Wait for completion
3. processReadyArticles()    // Wait for completion
```

**Verify Results:**
- [ ] Raw Articles has 15-30 entries
- [ ] Column E (Full Text) populated
- [ ] Production has 3-8 crime entries
- [ ] Review Queue has 1-3 entries
- [ ] No "failed" statuses

---

### Step 4: First 24-Hour Monitoring

**Hour 2:**
- [ ] Check Raw Articles count (~30-50 articles)
- [ ] Verify RSS sources collected

**Hour 4:**
- [ ] Check Production sheet (~5-10 crimes)
- [ ] Spot-check 3 entries for accuracy
- [ ] Check Review Queue

**Hour 8:**
- [ ] Verify triggers ran successfully (Apps Script → Executions)
- [ ] Check for any errors in execution log

**Hour 24:**
- [ ] Review stats:
  - Raw Articles: ~100-150
  - Production crimes: ~15-25
  - Review Queue: ~3-6
- [ ] Manual accuracy check (10 random entries)
- [ ] Verify quota usage is within limits

---

## 📊 SUCCESS CRITERIA (First Week)

### Quantitative Metrics

**Collection:**
- ✅ 600-800 articles collected
- ✅ 500-700 articles processed
- ✅ 80-140 crimes in Production
- ✅ <5% duplicate rate

**Quality:**
- ✅ 85-95% accuracy (manual spot-check of 50 entries)
- ✅ Dates match article content
- ✅ URLs all correct
- ✅ Multi-crime articles handled properly

**Performance:**
- ✅ Apps Script runtime: 30-40 min/day
- ✅ Gemini API: 100-150 calls/day
- ✅ Geocoding: 20-30 calls/day
- ✅ All within free tier limits

### Qualitative Metrics

- ✅ Review Queue manageable (<50 items)
- ✅ Manual review time: 1-2 hours/week
- ✅ No critical errors in execution logs
- ✅ RSS feeds stable and working

---

## 🛠️ DAILY MAINTENANCE (5 minutes)

### Morning Check (2 minutes)
- [ ] Open Review Queue sheet
- [ ] Review items flagged for manual verification
- [ ] Approve/edit/delete as needed

### Evening Check (3 minutes)
- [ ] Apps Script → Executions → Check for failures
- [ ] Quick scan of Production sheet (last 10 entries)
- [ ] Verify all 3 triggers ran successfully

**Red Flags to Watch:**
- ⚠️ "API key not configured" errors
- ⚠️ Multiple "failed" statuses
- ⚠️ No new articles for >6 hours
- ⚠️ Quota approaching 80%

---

## 📅 WEEKLY MAINTENANCE (15 minutes)

### Sunday Review
- [ ] Export Production sheet to CSV (backup)
- [ ] Review 20 random entries for accuracy
- [ ] Check RSS feed health (all 3 sources working?)
- [ ] Review quota usage trends

### Quality Audit
- [ ] Calculate accuracy rate (correct/total)
- [ ] Identify common extraction errors
- [ ] Adjust confidence threshold if needed
- [ ] Update crime type classifications if needed

### Performance Check
- [ ] Apps Script runtime trend (increasing/stable?)
- [ ] Gemini API usage trend
- [ ] Raw Articles sheet size (<5,000 rows?)

---

## 🔄 MONTHLY TASKS (30 minutes)

### Data Health
- [ ] Archive old articles if >10,000 rows
- [ ] Review duplicate detection effectiveness
- [ ] Spot-check geocoding accuracy (20 addresses)

### Configuration Review
- [ ] Update RSS feed list (add/remove sources)
- [ ] Review confidence threshold (adjust if needed)
- [ ] Check for new T&T news sources

### Reporting
- [ ] Monthly stats:
  - Total articles collected
  - Total crimes processed
  - Accuracy percentage
  - Time saved vs manual entry
- [ ] Identify trends (crime types, areas, etc.)

---

## 🚨 TROUBLESHOOTING QUICK REFERENCE

### Issue: No Articles Collected

**Symptoms:** Raw Articles sheet empty after 2+ hours

**Diagnosis:**
```javascript
testRSSCollection()
```

**Fixes:**
1. Check RSS feed URLs still valid (open in browser)
2. Verify internet connectivity
3. Check execution log for errors
4. Test each feed individually

---

### Issue: API Key Errors

**Symptoms:** "Gemini API key not configured"

**Diagnosis:**
```javascript
verifyApiKey()
```

**Fixes:**
1. Run `setGeminiApiKey()` again
2. Verify API key has no extra spaces
3. Check Gemini API enabled in Cloud Console
4. Regenerate API key if compromised

---

### Issue: Poor Extraction Quality

**Symptoms:** Wrong dates, incorrect crime types, missing data

**Diagnosis:** Review first 20 extractions manually

**Fixes:**
1. Check if prompt needs adjustment
2. Lower confidence threshold temporarily
3. Review ambiguities in Review Queue
4. Increase maxOutputTokens if truncation detected

---

### Issue: Quota Exceeded

**Symptoms:** "Quota exceeded" errors in logs

**Diagnosis:** Check Google Cloud Console → APIs → Quotas

**Fixes:**
1. Reduce trigger frequency temporarily
2. Implement keyword pre-filtering
3. Increase batch size delays
4. Consider upgrading to paid tier (if needed)

---

### Issue: Geocoding Failures

**Symptoms:** Lat/Lng columns empty, "REQUEST_DENIED"

**Diagnosis:**
```javascript
testGeocoding()
```

**Fixes:**
1. Enable Geocoding API in Cloud Console
2. Verify API key restrictions include Geocoding
3. Check address format includes "Trinidad and Tobago"
4. Test with simple address

---

### Issue: Triggers Not Running

**Symptoms:** No activity for several hours

**Diagnosis:** Apps Script → Triggers → Check status

**Fixes:**
1. Verify triggers are "Active" (not "Disabled")
2. Check for trigger errors in execution log
3. Re-create triggers if corrupted
4. Grant permissions again if requested

---

## 📞 SUPPORT RESOURCES

### Documentation
- **README.md** - Quick start and overview
- **CHANGELOG.md** - Version history
- **IMPLEMENTATION-STATUS.md** - Detailed project status
- **This file** - Deployment checklist

### Google Resources
- Apps Script Docs: https://developers.google.com/apps-script
- Gemini API Docs: https://ai.google.dev/docs
- Geocoding API: https://developers.google.com/maps/documentation/geocoding

### Monitoring Tools
- Apps Script Executions: Track trigger runs and errors
- Google Cloud Console: Monitor API usage and quotas
- Google Sheets: Manual review of data quality

---

## ✅ FINAL GO-LIVE APPROVAL

**Date:** _______________

**Completed By:** _______________

**Pre-Deployment Checklist:** 
- [ ] All security items complete
- [ ] All sheets configured
- [ ] All code deployed
- [ ] All tests passed
- [ ] Triggers configured
- [ ] Quota verified

**Initial Test Results:**
- Articles Collected: _______
- Crimes Extracted: _______
- Quality Check: _______%
- No Critical Errors: ☐

**Approval to Go Live:** ☐ YES  ☐ NO

**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________

---

## 🎉 POST-DEPLOYMENT

**Congratulations! Your automated crime data collection system is live.**

**Next 7 Days:**
- Monitor daily (5 min/day)
- Review quality weekly
- Adjust as needed

**Expected Benefits:**
- ✅ 75-85% reduction in manual data entry
- ✅ 15+ hours/week saved
- ✅ Consistent, automated crime data collection
- ✅ Multi-crime detection (no missed incidents)
- ✅ $0/month operating cost

**Future Enhancements:**
- Add more Caribbean countries (Guyana, Barbados, Jamaica)
- Implement email notifications
- Add daily summary reports
- Expand to 10+ countries

---

**Version:** 1.0.0  
**Last Updated:** November 8, 2025  
**Status:** Production Ready ✅
