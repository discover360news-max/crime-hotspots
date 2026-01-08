# Claude Context Documentation

**Purpose:** Detailed reference documentation for Claude Code to understand Crime Hotspots codebase.

**Last Updated:** January 6, 2026

---

## File Structure

### 🔧 MAINTENANCE-RULES.md
**What it contains:**
- Rules for keeping project memory files slim and purposeful
- What to keep vs remove from documentation
- Consolidation strategy and templates
- Anti-patterns to avoid
- Monthly maintenance checklist
- File size limits (CLAUDE.md: 300 lines, context files: 400 lines)

**When to reference:**
- Before adding accomplishments to any documentation
- Monthly review of file sizes
- When consolidating old features
- Creating new context documentation

---

### 📐 architecture.md
**What it contains:**
- Astro file-based routing system
- Complete directory structure
- Key files and their purposes
- Working with CSV data (server-side)
- Creating dynamic pages (SSG examples)
- Styling system overview

**When to reference:**
- Understanding how pages are auto-generated
- Looking up file locations
- Need examples of static site generation
- Questions about data fetching

---

### 🤖 automation.md
**What it contains:**
- Google Apps Script automation details
- Trinidad & Tobago data collection pipeline
- RSS feed sources and timing
- Facebook data collection (manual)
- Critical configuration rules
- Testing procedures

**When to reference:**
- Working on automation scripts
- Understanding data collection flow
- Troubleshooting automation issues
- Gemini AI integration details

---

### 🛠️ development-workflow.md
**What it contains:**
- Development commands (dev, build, preview)
- Deployment process (GitHub Actions → Cloudflare Pages)
- Git/GitHub workflow rules
- CSV URL synchronization (CRITICAL)
- Daily rebuild schedule
- Manual deployment trigger

**When to reference:**
- Starting development work
- Need deployment steps
- CSV URL configuration
- Git commit formatting

---

### ✨ recent-features.md
**What it contains:**
- Complete December 2025 feature implementations
- Dashboard trend indicators (30-day comparisons)
- Site-wide search (Pagefind)
- Modal navigation (Headlines, Archives, Dashboard)
- Loading states and UX improvements
- Cloudflare Turnstile integration
- Year filter system
- Dashboard refactoring details

**When to reference:**
- Understanding recent changes
- Looking for implementation examples
- Debugging recent features
- Technical notes on specific components

---

### 📊 status-and-roadmap.md
**What it contains:**
- ✅ Completed features list
- 🔄 In progress work
- 🐛 Known issues
- 📋 Priority queue for 2026
- Phased implementation plan (Years 1-3, 3-5, 5+)
- Monitoring strategy
- Vision and goals

**When to reference:**
- Quick status check
- Understanding project priorities
- Planning next features
- Long-term architecture decisions

---

## How to Use These Files

**For Claude Code:**
1. Start with `CLAUDE.md` in root for critical rules and quick reference
2. Dive into specific reference files when detailed information is needed
3. These files are READ-ONLY context - update `CLAUDE.md` for major changes

**For Developers:**
- Use as comprehensive project documentation
- Reference when onboarding new contributors
- Consult when making architectural decisions
- Update when implementing major features

---

## Related Documentation

**Design System:**
- `docs/guides/DESIGN-TOKENS.md` - Official design system (v1.0)
- `docs/guides/DESIGN-Guidelines.md` - Complete design framework (v2.0)
- `docs/guides/SEO-Framework.md` - SEO strategy and phased roadmap

**Automation:**
- `google-apps-script/trinidad/README.md` - Trinidad automation
- `docs/FACEBOOK-DATA-COLLECTION.md` - Facebook sources
- `docs/automation/` - Various automation guides

**Archive:**
- `docs/archive/Development Progress/` - Historical development logs

---

## Maintenance

**📋 See `MAINTENANCE-RULES.md` for complete guidelines on keeping project memory slim.**

**When to update these files:**
- New major features implemented (update recent-features.md and status-and-roadmap.md)
- Architecture changes (update architecture.md)
- Workflow changes (update development-workflow.md)
- Automation changes (update automation.md)
- Monthly consolidation (follow MAINTENANCE-RULES.md checklist)

**File size limits:**
- CLAUDE.md: Max 300 lines (reference index only)
- Context files: Max 400 lines each
- If a file grows too large, consolidate or archive old content
- Maintain clear, scannable structure with headings

**Monthly Checklist:**
- [ ] Check file sizes (use `wc -l` command)
- [ ] Consolidate accomplishments in recent-features.md
- [ ] Archive items older than 90 days to `docs/archive/accomplishments/`
- [ ] Remove code examples (keep file references)
- [ ] Update status-and-roadmap.md with current priorities

---

**Refactor History:**
- **January 6, 2026:** CLAUDE.md 965→260 lines (73% reduction), created MAINTENANCE-RULES.md
- **December 27, 2025:** Initial context file structure created (78% reduction from original)
