# Crime Hotspots Automated Data Pipeline
## Workflow Architecture Overview

**Last Updated:** 2025-11-07
**Target Country:** Trinidad & Tobago (scalable to Caribbean region)
**Goal:** Reduce manual data entry by 70%+ while maintaining data quality

---

## Executive Summary

This document outlines a fully automated, serverless crime data collection and processing pipeline using **100% free tools**. The system is designed to:

1. **Monitor** Trinidad & Tobago news sources 24/7
2. **Extract** crime details using AI (dates, locations, victims, crime types)
3. **Validate** data quality with confidence scoring
4. **Integrate** seamlessly with existing Google Sheets infrastructure
5. **Scale** to multiple Caribbean countries with minimal configuration

**Estimated Manual Work Reduction:** 75-85%
**Monthly Cost:** $0 (free tiers only)
**Setup Time:** 4-6 hours initial configuration
**Maintenance:** ~30 minutes/week for quality review

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PHASE 1: DATA COLLECTION                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
            ┌───────▼──────┐ ┌─────▼─────┐ ┌──────▼──────┐
            │ RSS Feed      │ │ Google    │ │ IFTTT/      │
            │ Aggregator    │ │ Alerts    │ │ n8n         │
            │ (RSS.app)     │ │ (Email)   │ │ Webhooks    │
            └───────┬──────┘ └─────┬─────┘ └──────┬──────┘
                    │               │               │
                    └───────────────┼───────────────┘
                                    │
                            ┌───────▼────────┐
                            │ Google Sheets  │
                            │ "Raw Articles" │
                            │ (Staging Area) │
                            └───────┬────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────┐
│                    PHASE 2: AI DATA EXTRACTION                       │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                        ┌───────────▼───────────┐
                        │ Google Apps Script    │
                        │ (Triggers hourly)     │
                        │ - Fetches unprocessed │
                        │ - Calls AI API        │
                        │ - Parses responses    │
                        └───────────┬───────────┘
                                    │
                        ┌───────────▼───────────┐
                        │ Google Gemini API     │
                        │ (Free tier: 15 RPM)   │
                        │ - Extract crime date  │
                        │ - Classify crime type │
                        │ - Parse locations     │
                        │ - Extract victims     │
                        │ - Generate headlines  │
                        └───────────┬───────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────┐
│                    PHASE 3: VALIDATION & GEOCODING                   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
            ┌───────▼──────┐ ┌─────▼─────┐ ┌──────▼──────┐
            │ Confidence    │ │ Geocoding │ │ Duplicate   │
            │ Scoring       │ │ (Google   │ │ Detection   │
            │ (AI outputs)  │ │ Maps API) │ │ (fuzzy)     │
            └───────┬──────┘ └─────┬─────┘ └──────┬──────┘
                    │               │               │
                    └───────────────┼───────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────┐
│                    PHASE 4: DATA INTEGRATION                         │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                        ┌───────────▼───────────┐
                        │ Google Apps Script    │
                        │ - Append to prod sheet│
                        │ - Flag low confidence │
                        │ - Send notifications  │
                        └───────────┬───────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
            ┌───────▼──────┐ ┌─────▼─────┐ ┌──────▼──────┐
            │ Production   │ │ Review    │ │ Email       │
            │ Google Sheet │ │ Queue     │ │ Notification│
            │ (Public CSV) │ │ Sheet     │ │ (Gmail)     │
            └──────────────┘ └───────────┘ └─────────────┘
                    │
                    ▼
            ┌──────────────┐
            │ Looker Studio│
            │ Dashboard    │
            └──────────────┘
```

---

## Why This Architecture?

### Design Principles

1. **Serverless First:** No infrastructure to maintain (Google Apps Script runs everything)
2. **Free Tier Maximization:** Every component uses generous free tiers
3. **Data Quality Over Speed:** AI extraction with human review beats 100% automation
4. **Graceful Degradation:** System continues working if any component fails
5. **Audit Trail:** Every step logged for debugging and quality improvement

### Key Technology Choices

| Component | Tool | Why This Choice | Free Tier Limit |
|-----------|------|-----------------|-----------------|
| **News Monitoring** | RSS.app + Google Alerts | Most T&T news sites have RSS; Google Alerts catches outliers | RSS.app: 5 feeds free, Google Alerts: unlimited |
| **Article Storage** | Google Sheets | Already in stack; no learning curve; easy manual review | 10M cells/sheet |
| **AI Extraction** | Google Gemini 1.5 Flash | **60 RPM free tier** (vs OpenAI's 3 RPM), excellent at structured extraction | 1,500 requests/day free |
| **Geocoding** | Google Maps Geocoding API | $200/month free credit = ~40,000 requests | 40,000 req/month |
| **Orchestration** | Google Apps Script | Serverless, integrated with Sheets, runs on schedule | Unlimited executions (6 min timeout) |
| **Notifications** | Gmail (via Apps Script) | Native integration, no setup | 100 emails/day |
| **Duplicate Detection** | Custom fuzzy matching | Levenshtein distance algorithm (no external API needed) | N/A |

---

## Data Flow Example

### Input: Raw News Article
```
Title: "Rio Claro bar owner gunned down"
Published: November 3, 2025
Body: "A 58-year-old bar owner was shot and killed outside his
vehicle at Pool Village, Rio Claro on Saturday night. Police
identified the victim as Sylvan Boodan, also known as 'Lawa',
who operated a bar on San Pedro Road. The incident occurred
around 11:45 p.m. on November 2..."
```

### AI Extraction Prompt
```
Extract crime details from this Trinidad & Tobago news article:

ARTICLE: [full text]

Extract the following in JSON format:
- crime_date: actual date crime occurred (NOT article date)
- crime_type: Murder|Robbery|Assault|Shooting|Theft|Home Invasion|Other
- area: neighborhood/district in Trinidad & Tobago
- street: specific street address
- headline: concise 1-sentence summary (under 100 chars)
- details: 2-3 sentence description
- victims: array of {name, age, description}
- confidence: 1-10 (how certain you are about extracted data)
- ambiguities: list anything unclear that needs human review
```

### AI Output (Structured JSON)
```json
{
  "crime_date": "2025-11-02",
  "crime_type": "Murder",
  "area": "Brickfield",
  "street": "San Pedro Road, Pool Village, Rio Claro",
  "headline": "Rio Claro bar owner gunned down outside vehicle (Sylvan Boodan aka Lawa, 58)",
  "details": "A 58-year-old bar owner was shot and killed outside his vehicle at Pool Village, Rio Claro on Saturday night around 11:45 p.m.",
  "victims": [
    {"name": "Sylvan Boodan", "age": 58, "aliases": ["Lawa"]}
  ],
  "confidence": 9,
  "ambiguities": []
}
```

### Google Sheets Integration
```
Apps Script automatically:
1. Geocodes "San Pedro Road, Pool Village, Rio Claro" → lat/lon
2. Checks for duplicate (fuzzy match on victim name + date)
3. If confidence ≥ 7 → appends to production sheet
4. If confidence < 7 → adds to review queue
5. Sends daily digest email of flagged items
```

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Manual Work Reduction** | 75%+ | Time tracking before/after |
| **Data Accuracy** | 95%+ | Spot-check 20 random entries/week |
| **Processing Latency** | < 6 hours | Article published → Sheet updated |
| **False Positives** | < 5% | Non-crime articles flagged |
| **Duplicate Rate** | < 2% | Same crime entered twice |
| **Geocoding Accuracy** | 90%+ | Coordinates within T&T bounds |

---

## Next Steps

1. **Read:** `02-NEWS-SOURCES.md` - Trinidad & Tobago news source inventory
2. **Read:** `03-IMPLEMENTATION-GUIDE.md` - Step-by-step setup instructions
3. **Read:** `04-AI-EXTRACTION-SCRIPT.md` - Google Apps Script code
4. **Read:** `05-SCALABILITY-PLAN.md` - Multi-country architecture
5. **Read:** `06-COST-ANALYSIS.md` - Free tier limits and scaling economics

---

## Quick Start Summary

**Fastest Path to 70% Automation:**

1. **Week 1:** Set up Google Alerts for T&T crime news (2 hours)
2. **Week 2:** Deploy Google Apps Script AI extraction (3 hours)
3. **Week 3:** Test with 50 articles, tune prompts (2 hours)
4. **Week 4:** Go live, monitor quality for 2 weeks (30 min/day review)

**Total Setup Investment:** ~10 hours
**Ongoing Maintenance:** ~3 hours/week → ~30 minutes/week after month 3
