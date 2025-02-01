import { z } from 'astro:content';

export const authorSchema = z.object({
  name: z.string(),
  role: z.string(),
  bio: z.string(),
  shortBio: z.string(),
  expertise: z.array(z.string()),
  avatar: z.string(),
  social: z.object({
    twitter: z.string().optional(),
    linkedin: z.string().optional(),
    github: z.string().optional(),
  }).optional(),
  location: z.string(),
  languages: z.array(z.string()),
  education: z.array(z.object({
    degree: z.string(),
    field: z.string(),
    institution: z.string(),
    year: z.number()
  })).optional(),
  publications: z.array(z.object({
    title: z.string(),
    url: z.string(),
    year: z.number(),
    publisher: z.string()
  })).optional(),
  featured: z.boolean().default(false),
  slug: z.string()
});

export type Author = z.infer<typeof authorSchema>;