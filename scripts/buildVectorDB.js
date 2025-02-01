import { getCollection } from 'astro:content';
import { buildVectorDB } from '../src/utils/vectorSearch.js';

async function main() {
  try {
    // Get all articles from both collections
    const [newsArticles, blogArticles] = await Promise.all([
      getCollection('news'),
      getCollection('blog')
    ]);

    // Format articles for vector DB
    const articles = [
      ...newsArticles.map(article => ({
        title: article.data.title,
        description: article.data.description,
        subtitle: article.data.subtitle,
        url: `/news/${article.id}`,
        type: 'news',
        date: article.data.publish_date,
        author: article.data.author
      })),
      ...blogArticles.map(article => ({
        title: article.data.title,
        description: article.data.description,
        subtitle: article.data.subtitle,
        url: `/blog/${article.id}`,
        type: 'blog',
        date: article.data.publish_date,
        author: article.data.author
      }))
    ];

    // Build vector database
    await buildVectorDB(articles);
    console.log('Vector database built successfully');
  } catch (error) {
    console.error('Error building vector database:', error);
    process.exit(1);
  }
}

main();