#!/usr/bin/env python3
"""
Archive URL Scraper for Trinidad News Sources (Python Version)

PURPOSE: Scrape Trinidad Express, Guardian TT, and Newsday archives to find missing articles
CRITICAL: URLs are written to CSV for MANUAL review, NOT auto-processed

Why manual review?
- We also collect news from Facebook sources
- Need to verify articles are actual crime incidents (not politics, court cases, etc.)
- Pre-filter helps but human verification preferred for backfill

REQUIREMENTS:
pip install requests beautifulsoup4 pandas lxml

USAGE:
python archive-scraper.py --source all --output archive_review.csv
python archive-scraper.py --source express --max-pages 50
python archive-scraper.py --source guardian --start-date 2024-01-01 --end-date 2025-12-13
python archive-scraper.py --cross-reference existing_urls.csv
"""

import requests
from bs4 import BeautifulSoup
import pandas as pd
import re
import time
import argparse
from datetime import datetime, timedelta
from urllib.parse import urljoin
import csv
import sys

# Configuration
CONFIG = {
    'TRINIDAD_EXPRESS': {
        'base_url': 'https://trinidadexpress.com/news/local/',
        'page_param': '?page=',
        'max_pages': 50,
        'url_pattern': re.compile(r'https://trinidadexpress\.com/[^"\'\\s]+/article_[a-f0-9-]+\.html')
    },
    'GUARDIAN': {
        'base_url': 'https://www.guardian.co.tt/archive/',
        'url_pattern': re.compile(r'https://www\.guardian\.co\.tt/[^"\'\\s]+')
    },
    'NEWSDAY': {
        'base_url': 'https://newsday.co.tt/category/news/',
        'page_param': 'page/',
        'max_pages': 50,
        'url_pattern': re.compile(r'https://newsday\.co\.tt/\d{4}/\d{2}/\d{2}/[^"\'\\s]+')
    }
}

# Crime keywords for simple scoring
CRIME_KEYWORDS = ['murder', 'kill', 'shot', 'robbery', 'rape', 'assault', 'kidnap', 'theft', 'burglary', 'shooting', 'stabbing', 'crime', 'police', 'victim', 'arrested']
NON_CRIME_KEYWORDS = ['minister', 'rowley', 'court', 'case collapse', 'venezuela', 'election', 'parliament', 'festival', 'carnival', 'sports', 'cricket']


class ArchiveScraper:
    def __init__(self, delay=1.0):
        self.delay = delay
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })

    def scrape_trinidad_express(self, max_pages=50):
        """Scrape Trinidad Express archives (pagination-based)"""
        print(f"📰 Scraping Trinidad Express (up to {max_pages} pages)...")
        urls = set()
        config = CONFIG['TRINIDAD_EXPRESS']

        for page in range(1, max_pages + 1):
            try:
                page_url = f"{config['base_url']}{config['page_param']}{page}"
                response = self.session.get(page_url, timeout=30)
                response.raise_for_status()

                # Extract URLs using regex
                matches = config['url_pattern'].findall(response.text)
                for url in matches:
                    urls.add(url.strip('\'"'))

                if page % 10 == 0:
                    print(f"  Page {page}/{max_pages} - {len(urls)} URLs so far")

                time.sleep(self.delay)

            except Exception as e:
                print(f"⚠️  Error scraping Trinidad Express page {page}: {e}")

        print(f"✅ Trinidad Express: {len(urls)} URLs found")
        return list(urls)

    def scrape_guardian(self, start_date=None, end_date=None):
        """Scrape Guardian TT archives (date-based)"""
        if not start_date:
            start_date = datetime(2024, 1, 1)
        if not end_date:
            end_date = datetime.now()

        print(f"📰 Scraping Guardian TT from {start_date.date()} to {end_date.date()}...")
        urls = set()
        config = CONFIG['GUARDIAN']

        current_date = start_date
        while current_date <= end_date:
            try:
                date_str = current_date.strftime('%Y-%m-%d')
                archive_url = f"{config['base_url']}{date_str}"

                response = self.session.get(archive_url, timeout=30)
                if response.status_code == 200:
                    # Extract article URLs
                    matches = config['url_pattern'].findall(response.text)
                    for url in matches:
                        clean_url = url.strip('\'"')
                        # Only include article URLs, not category/archive pages
                        if '/archive/' not in clean_url and '/category/' not in clean_url:
                            urls.add(clean_url)

                # Next day
                current_date += timedelta(days=1)

                # Log progress monthly
                if current_date.day == 1:
                    print(f"  {current_date.strftime('%Y-%m')} - {len(urls)} URLs so far")

                time.sleep(0.5)

            except Exception as e:
                # Silent fail for dates without archives
                pass

        print(f"✅ Guardian TT: {len(urls)} URLs found")
        return list(urls)

    def scrape_newsday(self, max_pages=50):
        """Scrape Newsday archives (pagination-based)"""
        print(f"📰 Scraping Newsday (up to {max_pages} pages)...")
        urls = set()
        config = CONFIG['NEWSDAY']

        for page in range(1, max_pages + 1):
            try:
                page_url = f"{config['base_url']}{config['page_param']}{page}"
                response = self.session.get(page_url, timeout=30)
                response.raise_for_status()

                # Extract URLs using regex
                matches = config['url_pattern'].findall(response.text)
                for url in matches:
                    urls.add(url.strip('\'"'))

                if page % 10 == 0:
                    print(f"  Page {page}/{max_pages} - {len(urls)} URLs so far")

                time.sleep(self.delay)

            except Exception as e:
                print(f"⚠️  Error scraping Newsday page {page}: {e}")

        print(f"✅ Newsday: {len(urls)} URLs found")
        return list(urls)

    def score_url(self, url, title=""):
        """Simple pre-filter scoring based on keywords"""
        score = 0
        text = f"{url} {title}".lower()

        for keyword in CRIME_KEYWORDS:
            if keyword in text:
                score += 5

        for keyword in NON_CRIME_KEYWORDS:
            if keyword in text:
                score -= 5

        return score

    def fetch_title(self, url):
        """Fetch article title for pre-filter scoring"""
        try:
            response = self.session.get(url, timeout=10)
            soup = BeautifulSoup(response.text, 'lxml')
            title_tag = soup.find('title')
            return title_tag.text.strip() if title_tag else ""
        except:
            return ""


def cross_reference_urls(scraped_urls, existing_csv):
    """Cross-reference scraped URLs with existing CSV to find missing ones"""
    print(f"🔍 Cross-referencing with {existing_csv}...")

    try:
        existing_df = pd.read_csv(existing_csv)
        # Assuming URL column is named 'URL' or first column
        url_column = 'URL' if 'URL' in existing_df.columns else existing_df.columns[0]
        existing_urls = set(existing_df[url_column].dropna().str.strip())

        missing_urls = [url for url in scraped_urls if url not in existing_urls]

        print(f"📊 Total scraped: {len(scraped_urls)}")
        print(f"📊 Existing: {len(existing_urls)}")
        print(f"🆕 Missing: {len(missing_urls)}")

        return missing_urls

    except Exception as e:
        print(f"⚠️  Error reading existing CSV: {e}")
        return scraped_urls


def save_to_csv(urls, output_file, score_urls=False, scraper=None):
    """Save URLs to CSV for manual review"""
    print(f"💾 Saving {len(urls)} URLs to {output_file}...")

    data = []
    for i, url in enumerate(urls):
        # Determine source
        if 'trinidadexpress.com' in url:
            source = 'Trinidad Express'
        elif 'guardian.co.tt' in url:
            source = 'Guardian TT'
        elif 'newsday.co.tt' in url:
            source = 'Newsday'
        else:
            source = 'Unknown'

        # Optional: Fetch title and score
        title = ""
        score = 0
        if score_urls and scraper:
            if (i + 1) % 10 == 0:
                print(f"  Scoring URL {i + 1}/{len(urls)}...")
            title = scraper.fetch_title(url)
            score = scraper.score_url(url, title)
            time.sleep(1)

        data.append({
            'URL': url,
            'Source': source,
            'Date Found': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'Status': 'Pending Review',
            'Pre-filter Score': score if score_urls else '',
            'Title': title,
            'Notes': ''
        })

    df = pd.DataFrame(data)
    df.to_csv(output_file, index=False)
    print(f"✅ Saved to {output_file}")


def main():
    parser = argparse.ArgumentParser(description='Scrape Trinidad news archives for missing articles')
    parser.add_argument('--source', choices=['express', 'guardian', 'newsday', 'all'], default='all',
                        help='News source to scrape')
    parser.add_argument('--max-pages', type=int, default=50,
                        help='Maximum pages to scrape (for pagination-based sources)')
    parser.add_argument('--start-date', type=str,
                        help='Start date for Guardian scraping (YYYY-MM-DD)')
    parser.add_argument('--end-date', type=str,
                        help='End date for Guardian scraping (YYYY-MM-DD)')
    parser.add_argument('--output', type=str, default='archive_review.csv',
                        help='Output CSV file')
    parser.add_argument('--cross-reference', type=str,
                        help='CSV file with existing URLs to cross-reference')
    parser.add_argument('--score', action='store_true',
                        help='Fetch titles and calculate pre-filter scores (slower)')
    parser.add_argument('--delay', type=float, default=1.0,
                        help='Delay between requests in seconds')

    args = parser.parse_args()

    scraper = ArchiveScraper(delay=args.delay)
    all_urls = []

    # Scrape sources
    if args.source in ['express', 'all']:
        urls = scraper.scrape_trinidad_express(max_pages=args.max_pages)
        all_urls.extend(urls)

    if args.source in ['guardian', 'all']:
        start_date = datetime.strptime(args.start_date, '%Y-%m-%d') if args.start_date else datetime(2024, 1, 1)
        end_date = datetime.strptime(args.end_date, '%Y-%m-%d') if args.end_date else datetime.now()
        urls = scraper.scrape_guardian(start_date=start_date, end_date=end_date)
        all_urls.extend(urls)

    if args.source in ['newsday', 'all']:
        urls = scraper.scrape_newsday(max_pages=args.max_pages)
        all_urls.extend(urls)

    # Remove duplicates
    all_urls = list(set(all_urls))
    print(f"\n📊 Total unique URLs scraped: {len(all_urls)}")

    # Cross-reference if provided
    if args.cross_reference:
        all_urls = cross_reference_urls(all_urls, args.cross_reference)

    # Save to CSV
    if all_urls:
        save_to_csv(all_urls, args.output, score_urls=args.score, scraper=scraper if args.score else None)
    else:
        print("ℹ️  No URLs to save")


if __name__ == '__main__':
    main()
