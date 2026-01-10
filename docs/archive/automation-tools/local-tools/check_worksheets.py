#!/usr/bin/env python3
"""Check worksheets in the actual spreadsheet."""

import gspread
from oauth2client.service_account import ServiceAccountCredentials

CREDENTIALS_FILE = '../google-credentials.json'
SPREADSHEET_NAME = 'Data - Trinidad and Tobago - Crime Reports - Data'

scope = [
    'https://spreadsheets.google.com/feeds',
    'https://www.googleapis.com/auth/drive'
]
creds = ServiceAccountCredentials.from_json_keyfile_name(CREDENTIALS_FILE, scope)
client = gspread.authorize(creds)

spreadsheet = client.open(SPREADSHEET_NAME)
worksheets = spreadsheet.worksheets()

print(f"\n📊 Worksheets in '{SPREADSHEET_NAME}':\n")
for i, ws in enumerate(worksheets, 1):
    print(f"{i}. {ws.title} ({ws.row_count} rows x {ws.col_count} cols)")
