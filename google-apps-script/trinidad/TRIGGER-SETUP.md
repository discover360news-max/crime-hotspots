# Trigger Setup Guide - Trinidad Automation

## Overview

This guide shows how to set up time-based triggers for the automated crime data collection pipeline.

**Pipeline:** RSS Collection → Text Fetching → Pre-Filtering → Gemini Processing

**Schedule:** Every 8 hours (3 times per day)

---

## Step 1: Open Triggers Page

1. Open your Google Apps Script project
2. Click the **clock icon** ⏰ in the left sidebar (Triggers)
3. This opens the Triggers page

---

## Step 2: Create Main Pipeline Trigger

Click **"+ Add Trigger"** in the bottom right

### Configure Trigger:

**Choose which function to run:**
- Select: `runFullPipeline`

**Choose which deployment should run:**
- Select: `Head`

**Select event source:**
- Select: `Time-driven`

**Select type of time based trigger:**
- Select: `Hour timer`

**Select hour interval:**
- Select: `Every 8 hours`

**Failure notification settings:**
- Select: `Notify me immediately` (recommended)

Click **Save**

---

## Step 3: Verify Trigger is Active

You should see:
```
runFullPipeline
Time-driven | Hour timer | Every 8 hours
```

Status should show: ✅ Enabled

---

## Trigger Schedule (Automatic)

Google Apps Script will run `runFullPipeline()` approximately every 8 hours:

**Example Schedule:**
- Run 1: 8:00 AM
- Run 2: 4:00 PM
- Run 3: 12:00 AM (midnight)

**Note:** Exact times may vary slightly (±15 minutes) due to Google's trigger scheduling.

---

## What Happens Each Run

### Stage 1: RSS Collection (2-3 minutes)
- Collects from Trinidad Express, Guardian, Newsday
- Checks for duplicates (URL + headline similarity)
- Marks new articles as "pending"
- **Result:** 10-30 new articles per run (if available)

### Stage 2: Text Fetching (1-2 minutes)
- Fetches full article text from URLs
- Validates content (removes sidebars, ads)
- Marks as "text_fetched"
- **Result:** 10-30 articles with full text

### Stage 3: Pre-Filtering (30 seconds)
- Scores articles by keywords
- Checks duplicates in 4 sheets
- Marks as "ready_for_processing" or "filtered_out"
- **Expected:** 18-25% pass rate (2-6 articles)
- **Saves:** 75-82% of Gemini API calls

### Stage 4: Gemini Processing (2-4 minutes)
- Extracts crime data from passed articles
- Checks for crime-level duplicates
- Writes to Production sheet
- **Result:** 1-5 crimes extracted per run

**Total Time:** 5-10 minutes per run

---

## Monitoring

### Check Pipeline Logs

1. In Apps Script editor, click **Executions** (list icon) in left sidebar
2. Click on a recent execution
3. View detailed logs from each stage

### Check Monitoring Sheets

**"Filtered Out Articles" Sheet:**
- Shows what was filtered and why
- Review weekly for false negatives
- Adjust keywords if needed

**"API Usage Tracker" Sheet:**
- Shows daily Gemini API call count
- Should stay under 20 calls/day (free tier limit)
- Monitor savings percentage

---

## Troubleshooting

### If Trigger Fails

**Check logs:**
1. Executions → Failed execution → View logs
2. Look for error message

**Common issues:**
- API rate limit hit → Check API Usage Tracker
- Execution timeout → Normal if too many articles
- Network error → Temporary, will retry next run

### If Too Many API Calls

**Adjust pre-filter threshold:**
1. Open preFilter.gs
2. Find `MIN_SCORE_TO_PROCESS` (currently 10)
3. Increase to 12 or 15 (stricter filtering)
4. Save and redeploy

### If Missing Crime Articles

**Check Filtered Out Articles sheet:**
1. Review filtered articles
2. Look for false negatives (crime articles filtered)
3. Add missing keywords to "Crime Filter Keywords" sheet
4. Run `refreshKeywordCache()` to reload

---

## Pause/Resume Pipeline

### To Pause:
1. Go to Triggers page
2. Click **three dots** (⋮) next to trigger
3. Select **Delete trigger**

### To Resume:
1. Follow Step 2 above to recreate trigger

---

## Testing Before Going Live

### Manual Test (Recommended):

```javascript
// Run this manually first to test
testFullPipeline()
```

**What to check:**
1. Does RSS collection work?
2. Does text fetching work?
3. Does pre-filter mark articles correctly?
4. Does Gemini processing work?
5. Check Production sheet for new crimes

**If test passes → Set up trigger!**

---

## Expected Daily Performance

**3 runs per day (every 8 hours):**

**RSS Articles Collected:** ~30-90 per day
**Pre-Filter Passed:** ~6-18 per day (18-25%)
**Pre-Filter Blocked:** ~24-72 per day (75-82%)
**Gemini API Calls:** ~6-18 per day (well under 20 limit ✅)
**Crimes Extracted:** ~3-10 per day

**API Call Savings:** ~75-82% reduction vs processing all articles

---

## Notes

- Trigger runs automatically, no manual intervention needed
- Logs are retained for ~30 days in Google Apps Script
- Monitor weekly for first month, then monthly
- Adjust keyword thresholds as needed based on results

---

**Last Updated:** December 9, 2025
**Status:** Ready for production deployment
