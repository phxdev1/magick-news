import { mkdir } from 'fs/promises';
import { resolve } from 'path';
import { existsSync } from 'fs';
import { authorTemplates, saveAuthors } from './authors.mjs';

const AUTHOR_DIR = resolve(process.cwd(), 'src/content/authors');

// Ensure author directory exists
if (!existsSync(AUTHOR_DIR)) {
  await mkdir(AUTHOR_DIR, { recursive: true });
}

async function generateAuthorProfiles() {
  console.log('📝 Generating author profiles...\n');

  // Create author markdown files
  const authors = {
    male: authorTemplates.male.map(author => ({
      ...author,
      slug: author.name.toLowerCase().replace(/\s+/g, '-')
    })),
    female: authorTemplates.female.map(author => ({
      ...author,
      slug: author.name.toLowerCase().replace(/\s+/g, '-')
    }))
  };

  // Save author data
  const saved = await saveAuthors(authors);
  if (!saved) {
    console.error('❌ Failed to save author data');
    process.exit(1);
  }

  console.log('✅ Author profiles generated successfully!\n');
  
  // Print summary
  console.log('📊 Generated Authors:');
  console.log(`  Male Authors: ${authors.male.length}`);
  console.log(`  Female Authors: ${authors.female.length}`);
  console.log(`  Total Authors: ${authors.male.length + authors.female.length}\n`);

  // Print author list
  console.log('📋 Author List:');
  console.log('\nMale Authors:');
  authors.male.forEach((author, i) => {
    console.log(`  ${i + 1}. ${author.name} (${author.role})`);
  });
  console.log('\nFemale Authors:');
  authors.female.forEach((author, i) => {
    console.log(`  ${i + 1}. ${author.name} (${author.role})`);
  });
  console.log();
}

generateAuthorProfiles().catch(err => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});