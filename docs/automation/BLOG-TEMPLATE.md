# Blog Post Template

**File Naming:** `trinidad-weekly-YYYY-MM-DD.md` or `guyana-weekly-YYYY-MM-DD.md`

**Location:** `astro-poc/src/content/blog/`

---

## Template Structure

Copy this template when creating a new blog post:

```markdown
---
title: 'Trinidad Crime Report: Week of [Month Day, Year] - [X] Incidents, [Y] Murders, [Z] [Crime Type]'
country: 'tt'
countryName: 'Trinidad & Tobago'
date: YYYY-MM-DD
excerpt: 'Analysis of [X] crime incidents reported this week. [Brief 1-sentence summary of main trend].'
author: 'Crime Hotspots Analytics'
readTime: '4 min read'
image: '/assets/images/report-hero.svg'
tags: ['Trinidad', 'Tobago', 'Trinidad & Tobago', 'Weekly Report', 'Statistics']
---

[PASTE GEMINI-GENERATED CONTENT HERE - WITHOUT THE TITLE LINE]
```

**NEW:** Gemini now generates the title for you! Copy it from the first line of Gemini's output.

---

## Frontmatter Fields Explained

| Field | Description | Example |
|-------|-------------|---------|
| `title` | SEO-optimized title with stats | `'Trinidad Crime Report: Week of December 17, 2025 - 47 Incidents, 8 Murders, 12 Robberies'` |
| `country` | Country code | `'tt'` (Trinidad) or `'gy'` (Guyana) |
| `countryName` | Full country name | `'Trinidad & Tobago'` or `'Guyana'` |
| `date` | Report end date (ISO format) | `2025-12-17` |
| `excerpt` | Short summary for blog index | 1-2 sentences, ~150 chars |
| `author` | Author name | `'Crime Hotspots Analytics'` |
| `readTime` | Estimated read time | `'4 min read'` (estimate 200 words/min) |
| `image` | Hero image path | `/assets/images/report-hero.svg` (default) |
| `tags` | Array of tags | `['Trinidad', 'Weekly Report', 'Statistics']` |

---

## Step-by-Step Workflow

### 1. Generate Data (Monday morning)

```bash
# In Google Apps Script Editor (Trinidad project):
# Run: generateBlogData()
# Copy the logger output
```

### 2. Generate Content with Gemini

1. Open Google AI Studio or Gemini Pro
2. Paste the full prompt from `BLOG-GENERATION-PROMPT.md`
3. Append the data from step 1
4. **NEW:** Gemini will output a **TITLE:** line first, then the content
5. Copy BOTH the title and content

### 3. Create Blog File

1. Open VS Code in your project
2. Create new file: `astro-poc/src/content/blog/trinidad-weekly-2025-12-23.md`
3. Copy the template above
4. Fill in frontmatter fields:
   - **title:** Copy from Gemini's **TITLE:** line (e.g., `Trinidad Crime Report: Week of December 23, 2025 - 47 Incidents, 8 Murders, 12 Robberies`)
   - **date:** `2025-12-23` (end of week, YYYY-MM-DD)
   - **excerpt:** Write 1-2 sentence summary based on Gemini output
5. Paste Gemini content below frontmatter (SKIP the TITLE: line)

### 4. Example Excerpt Generation

Based on Gemini output, write an excerpt like:

```
Analysis of 47 crime incidents this week shows a 12% decrease in violent crime.
Robberies in Port of Spain increased 18%, with most occurring during evening hours.
```

**Rules:**
- 1-2 sentences max
- Highlight main trend (increase/decrease in total OR major crime type)
- Mention notable geographic area if relevant
- ~120-180 characters ideal

### 5. Validate and Commit

```bash
# Test locally
cd astro-poc
npm run dev
# Visit http://localhost:4321/blog

# Build and check for errors
npm run build

# Commit and push
git add astro-poc/src/content/blog/trinidad-weekly-2025-12-23.md
git commit -m "Add Trinidad weekly report for December 23, 2025"
git push origin main
```

---

## Trinidad vs Guyana Differences

| Field | Trinidad Value | Guyana Value |
|-------|---------------|--------------|
| `country` | `'tt'` | `'gy'` |
| `countryName` | `'Trinidad & Tobago'` | `'Guyana'` |
| File name | `trinidad-weekly-*.md` | `guyana-weekly-*.md` |
| Tags | `['Trinidad', 'Weekly Report', 'Statistics']` | `['Guyana', 'Weekly Report', 'Statistics']` |

---

## Quality Checklist

Before committing, verify:

- [ ] Frontmatter is valid YAML (no syntax errors)
- [ ] Date is ISO format (YYYY-MM-DD)
- [ ] Date matches file name
- [ ] Excerpt is concise (1-2 sentences)
- [ ] Country code matches country name
- [ ] Tags array has 3 items
- [ ] Markdown content has proper headings (##, ###)
- [ ] Statistics match the Apps Script output
- [ ] No placeholder text ([X], [Area Name], etc.)
- [ ] Local build succeeds (`npm run build`)

---

## Troubleshooting

**Build fails with "Invalid frontmatter":**
- Check YAML syntax (proper quotes, no tabs)
- Ensure `date` is YYYY-MM-DD format
- Verify `tags` is an array with quotes: `['Trinidad', 'Weekly Report']`

**Blog post doesn't appear:**
- Ensure file is in `astro-poc/src/content/blog/`
- Ensure file ends with `.md`
- Check `date` is not in the future
- Run `npm run build` to see validation errors

**Excerpt too long on blog index:**
- Keep to ~150 characters
- Remove unnecessary details
- Focus on single main trend

---

## Future Enhancements

Ideas for when you want to expand:

- Custom hero images per post (generated or photo)
- Author profiles (if multiple writers)
- Related posts suggestions
- Crime type tagging for filtering
- RSS feed for blog
