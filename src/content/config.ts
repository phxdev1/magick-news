import { defineCollection, z } from 'astro:content';

const baseSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  author: z.string(),
  read_time: z.string(),
  publish_date: z.string().transform(str => new Date(str)),
  created_date: z.string().transform(str => new Date(str)),
  heroImage: z.string().optional(),
  description: z.string().optional(),
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
  'news': news,
  'blog': blog
};