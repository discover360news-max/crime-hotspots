---
title: How We Classify Crimes
section: Understanding the Data
summary: Crime Hotspots uses a consistent set of classification rules to categorise incidents. Key rules include Carjacking mapping to Robbery, and intent standards for Shooting vs. Attempted Murder.
order: 2
related: [data-sources, data-coverage-limitations, citing-our-data]
date_updated: 2026-03-01
---

## How We Classify Crimes

Every incident on Crime Hotspots is assigned a primary crime type. Consistent classification is critical for accurate trend analysis and fair comparisons across areas and time periods.

## Primary crime types

The platform tracks the following categories:

- Murder
- Attempted Murder
- Shooting
- Robbery
- Carjacking
- Home Invasion
- Burglary
- Theft
- Sexual Violence
- Kidnapping
- Fraud / Scam
- Extortion
- Assault
- Other

## Hard classification rules

Two rules are absolute and have no exceptions:

**1. Carjacking → Robbery**
All carjackings are classified as Robbery (not as a separate type). This reflects standard criminological practice where vehicle theft by force is a subset of robbery.

**2. Home Invasion → Burglary**
All home invasions are classified as Burglary. A home invasion is an armed or forced entry into an occupied dwelling — it maps to the burglary category with a violence flag.

## Shooting vs. Attempted Murder

The distinction is based on **intent**, not outcome:

- **Shooting**: gunfire occurs, but the context does not clearly establish intent to kill (e.g. indiscriminate gunfire, shots fired at a vehicle)
- **Attempted Murder**: the evidence establishes clear intent to kill — the victim was targeted, shot at close range, or the perpetrator made statements indicating intent

An armed robbery where a gun is present but not fired is classified as **Robbery only** — not Shooting.

## Multiple crime types

An incident can have a primary type and related types. For example, a murder following a robbery would be classified as Murder (primary) with Robbery (related). Crime counts on the dashboard reflect the number of incidents, not the sum of all primary and related types.

## Source of truth

Classification rules are defined in the AI extraction prompt and validated before each article is ingested. The full rule document is maintained internally and reviewed whenever edge cases emerge from the data.
