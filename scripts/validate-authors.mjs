import { readdir, readFile, writeFile } from 'fs/promises';
import { join, resolve } from 'path';
import { isValidAuthor, getRandomAuthor } from './authors.mjs';
import yaml from 'js-yaml';

const NEWS_DIR = resolve(process.cwd(), 'src/content/news');
const BLOG_DIR = resolve(process.cwd(), 'src/content/blog');

async function validateFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf-8');
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    
    if (!frontmatterMatch) {
      console.error(`❌ No frontmatter found in ${filePath}`);
      return false;
    }

    const frontmatter = yaml.load(frontmatterMatch[1]);
    
    if (!frontmatter.author) {
      console.log(`⚠️  No author found in ${filePath}, adding random author...`);
      frontmatter.author = getRandomAuthor();
      const newContent = content.replace(
        frontmatterMatch[0],
        `---\n${yaml.dump(frontmatter)}---`
      );
      await writeFile(filePath, newContent, 'utf-8');
      console.log(`✅ Added author: ${frontmatter.author}`);
      return true;
    }

    if (!isValidAuthor(frontmatter.author)) {
      console.log(`⚠️  Invalid author "${frontmatter.author}" in ${filePath}, replacing...`);
      const newAuthor = getRandomAuthor();
      const newContent = content.replace(
        frontmatterMatch[0],
        `---\n${yaml.dump({ ...frontmatter, author: newAuthor })}---`
      );
      await writeFile(filePath, newContent, 'utf-8');
      console.log(`✅ Replaced with: ${newAuthor}`);
      return true;
    }

    console.log(`✅ Valid author in ${filePath}: ${frontmatter.author}`);
    return true;
  } catch (err) {
    console.error(`❌ Error processing ${filePath}:`, err.message);
    return false;
  }
}

async function validateDirectory(dir) {
  try {
    const files = await readdir(dir);
    const mdFiles = files.filter(file => file.endsWith('.md'));
    
    console.log(`\nProcessing ${mdFiles.length} files in ${dir}...\n`);
    
    let success = 0;
    let failed = 0;

    for (const file of mdFiles) {
      const filePath = join(dir, file);
      const result = await validateFile(filePath);
      if (result) {
        success++;
      } else {
        failed++;
      }
    }

    console.log(`\nResults for ${dir}:`);
    console.log(`✅ Successfully processed: ${success}`);
    console.log(`❌ Failed: ${failed}\n`);

    return { success, failed };
  } catch (err) {
    console.error(`❌ Error reading directory ${dir}:`, err.message);
    return { success: 0, failed: 0 };
  }
}

async function main() {
  console.log('🔍 Validating authors in markdown files...\n');

  const newsResults = await validateDirectory(NEWS_DIR);
  const blogResults = await validateDirectory(BLOG_DIR);

  const total = {
    success: newsResults.success + blogResults.success,
    failed: newsResults.failed + blogResults.failed
  };

  console.log('📊 Final Results:');
  console.log(`✅ Total successful: ${total.success}`);
  console.log(`❌ Total failed: ${total.failed}`);

  if (total.failed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});