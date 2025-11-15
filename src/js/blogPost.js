// src/js/blogPost.js
import { renderHeader } from './components/header.js';
import { COUNTRIES } from './data/countries.js';

// In production, this will fetch from a generated JSON file
// For now, we'll use the same data structure as blog.js
const blogPosts = {
  'trinidad-weekly-2025-11-10': {
    title: 'Trinidad & Tobago Weekly Crime Report - November 10, 2025',
    country: 'tt',
    countryName: 'Trinidad & Tobago',
    date: '2025-11-10',
    author: 'Crime Hotspots Analytics',
    readTime: '4 min read',
    image: './src/assets/images/trinidad.jpg',
    content: `
## Weekly Crime Overview

This week saw a total of **47 crime incidents** reported across Trinidad & Tobago, representing a **12% decrease** compared to the previous week's 53 incidents.

### Key Statistics

- **Murder**: 3 incidents (down from 5 last week)
- **Robbery**: 12 incidents (up from 8 last week)
- **Theft**: 18 incidents (stable)
- **Assault**: 9 incidents (down from 12)
- **Other**: 5 incidents

### Geographic Hotspots

**Port of Spain** remains the area with the highest concentration of reported crimes, accounting for 34% of all incidents this week. Robbery incidents particularly increased in the downtown area, with 7 of the 12 total robbery incidents occurring within the Port of Spain borough.

**San Fernando** saw 8 incidents, primarily theft-related crimes in commercial areas.

**Arima** reported 5 incidents, with a concerning uptick in vehicle theft cases.

### Crime Type Analysis

**Robbery Trends:**
The 50% increase in robbery incidents is primarily driven by commercial robberies targeting small businesses. Five incidents occurred at retail establishments, suggesting a coordinated pattern that law enforcement is investigating.

**Murder Reduction:**
The decrease in murder incidents is a positive development. All three incidents this week were classified as domestic-related, compared to last week which included gang-related violence.

### Safety Recommendations

Based on this week's data, residents should:

1. **Business owners in Port of Spain**: Enhance security measures, particularly between 6 PM - 10 PM when most robberies occurred
2. **Vehicle owners in Arima**: Utilize secured parking and anti-theft devices
3. **General public**: Remain vigilant in commercial areas during evening hours

### Data Methodology

This report is generated from verified crime incidents reported by major Trinidad & Tobago news sources and cross-referenced with official police reports where available. All data is aggregated and analyzed using our automated data collection system.

For detailed interactive visualizations, view our [Trinidad & Tobago Dashboard](/).

---

**Next Report:** November 17, 2025
    `
  },
  'guyana-weekly-2025-11-10': {
    title: 'Guyana Weekly Crime Report - November 10, 2025',
    country: 'gy',
    countryName: 'Guyana',
    date: '2025-11-10',
    author: 'Crime Hotspots Analytics',
    readTime: '3 min read',
    image: './src/assets/images/guyana.jpg',
    content: `
## Weekly Crime Overview

This week recorded **23 crime incidents** across Guyana, a slight increase from last week's 19 incidents.

### Key Statistics

- **Theft**: 9 incidents (up from 5 last week)
- **Robbery**: 5 incidents (stable)
- **Assault**: 4 incidents (down from 7)
- **Burglary**: 3 incidents (up from 2)
- **Other**: 2 incidents

### Geographic Hotspots

**Georgetown** accounted for 65% of all reported crimes this week. The Stabroek Market area saw a notable spike in theft incidents, with 6 of the 9 total theft cases occurring in this commercial zone.

**East Coast Demerara** reported 4 incidents, primarily residential burglaries.

**Berbice** had 3 incidents, all classified as minor theft.

### Crime Type Analysis

**Theft Concentration:**
The 80% increase in theft incidents is concentrated in Georgetown's commercial district. Market vendors and shoppers reported pickpocketing and opportunistic theft during peak shopping hours (9 AM - 1 PM).

**Assault Decrease:**
The reduction in assault cases represents a positive trend, continuing a month-long decline in violent confrontations.

### Safety Recommendations

1. **Market shoppers**: Secure valuables and avoid carrying large amounts of cash
2. **Residents of East Coast Demerara**: Ensure home security systems are functional
3. **General public**: Report suspicious activity to local authorities

### Data Methodology

This report aggregates verified crime incidents from Guyanese news sources and official police reports. All incidents are geocoded and analyzed for patterns.

For detailed interactive visualizations, view our [Guyana Dashboard](/).

---

**Next Report:** November 17, 2025
    `
  }
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  renderHeader();
  await loadPost();
  setupSocialSharing();
});

async function loadPost() {
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug');

  const loadingEl = document.getElementById('loading');
  const articleEl = document.getElementById('article-content');
  const errorEl = document.getElementById('error-state');

  if (!slug || !blogPosts[slug]) {
    loadingEl.classList.add('hidden');
    errorEl.classList.remove('hidden');
    return;
  }

  const post = blogPosts[slug];

  // Update page metadata
  document.getElementById('post-title').textContent = post.title;
  document.getElementById('post-description').setAttribute('content', post.content.substring(0, 160));
  document.getElementById('og-title').setAttribute('content', post.title);
  document.getElementById('og-description').setAttribute('content', post.content.substring(0, 160));
  document.getElementById('og-image').setAttribute('content', post.image);

  // Populate article content
  document.getElementById('hero-image').src = post.image;
  document.getElementById('hero-image').alt = post.countryName;
  document.getElementById('country-badge').textContent = post.countryName;
  document.getElementById('post-date').textContent = formatDate(post.date);
  document.getElementById('article-title').textContent = post.title;
  document.getElementById('author').textContent = post.author;
  document.getElementById('read-time').textContent = post.readTime;

  // Render markdown content (simple implementation - in production use a proper markdown parser)
  document.getElementById('article-body').innerHTML = parseMarkdown(post.content);

  // Set dashboard link
  const country = COUNTRIES.find(c => c.id === post.country);
  if (country) {
    document.getElementById('dashboard-link').href = `/?country=${country.id}`;
  }

  // Show article, hide loading
  loadingEl.classList.add('hidden');
  articleEl.classList.remove('hidden');
}

function parseMarkdown(markdown) {
  // Simple markdown parser (in production, use a library like marked.js)
  let html = markdown
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(\d+)\. (.*$)/gim, '<li>$2</li>');

  // Wrap list items
  html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');

  // Wrap paragraphs
  html = '<p>' + html + '</p>';

  return html;
}

function setupSocialSharing() {
  const url = encodeURIComponent(window.location.href);
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug');
  const post = blogPosts[slug];

  if (!post) return;

  const title = encodeURIComponent(post.title);

  // Facebook
  document.getElementById('share-facebook').addEventListener('click', () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
  });

  // Twitter
  document.getElementById('share-twitter').addEventListener('click', () => {
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${title}`, '_blank', 'width=600,height=400');
  });

  // WhatsApp
  document.getElementById('share-whatsapp').addEventListener('click', () => {
    window.open(`https://wa.me/?text=${title}%20${url}`, '_blank');
  });

  // Copy link
  document.getElementById('share-copy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      const button = document.getElementById('share-copy');
      button.textContent = 'Copied!';
      setTimeout(() => {
        button.textContent = 'Copy Link';
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  });
}

function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}
