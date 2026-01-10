#!/usr/bin/env python3
"""
Quick diagnostic to test Google Sheets connection.
"""

import json
import sys

try:
    import gspread
    from oauth2client.service_account import ServiceAccountCredentials
except ImportError:
    print("❌ Missing dependencies. Run: pip3 install gspread oauth2client")
    sys.exit(1)

# Configuration
CREDENTIALS_FILE = '../google-credentials.json'
SPREADSHEET_NAME = 'Trinidad Crime Data - Production'

print("\n🔍 Diagnosing Google Sheets Connection...")
print("=" * 60)

# Step 1: Check credentials file
print("\n1️⃣ Checking credentials file...")
try:
    with open(CREDENTIALS_FILE, 'r') as f:
        creds_data = json.load(f)
    print(f"   ✅ Credentials file found")
    print(f"   📧 Service account: {creds_data.get('client_email', 'N/A')}")
    print(f"   🆔 Project ID: {creds_data.get('project_id', 'N/A')}")
except FileNotFoundError:
    print(f"   ❌ Credentials file not found: {CREDENTIALS_FILE}")
    sys.exit(1)
except Exception as e:
    print(f"   ❌ Error reading credentials: {e}")
    sys.exit(1)

# Step 2: Test authentication
print("\n2️⃣ Testing authentication...")
try:
    scope = [
        'https://spreadsheets.google.com/feeds',
        'https://www.googleapis.com/auth/drive'
    ]
    creds = ServiceAccountCredentials.from_json_keyfile_name(
        CREDENTIALS_FILE, scope)
    client = gspread.authorize(creds)
    print("   ✅ Authentication successful")
except Exception as e:
    print(f"   ❌ Authentication failed: {e}")
    print("\n💡 Common causes:")
    print("   - Google Drive API not enabled in Cloud Console")
    print("   - Google Sheets API not enabled in Cloud Console")
    print(f"   - Enable at: https://console.cloud.google.com/apis/api/drive.googleapis.com/overview?project={creds_data.get('project_id')}")
    sys.exit(1)

# Step 3: List accessible spreadsheets
print("\n3️⃣ Listing accessible spreadsheets...")
try:
    spreadsheets = client.openall()
    print(f"   ✅ Found {len(spreadsheets)} accessible spreadsheets:")
    for sheet in spreadsheets[:10]:  # Show first 10
        print(f"      - {sheet.title}")
    if len(spreadsheets) > 10:
        print(f"      ... and {len(spreadsheets) - 10} more")
except Exception as e:
    print(f"   ❌ Error listing spreadsheets: {e}")
    sys.exit(1)

# Step 4: Try to open target spreadsheet
print(f"\n4️⃣ Opening target spreadsheet: '{SPREADSHEET_NAME}'...")
try:
    spreadsheet = client.open(SPREADSHEET_NAME)
    print(f"   ✅ Spreadsheet opened successfully!")
    print(f"   📄 Title: {spreadsheet.title}")
    print(f"   🔗 URL: {spreadsheet.url}")

    # List worksheets
    worksheets = spreadsheet.worksheets()
    print(f"   📊 Worksheets ({len(worksheets)}):")
    for ws in worksheets:
        print(f"      - {ws.title} ({ws.row_count} rows x {ws.col_count} cols)")

except gspread.exceptions.SpreadsheetNotFound:
    print(f"   ❌ Spreadsheet not found: '{SPREADSHEET_NAME}'")
    print("\n💡 Make sure:")
    print(f"   1. The spreadsheet exists")
    print(f"   2. It's shared with: {creds_data.get('client_email')}")
    print(f"   3. The service account has 'Editor' access")
    sys.exit(1)
except Exception as e:
    print(f"   ❌ Error opening spreadsheet: {e}")
    sys.exit(1)

# Success!
print("\n" + "=" * 60)
print("🎉 All checks passed! Ready to extract crime data.")
print("=" * 60)
