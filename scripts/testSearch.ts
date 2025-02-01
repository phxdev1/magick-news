import { searchVectorDB } from '../src/utils/vectorSearch.js';

async function main() {
  try {
    const query = 'AI developments and breakthroughs';
    console.log(`Searching for: "${query}"`);
    
    const results = await searchVectorDB(query);
    
    console.log('\nSearch results:');
    results.forEach((result, i) => {
      console.log(`\n${i + 1}. ${result.title}`);
      if (result.description) {
        console.log(`   ${result.description}`);
      }
      console.log(`   URL: ${result.url}`);
    });
  } catch (error) {
    console.error('Error testing search:', error);
    process.exit(1);
  }
}

main();