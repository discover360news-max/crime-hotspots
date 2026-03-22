---
title: Understanding Risk Scores
section: Understanding the Data
summary: Risk scores (1–10) measure an area's relative crime density over the past 90 days compared to the national average — not the absolute number of crimes.
order: 1
related: [trend-indicators, data-coverage-limitations, comparing-areas]
date_updated: 2026-03-01
---

## Understanding Risk Scores

Every area on Crime Hotspots is assigned a risk score from 1 to 10. This score is displayed on area cards, area profile pages, and the dashboard.

## What the score means

The risk score measures an area's **relative share of national crime** over a 90-day rolling window — not the raw count of incidents.

This means:

- A score of **1–3** = low relative crime density (the area accounts for a small share of national crime)
- A score of **4–6** = moderate relative crime density
- A score of **7–10** = elevated relative crime density (the area accounts for a disproportionately high share of national crime)

## Why relative rather than absolute?

Raw counts are misleading. A large area will naturally have more incidents than a small one. By measuring each area's share of national crime rather than its total count, the risk score adjusts for area size and lets you compare neighbourhoods fairly.

## How is it calculated?

The algorithm:

1. Counts all verified incidents in the area over the past 90 days
2. Divides that count by the national total for the same period to get the area's share
3. Scales that share to a 1–10 score, weighted so that high-crime outlier areas reach 9–10 without compressing the rest of the scale

The score self-calibrates as new data comes in — it is recalculated on every daily build.

## Limitations

- **Lag**: the score reflects the past 90 days. A sudden spike may take a few days to fully register after articles are processed.
- **Coverage**: areas with very few incidents (or no incidents in the window) default to a low score. Absence of data is not the same as confirmed safety.
- **Relative, not absolute**: a score of 8 means the area is relatively high-crime compared to other areas — it does not mean 80% of crimes happen there.

For full technical details, see the [Methodology](/methodology/) page.
