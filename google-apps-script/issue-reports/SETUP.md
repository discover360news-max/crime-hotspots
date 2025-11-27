# Issue Report System - Setup Guide

## Overview
Users can report issues with crime data (incorrect location, wrong type, duplicates, etc.). Reports are saved to Google Sheets and emailed to you daily.

## Protection Features ✅
- ✅ Session rate limiting (3 reports max per browser session)
- ✅ Text sanitization (removes HTML/scripts)
- ✅ Honeypot field (catches bots)
- ✅ 500 character limit
- ✅ Daily email digest (not instant, prevents spam)

---

## Setup Steps

### 1. Create Sheet Tab
1. Open your **Crime Reports** Google Sheet
2. Create a new tab called **Issue Reports**
3. Add these column headers in row 1:

```
Timestamp | Issue Type | Details | Headline | Crime Type | Date | Location | Area | Country | URL | Plus Code | Page URL
```

### 2. Deploy Google Apps Script

1. Go to **Extensions → Apps Script** in your Google Sheet
2. Create a new script file called `issueReportHandler.gs`
3. Copy the code from `issueReportHandler.gs` (created above)
4. Update the CONFIG section (lines 19-23):

```javascript
const CONFIG = {
  SHEET_ID: 'YOUR_SHEET_ID_HERE', // Find in URL: docs.google.com/spreadsheets/d/[SHEET_ID]/edit
  TAB_NAME: 'Issue Reports',
  EMAIL: 'your.email@example.com', // Your email
  DIGEST_TIME_HOUR: 9 // 9 AM
};
```

5. **Run Test**: Click `testSetup` function and click Run
   - Check Logs for ✅ success messages
   - Should create a test row in your sheet

6. **Deploy as Web App**:
   - Click **Deploy → New Deployment**
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy**
   - Copy the **Web App URL**

### 3. Update Frontend

1. Open `/src/js/components/headlineSummaryModal.js`
2. Find line 454:
```javascript
const SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
```
3. Replace with your Web App URL
4. Remove the TODO comment

### 4. Set Up Daily Email Trigger

1. In Apps Script, click **Triggers** (clock icon on left)
2. Click **+ Add Trigger**
3. Settings:
   - Function: `sendDailyDigest`
   - Event source: **Time-driven**
   - Type: **Day timer**
   - Time: **9am to 10am** (or your preference)
4. Click **Save**

---

## Testing

### Test Frontend (Browser Console):
1. Open headlines page: http://localhost:5173/headlines-trinidad.html
2. Click a headline card to open summary modal
3. Click "Report an issue with this story"
4. Select an issue type
5. Add details (optional)
6. Click Submit
7. Check browser console - should show "Issue Report: {...}"

### Test Backend:
1. In Apps Script, go to **Executions** (left sidebar)
2. Should see successful execution
3. Check "Issue Reports" tab - new row should appear

### Test Email Digest:
Run `sendDailyDigest()` function manually to test email format

### Test Rate Limiting:
Try submitting 4 reports in one session - 4th should be blocked

---

## Sheet Columns Explained

| Column | Description |
|--------|-------------|
| **Timestamp** | When report was submitted (auto) |
| **Issue Type** | incorrect-location, wrong-crime-type, duplicate, inaccurate-info, other |
| **Details** | User's additional comments (optional) |
| **Headline** | Crime headline being reported |
| **Crime Type** | Murder, Robbery, etc. |
| **Date** | Crime date |
| **Location** | Street address or area |
| **Area** | General area/neighborhood |
| **Country** | Trinidad, Guyana, etc. |
| **URL** | Source article URL |
| **Plus Code** | Google Plus Code location |
| **Page URL** | Where user submitted from |

---

## Email Digest Sample

You'll receive ONE email per day with all reports:

```
Subject: Crime Hotspots: 3 Issue Reports - November 27, 2025

📊 Daily Issue Reports
3 issue reports submitted on November 27, 2025

Report 1: 📍 Incorrect Location
Submitted: Nov 27, 2025 10:23 AM
Crime: Man shot in Diego Martin
Type: Shooting | Date: 2025-11-26
Location: Diego Martin, Trinidad
User Details: Location should be Upper Santa Cruz, not Diego Martin proper
[View Source Article] | [View Report Page]

...
```

---

## Monitoring & Maintenance

### Check for Abuse:
- Look for repetitive submissions from same timestamp range
- Check "Details" field for spam/offensive content
- If you see abuse patterns, you can:
  - Lower MAX_REPORTS in frontend (line 362)
  - Add more aggressive rate limiting
  - Add Cloudflare Turnstile

### Sheet Maintenance:
- Archive old reports quarterly
- Delete obvious spam entries
- No need to clean up daily

### Quota Limits:
- Google Apps Script: 20,000 emails/day (you'll never hit this)
- Sheet size: Unlimited rows practically

---

## Troubleshooting

**"Failed to submit report"**
- Check Apps Script **Executions** for errors
- Verify SHEET_ID and TAB_NAME in CONFIG
- Make sure Web App is deployed with "Anyone" access

**"No email received"**
- Check spam folder
- Verify CONFIG.EMAIL is correct
- Run `sendDailyDigest()` manually to test
- Check if trigger is set up correctly

**"Reports not saving to sheet"**
- Run `testSetup()` function
- Check column headers match exactly
- Verify sheet permissions

---

## Security Notes

✅ **What's Protected:**
- Spam (3 per session limit)
- Basic bots (honeypot)
- XSS attacks (text sanitization)
- Email overload (daily digest)

⚠️ **What's NOT Protected:**
- Determined attackers with IP rotation (acceptable risk for this feature)
- Very sophisticated bots (would need Turnstile)

For this feature, the current protection is more than adequate. 99% of users will never abuse it.

---

## Future Enhancements (Optional)

- Add admin dashboard to review/action reports
- Auto-correct some issues (location, crime type)
- Track which issues get fixed
- User reputation system

---

**Questions?** Check the code comments in `issueReportHandler.gs`
