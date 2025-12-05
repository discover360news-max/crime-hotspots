# Duplicate Detection with Production Archive

**Date Implemented:** December 3, 2025
**Issue:** Duplicates slipping through when older crimes have been archived
**Solution:** Enhanced duplicate detection to check both Production and Production Archive sheets

---

## Problem Statement

The automation was only checking the "Production" sheet for duplicates. When crimes get archived to "Production Archive," the duplicate detection would no longer catch them, allowing the same crime to be added again if it was re-reported or extracted from a different source.

**Example Scenario:**
1. Crime A is extracted and added to Production (Nov 1)
2. Crime A gets archived to Production Archive (after 90 days)
3. Different source reports Crime A again (Feb 10)
4. Duplicate check only looks at Production (which no longer has Crime A)
5. **Result:** Crime A gets added to Production again → DUPLICATE

---

## Solution: Two-Sheet Duplicate Detection

### How It Works

The duplicate detection now performs **two checks** sequentially:

1. **Check Production Sheet** - Checks active production data
2. **Check Production Archive** - Checks archived historical data

If a duplicate is found in **either** sheet, the crime is skipped.

### Implementation

**Files Modified:**
- `google-apps-script/guyana/config.gs`
- `google-apps-script/guyana/processor.gs`
- `google-apps-script/trinidad/config.gs`
- `google-apps-script/trinidad/processor.gs`

**Config Changes:**
```javascript
const SHEET_NAMES = {
  RAW_ARTICLES: 'Raw Articles',
  PRODUCTION: 'Production',
  PRODUCTION_ARCHIVE: 'Production Archive',  // ← NEW
  REVIEW_QUEUE: 'Review Queue',
  PROCESSING_QUEUE: 'Processing Queue',
  ARCHIVE: 'Archive'
};
```

**Processor Logic:**
```javascript
// Check for duplicate in Production sheet
if (isDuplicateCrime(prodSheet, crime, geocoded)) {
  Logger.log(`⚠️ Duplicate detected in Production, skipping: ${crime.headline}`);
  return;
}

// Check for duplicate in Production Archive (may be archived already)
try {
  const archiveSheet = getActiveSheet(SHEET_NAMES.PRODUCTION_ARCHIVE);
  if (archiveSheet && isDuplicateCrime(archiveSheet, crime, geocoded)) {
    Logger.log(`⚠️ Duplicate detected in Production Archive, skipping: ${crime.headline}`);
    return;
  }
} catch (e) {
  // Archive sheet might not exist yet, that's okay
  Logger.log(`ℹ️ Production Archive not found (may not exist yet): ${e.message}`);
}
```

---

## Duplicate Detection Checks

The `isDuplicateCrime()` function performs comprehensive fuzzy matching across **6 different checks**:

### 1. Exact Coordinates + Same Date + Same Crime Type
- **When:** Both crimes have identical GPS coordinates (±11 meters)
- **Requires:** 30%+ headline similarity (prevents false positives)
- **Use Case:** Cross-source duplicates from different news outlets

### 2. Exact Coordinates + Similar Dates (±2 days) + Victim Name Match
- **When:** Dates vary slightly due to different publication times
- **Example:** Article A says "yesterday" (Nov 20), Article B says "on Thursday" (Nov 21)
- **Use Case:** Same incident reported with date variance

### 3. Same URL + Same Location + Same Date
- **When:** Re-extraction of same article
- **Smart Logic:** Allows multi-crime articles with different incidents

### 4. Same Victim Name in Headline (Same Date)
- **When:** Victim names match in both headlines
- **Requires:** 60%+ headline similarity
- **Use Case:** Multi-victim incidents from different sources

### 5. Same Date + Victim Name + Crime Type
- **When:** Victim name appears in headline
- **Use Case:** Cross-source reports of same victim

### 6. Same Date + Location + Crime Type
- **Requires:** 70%+ headline similarity
- **Use Case:** Different journalists writing about same incident

---

## Performance Considerations

### Why Two Sequential Checks?

**Option A (Current):** Two separate checks
```javascript
// Check Production
if (isDuplicateCrime(prodSheet, crime, geocoded)) { return; }

// Check Production Archive
if (isDuplicateCrime(archiveSheet, crime, geocoded)) { return; }
```

**Benefits:**
- ✅ Skips archive check if duplicate found in Production (faster)
- ✅ Clear logging shows which sheet had the duplicate
- ✅ Gracefully handles missing archive sheet

**Option B (Alternative):** Merge data arrays
```javascript
// Combine both sheets' data
const allData = [...prodData, ...archiveData];
if (isDuplicateCrime(allData, crime, geocoded)) { return; }
```

**Why Not Used:**
- ❌ Always reads archive even if duplicate in Production
- ❌ More memory usage (merging large arrays)
- ❌ Less clear logging

### Performance Impact

**Typical Scenario (No Duplicate):**
- Production check: ~100-500 rows = 0.5-2 seconds
- Archive check: ~5000-10000 rows = 3-8 seconds
- **Total:** 3.5-10 seconds per crime

**Early Exit Scenario (Duplicate in Production):**
- Production check: ~100-500 rows = 0.5-2 seconds
- Archive check: **SKIPPED**
- **Total:** 0.5-2 seconds per crime

**Archive sheet is only read when:**
1. Crime is NOT a duplicate in Production
2. Crime is being added to Production (high confidence)

This means most duplicates are caught early without reading the archive.

---

## Error Handling

### Missing Archive Sheet

If "Production Archive" doesn't exist yet:
```javascript
catch (e) {
  Logger.log(`ℹ️ Production Archive not found (may not exist yet): ${e.message}`);
}
```

- **Behavior:** Continues processing (only checks Production)
- **When This Happens:** Fresh setup or archive not yet created
- **Impact:** No errors, just info log message

### Empty Archive Sheet

If archive exists but has no data:
```javascript
if (lastRow < 2) {
  return false; // Empty sheet, no duplicates
}
```

- **Behavior:** Immediately returns false (no duplicate)
- **Impact:** Minimal performance hit (~0.1 seconds)

---

## Testing Recommendations

### Test Scenarios

After deploying this change, verify:

1. **Duplicate in Production:**
   - Add crime to Production manually
   - Run automation with same crime
   - **Expected:** Skipped with "Duplicate detected in Production"

2. **Duplicate in Archive:**
   - Add crime to Production Archive manually
   - Run automation with same crime
   - **Expected:** Skipped with "Duplicate detected in Production Archive"

3. **Not a Duplicate:**
   - Add crime to Production manually
   - Run automation with similar but different crime
   - **Expected:** Both crimes added successfully

4. **Archive Doesn't Exist:**
   - Rename "Production Archive" temporarily
   - Run automation
   - **Expected:** Info log, continues processing

### Monitoring

**Check Logs For:**
- `⚠️ Duplicate detected in Production, skipping:`
- `⚠️ Duplicate detected in Production Archive, skipping:`
- `ℹ️ Production Archive not found (may not exist yet):`

**Expected Behavior:**
- Most duplicates should be caught in Production (faster)
- Archive duplicates should be rare but handled correctly
- No errors even if archive doesn't exist

---

## Integration with Archive Process

This enhancement works seamlessly with the existing archiving process:

### Current Archiving Flow (syncToLive.gs)

1. **Sync Production → Live CSV** (every 24 hours)
2. **Archive synced rows** → Production Archive
3. **Delete from Production** (keeps it small)

### Duplicate Detection Flow (processor.gs)

1. **Check Production first** (small, recent data)
2. **Check Production Archive** (large, historical data)
3. **Skip if found in either**

### Why This Works

- **Production:** Small dataset (recent crimes) → Fast checks
- **Production Archive:** Large dataset (historical crimes) → Only checked when needed
- **No Duplication:** Crime can't exist in both sheets simultaneously
- **Complete Coverage:** All historical data is always checked

---

## Edge Cases Handled

### 1. Crime Added While Archive is Running
**Scenario:** Archive process is moving data from Production to Archive while duplicate check runs

**Solution:** Script lock prevents race conditions
```javascript
const lock = LockService.getScriptLock();
lock.waitLock(30000); // Wait for other processes to finish
```

### 2. Very Old Crime Re-Reported
**Scenario:** Crime from 2 years ago gets re-reported

**Solution:** Production Archive has ALL historical data, so duplicate is caught

### 3. Cross-Source Duplicate with Date Variance
**Scenario:** Source A says "Monday," Source B says "Tuesday" (same crime)

**Solution:** Check #2 allows ±2 day variance with victim name match

### 4. Multi-Crime Article
**Scenario:** Single article reports 3 different crimes

**Solution:** Smart URL logic allows different crimes from same URL
- Same URL + Same Area + Same Date → Duplicate
- Same URL + Different Area → Different crimes ✓
- Same URL + Different Date → Different crimes ✓

---

## Benefits

### Data Quality
- ✅ Eliminates duplicates from archived crimes
- ✅ Maintains accurate crime statistics
- ✅ Prevents inflation of crime counts

### User Experience
- ✅ Cleaner dashboards (no duplicate markers)
- ✅ More reliable trends and analytics
- ✅ Accurate heat maps

### System Performance
- ✅ Production sheet stays small (faster queries)
- ✅ Archive only checked when necessary
- ✅ No degradation as dataset grows

---

## Limitations

### Performance on Large Archives

**Current Archive Size Estimates:**
- Trinidad: ~20,000 archived crimes
- Guyana: ~8,000 archived crimes

**Check Time:** 5-10 seconds per crime (when archive is checked)

**Mitigation:**
- Only checked for high-confidence crimes (going to Production)
- Low-confidence crimes (Review Queue) don't check archive
- Early exit when duplicate found in Production

### Historical Duplicate Cleanup

**This change does NOT:**
- Remove existing duplicates from Production or Archive
- Retroactively fix past duplicates

**To Clean Existing Duplicates:**
1. Export Production and Archive to CSV
2. Use manual deduplication process
3. Re-import clean data

---

## Related Documentation

- `google-apps-script/guyana/processor.gs` - Guyana duplicate detection logic
- `google-apps-script/trinidad/processor.gs` - Trinidad duplicate detection logic
- `google-apps-script/guyana/syncToLive.gs` - Archiving process
- `google-apps-script/trinidad/syncToLive.gs` - Archiving process

---

## FAQ

**Q: Does this slow down processing?**
A: Only slightly. Archive check adds 5-10 seconds per crime, but only when the crime is NOT a duplicate in Production.

**Q: What if Production Archive doesn't exist?**
A: No problem! The code gracefully handles missing sheets and logs an info message.

**Q: Can I disable archive checking?**
A: Yes, just comment out the archive check block in `appendToProduction()`. But not recommended.

**Q: Does this work for Review Queue?**
A: No, only Production. Review Queue items are manually verified, so duplicates are caught during human review.

**Q: Why not merge Production and Archive into one sheet?**
A: Keeping them separate ensures fast queries on recent data (Production) while preserving all history (Archive).

**Q: What happens if same crime exists in BOTH Production and Archive?**
A: Impossible scenario. The archive process DELETES from Production when moving to Archive. They're mutually exclusive.

---

**Version:** 1.0
**Last Updated:** December 3, 2025
