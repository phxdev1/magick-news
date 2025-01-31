import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: z.object({
		author: z.string(),
		title: z.string(),
		subtitle: z.string().optional(),
		slug: z.string(),
		read_time: z.string(),
		publish_date: z.string().transform((str) => new Date(str)),
		created_date: z.string().transform((str) => new Date(str)),
		heroImage: z.string().optional(),
		description: z.string().optional(), // Making this optional as it's not in our new format
		// Keeping these for backward compatibility
		pubDate: z.coerce.date().optional(),
		updatedDate: z.coerce.date().optional(),
	}),
});

export const collections = { blog };
