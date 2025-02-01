#!/usr/bin/env node
import { readFile, writeFile, unlink, mkdir } from 'fs/promises';
import { resolve, join } from 'path';
import { existsSync } from 'fs';
import { load as loadYaml, dump as dumpYaml } from 'js-yaml';
import { glob } from 'glob';

const BACKUP_DIR = resolve(process.cwd(), 'backup-news-articles');

// Required fields in frontmatter
const requiredFields = [
  'title',
  'description',
  'author',
  'read_time',
  'publish_date',
  'created_date',
  'heroImage',
  'cta'
];

// Valid authors from our generated list
const validAuthors = [
  'John Anderson', 'Pierre Martin', 'Juan Garcia', 'Raj Patel',
  'Marco Rossi', 'Lars Jensen', 'Ken Tanaka', 'Ahmed Hassan',
  'James Wilson', 'Wei Chen', 'Ana Rodriguez', 'Marie Bernard',
  'Maria Silva', 'Priya Shah', 'Laura Romano', 'Emma Larsson',
  'Yuki Sato', 'Fatima Ahmad', 'Sarah Thompson', 'Min Park'
];

async function backupFile(filePath) {
  try {
    // Get just the filename without the path
    const fileName = filePath.split(/[\/\\]/).pop();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = join(BACKUP_DIR, `${fileName}.${timestamp}.bak`);
    
    // Create backup directory if it doesn't exist
    if (!existsSync(BACKUP_DIR)) {
      await mkdir(BACKUP_DIR, { recursive: true });
    }
    
    // Read and write the file
    const content = await readFile(filePath, 'utf8');
    await writeFile(backupPath, content);
    console.log(`📦 Backed up file to: ${backupPath}`);
    return true;
  } catch (err) {
    console.warn(`⚠️  Failed to create backup: ${err.message}`);
    return false;
  }
}

function validateFrontmatter(frontmatter) {
  const errors = [];

  // Check required fields
  for (const field of requiredFields) {
    if (!frontmatter[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Check required fields
  for (const field of requiredFields) {
    if (!frontmatter[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // All validation passed
  return errors;

  return errors;
}

function cleanFrontmatter(frontmatter) {
  const cleaned = { ...frontmatter };

  // Ensure consistent quote style (single quotes)
  for (const [key, value] of Object.entries(cleaned)) {
    if (typeof value === 'string') {
      // Remove any extra whitespace
      cleaned[key] = value.trim();
      
      // Handle special characters in strings
      if (value.includes("'")) {
        // If string contains single quotes, wrap in double quotes
        cleaned[key] = `"${value.replace(/"/g, '\\"')}"`;
      } else {
        // Otherwise use single quotes
        cleaned[key] = `'${value}'`;
      }
    }
  }

  // Ensure fields are in a consistent order
  const orderedFrontmatter = {};
  requiredFields.forEach(field => {
    if (cleaned[field]) {
      orderedFrontmatter[field] = cleaned[field];
    }
  });

  // Add any additional fields not in required list
  Object.keys(cleaned)
    .filter(key => !requiredFields.includes(key))
    .forEach(key => {
      orderedFrontmatter[key] = cleaned[key];
    });

  return orderedFrontmatter;
}

async function processFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    const frontmatterMatch = content.match(/^---([\s\S]*?)\n---/);
    
    if (!frontmatterMatch) {
      console.error(`❌ No frontmatter found in ${filePath}`);
      return false;
    }

    let frontmatter;
    try {
      // Try to fix common YAML issues before parsing
      let yamlContent = frontmatterMatch[1];
      
      // Parse the content into lines and clean up
      const lines = yamlContent.split('\n');
      const cleanedLines = [];
      
      // Process each line
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue; // Skip empty lines
        
        // If line contains a colon, it's a key-value pair
        if (trimmedLine.includes(':')) {
          const colonIndex = trimmedLine.indexOf(':');
          const key = trimmedLine.substring(0, colonIndex).trim();
          let value = trimmedLine.substring(colonIndex + 1).trim();
          
          // Handle values with quotes
          if (value) {
            // Remove existing quotes
            value = value.replace(/^['"]|['"]$/g, '');
            
            // Handle dates without quotes
            if (key === 'publish_date' || key === 'created_date') {
              value = value.replace(/^['"]|['"]$/g, '');
            } else {
              // For non-date fields, handle quotes
              if (value.includes("'")) {
                // Replace single quotes with escaped single quotes
                value = value.replace(/'/g, "''");
                value = `'${value}'`;
              } else {
                // Otherwise use single quotes
                value = `'${value}'`;
              }
            }
          }
          
          // Add to cleaned lines with proper formatting
          cleanedLines.push(`${key}: ${value}`);
        } else {
          cleanedLines.push(trimmedLine);
        }
      }
      
      // Join lines with proper line endings
      yamlContent = cleanedLines.join('\n');

      // Try to parse the cleaned YAML
      try {
        frontmatter = loadYaml(yamlContent);
      } catch (yamlError) {
        // If parsing fails, try a more aggressive fix
        yamlContent = yamlContent.split('\n').map(line => {
          // Remove all indentation and colons from non-empty lines
          if (line.trim()) {
            const [key, ...values] = line.trim().split(':');
            if (values.length) {
              return `${key}: ${values.join(':').trim()}`;
            }
          }
          return line;
        }).join('\n');

        try {
          frontmatter = loadYaml(yamlContent);
        } catch (finalError) {
          console.error(`❌ YAML parsing error in ${filePath}:`, finalError.message);
          return false;
        }
      }
    } catch (error) {
      console.error(`❌ Error processing frontmatter in ${filePath}:`, error.message);
      return false;
    }

    // Validate frontmatter
    const errors = validateFrontmatter(frontmatter);
    if (errors.length > 0) {
      console.error(`❌ Validation errors in ${filePath}:`);
      errors.forEach(error => console.error(`   - ${error}`));
      return false;
    }

    // Clean and format frontmatter
    const cleanedFrontmatter = cleanFrontmatter(frontmatter);
    const newFrontmatter = dumpYaml(cleanedFrontmatter, {
      lineWidth: -1, // Prevent line wrapping
      quotingType: "'", // Use single quotes
      forceQuotes: true // Always quote strings
    });

    // Replace old frontmatter with new
    const newContent = content.replace(
      /^---([\s\S]*?)\n---/,
      `---\n${newFrontmatter}---`
    );

    // Write back to file
    await writeFile(filePath, newContent, 'utf8');
    console.log(`✅ Fixed frontmatter in ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🔍 Checking for problematic frontmatter...\n');

  // Create backup directory if it doesn't exist
  if (!existsSync(BACKUP_DIR)) {
    await mkdir(BACKUP_DIR, { recursive: true });
  }

  // Get all markdown files in the news directory
  const files = await glob('src/content/news/**/*.md');
  
  let success = 0;
  let failed = 0;
  let deleted = 0;

  for (const file of files) {
    console.log(`\nProcessing: ${file}`);
    
    // Try to process the file
    const result = await processFile(file);
    
    if (!result) {
      // Backup and delete file if it can't be fixed
      if (await backupFile(file)) {
        try {
          await unlink(file);
          console.log(`🗑️  Deleted ${file}`);
          deleted++;
        } catch (err) {
          console.error(`❌ Failed to delete ${file}:`, err.message);
          failed++;
        }
      } else {
        failed++;
      }
    } else {
      success++;
    }
  }

  console.log('\n📊 Results:');
  console.log(`✅ Successfully fixed: ${success}`);
  console.log(`🗑️  Deleted: ${deleted}`);
  console.log(`❌ Failed: ${failed}`);
}

main().catch(err => {
  console.error('\n❌ Script failed:', err);
  process.exit(1);
});