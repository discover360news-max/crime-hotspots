---
id: B031
type: bug
status: active
created: 2026-03-26
---

# B031 — Bulk import injection into Astro files must target frontmatter only

## What happened

A Python script was used to add `import HeroBg from '...'` to 12 Astro pages at once. The script scanned for the last line beginning with `import ` across the **entire file**, then inserted after it.

`dashboard.astro` has `import { ... }` statements inside `<script>` blocks (client-side ES module imports). The script found one of these as the "last import" and injected the Astro component import at line 677 — inside a `<script>` tag, not the frontmatter.

Result: `<HeroBg />` was used in the template but the component was not available in the Astro template scope. The dashboard rendered blank with no error in the build output.

## Why it silently passed the build

Astro compiles templates at build time. The misplaced import was treated as a client-side JS import (valid syntax in a `<script>` block). The template reference `<HeroBg />` silently resolved to nothing, producing an empty render.

## Rule

**When injecting Astro component imports programmatically, always scope the scan to the frontmatter only** — between the first and second `---` delimiters.

```python
# WRONG — scans entire file
for i, line in enumerate(lines):
    if line.strip().startswith("import "):
        last_import_idx = i

# CORRECT — scope to frontmatter (between first two ---)
in_frontmatter = False
fence_count = 0
for i, line in enumerate(lines):
    if line.strip() == "---":
        fence_count += 1
        if fence_count == 2:
            break
    if fence_count == 1 and line.strip().startswith("import "):
        last_import_idx = i
```

## Fix applied

Manually moved the misplaced import from line 677 (inside `<script>`) to line 28 in the frontmatter of `dashboard.astro`.
