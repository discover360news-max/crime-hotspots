/**
 * Modal HTML Generators
 * Client-side HTML string generators for CrimeDetailModal content sections.
 * These are the client-side equivalents of SafetyContext.astro, RelatedCrimes.astro, FeedbackToggle.astro.
 */

import { escapeHtml } from '../lib/escapeHtml';
import { getCrimeHexColor } from '../lib/crimeColors';
import { buildRoute, routes } from '../config/routes';
import type { SafetyContext } from '../lib/safetyHelpers';
import { toDate } from '../lib/safetyHelpers';
import { trackRecentView, getRecentViews } from '../lib/trendingHelpers';

/** Generate Safety Context HTML (color-coded area safety alert box) */
export function generateSafetyContextHTML(areaName: string, context: SafetyContext): string {
  const styles = {
    high: {
      bg: 'bg-amber-50 dark:bg-amber-950/50',
      border: 'border-amber-200 dark:border-amber-800/60',
      icon: 'text-amber-600 dark:text-amber-400',
      title: 'text-amber-800 dark:text-amber-300',
      text: 'text-slate-700 dark:text-[hsl(0_0%_82%)]',
      label: 'Active Safety Alert',
      iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
    },
    neutral: {
      bg: 'bg-slate-50 dark:bg-[hsl(0_0%_6%)]',
      border: 'border-slate-200 dark:border-[hsl(0_0%_18%)]',
      icon: 'text-slate-500 dark:text-[hsl(0_0%_55%)]',
      title: 'text-slate-700 dark:text-[hsl(0_0%_85%)]',
      text: 'text-slate-600 dark:text-[hsl(0_0%_72%)]',
      label: 'Community Standing: Stable',
      iconPath: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'
    },
    low: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/50',
      border: 'border-emerald-200 dark:border-emerald-800/60',
      icon: 'text-emerald-600 dark:text-emerald-400',
      title: 'text-emerald-800 dark:text-emerald-300',
      text: 'text-slate-700 dark:text-[hsl(0_0%_82%)]',
      label: 'Safe Haven Status',
      iconPath: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
    }
  };

  const style = styles[context.level];

  return `
    <div class="${style.bg} ${style.border} border rounded-lg p-5">
      <div class="flex items-start gap-3">
        <div class="${style.icon} flex-shrink-0 mt-0.5">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${style.iconPath}" />
          </svg>
        </div>
        <div class="flex-1">
          <h3 class="text-sm font-semibold ${style.title} mb-1">
            ${style.label} - ${escapeHtml(areaName)}
          </h3>
          <div class="text-xs text-slate-500 dark:text-[hsl(0_0%_55%)] mb-3">
            Risk Level: ${context.score.toFixed(1)}/10
            ${context.primaryCrimeType ? ` • Primary Concern: ${escapeHtml(context.primaryCrimeType)}` : ''}
          </div>
          <p class="text-sm ${style.text} leading-relaxed mb-3">
            ${escapeHtml(context.tip)}
          </p>
          ${context.positiveNote ? `
            <div class="mt-3 pt-3 border-t border-slate-200 dark:border-[hsl(0_0%_18%)]">
              <p class="text-sm text-slate-600 dark:text-[hsl(0_0%_70%)] leading-relaxed italic">
                ${escapeHtml(context.positiveNote)}
              </p>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

/** Generate Feedback Toggle HTML (vote + share widget) */
export function generateFeedbackToggleHTML(areaName: string, pageUrl: string, pageTitle: string): string {
  const key = `feedback_safety_${areaName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
  const existingVote = localStorage.getItem(key);
  const showVote = existingVote === null;

  return `
    <div class="feedback-toggle mt-4" data-area="${escapeHtml(areaName)}" data-url="${escapeHtml(pageUrl)}" data-title="${escapeHtml(pageTitle)}">
      <div class="feedback-vote ${showVote ? '' : 'hidden'} flex items-center justify-between p-4 rounded-lg" style="background:var(--ch-surface);border:1px solid var(--ch-border)">
        <span class="text-sm font-medium" style="color:var(--ch-text-muted)">Was this safety insight helpful?</span>
        <div class="flex items-center gap-2">
          <button class="feedback-btn px-4 py-1.5 min-h-[22px] rounded-lg transition font-medium text-xs" style="border:1px solid var(--ch-border);color:var(--ch-text-muted)" data-vote="yes" aria-label="Yes, this was helpful">Yes</button>
          <button class="feedback-btn px-4 py-1.5 min-h-[22px] rounded-lg transition font-medium text-xs" style="border:1px solid var(--ch-border);color:var(--ch-text-muted)" data-vote="no" aria-label="No, this was not helpful">No</button>
        </div>
      </div>
      <div class="feedback-thanks ${showVote ? 'hidden' : ''} p-4 rounded-lg" style="background:var(--ch-surface);border:1px solid var(--ch-border)">
        <div class="flex items-center gap-2 mb-3">
          <span class="feedback-spark relative inline-flex items-center justify-center w-5 h-5">
            <svg class="w-4 h-4 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
          </span>
          <span class="text-sm font-medium" style="color:var(--ch-text)">Thanks for your feedback</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs" style="color:var(--ch-text-muted)">Share this page:</span>
          <button class="feedback-share-twitter p-2 rounded-lg transition" style="border:1px solid var(--ch-border);color:var(--ch-text-muted)" title="Share on X (Twitter)" aria-label="Share on X (Twitter)">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </button>
          <button class="feedback-share-facebook p-2 rounded-lg transition" style="border:1px solid var(--ch-border);color:var(--ch-text-muted)" title="Share on Facebook" aria-label="Share on Facebook">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </button>
          <button class="feedback-share-whatsapp p-2 rounded-lg transition" style="border:1px solid var(--ch-border);color:var(--ch-text-muted)" title="Share on WhatsApp" aria-label="Share on WhatsApp">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
          </button>
        </div>
      </div>
    </div>
  `;
}

/** Generate Related Crimes HTML (crime cards with in-place navigation support) */
export function generateRelatedCrimesHTML(currentCrime: any, allCrimes: any[], maxCards: number = 4): string {
  const otherCrimes = allCrimes.filter((c: any) => c.slug !== currentCrime.slug);

  // Find crimes in same area
  const sameAreaCrimes = otherCrimes
    .filter((c: any) => c.area?.toLowerCase() === currentCrime.area?.toLowerCase())
    .slice(0, maxCards);

  // If we need more, add same crime type from other areas
  let relatedCrimes = [...sameAreaCrimes];
  if (relatedCrimes.length < 3) {
    const sameCrimeTypeCrimes = otherCrimes
      .filter((c: any) =>
        c.crimeType?.toLowerCase() === currentCrime.crimeType?.toLowerCase() &&
        c.area?.toLowerCase() !== currentCrime.area?.toLowerCase()
      )
      .slice(0, maxCards - relatedCrimes.length);
    relatedCrimes = [...relatedCrimes, ...sameCrimeTypeCrimes];
  }

  // Sort by date (most recent first)
  relatedCrimes.sort((a, b) => {
    const dateA = a.dateObj ? new Date(a.dateObj) : new Date(a.date);
    const dateB = b.dateObj ? new Date(b.dateObj) : new Date(b.date);
    return dateB.getTime() - dateA.getTime();
  });

  relatedCrimes = relatedCrimes.slice(0, maxCards);

  if (relatedCrimes.length === 0) return '';

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const truncateHeadline = (headline: string, maxLength = 60) => {
    if (!headline) return '';
    if (headline.length <= maxLength) return headline;
    return headline.substring(0, maxLength).trim() + '...';
  };

  const areaSlug = (currentCrime.area || '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  const crimeCards = relatedCrimes.map((crime: any) => {
    const isSameArea = crime.area?.toLowerCase() === currentCrime.area?.toLowerCase();
    const colorHex = getCrimeHexColor(crime.crimeType);
    const crimeUrl = buildRoute.crime(crime.slug);

    return `
      <a href="${escapeHtml(crimeUrl)}" data-related-crime-slug="${escapeHtml(crime.slug)}" class="related-crime-link block p-3 rounded-lg hover:shadow-sm transition-all group" style="background:var(--ch-surface);border:1px solid var(--ch-border)">
        <div class="flex items-start gap-2">
          <span class="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style="background-color: ${colorHex}"></span>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-medium group-hover:text-rose-600 transition-colors line-clamp-2" style="color:var(--ch-text)">
              ${escapeHtml(truncateHeadline(crime.headline))}
            </p>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-[10px]" style="color:var(--ch-text-muted)">${formatDate(crime.date)}</span>
              ${isSameArea
                ? '<span class="text-[10px] px-1.5 py-0.5 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded">Same area</span>'
                : `<span class="text-[10px] truncate" style="color:var(--ch-text-muted)">${escapeHtml(crime.area || '')}</span>`
              }
            </div>
          </div>
          <svg class="w-3 h-3 group-hover:text-rose-400 transition-colors flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color:var(--ch-border)">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </a>
    `;
  }).join('');

  return `
    <aside class="p-4 backdrop-blur-sm rounded-lg" style="background:var(--ch-bg);border:1px solid var(--ch-border)">
      <h2 class="text-sm font-bold mb-3 flex items-center gap-2" style="color:var(--ch-text)">
        <svg class="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Related Crimes
      </h2>
      <div class="space-y-2">
        ${crimeCards}
      </div>
      <a href="/trinidad/area/${escapeHtml(areaSlug)}/" class="mt-3 flex items-center justify-center gap-1 w-full py-2 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors">
        View all crimes in ${escapeHtml(currentCrime.area || '')}
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </a>
    </aside>
  `;
}

/** Generate Trending Hotspots HTML (hot areas + recent views for modal) */
export function generateTrendingHotspotsHTML(currentCrime: any, allCrimes: any[]): string {
  const hotAreasHTML = generateHotAreasHTML_(allCrimes);
  const recentViewsHTML = generateRecentViewsHTML_(currentCrime.slug);

  // Track current view in localStorage
  trackRecentView(currentCrime.slug, currentCrime.headline, currentCrime.area);

  if (!hotAreasHTML && !recentViewsHTML) return '';
  return `<div class="space-y-4">${hotAreasHTML}${recentViewsHTML}</div>`;
}

/** Generate Hot Areas HTML (client-side calculation from __crimesData) */
function generateHotAreasHTML_(allCrimes: any[]): string {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  cutoff.setHours(0, 0, 0, 0);

  // Filter to last 7 days
  const recentCrimes = allCrimes.filter(c => {
    const d = toDate(c.dateObj, c.date);
    return d >= cutoff;
  });

  // Aggregate by area
  const areaCount = new Map<string, number>();
  recentCrimes.forEach(crime => {
    const area = crime.area || 'Unknown';
    areaCount.set(area, (areaCount.get(area) || 0) + 1);
  });

  // Sort descending, take top 5
  const hotAreas = Array.from(areaCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([area, count], index) => ({
      area,
      areaSlug: area.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      count,
      rank: index + 1,
    }));

  if (hotAreas.length === 0) return '';

  const getHeatColor = (rank: number): string => {
    if (rank === 1) return 'bg-rose-500';
    if (rank <= 3) return 'bg-rose-400';
    return 'bg-rose-300';
  };

  const areaCards = hotAreas.map(hotArea => `
    <a href="${escapeHtml(buildRoute.area(hotArea.areaSlug))}" class="block p-3 rounded-lg hover:border-rose-200 hover:shadow-sm transition-all group" style="background:var(--ch-surface);border:1px solid var(--ch-border)">
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full flex-shrink-0 ${getHeatColor(hotArea.rank)}"></span>
        <div class="flex-1 min-w-0">
          <p class="text-xs font-medium group-hover:text-rose-600 transition-colors truncate" style="color:var(--ch-text)">
            ${escapeHtml(hotArea.area)}
          </p>
        </div>
        <span class="text-[10px] px-1.5 py-0.5 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded flex-shrink-0">
          ${hotArea.count} ${hotArea.count === 1 ? 'crime' : 'crimes'}
        </span>
        <svg class="w-3 h-3 group-hover:text-rose-400 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color:var(--ch-border)">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </a>
  `).join('');

  return `
    <aside class="p-4 backdrop-blur-sm rounded-lg" style="background:var(--ch-bg);border:1px solid var(--ch-border)">
      <h2 class="text-sm font-bold mb-3 flex items-center gap-2" style="color:var(--ch-text)">
        <svg class="w-4 h-4 text-rose-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 23a7 7 0 01-7-7c0-3.15 2.26-5.97 4.5-8.5.45-.5 1.55-.5 2 0C13.74 10.03 19 12.85 19 16a7 7 0 01-7 7zm0-12.5c-1.5 2-3.5 4.5-3.5 5.5a3.5 3.5 0 107 0c0-1-2-3.5-3.5-5.5z"/>
        </svg>
        Hot Areas This Week
      </h2>
      <div class="space-y-2">
        ${areaCards}
      </div>
      <a href="${routes.trinidad.areas}" class="mt-3 flex items-center justify-center gap-1 w-full py-2 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors">
        View all areas
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </a>
    </aside>
  `;
}

/** Generate Recent Views HTML (from localStorage) */
function generateRecentViewsHTML_(excludeSlug: string): string {
  const recentViews = getRecentViews(excludeSlug, 3);
  if (recentViews.length === 0) return '';

  const viewCards = recentViews.map(view => `
    <a href="${escapeHtml(buildRoute.crime(view.slug))}" class="block p-3 rounded-lg hover:border-rose-200 hover:shadow-sm transition-all group" style="background:var(--ch-surface);border:1px solid var(--ch-border)">
      <div class="flex items-start gap-2">
        <span class="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-slate-400"></span>
        <div class="flex-1 min-w-0">
          <p class="text-xs font-medium group-hover:text-rose-600 transition-colors line-clamp-2" style="color:var(--ch-text)">
            ${escapeHtml(view.headline)}
          </p>
          <span class="text-[10px]" style="color:var(--ch-text-muted)">${escapeHtml(view.area)}</span>
        </div>
        <svg class="w-3 h-3 group-hover:text-rose-400 transition-colors flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color:var(--ch-border)">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </a>
  `).join('');

  return `
    <aside class="p-4 backdrop-blur-sm rounded-lg" style="background:var(--ch-bg);border:1px solid var(--ch-border)">
      <h2 class="text-sm font-bold mb-3 flex items-center gap-2" style="color:var(--ch-text)">
        <svg class="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Your Recent Views
      </h2>
      <div class="space-y-2">
        ${viewCards}
      </div>
    </aside>
  `;
}
