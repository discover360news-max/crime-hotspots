# B030 — zsh glob expansion breaks `git add` on bracket filenames

**Status:** active
**Discovered:** 2026-03-25

---

## Problem

In zsh, filenames containing `[brackets]` (like Astro dynamic route files `[slug].astro`, `[category].astro`, etc.) are treated as glob character class patterns even when quoted:

```bash
git add "src/pages/blog/[slug].astro"
# → zsh: no matches found: src/pages/blog/[slug].astro
```

Both single and double quotes fail — zsh expands `[slug]` as a character class before passing to git.

## Fix

Use `noglob` before the command to disable glob expansion for that call:

```bash
noglob git add "src/pages/blog/[slug].astro" "src/pages/trinidad/area/[slug].astro"
```

Or for a large batch, stage the whole directory and then exclude what you don't want:

```bash
git add src/pages/ src/components/ src/data/
# then git restore --staged for anything you don't want
```

## When This Hits

Any `git add` (or `cp`, `mv`, `rm`) with a path containing `[...]` in zsh — common in Astro projects with dynamic routes like:
- `src/pages/blog/[slug].astro`
- `src/pages/trinidad/area/[slug].astro`
- `src/pages/trinidad/archive/[year]/[month].astro`
- `src/pages/trinidad/safety-tips/category/[category].astro`
