---
title: Data Sources
section: Understanding the Data
summary: Crime Hotspots aggregates data from established regional media outlets, official police statements, and verified community sources — never unverified social media posts alone.
order: 3
related: [crime-classification, data-coverage-limitations, citing-our-data]
date_updated: 2026-03-01
---

## Data Sources

All crime data on Crime Hotspots is sourced from publicly available reports. We do not fabricate, estimate, or extrapolate incidents. Every record links back to the original source article.

## Trinidad & Tobago sources

Our T&T pipeline monitors the following outlets daily:

- Trinidad Express
- Newsday
- Guardian Media (Guardian TT)
- CNC3
- Loop TT
- High-traffic community sources (Ian Alleyne Network, DJ Sheriff Facebook pages)

Community sources are used to capture incidents that go unreported in traditional print media — particularly in rural and lower-income areas. Any incident sourced only from community channels is flagged internally and subject to stricter review before publication.

## Jamaica sources

Our Jamaica pipeline pulls from:

- Jamaica Gleaner
- Jamaica Observer
- Loop Jamaica
- RJR News

## Police statements

Official police press releases and gazette notices are ingested when available and take precedence over media accounts for crime type, date, and location accuracy.

## What we do not use

- Unverified social media posts (Instagram, TikTok, WhatsApp forwards)
- Anonymous tips (these go through the community report form and are reviewed before any record is created)
- Third-party data aggregators

## How articles become records

1. An RSS feed or scheduled scraper detects a new article
2. A pre-filter checks for relevance (must be a crime incident, not opinion or commentary)
3. Claude AI extracts structured fields: crime type, date of occurrence, location, victim details
4. The record is inserted into a review queue
5. High-severity incidents (murder, shooting, kidnapping) are reviewed by a human editor before publishing
6. The record is added to the database and appears on the site within 24 hours

For more on how records are structured, see [How We Classify Crimes](/help/crime-classification/).
