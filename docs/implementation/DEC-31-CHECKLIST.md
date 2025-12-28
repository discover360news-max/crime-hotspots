# December 31, 2025 - Implementation Checklist

**Goal:** Get 2026 crime type system ready for January 1, 2026

**Time Required:** ~30 minutes

**Status:**
- ✅ Frontend COMPLETE (December 28, 2025) - Column mapping + counting logic deployed
- ✅ Google Form COMPLETE - Dual dropdowns configured
- ✅ Sheet columns ADDED - primaryCrimeType & relatedCrimeTypes ready
- 🔄 Backend testing PENDING - Steps 2-5 below

---

## ✅ Pre-Flight Check

- [ ] You've finished updating 2025 data (keep current duplicate process for 2025)
- [ ] You've read `docs/implementation/2026-PRIMARY-RELATED-CRIME-TYPES.md`
- [ ] You have backup of your Google Sheets (just in case)

---

## 📋 Step-by-Step Checklist

### **Step 1: Google Sheet Setup** ✅ COMPLETE

1. ✅ Opened **2026 Trinidad Production Sheet** in Google Sheets
2. ✅ Inserted **2 new columns**:
   - Column name: `primaryCrimeType`
   - Column name: `relatedCrimeTypes`
3. ✅ Old `crimeType` column still exists (for backward compatibility)

**Current column order:**
```
Headline | Summary | primaryCrimeType | relatedCrimeTypes | crimeType | Date | Street Address | Latitude | Longitude | Location | Area | Region | Island | URL | Source
```

**✅ Google Form also updated** with Primary Crime Type + Related Crime Types dropdowns

---

### **Step 2: Apps Script - Upload New File** (2 minutes)

1. Open Google Apps Script editor
2. Click **+ (Add File)** → **Script**
3. Name it: `crimeTypeProcessor`
4. Copy contents from: `/google-apps-script/trinidad/crimeTypeProcessor.gs`
5. Paste and **Save**

---

### **Step 3: Apps Script - Update geminiClient.gs** (5 minutes)

**Find line ~181** (the JSON structure in the prompt):

**OLD:**
```javascript
"crime_type": "Murder|Shooting|...",
```

**NEW:**
```javascript
"all_crime_types": ["Murder", "Shooting"], // ← ALL types involved
```

**Add new rule after line ~313:**
```javascript
  9. MULTI-CRIME TYPES: Extract ALL crime types in single incident
     - Use "all_crime_types" array: ["Murder", "Shooting"]
     - Order: most severe first
     - ONE incident, multiple types (not duplicates!)
```

**Save**

---

### **Step 4: Apps Script - Update processor.gs** (10 minutes)

#### **Change 1: appendToProduction (line ~274)**

**Find:**
```javascript
prodSheet.appendRow([
  validatedDate,
  crime.headline || 'No headline',
  crime.crime_type || 'Other',  // ← OLD (line 277)
  crime.street || '',
  ...
]);
```

**Replace with:**
```javascript
// Process crime types (2026+)
const crimeTypes = processLegacyCrimeType(crime);

prodSheet.appendRow([
  validatedDate,
  crime.headline || 'No headline',
  crimeTypes.primary,    // ← NEW: primaryCrimeType
  crimeTypes.related,    // ← NEW: relatedCrimeTypes
  crimeTypes.primary,    // ← NEW: crimeType (backward compat)
  crime.street || '',
  ...
]);
```

#### **Change 2: appendToReviewQueue (line ~317)**

**Find:**
```javascript
reviewSheet.appendRow([
  validatedDate,
  crime.headline || 'Needs headline',
  crime.crime_type || 'Unknown',  // ← OLD (line 320)
  crime.street || '',
  ...
]);
```

**Replace with:**
```javascript
// Process crime types (2026+)
const crimeTypes = processLegacyCrimeType(crime);

reviewSheet.appendRow([
  validatedDate,
  crime.headline || 'Needs headline',
  crimeTypes.primary,    // ← NEW
  crimeTypes.related,    // ← NEW
  crimeTypes.primary,    // ← NEW (backward compat)
  crime.street || '',
  ...
]);
```

**Save**

---

### **Step 5: Test** (5 minutes)

1. In Apps Script, select function: **`testGeminiExtraction`**
2. Click **Run**
3. Check **Execution Log**
4. Look for:
   - `all_crime_types: ["Murder", "Shooting"]` ✅
   - `Primary: Murder` ✅
   - `Related: Shooting` ✅

If you see these, you're good! ✅

**Optional:** Run `testProcessingPipeline()` to test full flow

---

### **Step 6: Monitor January 1** (Ongoing)

On January 1, 2026:
- First few crimes should populate new columns automatically
- Check that:
  - `primaryCrimeType` has single value (e.g., "Murder")
  - `relatedCrimeTypes` has comma-separated values (e.g., "Shooting,Assault") or empty
  - `crimeType` matches `primaryCrimeType` (backward compat)

---

## 🚨 Troubleshooting

**Problem:** Test shows `crime_type` instead of `all_crime_types`
- **Fix:** You didn't update `geminiClient.gs` prompt correctly. Re-check Step 3.

**Problem:** Error: `processLegacyCrimeType is not defined`
- **Fix:** You didn't upload `crimeTypeProcessor.gs`. Go back to Step 2.

**Problem:** Error: "Cannot read property 'appendRow'"
- **Fix:** Sheet columns don't match array length. Check Step 1 - did you add the columns?

**Problem:** Gemini returns empty array
- **Fix:** This is normal for non-crime articles. Check the article content.

---

## 📞 Need Help?

1. Check full guide: `docs/implementation/2026-PRIMARY-RELATED-CRIME-TYPES.md`
2. Ask Claude in new context (reference this file)
3. Revert changes and try again (Apps Script has version history)

---

## ✅ Success Criteria

You're ready for 2026 when:
- [x] New columns added to sheets ✅ DONE (Dec 28)
- [x] Google Form updated with dual dropdowns ✅ DONE (Dec 28)
- [x] Frontend column mapping deployed ✅ DONE (Dec 28)
- [ ] `crimeTypeProcessor.gs` uploaded to Apps Script 🔄 PENDING
- [ ] `geminiClient.gs` prompt updated 🔄 PENDING
- [ ] `processor.gs` both functions updated 🔄 PENDING
- [ ] Test passes showing `all_crime_types` array 🔄 PENDING
- [ ] No errors in Execution Log 🔄 PENDING

**Status on Jan 1:** New system goes live automatically! 🎉

---

**Time remaining:** ~20 minutes (Steps 2-5 only, Step 1 complete)
**Goes live:** January 1, 2026, 12:00 AM (automatically)
