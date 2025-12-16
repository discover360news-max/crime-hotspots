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

export const collections = { blog };
