# Blog Generation Prompt for Gemini

**Purpose:** Convert weekly crime statistics into a professional, engaging blog post

**Usage:**
1. Run `generateBlogData()` in Google Apps Script (trinidad/blogDataGenerator.gs)
2. Copy the output data
3. Paste THIS PROMPT + THE DATA into Gemini
4. Copy Gemini's markdown output
5. Save as new file in `astro-poc/src/content/blog/`

---

## PROMPT FOR GEMINI

```
You are a professional crime analyst writing a weekly crime report blog post for Crime Hotspots Caribbean.

**YOUR TASK:**
Write a comprehensive, data-driven blog post analyzing the week's crime statistics for Trinidad & Tobago. The post should be informative, objective, and actionable.

**TONE & STYLE:**
- Professional and objective (journalism style)
- Data-driven with clear insights
- Avoid sensationalism or fear-mongering
- Focus on trends, patterns, and safety recommendations
- Use clear, accessible language (avoid jargon)

**CRITICAL: GENERATE SEO-OPTIMIZED TITLE FIRST**
Before writing the blog content, generate an SEO-friendly title in this exact format:

**TITLE:** Trinidad Crime Report: Week of [Month Day, Year] - [X] Incidents, [Y] Murders, [Z] [Next Highest Crime Type]

Examples:
- Trinidad Crime Report: Week of January 2, 2026 - 7 Incidents, 2 Murders, 3 Shootings
- Trinidad Crime Report: Week of December 16, 2025 - 32 Incidents, 5 Murders, 8 Robberies

Rules for title:
- Include total incidents
- Include murder count (always)
- Include the next highest crime type (Shooting, Robbery, etc.)
- Keep to 2-3 key statistics maximum
- Use full date format (Month Day, Year)

**REQUIRED STRUCTURE:**
Use this exact markdown structure (DO NOT include frontmatter - that will be added separately):

## Executive Summary
- 2-3 sentence overview of the week's data
- Highlight most significant trend (increase/decrease in total crimes OR notable crime type change)
- Brief mention of top hotspot area

## Key Statistics
Present as a bulleted list:
- **Total Incidents:** [number]
- **Murder:** [number] incidents (↑/↓ X% from last week)
- **Robbery:** [number] incidents (↑/↓ X% from last week)
- **Assault:** [number] incidents (↑/↓ X% from last week)
- [Other major crime types with changes]

## Regional Breakdown
Create subsections for top 3-5 areas:

### [Area Name]
- Brief description of incident count and trends
- Mention dominant crime type
- Note any specific concerns or patterns

## Crime Type Analysis
Create subsections for top 2-3 crime types:

### [Crime Type Name]
- Analyze the change (increase/decrease)
- Provide context about circumstances
- If data available, mention time-of-day or location patterns

### Time of Day Patterns (if time data is available)
- Present time period breakdown
- Identify peak crime hours
- Suggest why certain periods are higher risk

## Trends and Insights
Numbered list (3-4 insights):
1. **[Trend Title]:** Explanation
2. **[Pattern Observed]:** What the data reveals
3. **[Geographic/Temporal Pattern]:** Analysis

## Safety Recommendations
Bulleted list based on the data:
- Specific, actionable advice for residents
- Business owner recommendations (if commercial crimes are high)
- Community-level suggestions (neighborhood watch, etc.)
- Time-based precautions (if evening crimes are high)

## Methodology Note
Use this exact text:
"All data is sourced from verified media reports that may have been published by Trinidad Express, Guardian TT, Newsday, and CNC3 and reputable local Facebook Pages like Crime Watch between [dates]. Each incident has been cross-referenced with original source articles."

---
*Crime Hotspots provides data-driven insights to enhance public safety awareness. View our interactive dashboard for real-time statistics and detailed geographic analysis.*

---

**IMPORTANT RULES:**
1. **ALWAYS START WITH:** "**TITLE:** [your generated title]" on the first line
2. Use ONLY the data provided below - do not invent statistics
3. If a data category is missing, skip that section
4. Keep percentages to whole numbers (e.g., "12%" not "12.5%")
5. Use up/down arrows (↑/↓) for changes
6. Write in present/past tense (not future predictions)
7. Keep each section concise (3-5 sentences max)
8. Total length: 600-800 words
9. Use markdown formatting (##, ###, **, -, etc.)
10. DO NOT include YAML frontmatter (---) - that will be added separately

**DATA TO ANALYZE:**
[PASTE THE OUTPUT FROM generateBlogData() HERE]
```

---

## Example of Pasting

When you paste into Gemini, it should look like:

```
You are a professional crime analyst writing a weekly crime report...
[full prompt above]

**DATA TO ANALYZE:**

BLOG POST DATA
==============

**Report Period:** December 17 - December 23, 2025

**OVERALL STATISTICS**
- Total Incidents This Week: 47
- Total Incidents Last Week: 53
[rest of the data from Apps Script]
```

## Example of Gemini's Output

Gemini will now generate output like this:

```
**TITLE:** Trinidad Crime Report: Week of December 23, 2025 - 47 Incidents, 8 Murders, 12 Robberies

## Executive Summary

Trinidad and Tobago recorded a total of 47 criminal incidents during the week of December 17-23, 2025, representing a 11% decrease from the previous week's 53 incidents. The most significant trend observed was a concerning spike in armed robberies...

[rest of content]
```

**What you do:**
1. Copy the title: `Trinidad Crime Report: Week of December 23, 2025 - 47 Incidents, 8 Murders, 12 Robberies`
2. Paste it into the frontmatter `title:` field
3. Copy the content starting from `## Executive Summary`
4. Paste below the frontmatter

---

## After Gemini Generates the Post

1. **Copy the TITLE** from the first line of Gemini's output (e.g., "**TITLE:** Trinidad Crime Report: Week of...")
2. **Copy the markdown content** (everything AFTER the title line)
3. **Add frontmatter** at the top of your .md file:
   ```yaml
   ---
   title: '[PASTE THE TITLE HERE - without the TITLE: prefix]'
   country: 'tt'
   countryName: 'Trinidad & Tobago'
   date: YYYY-MM-DD
   excerpt: '[First 1-2 sentences from Executive Summary]'
   author: 'Crime Hotspots Analytics'
   readTime: '4 min read'
   image: '/assets/images/report-hero.svg'
   tags: ['Trinidad', 'Weekly Report', 'Statistics']
   ---
   ```
4. **Paste the content** below the frontmatter
5. **Save file** as `trinidad-weekly-YYYY-MM-DD.md` in `astro-poc/src/content/blog/`
6. **Commit and push** to GitHub
7. **Automatic build** will deploy to production

---

## Tips for Best Results

- Run the script on **Monday mornings** for fresh weekly data
- Review Gemini's output for accuracy before publishing
- Adjust prompt if tone/style needs tweaking
- Keep prompt version-controlled (update this file as needed)
