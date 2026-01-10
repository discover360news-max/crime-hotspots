# Project Cleanup Plan - January 2026

**Created:** January 10, 2026
**Status:** Proposed - Awaiting Approval
**Goal:** Remove deprecated Vite files, archive completed docs, maintain clean production codebase

---

## Summary

Since migrating from Vite to Astro (December 2025), the project has accumulated technical debt. This plan archives old files while preserving git history and project context.

**Approach:** Archive (don't delete) - Files moved to `docs/archive/vite-version/` for reference

---

## Phase 1: Archive Old Vite Application (Root Directory)

### HTML Files (14 files) - OLD VITE PAGES
```
about.html
blog-post.html
blog.html
dashboard-barbados.html
dashboard-guyana.html
dashboard-trinidad.html
faq.html
headlines-barbados.html
headlines-guyana.html
headlines-trinidad-and-tobago.html
index.html
methodology.html
report.html
turnstile-test.html
```
**Action:** Move to `docs/archive/vite-version/html-pages/`
**Reason:** Replaced by Astro .astro files in `astro-poc/src/pages/`

---

### Vite Config & Dependencies
```
vite.config.js
package.json (root)
package-lock.json (root)
```
**Action:** Move to `docs/archive/vite-version/config/`
**Reason:** Astro uses its own config in `astro-poc/`

---

### Vite Source Code
```
src/ (root folder)
  ├── assets/
  ├── css/
  └── js/
```
**Action:** Move to `docs/archive/vite-version/src/`
**Reason:** Replaced by `astro-poc/src/`

---

### Vite Build Output
```
dist/ (root folder)
```
**Action:** DELETE (not archive)
**Reason:** Old build artifacts, no historical value, large folder

---

### Vite Assets & Public
```
assets/ (root folder)
public/ (root folder)
icons/ (root folder - verify contents first)
```
**Action:** Move to `docs/archive/vite-version/assets/`
**Reason:** Assets now managed in `astro-poc/public/`

---

### Old Build Scripts
```
scripts/
  ├── generateBlogManifest.js
  ├── generateRSS.js
  └── generateSitemap.js
```
**Action:** Move to `docs/archive/vite-version/scripts/`
**Reason:** Astro has built-in sitemap/RSS via integrations

---

## Phase 2: Archive Completed Migration Docs (Root)

### Completed Project Docs
```
DEPLOYMENT-SUMMARY-2026-IMPROVEMENTS.md
MODULARITY-REFACTOR-SUMMARY.md
SESSION-SUMMARY-2025-11-26.md
FAVICON-SETUP-GUIDE.md (favicon complete)
```
**Action:** Move to `docs/archive/migration-2025/`
**Reason:** Migration complete, historical record only

---

### Guyana-Specific Docs (Not Live)
```
DEMO-PREPARATION-GUYANA.md
GUYANA-DASHBOARD-AUDIT-2025-11-24.md
GUYANA-DEPLOYMENT.md
```
**Action:** Move to `docs/archive/guyana-exploration/`
**Reason:** Guyana expansion shelved, not current focus

---

### Old Automation Docs
```
GEMINI-PROMPT-IMPROVEMENTS-2025-11-20.md
SOCIAL-MEDIA-AUTOMATION-OLD.md (has "OLD" in name!)
```
**Action:** Move to `docs/archive/gemini-automation/`
**Reason:** Gemini automation retired Jan 1, 2026 (manual workflow now)

---

### Outdated Project Context
```
PROJECT-MEMORY.md
```
**Action:** Review contents, archive if superseded by docs/claude-context/
**Reason:** May be outdated, verify first

---

## Phase 3: Clean Up astro-poc/ Directory

### Completed Audit/Testing Docs
```
astro-poc/DEPLOYMENT-AUTOMATION.md
astro-poc/MIGRATION-PROGRESS.md
astro-poc/TESTING-INSTRUCTIONS.md
astro-poc/SECURITY-AUDIT.md
astro-poc/UX-AUDIT-REPORT.md
```
**Action:** Move to `docs/archive/astro-migration/`
**Reason:** Migration/audits complete, site is live

---

## Phase 4: Verify KEEP Files (Do Not Move)

### Root Directory - KEEP
- ✅ `CLAUDE.md` - Project instructions (active)
- ✅ `.gitignore` - Git config
- ✅ `.env.example` - Environment template
- ✅ `google-credentials/` - API credentials (active)
- ✅ `google-credentials.json` - API key (active)
- ✅ `docs/` - Context documentation (active)
- ✅ `google-apps-script/` - Blog/social automation (active)
- ✅ `local-tools/` - Useful utilities (active)
- ✅ `local-fb-extractor-files/` - Credentials (active)

### astro-poc/ - KEEP (Current Production)
- ✅ All files EXCEPT those listed in Phase 3
- ✅ `README.md` - Astro-specific guide
- ✅ `package.json`, `tsconfig.json` - Active config
- ✅ `src/`, `public/`, `dist/` - Production source

---

## Execution Plan

### Step 1: Create Archive Structure
```bash
mkdir -p docs/archive/vite-version/{html-pages,config,src,assets,scripts}
mkdir -p docs/archive/migration-2025
mkdir -p docs/archive/guyana-exploration
mkdir -p docs/archive/gemini-automation
mkdir -p docs/archive/astro-migration
```

### Step 2: Move Files (Git Tracked)
```bash
# Use git mv to preserve history
git mv about.html docs/archive/vite-version/html-pages/
git mv vite.config.js docs/archive/vite-version/config/
# ... (repeat for each file)
```

### Step 3: Delete Build Artifacts
```bash
rm -rf dist/  # Old Vite build output
```

### Step 4: Update References
- Update `.gitignore` if needed
- Check CLAUDE.md for any outdated file references
- Update docs/INDEX.md if it references moved files

### Step 5: Commit Changes
```bash
git add .
git commit -m "Archive deprecated Vite files and completed migration docs

- Moved old Vite HTML/JS/CSS to docs/archive/vite-version/
- Archived completed migration docs to docs/archive/migration-2025/
- Archived Guyana exploration to docs/archive/guyana-exploration/
- Archived Gemini automation docs to docs/archive/gemini-automation/
- Deleted old dist/ build artifacts
- Preserves git history via git mv

Result: Clean root directory focused on live Astro production site"
```

---

## Expected Results

### Before Cleanup (Root Directory):
```
.
├── about.html
├── blog-post.html
├── dashboard-trinidad.html
├── vite.config.js
├── package.json
├── src/ (old Vite)
├── dist/ (old build)
├── assets/ (old)
├── astro-poc/ (current)
├── DEPLOYMENT-SUMMARY-2026-IMPROVEMENTS.md
├── GEMINI-PROMPT-IMPROVEMENTS-2025-11-20.md
└── ... (50+ files)
```

### After Cleanup (Root Directory):
```
.
├── CLAUDE.md
├── .gitignore
├── google-credentials/
├── google-apps-script/
├── local-tools/
├── docs/
│   ├── claude-context/
│   ├── guides/
│   └── archive/
│       ├── vite-version/
│       ├── migration-2025/
│       ├── guyana-exploration/
│       └── gemini-automation/
└── astro-poc/ (current production)
```

**Clean, focused, production-ready structure.**

---

## Risk Assessment

**Low Risk:**
- ✅ All moves use `git mv` (preserves history)
- ✅ Files archived, not deleted (can recover if needed)
- ✅ Only affects development environment (no production impact)
- ✅ Git history intact for all moved files

**Rollback Plan:**
```bash
git log --follow docs/archive/vite-version/html-pages/index.html
# Shows full history including when it was in root
```

---

## Review Checklist

Before executing:
- [ ] Verify astro-poc/ is current production site
- [ ] Confirm daily rebuilds working (no dependency on root files)
- [ ] Check no hardcoded paths to root HTML files
- [ ] Backup google-credentials/ separately (safety)
- [ ] Test build after cleanup: `cd astro-poc && npm run build`
- [ ] Review PROJECT-MEMORY.md contents before archiving

---

## Questions for Approval

1. **Phase 1 (Vite files)** - Safe to archive all?
2. **Phase 2 (Migration docs)** - Any docs still reference these?
3. **Phase 3 (astro-poc audits)** - Keep any for future reference?
4. **PROJECT-MEMORY.md** - Review contents first?
5. **Execution timing** - Do now or after current work complete?

---

**Status:** ⏳ Awaiting owner approval before execution
