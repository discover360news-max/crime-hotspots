# Social Media Stats Automation - Zero Budget Solution

**Last Updated:** December 13, 2025
**Status:** Ready for Implementation  
**Budget:** $0/month (100% Free)  
**Approach:** Auto-generate stats → Manual posting with templates

---

## 🎯 Goal

Automatically calculate daily crime statistics and generate visual graphics, then post manually to social media using ready-made templates. No API costs, no paid tools, full control.

**What's Automated:**
- ✅ Daily stats calculation (6 AM)
- ✅ Chart image generation (QuickChart - free)
- ✅ Copy-paste ready text

**What's Manual:**
- 📱 Posting to X/Twitter, Facebook, Instagram, WhatsApp
- 🎨 Customizing graphics (optional)

---

## 📊 What Gets Posted

### Daily Posts (Mon-Sat)
```
🚨 Trinidad Crime Update - Dec 13, 2025

📊 Last 24 Hours:
• Total Incidents: 12 ↑
• Murders: 2 ↓
• Robberies: 7 ↑
• Hotspot: Laventille

Full dashboard: https://crimehotspots.com/trinidad/dashboard

#TrinidadCrime #CaribbeanSafety #CrimeStats
```
**Includes:** Bar chart image (auto-generated)

---

## 🛠️ Setup (30 minutes one-time)

### Step 1: Install Apps Script

1. Open Trinidad Google Sheet
2. Extensions → Apps Script
3. Create file: `socialMediaStats.gs`
4. Copy code from `google-apps-script/trinidad/socialMediaStats.gs`
5. Update `SOCIAL_CONFIG`:
   ```javascript
   const SOCIAL_CONFIG = {
     PRODUCTION_SHEET: 'Production',  // Your sheet name
     COLUMNS: {
       DATE: 0,        // Column A
       CRIME_TYPE: 2,  // Column C  
       AREA: 5         // Column F
     }
   };
   ```

### Step 2: Test & Activate

```javascript
// Test stats calculation
testStatsCalculation()

// Create stats sheet + first row
updateSocialStats()

// Set up 6 AM daily trigger
setupDailyTrigger()
```

Done! Stats now calculate automatically every morning.

---

## 📱 Daily Workflow (5 min/day)

**Every Morning:**

1. Open "Social Media Stats" sheet
2. Copy latest row data
3. Replace placeholders in template:
   ```
   🚨 Trinidad Crime Update - {{DATE}}
   
   📊 Last 24 Hours:
   • Total: {{TOTAL}} {{TREND}}
   • Murders: {{MURDERS}}
   • Robberies: {{ROBBERIES}}
   • Hotspot: {{TOP_AREA}}
   
   https://crimehotspots.com/trinidad/dashboard
   
   #TrinidadCrime #CrimeStats
   ```
4. Download chart image (click Chart URL column)
5. Post to X, Facebook, Instagram, WhatsApp
6. Mark as "Posted" in sheet

**That's it!** 5 minutes total.

---

## 🎨 Chart Image Generation (Free)

**QuickChart** generates chart images automatically:

```javascript
// Already included in socialMediaStats.gs
function generateChartUrl(stats) {
  const config = {
    type: 'bar',
    data: {
      labels: ['Murders', 'Robberies', 'Burglaries', 'Thefts'],
      datasets: [{
        data: [stats.murders, stats.robberies, stats.burglaries, stats.thefts],
        backgroundColor: ['#e11d48', '#f97316', '#eab308', '#06b6d4']
      }]
    },
    options: {
      title: { text: `Trinidad Crime Stats - ${stats.date}` }
    }
  };
  
  return `https://quickchart.io/chart?c=${encodeURI(JSON.stringify(config))}&width=1200&height=675`;
}
```

**Chart URL saved automatically in stats sheet → Click to download**

---

## 📋 Post Templates

### Template 1: Daily (Mon-Sat)
```
🚨 Trinidad Crime Update - {{DATE}}

📊 Last 24 Hours:
• Total: {{TOTAL}} {{TREND}}
• Murders: {{MURDERS}}
• Robberies: {{ROBBERIES}}
• Hotspot: {{TOP_AREA}}

https://crimehotspots.com/trinidad/dashboard

#TrinidadCrime #CaribbeanSafety
```

### Template 2: Weekly (Sunday)
```
📈 Trinidad Weekly Report

This Week vs Last Week:
• Total: {{THIS_WEEK}} ({{CHANGE}}%)
• Murders: {{MURDERS}} ({{TREND}})  
• Top Area: {{TOP_AREA}}

Read analysis: {{BLOG_LINK}}

#WeeklyCrimeStats #Trinidad
```

### Template 3: Monthly (1st)
```
🗓️ {{MONTH}} 2025 Summary

• Total: {{TOTAL}}
• Deadliest Day: {{DATE}} ({{COUNT}})
• Rate: {{CHANGE}}% vs last month

https://crimehotspots.com/trinidad/dashboard

#MonthlyCrimeStats
```

---

## 💰 Cost: $0/month

| Service | Cost |
|---------|------|
| Google Apps Script | Free |
| QuickChart API | Free (50K/mo) |
| Google Sheets | Free |
| Manual Posting | Free |
| **TOTAL** | **$0** ✅ |

---

## 🚀 Advanced: Weekly & Monthly Stats

Add to `socialMediaStats.gs`:

```javascript
function calculateWeeklyStats() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('Production');
  const data = sheet.getDataRange().getValues();
  
  const now = new Date();
  const weekAgo = new Date(now - 7*24*60*60*1000);
  const twoWeeksAgo = new Date(now - 14*24*60*60*1000);
  
  const thisWeek = data.filter(r => {
    const d = new Date(r[0]);
    return d >= weekAgo && d <= now;
  });
  
  const lastWeek = data.filter(r => {
    const d = new Date(r[0]);
    return d >= twoWeeksAgo && d < weekAgo;
  });
  
  const change = ((thisWeek.length - lastWeek.length) / lastWeek.length * 100).toFixed(1);
  
  Logger.log(`This week: ${thisWeek.length}, Last week: ${lastWeek.length}, Change: ${change}%`);
}
```

**Run manually on Sundays for weekly report**

---

## ✅ Quick Start Checklist

- [ ] Copy `socialMediaStats.gs` to Apps Script
- [ ] Update `SOCIAL_CONFIG` (sheet name, columns)
- [ ] Test with `testStatsCalculation()`
- [ ] Run `updateSocialStats()` once
- [ ] Set up trigger with `setupDailyTrigger()`
- [ ] Verify "Social Media Stats" sheet created
- [ ] Test chart URL (click link, see image)
- [ ] Make first manual post
- [ ] Establish daily 5-min routine

---

**Setup Time:** 30 minutes  
**Daily Time:** 5 minutes  
**Monthly Cost:** $0

Simple, effective, no budget needed! 🎉
