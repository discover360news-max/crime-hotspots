# Social Media Stats Generator - Setup Guide

**Created:** December 25, 2025
**Purpose:** Automatically generate social media post text from Trinidad crime data

---

## 📋 What This Does

Generates ready-to-copy social media posts with:
- **Last 7 days vs Previous 7 days** crime comparison
- **Top 5 crime types** with percentage changes (↑ or ↓)
- **Top 3 hotspot areas**
- **3 formats:** Long (Facebook/WhatsApp), Medium (Instagram), Short (Twitter/X)

**Example Output:**
```
🇹🇹 Trinidad Crime Update (Dec 19-25)

📊 This Week vs Last Week:
• Murder: 15 incidents (+3, ↑25%)
• Robbery: 42 incidents (-5, ↓11%)
• Shooting: 28 incidents (+1, ↑4%)

🔥 Hotspots: Port of Spain (23), San Fernando (15), Arima (12)

View interactive dashboard: https://crimehotspots.com/trinidad/dashboard

#Trinidad #TnT #CrimeStats #PublicSafety #CaribbeanCrime
```

---

## 🚀 Setup Instructions

### Step 1: Copy Script to Google Apps Script

1. Open your **Trinidad Google Sheet** (the one with Production 2025, Production 2026 tabs)
2. Click **Extensions** → **Apps Script**
3. In the Apps Script editor, create a new file:
   - Click **+** next to "Files"
   - Name it: `socialMediaStats.gs`
4. Copy the entire contents of `google-apps-script/trinidad/socialMediaStats.gs` from this repo
5. Paste into the new file in Apps Script
6. Click **Save** (💾 icon)

---

### Step 2: Get Your Published CSV URL

1. In your Trinidad Google Sheet, click **File** → **Share** → **Publish to web**
2. In the "Link" tab:
   - **Entire Document** vs **Specific sheet:** Select **Production 2025** (or current year)
   - **Web page** vs **CSV:** Select **CSV**
3. Click **Publish**
4. Copy the generated URL (looks like: `https://docs.google.com/spreadsheets/d/e/.../pub?gid=1749261532&single=true&output=csv`)
5. **IMPORTANT:** Save this URL - you'll need it in the next step

---

### Step 3: Configure the Script

1. In Google Apps Script editor, find the function: `setupScriptProperties`
2. Click the **Run** button (▶️) next to the function name
3. **First time only:** You'll see "Authorization required"
   - Click **Review Permissions**
   - Select your Google account
   - Click **Advanced** → **Go to [Project Name] (unsafe)**
   - Click **Allow**
4. A dialog will appear asking for your CSV URL
5. Paste the URL you copied in Step 2
6. Click **OK**

---

### Step 4: Create the Output Sheet

1. Find the function: `setupSocialPostsSheet`
2. Click **Run** (▶️)
3. This creates a new sheet tab called **"Social Posts"** in your Trinidad spreadsheet
4. This is where your generated posts will appear

---

### Step 5: Test It!

1. Find the function: `generateDailyStats`
2. Click **Run** (▶️)
3. Check the **Execution log** (View → Logs)
   - You should see: "✅ Social media stats generated successfully!"
4. Go to your **Trinidad Google Sheet**
5. Click the **"Social Posts"** tab
6. You should see a new row with 3 versions of your post!

**If it works:** You're all set! 🎉
**If it fails:** Check the Execution log for error messages

---

### Step 6: Enable Daily Automation (Optional)

**Want stats auto-generated daily at 3 PM?**

1. Find the function: `setupDailyTrigger`
2. Click **Run** (▶️)
3. This creates a daily trigger that runs at 3 PM Trinidad time
4. Every day at 3 PM, fresh stats will appear in your "Social Posts" sheet

**To disable later:**
- In Apps Script, click **Triggers** (⏰ icon on left sidebar)
- Find the `generateDailyStats` trigger
- Click **⋮** (three dots) → **Delete trigger**

---

## 📱 How to Use

### Manual Generation (Anytime)

1. Open your Trinidad Google Sheet
2. Click **Extensions** → **Apps Script**
3. Find function: `generateDailyStats`
4. Click **Run** (▶️)
5. Go to "Social Posts" sheet and copy the text you need

### Automatic Generation (If trigger is set up)

1. Every day at 3 PM, check the "Social Posts" sheet
2. Copy the latest row (top row below headers)
3. Paste to your platforms:
   - **Facebook/WhatsApp:** Column B (Long Post)
   - **Instagram:** Column C (Medium Post)
   - **Twitter/X:** Column D (Short Post)

---

## 🔄 Year Transitions (Important!)

**When switching from 2025 → 2026:**

1. Publish your **Production 2026** sheet as CSV (File → Share → Publish to web)
2. Copy the new CSV URL
3. In Google Apps Script, run: `setupScriptProperties` again
4. Paste the **new 2026 CSV URL**
5. Done! The script now pulls from 2026 data

**Note:** For the first 2 weeks of January, stats may be incomplete (combines 2025 + 2026 data). This is expected and acceptable.

---

## 🐛 Troubleshooting

### "TRINIDAD_CSV_URL not set in Script Properties"
**Fix:** Run `setupScriptProperties()` and enter your CSV URL

### "No crimes found in last 7 days"
**Fix:** Check that your CSV URL points to the correct Production sheet (current year)

### "Unauthorized"
**Fix:** Re-run the function and complete the authorization flow (see Step 3)

### Posts are blank or show "N/A"
**Fix:** Verify your CSV is published correctly:
- Open the CSV URL in a browser
- You should see crime data in CSV format
- If you see HTML or "404", republish the sheet

---

## 📝 Tips

1. **Test before scheduling:** Always run `generateDailyStats` manually first to verify it works
2. **Keep history:** The sheet auto-keeps the last 30 generated posts for reference
3. **Edit before posting:** Feel free to tweak the generated text before posting
4. **Skip Canva:** Try posting text-only for a few weeks and track engagement - you might not need graphics!

---

## 📧 Questions?

If something isn't working, check the **Execution log** in Apps Script (View → Logs) for detailed error messages.
