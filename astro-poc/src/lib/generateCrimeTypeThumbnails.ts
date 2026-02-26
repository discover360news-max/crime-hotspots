/**
 * Crime Type Thumbnail Generator
 * Creates 200x200 PNG thumbnails for each crime type + a generic fallback.
 * Used as og:image on crime detail pages so Grow widget shows relevant icons.
 * Uses satori (JSX → SVG) + sharp (SVG → PNG) at build time.
 *
 * IMPORTANT: satori, sharp, and node:fs are NOT imported at the top level.
 * This module is imported at SSR runtime by Cloudflare Workers, which cannot
 * load native binaries. Dynamic imports inside generateAllCrimeTypeThumbnails()
 * ensure these build-time-only packages are never evaluated at runtime.
 */

const SIZE = 200;

/** Crime type → short label + hex color */
const CRIME_THUMBNAILS: Record<string, { label: string; color: string }> = {
  'Murder':          { label: 'M',   color: '#e11d48' },
  'Shooting':        { label: 'SH',  color: '#dc2626' },
  'Robbery':         { label: 'R',   color: '#f97316' },
  'Burglary':        { label: 'B',   color: '#eab308' },
  'Theft':           { label: 'T',   color: '#06b6d4' },
  'Home Invasion':   { label: 'HI',  color: '#9333ea' },
  'Kidnapping':      { label: 'K',   color: '#ec4899' },
  'Sexual Assault':  { label: 'SA',  color: '#c026d3' },
  'Assault':         { label: 'A',   color: '#8b5cf6' },
  'Seizures':        { label: 'SZ',  color: '#3b82f6' },
  'Vehicle Theft':   { label: 'VT',  color: '#0ea5e9' },
};

const FALLBACK = { label: '!', color: '#64748b' };

/** Darken a hex color by a factor (0–1) */
function darken(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `#${Math.round(r * (1 - factor)).toString(16).padStart(2, '0')}${Math.round(g * (1 - factor)).toString(16).padStart(2, '0')}${Math.round(b * (1 - factor)).toString(16).padStart(2, '0')}`;
}

/** Slugify a crime type name for use as filename */
function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Generate all crime type thumbnails + fallback.
 * Writes PNGs to public/images/crime-types/.
 * Returns a map of crimeType → relative URL path.
 *
 * Build-time only — uses dynamic imports so Cloudflare Workers never loads
 * satori/sharp/node:fs at SSR runtime.
 */
export async function generateAllCrimeTypeThumbnails(): Promise<Record<string, string>> {
  const [{ default: satorio }, { default: sharp }, { readFileSync, writeFileSync, mkdirSync, existsSync }, { join }] = await Promise.all([
    import('satori'),
    import('sharp'),
    import('node:fs'),
    import('node:path'),
  ]);

  const outputDir = join(process.cwd(), 'public', 'images', 'crime-types');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const regularFontPath = join(process.cwd(), 'public', 'fonts', 'Inter-Regular.otf');
  const boldFontPath = join(process.cwd(), 'public', 'fonts', 'Inter-Bold.otf');
  const fonts = {
    regular: readFileSync(regularFontPath),
    bold: readFileSync(boldFontPath),
  };

  async function generateThumbnail(
    label: string,
    crimeTypeName: string,
    bgColor: string,
    filename: string,
  ): Promise<void> {
    const svg = await satorio(
      {
        type: 'div',
        props: {
          style: {
            width: `${SIZE}px`,
            height: `${SIZE}px`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: `linear-gradient(135deg, ${bgColor} 0%, ${darken(bgColor, 0.3)} 100%)`,
            fontFamily: 'Inter',
            color: '#ffffff',
            borderRadius: '24px',
            gap: '4px',
          },
          children: [
            {
              type: 'div',
              props: {
                style: {
                  fontSize: label.length > 1 ? '64px' : '80px',
                  fontWeight: 700,
                  lineHeight: '1',
                },
                children: label,
              },
            },
            {
              type: 'div',
              props: {
                style: {
                  fontSize: '13px',
                  fontWeight: 700,
                  opacity: 0.85,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                },
                children: crimeTypeName,
              },
            },
            {
              type: 'div',
              props: {
                style: {
                  fontSize: '10px',
                  fontWeight: 400,
                  opacity: 0.6,
                  marginTop: '4px',
                },
                children: 'crimehotspots.com',
              },
            },
          ],
        },
      },
      {
        width: SIZE,
        height: SIZE,
        fonts: [
          { name: 'Inter', data: fonts.regular, weight: 400, style: 'normal' as const },
          { name: 'Inter', data: fonts.bold, weight: 700, style: 'normal' as const },
        ],
      }
    );

    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    writeFileSync(join(outputDir, filename), png);
  }

  const urlMap: Record<string, string> = {};

  // Generate per-crime-type thumbnails
  for (const [crimeType, config] of Object.entries(CRIME_THUMBNAILS)) {
    const filename = `${slugify(crimeType)}.png`;
    await generateThumbnail(config.label, crimeType, config.color, filename);
    urlMap[crimeType] = `/images/crime-types/${filename}`;
  }

  // Generate generic fallback
  await generateThumbnail(FALLBACK.label, 'Alert', FALLBACK.color, 'generic.png');
  urlMap['_fallback'] = '/images/crime-types/generic.png';

  return urlMap;
}

/**
 * Get the thumbnail URL for a given crime type.
 * Returns absolute URL suitable for og:image meta tag.
 * Pure string logic — safe to call at SSR runtime.
 */
export function getCrimeTypeThumbnailUrl(crimeType: string, baseUrl = 'https://crimehotspots.com'): string {
  const slug = slugify(crimeType);
  const knownTypes = Object.keys(CRIME_THUMBNAILS).map(slugify);
  const path = knownTypes.includes(slug)
    ? `/images/crime-types/${slug}.png`
    : '/images/crime-types/generic.png';
  return `${baseUrl}${path}`;
}
