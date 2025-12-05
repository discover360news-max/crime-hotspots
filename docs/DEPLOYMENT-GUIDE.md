# Deployment Guide - Crime Hotspots

This document provides step-by-step instructions for deploying changes to the live Crime Hotspots website.

---

## Overview

**Live Site:** https://crimehotspots.com
**Hosting:** Cloudflare Pages
**CI/CD:** GitHub Actions
**Deployment Method:** Auto-deploy from `main` branch

**How it works:**
1. Push code to `main` branch on GitHub
2. GitHub Actions automatically triggers build
3. Cloudflare Pages deploys the built site
4. Site is live within 1-2 minutes

---

## Pre-Deployment Checklist

Before pushing to live, ensure:

- [ ] **Local build succeeds:** Run `npm run build` with no errors
- [ ] **Dev server works:** Test all changes on `npm run dev` (port 5173)
- [ ] **No console errors:** Check browser console for JavaScript errors
- [ ] **Mobile responsive:** Test on mobile viewport (DevTools or real device)
- [ ] **All links work:** Verify navigation and external links
- [ ] **Git status clean:** All intended changes are staged

---

## Deployment Steps

### Step 1: Verify Local Build

```bash
# Build the project
npm run build

# Preview the production build
npm run preview
```

**What to check:**
- Build completes without errors
- Preview site works at http://localhost:4173
- All pages load correctly
- No missing assets or images

### Step 2: Check Git Status

```bash
# See all changes
git status

# View detailed diff
git diff

# View staged changes
git diff --cached
```

### Step 3: Stage Your Changes

```bash
# Stage specific files
git add <file1> <file2> <file3>

# Or stage all changes
git add .

# Verify what's staged
git status
```

### Step 4: Commit with Descriptive Message

```bash
git commit -m "$(cat <<'EOF'
Brief title describing the main change

Detailed changes:
- Change 1
- Change 2
- Change 3

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

**Commit message guidelines:**
- **Title:** Short (50 chars max), descriptive, imperative mood
- **Body:** Bullet points explaining what changed and why
- **Footer:** Claude Code attribution (if applicable)

### Step 5: Push to GitHub

```bash
# Push to main branch
git push origin main
```

**Expected output:**
```
To https://github.com/discover360news-max/crime-hotspots.git
   abc1234..def5678  main -> main
```

### Step 6: Monitor Deployment

1. **GitHub Actions:**
   - Visit: https://github.com/discover360news-max/crime-hotspots/actions
   - Watch the workflow run
   - Should complete in ~2-3 minutes

2. **Cloudflare Pages:**
   - Visit: https://dash.cloudflare.com (if you have access)
   - Check deployment status
   - Build typically takes 1-2 minutes

3. **Verify Live Site:**
   - Wait 2-3 minutes after push
   - Visit https://crimehotspots.com
   - Hard refresh (Cmd+Shift+R / Ctrl+Shift+F5) to clear cache
   - Test the specific changes you deployed

---

## Post-Deployment Verification

After deployment completes, verify:

- [ ] **Homepage loads:** https://crimehotspots.com
- [ ] **Navigation works:** Test all header links
- [ ] **Dashboards load:** Trinidad and Guyana dashboards
- [ ] **Headlines load:** Both Trinidad and Guyana headlines
- [ ] **New pages work:** If you added FAQ, Methodology, etc.
- [ ] **Mobile works:** Test on actual mobile device or DevTools
- [ ] **No broken images:** Check all images load
- [ ] **Console clean:** Open DevTools, check for errors

---

## Rollback Procedure

If something goes wrong after deployment:

### Option 1: Quick Fix (Preferred)

```bash
# Fix the issue locally
# Test with npm run dev
# Commit and push the fix
git add .
git commit -m "Fix: [describe the issue]"
git push origin main
```

### Option 2: Revert to Previous Commit

```bash
# See recent commits
git log --oneline -5

# Revert to previous commit
git revert HEAD

# Push the revert
git push origin main
```

### Option 3: Hard Reset (DANGEROUS - Use with Caution)

```bash
# Find the commit to reset to
git log --oneline -10

# Reset to that commit
git reset --hard <commit-hash>

# Force push (ONLY if absolutely necessary)
git push origin main --force
```

**WARNING:** Never force push unless it's an emergency. This can cause issues for other developers.

---

## Common Deployment Scenarios

### Scenario 1: SEO Meta Tags Update

```bash
# 1. Update meta tags in HTML files
# 2. Test locally
npm run dev

# 3. Build and verify
npm run build
npm run preview

# 4. Commit and push
git add index.html dashboard-*.html headlines-*.html
git commit -m "Update SEO meta tags for improved search visibility"
git push origin main
```

### Scenario 2: New Page Addition

```bash
# 1. Create new HTML file (e.g., faq.html)
# 2. Add to vite.config.js input configuration
# 3. Add navigation link in header.js
# 4. Test locally
npm run dev

# 5. Build and verify
npm run build
npm run preview

# 6. Commit and push
git add faq.html vite.config.js src/js/components/header.js
git commit -m "Add FAQ page with Schema.org markup"
git push origin main
```

### Scenario 3: JavaScript Bug Fix

```bash
# 1. Fix the bug in src/js/
# 2. Test thoroughly
npm run dev

# 3. Build and verify no errors
npm run build

# 4. Commit and push
git add src/js/components/example.js
git commit -m "Fix: Resolve date parsing issue in headlines"
git push origin main
```

### Scenario 4: Styling Changes

```bash
# 1. Update CSS or Tailwind classes
# 2. Test responsiveness
npm run dev

# 3. Build and verify
npm run build
npm run preview

# 4. Commit and push
git add src/css/styles.css about.html
git commit -m "Standardize typography across static pages"
git push origin main
```

---

## Environment-Specific Deployments

### Building for Specific Countries

Crime Hotspots supports country-specific builds:

```bash
# Build for all countries (default)
npm run build

# Build for Trinidad only
VITE_COUNTRY_FILTER=trinidad npm run build

# Build for Guyana only
VITE_COUNTRY_FILTER=guyana npm run build
```

**Note:** The production deployment uses the default (all countries) build.

---

## Monitoring and Alerts

### GitHub Actions Status

- **Email notifications:** Configured for workflow failures
- **Badge:** Check README.md for build status badge
- **History:** View past deployments at https://github.com/discover360news-max/crime-hotspots/actions

### Cloudflare Pages Logs

If you have access to Cloudflare dashboard:
1. Login to Cloudflare
2. Navigate to Pages > crime-hotspots
3. View deployment logs
4. Check analytics for traffic patterns

### Google Analytics

Monitor site health:
- **Dashboard:** https://analytics.google.com
- **Property:** Crime Hotspots (G-JMQ8B4DYEG)
- **Check:** Real-time users, page views, errors

---

## Troubleshooting

### Build Fails Locally

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Try building again
npm run build
```

### Build Succeeds Locally, Fails on GitHub Actions

- **Check Node version:** GitHub Actions uses Node 18.x
- **Check dependencies:** Ensure package-lock.json is committed
- **Check file paths:** Case-sensitive on Linux (Cloudflare)

### Site Deploys but Pages Don't Load

- **Check vite.config.js:** Ensure all HTML files are in `input`
- **Check 404 errors:** Open DevTools Network tab
- **Clear CDN cache:** Wait 5 minutes or purge Cloudflare cache

### Changes Don't Appear on Live Site

- **Hard refresh:** Cmd+Shift+R (Mac) or Ctrl+Shift+F5 (Windows)
- **Clear browser cache:** Settings > Clear browsing data
- **Wait:** CDN propagation can take 1-5 minutes
- **Check deployment status:** Verify GitHub Actions completed

---

## Best Practices

### DO:
✅ Test locally before pushing
✅ Write descriptive commit messages
✅ Verify build succeeds (`npm run build`)
✅ Test on mobile viewport
✅ Check browser console for errors
✅ Deploy during low-traffic hours (if major changes)
✅ Monitor site for 5-10 minutes after deployment

### DON'T:
❌ Push directly to main without testing
❌ Force push to main (unless emergency)
❌ Skip commit messages or use vague ones
❌ Deploy breaking changes during peak hours
❌ Commit secrets or API keys
❌ Modify vite.config.js without understanding

---

## Emergency Contacts

If critical issues arise:

1. **GitHub Issues:** https://github.com/discover360news-max/crime-hotspots/issues
2. **Email:** discover360news@gmail.com
3. **Rollback:** Follow rollback procedure above

---

## Deployment Checklist (Quick Reference)

```bash
# 1. Test locally
npm run dev

# 2. Build successfully
npm run build

# 3. Check changes
git status
git diff

# 4. Stage files
git add <files>

# 5. Commit
git commit -m "Your message"

# 6. Push
git push origin main

# 7. Monitor
# - GitHub Actions: 2-3 minutes
# - Cloudflare Pages: 1-2 minutes
# - Verify live site

# 8. Test live site
# - Hard refresh
# - Test your changes
# - Check mobile
```

---

**Last Updated:** December 3, 2025
**Version:** 1.0
