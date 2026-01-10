# 🧪 Testing the Astro Migration

## Current Status

This is an **active migration** from Vite to Astro. We've completed:
- ✅ Crime pages (1,300+ individual pages)
- ✅ Monthly archives
- ✅ Static pages (About, FAQ, Methodology)
- ✅ Blog system with Content Collections

---

## Quick Start

```bash
cd astro-poc
npm run dev
```

Open: http://localhost:4322 (or check terminal for port)

**Note:** The CSV URL is already configured in `src/lib/crimeData.ts`

---

## What to Test

### ✅ 1. Static Pages (NEW - December 12, 2025)

#### About Page
Visit: http://localhost:4322/about

**Check:**
- Mission statement
- Data sources listed
- Frosted glass design (`bg-white/70 backdrop-blur-md`)
- Responsive layout

#### FAQ Page
Visit: http://localhost:4322/faq

**Check:**
- 13 questions across 4 categories
- Click questions to expand/collapse (accordion)
- View page source → Search for "schema.org" → FAQPage markup present
- Mobile responsive

#### Methodology Page
Visit: http://localhost:4322/methodology

**Check:**
- Detailed data collection process
- Google Gemini AI explanation
- Human validation workflow
- Privacy & ethics policy

### ✅ 2. Blog System (NEW - December 12, 2025)

#### Blog Index
Visit: http://localhost:4322/blog

**Check:**
- Grid layout with blog cards
- Country filter buttons (All, Trinidad & Tobago, Guyana)
- Click filters to test filtering
- 2 sample posts visible
- Frosted glass cards

#### Individual Blog Posts
Visit:
- http://localhost:4322/blog/trinidad-weekly-2025-11-10
- http://localhost:4322/blog/guyana-weekly-2025-11-10

**Check:**
- Markdown content rendered properly
- Social sharing buttons work (Facebook, X, WhatsApp, Copy Link)
- Click "Copy Link" → Should show "Copied!" confirmation
- Dashboard CTA links to correct country
- "Back to Blog" link works

### ✅ 3. Crime Pages

#### Individual Crime Pages
Visit: http://localhost:4322/trinidad/crime/[any-crime-slug]

**Check:**
1. View page source → Look for:
   - Unique `<title>` tag
   - `<meta name="description">` with crime summary
   - `<script type="application/ld+json">` (Schema.org NewsArticle)
   - Open Graph tags (`<meta property="og:...">`)
2. Breadcrumb navigation present
3. Related crimes section

#### Monthly Archives
Visit:
- http://localhost:4322/trinidad/archive/2025/12
- http://localhost:4322/trinidad/archive/2025/11

**Check:**
- Crime statistics summary
- Breakdown by type and region
- Complete crime list for that month
- Previous/Next month navigation
- Links to individual crime pages

#### Archive Index
Visit: http://localhost:4322/trinidad/archive

**Check:**
- Groups months by year
- Shows crime count per month
- Frosted glass design

---

---

## SEO Testing

### Test 1: View Page Source
1. Visit any page (crime, blog post, static page)
2. Right-click → View Page Source
3. Search for "schema.org" → See structured data markup
4. Check `<title>` and `<meta>` tags are unique per page

### Test 2: Lighthouse Score
1. Open Chrome DevTools (F12)
2. Go to "Lighthouse" tab
3. Run audit on any page
4. Target: 90+ SEO score

### Test 3: Social Media Preview
1. Copy any blog post or crime page URL
2. Use Facebook Debugger or Twitter Card Validator
3. Check preview image and description display correctly

---

## Build for Production

```bash
npm run build
```

**What happens:**
- Astro reads Trinidad CSV from Google Sheets
- Generates 1,300+ static HTML pages for crimes
- Generates archive pages
- Generates blog pages
- Output folder: `dist/`

**Check the output:**
```bash
ls -la dist/trinidad/crime/     # Crime pages
ls -la dist/blog/                # Blog pages
ls -la dist/                     # Static pages
```

---

---

## Key Advantages

### 1. **Auto-Generated Pages**
- 1,300+ crime pages (1 per crime from CSV)
- Monthly archive pages
- Blog posts from Markdown
- All with perfect SEO

### 2. **Content Collections**
Blog posts use Astro Content Collections:
- Type-safe frontmatter
- Automatic slug generation
- Built-in Markdown rendering
- Schema validation

### 3. **SEO Optimization**
Every page includes:
- Unique title and meta description
- Open Graph tags for social sharing
- Schema.org structured data
- Breadcrumb navigation
- Internal linking

### 4. **Performance**
- Static HTML generation
- <1 second load times
- No database queries
- CDN-friendly

### 5. **FREE Hosting**
Deploy to Cloudflare Pages:
- $0/month
- Automatic builds from Git
- Global CDN
- Unlimited bandwidth

---

---

## Migration Roadmap

### ✅ Completed
- Crime pages (individual + archives)
- Static pages (About, FAQ, Methodology)
- Blog system with Content Collections
- Homepage
- Layout with navigation/footer

### 🔄 In Progress
- Trinidad dashboard with Leaflet map
- Documentation updates

### 📋 Next Steps
1. Complete Trinidad dashboard
2. Test build and deployment
3. Add Guyana pages (mirror Trinidad structure)
4. SEO enhancements (sitemap, RSS feed)
5. Production deployment

---

## Questions?

### "Can I use my existing maps/charts?"
YES! Leaflet maps and Chart.js work in Astro with client-side scripts.

### "What about my Google Sheets automation?"
No changes needed. Astro reads the same CSV output.

### "How do I add a new blog post?"
1. Create a new `.md` file in `src/content/blog/`
2. Add frontmatter (title, country, date, excerpt, etc.)
3. Write content in Markdown
4. Astro auto-generates the page

### "How do I deploy?"
```bash
npm run build
git push origin main
# Cloudflare Pages auto-deploys
```

---

## Support

For issues or questions about this migration, check:
- README.md for project overview
- This file for testing guidance
- Astro docs: https://docs.astro.build
