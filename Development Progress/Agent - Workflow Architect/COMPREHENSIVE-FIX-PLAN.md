# Comprehensive Fix Plan - Crime Hotspots Data Quality

**Date:** November 9, 2025
**Approach:** Methodical, layered validation with checks at every step
**Goal:** Production-ready data quality with easy diagnosis of issues

---

## 🎯 Design Principles

1. **Fail Fast, Fail Visible** - Problems should be caught immediately and logged clearly
2. **Validate at Every Layer** - Don't trust data from previous step without validation
3. **Single Responsibility** - Each component does ONE thing well
4. **Traceable** - Every piece of data can be traced back to source
5. **Testable** - Every component has test functions

---

## 📊 Complete Data Flow with Validation Points

```
┌─────────────────────────────────────────────────────────────┐
│ LAYER 1: RSS Collection                                      │
├─────────────────────────────────────────────────────────────┤
│ Input: RSS Feed URLs                                         │
│ Output: Title, URL, Published Date → Raw Articles (status: pending) │
│                                                              │
│ ✓ Validation 1.1: URL is valid HTTP/HTTPS                   │
│ ✓ Validation 1.2: Title is not empty                        │
│ ✓ Validation 1.3: Not duplicate (URL already exists)        │
│ ✓ Validation 1.4: Published date is valid                   │
│                                                              │
│ ❌ Fail Action: Log error, skip entry, continue             │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ LAYER 2: Article Text Fetching                              │
├─────────────────────────────────────────────────────────────┤
│ Input: URL from Raw Articles (status: pending)              │
│ Output: Full Text → Raw Articles Column E (status: ready_for_processing) │
│                                                              │
│ ✓ Validation 2.1: HTTP 200 response                         │
│ ✓ Validation 2.2: Content length > 200 chars                │
│ ✓ Validation 2.3: Content contains title keywords (>30% match) │
│ ✓ Validation 2.4: Content is primarily text (not JS/CSS)    │
│ ✓ Validation 2.5: Extract from <article> or <div.content>   │
│                                                              │
│ ❌ Fail Action: status = fetch_failed, log reason, retry later │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ LAYER 3: Gemini AI Extraction                               │
├─────────────────────────────────────────────────────────────┤
│ Input: Full Text, Title, URL, Published Date                │
│ Output: {crimes: [...], confidence, ambiguities}             │
│                                                              │
│ ✓ Validation 3.1: Response is valid JSON                    │
│ ✓ Validation 3.2: crimes is an array                        │
│ ✓ Validation 3.3: Each crime has required fields            │
│ ✓ Validation 3.4: source_url matches input URL              │
│ ✓ Validation 3.5: Confidence score 0-10                     │
│ ✓ Validation 3.6: Response not truncated                    │
│                                                              │
│ ❌ Fail Action: confidence = 0, ambiguities logged, skip or review │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ LAYER 4: Crime Data Validation                              │
├─────────────────────────────────────────────────────────────┤
│ Input: Individual crime object from crimes array            │
│ Output: {valid: boolean, issues: []}                        │
│                                                              │
│ ✓ Validation 4.1: crime_date is valid YYYY-MM-DD            │
│ ✓ Validation 4.2: crime_date within 30 days of published    │
│ ✓ Validation 4.3: crime_type in allowed list                │
│ ✓ Validation 4.4: area not "Unknown" or too vague           │
│ ✓ Validation 4.5: headline length 10-200 chars              │
│ ✓ Validation 4.6: headline keywords in source text          │
│ ✓ Validation 4.7: source_url matches article URL            │
│ ✓ Validation 4.8: No non-crime keywords (traffic, policy)   │
│                                                              │
│ ❌ Fail Action: Route to Review Queue with issues listed    │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ LAYER 5: Duplicate Detection                                │
├─────────────────────────────────────────────────────────────┤
│ Input: Validated crime object                               │
│ Output: boolean (is duplicate)                              │
│                                                              │
│ ✓ Check 5.1: Exact URL + headline match                     │
│ ✓ Check 5.2: Same URL + 90%+ similar headline               │
│ ✓ Check 5.3: Same date + area + 75%+ similar headline       │
│ ✓ Check 5.4: Same date + victim age match                   │
│ ✓ Check 5.5: Same victim name (fuzzy match)                 │
│                                                              │
│ ❌ Duplicate Found: Log and skip, don't add to Production   │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ LAYER 6: Routing Decision                                   │
├─────────────────────────────────────────────────────────────┤
│ Input: Validated, non-duplicate crime                       │
│ Output: Add to Production OR Review Queue                   │
│                                                              │
│ If validation.valid AND confidence ≥7:                       │
│   → Geocode → Production Sheet                              │
│                                                              │
│ If validation.valid BUT confidence 1-6:                      │
│   → Geocode → Review Queue (with ambiguities)               │
│                                                              │
│ If !validation.valid:                                        │
│   → Review Queue (with validation issues)                   │
│                                                              │
│ If confidence = 0:                                           │
│   → Skip (mark article as "skipped")                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Comprehensive Scenario Analysis

### Scenario 1: Perfect Crime Article

**Input:**
- RSS: "Man shot dead in Port of Spain"
- URL: newsday.co.tt/2025/11/09/man-shot-dead-pos
- Content: Focused article about single shooting

**Expected Flow:**
1. ✅ RSS Collection: Valid URL, unique, added as "pending"
2. ✅ Article Fetch: HTTP 200, extracts <article> content, title keywords match 80%
3. ✅ Gemini: Extracts 1 crime, confidence 9
4. ✅ Validation: All fields valid, source_url correct, no non-crime keywords
5. ✅ Duplicate: No duplicates found
6. ✅ Routing: confidence ≥7 → Production

**Result:** ✅ Added to Production with high confidence

---

### Scenario 2: Multi-Crime Article

**Input:**
- RSS: "Weekend violence: Three shootings reported"
- URL: trinidadexpress.com/weekend-violence
- Content: Article describes 3 separate shooting incidents

**Expected Flow:**
1. ✅ RSS Collection: Valid, unique
2. ✅ Article Fetch: Extracts article content
3. ✅ Gemini: Extracts 3 crimes (array), confidence 8
4. ✅ Validation (Crime 1): Valid, headline in content ✅
5. ✅ Validation (Crime 2): Valid, headline in content ✅
6. ✅ Validation (Crime 3): Valid, headline in content ✅
7. ✅ Duplicate: None (different headlines despite same URL)
8. ✅ Routing: All 3 crimes → Production

**Result:** ✅ 3 entries added to Production, all with same source URL

---

### Scenario 3: Non-Crime Article (Current Bug!)

**Input:**
- RSS: "President: UN youth programme promotes peace"
- URL: newsday.co.tt/president-un-youth-programme
- Content: Article about youth programme + SIDEBAR with crime headlines

**Current (Broken) Flow:**
1. ✅ RSS Collection: Valid
2. ❌ Article Fetch: Strips ALL HTML, includes sidebar → "...youth programme... Man shot in Williamsville... Vendor injured..."
3. ❌ Gemini: Sees crime text, extracts 3 "crimes", confidence 8
4. ❌ Validation: source_url correct but headline NOT in article content
5. ✅ Duplicate: None
6. ❌ Routing: HIGH confidence → Production ❌

**Result:** ❌ 3 fake crimes added to Production with wrong context

**Fixed Flow:**
1. ✅ RSS Collection: Valid
2. ✅ Article Fetch (IMPROVED): Extracts only <article> tag content
3. ✅ Gemini: No crime keywords in actual article → confidence 0
4. ✅ Validation: N/A (no crimes extracted)
5. ✅ Routing: Skip, mark "not a crime article"

**Result:** ✅ Correctly identified as non-crime, not added to Production

---

### Scenario 4: Traffic Accident (Should NOT be included)

**Input:**
- RSS: "Vendor injured crossing highway"
- URL: trinidadexpress.com/vendor-injured
- Content: Pedestrian hit by vehicle, not criminal act

**Expected Flow:**
1. ✅ RSS Collection: Valid
2. ✅ Article Fetch: Extracts article content
3. ✅ Gemini: Extracts 1 "crime", type: "Other", confidence 3
4. ❌ Validation: Detects "injured crossing" keyword → validation.valid = false
5. ✅ Routing: !valid → Review Queue

**Result:** ✅ Sent to Review Queue for manual decision (not auto-added to Production)

---

### Scenario 5: Duplicate Crime (Different Sources)

**Input A (Trinidad Express):**
- RSS: "Man, 29, executed in Guapo shooting"
- Content: Josiah Phillip, 29, shot in Guapo

**Input B (Trinidad Newsday - next day):**
- RSS: "Guapo murder victim identified"
- Content: Josiah Phillip, 29, killed in Guapo

**Expected Flow:**
1. ✅ Article A processed → Production
2. ✅ Article B fetched and extracted
3. ✅ Gemini: Extracts 1 crime
4. ✅ Validation: All valid
5. ✅ Duplicate Check:
   - Different URLs ❌
   - Same date (Nov 7) ✅
   - Same area (Guapo) ✅
   - Victim age 29 in both ✅
   - Headline 75% similar ✅
   - **DUPLICATE DETECTED**
6. ❌ Routing: Skip, log "duplicate of existing crime"

**Result:** ✅ Duplicate correctly identified, not added again

---

### Scenario 6: Foreign Crime (Should be excluded)

**Input:**
- RSS: "US airstrikes kill three in Caribbean Sea"
- Content: Military action by US forces

**Expected Flow:**
1. ✅ RSS Collection: Valid
2. ✅ Article Fetch: Content extracted
3. ✅ Gemini: Extracts 1 crime, confidence 4
4. ❌ Validation: Detects "airstrike" + "military" keywords → validation.valid = false
5. ✅ Routing: !valid → Review Queue

**Result:** ✅ Flagged for review, not auto-added to Production

---

### Scenario 7: Truncated Gemini Response

**Input:**
- Very long article with 5 crimes

**Expected Flow:**
1. ✅ Article fetched
2. ❌ Gemini: Response truncated (finishReason: MAX_TOKENS)
3. ✅ Truncation Detection: isResponseTruncated() returns true
4. ✅ Partial Parse: Extract what we got (2 crimes)
5. ❌ Validation: confidence lowered to 2, ambiguity added
6. ✅ Routing: Low confidence → Review Queue

**Result:** ✅ Partial crimes sent to Review Queue with "TRUNCATED" flag

---

### Scenario 8: Gemini Safety Filter

**Input:**
- Article with graphic violence description

**Expected Flow:**
1. ✅ Article fetched
2. ❌ Gemini: No candidates returned (safety filter)
3. ✅ Safety Detection: Check responseData.candidates.length === 0
4. ✅ Routing: confidence = 0, ambiguity: "AI safety filter triggered"
5. ✅ Mark: Article status = "needs_manual_review"

**Result:** ✅ Flagged for manual extraction, logged

---

### Scenario 9: Invalid Date in Article

**Input:**
- Article says "crime occurred recently" (vague)

**Expected Flow:**
1. ✅ Article fetched
2. ✅ Gemini: Uses publication date as fallback
3. ✅ Validation: Date within 30 days of publication ✅
4. ⚠️ Ambiguity logged: "Date vague, used publication date"
5. ✅ Routing: If confidence ≥7 → Production (with ambiguity note)

**Result:** ✅ Added but flagged for possible review

---

### Scenario 10: Geocoding Failure

**Input:**
- Crime in "Rural Trinidad" (too vague)

**Expected Flow:**
1. ✅ All validations pass
2. ✅ Routing: → Production
3. ❌ Geocoding: Can't find "Rural Trinidad", returns null
4. ✅ Fallback: lat/lng = null, plus_code = null, area remains "Rural Trinidad"
5. ✅ Added: Crime added with missing geocoding

**Result:** ✅ Crime added, geocoding can be manually fixed later

---

## 🛠️ Implementation Checklist

### Phase 1: Deep Diagnostics (Confirm Root Cause)

- [ ] Add `deepDiagnostics.gs` to Google Apps Script
- [ ] Run `runDeepDiagnostics()`
- [ ] Confirm sidebar contamination percentage
- [ ] Inspect Row 3 content (President article)
- [ ] Verify our hypothesis is correct

**Expected Result:** >30% contamination, confirming sidebar issue

---

### Phase 2: Fix Article Fetcher

- [ ] Create `articleFetcherImproved.gs`
- [ ] Implement smart HTML parsing:
  - Target `<article>` tag first
  - Fallback to `<div class="entry-content">`, `<div class="article-content">`
  - Fallback to `<div id="content">`
  - Last resort: current method
- [ ] Add title keyword matching validation
- [ ] Test with 5 known good articles
- [ ] Test with 3 known contaminated articles
- [ ] Deploy if tests pass

**Success Criteria:**
- Title keyword match >60% for all tested articles
- No crime keywords in non-crime articles

---

### Phase 3: Add Validation Layers

- [ ] Create `validationLayer.gs`
- [ ] Implement `validateArticleFetch()` (Layer 2)
- [ ] Implement `validateGeminiResponse()` (Layer 3)
- [ ] Implement `validateCrimeData()` (Layer 4)
- [ ] Add validation calls to processor.gs
- [ ] Test with known good/bad data

**Success Criteria:**
- All 10 scenarios handled correctly
- Clear error messages for each validation failure

---

### Phase 4: Improve Gemini Prompt

- [ ] Update prompt in geminiClient.gs
- [ ] Add explicit exclusion list
- [ ] Add "DO NOT extract from sidebars" instruction
- [ ] Add source_url prohibition
- [ ] Test with 10 sample articles
- [ ] Verify no non-crime extractions

**Success Criteria:**
- 0% non-crime articles extracted
- Confidence scores more accurate

---

### Phase 5: Strengthen Duplicate Detection

- [ ] Update `isDuplicateCrime()` in processor.gs
- [ ] Add date + area + similarity check
- [ ] Add victim age matching
- [ ] Test with known duplicates from different sources
- [ ] Test with multi-crime articles (should NOT flag as duplicates)

**Success Criteria:**
- True duplicates caught 95%+
- Multi-crime articles NOT flagged as duplicates

---

### Phase 6: Create Testing Framework

- [ ] Create `testFramework.gs`
- [ ] Add unit tests for each validation function
- [ ] Add integration tests for complete flow
- [ ] Add test data samples (good/bad/edge cases)
- [ ] Document expected vs actual results

**Success Criteria:**
- All 10 scenarios have automated tests
- Tests run in <2 minutes
- Clear pass/fail reporting

---

### Phase 7: Build Monitoring Dashboard

- [ ] Create `monitoring.gs`
- [ ] Add daily quality report function
- [ ] Add weekly trend analysis
- [ ] Add alert thresholds (>10% non-crime, >5% duplicates)
- [ ] Email notification on threshold breach

**Success Criteria:**
- Automated daily reports
- Issues caught within 24 hours

---

## 📈 Success Metrics (Final State)

**Layer 1: RSS Collection**
- ✅ 100% valid URLs
- ✅ <2% duplicates

**Layer 2: Article Fetching**
- ✅ 95%+ HTTP 200 success rate
- ✅ 90%+ title keyword match
- ✅ 0% sidebar contamination

**Layer 3: Gemini Extraction**
- ✅ 95%+ valid JSON responses
- ✅ 0% truncation errors
- ✅ 0% non-crime extractions at confidence ≥7

**Layer 4: Crime Validation**
- ✅ 95%+ crimes pass all validations
- ✅ 0% crimes with wrong source_url
- ✅ 0% crimes with dates >30 days from publication

**Layer 5: Duplicate Detection**
- ✅ 98%+ true duplicates caught
- ✅ 0% false positives (multi-crime flagged as duplicates)

**Layer 6: Routing**
- ✅ 85%+ crimes go to Production (confidence ≥7)
- ✅ 10-15% go to Review Queue
- ✅ 0% non-crimes in Production

**Overall Quality:**
- ✅ 95%+ accuracy (verified crimes in Production)
- ✅ <3% duplicates in Production
- ✅ 0% non-crimes in Production
- ✅ <10% manual review needed per day

---

## 🚦 Traffic Light System

**Daily Quality Check Results:**

🟢 **GREEN (System Healthy)**
- <5% Review Queue items
- 0 non-crimes detected
- <2% duplicates
- 90%+ geocoding success

🟡 **YELLOW (Needs Attention)**
- 5-10% Review Queue items
- 1-2 non-crimes detected
- 2-5% duplicates
- 80-90% geocoding success

🔴 **RED (Stop and Fix)**
- >10% Review Queue items
- >2 non-crimes detected
- >5% duplicates
- <80% geocoding success

**Action on RED:** Pause triggers, run diagnostics, fix issues, test, resume

---

## 📝 Next Immediate Steps

1. **You run:** `runDeepDiagnostics()` in Google Apps Script
2. **You share:** The log output with me
3. **I confirm:** The sidebar contamination theory
4. **I create:** Improved article fetcher
5. **You test:** New fetcher with 3-5 articles
6. **We iterate:** Until fetcher is solid
7. **Then build:** Validation layers on top of working fetcher

Sound good? Let's confirm the problem first before building the solution.

---

**Last Updated:** November 9, 2025
**Status:** Ready for deep diagnostics
**Next Action:** Run `runDeepDiagnostics()`
