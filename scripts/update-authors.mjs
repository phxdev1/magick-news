import { readFile, writeFile, readdir } from 'fs/promises';
import { resolve } from 'path';
import { loadAuthors } from './authors.mjs';

const AUTHORS = ['Alexander Hunt', 'Sophia Martín'];
const CONTENT_DIRS = {
  news: resolve(process.cwd(), 'src/content/news'),
  blog: resolve(process.cwd(), 'src/content/blog')
};

async function updateContentFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Find the author line
    const authorLineIndex = lines.findIndex(line => line.trim().startsWith('author:'));
    if (authorLineIndex === -1) {
      console.log(`No author line found in ${filePath}`);
      return false;
    }

    // Replace with random author from our list
    const randomAuthor = AUTHORS[Math.floor(Math.random() * AUTHORS.length)];
    lines[authorLineIndex] = `author: '${randomAuthor}'`;

    // Write back to file
    await writeFile(filePath, lines.join('\n'), 'utf-8');
    console.log(`✅ Updated author in ${filePath}`);
    return true;
  } catch (err) {
    console.error(`❌ Failed to update ${filePath}:`, err);
    return false;
  }
}

async function main() {
  console.log('🔄 Updating author references...\n');

  let success = 0;
  let failed = 0;

  // Process each content directory
  for (const [type, dir] of Object.entries(CONTENT_DIRS)) {
    // Get all markdown files
    const files = await readdir(dir);
    const mdFiles = files.filter(file => file.endsWith('.md'));

    console.log(`Processing ${type} files...`);
    
    // Update each file
    for (const file of mdFiles) {
      const filePath = resolve(dir, file);
      if (await updateContentFile(filePath)) {
        success++;
      } else {
        failed++;
      }
    }
  }

  console.log('\n📊 Results:');
  console.log(`✅ Successfully updated: ${success}`);
  console.log(`❌ Failed: ${failed}`);
}

main().catch(err => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});