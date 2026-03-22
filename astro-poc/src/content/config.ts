import { defineCollection, z } from 'astro:content';
import { SAFETY_TIP_CATEGORIES, SAFETY_TIP_CONTEXTS } from '../config/crimeSchema';

const HELP_SECTIONS = ['Getting Started', 'Understanding the Data', 'Using the Dashboard', 'Safety Tips', 'Crime Reports', 'For Researchers', 'Technical'] as const;

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    country: z.enum(['tt', 'gy']),
    countryName: z.string(),
    date: z.date(),
    excerpt: z.string(),
    author: z.string().default('Crime Hotspots Analytics'),
    readTime: z.string(),
    image: z.string().default('/assets/images/report-hero.svg'),
    tags: z.array(z.string()),
  }),
});

const tips = defineCollection({
  type: 'content',
  schema: z.object({
    tip_id: z.string(),
    title: z.string(),
    category: z.enum(SAFETY_TIP_CATEGORIES),
    context: z.enum(SAFETY_TIP_CONTEXTS),
    area: z.string().default(''),
    severity: z.enum(['low', 'medium', 'high']),
    source: z.enum(['manual', 'community']),
    status: z.enum(['published', 'pending-review']),
    related_story_ids: z.array(z.string()).default([]),
    date_added: z.date(),
    date_updated: z.date().nullish(),
  }),
});

const help = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    section: z.enum(HELP_SECTIONS),
    summary: z.string(),
    order: z.number().default(99),
    related: z.array(z.string()).default([]),
    date_updated: z.date().nullish(),
  }),
});

export const collections = { blog, tips, help };
