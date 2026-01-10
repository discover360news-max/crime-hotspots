#!/usr/bin/env python3
"""
Facebook Crime Post Extractor - Local LLM Version

Processes Facebook posts from Ian Alleyne Network and DJ Sherrif to extract
crime data and write to Google Sheets Production sheet.

Uses Ollama (Llama 3 8B) for local LLM processing - no API costs!

Usage:
    python3 fb_crime_extractor.py

Then paste Facebook posts (one or more), press Ctrl+D when done.
"""

import json
import re
import sys
from datetime import datetime
from typing import Dict, List, Optional, Tuple

try:
    import ollama
    import gspread
    from oauth2client.service_account import ServiceAccountCredentials
except ImportError:
    print("❌ Missing dependencies. Please run:")
    print("   pip3 install ollama gspread oauth2client")
    sys.exit(1)


# Configuration
CREDENTIALS_FILE = '../google-credentials.json'
SPREADSHEET_NAME = 'Data - Trinidad and Tobago - Crime Reports - Data'
WORKSHEET_NAME = 'Production'
MODEL_NAME = 'llama3'

# Extraction prompt optimized for SEO-friendly headlines
EXTRACTION_PROMPT = """You are a crime data analyst for Trinidad & Tobago. Extract structured information from this Facebook post.

IMPORTANT: All posts provided are confirmed crime stories from trusted sources (Ian Alleyne Network, DJ Sheriff). Process EVERY post as a crime incident.

Facebook Post:
{post_text}

Extract the following information and return ONLY valid JSON (no markdown, no code blocks):

{{
  "crimeType": "Murder" | "Robbery" | "Shooting" | "Assault" | "Home Invasion" | "Sexual Assault" | "Kidnapping" | "Theft" | "Seizures",
  "headline": "SEO-friendly headline (see rules below)",
  "victims": "<name(s) and age(s) if mentioned, or null>",
  "street": "<specific street name or null>",
  "area": "<neighborhood/area name>",
  "region": "<one of: Port of Spain, San Fernando, Arima, Chaguanas, Point Fortin, Princes Town, Sangre Grande, Penal-Debe, Couva-Tabaquite-Talparo, Tunapuna-Piarco, Diego Martin, Siparia, Mayaro-Rio Claro, Tobago, or null>",
  "date": "<M/D/YYYY format if date mentioned in post, or null if not specified>",
  "summary": "<REQUIRED: 2-3 informative sentences about the incident, MUST be provided even for short posts>"
}}

CRITICAL RULES:

1. HEADLINE GENERATION (SEO-optimized, STRICTLY FACTUAL):
   - Pattern varies by crime type:

   FOR VEHICLE THEFTS:
     * Pattern: "[Vehicle type] [License plate] stolen from [Street], [Area]"
     * Examples:
       - "Nissan Tida Hatchback PCK 5839 stolen from Jackson St., Curepe"
       - "White Toyota Fielder PDZ 6479 stolen from Belmont area"
       - "Honda City stolen from Princes Town"
     * Always include license plate if mentioned
     * Keep location concise: "Jackson St., Curepe" NOT "Curepe Jackson St. Curepe"
     * NO repetition of area name
     * NO gender/ownership assumptions (NO "man's car")

   FOR CRIMES WITH NAMED VICTIMS:
     * Pattern: "[Location descriptor] [Victim name (age)] [action verb] [crime context]"
     * Examples:
       - "Central man Luke Rampersad (25) escapes abductors after being beaten"
       - "Preacher David Charles beaten and robbed by fake passenger along Priority Bus Route"
     * Include victim name and age in parentheses if known

   FOR CRIMES WITHOUT NAMED VICTIMS:
     * Pattern: "[Occupation/descriptor] [action verb] in [Area]"
     * Examples:
       - "Taxi driver robbed in Santa Cruz"
       - "Man shot dead in Laventille"

   GENERAL RULES:
   - Use ACTIVE voice and descriptive verbs
   - Keep under 100 characters
   - NO clickbait - be factual and descriptive
   - NO ASSUMPTIONS about gender, ownership, or details not in post
   - Avoid repetition (don't say location twice)

2. DATE EXTRACTION (CRITICAL - Trinidad uses dd/mm/yyyy format):
   - Trinidad posts use dd/mm/yyyy format (e.g., "6/12/25" = December 6, 2025)
   - CONVERT to mm/dd/yyyy format for the sheet
   - Examples:
     * "6/12/25" → "12/6/2025" (December 6, 2025)
     * "7/12/25" → "12/7/2025" (December 7, 2025)
     * "15/01/25" → "1/15/2025" (January 15, 2025)
   - Also handle text dates: "Tuesday, December 2nd, 2025" → "12/2/2025"
   - Handle relative dates: "yesterday", "last Tuesday", "this morning"
   - If NO date in post → return null (do NOT use today's date)

3. CRIME TYPE CLASSIFICATION:
   - ALL posts are crime stories - select the most appropriate crime type
   - Use "Seizures" for police seizures of guns, drugs, contraband (recovery operations)
   - Use "Theft" for stealing without victim present (vehicle theft, burglary when no one home)
   - Use "Robbery" for stealing with victim present or armed theft
   - Use "Home Invasion" for break-ins where people were home
   - Use "Kidnapping" for abductions
   - Use "Assault" for physical attacks without theft
   - Use "Shooting" for gun violence incidents where victim survived
   - Use "Murder" for killings/homicides

4. LOCATION DETAILS:
   - Street: Specific street name, landmark, or business (e.g., "Priority Bus Route", "Charlotte Street", "KFC Arima")
   - Area: Neighborhood/district (e.g., "Mt. Hope", "Port of Spain", "Diego Martin")
   - Region: Match to one of Trinidad's 14 regions or Tobago

5. VICTIM DETAILS:
   - Extract full name if mentioned
   - Extract age if mentioned
   - Format: "Name (age)" or just "Name" if age unknown
   - NO ASSUMPTIONS about gender or identity if not explicitly stated

6. SUMMARY GENERATION (REQUIRED - MUST ALWAYS PROVIDE):
   - CRITICAL: Summary field is REQUIRED and cannot be empty or null
   - Write 1-3 natural, factual sentences about the incident
   - Include ALL key details from the post (license plate, date, time, location, suspects, amounts)

   FOR VERY SHORT POSTS (vehicle thefts with minimal info):
   - One cohesive sentence with key facts
   - Example: "A Nissan Tida Hatchback, license plate PCK 5839, was reported stolen from Jackson St. in Curepe on December 8, 2025."
   - Include vehicle type, license plate, location, date

   FOR MEDIUM POSTS (some details):
   - 2 sentences: Main facts + additional context
   - Example: "A white Toyota Fielder, license plate PDZ 6479, was stolen from the Belmont area on Saturday night, December 6, 2025. No details about suspects were provided."

   FOR DETAILED POSTS (full information):
   - 2-3 sentences: Incident + Suspect description + Outcome
   - Example: "A taxi driver was robbed of $1,050 TTD around 9:15am on Sunday, December 7, 2025. The suspect, described as a man of African descent with dark complexion, slim build, and kinky afro hairstyle, boarded the taxi on 1st Street, San Juan and asked to be taken to Santa Cruz. He placed an object on the driver's neck during the robbery and fled on Orange Field Road."

   NO ASSUMPTIONS OR SPECULATION:
   - DON'T say: "The victim's car was stolen"
   - DO say: "A Nissan Tida Hatchback was stolen"
   - Write naturally but stick to facts
   - If details limited: Write one simple sentence with what's known

Return ONLY the JSON object, nothing else."""


class FBCrimeExtractor:
    @staticmethod
    def extract_url_from_post(post_text: str) -> Tuple[str, str]:
        """
        Extract Facebook URL from post text and return cleaned post + URL.

        Args:
            post_text: Raw post text (may include FB URL at end)

        Returns:
            Tuple of (cleaned_post_text, fb_url)
        """
        # Regex to match Facebook URLs
        fb_url_pattern = r'https?://(?:www\.)?(?:facebook\.com|fb\.watch|m\.facebook\.com)/[^\s]+'

        # Find all URLs in the post
        urls = re.findall(fb_url_pattern, post_text)

        if urls:
            # Use the last URL found (usually at the end of the post)
            fb_url = urls[-1]
            # Remove the URL from the post text
            cleaned_text = re.sub(fb_url_pattern, '', post_text).strip()
            return cleaned_text, fb_url
        else:
            # No URL found
            return post_text, ''

    def __init__(self):
        """Initialize Google Sheets connection and Ollama client."""
        print("🔧 Initializing FB Crime Extractor...")

        # Connect to Google Sheets
        try:
            scope = ['https://spreadsheets.google.com/feeds',
                     'https://www.googleapis.com/auth/drive']
            creds = ServiceAccountCredentials.from_json_keyfile_name(
                CREDENTIALS_FILE, scope)
            self.client = gspread.authorize(creds)
            self.sheet = self.client.open(SPREADSHEET_NAME).worksheet(WORKSHEET_NAME)
            print(f"✅ Connected to Google Sheet: {SPREADSHEET_NAME}")
        except FileNotFoundError:
            print(f"❌ ERROR: Credentials file not found: {CREDENTIALS_FILE}")
            print("   Make sure google-credentials.json is in the project root.")
            sys.exit(1)
        except Exception as e:
            print(f"❌ ERROR connecting to Google Sheets: {e}")
            sys.exit(1)

        # Test Ollama connection
        try:
            ollama.list()
            print(f"✅ Ollama connected, using model: {MODEL_NAME}")
        except Exception as e:
            print(f"❌ ERROR: Ollama not running or model not found: {e}")
            print("   Make sure Ollama is running and you've pulled the model:")
            print(f"   ollama pull {MODEL_NAME}")
            sys.exit(1)

    def _generate_fallback_summary(self, crime_data: Dict, post_text: str) -> str:
        """
        Generate a natural, factual summary when LLM doesn't provide one.

        Args:
            crime_data: Extracted crime data
            post_text: Original post text

        Returns:
            Natural factual summary string
        """
        crime_type = crime_data.get('crimeType', 'crime')
        area = crime_data.get('area', '')
        date = crime_data.get('date', '')
        street = crime_data.get('street', '')
        headline = crime_data.get('headline', '')

        # For very short posts, create a cohesive single-sentence summary from headline
        if len(post_text) < 100 and headline:
            # Extract key info from post to enhance summary
            # Look for vehicle info, license plates, etc.
            post_upper = post_text.upper()

            # Build natural summary
            if crime_type.lower() == 'theft' and 'VEHICLE' in post_upper:
                # Vehicle theft - use headline as base
                if date and street and area:
                    return f"A vehicle was reported stolen from {street} in {area} on {date}."
                elif date and area:
                    return f"A vehicle was reported stolen from the {area} area on {date}."
                else:
                    return f"A vehicle theft was reported in {area}."
            else:
                # Other crimes
                if date and street and area:
                    return f"A {crime_type.lower()} was reported at {street}, {area} on {date}."
                elif date and area:
                    return f"A {crime_type.lower()} occurred in {area} on {date}."
                else:
                    return f"A {crime_type.lower()} was reported in {area}."

        # For longer posts, provide more detail
        parts = []

        # Main sentence
        if date and street and area:
            parts.append(f"A {crime_type.lower()} occurred at {street} in {area} on {date}.")
        elif date and area:
            parts.append(f"A {crime_type.lower()} occurred in {area} on {date}.")
        elif area:
            parts.append(f"A {crime_type.lower()} was reported in {area}.")
        else:
            parts.append(f"A {crime_type.lower()} was reported.")

        # Add context for longer posts
        if len(post_text) >= 150:
            parts.append("Police are investigating the incident.")

        return ' '.join(parts)

    def extract_crime_data(self, post_text: str) -> Optional[Dict]:
        """
        Extract crime data from FB post using local LLM.

        Args:
            post_text: Raw Facebook post text

        Returns:
            Dictionary with crime data, or None if extraction failed
        """
        print(f"\n🤖 Processing post ({len(post_text)} chars)...")

        prompt = EXTRACTION_PROMPT.format(post_text=post_text)

        try:
            # Call Ollama LLM
            response = ollama.chat(
                model=MODEL_NAME,
                messages=[{
                    'role': 'user',
                    'content': prompt
                }],
                options={
                    'temperature': 0.1,  # Low temperature for consistent extraction
                    'num_predict': 500   # Limit response length
                }
            )

            # Extract JSON from response
            response_text = response['message']['content'].strip()

            # Handle code blocks if LLM wraps in markdown
            if response_text.startswith('```'):
                # Extract JSON from code block
                lines = response_text.split('\n')
                response_text = '\n'.join(lines[1:-1])

            # Parse JSON
            crime_data = json.loads(response_text)

            # Validate required fields
            if not crime_data.get('crimeType'):
                print("⚠️  Missing required field: crimeType")
                return None

            if not crime_data.get('headline'):
                print("⚠️  Missing required field: headline")
                return None

            # Generate fallback summary if LLM didn't provide one
            if not crime_data.get('summary'):
                print("⚠️  No summary from LLM, generating fallback...")
                crime_data['summary'] = self._generate_fallback_summary(crime_data, post_text)

            print(f"✅ Extracted: {crime_data.get('crimeType')} in {crime_data.get('area', 'Unknown')}")
            return crime_data

        except json.JSONDecodeError as e:
            print(f"❌ JSON parsing error: {e}")
            print(f"   Response was: {response_text[:200]}...")
            return None
        except Exception as e:
            print(f"❌ Extraction error: {e}")
            return None

    def write_to_sheet(self, crime_data: Dict, fb_url: str = '') -> bool:
        """
        Write crime data to Google Sheets Production sheet.

        Args:
            crime_data: Dictionary with extracted crime data
            fb_url: Facebook post URL (optional)

        Returns:
            True if successful, False otherwise
        """
        try:
            # Use LLM-generated SEO headline (or fallback to simple format)
            headline = crime_data.get('headline', '')
            if not headline:
                # Fallback if LLM didn't generate headline
                crime_type = crime_data.get('crimeType', 'Crime')
                area = crime_data.get('area', 'Unknown area')
                headline = f"{crime_type} in {area}"

            # Format date (use extracted date or leave empty)
            date_str = crime_data.get('date', '')
            if date_str and date_str.lower() not in ['null', 'none', '']:
                date = date_str
            else:
                # Leave empty if date not specified in post
                date = ''

            # Match Production sheet column structure:
            # Date | Headline | Crime Type | Street | Plus Code | Area | Region | Island | URL | Source | Lat | Long | Summary | Forward...
            row = [
                date,                                    # Date
                headline,                                # Headline (SEO-optimized)
                crime_data.get('crimeType', ''),        # Crime Type
                crime_data.get('street', ''),           # Street
                '',                                      # Plus Code (user adds manually)
                crime_data.get('area', ''),             # Area
                crime_data.get('region', ''),           # Region
                '',                                      # Island (user has formula)
                fb_url,                                  # URL (Facebook post link)
                '',                                      # Source (user's formula handles this)
                '',                                      # Lat (user adds manually or via formula)
                '',                                      # Long (user adds manually or via formula)
                crime_data.get('summary', ''),          # Summary
                ''                                       # Forward (empty)
            ]

            # Append to sheet
            self.sheet.append_row(row, value_input_option='USER_ENTERED')
            print(f"📝 Written to sheet: {headline}")
            return True

        except Exception as e:
            print(f"❌ Error writing to sheet: {e}")
            return False

    def process_posts(self, posts: List[str]) -> Dict:
        """
        Process multiple FB posts in batch.

        Args:
            posts: List of FB post texts

        Returns:
            Dictionary with processing stats
        """
        stats = {
            'total': len(posts),
            'processed': 0,
            'written': 0,
            'skipped': 0,
            'errors': 0
        }

        print(f"\n📊 Processing {stats['total']} Facebook posts...\n")
        print("=" * 60)

        for i, post in enumerate(posts, 1):
            post = post.strip()
            if not post:
                continue

            print(f"\n[{i}/{stats['total']}]")

            # Extract FB URL from post text
            cleaned_post, fb_url = self.extract_url_from_post(post)

            if fb_url:
                print(f"🔗 Found FB URL: {fb_url[:50]}...")

            # Extract crime data from cleaned post
            crime_data = self.extract_crime_data(cleaned_post)

            if crime_data is None:
                stats['skipped'] += 1
                continue

            stats['processed'] += 1

            # Write to Google Sheets with FB URL
            if self.write_to_sheet(crime_data, fb_url):
                stats['written'] += 1
            else:
                stats['errors'] += 1

        return stats


def main():
    """Main entry point."""
    print("\n" + "=" * 60)
    print("  Facebook Crime Post Extractor - Local LLM")
    print("  Using Ollama + Llama 3 8B (No API costs!)")
    print("=" * 60)

    # Initialize extractor
    extractor = FBCrimeExtractor()

    print("\n📋 Instructions:")
    print("1. Paste one or more Facebook posts below")
    print("2. Separate multiple posts with blank lines")
    print("3. Press Ctrl+D (Mac) or Ctrl+Z (Windows) when done")
    print("\nPaste posts now:\n")

    # Read posts from stdin
    try:
        input_text = sys.stdin.read()
        posts = [p.strip() for p in input_text.split('\n\n') if p.strip()]

        if not posts:
            print("❌ No posts provided. Exiting.")
            sys.exit(1)

        # Process all posts
        stats = extractor.process_posts(posts)

        # Print summary
        print("\n" + "=" * 60)
        print("📊 Processing Complete!")
        print("=" * 60)
        print(f"Total posts: {stats['total']}")
        print(f"✅ Successfully processed: {stats['processed']}")
        print(f"📝 Written to sheet: {stats['written']}")
        print(f"⚠️  Skipped (not crimes): {stats['skipped']}")
        print(f"❌ Errors: {stats['errors']}")
        print("=" * 60)

    except KeyboardInterrupt:
        print("\n\n⚠️  Cancelled by user.")
        sys.exit(0)


if __name__ == '__main__':
    main()
