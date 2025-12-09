# Monitoring Sheets Setup Guide

## Overview

The pre-filter system requires two monitoring sheets to track filtered articles and API usage. These sheets are currently referenced in `preFilter.gs` but need to be created manually in your Google Sheets.

**Spreadsheet:** Trinidad Crime Data Automation
**Status:** Ready for manual creation

---

## Sheet 1: Filtered Out Articles

**Purpose:** Logs all articles that were filtered out by the keyword scoring system (score < 10) for manual review and keyword tuning.

### Column Structure

| Column | Header | Data Type | Description |
|--------|--------|-----------|-------------|
| A | Timestamp | Date/Time | When the article was filtered |
| B | Title | Text | Article headline |
| C | Source | Text | News source (Trinidad Express, Guardian, Newsday) |
| D | URL | URL | Article link |
| E | Published Date | Date | Original publication date |
| F | Score | Number | Keyword score (will be < 10) |
| G | Matched Keywords | Text | Keywords that matched (format: "keyword(weight), keyword(weight)") |
| H | Reason | Text | Why filtered (e.g., "Low score", "Excluded by court keywords") |

### Setup Instructions

1. **Create new sheet:**
   - In your Trinidad automation spreadsheet
   - Name it exactly: `Filtered Out Articles`

2. **Add headers:**
   - Row 1 should contain all column headers above
   - Format row 1 as bold

3. **Freeze header row:**
   - View → Freeze → 1 row

4. **Optional formatting:**
   - Column A: Format → Number → Date time
   - Column D: Format → Number → Plain text (prevents URL auto-linking)
   - Column F: Format → Number → Number
   - Column E: Format → Number → Date

### Sample Data

```
Timestamp           | Title                              | Source            | URL                      | Published Date | Score | Matched Keywords        | Reason
2025-12-08 10:30:00 | Sports team wins championship      | Trinidad Express  | https://example.com/... | 2025-12-08     | -5    | sports(-10), team(5)    | Excluded by sports keywords
2025-12-08 11:15:00 | Man appears in court for theft     | Guardian          | https://example.com/... | 2025-12-07     | 3     | court(-10), theft(10), man(3) | Low score
```

### Usage

- **Review weekly:** Check for false negatives (crime articles that shouldn't have been filtered)
- **Keyword tuning:** Identify patterns in filtered articles to adjust keyword weights
- **Quality control:** Verify the pre-filter is working as intended

---

## Sheet 2: API Usage Tracker

**Purpose:** Tracks daily Gemini API calls to monitor free tier limits (20 requests per day).

### Column Structure

| Column | Header | Data Type | Description |
|--------|--------|-----------|-------------|
| A | Date | Date | Calendar date (YYYY-MM-DD) |
| B | Total Calls | Number | Total Gemini API requests for the day |
| C | Articles Processed | Number | How many articles were sent to Gemini |
| D | Pre-Filter Saved | Number | How many articles were filtered BEFORE Gemini |
| E | Savings Percentage | Percentage | (Pre-Filter Saved / Total Articles) × 100 |
| F | Errors | Number | API errors encountered |
| G | Notes | Text | Any issues or observations |

### Setup Instructions

1. **Create new sheet:**
   - In your Trinidad automation spreadsheet
   - Name it exactly: `API Usage Tracker`

2. **Add headers:**
   - Row 1 should contain all column headers above
   - Format row 1 as bold

3. **Freeze header row:**
   - View → Freeze → 1 row

4. **Add formula for column E:**
   - In cell E2, add formula: `=IF(C2>0, (D2/C2)*100, 0)`
   - Copy formula down the column

5. **Optional formatting:**
   - Column A: Format → Number → Date
   - Columns B, C, D, F: Format → Number → Number
   - Column E: Format → Number → Percent

6. **Conditional formatting (optional):**
   - Select column B (Total Calls)
   - Format → Conditional formatting
   - Format cells if... Greater than or equal to `20`
   - Background color: Red (warning - at free tier limit)

### Sample Data

```
Date       | Total Calls | Articles Processed | Pre-Filter Saved | Savings Percentage | Errors | Notes
2025-12-08 | 3           | 28                 | 25               | 89%                | 0      | Pre-filter working well
2025-12-09 | 5           | 34                 | 29               | 85%                | 0      |
2025-12-10 | 18          | 145                | 127              | 88%                | 0      | High volume day
2025-12-11 | 22          | 160                | 138              | 86%                | 2      | Hit free tier limit - errors at end
```

### Usage

- **Monitor daily:** Check that Total Calls stays under 20
- **Trend analysis:** Watch Savings Percentage to verify pre-filter effectiveness (target: 80-90%)
- **Alert system:** If Total Calls consistently hits 20, consider:
  - Increasing MIN_SCORE_TO_PROCESS (stricter filtering)
  - Running processing only once per day (overnight)
  - Adding more exclude keywords

---

## Integration with preFilter.gs

Once sheets are created, the pre-filter system will automatically log data:

### Filtered Articles Logging
```javascript
// In preFilter.gs line 569-595
function logFilteredArticle(article, scoring) {
  const sheet = ss.getSheetByName(MONITORING_SHEETS.FILTERED_OUT);
  if (!sheet) {
    Logger.log('⚠️ Filtered Out Articles sheet not found - skipping logging');
    return;
  }

  sheet.appendRow([
    new Date(),
    article.title,
    article.source,
    article.url,
    article.publishedDate,
    scoring.score,
    scoring.matchedKeywords.map(k => `${k.keyword}(${k.weight})`).join(', '),
    scoring.reason
  ]);
}
```

### API Usage Tracking
```javascript
// In processor.gs (future integration)
function trackApiUsage(articlesProcessed, errors) {
  const sheet = ss.getSheetByName(MONITORING_SHEETS.API_USAGE);
  if (!sheet) return;

  const today = Utilities.formatDate(new Date(), 'GMT-4', 'yyyy-MM-dd');
  const lastRow = sheet.getLastRow();

  // Check if today's row exists, update or create
  if (lastRow > 1) {
    const lastDate = sheet.getRange(lastRow, 1).getValue();
    if (Utilities.formatDate(new Date(lastDate), 'GMT-4', 'yyyy-MM-dd') === today) {
      // Update existing row
      const currentCalls = sheet.getRange(lastRow, 2).getValue();
      sheet.getRange(lastRow, 2).setValue(currentCalls + articlesProcessed);
      return;
    }
  }

  // Create new row for today
  sheet.appendRow([new Date(), articlesProcessed, ...]);
}
```

---

## Verification Checklist

After creating both sheets, verify:

- [ ] Sheet names are EXACTLY: `Filtered Out Articles` and `API Usage Tracker`
- [ ] Headers match the column structure above
- [ ] Row 1 is frozen for both sheets
- [ ] Column formatting applied (dates, numbers, percentages)
- [ ] Conditional formatting added to API Usage Tracker (optional)
- [ ] Formula in column E of API Usage Tracker working

---

## Next Steps

1. **Create both sheets** following the instructions above
2. **Upload updated preFilter.gs** to Google Apps Script
3. **Run test:** `testPreFilterOnRawArticles()` to verify system works
4. **Check sheets:** Verify filtered articles are being logged
5. **Monitor:** Watch API Usage Tracker to confirm staying under 20 RPD

---

**Created:** December 8, 2025
**Status:** Ready for manual setup
**Required By:** Pre-filter system integration
