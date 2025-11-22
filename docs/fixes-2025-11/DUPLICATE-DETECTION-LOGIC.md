# Duplicate Detection Logic - Quick Reference

**Last Updated:** November 17, 2025

## 6-Layer Detection System

### CHECK 1: Smart URL + Location + Date
**Purpose:** Block same incident labeled differently, allow multi-crime articles

```javascript
IF (Same URL):
  IF (Same Area AND Same Date) → BLOCK ❌ (duplicate)
  IF (Same Area AND Different Dates) → ALLOW ✓ (different incidents)
  IF (Different Areas) → ALLOW ✓ (multi-location article)
```

**Examples:**
- ✓ ALLOW: Murder in Carenage + Stabbing in Cocorite (same URL, different areas)
- ✓ ALLOW: Shooting today + Robbery last Saturday in Penal (same URL, same area, different dates)
- ❌ BLOCK: Home Invasion + Murder in Penal on 2025-11-17 (same URL, same area, same date)

---

### CHECK 2: Victim Name Matching
**Purpose:** Prevent double-counting same victim across extractions

```javascript
IF (Same Date):
  Extract names from headlines
  IF (Name appears in both headlines AND 60%+ headline similarity) → BLOCK ❌
```

**Name Extraction:**
- Pattern 1: Names in parentheses `(Rafeak Vialva, 45)`
- Pattern 2: Capitalized sequences `Rafeak Vialva`
- Filters out: location names, common phrases

**Examples:**
- ❌ BLOCK: "Rafeak Vialva shot" vs "Rafeak Vialva murdered" (same victim)
- ✓ ALLOW: "Rafeak Vialva shot" vs "Babita Vialva shot" (different victims)

---

### CHECK 3: Same Date + Victim Name + Crime Type
**Purpose:** Cross-source duplicate detection with victim names

```javascript
IF (Same Date AND Same Crime Type):
  IF (Victim name appears in existing headline) → BLOCK ❌
```

---

### CHECK 4: Same Date + Area + Crime Type + Headline Similarity
**Purpose:** Location-based duplicate detection

```javascript
IF (Same Date AND Same Crime Type AND Same Area):
  IF (Headline similarity > 80%) → BLOCK ❌
```

---

### CHECK 5: Same Date + Crime Type + High Headline Similarity
**Purpose:** Catch duplicates when location fields differ

```javascript
IF (Same Date AND Same Crime Type):
  IF (Headline similarity > 85%) → BLOCK ❌
```

**Example:**
- "Senior cop assaulted by security guard at casino"
- "Policeman assaulted by security guard at casino"
- Similarity: 87% → BLOCKED

---

### CHECK 6: Shared Location Keywords + Fuzzy Matching
**Purpose:** Handle different location field formatting

**Trinidad Keywords:** grand bazaar, movie towne, trincity mall, central market, queens park
**Guyana Keywords:** stabroek market, camp street, main street, robb street, water street, bourda market

```javascript
IF (Same Date AND Same Crime Type):
  IF (Location keyword appears in both) → BLOCK ❌
  OR IF (2+ common location words AND 75%+ headline similarity) → BLOCK ❌
```

**Example:**
- Area1: "Grand Bazaar", Street1: "San Juan"
- Area2: "", Street2: "Grand Bazaar, Curepe"
- Common keyword: "grand bazaar" → BLOCKED

---

## Real-World Test Cases

### ✓ ALLOWED: Multi-Crime Article
```
URL: trinidadexpress.com/violent-weekend
Crime 1: Murder in Carenage, 2025-11-17
Crime 2: Stabbing in Cocorite, 2025-11-17
→ Different areas, both allowed
```

### ✓ ALLOWED: Same Area, Different Dates
```
URL: newsday.co.tt/penal-crimes
Crime 1: Shooting in Penal, 2025-11-17
Crime 2: Robbery in Penal, 2025-11-10
→ Different dates, both allowed
```

### ✓ ALLOWED: Multi-Victim Murder
```
URL: newsday.co.tt/double-murder
Crime 1: Rafeak Vialva (Murder), Penal, 2025-11-17
Crime 2: Babita Vialva (Murder), Penal, 2025-11-17
→ Different victims, both allowed (accurate statistics)
```

### ❌ BLOCKED: Same Incident, Different Labels
```
URL: newsday.co.tt/penal-couple-murdered
Crime 1: Home Invasion, Penal, 2025-11-17 → Production ✓
Crime 2: Murder, Penal, 2025-11-17 → BLOCKED (CHECK 1)
Crime 3: Home Invasion, Penal, 2025-11-17 → BLOCKED (CHECK 1)
```

### ❌ BLOCKED: Cross-Source Duplicate
```
Source 1: CNC3, "Senior cop assaulted by security guard at casino"
Source 2: Newsday, "Policeman assaulted by security guard at casino"
Same date, same crime type, 87% similarity → BLOCKED (CHECK 5)
```

---

## Implementation Files

**Trinidad:**
- `processor.gs` (lines 252-393)
- `extractNamesFromHeadline()` function (lines 439-472)

**Guyana:**
- `processor.gs` (lines 252-393)
- `extractNamesFromHeadline()` function (lines 439-472)

---

## Monitoring

Check logs for these messages:
- "Duplicate found: Same URL + Same area + Same date"
- "✓ Same URL but different areas - allowing multi-location article"
- "✓ Same URL + Same area but different dates - allowing separate incidents"
- "Duplicate found: Same victim name 'rafeak vialva' detected"
- "Duplicate found: Same date + crime type + 87% similar headline"

---

**Created:** November 17, 2025
**Status:** Production-ready
**Next:** Deploy to Google Apps Script
