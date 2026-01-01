# Victim Count Implementation - Setup Guide

**Date:** January 1, 2026
**Purpose:** Add victim count tracking for Murder, Assault, Sexual Assault, and Kidnapping

---

## Overview

The system now supports **victim count multipliers** for specific crime types:
- **Enabled:** Murder, Assault, Sexual Assault, Kidnapping
- **Disabled:** Robbery, Burglary, Home Invasion, Theft, Shooting, Seizures

**Key Rule:** Victim count ONLY applies to the PRIMARY crime type, not related crimes.

**Example:**
- Primary: Murder, victimCount: 3, Related: [Shooting]
- Stats: Murder = +3, Shooting = +1

---

## Step 1: Update Google Form

1. **Open your form:** https://docs.google.com/forms/d/1Kgv_9H9ZGx3H9ZGx3H9ZGx3H9ZGx3H9ZGx3H9/edit
   (Replace with actual edit URL)

2. **Add new field** after "relatedcrimeType":
   - **Field type:** Short answer (number)
   - **Question:** Number of Victims
   - **Description:** Enter the total number of victims (default: 1). Only applies to Murder, Assault, Sexual Assault, and Kidnapping when selected as Primary Crime Type.
   - **Validation:**
     - Response validation: Number
     - Is number
     - Greater than or equal to: 1
   - **Default value:** 1
   - **Required:** Yes

3. **Save the form**

---

## Step 2: Update Google Sheet

1. **Open the 2026 sheet** in your Google Sheets workbook

2. **Add new column** after "relatedCrimeType" column:
   - **Column name:** `victimCount`
   - **Position:** Right after the "relatedCrimeType" column

3. **Add default value formula** (optional):
   - In the first data row (usually row 2), add this formula in the victimCount column:
   - `=IF(ISBLANK([FORM_RESPONSE_COLUMN]), 1, [FORM_RESPONSE_COLUMN])`
   - Replace `[FORM_RESPONSE_COLUMN]` with the actual column reference where form responses go
   - This ensures old entries without victim count default to 1

4. **Format column:**
   - Select the entire victimCount column
   - Format → Number → Number (0 decimal places)

---

## Step 3: Update CSV Export

The 2026 sheet CSV URL should automatically include the new `victimCount` column once you've added it to the sheet.

**Current CSV URL (from code):**
```
https://docs.google.com/spreadsheets/d/e/2PACX-1vTB-ktijzh1ySAy3NpfrcPEEEEs90q-0F0V8UxZxCTlTTbk4Qsa1cbLhlPwh38ie2_bGJYQX8n5vy8v/pub?gid=1963637925&single=true&output=csv
```

**Verify:**
1. Visit the CSV URL in your browser
2. Check that the header row includes `victimCount`
3. If not, ensure the column is named exactly `victimCount` (case-insensitive is fine)

---

## Step 4: Test the System

### Test Case 1: Double Murder
1. Fill out form with:
   - Primary Crime Type: Murder
   - Number of Victims: 2
   - Related Crime Types: Shooting
2. Submit form
3. Check Dashboard → Murder stat should increase by **2**
4. Shooting stat should increase by **1**

### Test Case 2: Robbery with Multiple Victims
1. Fill out form with:
   - Primary Crime Type: Robbery
   - Number of Victims: 5
   - Related Crime Types: Assault
2. Submit form
3. Check Dashboard → Robbery stat should increase by **1** (not 5)
4. Assault stat should increase by **1**

### Test Case 3: Default Victim Count
1. Fill out form with:
   - Primary Crime Type: Assault
   - Number of Victims: 1 (or leave default)
2. Submit form
3. Check Dashboard → Assault stat should increase by **1**

---

## Frontend Changes (Already Implemented)

✅ Created `/astro-poc/src/config/crimeTypeConfig.ts`
✅ Updated `/astro-poc/src/lib/crimeData.ts` to parse victimCount
✅ Updated `/astro-poc/src/scripts/dashboardUpdates.ts` to apply victim count logic

**No further code changes needed!**

---

## Changing Which Crime Types Use Victim Count

To enable/disable victim counting for any crime type:

1. Open `astro-poc/src/config/crimeTypeConfig.ts`
2. Find the crime type (e.g., `Shooting`)
3. Change `useVictimCount: false` to `useVictimCount: true` (or vice versa)
4. Save and rebuild: `npm run build`

**Example:**
```typescript
// Enable victim count for Shooting
Shooting: { useVictimCount: true },
```

---

## Troubleshooting

**Problem:** Victim count not multiplying stats
**Solution:** Check browser console for logs: `📊 Murder count breakdown: Primary=X...`

**Problem:** Form validation fails
**Solution:** Ensure "Number of Victims" field has validation set to "Greater than or equal to 1"

**Problem:** Old entries show 0 victims
**Solution:** Add default formula in Google Sheet (see Step 2 above)

---

## Summary

✅ Victim count field added to form
✅ Victim count column added to sheet
✅ Frontend code updated to handle victim counts
✅ Configuration file created for easy toggling

**Next:** Fill out your first manual entry and test!
