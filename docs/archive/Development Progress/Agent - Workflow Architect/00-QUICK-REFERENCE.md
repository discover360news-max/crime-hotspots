# Quick Reference Card
## Crime Hotspots Automated Pipeline - At a Glance

**Created:** November 7, 2025 | **Version:** 1.0

---

## 30-Second Overview

Automated crime data pipeline that monitors Trinidad & Tobago news sources 24/7, uses AI to extract structured data, and publishes to your Google Sheets at zero cost. Reduces manual work from 17 hours/week to 1 hour/week.

---

## Where to Start

### First Time Setup (2-3 hours)
**Read:** `06-QUICK-START-GUIDE.md`
**Do:** Follow Phase 1-6 step-by-step
**Result:** Automated pipeline running

### Understanding the System (30 minutes)
**Read:** `README.md` → `01-WORKFLOW-OVERVIEW.md`
**Do:** Review architecture diagrams
**Result:** Understand how it works

### Technical Implementation (6 hours)
**Read:** `03-IMPLEMENTATION-GUIDE.md`
**Do:** Copy-paste code into Apps Script
**Result:** Full system operational

---

## Key Numbers

| Metric | Value |
|--------|-------|
| **Setup Time** | 2-6 hours |
| **Monthly Cost** | $0 |
| **Time Savings** | 16 hours/week |
| **Money Savings** | $780/month |
| **Automation Rate** | 75-85% |
| **Accuracy Target** | 95%+ |
| **Countries Supported** | 10+ (free tier) |

---

## Technology Stack

```
Data Collection:   Google Apps Script + RSS feeds
AI Extraction:     Google Gemini 1.5 Flash (free)
Geocoding:         Google Maps API (free tier)
Storage:           Google Sheets (free)
Orchestration:     Apps Script triggers (free)
Notifications:     Gmail (free)

TOTAL COST: $0/month
```

---

## File Guide

| File | Purpose | Read Time | When to Use |
|------|---------|-----------|-------------|
| `README.md` | Overview & navigation | 15 min | Start here |
| `00-QUICK-REFERENCE.md` | This file - quick lookup | 5 min | Reference |
| `01-WORKFLOW-OVERVIEW.md` | System architecture | 20 min | Understand design |
| `02-NEWS-SOURCES.md` | T&T news sources | 15 min | Data collection setup |
| `03-IMPLEMENTATION-GUIDE.md` | Complete code & setup | 60 min | Build the system |
| `04-SCALABILITY-PLAN.md` | Multi-country expansion | 30 min | Plan scaling |
| `05-COST-ANALYSIS.md` | Budget & ROI | 20 min | Financial planning |
| `06-QUICK-START-GUIDE.md` | 2-hour setup | 90 min | Fast implementation |
| `07-AI-PROMPT-ENGINEERING.md` | Optimize accuracy | 30 min | Improve quality |
| `08-WORKFLOW-DIAGRAM.txt` | Visual architecture | 10 min | See data flow |

**Total Documentation:** 180+ pages, 10+ hours of implementation guidance

---

## Essential Commands

### Google Apps Script Functions (Run Manually)

```javascript
// Test individual components
testRSSCollection()         // Verify RSS feeds working
testGeminiExtraction()      // Test AI extraction
testGeocoding()             // Test geocoding
testDailySummary()          // Test email notifications

// Production functions (automated via triggers)
collectAllFeeds()           // Collect RSS articles
fetchPendingArticleText()   // Get full article text
processReadyArticles()      // AI extraction + geocoding

// One-time setup
setGeminiApiKey()           // Save API key securely
```

---

## Workflow Summary

```
┌─────────────┐
│ News RSS    │ Every 2 hours
│ Feeds       │────────────┐
└─────────────┘            │
                           ▼
                    ┌─────────────┐
                    │ Raw         │
                    │ Articles    │
                    └──────┬──────┘
                           │ Every 1 hour
                           ▼
                    ┌─────────────┐
                    │ Full Text   │
                    │ Extraction  │
                    └──────┬──────┘
                           │ Every 1 hour
                           ▼
                    ┌─────────────┐
                    │ AI          │
                    │ Extraction  │
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │ Confidence Score        │
              │ High (≥7) │ Low (<7)    │
              ▼           ▼             │
       ┌───────────┐ ┌───────────┐     │
       │Production │ │  Review   │     │
       │  Sheet    │ │  Queue    │     │
       └─────┬─────┘ └─────┬─────┘     │
             │             │            │
             │             ▼            │
             │      ┌───────────┐       │
             │      │  Manual   │       │
             │      │  Review   │       │
             │      └─────┬─────┘       │
             │            │             │
             └────────────┴─────────────┘
                          │
                          ▼
                  ┌───────────────┐
                  │ Crime Hotspots│
                  │ Web App       │
                  └───────────────┘
```

---

## Common Tasks

### Daily Maintenance (5 minutes)
1. Open "Review Queue" sheet
2. Review flagged items (confidence <7)
3. Approve/edit/reject each item
4. Move approved items to Production sheet

### Weekly Check (15 minutes)
1. Spot-check 10 random auto-processed articles
2. Compare AI extraction to original article
3. Note any systematic errors
4. Check execution logs for failures

### Monthly Optimization (30 minutes)
1. Review accuracy statistics
2. Update AI prompts if needed
3. Add/remove news sources
4. Check API quota usage (<20% target)

---

## Troubleshooting Quick Fixes

### No articles collected
```
✓ Check RSS feed URLs in browser
✓ Run testRSSCollection() manually
✓ Verify triggers are active
```

### API key errors
```
✓ Run setGeminiApiKey() again
✓ Check API enabled in Cloud Console
✓ Verify key restrictions correct
```

### Poor extraction quality
```
✓ Review first 10 extractions manually
✓ Identify pattern in errors
✓ Adjust prompt in geminiClient.gs
✓ Lower confidence threshold temporarily
```

### Geocoding not working
```
✓ Enable Geocoding API in Cloud Console
✓ Test with testGeocoding()
✓ Check address format includes country
```

---

## API Quota Limits

| Service | Free Tier | Usage (1 Country) | Headroom |
|---------|-----------|-------------------|----------|
| Gemini | 1,500/day | 30/day | 98% available |
| Geocoding | 40,000/month | 250/month | 99% available |
| Apps Script | 90 min/day | 45 min/day | 50% available |

**Warning Threshold:** Alert if any quota >80% used

---

## Support Resources

### Documentation
- Setup: `06-QUICK-START-GUIDE.md`
- Troubleshooting: `03-IMPLEMENTATION-GUIDE.md` (Phase 8)
- Optimization: `07-AI-PROMPT-ENGINEERING.md`

### External Links
- Apps Script Docs: https://developers.google.com/apps-script
- Gemini API Docs: https://ai.google.dev/docs
- Stack Overflow: Tag `google-apps-script`

### Error Logs
- Apps Script: Extensions → Apps Script → Executions
- Gemini API: Google Cloud Console → Quotas
- Sheets: Check "Notes" column for error messages

---

## Adding a New Country (Quick Checklist)

**Time Required:** 4 hours

- [ ] Research news sources (verify RSS feeds)
- [ ] Add to `countryConfig.gs` (5 min)
- [ ] Create country sheets (10 min)
- [ ] Test RSS collection manually (15 min)
- [ ] Run AI extraction on sample (30 min)
- [ ] Verify geocoding accuracy (30 min)
- [ ] Enable in production (`enabled: true`)
- [ ] Monitor for 1 week
- [ ] Create Looker Studio dashboard
- [ ] Update frontend `countries.js`

---

## Success Metrics After 1 Week

Expected results after 7 days of operation:

- ✅ 200+ articles collected
- ✅ 170+ auto-processed to production (85%)
- ✅ 30+ in review queue (15%)
- ✅ 90%+ accuracy on spot-checks
- ✅ 0-1 duplicate entries
- ✅ 85%+ geocoding success rate
- ✅ Time spent: <2 hours reviewing

If not meeting these, see troubleshooting guides.

---

## Next Steps After Setup

### Week 1-2: Stabilization
- Monitor daily
- Review all auto-processed articles
- Tune confidence threshold
- Optimize AI prompts

### Week 3-4: Optimization
- Achieve 95% accuracy target
- Reduce review queue to <10 items/day
- Document any edge cases
- Establish maintenance routine

### Month 2: Expansion
- Add Guyana (second country)
- Test multi-country architecture
- Verify API quotas scaling properly
- Update frontend for new country

---

## Emergency Contacts

### If System Goes Down
1. Check Apps Script execution logs
2. Verify all triggers are active
3. Test API keys: `Logger.log(getGeminiApiKey())`
4. Check Google Cloud Console for API status
5. Review daily summary emails for errors

### If Data Quality Drops Suddenly
1. Spot-check 20 recent extractions
2. Compare confidence scores to actual accuracy
3. Check if news sources changed format
4. Review AI prompt still appropriate
5. Temporarily lower confidence threshold

---

## Quick Wins

**Day 1:** Get RSS collection working (30 articles/day)
**Day 2:** Get AI extraction working (first 10 articles)
**Day 3:** Tune confidence threshold (85% auto-rate)
**Week 1:** Achieve 90% accuracy baseline
**Week 2:** Reduce review time to 15 min/day
**Month 1:** Add second country (Guyana)

---

## ROI Summary

| Timeline | Manual Cost | Automated Cost | Savings |
|----------|-------------|----------------|---------|
| Week 1 | $210 | $30 + $0 API | $180 |
| Month 1 | $840 | $120 + $0 API | $720 |
| Year 1 | $10,080 | $1,440 + $0 API | $8,640 |

**Break-even:** 6 days
**5-year savings:** $43,200

---

## Version History

**v1.0** - November 7, 2025
- Initial documentation package
- Trinidad & Tobago implementation
- Complete setup guides
- Scalability architecture

---

## Final Checklist Before Going Live

- [ ] API keys configured and tested
- [ ] All triggers set up and active
- [ ] Google Sheets structure created
- [ ] RSS feeds verified working
- [ ] AI extraction tested (10+ articles)
- [ ] Geocoding tested (5+ addresses)
- [ ] Email notifications working
- [ ] Manual review workflow documented
- [ ] First 24 hours monitored
- [ ] Accuracy spot-check completed

---

## Contact Information

**Project:** Crime Hotspots - Caribbean Crime Statistics
**Documentation:** 9 files, 180+ pages
**Code:** 1,000+ lines of production-ready JavaScript
**Setup Support:** All documentation in this folder

---

**Ready to start? Open: `06-QUICK-START-GUIDE.md`**

**Need overview first? Open: `README.md`**

**Want to see code? Open: `03-IMPLEMENTATION-GUIDE.md`**
