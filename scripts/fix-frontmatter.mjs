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

function normalizeString(value, isDate = false) {
  if (typeof value !== 'string') return value;
  
  // Remove all quotes and clean the string
  let normalized = value.trim()
    .replace(/^['"]+|['"]+$/g, '')  // Remove outer quotes
    .replace(/'''/g, '')            // Remove triple quotes
    .replace(/\\'/g, "'")           // Unescape single quotes
    .replace(/\\"/g, '"')           // Unescape double quotes
    .replace(/'{2,}/g, "'")         // Collapse multiple single quotes
    .replace(/"{2,}/g, '"')         // Collapse multiple double quotes
    .trim();                        // Final trim

  // Return unquoted dates
  if (isDate) return normalized;
  
  // For values containing single quotes, wrap in double quotes
  if (normalized.includes("'")) {
    return `"${normalized}"`;
  }
  
  // Otherwise wrap in single quotes
  return `'${normalized}'`;
}

async function backupFile(filePath) {
  try {
    const fileName = filePath.split(/[\/\\]/).pop();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = join(BACKUP_DIR, `${fileName}.${timestamp}.bak`);
    
    if (!existsSync(BACKUP_DIR)) {
      await mkdir(BACKUP_DIR, { recursive: true });
    }
    
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

  return errors;
}

function cleanFrontmatter(frontmatter) {
  const cleaned = {};

  // Process each field
  for (const [key, value] of Object.entries(frontmatter)) {
    const isDate = key === 'publish_date' || key === 'created_date';
    
    if (isDate) {
      // Handle dates
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          cleaned[key] = date.toISOString().split('T')[0];
          continue;
        }
      } catch (err) {
        // Fall through to string handling if date parsing fails
      }
      
      // Try to extract YYYY-MM-DD
      const dateMatch = String(value).match(/(\d{4})-(\d{2})-(\d{2})/);
      cleaned[key] = dateMatch ? dateMatch[0] : new Date().toISOString().split('T')[0];
    } else if (typeof value === 'string') {
      // Handle string values
      cleaned[key] = normalizeString(value);
    } else {
      // Pass through non-string values unchanged
      cleaned[key] = value;
    }
  }

  // Ensure fields are in a consistent order
  const orderedFrontmatter = {};
  
  // Add required fields first
  requiredFields.forEach(field => {
    if (cleaned[field] !== undefined) {
      orderedFrontmatter[field] = cleaned[field];
    }
  });

  // Add remaining fields
  Object.keys(cleaned)
    .filter(key => !requiredFields.includes(key))
    .sort()
    .forEach(key => {
      orderedFrontmatter[key] = cleaned[key];
    });

  return orderedFrontmatter;
}

async function processFile(filePath) {
  try {
    console.log(`\nProcessing file: ${filePath}`);
    const content = await readFile(filePath, 'utf8');
    const frontmatterMatch = content.match(/^---([\s\S]*?)\n---/);
    
    if (!frontmatterMatch) {
      console.error(`❌ No frontmatter found in ${filePath}`);
      return false;
    }

    let frontmatter;
    try {
      // Clean up YAML content before parsing
      const yamlContent = frontmatterMatch[1]
        .split('\n')
        .map(line => {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.includes(':')) return trimmedLine;
          
          const [key, ...valueParts] = trimmedLine.split(':');
          let value = valueParts.join(':').trim();
          
          if (!value) return `${key}:`;

          // Remove any quotes and clean the value
          value = value
            .replace(/^['"]+|['"]+$/g, '')  // Remove outer quotes
            .replace(/'''/g, '')            // Remove triple quotes
            .replace(/\\'/g, "'")           // Unescape single quotes
            .replace(/\\"/g, '"')           // Unescape double quotes
            .replace(/'{2,}/g, "'")         // Collapse multiple single quotes
            .replace(/"{2,}/g, '"')         // Collapse multiple double quotes
            .trim();

          // Handle dates without quotes
          if (key.trim() === 'publish_date' || key.trim() === 'created_date') {
            return `${key}: ${value}`;
          }

          // Use double quotes if value contains single quotes
          if (value.includes("'")) {
            return `${key}: "${value}"`;
          }

          // Use single quotes otherwise
          return `${key}: '${value}'`;
        })
        .filter(Boolean)
        .join('\n');

      console.log('Cleaned YAML content:', yamlContent);
      frontmatter = loadYaml(yamlContent);
    } catch (error) {
      console.error(`❌ Error parsing frontmatter in ${filePath}:`, error.message);
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
    
    // Convert to YAML with custom quote handling
    let newFrontmatter = dumpYaml(cleanedFrontmatter, {
      lineWidth: -1,
      quotingType: "'",
      forceQuotes: true,
      noRefs: true,
      indent: 2,
      flowLevel: -1
    });

    // Additional cleanup for any remaining triple quotes
    newFrontmatter = newFrontmatter
      .split('\n')
      .map(line => {
        if (line.includes(':')) {
          const [key, ...valueParts] = line.split(':');
          let value = valueParts.join(':').trim();
          value = value
            .replace(/'''/g, '')
            .replace(/^['"]|['"]$/g, '')
            .trim();
          
          // Skip quotes for dates
          if (key.trim() === 'publish_date' || key.trim() === 'created_date') {
            return `${key}: ${value}`;
          }
          
          // Handle values with apostrophes and possessives
          value = value
            .replace(/^["']+|["']+$/g, '')  // Remove any outer quotes
            .replace(/'''/g, '')            // Remove triple quotes
            .replace(/"{2,}/g, '"')         // Collapse multiple double quotes
            .replace(/'{2,}/g, "'");        // Collapse multiple single quotes

          // Special handling for possessives
          if (value.includes("'s")) {
            // Keep possessives with single quotes
            return `${key}: '${value}'`;
          } else if (value.includes("'")) {
            // Use double quotes for other single quotes
            return `${key}: "${value}"`;
          } else {
            // Use single quotes for everything else
            return `${key}: '${value}'`;
          }
        }
        return line;
      })
      .join('\n');

    // Always write the cleaned frontmatter
    const newContent = content.replace(
      /^---([\s\S]*?)\n---/,
      `---\n${newFrontmatter}\n---`
    );

    await writeFile(filePath, newContent, 'utf8');
    console.log(`✅ Fixed frontmatter in ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  try {
    console.log('🔍 Checking for problematic frontmatter...\n');

    if (!existsSync(BACKUP_DIR)) {
      await mkdir(BACKUP_DIR, { recursive: true });
    }

    // Get all markdown files in the news directory
    const files = await glob('src/content/news/**/*.md', {
      ignore: ['**/node_modules/**', '**/backup-news-articles/**'],
      absolute: true,
      nodir: true,
      follow: true
    });

    if (files.length === 0) {
      console.warn('⚠️  No markdown files found in news directory');
      return;
    }

    console.log(`📝 Found ${files.length} files to process\n`);
    
    let success = 0;
    let failed = 0;
    let errors = [];

    // Process files sequentially
    for (const file of files) {
      try {
        const backupResult = await backupFile(file);
        if (!backupResult) {
          console.error(`❌ Failed to backup ${file} - skipping processing`);
          failed++;
          errors.push({ file, error: 'Backup failed' });
          continue;
        }
        
        const result = await processFile(file);
        if (result) {
          success++;
        } else {
          failed++;
          errors.push({ file, error: 'Processing failed' });
        }
      } catch (err) {
        console.error(`❌ Error processing ${file}:`, err.message);
        failed++;
        errors.push({ file, error: err.message });
      }
    }

    console.log('\n📊 Results:');
    console.log(`✅ Successfully fixed: ${success}`);
    console.log(`❌ Failed: ${failed}`);

    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach(({ file, error }) => {
        console.log(`   ${file}: ${error}`);
      });
      process.exit(1);
    }

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('\n❌ Script failed:', err);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('\n❌ Script failed:', err);
  process.exit(1);
});