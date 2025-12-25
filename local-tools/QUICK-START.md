# Quick Start Guide - FB Crime Extractor

**You're almost ready!** Just 2 more steps:

---

## Step 1: Install Python Dependencies (2 minutes)

Open Terminal and run:

```bash
cd ~/Documents/Side\ Projects/Crime\ Hotspots/local-tools/
pip3 install -r requirements.txt
```

**Expected output:**
```
Collecting ollama>=0.1.0
  Downloading ollama-0.x.x-py3-none-any.whl
Collecting gspread>=5.12.0
  Downloading gspread-5.x.x-py3-none-any.whl
...
Successfully installed ollama-0.x.x gspread-5.x.x oauth2client-4.x.x
```

---

## Step 2: Test with Sample Data (2 minutes)

### Test the extractor with provided sample posts:

```bash
# Still in local-tools/ directory
python3 fb_crime_extractor.py < sample_fb_posts.txt
```

**What should happen:**
1. Script connects to Google Sheets ✅
2. Processes 6 sample Facebook posts
3. Extracts 5 crimes (skips 1 non-crime post)
4. Writes data to Trinidad Crime Data → Production sheet
5. Shows summary stats

**Expected output:**
```
============================================================
  Facebook Crime Post Extractor - Local LLM
  Using Ollama + Llama 3 8B (No API costs!)
============================================================

🔧 Initializing FB Crime Extractor...
✅ Connected to Google Sheet: Trinidad Crime Data - Production
✅ Ollama connected, using model: llama3

📊 Processing 6 Facebook posts...
============================================================

[1/6]
🤖 Processing post (...)
✅ Extracted: Murder in Laventille
📝 Written to sheet: Murder - Upper Sixth Street, Laventille

[2/6]
🤖 Processing post (...)
✅ Extracted: Robbery in Port of Spain
📝 Written to sheet: Robbery - Charlotte Street, Port of Spain

...

============================================================
📊 Processing Complete!
============================================================
Total posts: 6
✅ Successfully processed: 5
📝 Written to sheet: 5
⚠️  Skipped (not crimes): 1
❌ Errors: 0
============================================================
```

---

## Step 3: Verify Data in Google Sheets

1. Open your **Trinidad Crime Data - Production** sheet
2. Scroll to bottom
3. You should see 5 new rows with:
   - Date (today's date)
   - Crime type (Murder, Robbery, etc.)
   - Location (street addresses)
   - Region (Laventille, Port of Spain, etc.)
   - Summary (2-3 sentence description)
   - Source: "Facebook"

**If you see these rows, SUCCESS! 🎉**

---

## Next: Process Real Facebook Posts

### Interactive Mode (Recommended for first time)

```bash
python3 fb_crime_extractor.py
```

**Then:**
1. Copy a Facebook post from Ian Alleyne Network or DJ Sherrif
2. Paste it into the terminal
3. Press **Ctrl+D** (you'll see "^D" appear)
4. Watch it process and write to Google Sheets

### Batch Mode (For multiple posts)

1. Copy several FB posts into a text file (one post per paragraph)
2. Save as `my_fb_posts.txt`
3. Run: `python3 fb_crime_extractor.py < my_fb_posts.txt`

---

## Troubleshooting

### If you get "ModuleNotFoundError: No module named 'ollama'"

```bash
# Make sure you ran pip3 install in the correct directory:
cd ~/Documents/Side\ Projects/Crime\ Hotspots/local-tools/
pip3 install -r requirements.txt
```

### If you get "Credentials file not found"

```bash
# Check the file is in the right place:
ls -la ~/Documents/Side\ Projects/Crime\ Hotspots/google-credentials.json

# If missing, you need to download it again from Google Cloud Console
```

### If you get "Failed to find spreadsheet"

1. Go to Google Sheets
2. Open "Trinidad Crime Data - Production"
3. Click "Share"
4. Make sure the service account email is listed with "Editor" access
   - Email is in the `google-credentials.json` file under `"client_email"`

---

## Daily Workflow (Once Set Up)

**Every Monday morning (5-10 minutes):**

1. Open Facebook → Ian Alleyne Network
2. Scroll through last week's posts
3. Copy crime-related posts (Ctrl+C)
4. Open Terminal: `cd local-tools && python3 fb_crime_extractor.py`
5. Paste posts (Ctrl+V)
6. Press Ctrl+D
7. Verify data in Google Sheets

**That's it!** No more manual data entry into spreadsheets.

---

## Performance Tips

- **10 posts = ~1-2 minutes processing time** on Intel Mac
- **50 posts = ~5-8 minutes** (perfectly manageable)
- Process posts in batches of 20-30 for best workflow
- You can stop and resume anytime (Ctrl+C to cancel)

---

**Ready? Run Step 1 and Step 2 above!** 🚀

Let me know when you've tested it with the sample data.
