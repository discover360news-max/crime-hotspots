import { defineCollection, z } from 'astro:content';

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
    category: z.enum([
      'Robbery', 'Carjacking', 'Home Invasion', 'ATM Crime', 'Online Scam',
      'Kidnapping', 'Sexual Violence', 'Fraud', 'Assault', 'Other'
    ]),
    context: z.enum([
      'At Home', 'In Your Car', 'At the ATM', 'In a Mall', 'Walking Alone',
      'Online', 'At Work', 'Using Public Transport', 'At an Event', 'Other'
    ]),
    area: z.string().default(''),
    severity: z.enum(['low', 'medium', 'high']),
    source: z.enum(['manual', 'community']),
    status: z.enum(['published', 'pending-review']),
    related_story_ids: z.array(z.string()).default([]),
    date_added: z.date(),
    date_updated: z.date().optional(),
  }),
});

export const collections = { blog, tips };
