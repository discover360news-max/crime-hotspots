# Deployment Automation Setup

**Status:** 📋 Documentation for Future Implementation
**When to Implement:** After Astro migration is complete and deployed to production

---

## Overview

Astro generates static HTML at **build time**, which means new crimes from your Google Sheets CSV won't appear until the site is rebuilt and redeployed. To solve this, we'll set up **automated daily rebuilds**.

---

## Recommended Solution: GitHub Actions Scheduled Rebuild

### Why This Approach?
- ✅ Fully automatic (set it and forget it)
- ✅ Free (GitHub Actions free tier: 2,000 minutes/month)
- ✅ Reliable (runs daily at set time)
- ✅ All pages stay in sync
- ✅ Perfect for crime data that's added throughout the day

### How It Works
1. Your Google Apps Script adds crimes to CSV throughout the day
2. At 6 AM daily (or your chosen time), GitHub Actions triggers
3. Cloudflare Pages rebuilds the site with latest CSV data
4. New crime pages go live automatically

---

## Implementation Steps

### Step 1: Create Cloudflare Deploy Hook

1. Go to **Cloudflare Pages Dashboard**
2. Select your site → **Settings** → **Builds & deployments**
3. Scroll to **Deploy Hooks**
4. Click **Add deploy hook**
5. Name: `Daily Rebuild`
6. Branch: `main` (or your production branch)
7. Click **Create**
8. **Copy the webhook URL** (you'll need this)

Example webhook URL:
```
https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/YOUR_HOOK_ID
```

---

### Step 2: Add Webhook to GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `CLOUDFLARE_DEPLOY_HOOK`
5. Value: Paste the webhook URL from Step 1
6. Click **Add secret**

---

### Step 3: Create GitHub Actions Workflow

Create a new file: `.github/workflows/daily-rebuild.yml`

```yaml
name: Daily Rebuild

on:
  schedule:
    # Runs every day at 6 AM UTC (1 AM EST, 2 AM AST Caribbean time)
    - cron: '0 6 * * *'
  workflow_dispatch: # Allows manual triggering from GitHub UI

jobs:
  rebuild:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Cloudflare Pages Deploy
        run: |
          curl -X POST "${{ secrets.CLOUDFLARE_DEPLOY_HOOK }}"

      - name: Log rebuild trigger
        run: echo "Site rebuild triggered at $(date)"
```

---

### Step 4: Test the Workflow

**Manual Test:**
1. Go to GitHub → **Actions** tab
2. Select **Daily Rebuild** workflow
3. Click **Run workflow**
4. Select branch: `main`
5. Click **Run workflow**
6. Watch the build in Cloudflare Pages dashboard

**Verify:**
- Check that Cloudflare Pages started a new build
- Wait for build to complete (~2-5 minutes)
- Visit your site and check for latest data

---

## Schedule Options

### Daily at 6 AM UTC (Recommended)
```yaml
- cron: '0 6 * * *'
```
Good for overnight crime processing. Crimes added during the day appear the next morning.

### Twice Daily (6 AM and 6 PM UTC)
```yaml
schedule:
  - cron: '0 6 * * *'   # Morning rebuild
  - cron: '0 18 * * *'  # Evening rebuild
```
Crimes appear twice a day (morning and evening updates).

### Every 6 Hours
```yaml
- cron: '0 */6 * * *'
```
Runs at: 12 AM, 6 AM, 12 PM, 6 PM UTC

### Business Hours Only (9 AM - 5 PM AST)
```yaml
schedule:
  - cron: '0 13 * * 1-5'  # 9 AM AST (Mon-Fri)
  - cron: '0 21 * * 1-5'  # 5 PM AST (Mon-Fri)
```

---

## Timezone Reference

**AST (Atlantic Standard Time) = UTC-4**

| Local Time (AST) | UTC Time | Cron |
|------------------|----------|------|
| 12 AM (midnight) | 4 AM     | `0 4 * * *` |
| 6 AM             | 10 AM    | `0 10 * * *` |
| 12 PM (noon)     | 4 PM     | `0 16 * * *` |
| 6 PM             | 10 PM    | `0 22 * * *` |

---

## Cost Breakdown

| Service | Usage | Cost |
|---------|-------|------|
| **Cloudflare Pages** | 500 builds/month free | $0 |
| **GitHub Actions** | 2,000 minutes/month free | $0 |
| **Total** | | **$0/month** |

**Note:** Even with 2 rebuilds per day, you only use 60 builds/month (well under the 500 free limit).

---

## Alternative: Webhook Trigger from Google Apps Script

If you want **immediate** updates when crimes are added:

**Add to your Google Apps Script** (after crime is added):

```javascript
function triggerRebuild() {
  const webhookUrl = 'YOUR_CLOUDFLARE_DEPLOY_HOOK_URL';

  try {
    const response = UrlFetchApp.fetch(webhookUrl, {
      method: 'POST',
      muteHttpExceptions: true
    });

    Logger.log('Rebuild triggered: ' + response.getResponseCode());
  } catch (error) {
    Logger.log('Rebuild trigger failed: ' + error);
  }
}

// Call after adding crime to Production sheet
function publishToProduction(crime) {
  // ... existing code to add crime ...

  // Trigger rebuild
  triggerRebuild();
}
```

**Pros:**
- Site updates immediately when crime added
- More responsive

**Cons:**
- Could trigger many rebuilds if multiple crimes added quickly
- Uses build minutes unnecessarily
- Adds complexity to Google Apps Script

**Recommendation:** Stick with scheduled rebuilds unless you need real-time updates.

---

## Monitoring & Troubleshooting

### Check Build Status
1. Go to Cloudflare Pages → Your site → **Deployments**
2. See latest build status and logs

### Check GitHub Actions Status
1. Go to GitHub → **Actions** tab
2. See workflow runs and status

### Common Issues

**Workflow not running:**
- Check cron syntax (use [crontab.guru](https://crontab.guru))
- Verify workflow file is in `.github/workflows/` folder
- Check GitHub Actions is enabled for your repo

**Build failing:**
- Check Cloudflare Pages logs for errors
- Verify CSV URL is accessible
- Test local build: `npm run build`

**Wrong time zone:**
- Cron uses UTC, not local time
- Adjust cron schedule for your timezone

---

## Future Enhancements

### Email Notifications on Build Failure
Add to workflow:

```yaml
- name: Send email on failure
  if: failure()
  uses: dawidd6/action-send-mail@v3
  with:
    server_address: smtp.gmail.com
    server_port: 465
    username: ${{ secrets.MAIL_USERNAME }}
    password: ${{ secrets.MAIL_PASSWORD }}
    subject: Crime Hotspots Build Failed
    to: your-email@example.com
    from: GitHub Actions
    body: The daily rebuild failed. Check Cloudflare Pages logs.
```

### Slack Notifications
Add Slack webhook to notify team of successful builds.

---

## When to Implement

**Before Production Launch:**
- ✅ Astro migration complete
- ✅ Site tested and working
- ✅ Deployed to Cloudflare Pages
- ✅ DNS configured

**Then:**
1. Create Cloudflare Deploy Hook
2. Add GitHub Secret
3. Create workflow file
4. Test manual trigger
5. Wait for first scheduled run
6. Verify daily rebuilds working

---

## Questions?

- Cron syntax help: [crontab.guru](https://crontab.guru)
- GitHub Actions docs: [docs.github.com/actions](https://docs.github.com/en/actions)
- Cloudflare Pages docs: [developers.cloudflare.com/pages](https://developers.cloudflare.com/pages)

---

**Status:** Ready for implementation after migration complete
**Last Updated:** December 12, 2025
