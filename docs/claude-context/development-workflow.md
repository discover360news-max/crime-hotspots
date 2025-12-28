# Development Workflow Reference

**For:** Development commands, deployment, and Git workflows

---

## Development Commands

**Working Directory:** `astro-poc/`

```bash
cd astro-poc
npm run dev      # Start dev server (port 4321, not 5173)
npm run build    # Build for production
npm run preview  # Preview production build
```

**Build Output:** `astro-poc/dist/` (1,300+ static HTML pages)

---

## Deployment

**Manual Deployment:**
1. Push to `main` branch
2. GitHub Actions builds from `astro-poc/`
3. Cloudflare Pages deploys automatically

**Automatic Deployment:**
- Daily rebuild at 6 AM UTC (2 AM Trinidad time) via GitHub Actions schedule
- Ensures new crime detail pages are generated for CSV updates

**Manual Trigger:**
- GitHub Actions UI → "Build and Validate" workflow → "Run workflow" button

---

## Git/GitHub Workflow

**Only commit when user requests.**

**Never:**
- Force push to main
- Skip hooks
- Commit secrets

**Commit format:**
```bash
git commit -m "Short title

- Change details

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## CSV URL Synchronization (CRITICAL)

**⚠️ IMPORTANT:** CSV URLs must be synchronized across multiple files to prevent duplicate data loading and year detection issues.

**Files That Must Match:**
1. `astro-poc/src/lib/crimeData.ts` (lines 27-34)
2. `astro-poc/src/pages/trinidad/dashboard.astro` (lines 400-405)

**Rules:**
- **ALWAYS update BOTH files** when changing CSV URLs
- Both files must point `current` to the same year sheet
- Both files must use the same duplicate prevention logic
- When `current` points to 2025 sheet, don't also load explicit 2025 sheet

**Current Configuration (December 2025):**
```typescript
const TRINIDAD_CSV_URLS = {
  2025: 'https://...gid=1749261532...',  // 2025 sheet
  current: 'https://...gid=1749261532...' // Currently pointing to 2025
  // Test 2026: 'https://...gid=1963637925...' (commented out)
};
```

**When Archiving to 2026 (Future):**
1. Update `current` URL in BOTH files to point to 2026 sheet
2. Keep 2025 as explicit year for historical access
3. Update year filter dropdowns will automatically detect new year
4. Test dashboard and headlines show correct current year

**Why This Matters:**
- Dashboard uses client-side CSV fetching (dashboard.astro)
- Headlines/archive use server-side fetching (crimeData.ts)
- Mismatch causes "flash" effect (shows 2025 then jumps to 2026)
- Duplicate loading wastes bandwidth and slows page load
