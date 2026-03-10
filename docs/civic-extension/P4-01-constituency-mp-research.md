# P4-01 Research: MP / Constituency Mapping for crimehotspots.com

**Research date:** 2026-03-10
**Prepared for:** Kavell Forde
**Status:** Research only — no code changes made

---

## Executive Summary

Trinidad and Tobago held a general election on **28 April 2025** — making the data in this document the most current available. The UNC won 26 of 41 seats; the PNM won 13; the Tobago People's Party (TPP) took both Tobago seats. The 2025 election also included EBC boundary changes that **renamed 5 constituencies**, which is a key data management consideration.

The site currently uses **15 actual region slugs** (not 13 as estimated in the audit brief). The regions `toco-manzanilla`, `nariva-mayaro`, `south-east-trinidad`, `victoria`, and `east-trinidad` do not exist in the crime data — the correct slugs are confirmed below.

---

## Section 1: Confirmed Site Region Slugs

The actual region values from `src/data/csv-cache.json`, processed through `generateNameSlug()`:

| Display Name | Slug |
|---|---|
| Arima | `arima` |
| Chaguanas | `chaguanas` |
| Couva - Tabaquite - Talparo | `couva-tabaquite-talparo` |
| Diego Martin | `diego-martin` |
| Mayaro - Rio Claro | `mayaro-rio-claro` |
| Penal - Debe | `penal-debe` |
| Point Fortin | `point-fortin` |
| Port of Spain | `port-of-spain` |
| Princes Town | `princes-town` |
| San Fernando | `san-fernando` |
| San Juan - Laventille | `san-juan-laventille` |
| Sangre Grande | `sangre-grande` |
| Siparia | `siparia` |
| Tobago | `tobago` |
| Tunapuna - Piarco | `tunapuna-piarco` |

**Note:** The audit brief's slugs `toco-manzanilla`, `nariva-mayaro`, `south-east-trinidad`, `victoria`, and `east-trinidad` do not exist.

---

## Section 2: All 41 Parliamentary Constituencies — 2025 Election Results

The 2025 election saw 5 constituency renamings. Both the old name (2020 era) and current 2025 name are listed.

### Trinidad Constituencies (39 seats)

| # | Constituency (2025 name) | Former Name (pre-2025) | MP (2025) | Party |
|---|---|---|---|---|
| 1 | Aranguez/St. Joseph | St. Joseph | Devesh Maharaj | UNC |
| 2 | Arima | Arima | Pennelope Beckles | PNM |
| 3 | Arouca/Lopinot | Lopinot/Bon Air West | Dr Natalie Chaitan-Maharaj | UNC |
| 4 | Barataria/San Juan | Barataria/San Juan | Saddam Hosein | UNC |
| 5 | Caroni Central | Caroni Central | Dr David Lee | UNC |
| 6 | Caroni East | Caroni East | Dr Rishad Seecharan | UNC |
| 7 | Chaguanas East | Chaguanas East | Vandana Mohit | UNC |
| 8 | Chaguanas West | Chaguanas West | Dr Colin Neil Gosine | UNC |
| 9 | Claxton Bay | Pointe-à-Pierre | Hansen Narinesingh | UNC |
| 10 | Couva North | Couva North | Jearlean John | UNC |
| 11 | Couva South | Couva South | Barry Padarath | UNC |
| 12 | Cumuto/Manzanilla | Cumuto/Manzanilla | Shivana Sam | UNC |
| 13 | Diego Martin Central | Diego Martin Central | Symon De Nobriga | PNM |
| 14 | Diego Martin North/East | Diego Martin North/East | Colm Imbert | PNM |
| 15 | Diego Martin West | Diego Martin West | Hans Des Vignes | PNM |
| 16 | Fyzabad | Fyzabad | Dave Tancoo | UNC |
| 17 | La Brea | La Brea | Clyde Elder | UNC |
| 18 | La Horquetta/Talparo | La Horquetta/Talparo | Phillip Watts | UNC |
| 19 | Laventille East/Morvant | Laventille East/Morvant | Christian Birchwood | PNM |
| 20 | Laventille West | Laventille West | Kareem Marcelle | PNM |
| 21 | Malabar/Mausica | D'Abadie/O'Meara | Dominic Romain | PNM |
| 22 | Mayaro | Mayaro | Nicholas Morris | UNC |
| 23 | Moruga/Tableland | Moruga/Tableland | Michelle Benjamin | UNC |
| 24 | Naparima | Naparima | Dr Narindra Roopnarine | UNC |
| 25 | Oropouche East | Oropouche East | Dr Roodal Moonilal | UNC |
| 26 | Oropouche West | Oropouche West | Dr Lackram Bodoe | UNC |
| 27 | Point Fortin | Point Fortin | Ernesto Kesar | UNC |
| 28 | Port of Spain North/St. Ann's West | Port of Spain North/St. Ann's West | Stuart Young | PNM |
| 29 | Port of Spain South | Port of Spain South | Keith Scotland | PNM |
| 30 | Princes Town | Princes Town | Dr Aiyna Ali | UNC |
| 31 | San Fernando East | San Fernando East | Brian Manning | PNM |
| 32 | San Fernando West | San Fernando West | Dr Michael Dowlath | UNC |
| 33 | Siparia | Siparia | Kamla Persad-Bissessar | UNC |
| 34 | St. Ann's East | St. Ann's East | Nyan Gadsby-Dolly | PNM |
| 35 | St. Augustine | St. Augustine | Khadija Ameen | UNC |
| 36 | Tabaquite | Tabaquite | Sean Sobers | UNC |
| 37 | Toco/Sangre Grande | Toco/Sangre Grande | Wayne Sturge | UNC |
| 38 | Trincity/Maloney | Arouca/Maloney | Camille Robinson-Regis | PNM |
| 39 | Tunapuna | Tunapuna | Roger Alexander | UNC |

### Tobago Constituencies (2 seats)

| # | Constituency | MP (2025) | Party |
|---|---|---|---|
| 40 | Tobago East | David Thomas | TPP |
| 41 | Tobago West | Joel Sampson | TPP |

**Party key:** UNC = United National Congress (governing) | PNM = People's National Movement (opposition) | TPP = Tobago People's Party

---

## Section 3: Summary Mapping Table — All 41 Constituencies to Region Slugs

| Constituency (2025) | MP | Party | Site Region Slug | Confidence |
|---|---|---|---|---|
| Aranguez/St. Joseph | Devesh Maharaj | UNC | `tunapuna-piarco` | Clear |
| Arima | Pennelope Beckles | PNM | `arima` | Clear |
| Arouca/Lopinot | Dr Natalie Chaitan-Maharaj | UNC | `tunapuna-piarco` | Clear |
| Barataria/San Juan | Saddam Hosein | UNC | `san-juan-laventille` | Clear |
| Caroni Central | Dr David Lee | UNC | `chaguanas` / `couva-tabaquite-talparo` | Ambiguous |
| Caroni East | Dr Rishad Seecharan | UNC | `chaguanas` / `tunapuna-piarco` | Ambiguous |
| Chaguanas East | Vandana Mohit | UNC | `chaguanas` | Clear |
| Chaguanas West | Dr Colin Neil Gosine | UNC | `chaguanas` | Clear |
| Claxton Bay | Hansen Narinesingh | UNC | `couva-tabaquite-talparo` | Clear |
| Couva North | Jearlean John | UNC | `couva-tabaquite-talparo` | Clear |
| Couva South | Barry Padarath | UNC | `couva-tabaquite-talparo` | Clear |
| Cumuto/Manzanilla | Shivana Sam | UNC | `sangre-grande` | Ambiguous |
| Diego Martin Central | Symon De Nobriga | PNM | `diego-martin` | Clear |
| Diego Martin North/East | Colm Imbert | PNM | `diego-martin` | Clear |
| Diego Martin West | Hans Des Vignes | PNM | `diego-martin` | Clear |
| Fyzabad | Dave Tancoo | UNC | `siparia` | Ambiguous |
| La Brea | Clyde Elder | UNC | `point-fortin` / `siparia` | Ambiguous |
| La Horquetta/Talparo | Phillip Watts | UNC | `couva-tabaquite-talparo` | Clear |
| Laventille East/Morvant | Christian Birchwood | PNM | `san-juan-laventille` | Clear |
| Laventille West | Kareem Marcelle | PNM | `san-juan-laventille` | Clear |
| Malabar/Mausica | Dominic Romain | PNM | `tunapuna-piarco` | Clear |
| Mayaro | Nicholas Morris | UNC | `mayaro-rio-claro` | Clear |
| Moruga/Tableland | Michelle Benjamin | UNC | `princes-town` | Ambiguous |
| Naparima | Dr Narindra Roopnarine | UNC | `san-fernando` | Clear |
| Oropouche East | Dr Roodal Moonilal | UNC | `penal-debe` | Clear |
| Oropouche West | Dr Lackram Bodoe | UNC | `penal-debe` | Clear |
| Point Fortin | Ernesto Kesar | UNC | `point-fortin` | Clear |
| Port of Spain North/St. Ann's West | Stuart Young | PNM | `port-of-spain` | Clear |
| Port of Spain South | Keith Scotland | PNM | `port-of-spain` | Clear |
| Princes Town | Dr Aiyna Ali | UNC | `princes-town` | Clear |
| San Fernando East | Brian Manning | PNM | `san-fernando` | Clear |
| San Fernando West | Dr Michael Dowlath | UNC | `san-fernando` | Clear |
| Siparia | Kamla Persad-Bissessar | UNC | `siparia` | Clear |
| St. Ann's East | Nyan Gadsby-Dolly | PNM | `san-juan-laventille` / `port-of-spain` | Ambiguous |
| St. Augustine | Khadija Ameen | UNC | `tunapuna-piarco` | Clear |
| Tabaquite | Sean Sobers | UNC | `couva-tabaquite-talparo` | Clear |
| Toco/Sangre Grande | Wayne Sturge | UNC | `sangre-grande` | Clear |
| Trincity/Maloney | Camille Robinson-Regis | PNM | `tunapuna-piarco` | Clear |
| Tunapuna | Roger Alexander | UNC | `tunapuna-piarco` | Clear |
| Tobago East | David Thomas | TPP | `tobago` | Clear |
| Tobago West | Joel Sampson | TPP | `tobago` | Clear |

**Confidence key:** Clear = falls entirely within region boundary | Ambiguous = straddles two regions, policy decision required

**Count:** 29 clear | 12 ambiguous (29%)

### Ambiguous constituency notes

| Constituency | Issue |
|---|---|
| Caroni Central | Covers Caroni area which crosses the Chaguanas borough and Couva–Tabaquite–Talparo region |
| Caroni East | East Caroni crosses Chaguanas municipality and Tunapuna–Piarco |
| St. Ann's East | Cascade/Gonzales/Belmont hills — administratively Port of Spain city, but borders San Juan–Laventille. Crime data likely logged as `port-of-spain` |
| Cumuto/Manzanilla | Cumuto is interior Sangre Grande; Manzanilla coast borders Nariva/Mayaro |
| La Brea | Borough between Point Fortin and Siparia/Fyzabad |
| Fyzabad | Oilfield belt spans Siparia and Penal–Debe boundaries |
| Moruga/Tableland | Tableland is Princes Town region; Moruga is isolated south coast |

---

## Section 4: Data Quality and Feasibility Assessment

### How stable is the MP data?

**High churn.** TT had elections in 2015, 2020, and 2025. Key risks:

- EBC revised **constituency names and boundaries** in 2024, effective 2025. Five constituencies renamed. A 2020 dataset would be wrong by name for 5 seats today.
- By-elections can change MPs mid-term without a general election.
- **Next election due by April 2030** but could be called early. The 2025 election was called with only 6 weeks notice.
- Tobago TPP now holds both seats — distinct from mainland PNM/UNC dynamic.

### Is there a structured data source?

**No official structured source.** Checked:

- **ttparliament.org** — Connection refused during research. Historically HTML only, no API or downloadable CSV.
- **ebctt.com** — PDF reports only, no JSON/CSV of MP-to-constituency mapping.
- **Wikipedia** — Most usable structured source. 2025 election article has full constituency results, updated within days of the election.
- **IPU Parline (data.ipu.org)** — Has structured results but only aggregate party totals, not individual MP names per constituency.

### Best maintenance approach

**Recommendation: Static JSON file, manually updated after each election.**

Rationale:
1. 41 records max — manual update takes under an hour.
2. No reliable public API exists.
3. Boundary changes require human editorial review regardless.
4. Wikipedia is the best bulk source after each election.

**Proposed file:** `src/data/constituency-mp-map.json`

**Proposed schema:**
```json
[
  {
    "constituency": "Arima",
    "constituencySlug": "arima",
    "mp": "Pennelope Beckles",
    "party": "PNM",
    "partyFull": "People's National Movement",
    "electionYear": 2025,
    "regionSlugs": ["arima"],
    "regionConfidence": "clear"
  }
]
```

The `regionSlugs` array handles ambiguous cases where a constituency spans two regions. `regionConfidence` flags which entries need editorial attention when displaying.

---

## Section 5: Civic Value Assessment

### Value added

1. **Accountability context.** Users can see which MP represents a high-crime area — a direct line from statistics to the accountable person.
2. **Civic engagement.** Links to MP contact pages enable residents to act.
3. **SEO.** Users searching "crime in [constituency name]" or "[MP name] crime" would find the site. Many TT users think in constituency terms, not administrative region terms.
4. **Differentiation.** No other TT crime resource currently offers this cross-reference.
5. **Election relevance.** Crime was a top 2025 election issue. This feature is timely.

### Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Political sensitivity | Medium-High | Present MP as a resource/contact, not as responsible for crime levels. No "PNM MP — 83 murders" framing. |
| Data staleness | Medium | Include `electionYear` field and "as of [election date]" disclaimer. |
| Region mismatch (29% ambiguous) | Medium | Only show MPs where confidence is `clear`; show "multiple constituencies" for ambiguous regions. |
| Regional politics — Tobago TPP | Low-Medium | Represent TPP accurately; do not conflate with PNM. |
| MP leaving office mid-term | Medium | Disclaimer: data reflects most recent general election. |
| Boundary changes | Low (post-2025) | EBC just completed review; stable until ~2027–2028. |

---

## Section 6: Recommendation

**Yes, implement P4-01, but scope carefully.**

### Phased approach

**Phase 1 — Data file only:** Create `src/data/constituency-mp-map.json` with all 41 entries. No UI. Foundation layer.

**Phase 2 — Region pages:** "Your MPs" card on `/trinidad/region/[slug]/` listing constituencies and current MPs within the region. Ambiguous constituencies show with a note.

**Phase 3 — Area pages (optional):** Surface the relevant MP for specific areas where geography is granular enough.

### What NOT to do

- Do not frame crime statistics as a reflection of MP performance.
- Do not build a scraper for parliament.gov.tt — unreliable and data changes infrequently.
- Do not surface party affiliation prominently in crime contexts without a clear disclaimer.

### Maintenance protocol (after each election or by-election)

1. Fetch Wikipedia election results article
2. Cross-reference with EBC official PDF
3. Update `constituency-mp-map.json`
4. Check for renamed constituencies (EBC boundary review)
5. Update `electionYear` and any changed `regionSlugs`

**Next scheduled election: by April 2030.** Constituency names and boundaries are stable until ~2027–2028.

---

## Key Corrections to Audit Brief Assumptions

| Audit Brief Slug | Reality |
|---|---|
| `toco-manzanilla` | Does not exist. Maps to `sangre-grande`. |
| `nariva-mayaro` | Does not exist. Maps to `mayaro-rio-claro`. |
| `south-east-trinidad` | Does not exist. Split across `mayaro-rio-claro`, `princes-town`, `sangre-grande`. |
| `victoria` | Does not exist. Historical county split across `san-fernando`, `princes-town`, `siparia`, `penal-debe`. |
| `east-trinidad` | Does not exist. Closest is `sangre-grande`. |

The site has **15 regions**, not 13. Additional regions: `diego-martin`, `mayaro-rio-claro`, `penal-debe`, `point-fortin`, `princes-town`, `san-fernando`, `siparia`.

---

## Sources

- [2025 Trinidad and Tobago general election — Wikipedia](https://en.wikipedia.org/wiki/2025_Trinidad_and_Tobago_general_election)
- [2020 Trinidad and Tobago general election — Wikipedia](https://en.wikipedia.org/wiki/2020_Trinidad_and_Tobago_general_election)
- [Constituencies of the Parliament of Trinidad and Tobago — Wikipedia](https://en.wikipedia.org/wiki/Constituencies_of_the_Parliament_of_Trinidad_and_Tobago)
- [Regions and municipalities of Trinidad and Tobago — Wikipedia](https://en.wikipedia.org/wiki/Regions_and_municipalities_of_Trinidad_and_Tobago)
- [2025 General Election Results — AZP News](https://azpnews.com/2025-general-election-results-all-constituencies/)
- [IPU Parline — TT 2025 election](https://data.ipu.org/parliament/TT/TT-LC01/election/TT-LC01-E20250428)
- [Elections and Boundaries Commission](https://ebctt.com/electoral-districts/)
- Site source: `src/data/csv-cache.json` (confirmed region slug list)
