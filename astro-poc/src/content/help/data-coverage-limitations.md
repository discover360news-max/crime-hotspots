---
title: Data Coverage and Limitations
section: Understanding the Data
summary: Crime Hotspots reflects media-reported incidents, not official police records. Coverage gaps, reporting bias, and the 24-hour ingestion lag are known limitations to factor into any analysis.
order: 4
related: [understanding-risk-scores, crime-classification, citing-our-data]
date_updated: 2026-03-01
---

## Data Coverage and Limitations

This article is intended for journalists, researchers, and institutional clients who need to understand what Crime Hotspots data can and cannot support.

## What the data represents

Crime Hotspots data reflects **media-reported incidents** — not official police statistics. This is an important distinction:

- Our figures represent the subset of crimes that were reported by the media
- Unreported crimes, crimes with no media coverage, and incidents that were reported after our processing window may not appear
- Crime counts will typically be **lower than official police totals** because not every arrest, report, or investigation generates media coverage

## Geographic coverage

**Trinidad & Tobago**: Comprehensive coverage of all major regions. Rural and remote communities may be under-represented due to lower media presence.

**Jamaica**: Coverage is current to 2026. Full area-level data (individual parish sub-areas) is being expanded progressively.

## Known coverage gaps

- **Overnight incidents on Sundays**: some outlets do not publish weekend overnight stories until Monday, creating a brief delay
- **Tobago**: lower media volume means Tobago incidents are captured less frequently than Trinidad incidents
- **Rural Jamaica**: deep rural areas have fewer dedicated media monitors than Kingston and major parishes

## The 24-hour ingestion lag

Articles are processed once per day. An incident that occurred on a given day but was reported after the daily pipeline runs will appear the following day. Dates always reflect the **date of occurrence** (when the incident happened), not the publication date.

## Incident dating

Our AI extraction system attempts to identify the date the incident occurred. Where the article does not specify this (e.g. "police say the shooting occurred sometime last week"), the system uses the best available estimate. Dates with lower confidence are flagged internally. For trend research, we recommend using weekly or monthly aggregates rather than single-day counts.

## Not for legal or investigative use

Crime Hotspots is a public awareness tool. Data on this platform should not be used as evidence in legal proceedings or as the basis for police investigations. For formal data requests, contact the relevant national police service.

## Recommended use for researchers

- Use 30-day or 90-day aggregates, not daily counts
- Cross-reference with official crime statistics for any published research
- Cite Crime Hotspots as a media-derived secondary dataset (see [Citing Our Data](/help/citing-our-data/))
- Note the geographic coverage limitations for any area-level analysis
