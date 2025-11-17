# Guyana Data Extraction Improvements (2026 Ready)

**Date:** November 16, 2025
**Purpose:** Apply Trinidad improvements to Guyana automation for 2026 readiness
**Status:** ✅ Implemented, Ready for Deployment

---

## 🎯 Improvements Applied

All improvements from Trinidad have been applied to Guyana automation:

### 1. ✅ Eliminated "Other" Crime Types
- Only legitimate crime types allowed: Murder, Shooting, Robbery, Assault, Theft, Home Invasion, Sexual Assault, Kidnapping
- Non-crime articles now rejected completely

### 2. ✅ Smart Multi-Crime Handling
| Scenario | Result |
|----------|--------|
| Home Invasion + Robbery | 1 crime: Home Invasion |
| Home Invasion + Murder | 2 crimes: Both |
| Shooting + Murder | 1 crime: Murder |
| Robbery + Assault | 1 crime: Robbery |

### 3. ✅ Advanced 4-Layer Duplicate Detection
- Exact URL + headline match
- Same URL + 90%+ similar headline
- **Cross-source:** Same date + victim name + crime type
- **Cross-source:** Same date + location + crime type + 80%+ similar headline

### 4. ✅ Geographic Filtering (Guyana Only)
- AI identifies `location_country` for each crime
- Only crimes in Guyana are extracted
- **Example:** "Guyanese fishermen kidnapped in Venezuela" → **Skipped**

### 5. ✅ Accurate Crime Date Extraction
- AI extracts actual crime date from article text
- Published date only used as fallback
- Handles relative dates: "yesterday", "Monday night", etc.

---

## 📁 Files Deployed

All files copied from improved Trinidad automation with Guyana-specific modifications:

1. **`geminiClient.gs`** - Guyana-specific AI prompt
2. **`processor.gs`** - Guyana-specific filtering (location_country: Guyana)
3. **`articleFetcherImproved.gs`** - Article text fetching
4. **`geocoder.gs`** - Geocoding for Guyana locations
5. **`validationHelpers.gs`** - Helper functions
6. **`GUYANA-ONLY-config.gs`** - Already exists (Guyana RSS feeds)
7. **`GUYANA-ONLY-rssCollector.gs`** - Already exists (Guyana sources)

---

## 🔄 Deployment to Google Apps Script

### Option 1: Manual Deployment (Recommended for First Time)

1. **Open Guyana Google Sheet**
   - Sheet name: "Crime Hotspots - Guyana Data"

2. **Go to Apps Script**
   - Extensions → Apps Script

3. **Replace/Add These Files:**

   **geminiClient.gs** (REPLACE or CREATE)
   ```
   Copy entire contents from:
   google-apps-script/guyana/geminiClient.gs
   ```

   **processor.gs** (REPLACE or CREATE)
   ```
   Copy entire contents from:
   google-apps-script/guyana/processor.gs
   ```

   **articleFetcherImproved.gs** (REPLACE if exists, otherwise CREATE)
   ```
   Copy entire contents from:
   google-apps-script/guyana/articleFetcherImproved.gs
   ```

   **geocoder.gs** (REPLACE if exists, otherwise CREATE)
   ```
   Copy entire contents from:
   google-apps-script/guyana/geocoder.gs
   ```

   **validationHelpers.gs** (REPLACE if exists, otherwise CREATE)
   ```
   Copy entire contents from:
   google-apps-script/guyana/validationHelpers.gs
   ```

4. **Keep Existing Files:**
   - ✅ GUYANA-ONLY-config.gs (already configured)
   - ✅ GUYANA-ONLY-rssCollector.gs (already configured)
   - ✅ BACKFILL-SCRIPT.gs (keep for reference)

5. **Save & Test**
   ```javascript
   // Run this in Apps Script
   testGeminiWithSheetData()
   ```

---

### Option 2: Automated via clasp (Advanced)

If you have Google's clasp CLI tool installed:

```bash
cd "/Users/kavellforde/Documents/Side Projects/Crime Hotspots/google-apps-script/guyana"
clasp push
```

---

## 🧪 Testing Checklist

Before letting it run automatically, verify:

### Test 1: No "Other" Crimes
- [ ] Process 5-10 articles
- [ ] Check Production sheet
- [ ] Confirm NO "Other" crime types appear

### Test 2: Geographic Filtering
- [ ] Find article about crime in Venezuela/Trinidad
- [ ] Verify it's skipped with log: "Crime occurred in [country], not Guyana"

### Test 3: Date Extraction
- [ ] Check crimes with "yesterday" in article
- [ ] Verify crime_date is previous day, NOT published date

### Test 4: Duplicate Detection
- [ ] Same incident from 2 sources (e.g., Kaieteur News + Demerara Waves)
- [ ] Second instance flagged as duplicate

### Test 5: Multi-Crime Handling
- [ ] Find article with home invasion resulting in murder
- [ ] Verify 2 separate crimes extracted

---

## 📊 Expected Results

### Before Improvements
- ⚠️ "Other" crimes appearing
- ⚠️ Duplicates from multiple sources
- ⚠️ Crimes from Venezuela included
- ⚠️ Wrong dates (published date instead of crime date)

### After Improvements (Expected)
- ✅ Only valid crime types
- ✅ Minimal duplicates (cross-source detection)
- ✅ Only Guyana crimes
- ✅ Accurate crime dates

---

## 🚀 Running Automatically

Once testing is complete:

1. **Let triggers run automatically**
   - RSS Collection: Every 2 hours
   - Article Fetching: Every hour
   - Processing: Every hour

2. **Monitor for first 2-3 days**
   - Check Production sheet daily
   - Review any items in Review Queue
   - Watch for patterns in skipped articles

3. **Adjust if needed**
   - Similarity thresholds in duplicate detection
   - Confidence threshold (currently 7)
   - Geographic filtering logic

---

## 🔧 Guyana-Specific Notes

### News Sources (from GUYANA-ONLY-config.gs)
1. Demerara Waves
2. INews Guyana
3. Kaieteur News
4. News Room Guyana
5. Guyana Times

### Common Guyana Locations
- Georgetown (capital)
- New Amsterdam
- Linden
- Anna Regina
- Bartica

### Neighboring Countries to Filter Out
- Venezuela (common in Guyana news)
- Suriname
- Brazil
- Trinidad

---

## 📝 Maintenance

### Weekly Review
- Check Production sheet for quality
- Review flagged items in Review Queue
- Monitor duplicate detection effectiveness

### Monthly Optimization
- Adjust confidence threshold if needed
- Update crime type list if patterns emerge
- Fine-tune duplicate detection thresholds

### Quarterly Cleanup
- Archive old processed articles
- Review and update geocoding data
- Optimize RSS feed sources

---

## 🐛 Troubleshooting

### Issue: AI still returning "Other" crimes
**Solution:** Check that geminiClient.gs was updated with new prompt. Processor should catch and filter these.

### Issue: Venezuela crimes appearing
**Solution:** Review `location_country` field in logs. AI should mark as "Venezuela" and processor should skip.

### Issue: Too many duplicates
**Solution:** Lower similarity thresholds in processor.gs `isDuplicateCrime()` function (currently 0.9 and 0.8).

### Issue: Valid Guyana crimes being filtered
**Solution:** Check logs for skip reason. May need to adjust geographic filtering logic.

---

## 📞 Support

For issues specific to Guyana automation:
1. Check logs in Apps Script (View → Execution log)
2. Review Production sheet and Review Queue
3. Compare with Trinidad automation (known working)
4. Test with `testGeminiWithSheetData()` function

---

**Last Updated:** November 16, 2025
**Version:** 2.0 (Matching Trinidad)
**Status:** ✅ Ready for Deployment & Automated Monitoring
**Next Review:** After 3 days of automated operation
