import { getCollection, type CollectionEntry } from 'astro:content';

export type BlogPost = CollectionEntry<'blog'>;

export async function getAllPosts(): Promise<BlogPost[]> {
    const posts = await getCollection('blog');
    return posts.sort((a: BlogPost, b: BlogPost) => {
        return b.data.publish_date.getTime() - a.data.publish_date.getTime();
    });
}

export async function getPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const posts = await getCollection('blog');
    return posts.find((post: BlogPost) => post.slug === slug);
}

export function validatePost(post: BlogPost): string[] {
    const errors: string[] = [];
    const requiredFields = ['title', 'author', 'read_time', 'publish_date', 'created_date'] as const;

    requiredFields.forEach(field => {
        if (!post.data[field]) {
            errors.push(`Missing required field: ${field}`);
        }
    });

    return errors;
}