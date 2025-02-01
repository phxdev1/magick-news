import { loadAuthors, validateAuthors } from './authors.mjs';

async function main() {
  console.log('🔍 Validating authors...\n');

  const authors = await loadAuthors();
  if (!authors) {
    console.error('❌ No author data found. Run initialization first.');
    process.exit(1);
  }

  const validation = validateAuthors(authors);
  
  if (!validation.valid) {
    console.log('❌ Author validation failed:');
    validation.errors.forEach(error => console.log(`  - ${error}`));
    process.exit(1);
  }

  console.log('✅ All authors are valid!\n');
  
  // Print summary
  console.log('📊 Author Summary:');
  console.log(`  Male Authors: ${authors.male.length}`);
  console.log(`  Female Authors: ${authors.female.length}`);
  console.log(`  Total Authors: ${authors.male.length + authors.female.length}\n`);
}

main().catch(err => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});