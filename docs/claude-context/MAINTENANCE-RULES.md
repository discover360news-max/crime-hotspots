# Project Memory Maintenance Rules

**For:** AI agents (Claude Code and future assistants) to maintain lean, purposeful documentation

**Last Updated:** January 6, 2026

---

## Core Principle

**Project memory exists to help AI agents understand the system, NOT to document every detail.**

Keep files slim, focused, and actionable. Remove historical cruft. Consolidate duplicate information. Write for efficient knowledge transfer.

---

## File Size Limits

**Hard Limits:**
- `CLAUDE.md`: Max 300 lines (reference index only)
- Context files: Max 400 lines each (architecture.md, automation.md, etc.)
- If a file exceeds limit, consolidate or split into sub-topics

**Check Trigger:**
- Monthly review of file sizes
- After major feature implementations
- When adding new accomplishments

---

## What to Keep vs. Remove

### ✅ KEEP (Essential for Understanding)

**Active Features:**
- How the system works NOW
- Current architecture and file structure
- Active integrations (Google Sheets, Gemini AI, Cloudflare)
- Critical rules and gotchas (CSV URL sync, victim count logic)
- Configuration patterns AI needs to replicate

**Technical Context:**
- Problem solved (1-2 sentences)
- Solution approach (high-level)
- Key learnings (prevent future bugs)
- Files affected (for reference)
- Current status (working/deprecated)

**Examples:**
```
KEEP: "Victim count only applies to PRIMARY crime type (related crimes always +1)"
REMOVE: "Example: Primary: Murder (victimCount=3), Related: [Shooting] → Murder +3, Shooting +1"

KEEP: "Dashboard uses client-side CSV fetching, Headlines uses server-side"
REMOVE: Detailed code examples showing both implementations

KEEP: "InfoPopup uses modal overlay with backdrop blur, global state management"
REMOVE: Step-by-step implementation details, CSS classes
```

### ❌ REMOVE (Clutters AI Context)

**Historical Details:**
- Step-by-step implementation narratives
- Multiple attempts/iterations ("Attempt 1: Failed, Attempt 2: Fixed")
- Bug stories unless the lesson is critical
- Commit hashes (unless absolutely needed)
- Dates older than 90 days (archive instead)

**Code Examples:**
- Remove unless pattern is reusable
- Link to actual file instead of pasting code
- Keep only configuration examples (CSV URLs, API patterns)

**Verbose Explanations:**
- Multi-paragraph "how we got here" stories
- Marketing-style "accomplishments" language
- Detailed user workflows (unless UX pattern reference)

---

## Consolidation Strategy

### When to Consolidate

**Trigger:** File exceeds 400 lines OR has 10+ accomplishments

**Action:**
1. Group by theme (Performance, UX, Automation, Data)
2. Merge similar accomplishments
3. Remove outdated details
4. Archive historical items to `docs/archive/`

### Consolidation Template

**Before (Verbose):**
```
### January 5, 2026 - Blog Banner & Headlines Timeline UX

**Problem Solved:**
Need to drive traffic to blog content and improve visual hierarchy on Headlines page...

**Accomplishments:**
1. **Blog Rotating Banner Component** ✅
   - Created reusable `BlogRotatingBanner.astro` component
   - Auto-rotates through latest 3 blog posts (5-second intervals)
   - Smooth slide-up animation with fade effect
   - Country-filtered (shows only Trinidad blog posts on Trinidad pages)
   - Links to main blog page on click
   - **Design:** Horn/megaphone icon, red text (rose-600), 1px rose border...
   [200 more lines]
```

**After (Consolidated):**
```
### Blog & Headlines UX (Jan 2026)

**Features:**
- BlogRotatingBanner component: Auto-rotates latest 3 posts, 5s intervals
- Headlines timeline: Mobile-only dotted line + red dots showing date hierarchy
- Mobile optimization: Half-height banner prevents screen domination

**Key Learnings:**
- Auto-rotation enhances discoverability without user interaction
- Timeline on mobile only - desktop grid has clear visual hierarchy already
- Subtle design wins - small dots + gray line provide structure without overwhelming

**Files:** `BlogRotatingBanner.astro`, `headlines.astro`
```

---

## CLAUDE.md Structure (Reference Index)

**CLAUDE.md should be a quick-start guide, NOT a complete manual.**

### Required Sections:

1. **Project Overview** (5-10 lines)
   - What the system does
   - Current status (production/development)
   - Tech stack (Astro, Google Sheets, Cloudflare)

2. **Owner Guidance** (5-10 lines)
   - Communication style
   - Token efficiency goals
   - Probing questions requirement

3. **Critical Rules** (20-30 lines)
   - Component-first principle
   - Design system check (DESIGN-TOKENS.md)
   - CSV URL synchronization
   - Automation rules (never change maxOutputTokens, etc.)

4. **Recent Accomplishments** (10-15 lines MAX)
   - Only last 2-3 major features with 1-2 line summaries
   - Link to `recent-features.md` for details

5. **Quick Reference** (10-15 lines)
   - Links to context files
   - Development commands
   - Current status (1 line)

6. **Total:** ~100-150 lines (room for expansion)

---

## Updating After Accomplishments

### Immediate Update (Same Session)

**Add to recent-features.md:**
- Feature name + date
- Problem solved (1-2 sentences)
- Solution approach (3-5 bullets)
- Key learnings (2-4 bullets)
- Files affected (list only)

**Add to CLAUDE.md:**
- 1-line summary in "Recent Accomplishments" section
- Update "Current Status" if production-ready

### Monthly Consolidation

**Review all context files:**
1. Merge accomplishments by theme
2. Remove code examples (keep file references)
3. Archive items older than 90 days
4. Check file size limits

**Archive to `docs/archive/accomplishments/YYYY-MM.md`:**
- Full details of all work from that month
- Code examples, screenshots, commit hashes
- Complete implementation narratives

---

## Purpose-Driven Documentation

### Ask Before Writing:

1. **Will an AI agent need this to understand the system?**
   - YES: Architecture patterns, critical rules, active features
   - NO: Implementation journey, multiple attempts, emotional context

2. **Does this prevent future bugs?**
   - YES: CSV URL sync, victim count logic, timezone edge cases
   - NO: "We tried X and it didn't work" (unless lesson is critical)

3. **Is this reusable knowledge?**
   - YES: Component patterns, design tokens, configuration examples
   - NO: One-time bug fixes, specific commit details

4. **Can this be found in code comments instead?**
   - If yes, remove from docs and add comment to code

---

## Anti-Patterns (DON'T Do This)

**❌ Implementation Narratives:**
```
"First we tried using PapaParse, but that didn't work because of SSR.
Then we switched to native fetch, which worked better.
Finally we added error handling and it's perfect now."
```
**✅ Instead:**
```
"CSV parsing uses native fetch() API (server-side at build time, no PapaParse)"
```

**❌ Multiple Iterations:**
```
"Attempt 1: Added ml-auto (pushed too far)
Attempt 2: Created separate div (not inline)
Final solution: Made section full-width with justify-between"
```
**✅ Instead:**
```
"Footer search button: Social section uses col-span-2 + justify-between for inline positioning"
```

**❌ Verbose Accomplishment Lists:**
```
"**Blog Rotating Banner Component** ✅
   - Created reusable `BlogRotatingBanner.astro` component
   - Auto-rotates through latest 3 blog posts (5-second intervals)
   - Smooth slide-up animation with fade effect..."
[15 more bullets]
```
**✅ Instead:**
```
"BlogRotatingBanner: Auto-rotates latest 3 posts (5s), frosted glass design, country-filtered"
```

---

## Template for Adding New Accomplishments

**Use this template when adding to recent-features.md:**

```markdown
### [Feature Name] ([Date])

**Problem:** [1-2 sentences max]

**Solution:**
- [High-level approach, 3-5 bullets]

**Key Learnings:**
- [Critical lessons that prevent future bugs, 2-4 bullets]

**Files:** [List only, no line numbers unless critical]

**Status:** ✅ Complete | 🔄 In Progress | ⚠️ Needs Testing
```

**What NOT to include:**
- Code examples (unless reusable pattern)
- Step-by-step implementation
- Bug iteration details
- Marketing language ("Accomplishments!", "Success!")
- Emotional context

---

## Archiving Old Accomplishments

### When to Archive

**Trigger:** Accomplishment is 90+ days old AND not actively referenced

**Action:**
1. Create `docs/archive/accomplishments/YYYY-MM.md` if not exists
2. Move full details to archive (keep code examples, narratives, commit hashes)
3. Leave 1-line summary in recent-features.md if feature is still active
4. Update status-and-roadmap.md "Completed Features" with consolidated entry

### Archive Structure

```
docs/archive/accomplishments/
├── 2025-12.md (December 2025 - detailed implementations)
├── 2026-01.md (January 2026 - detailed implementations)
└── README.md (index of archived months)
```

---

## Monthly Maintenance Checklist

**Run this every month:**

- [ ] Check file sizes (CLAUDE.md <300 lines, context files <400 lines)
- [ ] Consolidate accomplishments in recent-features.md
- [ ] Archive items older than 90 days to `docs/archive/accomplishments/`
- [ ] Remove code examples (keep file references)
- [ ] Update status-and-roadmap.md with current priorities
- [ ] Verify all links in CLAUDE.md point to correct files
- [ ] Remove duplicate information across context files

---

## For Future AI Agents

**When you're working on this project:**

1. **Read CLAUDE.md first** - Get critical rules and quick context
2. **Dive into context files** - Only when you need specific details
3. **Update immediately** - Add accomplishments to recent-features.md as you work
4. **Consolidate monthly** - Follow rules above to keep files lean
5. **Ask the owner** - If unsure whether to keep/remove something

**Your goal:** Make it easier for the NEXT AI agent, not harder.

---

**Remember:** Less is more. An AI agent with 50 lines of focused context performs better than one with 500 lines of historical cruft.
