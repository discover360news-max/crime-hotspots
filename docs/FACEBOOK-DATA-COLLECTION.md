# Facebook Crime Data Collection Guide

**Purpose**: Capture car thefts and other crimes not reported by traditional media
**Challenge**: Facebook ToS prohibits automated scraping
**Solution**: Manual workflows + community submission forms

---

## ⚠️ Legal & Ethical Considerations

### What's NOT Allowed
- ❌ Automated scraping of Facebook pages/groups
- ❌ Using bots to collect posts
- ❌ Violating Facebook's Terms of Service
- ❌ Accessing private group content without permission

### What IS Allowed
- ✅ Manual review of public Facebook pages
- ✅ Community-submitted reports via your website
- ✅ Official partnerships with Facebook page admins
- ✅ Using Facebook's official Graph API (with permissions)

---

## 📋 Recommended Workflows

### **Option 1: Manual Collection (Current)**

**Best for**: Solo operation, complete control

**Process**:
1. Check 2 Facebook pages daily (Trinidad Crime Watch, etc.)
2. Look for posts about:
   - Car thefts
   - Crimes without media coverage
   - Breaking incidents
3. Manually enter into Google Sheet or report form
4. Takes ~15-20 minutes per day

**Pros**: Legal, accurate, full control
**Cons**: Time-consuming, not scalable

---

### **Option 2: Community Submission Form** ⭐ **RECOMMENDED**

**Best for**: Scaling with community help

**Implementation**:
1. Add "Report a Crime" form to crimehotspots.com (✅ already exists!)
2. Promote on Facebook pages: "Saw a crime? Report it here"
3. Submissions go to Review Queue
4. You verify and approve before adding to LIVE

**Setup**:
```
Your existing report.html form → Google Apps Script → Review Queue
                                                            ↓
                                                    Manual approval
                                                            ↓
                                                        LIVE sheet
```

**Benefits**:
- ✅ Community-powered (scales without your time)
- ✅ Catches crimes from social media
- ✅ You maintain quality control
- ✅ Completely legal

**Promotion Ideas**:
- Post weekly on Facebook: "Report crimes directly on crimehotspots.com"
- Partner with Facebook page admins
- Add QR code to flyers
- Social media campaign: "Help map crime in your area"

---

### **Option 3: Official Facebook Page Partnership**

**Best for**: Long-term growth

**Process**:
1. Contact admins of major crime-watch Facebook pages
2. Propose partnership: "We'll feature your reports on crimehotspots.com with credit"
3. They share reports with you directly (or post to your form)
4. You give them analytics/insights in return

**Value proposition for page admins**:
- Free data visualization (Looker Studio dashboards)
- Expanded reach for their content
- Professional crime mapping platform
- Credit/attribution on every report

**Pages to contact**:
- Trinidad: Trinidad Crime Watch, Trinidad Safety & Security, etc.
- Guyana: Guyana Crime Watch, etc.

---

### **Option 4: Facebook Graph API (Advanced)**

**Best for**: If you get official permission

Facebook allows limited access via Graph API:
- Requires page admin approval
- Can read public posts from pages (not groups)
- Subject to rate limits
- Requires app review by Facebook

**Not recommended for now** because:
- Complex setup
- Requires page admin cooperation
- Facebook app review process
- Better to start with community submissions

---

## 🚀 Quick Win: Optimize Your Report Form

Your existing report form at `/report.html` is perfect for this! Here's how to promote it:

### **1. Add Facebook Share Button**
After submitting a report, show:
```
✅ Report submitted! Help spread awareness:
[Share on Facebook] [Share on Twitter]
```

### **2. Create Facebook Posts Template**
```
🚨 CAR THEFT ALERT 🚨

📍 Location: [Area]
📅 Date: [Date]
🚗 Vehicle: [Details]

Report crimes directly: crimehotspots.com/report

Help map crime in Trinidad & Guyana!
#TrinidadCrime #GuyanaCrime #CrimePrevention
```

### **3. Weekly Facebook Engagement**
Post every Monday:
```
📊 This week's crime stats:
- [X] murders
- [Y] robberies
- [Z] car thefts

Missing from the news? Report it:
👉 crimehotspots.com/report

Your reports help keep our community safe.
```

---

## 📊 Hybrid Workflow (Recommended for You)

**Daily (15 min)**:
1. Check 2 Facebook pages for major crimes
2. Enter manually via report form OR directly into Review Queue sheet

**Weekly (30 min)**:
1. Review community submissions in Review Queue
2. Verify with news sources or Facebook posts
3. Approve → copy to Production → sync to LIVE

**Monthly**:
1. Post crime statistics on Facebook
2. Thank community contributors
3. Promote report form

---

## 🔧 Technical Setup for Community Reports

Your report form already feeds into Google Sheets. To optimize:

**1. Add "Source" field** to track where reports come from:
```javascript
// In reportStandalone.js
const payload = {
  // ... existing fields
  source: 'Community Submission',  // vs 'Media', 'Facebook Manual', etc.
  submitter_ip: navigator.userAgent // For spam detection
};
```

**2. Create Review workflow**:
- Community submissions → Review Queue (confidence: 3)
- You verify with Facebook post or news article
- Add source URL from Facebook (if public)
- Approve → Production → LIVE

**3. Auto-flag suspicious submissions**:
- Multiple submissions from same IP in 1 hour
- Duplicate location/date/crime type
- Honeypot validation (already implemented!)

---

## 📈 Measuring Success

Track these metrics:
- Community submissions per week
- % of submissions that get approved
- Crimes captured that weren't in media
- User engagement on Facebook posts

**Goal**: 50% of car thefts come from community reports within 6 months

---

## ⚡ Immediate Next Steps

1. ✅ **This week**: Promote report form on Facebook pages
2. ✅ **Next week**: Reach out to 2 Facebook page admins for partnership
3. ✅ **This month**: Set up weekly Facebook engagement posts

**Script for Facebook promotion**:
```
🗺️ Introducing Crime Hotspots!

Interactive crime map for Trinidad & Guyana with data from verified news sources.

📊 View live dashboards: crimehotspots.com
🚨 Report unreported crimes: crimehotspots.com/report

Help keep our community safe by reporting crimes in your area!

#TrinidadCrime #CrimePrevention #CommunitySafety
```

---

## 🤝 Legal Compliance Checklist

Before collecting ANY Facebook data:

- ✅ Only use public posts (not private groups)
- ✅ Credit the source (Facebook page name + link)
- ✅ Don't scrape automatically - manual or API only
- ✅ Respect page admins' wishes if they ask you to stop
- ✅ Comply with Trinidad & Tobago / Guyana data protection laws
- ✅ Add privacy policy to your website explaining data sources

---

**Bottom Line**: Start with community submissions via your existing form, then scale with Facebook page partnerships. Automated scraping is risky and unnecessary when you can build a community-powered platform.
