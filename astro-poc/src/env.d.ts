/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

// Augment Cloudflare.Env so `import { env } from 'cloudflare:workers'` picks up our bindings.
// (cloudflare:workers exports `env: Cloudflare.Env`, not the global `Env`)
declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    BUTTONDOWN_API_KEY?: string;
  }
}

// Custom window globals used across the site
interface Window {
  // Crime data payloads (set per-page, typed loosely to avoid importing server types into client globals)
  __crimesData: unknown[];
  __compareData: unknown[];
  __hlData: unknown[];
  // Dashboard filter state
  __dashboardAllAreas: string[];
  __dashboardDefaultYear: string;
  __dashboardRegionToAreas: Record<string, string[]>;
  // Dashboard utilities (exposed by dashboardDataLoader.ts)
  hideShimmerWithMinTime: (
    shimmerEl: HTMLElement | null,
    contentEl: HTMLElement | null,
    shimmerStartTime: number
  ) => Promise<void>;
  // Modal openers
  openIslandModal: (section?: string) => void;
  openDashboardModal: () => void;
  openHeadlinesModal: () => void;
  openAreasModal: () => void;
  openArchivesModal: () => void;
  openSearchModal: () => void;
  openSectionPickerModal: () => void;
  closeMobileMenu: () => void;
}
