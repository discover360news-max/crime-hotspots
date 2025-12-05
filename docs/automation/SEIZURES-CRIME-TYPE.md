# Seizures Crime Type - Implementation Guide

**Date Added:** December 3, 2025
**Issue:** Gun/ammunition seizure stories incorrectly classified as "Theft"
**Solution:** New "Seizures" crime type for police enforcement actions

---

## Problem Statement

The Gemini AI was classifying police seizures of illegal items (guns, drugs, contraband) as "Theft" because there was no appropriate crime type for law enforcement recovery actions.

**Example of Misclassification:**
```
Title: "Gun and ammunition recovered following Berbice accident"
WRONG: Crime Type = "Theft"
RIGHT: Crime Type = "Seizures"

Title: "Police seize 9mm pistol and ammo in abandoned Mocha/Arcadia building"
WRONG: Crime Type = "Theft"
RIGHT: Crime Type = "Seizures"
```

---

## Solution: New "Seizures" Crime Type

### What is "Seizures"?

**Seizures** represents police/law enforcement actions to confiscate illegal items or recover stolen goods:

- ✅ Drugs seized by police
- ✅ Illegal weapons/ammunition recovered
- ✅ Contraband confiscated by authorities
- ✅ Stolen goods recovered during police operations
- ✅ Items found during police raids/searches

### When to Use "Seizures" vs "Theft"

| Scenario | Crime Type | Reason |
|----------|-----------|--------|
| Police find illegal gun | **Seizures** | Law enforcement recovery |
| Police seize drugs | **Seizures** | Law enforcement action |
| Stolen car recovered | **Seizures** | Police recovery operation |
| Someone's car stolen | **Theft** | Crime against a victim |
| House burgled | **Theft** | Crime against a victim |
| Phone snatched | **Theft** | Crime against a victim |

**Key Distinction:**
- **Seizures** = Police **taking** illegal items (enforcement)
- **Theft** = Criminals **taking** items from victims (crime)

---

## Implementation Details

### 1. Gemini Prompt Updates

**Both Countries Updated:**
- `google-apps-script/guyana/geminiClient.gs` (lines 185, 268-282)
- `google-apps-script/trinidad/geminiClient.gs` (lines 185, 268-282)

**Crime Type List:**
```
"crime_type": "Murder|Shooting|Robbery|Assault|Theft|Home Invasion|Sexual Assault|Kidnapping|Police-Involved Shooting|Seizures"
```

**New Rule 6:**
```
6. SEIZURES vs THEFT: Critical distinction
   - Use "Seizures" when:
     * Police/law enforcement found/seized illegal items (drugs, guns, ammo, contraband)
     * Stolen goods recovered by police
     * Illegal weapons/ammunition discovered during police operation
     * Contraband confiscated by authorities
     * Examples: "Gun and ammunition recovered", "Police seize drugs", "Stolen vehicle found"
   - Use "Theft" when:
     * Someone stole items FROM a victim
     * Property was taken by criminals
     * Burglary where items were stolen
     * Examples: "Man's car stolen", "House burgled", "Phone snatched"
   - CRITICAL: "Police found gun" = "Seizures" NOT "Theft"
   - CRITICAL: "Police seized drugs" = "Seizures" NOT "Theft"
   - Seizures indicate police enforcement/recovery actions, NOT crimes against victims
```

### 2. Frontend Color Configuration

**File:** `src/js/config/crimeColors.js`

**Color Assignment:**
```javascript
'Seizures': '#3b82f6',  // Blue - Police enforcement/recovery
```

**Rationale:** Blue color associates with police/law enforcement, visually distinct from crime categories.

**Order in Legend:**
```javascript
// Other Crimes (Cool Colors)
'Fraud',
'Drug-related',
'Seizures',                    // ← NEW
'Police-Involved Shooting',
'Other'
```

---

## Visual Representation

### Crime Color Families

**Violence Family** (Reds):
- Murder, Sexual Assault, Kidnapping, Assault, Shooting

**Property Crimes** (Oranges):
- Robbery, Home Invasion, Burglary, Arson

**Theft Family** (Yellows):
- Vehicle Theft, Theft

**Other Crimes** (Cool Colors):
- Fraud (Cyan)
- Drug-related (Green)
- **Seizures (Blue)** ← NEW
- Police-Involved Shooting (Dark Blue)
- Other (Grey)

---

## Expected Impact

### Data Quality Improvements

1. **More Accurate Classification:**
   - Gun seizures → "Seizures" (not "Theft")
   - Drug busts → "Seizures" (not "Other")
   - Stolen goods recovered → "Seizures" (not "Theft")

2. **Better Statistics:**
   - Theft numbers will drop (removing false positives)
   - New "Seizures" category shows law enforcement activity
   - Clearer distinction between crimes and police actions

3. **User Understanding:**
   - Users can see police enforcement activity separately
   - Distinguishes proactive policing from reactive crime response
   - Blue color makes it obvious these are police actions

### Analytics Impact

**Before:**
- "Theft" category was inflated with police seizures
- No way to track police enforcement effectiveness

**After:**
- "Theft" = actual crimes against victims
- "Seizures" = police enforcement/recovery actions
- Can analyze police activity separately from crime trends

---

## Deployment Notes

### Google Apps Script

**IMPORTANT:** After pushing changes to GitHub, you MUST manually update the Google Apps Script projects:

1. **Guyana Automation:**
   - Open: https://script.google.com/home/projects/YOUR_GUYANA_PROJECT_ID
   - Copy updated code from `google-apps-script/guyana/geminiClient.gs`
   - Save and deploy

2. **Trinidad Automation:**
   - Open: https://script.google.com/home/projects/YOUR_TRINIDAD_PROJECT_ID
   - Copy updated code from `google-apps-script/trinidad/geminiClient.gs`
   - Save and deploy

**Why Manual?** Google Apps Script doesn't auto-sync from GitHub. Code must be copied manually.

### Frontend Deployment

Frontend changes auto-deploy via GitHub Actions:
- ✅ Push to `main` branch
- ✅ Cloudflare Pages auto-deploys
- ✅ Live in 3-5 minutes

---

## Testing Recommendations

### Test Cases

After deployment, verify the AI correctly classifies these scenarios:

| Article Headline | Expected Crime Type |
|------------------|-------------------|
| "Police seize AK-47 in raid" | Seizures |
| "Officers recover 10kg cocaine" | Seizures |
| "Gun and ammo found in abandoned car" | Seizures |
| "Man's vehicle stolen from driveway" | Theft |
| "House burgled, electronics missing" | Theft |
| "Phone snatched in Stabroek Market" | Theft |

### Monitoring

1. **Check Production Sheet:**
   - Look for new "Seizures" entries
   - Verify "Theft" entries are actual thefts (not seizures)

2. **Review Queue:**
   - Check if any seizure stories end up in review
   - If confidence < 7, investigate why

3. **Dashboard Visualization:**
   - Verify "Seizures" appears in charts with blue color
   - Check that legend ordering is correct

---

## FAQ

**Q: Why not use "Police Action" or "Law Enforcement"?**
A: "Seizures" is more specific and commonly used in Caribbean news headlines. It's immediately clear what it means.

**Q: Should arrests be classified as "Seizures"?**
A: No. "Seizures" is for **items** (drugs, guns, contraband). Arrests are about **people** and don't belong in crime statistics unless a specific crime is mentioned.

**Q: What about drug busts with arrests?**
A: Use "Seizures" to focus on the contraband recovered. The arrest is secondary to the seizure of illegal items.

**Q: Can a single article have both "Seizures" and "Theft"?**
A: Yes! Example: "Car stolen on Monday, recovered by police on Wednesday" = 2 crimes:
   1. Theft (car stolen)
   2. Seizures (car recovered)

**Q: What if police seize stolen goods?**
A: Use "Seizures" because the focus is on the **police action** (recovery). The original theft may have already been logged.

---

## Related Documentation

- `google-apps-script/guyana/README.md` - Guyana automation guide
- `google-apps-script/trinidad/README.md` - Trinidad automation guide
- `src/js/config/crimeColors.js` - Crime color configuration
- `CLAUDE.md` - Project overview

---

**Version:** 1.0
**Last Updated:** December 3, 2025
