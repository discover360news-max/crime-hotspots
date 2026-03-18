# MP Update Workflow

Reference guide for updating Member of Parliament data across Jamaica and Trinidad & Tobago.

---

## Files

| Country | Data file | Photo folder |
|---|---|---|
| Jamaica | `astro-poc/src/data/mps-jamaica.json` | `astro-poc/public/images/mps/jamaica/` |
| Trinidad & Tobago | `astro-poc/src/data/mps.json` | `astro-poc/public/images/mps/trinidad-and-tobago/` |

Photo path convention: `"photo": "jamaica/filename.webp"` or `"photo": "trinidad-and-tobago/filename.webp"` — the prefix is always the folder name under `public/images/mps/`.

---

## MP Entry Structure

```json
{
  "nameSlug": "firstname-lastname",
  "fullName": "Full Name",
  "title": "MP",
  "honorific": "The Honourable",        // or "" if none
  "constituency": "Constituency Name",
  "constituencySlug": "constituency-name",
  "party": "PNP",                        // PNP | JLP (Jamaica) | PNM | UNC | TPP (T&T)
  "partyFull": "People's National Party",
  "electionYear": 2025,
  "parishSlugs": ["parish-name"],        // Jamaica only
  "regionSlugs": ["region-name"],        // T&T only
  "regionConfidence": "clear",
  "contact": {
    "email": "",
    "emailAlt": "",
    "phone": "",                         // multiple: "876-000-0000, 876-000-0001"
    "whatsapp": "",
    "office": "Street, Town, Parish",    // comma-separated, no line breaks
    "parliamentProfile": ""              // full URL
  },
  "website": "",
  "socials": {
    "facebook": "",                      // full URL
    "instagram": "",                     // full URL
    "x": "",                             // full URL (twitter.com or x.com both fine)
    "youtube": "",
    "tiktok": ""
  },
  "photo": ""                            // "jamaica/filename.webp" or ""
}
```

---

## Parliament Profile URLs

### Jamaica (JAMPJA)
Pattern: `https://www.jampja.org/parliamentarian/[slug]/`

Some slugs have a `-2` suffix to disambiguate (e.g. `desmond-mckenzie-2`, `daryl-vaz-2`, `robert-montague-2`, `delroy-chuck-2`). Always verify the URL loads before saving.

### Trinidad & Tobago
Pattern: `https://www.ttparliament.org/members/[slug]/` — check per MP.

---

## Workflow: Updating Contact Info

Per-MP data is provided in this format (one MP at a time or batches):

```
Full Name: Constituency
Office address
Phone number(s)
Social URLs
Email
Parliament profile URL
```

**Steps:**
1. `Grep` for the `nameSlug` in the relevant JSON file to find the line number
2. `Read` ~15 lines around that line to see the full entry
3. `Edit` the `contact` block and `socials` block with unique surrounding context
4. Phone: join multiple numbers with `, ` — e.g. `"876-123-4567, 876-234-5678"`
5. Office: collapse multiline address to comma-separated single string — e.g. `"22 Queen Street, Morant Bay, St. Thomas"`
6. Facebook Page URLs: use as-is (long `/people/Name/ID/` format is fine)
7. X/Twitter: store in `"x"` field regardless of whether URL uses `x.com` or `twitter.com`

---

## Workflow: Adding Photos

1. Place image files in the correct folder (`jamaica/` or `trinidad-and-tobago/`)
2. Name files as `firstname-lastname.webp` (matching the MP's `nameSlug`)
3. Run the session greeting: Claude will check `ls` on the folder and `grep "photo": ""` on the JSON to find matches
4. Claude updates each empty `"photo": ""` field to `"jamaica/filename.webp"`

**Bulk update (Python one-liner used in session):**
```python
import re
path = "src/data/mps-jamaica.json"
with open(path, 'r') as f:
    content = f.read()
updates = { 'nameSlug': 'jamaica/filename.webp' }
for slug, photo in updates.items():
    pattern = rf'("nameSlug": "{re.escape(slug)}".*?"photo": )""'
    content = re.sub(pattern, rf'\1"{photo}"', content, count=1, flags=re.DOTALL)
with open(path, 'w') as f:
    f.write(content)
```

---

## Workflow: Bulk Parliament Profile Updates

Provide a list of JAMPJA URLs. Claude will:
1. Fetch all URLs in parallel to confirm they're valid
2. Grep the JSON for all nameSlug matches
3. Read the relevant entries
4. Edit the `parliamentProfile` field using the full contact line as unique context

---

## Photo Path Convention

All pages build the photo src as:
```js
mp.photo ? `/images/mps/${mp.photo}` : '/images/mps/placeholder.svg'
```

So `"photo": "jamaica/yvonne-shaw.webp"` → `/images/mps/jamaica/yvonne-shaw.webp`.

A `placeholder.svg` exists in both `/images/mps/` and `/images/mps/trinidad-and-tobago/` (the latter is required by Vite's dev-server asset resolution).

---

## Current Photo Coverage

| Country | Total MPs | With photos |
|---|---|---|
| Jamaica | 63 | 22 (as of Mar 2026) |
| Trinidad & Tobago | 41 | 41 |

---

## Gotchas

- **Edit uniqueness**: `"contact": { "email": "", ... "parliamentProfile": "" }` appears 50+ times — always use the full contact line (with unique email/phone/office values) OR the full nameSlug block as context for Edit
- **Multiple phones**: join with `, ` (comma-space), store in `"phone"` field only unless WhatsApp is explicitly confirmed
- **Honorifics**: Jamaica uses "The Honourable" or "The Most Honourable" (PM); T&T similar — check JAMPJA/Parliament site
- **JAMPJA `-2` slugs**: Some MPs share names with others — always verify the URL loads the correct person
- **Photo folder + placeholder**: If you add a new country subfolder for photos, copy `placeholder.svg` into it to avoid a Vite dev-server ENOENT error
