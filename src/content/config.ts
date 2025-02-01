import { defineCollection } from 'astro:content';
import { authorSchema } from './authors/schema';
import { z } from 'astro:content';

const baseSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  author: z.string(),
  read_time: z.string(),
  publish_date: z.coerce.date(),
  created_date: z.coerce.date(),
  heroImage: z.string().optional(),
  description: z.string().optional(),
  cta: z.string().optional()
});

const authors = defineCollection({
  type: 'content',
  schema: authorSchema
});

const news = defineCollection({
  type: 'content',
  schema: baseSchema
});

const blog = defineCollection({
  type: 'content',
  schema: baseSchema
});

export const collections = {
  authors,
  news,
  blog
};