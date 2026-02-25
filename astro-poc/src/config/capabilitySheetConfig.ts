/**
 * Capability Sheet Configuration
 * --------------------------------
 * Single source of truth for the Data Capability Sheet.
 * All content is editable here — no need to touch the Astro page or HTML file.
 *
 * PLACEHOLDER RULES:
 * - Set a field to `null` to hide it completely from the rendered output.
 * - Replace `null` with the real value when ready.
 */

export interface DataPackage {
  tier: string;
  description: string;
  format: string;
  cta: string;
  featured?: boolean;
}

export interface Dataset {
  name: string;
  coverage: string;
  frequency: string;
  formats: string;
}

export interface UseCase {
  title: string;
  description: string;
}

export interface RoadmapItem {
  country: string;
  target: string;
}

export const capabilitySheetConfig = {
  // ─── Document meta ────────────────────────────────────────────────────────
  date: "February 2026",
  subtitle: "Caribbean Crime Data — Trinidad & Tobago",
  documentTitle: "Institutional Data Capability Overview",

  // ─── Platform overview ────────────────────────────────────────────────────
  overview: [
    "CrimeHotSpots.com is the only near-real-time, incident-level crime data platform covering Trinidad & Tobago.",
    "Data is collected via automated RSS monitoring of TT news sources and manual curation of community-reported incidents — capturing both reported and unreported crime activity invisible to official statistics.",
    "Our structured dataset spans {MONTHS} of incidents, updated daily, with geolocation, crime type classification, and victim count for each record.",
    "All data is licensed under Creative Commons (CC BY 4.0) for academic and non-commercial use; institutional licences are available for commercial applications.",
  ],

  // ─── Data asset table ─────────────────────────────────────────────────────
  datasets: [
    {
      name: "Incident-level crime data",
      coverage: "TT-wide, {MONTHS}",
      frequency: "Daily",
      formats: "CSV, JSON, API",
    },
    {
      name: "Area statistics",
      coverage: "District and community level",
      frequency: "Weekly",
      formats: "CSV, PDF Report",
    },
    {
      name: "Crime type breakdown",
      coverage: "8 categories",
      frequency: "Weekly",
      formats: "CSV, PDF Report",
    },
    {
      name: "Week-over-week trends",
      coverage: "TT-wide and by area",
      frequency: "Weekly",
      formats: "Dashboard, CSV",
    },
    {
      name: "Unreported crime estimates",
      coverage: "Selected areas",
      frequency: "Monthly",
      formats: "Aggregate PDF only",
    },
    {
      name: "Historical comparisons",
      coverage: "18-month baseline",
      frequency: "Quarterly",
      formats: "CSV, PDF Report",
    },
  ] as Dataset[],

  // ─── Schema fields ─────────────────────────────────────────────────────────
  schemaFields: [
    "Date",
    "Headline",
    "Summary",
    "Location",
    "Area",
    "Latitude",
    "Longitude",
    "Victim Count",
    "Primary Crime Type",
    "Related Crime Types",
    "Source Type (Reported / Unreported)",
  ],

  // ─── Institutional use cases ───────────────────────────────────────────────
  useCases: [
    {
      title: "Property Insurance Risk Banding",
      description: "Area-level crime scores for residential and commercial risk banding",
    },
    {
      title: "Commercial Underwriting",
      description: "Location-based risk scoring for underwriting decisions",
    },
    {
      title: "Security Risk Assessments",
      description: "Area-level threat intelligence for business security planning",
    },
    {
      title: "Academic & Policy Research",
      description: "Structured incident data for criminology and public policy studies",
    },
  ] as UseCase[],

  // ─── Data packages ─────────────────────────────────────────────────────────
  packages: [
    {
      tier: "Basic",
      description: "Quarterly area statistics report",
      format: "PDF format",
      cta: "Contact for pricing",
    },
    {
      tier: "Professional",
      description: "Monthly data subscription + CSV export",
      format: "CSV + PDF",
      cta: "Contact for pricing",
      featured: true,
    },
    {
      tier: "Enterprise",
      description: "Annual licence + API access + custom reports",
      format: "All formats + dedicated support",
      cta: "Contact for pricing",
    },
  ] as DataPackage[],

  // ─── Expansion roadmap ─────────────────────────────────────────────────────
  roadmap: [
    { country: "Jamaica", target: "Q3 2026" },
    { country: "Guyana", target: "Q1 2027" },
    { country: "Full Caribbean", target: "2028" },
  ] as RoadmapItem[],

  // ─── Contact & legal ───────────────────────────────────────────────────────
  // Set these to null to hide them from the rendered output.
  // Replace with real values when ready.
  contact: {
    website: "crimehotspots.com",
    email: null as string | null,        // e.g. "data@crimehotspots.com"
    entity: null as string | null,       // e.g. "Crime Hotspots Ltd."
    dataEthicsPath: null as string | null, // e.g. "/data-ethics" — renders as crimehotspots.com/data-ethics
  },
} as const;
