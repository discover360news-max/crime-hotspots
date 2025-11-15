# Cost Analysis & Free Tier Optimization
## Comprehensive Breakdown of Automation Costs

**Last Updated:** 2025-11-07
**Current Setup:** 100% Free Tier
**Projected at Scale:** $0/month for 10+ countries

---

## Executive Summary

The Crime Hotspots automated data pipeline is designed to operate entirely within free tiers of Google and other services. This analysis demonstrates:

1. **Current Cost:** $0/month (Trinidad & Tobago)
2. **5 Countries:** $0/month (well within free limits)
3. **10 Countries:** $0/month (at ~30% of free tier capacity)
4. **Breaking Point:** 25+ countries before any paid services needed
5. **Estimated Manual Work Savings:** $800-1,200/month (15-20 hours/week at $12-15/hour)

---

## Service-by-Service Breakdown

### 1. Google Gemini API (AI Extraction)

#### Free Tier Details
- **Model:** Gemini 1.5 Flash
- **Rate Limit:** 60 requests per minute (RPM)
- **Daily Quota:** 1,500 requests per day
- **Monthly Quota:** ~45,000 requests/month
- **Cost:** $0

#### Usage Calculation

**Per Country:**
- Average crime articles/day: 30
- Days/month: 30
- Monthly requests: 30 × 30 = 900 requests/month

**Scaling:**
| Countries | Articles/Day | Requests/Month | % of Free Tier | Cost |
|-----------|--------------|----------------|----------------|------|
| 1 (T&T) | 30 | 900 | 2% | $0 |
| 3 | 90 | 2,700 | 6% | $0 |
| 5 | 150 | 4,500 | 10% | $0 |
| 10 | 300 | 9,000 | 20% | $0 |
| 20 | 600 | 18,000 | 40% | $0 |
| 50 | 1,500 | 45,000 | 100% | $0 |

**Paid Tier (if needed):**
- Cost: $0.000075 per request (Gemini 1.5 Flash)
- 1,000 requests = $0.075
- 10,000 requests = $0.75/month

**Breaking Point:**
- Need 50+ countries to exceed free tier
- At 51 countries: ~$0.75/month for overages

#### Optimization Strategies
1. **Batch Processing:** Process articles in hourly batches (not real-time)
2. **Smart Filtering:** Only send crime-relevant articles to AI (keyword pre-filter)
3. **Caching:** Store AI responses to avoid re-processing if article updated
4. **Retry Logic:** Don't count failed requests against quota

---

### 2. Google Maps Geocoding API

#### Free Tier Details
- **Credit:** $200/month free
- **Cost per Request:** $0.005 (Dynamic Geocoding)
- **Free Requests:** $200 ÷ $0.005 = 40,000 requests/month
- **Monthly Quota:** 40,000 requests

#### Usage Calculation

**With Caching Strategy:**
- Each unique address geocoded once → cached forever
- New addresses/month (per country): ~200-300
- Repeated addresses: Served from cache (no API call)

**Scaling:**
| Countries | New Addresses/Month | API Calls | % of Free Tier | Cost |
|-----------|---------------------|-----------|----------------|------|
| 1 | 250 | 250 | 0.6% | $0 |
| 3 | 750 | 750 | 1.9% | $0 |
| 5 | 1,250 | 1,250 | 3.1% | $0 |
| 10 | 2,500 | 2,500 | 6.3% | $0 |
| 20 | 5,000 | 5,000 | 12.5% | $0 |
| 50 | 12,500 | 12,500 | 31.3% | $0 |

**Breaking Point:**
- Need 160+ countries to exceed free tier
- Realistically: Never exceeded due to caching

#### Optimization Strategies
1. **Aggressive Caching:** Cache geocoded addresses for 1 year
2. **Fuzzy Matching:** "123 Main St" vs "123 Main Street" → use cache
3. **Batch Geocoding:** Not available in free tier, but caching makes it unnecessary
4. **Client-Side Fallback:** If API fails, display address text without coordinates

---

### 3. Google Apps Script

#### Free Tier Details
- **Execution Time:** 6 minutes per execution
- **Trigger Quota:** 90 minutes/day of trigger runtime
- **Script Runtime:** Unlimited executions
- **Cost:** $0 (Always free)

#### Usage Calculation

**Per Execution:**
- RSS collection: ~30 seconds
- Article fetching: ~2 minutes (10 articles × 2 sec each + network)
- AI processing: ~3 minutes (15 articles × 12 sec each)
- Geocoding: ~1 minute (included in processing)

**Daily Runtime:**
- RSS collection (every 2 hours): 12 executions × 30 sec = 6 minutes
- Article fetching (hourly): 24 executions × 2 min = 48 minutes
- AI processing (hourly): 24 executions × 3 min = 72 minutes (EXCEEDS LIMIT!)

**Optimization Needed:**
Run AI processing every 2 hours (not hourly):
- AI processing (every 2 hours): 12 executions × 3 min = 36 minutes
- **Total daily runtime:** 6 + 48 + 36 = 90 minutes ✅ WITHIN LIMIT

**Scaling:**
| Countries | Daily Runtime | % of Free Tier | Status |
|-----------|---------------|----------------|--------|
| 1 | 90 min | 100% | ⚠️ At limit |
| 2 | 180 min | 200% | ❌ Over limit |
| 3 | 270 min | 300% | ❌ Over limit |

**Breaking Point:** 2+ countries exceeds daily runtime quota with current frequency

#### Solutions for Scaling
1. **Reduce Trigger Frequency:**
   - RSS collection: Every 3 hours (instead of 2)
   - Article fetching: Every 2 hours (instead of hourly)
   - AI processing: Every 3 hours (instead of 2)
   - New total: ~45 min/day → supports 2 countries

2. **Country Rotation:**
   - Process Country A on even hours, Country B on odd hours
   - Distributes load across 24 hours
   - Supports 4+ countries easily

3. **Parallel Executions:**
   - Split processing into multiple Apps Script projects
   - Each project: 90 min/day quota
   - 3 projects = 270 min/day = 3 countries

**Recommended:** Country rotation strategy (zero cost, simple implementation)

---

### 4. Google Sheets

#### Free Tier Details
- **Cell Limit:** 10 million cells per spreadsheet
- **File Size:** No explicit limit (but performance degrades >5 GB)
- **Sheets per File:** 200 sheets max
- **Cost:** $0 (Always free)

#### Usage Calculation

**Per Country Sheet Structure:**
- Raw Articles: ~10 columns × 5,000 rows = 50,000 cells
- Production: ~10 columns × 10,000 rows = 100,000 cells
- Review Queue: ~14 columns × 500 rows = 7,000 cells
- **Total per country:** ~157,000 cells

**Scaling:**
| Countries | Total Cells | % of Limit | Sheets Needed |
|-----------|-------------|------------|---------------|
| 1 | 157,000 | 1.6% | 1 |
| 5 | 785,000 | 7.9% | 1 |
| 10 | 1,570,000 | 15.7% | 1 |
| 20 | 3,140,000 | 31.4% | 1 |
| 50 | 7,850,000 | 78.5% | 1 |
| 64 | 10,048,000 | 100.5% | 2 |

**Breaking Point:** 64 countries before needing a second spreadsheet

#### Optimization Strategies
1. **Archive Old Data:** Move articles >90 days to separate archive sheet
2. **Separate Spreadsheets:** Use one per country if managing 10+ countries
3. **Database Alternative:** For 50+ countries, consider Supabase (PostgreSQL, free tier: 500 MB)

---

### 5. Additional Services

#### RSS.app (Optional RSS Aggregator)
- **Free Tier:** 5 feeds
- **Cost:** $0 for up to 5 feeds, $10/month for unlimited
- **Recommendation:** Use Google Apps Script RSS parser instead (free, unlimited)

#### IFTTT (Google Alerts Integration)
- **Free Tier:** 2 applets
- **Cost:** $0 for 2 applets, $2.50/month for 20 applets
- **Recommendation:** Use Gmail filters + Apps Script (free, unlimited)

#### n8n (Advanced Automation Alternative)
- **Self-Hosted:** Free forever
- **Cloud:** $20/month
- **Recommendation:** Use Google Apps Script (simpler, free, integrated)

#### Uptime Monitoring (Optional)
- **UptimeRobot:** 50 monitors free
- **BetterStack:** 10 monitors free
- **Cost:** $0
- **Use Case:** Monitor RSS feed availability

#### Error Tracking (Optional)
- **Sentry:** 5,000 events/month free
- **LogRocket:** 1,000 sessions/month free
- **Cost:** $0
- **Use Case:** Track Apps Script errors

---

## Total Cost Comparison

### Current Manual Process
**Assumptions:**
- 30 crime articles/day to manually enter
- 5 minutes per article (find, read, extract data, enter into sheet, geocode)
- 30 articles × 5 min = 150 minutes/day = 2.5 hours/day
- 2.5 hours/day × 7 days = 17.5 hours/week
- 17.5 hours/week × $12/hour (freelancer rate) = **$210/week**
- **Monthly cost:** $840/month

### Automated Process (Proposed)
**Assumptions:**
- 75% automation rate (25% still need manual review)
- 30 articles/day × 25% = 7.5 articles/day need review
- 7.5 articles × 2 min/article (quick review/approve) = 15 min/day
- 15 min/day × 7 days = 1.75 hours/week
- 1.75 hours/week × $12/hour = **$21/week**
- **Monthly cost:** $84/month

**Savings:**
- Weekly: $210 - $21 = **$189/week saved**
- Monthly: $840 - $84 = **$756/month saved**
- Annually: $9,072/year saved

**Plus:**
- API costs: $0/month
- Setup time investment: 10 hours (one-time)
- ROI timeframe: ~0.5 months

---

## ROI Analysis

### Initial Investment
- Setup time: 10 hours
- Your hourly rate (opportunity cost): $15/hour (conservative)
- Total investment: 10 × $15 = **$150**

### Monthly Savings
- Manual work reduction: $756/month
- API costs: -$0/month
- **Net savings:** $756/month

### ROI Timeline
- Break-even: $150 ÷ $756 = **0.2 months (6 days)**
- 1 year savings: $756 × 12 = **$9,072**
- 2 year savings: **$18,144**

**Conclusion:** Even accounting for your time, this pays for itself in under a week.

---

## Scaling Cost Projections

### Scenario A: 5 Caribbean Countries
**Countries:** Trinidad, Guyana, Barbados, Jamaica, Grenada
**Articles/Day:** ~150
**Manual Cost (without automation):** $2,100/month
**Automated Cost:**
- Gemini API: $0 (10% of free tier)
- Geocoding: $0 (cached)
- Apps Script: $0 (country rotation)
- Manual review: $105/month (1.25 hours/day)
- **Total:** $105/month
**Monthly Savings:** $1,995/month
**Annual Savings:** $23,940/year

### Scenario B: 10 Caribbean Countries
**Countries:** Full Caribbean region
**Articles/Day:** ~300
**Manual Cost:** $4,200/month
**Automated Cost:**
- Gemini API: $0 (20% of free tier)
- Geocoding: $0 (cached)
- Apps Script: $0 (multiple projects if needed)
- Manual review: $210/month (2.5 hours/day)
- **Total:** $210/month
**Monthly Savings:** $3,990/month
**Annual Savings:** $47,880/year

### Scenario C: 20+ Countries (Caribbean + Latin America)
**Articles/Day:** ~600
**Manual Cost:** $8,400/month
**Automated Cost:**
- Gemini API: $3/month (600 × 30 - 45,000 free = 3,000 overage × $0.001)
- Geocoding: $0 (cached)
- Apps Script: $0 (10 separate projects @ 90 min/day each)
- Supabase DB: $0 (replace Sheets, free tier: 500 MB)
- Manual review: $420/month (5 hours/day)
- **Total:** $423/month
**Monthly Savings:** $7,977/month
**Annual Savings:** $95,724/year

**Key Insight:** Even at massive scale (20+ countries), automation costs under $500/month while saving $8,000+/month in manual labor.

---

## Free Tier Limits Summary Table

| Service | Free Tier | Breaking Point | Cost After |
|---------|-----------|----------------|------------|
| **Gemini API** | 1,500 req/day | 50 countries | $0.075/1000 req |
| **Geocoding** | 40,000 req/month | Never (caching) | $5/1000 req |
| **Apps Script** | 90 min/day | 2 countries/project | $0 (add projects) |
| **Google Sheets** | 10M cells | 64 countries | $0 (add sheets) |
| **Gmail (notifications)** | 100 emails/day | 100+ countries | $0 (always free) |
| **Cloud Storage** | 15 GB (Drive) | 500+ countries | $1.99/100 GB |

**Overall Breaking Point:** 50+ countries before any paid service needed

---

## Cost Optimization Best Practices

### 1. Maximize Caching
- Cache geocoded addresses for 1 year
- Cache AI responses (in case of re-processing)
- Use Apps Script CacheService for frequently accessed data

### 2. Smart Filtering
- Filter articles before sending to AI (keyword matching)
- Don't process duplicates (check before API call)
- Skip non-crime articles early in pipeline

### 3. Batch Processing
- Process articles in batches (15-30 at a time)
- Reduces trigger executions (Apps Script quota)
- More efficient error handling

### 4. Country Rotation
- Distribute processing across 24 hours
- Process Country A at :00, Country B at :30
- Stays within Apps Script 90 min/day quota

### 5. Monitoring & Alerts
- Daily quota usage reports
- Alert when approaching limits (>80% utilization)
- Automatic throttling if nearing quota

---

## Monthly Cost Tracking Template

Create a Google Sheet to monitor costs:

```
| Month | Countries Active | Articles Processed | Gemini Calls | Geocoding Calls | Apps Script Runtime | Manual Review Hours | Notes |
|-------|------------------|-------------------|--------------|-----------------|---------------------|---------------------|-------|
| Jan 2025 | 1 (T&T) | 900 | 900 | 250 | 45 min/day | 8 hours | Initial launch |
| Feb 2025 | 2 (T&T, GUY) | 1,800 | 1,800 | 450 | 60 min/day | 12 hours | Added Guyana |
| Mar 2025 | 3 (+BAR) | 2,700 | 2,700 | 650 | 75 min/day | 16 hours | Added Barbados |
```

**Alerts:**
- Gemini calls > 30,000/month → Consider paid tier prep
- Geocoding > 30,000/month → Review caching strategy
- Apps Script > 70 min/day → Implement country rotation

---

## Alternative Cost Scenarios

### If Google APIs Became Paid-Only (Hypothetical)

**Alternative Stack (Still Free):**
1. **AI Extraction:** Hugging Face Inference API (free tier: 10,000 req/month)
2. **Geocoding:** Nominatim (OpenStreetMap, free, unlimited)
3. **Hosting:** GitHub Actions (2,000 minutes/month free)
4. **Database:** Supabase (500 MB free)
5. **Notifications:** Discord webhooks (free)

**Result:** Still $0/month with different tools

### If Scaling to 100+ Countries (Extreme Scale)

**Paid Tier Requirements:**
- Gemini API: ~$30/month
- Geocoding: ~$10/month (even with caching)
- Supabase Pro: $25/month (for better DB performance)
- **Total:** ~$65/month

**Manual work savings at 100 countries:**
- 3,000 articles/day × 5 min = 250 hours/day
- $3,000/day × 30 = $90,000/month manual cost
- **Net savings:** $89,935/month

---

## Conclusion

**Current State (1 Country):**
- Monthly cost: $0
- Manual work: 17.5 hours/week → 1.75 hours/week
- Savings: $756/month

**Scaled State (10 Countries):**
- Monthly cost: $0
- Manual work: 175 hours/week → 17.5 hours/week
- Savings: $3,990/month

**Breaking Point:**
- 50+ countries before any costs incurred
- $3-5/month for 50+ countries
- Still saving $10,000+/month in manual labor

**ROI:** Pays for itself in 6 days, saves $9,000+/year per country automated

**Verdict:** This architecture is not just "low cost" - it's essentially **free at scale** while providing massive labor savings.

---

## Next Steps

1. **Track Costs:** Create monthly cost monitoring sheet
2. **Set Alerts:** Configure alerts at 80% of free tier quotas
3. **Review Quarterly:** Assess if scaling requires optimization
4. **Plan Ahead:** If approaching 40+ countries, research paid tier options
5. **Document Savings:** Track actual time savings for ROI reporting

---

## Additional Resources

### Google Cloud Pricing Calculators
- Gemini API: https://ai.google.dev/pricing
- Google Maps Platform: https://mapsplatform.google.com/pricing/
- Apps Script Quotas: https://developers.google.com/apps-script/guides/services/quotas

### Free Tier Monitoring Tools
- Google Cloud Console → IAM & Admin → Quotas
- Apps Script Dashboard → Executions
- Manual tracking sheet (recommended)

### Cost Optimization Communities
- r/googlecloud (Reddit)
- Google Cloud Community Forums
- Stack Overflow (google-apps-script tag)
