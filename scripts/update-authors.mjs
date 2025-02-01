#!/usr/bin/env node
import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { glob } from 'glob';

const validAuthors = [
  'John Anderson',
  'Pierre Martin',
  'Juan Garcia',
  'Raj Patel',
  'Marco Rossi',
  'Lars Jensen',
  'Ken Tanaka',
  'Ahmed Hassan',
  'James Wilson',
  'Wei Chen',
  'Ana Rodriguez',
  'Marie Bernard',
  'Maria Silva',
  'Priya Shah',
  'Laura Romano',
  'Emma Larsson',
  'Yuki Sato',
  'Fatima Ahmad',
  'Sarah Thompson',
  'Min Park'
];

// Map old authors to new ones
const authorMap = {
  'David Jenkins': 'John Anderson',
  'Emily Stevens': 'Marie Bernard',
  'Vikram Singh': 'Raj Patel',
  'Sophia MartÃ­n': 'Ana Rodriguez'
};

async function updateAuthors() {
  console.log('🔄 Updating article authors...\n');

  // Get all markdown files in the news directory
  const files = await glob('src/content/news/**/*.md');
  
  let success = 0;
  let failed = 0;
  const errors = [];

  for (const file of files) {
    try {
      // Read the file content
      const content = await readFile(file, 'utf8');
      
      // Extract frontmatter
      const frontmatterMatch = content.match(/^---([\s\S]*?)---/);
      if (!frontmatterMatch) {
        throw new Error('No frontmatter found');
      }

      // Get current author (handle both single and double quotes)
      const authorMatch = content.match(/author:\s*['"]([^'"]+)['"]/);
      if (!authorMatch) {
        throw new Error('No author found in frontmatter');
      }

      const currentAuthor = authorMatch[1];
      
      // Check if author needs to be updated
      if (authorMap[currentAuthor]) {
        const newAuthor = authorMap[currentAuthor];
        const updatedContent = content.replace(
          `author: '${currentAuthor}'`,
          `author: '${newAuthor}'`
        );
        
        await writeFile(file, updatedContent, 'utf8');
        console.log(`✅ Updated author in ${file} from '${currentAuthor}' to '${newAuthor}'`);
        success++;
      } else if (!validAuthors.includes(currentAuthor)) {
        // If author is not in map but also not valid, assign a random valid author
        const newAuthor = validAuthors[Math.floor(Math.random() * validAuthors.length)];
        // Keep the same quote style as the original
        const quoteType = content.match(/author:\s*(['"])/)[1];
        const updatedContent = content.replace(
          new RegExp(`author:\\s*${quoteType}${currentAuthor}${quoteType}`),
          `author: ${quoteType}${newAuthor}${quoteType}`
        );
        
        await writeFile(file, updatedContent, 'utf8');
        console.log(`✅ Updated author in ${file} from '${currentAuthor}' to '${newAuthor}'`);
        success++;
      }
    } catch (err) {
      console.error(`❌ Failed to update ${file}:`, err.message);
      errors.push(`${file}: ${err.message}`);
      failed++;
    }
  }

  console.log('\n📊 Results:');
  console.log(`✅ Successfully updated: ${success}`);
  console.log(`❌ Failed: ${failed}`);

  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach(error => console.log(`  - ${error}`));
    process.exit(1);
  }
}

updateAuthors().catch(err => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});