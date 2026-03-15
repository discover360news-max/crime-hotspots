/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

interface Env {
  DB: D1Database;
}

declare namespace App {
  interface Locals {
    runtime: import('@astrojs/cloudflare').Runtime<Env>['runtime'];
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
