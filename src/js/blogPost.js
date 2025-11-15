// src/js/blogPost.js
import { renderHeader } from './components/header.js';
import { COUNTRIES } from './data/countries.js';
import { initDashboardPanel } from './components/dashboardPanel.js';

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
    image: '/assets/images/trinidad.jpg',
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
    image: '/assets/images/guyana.jpg',
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

// Initialize dashboard panel
let dashboardController;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  renderHeader();
  dashboardController = initDashboardPanel();
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

  // Set up dashboard button to open dashboard panel
  const country = COUNTRIES.find(c => c.id === post.country);
  if (country) {
    const dashboardBtn = document.getElementById('dashboard-link');
    dashboardBtn.href = '#'; // Prevent default link behavior
    dashboardBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (dashboardController && dashboardController.loadDashboard) {
        dashboardController.loadDashboard(country);
      }
    });
  }

  // Show article, hide loading
  loadingEl.classList.add('hidden');
  articleEl.classList.remove('hidden');
}

function parseMarkdown(markdown) {
  // Split content into blocks (paragraphs separated by double newlines)
  const blocks = markdown.trim().split('\n\n');
  let inStatsSection = false;
  let inHotspotsSection = false;

  const parsedBlocks = blocks.map(block => {
    block = block.trim();

    // Check for special sections
    if (block === '### Key Statistics') {
      inStatsSection = true;
      return '<h3 class="text-2xl font-bold mt-8 mb-4 text-slate-900">📊 Key Statistics</h3><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">';
    }

    if (block === '### Geographic Hotspots') {
      if (inStatsSection) {
        inStatsSection = false;
        inHotspotsSection = true;
        return '</div><h3 class="text-2xl font-bold mt-8 mb-4 text-slate-900">📍 Geographic Hotspots</h3>';
      }
      inHotspotsSection = true;
      return '<h3 class="text-2xl font-bold mt-8 mb-4 text-slate-900">📍 Geographic Hotspots</h3>';
    }

    if (block === '### Safety Recommendations') {
      if (inStatsSection) {
        inStatsSection = false;
        return '</div><h3 class="text-2xl font-bold mt-8 mb-4 text-slate-900">🛡️ Safety Recommendations</h3>';
      }
      if (inHotspotsSection) {
        inHotspotsSection = false;
      }
      return '<h3 class="text-2xl font-bold mt-8 mb-4 text-slate-900">🛡️ Safety Recommendations</h3>';
    }

    // Headers (other than special sections)
    if (block.startsWith('### ')) {
      if (inStatsSection) {
        inStatsSection = false;
        return '</div><h3 class="text-xl font-semibold mt-6 mb-3 text-slate-700">' + block.substring(4) + '</h3>';
      }
      return '<h3 class="text-xl font-semibold mt-6 mb-3 text-slate-700">' + block.substring(4) + '</h3>';
    }
    if (block.startsWith('## ')) {
      return '<h2 class="text-3xl font-bold mt-10 mb-6 text-slate-900 border-b-2 border-rose-200 pb-3">' + block.substring(3) + '</h2>';
    }
    if (block.startsWith('# ')) {
      return '<h1 class="text-4xl font-bold mb-4 text-slate-900">' + block.substring(2) + '</h1>';
    }

    // Stats section: Convert list items to stat cards
    if (inStatsSection && (block.startsWith('- ') || block.includes('\n- '))) {
      const items = block.split('\n')
        .filter(line => line.startsWith('- '))
        .map(line => {
          const content = line.substring(2);
          // Parse "**Crime Type**: Number incidents"
          const match = content.match(/\*\*(.*?)\*\*:\s*(\d+)\s*incidents?/);
          if (match) {
            const [, crimeType, count] = match;
            return `
              <div class="bg-white rounded-lg p-5 shadow-md border-l-4 border-rose-500 hover:shadow-lg transition">
                <div class="text-3xl font-bold text-rose-600 mb-1">${count}</div>
                <div class="text-sm font-semibold text-slate-700 uppercase tracking-wide">${crimeType}</div>
                <div class="text-xs text-slate-500 mt-1">incidents</div>
              </div>
            `;
          }
          return `<div class="bg-white rounded-lg p-4 shadow-md">${parseInline(content)}</div>`;
        })
        .join('');
      return items;
    }

    // Hotspots section: Highlight area names
    if (inHotspotsSection && block.startsWith('**') && block.includes('**')) {
      const areaMatch = block.match(/\*\*(.*?)\*\*/);
      if (areaMatch) {
        const area = areaMatch[1];
        const rest = block.replace(/\*\*(.*?)\*\*/, '').trim();
        return `
          <div class="bg-gradient-to-r from-slate-50 to-white rounded-lg p-5 mb-4 border-l-4 border-blue-500 shadow-sm">
            <div class="text-lg font-bold text-slate-900 mb-2">📍 ${area}</div>
            <p class="text-slate-700">${parseInline(rest)}</p>
          </div>
        `;
      }
    }

    // Regular unordered lists
    if (block.startsWith('- ') || block.includes('\n- ')) {
      const items = block.split('\n')
        .filter(line => line.startsWith('- '))
        .map(line => '<li class="mb-2">' + parseInline(line.substring(2)) + '</li>')
        .join('');
      return '<ul class="list-disc ml-6 mb-4 text-slate-700">' + items + '</ul>';
    }

    // Ordered lists
    if (/^\d+\. /.test(block) || block.includes('\n1. ')) {
      const items = block.split('\n')
        .filter(line => /^\d+\. /.test(line))
        .map(line => '<li class="mb-2">' + parseInline(line.replace(/^\d+\. /, '')) + '</li>')
        .join('');
      return '<ol class="list-decimal ml-6 mb-4 text-slate-700">' + items + '</ol>';
    }

    // Horizontal rule
    if (block === '---') {
      if (inStatsSection) {
        inStatsSection = false;
        return '</div><hr class="my-8 border-slate-300">';
      }
      return '<hr class="my-8 border-slate-300">';
    }

    // Regular paragraph
    return '<p class="mb-4 text-slate-700 leading-relaxed text-lg">' + parseInline(block) + '</p>';
  });

  // Close stats section if still open
  let html = parsedBlocks.join('\n');
  if (inStatsSection) {
    html += '</div>';
  }

  return html;
}

function parseInline(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
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
