# 2026 Implementation: Primary + Related Crime Types

**Status:** ✅ COMPLETE - Ready for January 1, 2026 launch
**Goal:** One incident = one row, but track ALL crime types involved
**Completed:** December 28, 2025 (Backend + Frontend)

---

## 🎯 What Changes

### Old Way (2025):
- Murder by shooting = **2 rows** (1 Murder + 1 Shooting) ❌ Duplicates
- `crimeType` column = single value

### New Way (2026):
- Murder by shooting = **1 row** with primary="Murder", related="Shooting" ✅ No duplicates
- New columns: `primaryCrimeType`, `relatedCrimeTypes`
- Keep old `crimeType` for backward compatibility

---

## 📋 Implementation Checklist

### ✅ Phase 1: Google Sheets Setup (5 min - Manual)

1. **Open 2026 Trinidad Sheet**
2. **Add columns** (insert after existing columns, before `crimeType`):
   - `primaryCrimeType` (text)
   - `relatedCrimeTypes` (text, comma-separated)
3. **Keep old `crimeType` column** - Apps Script will auto-populate it

**Example row:**
```
headline: "Man shot dead in Laventille"
primaryCrimeType: Murder
relatedCrimeTypes: Shooting
crimeType: Murder  ← auto-filled by script
```

---

### ✅ Phase 2: Apps Script Updates

#### A. Update `geminiClient.gs` - Line ~181

**Find:**
```javascript
{
  "crime_date": "YYYY-MM-DD",
  "crime_type": "Murder|Shooting|...",
  ...
}
```

**Replace with:**
```javascript
{
  "crime_date": "YYYY-MM-DD",
  "all_crime_types": ["Murder", "Shooting"], // ← ALL types
  ...
}
```

#### B. Add New Rule to Prompt - After line 313

```javascript
  9. MULTI-CRIME TYPES: Extract ALL crime types in single incident
     - Use "all_crime_types" array: ["Murder", "Shooting"]
     - Order: most severe first
     - ONE incident, multiple types (not duplicates!)
```

#### C. Upload New File: `crimeTypeProcessor.gs`

File already created at:
`/Users/kavellforde/Documents/Side Projects/Crime Hotspots/google-apps-script/trinidad/crimeTypeProcessor.gs`

**Copy this file to your Google Apps Script project**

#### D. Update `processor.gs` - Find `appendToTargetSheet` call (line ~120)

**Find:**
```javascript
const crimeRow = [
  crime.crime_date,
  crime.crime_type,  // ← OLD
  ...
];
```

**Replace with:**
```javascript
// Process crime types (2026+ with backward compat)
const crimeTypes = processLegacyCrimeType(crime);

const crimeRow = [
  crime.crime_date,
  crimeTypes.primary,    // primaryCrimeType column
  crimeTypes.related,    // relatedCrimeTypes column
  crimeTypes.primary,    // crimeType column (backward compat)
  ...rest of fields
];
```

---

### ✅ Phase 3: Frontend Updates (COMPLETE)

**Status:** ✅ Implemented and deployed (December 28, 2025)

**What was implemented:**
1. **Column header mapping** (`src/lib/crimeData.ts`, `dashboard.astro`)
   - Parses CSV by column name (not index)
   - Resilient to column reordering
   - Works with both 2025 and 2026 sheet layouts

2. **Crime type counting** (`dashboard.astro`, `dashboardUpdates.ts`)
   - Created `countCrimeType()` helper function
   - Counts across `primaryCrimeType`, `relatedCrimeTypes`, AND `crimeType` (backward compatible)
   - **Result:** Incidents counted once, crime types counted accurately

3. **Updated Crime interface** (`crimeData.ts`)
   - Added optional `primaryCrimeType` field
   - Added optional `relatedCrimeTypes` field (comma-separated)

**Example behavior:**
```
Row: primaryCrimeType="Murder", relatedCrimeTypes="Shooting"
Dashboard Stats:
  ✓ Total Incidents: +1
  ✓ Murders: +1 (from primaryCrimeType)
  ✓ Shootings: +1 (from relatedCrimeTypes)
```

**Note:** Frontend is fully backward compatible - works with 2025 data (uses `crimeType` column) AND 2026 data (uses primary + related)!

---

## 🧪 Testing Plan

### Test 1: Single Crime Type
```
Article: "Man robbed at gunpoint in Arima"
Expected Output:
  all_crime_types: ["Robbery"]
  → primaryCrimeType: Robbery
  → relatedCrimeTypes: (empty)
```

### Test 2: Murder by Shooting
```
Article: "Woman shot dead in San Fernando"
Expected Output:
  all_crime_types: ["Murder", "Shooting"]
  → primaryCrimeType: Murder (most severe)
  → relatedCrimeTypes: Shooting
```

### Test 3: Home Invasion + Murder
```
Article: "Gunmen storm home, kill resident"
Expected Output:
  all_crime_types: ["Murder", "Home Invasion", "Shooting"]
  → primaryCrimeType: Murder
  → relatedCrimeTypes: Home Invasion,Shooting
```

**How to test:**
1. Run `testGeminiExtraction()` in Apps Script
2. Check the `all_crime_types` array in logs
3. Verify primary/related split logic

---

## 🚨 Critical Notes

1. **Don't touch 2025 data** - Leave it as-is (duplicates are fine for historical)
2. **January 1, 2026** - New structure goes live
3. **Backward compatibility** - Old `crimeType` column stays populated
4. **Frontend works immediately** - No urgent code changes needed
5. **Test before Jan 1** - Run Apps Script tests with sample articles

---

## 📅 Timeline

- **Now → Dec 31**: Finish 2025 updates (current process)
- **Dec 31**: Implement Apps Script changes (30 min)
- **Jan 1, 2026**: New structure goes live automatically
- **January 2026**: Monitor first week of data
- **Later**: Update frontend for advanced filtering (optional enhancement)

---

## 🎓 Crime Severity Ranking

```
Murder: 10
Kidnapping: 9
Police-Involved Shooting: 8
Shooting: 7
Sexual Assault: 6
Assault: 5
Robbery: 4
Home Invasion: 3
Theft: 2
Seizures: 1
```

**Logic:** Most severe becomes primary, others become related.

---

## ❓ FAQ

**Q: What if Gemini only returns one crime type?**
A: `relatedCrimeTypes` will be empty string. Works fine.

**Q: Will old 2025 data break the site?**
A: No! Old data uses `crimeType` column which we're keeping.

**Q: Do I need to update the frontend immediately?**
A: No - frontend can wait. Old `crimeType` column makes it work.

**Q: How do statistics work with this?**
A: Count ALL occurrences (primary + related) for accurate stats.

**Example:**
- 1 incident: Murder (primary) + Shooting (related)
- Murder count: +1
- Shooting count: +1
- Total incidents: 1 (not 2!)

---

## 🔗 Related Files

- Apps Script: `/google-apps-script/trinidad/`
- Frontend: `/astro-poc/src/lib/crimeData.ts`
- This guide: `/docs/implementation/2026-PRIMARY-RELATED-CRIME-TYPES.md`

---

**Ready to implement? Start with Phase 1 (Google Sheets) on December 31!**
