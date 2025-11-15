/**
 * SOCIAL MEDIA POSTER
 *
 * Automatically posts weekly crime reports to Facebook and Twitter
 * Reads from RSS feed, generates custom messages, tracks posted items
 *
 * SETUP:
 * 1. Set Script Properties:
 *    - FACEBOOK_PAGE_ID: Your page ID
 *    - FACEBOOK_ACCESS_TOKEN: Long-lived page access token
 *    - TWITTER_BEARER_TOKEN: Twitter API v2 bearer token
 *    - RSS_FEED_URL: https://crimehotspots.com/rss.xml
 *
 * 2. Create time-based trigger:
 *    - Function: checkAndPostNewContent
 *    - Frequency: Hour timer, Every hour (or Daily 9-10am)
 *
 * FEATURES:
 * - Checks RSS feed for new items
 * - Posts to Facebook with rich preview
 * - Posts to Twitter with hashtags
 * - Prevents duplicate posting
 * - Logs all actions
 */

const CONFIG = {
  rssFeedUrl: PropertiesService.getScriptProperties().getProperty('RSS_FEED_URL') || 'https://crimehotspots.com/rss.xml',
  facebookPageId: PropertiesService.getScriptProperties().getProperty('FACEBOOK_PAGE_ID'),
  facebookAccessToken: PropertiesService.getScriptProperties().getProperty('FACEBOOK_ACCESS_TOKEN'),
  twitterBearerToken: PropertiesService.getScriptProperties().getProperty('TWITTER_BEARER_TOKEN'),
  sheetName: 'Social Media Posts Log' // Track posted items
};

/**
 * Main function - checks for new content and posts
 * Run this on a schedule (hourly or daily)
 */
function checkAndPostNewContent() {
  Logger.log('Checking for new content to post...');

  try {
    const newItems = getNewRSSItems();

    if (newItems.length === 0) {
      Logger.log('No new items to post');
      return;
    }

    Logger.log(`Found ${newItems.length} new items to post`);

    newItems.forEach(item => {
      postToFacebook(item);
      Utilities.sleep(2000); // Wait 2 seconds between posts

      postToTwitter(item);
      Utilities.sleep(2000);

      logPostedItem(item);
    });

    Logger.log('Social media posting complete');
  } catch (error) {
    Logger.log(`Error: ${error.message}`);
  }
}

/**
 * Fetch RSS feed and return new items not yet posted
 */
function getNewRSSItems() {
  try {
    const response = UrlFetchApp.fetch(CONFIG.rssFeedUrl);
    const xml = XmlService.parse(response.getContentText());
    const root = xml.getRootElement();
    const channel = root.getChild('channel');
    const items = channel.getChildren('item');

    const postedUrls = getPostedUrls();
    const newItems = [];

    items.forEach(item => {
      const title = item.getChildText('title');
      const link = item.getChildText('link');
      const description = item.getChildText('description');
      const pubDate = item.getChildText('pubDate');
      const categories = item.getChildren('category').map(cat => cat.getText());

      if (!postedUrls.includes(link)) {
        newItems.push({
          title: title,
          link: link,
          description: description,
          pubDate: pubDate,
          categories: categories,
          country: extractCountry(categories)
        });
      }
    });

    return newItems;
  } catch (error) {
    Logger.log(`Error fetching RSS: ${error.message}`);
    return [];
  }
}

/**
 * Post to Facebook Page
 */
function postToFacebook(item) {
  if (!CONFIG.facebookPageId || !CONFIG.facebookAccessToken) {
    Logger.log('Facebook credentials not configured');
    return;
  }

  const message = generateFacebookMessage(item);

  const url = `https://graph.facebook.com/v18.0/${CONFIG.facebookPageId}/feed`;

  const payload = {
    message: message,
    link: item.link,
    access_token: CONFIG.facebookAccessToken
  };

  const options = {
    method: 'post',
    payload: payload,
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());

    if (result.id) {
      Logger.log(`Posted to Facebook: ${result.id}`);
    } else {
      Logger.log(`Facebook error: ${response.getContentText()}`);
    }
  } catch (error) {
    Logger.log(`Facebook posting error: ${error.message}`);
  }
}

/**
 * Post to Twitter using API v2
 */
function postToTwitter(item) {
  if (!CONFIG.twitterBearerToken) {
    Logger.log('Twitter credentials not configured');
    return;
  }

  const tweet = generateTweet(item);

  const url = 'https://api.twitter.com/2/tweets';

  const payload = {
    text: tweet
  };

  const options = {
    method: 'post',
    headers: {
      'Authorization': `Bearer ${CONFIG.twitterBearerToken}`,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());

    if (result.data && result.data.id) {
      Logger.log(`Posted to Twitter: ${result.data.id}`);
    } else {
      Logger.log(`Twitter error: ${response.getContentText()}`);
    }
  } catch (error) {
    Logger.log(`Twitter posting error: ${error.message}`);
  }
}

/**
 * Generate Facebook post message
 */
function generateFacebookMessage(item) {
  const country = item.country;
  const emoji = getCountryEmoji(country);

  let message = `${emoji} ${item.title}\n\n`;
  message += `${item.description}\n\n`;
  message += `Read the full report: ${item.link}\n\n`;
  message += getHashtags(country, 'facebook');

  return message;
}

/**
 * Generate Twitter tweet (max 280 chars)
 */
function generateTweet(item) {
  const country = item.country;
  const emoji = getCountryEmoji(country);

  // Twitter has 280 char limit, need to be concise
  let tweet = `${emoji} ${item.title}\n\n`;

  // Truncate description if needed
  const maxDescLength = 150;
  let desc = item.description;
  if (desc.length > maxDescLength) {
    desc = desc.substring(0, maxDescLength) + '...';
  }

  tweet += `${desc}\n\n`;
  tweet += `${item.link}\n\n`;

  const hashtags = getHashtags(country, 'twitter');

  // Ensure total length < 280
  if ((tweet + hashtags).length > 280) {
    // Remove some description to fit
    const overflow = (tweet + hashtags).length - 280;
    desc = desc.substring(0, desc.length - overflow - 3) + '...';
    tweet = `${emoji} ${item.title}\n\n${desc}\n\n${item.link}\n\n`;
  }

  tweet += hashtags;

  return tweet;
}

/**
 * Get country-specific hashtags
 */
function getHashtags(country, platform) {
  const hashtagMap = {
    'Trinidad & Tobago': {
      facebook: '#Trinidad #TrinidadTobago #TnT #CaribbeanCrime #PublicSafety #CrimeStats #DataDriven',
      twitter: '#Trinidad #TnT #CaribbeanCrime #PublicSafety'
    },
    'Guyana': {
      facebook: '#Guyana #Georgetown #GuyanaCrime #CaribbeanCrime #PublicSafety #CrimeStats #DataDriven',
      twitter: '#Guyana #Georgetown #CaribbeanCrime'
    },
    'Barbados': {
      facebook: '#Barbados #Bdos #BajanNews #CaribbeanCrime #PublicSafety #CrimeStats',
      twitter: '#Barbados #Bdos #CaribbeanCrime'
    }
  };

  return hashtagMap[country] ? hashtagMap[country][platform] : '#CaribbeanCrime #PublicSafety';
}

/**
 * Get country emoji
 */
function getCountryEmoji(country) {
  const emojiMap = {
    'Trinidad & Tobago': '🇹🇹',
    'Guyana': '🇬🇾',
    'Barbados': '🇧🇧'
  };

  return emojiMap[country] || '📊';
}

/**
 * Extract country from categories
 */
function extractCountry(categories) {
  const countryNames = ['Trinidad & Tobago', 'Guyana', 'Barbados'];

  for (let country of countryNames) {
    if (categories.includes(country)) {
      return country;
    }
  }

  return 'Caribbean';
}

/**
 * Get list of already posted URLs
 */
function getPostedUrls() {
  const sheet = getOrCreateLogSheet();
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    return []; // No posts yet (only header row)
  }

  // Column 2 (index 1) contains URLs
  return data.slice(1).map(row => row[1]);
}

/**
 * Log posted item to spreadsheet
 */
function logPostedItem(item) {
  const sheet = getOrCreateLogSheet();

  sheet.appendRow([
    new Date(),
    item.link,
    item.title,
    item.country,
    'Facebook, Twitter',
    'Success'
  ]);

  Logger.log(`Logged: ${item.title}`);
}

/**
 * Get or create log sheet
 */
function getOrCreateLogSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.sheetName);
    sheet.appendRow(['Timestamp', 'URL', 'Title', 'Country', 'Platforms', 'Status']);
    sheet.getRange('A1:F1').setFontWeight('bold');
  }

  return sheet;
}

/**
 * Manual test function
 */
function testSocialMediaPosting() {
  const testItem = {
    title: 'Test Post: Trinidad & Tobago Weekly Crime Report',
    link: 'https://crimehotspots.com/blog-post.html?slug=test',
    description: 'This is a test post to verify social media automation is working correctly.',
    pubDate: new Date().toUTCString(),
    categories: ['Trinidad & Tobago', 'Weekly Report'],
    country: 'Trinidad & Tobago'
  };

  Logger.log('Testing Facebook post...');
  Logger.log(generateFacebookMessage(testItem));

  Logger.log('\nTesting Twitter post...');
  Logger.log(generateTweet(testItem));

  // Uncomment to actually post (be careful!)
  // postToFacebook(testItem);
  // postToTwitter(testItem);
}

/**
 * Setup function - creates trigger
 */
function setupSocialMediaTrigger() {
  // Delete existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'checkAndPostNewContent') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Create new trigger: Daily at 9 AM
  ScriptApp.newTrigger('checkAndPostNewContent')
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();

  Logger.log('Social media trigger created successfully');
}
