import { getCollection, type CollectionEntry } from 'astro:content';

export type NewsArticle = CollectionEntry<'news'>;

export async function getAllPosts(): Promise<NewsArticle[]> {
    const posts = await getCollection('news');
    return posts.sort((a: NewsArticle, b: NewsArticle) => {
        return b.data.publish_date.valueOf() - a.data.publish_date.valueOf();
    });
}

export async function getPostBySlug(slug: string): Promise<NewsArticle | undefined> {
    const posts = await getCollection('news');
    return posts.find((post: NewsArticle) => post.slug === slug);
}

export function validatePost(post: NewsArticle): string[] {
    const errors: string[] = [];
    const requiredFields = ['title', 'author', 'read_time', 'publish_date', 'created_date'] as const;

    requiredFields.forEach(field => {
        if (!post.data[field]) {
            errors.push(`Missing required field: ${field}`);
        }
    });

    return errors;
}