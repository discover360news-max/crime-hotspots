/**
 * Dynamic OG Image Generators
 * Uses satori (JSX → SVG) + sharp (SVG → PNG) at build time.
 * Regenerated daily via GitHub Actions rebuild.
 */

import satori from 'satori';
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

interface MurderCountOgData {
  murderCount: number;
  currentYear: number;
  projectedRate: string;
  yoyChange: number;
  yoyDirection: 'up' | 'down' | 'same';
  currentRate: string;
}

export async function generateMurderCountOgImage(data: MurderCountOgData): Promise<string> {
  const { murderCount, currentYear, projectedRate, yoyChange, yoyDirection, currentRate } = data;

  // Load Inter fonts for satori (OTF format required — satori cannot parse woff2)
  const regularFontPath = join(process.cwd(), 'public', 'fonts', 'Inter-Regular.otf');
  const boldFontPath = join(process.cwd(), 'public', 'fonts', 'Inter-Bold.otf');
  const regularFontData = readFileSync(regularFontPath);
  const boldFontData = readFileSync(boldFontPath);

  const yoyText = yoyDirection === 'same'
    ? 'Similar to 2025'
    : `${yoyDirection === 'down' ? '↓' : '↑'} ${Math.abs(yoyChange).toFixed(0)}% vs 2025`;

  const yoyColor = yoyDirection === 'down' ? '#059669' : yoyDirection === 'up' ? '#e11d48' : '#64748b';

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          fontFamily: 'Inter',
          color: '#e2e8f0',
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '28px',
                      fontWeight: 700,
                      letterSpacing: '2px',
                      color: '#94a3b8',
                    },
                    children: 'TRINIDAD & TOBAGO',
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '24px',
                      color: '#64748b',
                    },
                    children: `Murder Count ${currentYear}`,
                  },
                },
              ],
            },
          },
          {
            type: 'div',
            props: {
              style: {
                fontSize: '140px',
                fontWeight: 700,
                color: '#e11d48',
                lineHeight: 1.1,
                marginTop: '20px',
                marginBottom: '8px',
              },
              children: String(murderCount),
            },
          },
          {
            type: 'div',
            props: {
              style: {
                fontSize: '22px',
                color: '#94a3b8',
                marginBottom: '24px',
              },
              children: 'murders so far',
            },
          },
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                gap: '24px',
                fontSize: '18px',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: { color: yoyColor },
                    children: yoyText,
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: { color: '#64748b' },
                    children: '•',
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: { color: '#94a3b8' },
                    children: `Rate: ${currentRate}/100k`,
                  },
                },
              ],
            },
          },
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                bottom: '32px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '18px',
                color: '#475569',
              },
              children: 'crimehotspots.com',
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Inter',
          data: regularFontData,
          weight: 400,
          style: 'normal',
        },
        {
          name: 'Inter',
          data: boldFontData,
          weight: 700,
          style: 'normal',
        },
      ],
    }
  );

  // Convert SVG to PNG
  const png = await sharp(Buffer.from(svg)).png().toBuffer();

  // Write to public directory
  const outputDir = join(process.cwd(), 'public', 'og-images');
  mkdirSync(outputDir, { recursive: true });
  const outputPath = join(outputDir, 'murder-count.png');
  writeFileSync(outputPath, png);

  return '/og-images/murder-count.png';
}

interface StatisticsOgData {
  totalCrimes: number;
  murderCount: number;
  robberyCount: number;
  shootingCount: number;
  currentYear: number;
  murderRate: string;
  yoyChange: number;
}

export async function generateStatisticsOgImage(data: StatisticsOgData): Promise<string> {
  const { totalCrimes, murderCount, robberyCount, shootingCount, currentYear, murderRate, yoyChange } = data;

  const regularFontPath = join(process.cwd(), 'public', 'fonts', 'Inter-Regular.otf');
  const boldFontPath = join(process.cwd(), 'public', 'fonts', 'Inter-Bold.otf');
  const regularFontData = readFileSync(regularFontPath);
  const boldFontData = readFileSync(boldFontPath);

  const yoyAbs = Math.abs(yoyChange).toFixed(0);
  const yoyText = Math.abs(yoyChange) < 0.5 ? 'Similar to last year' : yoyChange > 0 ? `↑ ${yoyAbs}% vs last year` : `↓ ${yoyAbs}% vs last year`;
  const yoyColor = yoyChange < -0.5 ? '#059669' : yoyChange > 0.5 ? '#e11d48' : '#64748b';

  const statPill = (label: string, value: number) => ({
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        gap: '4px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '12px',
        padding: '16px 28px',
      },
      children: [
        {
          type: 'div',
          props: {
            style: { fontSize: '36px', fontWeight: 700, color: '#e11d48' },
            children: String(value),
          },
        },
        {
          type: 'div',
          props: {
            style: { fontSize: '15px', color: '#94a3b8' },
            children: label,
          },
        },
      ],
    },
  });

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          fontFamily: 'Inter',
          color: '#e2e8f0',
          gap: '0px',
        },
        children: [
          // Header
          {
            type: 'div',
            props: {
              style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' },
              children: [
                {
                  type: 'div',
                  props: {
                    style: { fontSize: '26px', fontWeight: 700, letterSpacing: '2px', color: '#94a3b8' },
                    children: 'TRINIDAD & TOBAGO',
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: { fontSize: '22px', color: '#64748b' },
                    children: `Crime Statistics ${currentYear}`,
                  },
                },
              ],
            },
          },
          // Big number
          {
            type: 'div',
            props: {
              style: { fontSize: '120px', fontWeight: 700, color: '#f1f5f9', lineHeight: 1.1, marginTop: '24px', marginBottom: '4px' },
              children: String(totalCrimes),
            },
          },
          {
            type: 'div',
            props: {
              style: { fontSize: '20px', color: '#94a3b8', marginBottom: '28px' },
              children: 'total crimes tracked this year',
            },
          },
          // Stat pills row
          {
            type: 'div',
            props: {
              style: { display: 'flex', gap: '16px', marginBottom: '24px' },
              children: [
                statPill('Murders', murderCount),
                statPill('Robberies', robberyCount),
                statPill('Shootings', shootingCount),
              ],
            },
          },
          // YoY + murder rate row
          {
            type: 'div',
            props: {
              style: { display: 'flex', gap: '24px', fontSize: '18px' },
              children: [
                { type: 'div', props: { style: { color: yoyColor }, children: yoyText } },
                { type: 'div', props: { style: { color: '#64748b' }, children: '•' } },
                { type: 'div', props: { style: { color: '#94a3b8' }, children: `Murder rate: ${murderRate}/100k` } },
              ],
            },
          },
          // Footer
          {
            type: 'div',
            props: {
              style: { position: 'absolute', bottom: '32px', fontSize: '16px', color: '#475569' },
              children: 'crimehotspots.com',
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Inter', data: regularFontData, weight: 400, style: 'normal' },
        { name: 'Inter', data: boldFontData, weight: 700, style: 'normal' },
      ],
    }
  );

  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  const outputDir = join(process.cwd(), 'public', 'og-images');
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(join(outputDir, 'statistics.png'), png);

  return '/og-images/statistics.png';
}
