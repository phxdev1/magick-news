import { readFile, readdir } from 'fs/promises';
import { resolve } from 'path';
import { buildVectorDB } from '../src/utils/vectorSearch.ts';
import yaml from 'js-yaml';

const CONTENT_DIRS = {
  news: resolve(process.cwd(), 'src/content/news'),
  blog: resolve(process.cwd(), 'src/content/blog')
};

async function parseMarkdownFrontmatter(content) {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return null;

  try {
    // Parse YAML frontmatter
    const frontmatter = frontmatterMatch[1];
    return yaml.load(frontmatter);
  } catch (err) {
    console.error('Failed to parse frontmatter:', err);
    return null;
  }
}

async function getArticles(dir, type) {
  const files = await readdir(dir);
  const mdFiles = files.filter(file => file.endsWith('.md'));
  const articles = [];

  for (const file of mdFiles) {
    try {
      const content = await readFile(resolve(dir, file), 'utf-8');
      const data = await parseMarkdownFrontmatter(content);
      if (data) {
        articles.push({
          title: data.title,
          description: data.description,
          subtitle: data.subtitle,
          url: `/${type}/${file.replace('.md', '')}`,
          type,
          date: data.publish_date,
          author: data.author
        });
      }
    } catch (err) {
      console.error(`Failed to process ${file}:`, err);
    }
  }

  return articles;
}

async function main() {
  try {
    // Get all articles from both collections
    const [newsArticles, blogArticles] = await Promise.all([
      getArticles(CONTENT_DIRS.news, 'news'),
      getArticles(CONTENT_DIRS.blog, 'blog')
    ]);

    // Format articles for vector DB
    const articles = [...newsArticles, ...blogArticles];

    // Build vector database
    await buildVectorDB(articles);
    console.log('Vector database built successfully');
  } catch (error) {
    console.error('Error building vector database:', error);
    process.exit(1);
  }
}

main();