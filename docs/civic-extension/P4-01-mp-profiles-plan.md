# P4-01 — MP Profiles: Data Collection & Implementation Plan

**Created:** 2026-03-10
**Status:** Data collection complete. mps.json built at `astro-poc/src/data/mps.json`. Next: build `src/pages/trinidad/mp/[slug].astro`.

---

## Overview

41 static, indexable MP profile pages at `/trinidad/mp/[name-slug]/`. Each page shows the MP's profile, constituency, contact details, and links directly to the crime statistics for the administrative region(s) they represent. The crime data is not duplicated — it links to existing region pages.

This is a one-directional overlay: crime data → MP context. The site does not editorially connect MPs to crime outcomes.

---

## Data File

**Location:** `astro-poc/src/data/mps.json`

Not the Regions Sheet. MPs are a static reference layer that changes only after elections (~every 3–5 years). The Regions Sheet drives the live crime pipeline — keep them separate.

### Schema per entry

```json
{
  "nameSlug": "stuart-young",
  "fullName": "Stuart Young",
  "title": "MP",
  "honorific": "",
  "constituency": "Port of Spain North/St. Ann's West",
  "constituencySlug": "port-of-spain-north-st-anns-west",
  "party": "PNM",
  "partyFull": "People's National Movement",
  "electionYear": 2025,
  "regionSlugs": ["port-of-spain"],
  "regionConfidence": "clear",
  "contact": {
    "email": "",
    "phone": "",
    "office": "",
    "parliamentProfile": "https://www.ttparliament.org/members/[slug]"
  },
  "website": "",
  "socials": {
    "facebook": "",
    "instagram": "",
    "x": "",
    "youtube": ""
  },
  "photo": ""
}
```

**Notes on fields:**
- `honorific` — use for "Dr", "Senator", etc. where applicable. Renders before fullName.
- `regionSlugs` — array; most MPs have one, ambiguous cases have two. Crime data pulled for all listed slugs.
- `regionConfidence` — `clear` or `ambiguous`. Ambiguous MPs show a boundary note on their profile.
- `photo` — filename only (e.g. `stuart-young.jpg`). Store photos in `public/images/mps/`. Leave empty if unavailable.
- `parliamentProfile` — the official ttparliament.org member page. Verify each URL manually — the site was unreliable during research.

---

## Data to Collect — All 41 MPs

Pre-filled: name, constituency, party, region mapping (from research).
Kavell to fill: email, phone, office address, website, socials, parliament profile URL, photo.

### Port of Spain

| Field | MP 1 | MP 2 |
|---|---|---|
| **Full Name** | Stuart Young SC | Keith Scotland SC |
| **Constituency** | Port of Spain North/St. Ann's West | Port of Spain South |
| **Party** | PNM | PNM |
| **Region Slug** | `port-of-spain` | `port-of-spain` |
| **Confidence** | Clear | Clear |
| **Honorific** | Mr | Mr |
| **Email** | posnorth@ttparliament.org | possouth@ttparliament.org |
| **Phone** | (868) 624-6855 | (868) 715-5475 |
| **Office** | #29 Observatory Street, Port of Spain | #70 Piccadilly Street, East Dry River, Port of Spain |
| **Parliament Profile** | https://www.ttparliament.org/members/member/stuart-young/ | https://www.ttparliament.org/members/member/keith-scotland/ |
| **Website** | | |
| **Facebook** | | |
| **Instagram** | | |
| **X** | | |
| **Photo** | | |

---

### San Juan - Laventille

| Field | MP 1 | MP 2 | MP 3 | MP 4 |
|---|---|---|---|---|
| **Full Name** | Saddam Hosein | Christian Birchwood | Kareem Marcelle | Dr Nyan Gadsby-Dolly |
| **Constituency** | Barataria/San Juan | Laventille East/Morvant | Laventille West | St. Ann's East |
| **Party** | UNC | PNM | PNM | PNM |
| **Region Slug** | `san-juan-laventille` | `san-juan-laventille` | `san-juan-laventille` | `san-juan-laventille` |
| **Confidence** | Clear | Clear | Clear | Ambiguous |
| **Honorific** | The Honourable | Mr | Mr | Dr |
| **Email** | barsanjuan@ttparliament.org | laventilleeast@ttparliament.org | laventillew@ttparliament.org | stannseast@ttparliament.org |
| **Phone** | (868) 674-4788 | (868) 626-0911 | (868) 627-2087 / (868) 264-7558 | (868) 674-9077 |
| **Office** | Corner El Socorro Road and Salamat Street, San Juan | #10 Cajuca Street, Morvant | 240 Laventille Road, Laventille | Cor. Bagatelle & Saddle Roads, San Juan |
| **Parliament Profile** | https://www.ttparliament.org/members/member/saddam-hosein/ | https://www.ttparliament.org/members/member/christian-birchwood/ | https://www.ttparliament.org/members/member/kareem-marcelle/ | https://www.ttparliament.org/members/member/dr-nyan-gadsby-dolly/ |
| **Website** | | | | |
| **Facebook** | | | | |
| **Instagram** | | | | |
| **X** | | | | |
| **Photo** | | | | |

**Note:** St. Ann's East (Nyan Gadsby-Dolly, PNM) is ambiguous — straddles Port of Spain and San Juan–Laventille. Show on both region pages with boundary note.

---

### Tunapuna - Piarco

| Field | MP 1 | MP 2 | MP 3 | MP 4 | MP 5 | MP 6 |
|---|---|---|---|---|---|---|
| **Full Name** | Roger Alexander | Khadijah Ameen | Devesh Maharaj | Marvin Gonzales | Dominic Romain | Camille Robinson-Regis |
| **Constituency** | Tunapuna | St. Augustine | Aranguez/St. Joseph | Arouca/Lopinot | Malabar/Mausica | Trincity/Maloney |
| **Party** | UNC | UNC | UNC | UNC | PNM | PNM |
| **Region Slug** | `tunapuna-piarco` | `tunapuna-piarco` | `tunapuna-piarco` | `tunapuna-piarco` | `tunapuna-piarco` | `tunapuna-piarco` |
| **Confidence** | Clear | Clear | Clear | Clear | Clear | Clear |
| **Honorific** | The Honourable | The Honourable | The Honourable | Mr | Mr | Mrs |
| **Email** | tunapuna@ttparliament.org | staugustine@ttparliament.org | aranguezstjoseph@ttparliament.org | aroucalopinot@ttparliament.org | malabarmausica@ttparliament.org | trincitymaloney@ttparliament.org |
| **Phone** | (868) 227-3414 | (868) 739-5287 | (868) 227-6839 | (868) 640-4347 / (868) 640-9874 | (868) 643-4366 | (868) 692-7380 / (868) 692-7260 |
| **Office** | Corner Green Street and El Dorado Road | No. 43 Pasea Main Road, Tunapuna | Corner Aranguez Main Road and Kanhai Street, Aranguez | #62 Eastern Main Road, Garden Village, Arouca | Corner Second Street and Tumpuna Road, Arima | Tanager Block, HDC Village Plaza, Bon Air |
| **Parliament Profile** | https://www.ttparliament.org/members/member/roger-alexander/ | https://www.ttparliament.org/members/member/khadijah-ameen/ | https://www.ttparliament.org/members/member/devesh-maharaj/ | https://www.ttparliament.org/members/member/marvin-gonzales/ | https://www.ttparliament.org/members/member/dominic-romain/ | https://www.ttparliament.org/members/member/camille-robinson-regis/ |
| **Website** | | | | | | |
| **Facebook** | | | | | | |
| **Instagram** | | | | | | |
| **X** | | | | | | |
| **Photo** | roger-alexander.webp | khadija-ameen.webp | | | | |

---

### Arima

| Field | MP 1 |
|---|---|
| **Full Name** | Pennelope Beckles |
| **Constituency** | Arima |
| **Party** | PNM |
| **Region Slug** | `arima` |
| **Confidence** | Clear |
| **Honorific** | The Honourable |
| **Email** | arima@ttparliament.org |
| **Phone** | (868) 667-3289 / (868) 667-4681|
| **Office** | #31 Guanapo Street |
| **Parliament Profile** | https://www.ttparliament.org/members/member/pennelope-beckles-robinson/biography/ |
| **Website** | |
| **Facebook** | |
| **Instagram** | |
| **X** | |
| **Photo** | pennelope-beckles.webp |

---

### Diego Martin

| Field | MP 1 | MP 2 | MP 3 |
|---|---|---|---|
| **Full Name** | Hans Des Vignes | Symon De Nobriga | Colm Imbert |
| **Constituency** | Diego Martin West | Diego Martin Central | Diego Martin North/East |
| **Party** | PNM | PNM | PNM |
| **Region Slug** | `diego-martin` | `diego-martin` | `diego-martin` |
| **Confidence** | Clear | Clear | Clear |
| **Honorific** | Mr | Mr | Mr |
| **Email** | diegomartinw@ttparliament.org | diegomartinc@ttparliament.org | diegomartine@ttparliament.org |
| **Phone** | (868) 612-3694 / (868) 633-5142 | (868) 637-6056 | (868) 629-3830 / (868) 629-1685 |
| **Office** | Corner Western Main Road and La Horquetta Valley Road, Glencoe | #1 Orchid Drive, Morne Coco Road, Petit Valley | #1B Morne Coco Road, Maraval |
| **Parliament Profile** | https://www.ttparliament.org/members/member/hans-des-vignes/ | https://www.ttparliament.org/members/member/symon-de-nobriga/ | https://www.ttparliament.org/members/member/colm-imbert/ |
| **Website** | | | |
| **Facebook** | | | |
| **Instagram** | | | |
| **X** | | | |
| **Photo** | | | |

---

### Chaguanas

| Field | MP 1 | MP 2 | MP 3 | MP 4 |
|---|---|---|---|---|
| **Full Name** | Vandana Mohit | Dr Colin Neil Gosine | David Lee | Dr Rishad Seecheran |
| **Constituency** | Chaguanas East | Chaguanas West | Caroni Central | Caroni East |
| **Party** | UNC | UNC | UNC | UNC |
| **Region Slug** | `chaguanas` | `chaguanas` | `chaguanas` | `chaguanas` |
| **Confidence** | Clear | Clear | Ambiguous | Ambiguous |
| **Honorific** | The Honourable | Dr | The Honourable | The Honourable Dr |
| **Email** | chaguanase@ttparliament.org | chaguanasw@ttparliament.org | caronic@ttparliament.org | caronie@ttparliament.org |
| **Phone** | (868) 226-1330 | (868) 688-1041 | (868) 223-7186 | (868) 678-1515 / (868) 264-1515 |
| **Office** | #7 Dynette Street Extension, Cunupia | LP#111 Munroe Road, Cunupia | Lot B, Corner Nelson and Mission Road, Freeport | Lot 1B, Malibu Park, Southern Main Road, Cunupia |
| **Parliament Profile** | https://www.ttparliament.org/members/member/vandana-mohit/ | https://www.ttparliament.org/members/member/colin-neil-gosine/ | https://www.ttparliament.org/members/member/david-lee/ | https://www.ttparliament.org/members/member/dr-rishad-seecheran/ |
| **Website** | | | | |
| **Facebook** | | | | |
| **Instagram** | | | | |
| **X** | | | | |
| **Photo** | | | | |

**Note:** Caroni Central (David Lee) and Caroni East (Dr Rishad Seecheran) are ambiguous — straddle Chaguanas and adjacent regions. Show on Chaguanas page with boundary note.

---

### Couva - Tabaquite - Talparo

| Field | MP 1 | MP 2 | MP 3 | MP 4 |
|---|---|---|---|---|
| **Full Name** | Jearlean John | Barry Padarath | Sean Sobers | Phillip Watts |
| **Constituency** | Couva North | Couva South | Tabaquite | La Horquetta/Talparo |
| **Party** | UNC | UNC | UNC | UNC |
| **Region Slug** | `couva-tabaquite-talparo` | `couva-tabaquite-talparo` | `couva-tabaquite-talparo` | `couva-tabaquite-talparo` |
| **Confidence** | Clear | Clear | Clear | Clear |
| **Honorific** | The Honourable | The Honourable | The Honourable | The Honourable |
| **Email** | couvan@ttparliament.org | couvas@ttparliament.org | tabaquite@ttparliament.org | lahorquettatalparo@ttparliament.org |
| **Phone** | (868) 672-2206 / (868) 665-5140 | (868) 636-4143 | (868) 218-8222 | (868) 227-4310 / (868) 227-4343 |
| **Office** | LP #436 Southern Main Road, Chase Village, Carapichaima | No. 27A Camden Road, Couva | LP #91 Bonne Aventure Main Road, Happy Hill, Gasparillo | #19 Talparo Main Road, Brazil |
| **Parliament Profile** | https://www.ttparliament.org/members/member/jearlean-john/ | https://www.ttparliament.org/members/member/barry-padarath/ | https://www.ttparliament.org/members/member/sean-sobers/ | https://www.ttparliament.org/members/member/phillip-watts/ |
| **Website** | | | | |
| **Facebook** | | | | |
| **Instagram** | | | | |
| **X** | | | | |
| **Photo** | | | | |

**Note:** Claxton Bay (Hansen Narinesingh, UNC) also maps here clearly.

| Field | MP 5 |
|---|---|
| **Full Name** | Hansen Narinesingh |
| **Constituency** | Claxton Bay |
| **Party** | UNC |
| **Region Slug** | `couva-tabaquite-talparo` |
| **Confidence** | Clear |
| **Honorific** | Mr |
| **Email** | claxtonbay@ttparliament.org |
| **Phone** | (868) 393-7685 / (868) 384-0981 |
| **Office** | #270 Union Village, Hermitage Road, Claxton Bay |
| **Parliament Profile** | https://www.ttparliament.org/members/member/hansen-narinesingh/ |
| **Website** | |
| **Facebook** | |
| **Instagram** | |
| **X** | |
| **Photo** | |

---

### Sangre Grande

| Field | MP 1 | MP 2 |
|---|---|---|
| **Full Name** | Wayne Sturge | Shivanna Sam |
| **Constituency** | Toco/Sangre Grande | Cumuto/Manzanilla |
| **Party** | UNC | UNC |
| **Region Slug** | `sangre-grande` | `sangre-grande` |
| **Confidence** | Clear | Ambiguous |
| **Honorific** | The Honourable | Mrs |
| **Email** | tocosangregrande@ttparliament.org | cumutomanzanilla@ttparliament.org |
| **Phone** | (868) 610-5552 / (868) 223-5897 | (868) 491-2064 |
| **Office** | #44 Foster Road, Sangre Grande | Corner Easter Main and Guaico Tamana Roads, Sangre Grande |
| **Parliament Profile** | https://www.ttparliament.org/members/member/wayne-sturge/ | https://www.ttparliament.org/members/member/shivanna-sam/ |
| **Website** | | |
| **Facebook** | | |
| **Instagram** | | |
| **X** | | |
| **Photo** | | |

**Note:** Cumuto/Manzanilla (Shivanna Sam, UNC) is ambiguous — Cumuto is Sangre Grande, Manzanilla coast borders Mayaro–Rio Claro. Show on Sangre Grande page as primary.

---

### Mayaro - Rio Claro

| Field | MP 1 |
|---|---|
| **Full Name** | Wilfred Nicholas Morris |
| **Constituency** | Mayaro |
| **Party** | UNC |
| **Region Slug** | `mayaro-rio-claro` |
| **Confidence** | Clear |
| **Honorific** | The Honourable |
| **Email** | mayaro@ttparliament.org |
| **Phone** | (868) 223-9218 / (868) 223-9929 |
| **Office** | #1285 Tabaquite Road, Rio Claro |
| **Parliament Profile** | https://www.ttparliament.org/members/member/wilfred-nicholas-morris/ |
| **Website** | |
| **Facebook** | |
| **Instagram** | |
| **X** | |
| **Photo** | |

---

### San Fernando

| Field | MP 1 | MP 2 | MP 3 |
|---|---|---|---|
| **Full Name** | Brian Manning | Dr Michael Dowlath | Dr Narindra Roopnarine |
| **Constituency** | San Fernando East | San Fernando West | Naparima |
| **Party** | PNM | UNC | UNC |
| **Region Slug** | `san-fernando` | `san-fernando` | `san-fernando` |
| **Confidence** | Clear | Clear | Clear |
| **Honorific** | Mr | The Honourable Dr | Dr |
| **Email** | sanfernandoe@ttparliament.org | sanfernandow@ttparliament.org | naparima@ttparliament.org |
| **Phone** | (868) 653-9436 | (868) 652-3386 | (868) 655-2363 / (868) 655-1184 |
| **Office** | #10 Navet Road, San Fernando | #50 Independence Avenue, San Fernando | #29 Manahambre Road, Cedar Hill, Princes Town |
| **Parliament Profile** | https://www.ttparliament.org/members/member/brian-manning/ | https://www.ttparliament.org/members/member/dr-michael-dowlath/ | https://www.ttparliament.org/members/member/dr-narindra-roopnarine/ |
| **Website** | | | |
| **Facebook** | | | |
| **Instagram** | | | |
| **X** | | | |
| **Photo** | | | |

---

### Princes Town

| Field | MP 1 | MP 2 |
|---|---|---|
| **Full Name** | Dr Aiyna Ali | Michelle Benjamin |
| **Constituency** | Princes Town | Moruga/Tableland |
| **Party** | UNC | UNC |
| **Region Slug** | `princes-town` | `princes-town` |
| **Confidence** | Clear | Ambiguous |
| **Honorific** | Dr | The Honourable |
| **Email** | princestown@ttparliament.org | morugatableland@ttparliament.org |
| **Phone** | (868) 655-5952 | (868) 655-1958 |
| **Office** | #162 Craignish Village | #4 Petit Cafe, Indian Walk, Princes Town |
| **Parliament Profile** | https://www.ttparliament.org/members/member/aiyna-ali/biography/ | https://www.ttparliament.org/members/member/michelle-benjamin/ |
| **Website** | | |
| **Facebook** | | |
| **Instagram** | | |
| **X** | | |
| **Photo** | | |

**Note:** Moruga/Tableland (Michelle Benjamin, UNC) is ambiguous — Tableland is Princes Town, Moruga is isolated south coast. Show on Princes Town page as primary.

---

### Penal - Debe

| Field | MP 1 | MP 2 |
|---|---|---|
| **Full Name** | Dr Roodal Moonilal | Dr Lackram Bodoe |
| **Constituency** | Oropouche East | Oropouche West |
| **Party** | UNC | UNC |
| **Region Slug** | `penal-debe` | `penal-debe` |
| **Confidence** | Clear | Clear |
| **Honorific** | The Honourable Dr | The Honourable Dr |
| **Email** | oropouche@ttparliament.org | oropouchew@ttparliament.org |
| **Phone** | (868) 647-8104 / (868) 647-2384 | (868) 398-7130 |
| **Office** | Debe Junction, S.S. Erin Road, Debe | 1280-1282 S.S. Erin Road, Batchiya Village, Penal |
| **Parliament Profile** | https://www.ttparliament.org/members/member/roodal-moonilal/ | https://www.ttparliament.org/members/member/dr-lackram-bodoe/ |
| **Website** | | |
| **Facebook** | | |
| **Instagram** | | |
| **X** | | |
| **Photo** | | |

---

### Siparia

| Field | MP 1 | MP 2 |
|---|---|---|
| **Full Name** | Kamla Persad-Bissessar SC | Davendranath Tancoo |
| **Constituency** | Siparia | Fyzabad |
| **Party** | UNC | UNC |
| **Region Slug** | `siparia` | `siparia` |
| **Confidence** | Clear | Ambiguous |
| **Honorific** | The Honourable | The Honourable |
| **Email** | siparia@ttparliament.org | fyzabad@ttparliament.org |
| **Phone** | (868) 647-4128 / (868) 647-4876 | (868) 677-5807 |
| **Office** | Penal Junction, Penal | Government Quarters, Unity Court, Fyzabad |
| **Parliament Profile** | https://www.ttparliament.org/members/member/kamla-persad-bissessar/ | https://www.ttparliament.org/members/member/davendranath-tancoo/ |
| **Website** | | |
| **Facebook** | | |
| **Instagram** | | |
| **X** | | |
| **Photo** | | |

**Note:** Fyzabad (Davendranath Tancoo, UNC) is ambiguous — straddles Siparia and Penal–Debe. Show on Siparia page as primary.

---

### Point Fortin

| Field | MP 1 | MP 2 |
|---|---|---|
| **Full Name** | Ernesto Kesar | Clyde Elder |
| **Constituency** | Point Fortin | La Brea |
| **Party** | UNC | UNC |
| **Region Slug** | `point-fortin` | `point-fortin` |
| **Confidence** | Clear | Ambiguous |
| **Honorific** | The Honourable | The Honourable |
| **Email** | pointfortin@ttparliament.org | labrea@ttparliament.org |
| **Phone** | (868) 648-1086 | (868) 648-7328 |
| **Office** | #8-10 Techier Main Road, Point Fortin | #944 Three Hands Main Road, La Brea |
| **Parliament Profile** | https://www.ttparliament.org/members/member/ernesto-kesar/ | https://www.ttparliament.org/members/member/clyde-elder/ |
| **Website** | | |
| **Facebook** | | |
| **Instagram** | | |
| **X** | | |
| **Photo** | | |

**Note:** La Brea (Clyde Elder, UNC) is ambiguous — between Point Fortin and Siparia. Show on Point Fortin as primary.

---

### Tobago

| Field | MP 1 | MP 2 |
|---|---|---|
| **Full Name** | David Thomas | Joel Sampson |
| **Constituency** | Tobago East | Tobago West |
| **Party** | TPP | TPP |
| **Region Slug** | `tobago` | `tobago` |
| **Confidence** | Clear | Clear |
| **Honorific** | Mr | Mr |
| **Email** | tobagoe@ttparliament.org | tobagow@ttparliament.org |
| **Phone** | (868) 635-0826 | (868) 639-5099 |
| **Office** | Corner North Side and Mason-Les Couteaux Roads, Mason Hall, Tobago | #5 Milford Plaza, Milford Road, Milford Bay, Tobago |
| **Parliament Profile** | https://www.ttparliament.org/members/member/david-thomas/ | https://www.ttparliament.org/members/member/joel-sampson/ |
| **Website** | | |
| **Facebook** | | |
| **Instagram** | | |
| **X** | | |
| **Photo** | | |

---

## Ambiguous Constituencies — Handle at Display Time

These MPs show on two region pages with a boundary note. No hard assignment needed.

| MP | Constituency | Regions |
|---|---|---|
| Nyan Gadsby-Dolly (PNM) | St. Ann's East | `port-of-spain`, `san-juan-laventille` |
| David Lee (UNC) | Caroni Central | `chaguanas`, `couva-tabaquite-talparo` |
| Dr Rishad Seecheran (UNC) | Caroni East | `chaguanas`, `tunapuna-piarco` |
| Shivanna Sam (UNC) | Cumuto/Manzanilla | `sangre-grande`, `mayaro-rio-claro` |
| Davendranath Tancoo (UNC) | Fyzabad | `siparia`, `penal-debe` |
| Clyde Elder (UNC) | La Brea | `point-fortin`, `siparia` |
| Michelle Benjamin (UNC) | Moruga/Tableland | `princes-town` |

---

## MP Profile Page Plan

### URL structure

```
/trinidad/mp/[name-slug]/
```

Examples:
- `/trinidad/mp/stuart-young/`
- `/trinidad/mp/kamla-persad-bissessar/`
- `/trinidad/mp/pennelope-beckles/`

Name-based (not constituency-based) because search traffic comes from names, not constituency slugs.

### Page sections

**1. Header**
- Photo (if available) + full name + honorific
- Constituency name + party badge
- "MP since [election year]" — derived from `electionYear` field

**2. Contact & links**
- Email (mailto link)
- Phone
- Office address
- Parliament profile link (external)
- Website link (external)
- Social links (Facebook, Instagram, X, YouTube — show only what's populated)

**3. Crime data for their region(s)**
- Header: "Crime data for [Region Name]"
- Pull the same stat cards shown on the region page: YTD crime count, murders, robberies, year-on-year change
- Link: "View full crime data for [Region Name] →" → `/trinidad/region/[slug]/`
- For ambiguous MPs with two regions: show both, stacked, each with its own link
- Boundary note for ambiguous: "This constituency spans two administrative regions. Crime data is shown for both."

**4. Region link**
- Card or inline link back to the full region page

### What the page does NOT show
- No ranking of MPs by crime rate
- No editorial commentary
- No comparison between MPs
- No "crime under this MP" framing

### SEO

- `<title>`: `[Full Name] MP — [Constituency] | Crime Hotspots`
- Meta description: `[Full Name] is the Member of Parliament for [Constituency], Trinidad and Tobago. View crime statistics for the [Region] region.`
- Schema.org: `Person` type with `jobTitle: "Member of Parliament"`, `worksFor: Parliament of Trinidad and Tobago`
- These pages will rank for "[MP name] Trinidad", "[MP name] constituency", "[constituency] crime data" — searches nobody else answers

### Generation

Static (prerendered). 41 pages. Data changes only after elections. No SSR needed.

```
src/pages/trinidad/mp/[slug].astro
```

Reads from `src/data/mps.json`. Imports region crime stats from existing data layer.

---

## Links Between Pages

**Region page → MP profiles**
Add an "MPs for this region" card on each `/trinidad/region/[slug]/` page. Lists MP name(s) with constituency, party badge, and link to their profile.

**MP profile → Region page**
"View crime data for [Region] →" link in the crime stats section.

**Area page → MP profile (optional, Phase 2)**
Only where area → constituency mapping is unambiguous. Defer until region pages are complete.

---

## Maintenance Protocol

After any general election or by-election:

1. Update `src/data/mps.json` — name, party, electionYear, socials
2. Check for renamed constituencies (EBC boundary review) — update `constituency` and `constituencySlug` fields
3. Update `regionSlugs` if any boundary change affects mapping
4. Replace photos in `public/images/mps/` if needed
5. Trigger a site rebuild

**Next scheduled general election:** by April 2030
**Constituency names stable until:** ~2027–2028

---

## Photo Guidelines

- Store in `public/images/mps/`
- Filename: `[nameSlug].jpg` (e.g. `stuart-young.jpg`)
- Recommended: 400×400px, square crop, professional headshot
- Source: Parliament website, official party website, or press photo
- If unavailable: show a placeholder with the MP's initials — no broken images
- Do not use social media profile photos without checking licensing

---

*Research source: P4-01-constituency-mp-research.md*
*Next step: data collection (Kavell), then mps.json creation, then page build*
