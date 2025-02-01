import { fileURLToPath } from 'url';
import { readFile, readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { buildVectorDB } from '../src/utils/vectorSearch.js';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function getArticles(dir: string, type: 'blog' | 'news') {
  console.log(`Reading ${type} articles from ${dir}...`);
  
  try {
    const files = await readdir(dir);
    console.log(`Found ${files.length} files in ${type} directory`);
    
    const articles = [];

    for (const file of files) {
      try {
        if (!file.endsWith('.md')) {
          console.log(`Skipping non-markdown file: ${file}`);
          continue;
        }
        
        const filePath = join(dir, file);
        console.log(`Processing ${type} article: ${file}`);
        
        const content = await readFile(filePath, 'utf-8');
        const { data } = matter(content);
        
        if (!data.title || !data.publish_date) {
          console.warn(`Skipping ${file}: Missing required frontmatter (title or publish_date)`);
          continue;
        }
        
        articles.push({
          title: data.title,
          description: data.description || '',
          subtitle: data.subtitle || '',
          url: `/${type}/${file.replace('.md', '')}`,
          type,
          date: new Date(data.publish_date)
        });
        
        console.log(`Successfully processed ${file}`);
      } catch (error) {
        console.error(`Error processing ${file}:`, error);
      }
    }

    console.log(`Successfully processed ${articles.length} ${type} articles`);
    return articles;
  } catch (error) {
    console.error(`Error reading ${type} directory:`, error);
    throw error;
  }
}

async function main() {
  try {
    console.log('Starting vector database build...');
    
    const projectRoot = process.cwd();
    console.log('Project root:', projectRoot);
    
    // Get all articles from both collections
    console.log('Reading articles...');
    const newsPath = join(projectRoot, 'src/content/news');
    const blogPath = join(projectRoot, 'src/content/blog');
    
    console.log('News path:', newsPath);
    console.log('Blog path:', blogPath);
    
    const [newsArticles, blogArticles] = await Promise.all([
      getArticles(newsPath, 'news').catch(err => {
        console.error('Error reading news articles:', err);
        return [];
      }),
      getArticles(blogPath, 'blog').catch(err => {
        console.error('Error reading blog articles:', err);
        return [];
      })
    ]);

    console.log(`Found ${newsArticles.length} news articles and ${blogArticles.length} blog articles`);

    const articles = [...newsArticles, ...blogArticles];
    console.log('Total articles:', articles.length);

    if (articles.length === 0) {
      throw new Error('No articles found');
    }

    // Build vector database
    console.log('Building vector database...');
    await buildVectorDB(articles);
    console.log('Vector database built successfully');
  } catch (error) {
    console.error('Error building vector database:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});