# SOCIAL MEDIA AUTOMATION GUIDE

Complete setup guide for automated social media posting using **100% free tools**.

## ARCHITECTURE

```
RSS Feed (rss.xml)
    ↓
IFTTT/Zapier (Free Tier)
    ↓
├─→ Facebook Page
├─→ Twitter/X
├─→ Instagram (via Buffer)
└─→ WhatsApp Business API (optional)
```

---

## OPTION 1: IFTTT (Recommended - Easiest Setup)

**Free Tier:** 2 applets unlimited runs

### Setup Steps:

1. **Create IFTTT Account**
   - Go to https://ifttt.com/join
   - Sign up (free account)

2. **Create Facebook Applet**
   - Click "Create" → "If This"
   - Search "RSS Feed" → Select "New feed item"
   - Enter feed URL: `https://crimehotspots.com/rss.xml`
   - Click "Then That"
   - Search "Facebook Pages" → Select "Create a link post"
   - Configure:
     - Message: `{{EntryTitle}}`
     - Link URL: `{{EntryUrl}}`
   - Click "Create action"

3. **Create Twitter Applet**
   - Same process as Facebook
   - Search "Twitter" → Select "Post a tweet"
   - Tweet text: `{{EntryTitle}} {{EntryUrl}}`
   - Create action

**Limitations:**
- Only 2 free applets (Facebook + Twitter)
- For Instagram, use Option 2

---

## OPTION 2: ZAPIER (More Flexible)

**Free Tier:** 5 Zaps, 100 tasks/month

### Setup Steps:

1. **Create Zapier Account**
   - Go to https://zapier.com/sign-up
   - Sign up (free account)

2. **Create Facebook Zap**
   - Click "Create Zap"
   - **Trigger:** RSS by Zapier
     - Event: New Item in Feed
     - Feed URL: `https://crimehotspots.com/rss.xml`
   - **Action:** Facebook Pages
     - Event: Create Page Post
     - Page: Select your Crime Hotspots page
     - Message: Use RSS feed title + excerpt
     - Link: Use RSS feed URL
   - Test and activate

3. **Create Twitter Zap**
   - Same trigger (RSS)
   - Action: Twitter → Create Tweet
   - Tweet text: Combine title + URL (max 280 chars)

4. **Create Instagram Zap (via Buffer)**
   - Create Buffer account (free: 10 posts/month)
   - Trigger: RSS
   - Action: Buffer → Add to Queue
   - Format post with image from blog post

**Advantages:**
- 5 free Zaps (can automate more platforms)
- More customization options
- Can add filters (e.g., only certain countries)

---

## OPTION 3: GOOGLE APPS SCRIPT (Most Powerful, No Limits)

**Cost:** 100% free, unlimited automations

### Why This Is The Best Option:

1. No applet/zap limits
2. Complete customization
3. Can post to multiple platforms
4. Can generate custom images with crime statistics
5. Can vary posting times for optimization
6. Already have Google Apps Script infrastructure

### Implementation:

See `socialMediaPoster.gs` in this directory.

**Features:**
- Reads RSS feed
- Posts to Facebook, Twitter using native APIs
- Generates custom Open Graph images
- Tracks what's been posted (no duplicates)
- Runs on schedule (daily or weekly)

**Setup Steps:**

1. Add `socialMediaPoster.gs` to your Google Apps Script project
2. Set Script Properties:
   - `FACEBOOK_PAGE_ID`: Your Facebook Page ID
   - `FACEBOOK_ACCESS_TOKEN`: Long-lived page access token
   - `TWITTER_API_KEY`: Twitter API credentials
   - `TWITTER_API_SECRET`
   - `TWITTER_ACCESS_TOKEN`
   - `TWITTER_ACCESS_TOKEN_SECRET`
3. Create time-based trigger (daily at 9 AM Caribbean time)
4. Run once to test

---

## SOCIAL MEDIA CONTENT STRATEGY

### Posting Schedule:

**Optimal Times for Caribbean Audience:**
- Facebook: 7:00 AM, 12:00 PM, 7:00 PM AST
- Twitter: 8:00 AM, 1:00 PM, 6:00 PM AST
- Instagram: 11:00 AM, 5:00 PM AST

### Content Templates:

**Weekly Report Announcement:**
```
New Crime Report: Trinidad & Tobago - Week of Nov 10

47 incidents reported this week:
- Murder: ⬇️ 12% decrease
- Robbery: ⬆️ 50% increase (Port of Spain)
- Theft: Stable at 18 incidents

Read the full analysis: [LINK]

#TrinidadCrime #PublicSafety #DataDriven
```

**Trending Area Alert:**
```
Crime Hotspot Alert: Port of Spain

34% of this week's crimes occurred in Port of Spain area.
Robbery incidents up significantly in downtown district.

Stay vigilant. View live dashboard: [LINK]

#PortOfSpain #Trinidad #SafetyAlert
```

**Data Insight:**
```
Did you know? 📊

Vehicle theft in Arima increased 60% this week compared to last week.

Residents urged to use secured parking and anti-theft devices.

View full statistics: [LINK]

#CrimePrevention #DataAnalytics
```

### Hashtag Strategy:

**Country-Specific:**
- Trinidad: `#Trinidad #TrinidadTobago #TriniCrime #TnT`
- Guyana: `#Guyana #GuyanaCrime #Georgetown #GuyanaNews`
- Barbados: `#Barbados #Bdos #BajanNews`

**General:**
- `#CaribbeanCrime #PublicSafety #CrimeStats`
- `#DataDriven #CrimeAnalytics #SafetyCommunity`
- `#CrimePrevention #CommunityWatch`

### Image Strategy:

**Post Types:**
1. **Weekly Stats Card** - Infographic with key numbers
2. **Area Heatmap** - Visual showing crime hotspots
3. **Trend Chart** - Line graph showing week-over-week changes
4. **Quote Card** - Safety tip with branded background

**Tool for Image Generation:**
- Canva Free Tier (2,000+ templates)
- Or generate programmatically with Google Apps Script + Google Slides API

---

## PLATFORM-SPECIFIC BEST PRACTICES

### Facebook:
- Use Open Graph tags for rich previews
- Post 1-2 times daily (morning + evening)
- Use Facebook Insights to track engagement
- Reply to comments within 1 hour (use notifications)
- Create Facebook Group for community discussion

### Twitter/X:
- Tweet 3-5 times daily
- Use threads for weekly reports (better engagement)
- Retweet news sources you analyze
- Use polls for community engagement
- Pin weekly report to profile

### Instagram:
- Post 3-4 times weekly
- Use carousel posts for statistics
- Stories for quick updates
- Reels for monthly trend reviews
- Use location tags for virality

### WhatsApp Business (Optional):
- Broadcast lists for subscribers
- Daily headline summary (text-based)
- No automation available (manual posting)
- Direct link to headlines page

---

## TRACKING & OPTIMIZATION

### Metrics to Monitor:

1. **Engagement Rate**
   - Likes, shares, comments per post
   - Click-through rate to website

2. **Follower Growth**
   - Track weekly gains/losses
   - Correlate with posting frequency

3. **Top Performing Content**
   - Which crime types get most engagement?
   - Which countries get most shares?
   - Best posting times

4. **Referral Traffic**
   - Use UTM parameters: `?utm_source=facebook&utm_medium=social&utm_campaign=weekly_report`
   - Track in Google Analytics

### Free Analytics Tools:

- **Facebook Insights**: Built-in to Facebook Pages
- **Twitter Analytics**: Built-in to Twitter
- **Instagram Insights**: Built-in to Instagram Business accounts
- **Google Analytics**: Track social referral traffic
- **Bitly**: Track link clicks (free tier: 1,500 links/month)

---

## VIRAL GROWTH TACTICS

### 1. Collaborate with News Outlets
- Tag major news sources in posts
- Offer to be data source for journalists
- Provide embeddable widgets for their sites

### 2. Community Engagement
- Run weekly polls: "What's your biggest safety concern?"
- Feature user-submitted safety tips
- Highlight positive policing initiatives

### 3. Influencer Partnerships
- Reach out to Caribbean influencers
- Provide them with exclusive data insights
- Co-create content on crime prevention

### 4. Controversy Hooks (Use Carefully)
- Compare crime rates between islands
- Highlight unusual crime trends
- Fact-check politician claims about crime

### 5. Interactive Content
- "Guess the crime hotspot" quiz
- "How safe is your neighborhood?" tool
- Crime prediction polls

### 6. Media Outreach
- Send weekly press releases to Caribbean media
- Offer expert commentary on crime trends
- Pitch stories to international outlets (BBC, Al Jazeera)

---

## AUTOMATION WORKFLOW

**Recommended Setup:**

1. **Monday 8 AM:** Google Apps Script generates weekly reports → commits to GitHub
2. **Monday 8:30 AM:** GitHub Actions builds site → deploys to Cloudflare Pages
3. **Monday 9 AM:** RSS feed updates with new posts
4. **Monday 9:15 AM:** IFTTT/Zapier detects new RSS item → posts to Facebook
5. **Monday 9:30 AM:** IFTTT/Zapier posts to Twitter
6. **Monday 10 AM:** Manual Instagram post (or via Buffer)
7. **Throughout week:** Share individual headlines on social media

**Manual Tasks (15 min/day):**
- Reply to comments/DMs
- Share trending headlines
- Engage with news outlet posts

---

## COST BREAKDOWN

| Service | Free Tier Limit | Sufficient for Project? |
|---------|----------------|-------------------------|
| IFTTT | 2 applets | ✅ Yes (FB + Twitter) |
| Zapier | 5 zaps, 100 tasks/month | ✅ Yes (5 platforms) |
| Google Apps Script | 6 hours runtime/day | ✅ Yes (unlimited) |
| Buffer | 10 posts/month | ⚠️ Limited (Instagram only) |
| Canva | 2,000+ templates | ✅ Yes |
| Bitly | 1,500 links/month | ✅ Yes |

**Total Cost:** $0/month

**Recommendation:** Use Google Apps Script for maximum flexibility and no limits.

---

## NEXT STEPS

1. ✅ Set up Facebook Page
2. ✅ Set up Twitter account
3. ✅ Set up Instagram Business account
4. ✅ Choose automation tool (IFTTT vs Zapier vs Google Apps Script)
5. ✅ Configure RSS-to-Social automation
6. ✅ Create content calendar
7. ✅ Set up UTM tracking
8. ✅ Monitor analytics weekly

**Target:** 1,000 followers per platform within 3 months
