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

function shouldUseBlockLiteral(str) {
  return str.includes('\n') || str.length > 80;
}

function formatBlockLiteral(str) {
  // Clean up the string
  const lines = str.split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);
    
  // Join with newlines and proper indentation
  return `|\n  ${lines.join('\n  ')}`;
}

function preprocessYaml(content) {
  // First pass: collect all keys and their last values, handling duplicates
  const keyValues = new Map();
  const lines = content.split('\n');
  let currentKey = null;
  let currentValue = [];
  let inBlockLiteral = false;
  let blockIndent = '';
  let isMultilineValue = false;
  let inFrontmatter = false;
  let foundFirstMarker = false;

  // Process lines between --- markers
  for (const line of lines) {
    const trimmedLine = line.trimEnd();
    
    // Handle frontmatter boundaries
    if (trimmedLine === '---') {
      if (!foundFirstMarker) {
        foundFirstMarker = true;
        continue;
      }
      if (!inFrontmatter) {
        inFrontmatter = true;
        continue;
      } else {
        break;
      }
    }

    // Skip lines outside frontmatter or empty lines (unless in block literal)
    if (!inFrontmatter || (!trimmedLine && !inBlockLiteral)) continue;
    // Check for new key
    const keyMatch = trimmedLine.match(/^(\s*)([\w-]+):\s*(.*)$/);
    if (keyMatch) {
      // Save previous key-value if exists
      if (currentKey && currentValue.length > 0) {
        // Clean up and store the value
        let cleanedValue = currentValue
          .join('\n')
          .replace(/^['"]|['"]$/g, '')  // Remove outer quotes
          .replace(/\\'/g, "'")         // Unescape single quotes
          .replace(/\\"/g, '"')         // Unescape double quotes
          .replace(/'''/g, '')          // Remove triple quotes
          .replace(/"{2,}/g, '"')       // Collapse multiple double quotes
          .replace(/'{2,}/g, "'")       // Collapse multiple single quotes
          .trim();

        // For title field, ensure it's a single line
        if (currentKey === 'title') {
          cleanedValue = cleanedValue.replace(/\n/g, ' ').trim();
        }

        keyValues.set(currentKey, cleanedValue);
      }

      const [, indent, key, value] = keyMatch;
      currentKey = key;
      blockIndent = indent;
      
      // Check for block literal marker or empty value
      if (value.match(/^['"]?\|['"]?$/) || !value.trim()) {
        inBlockLiteral = true;
        currentValue = [];
        isMultilineValue = true;
      } else if (value.match(/^['"]?[|>][-+]?['"]?$/)) {
        // Handle block literal with chomping indicators
        inBlockLiteral = true;
        currentValue = [];
        isMultilineValue = true;
      } else {
        inBlockLiteral = false;
        isMultilineValue = false;
        // Clean up the value
        const cleanedValue = value.trim()
          .replace(/^['"]|['"]$/g, '')
          .replace(/\\'/g, "'")
          .replace(/\\"/g, '"')
          .replace(/'''/g, '')
          .replace(/"{2,}/g, '"')
          .replace(/'{2,}/g, "'");
        currentValue = [cleanedValue];
      }
    } else if (currentKey) {
      // Skip lines that look like malformed keys or content
      if (!inBlockLiteral && trimmedLine.includes(':')) {
        const possibleKey = trimmedLine.split(':')[0].trim();
        if (/^[\w-]+$/.test(possibleKey)) continue;
      }

      // Add line to current value
      currentValue.push(trimmedLine);
      if (currentValue.length > 1) isMultilineValue = true;
    }
  }

  // Save last key-value if exists
  if (currentKey && currentValue.length > 0) {
    const cleanedValue = currentValue
      .join('\n')
      .replace(/^['"]|['"]$/g, '')
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/'''/g, '')
      .replace(/"{2,}/g, '"')
      .replace(/'{2,}/g, "'")
      .trim();

    keyValues.set(currentKey, cleanedValue);
  }

  // Second pass: build properly formatted YAML
  const processedLines = ['---'];
  
  // Sort keys for consistent output
  const sortedKeys = Array.from(keyValues.keys()).sort();
  
  for (const key of sortedKeys) {
    const value = keyValues.get(key);
    // Determine if we should use block literal
    const useBlock = value.length > 80 ||
                    value.includes('\n') ||
                    /[:#\[\]{}|>*&!%@`]/.test(value);
    
    if (useBlock) {
      // Use block literal style for multiline values
      processedLines.push(`${key}: |`);
      // Split into lines and preserve empty lines
      const lines = value.split(/\r?\n/);
      // Add each line with proper indentation
      lines.forEach(line => {
        // Preserve empty lines but indent non-empty ones
        processedLines.push(line.length > 0 ? `  ${line}` : '');
      });
    } else {
      // For simple values, use double quotes consistently
      const escapedValue = value
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"');
      processedLines.push(`${key}: "${escapedValue}"`);
    }
  }

  processedLines.push('---');
  return processedLines.join('\n');
}

function escapeYamlString(str) {
  if (typeof str !== 'string') return str;
  
  // Clean up the string
  let value = str.trim()
    .replace(/\r\n|\r|\n/g, ' ')  // Replace all newlines with spaces
    .replace(/\t/g, ' ')          // Replace tabs with spaces
    .replace(/ {2,}/g, ' ');      // Collapse multiple spaces
    
  // Handle apostrophes in words (like "don't", "it's", etc.)
  const hasApostrophe = /\w'\w/.test(value);
  const hasQuotes = value.includes('"');
  
  // Special YAML characters that need escaping
  const needsQuotes = /[:#\[\]{}|>*&!%@`]/;
  const hasSpecialChars = needsQuotes.test(value);
  
  // If the string contains special YAML characters, quotes, or apostrophes
  if (hasSpecialChars || hasQuotes || value.includes("'")) {
    // For strings with apostrophes in words but no other quotes, prefer single quotes
    if (hasApostrophe && !hasQuotes && !value.includes("''")) {
      return `'${value}'`;
    }
    
    // Otherwise use double quotes with proper escaping
    value = value.replace(/\\/g, '\\\\');  // Escape backslashes first
    value = value.replace(/"/g, '\\"');    // Escape double quotes
    return `"${value}"`;
  }
  
  // For simple strings, wrap in double quotes for consistency
  return `"${value}"`;
}

function formatYamlValue(key, value) {
  // Handle dates
  if ((key === 'publish_date' || key === 'created_date') && value) {
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (err) {
      // Fall through to string handling if date parsing fails
    }
    
    // Try to extract YYYY-MM-DD
    const dateMatch = String(value).match(/(\d{4})-(\d{2})-(\d{2})/);
    return dateMatch ? dateMatch[0] : new Date().toISOString().split('T')[0];
  }
  
  // Handle numbers
  if (typeof value === 'number') {
    return value;
  }
  
  // Handle booleans
  if (typeof value === 'boolean') {
    return value;
  }
  
  // Handle null/undefined
  if (value == null) {
    return '';
  }
  
  // Handle arrays
  if (Array.isArray(value)) {
    return `[${value.map(v => escapeYamlString(v)).join(', ')}]`;
  }
  
  // Handle objects
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  // Handle strings
  const str = String(value);
  return shouldUseBlockLiteral(str) ? formatBlockLiteral(str) : escapeYamlString(str);
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
  const filename = frontmatter._filename || '';
  const now = new Date();
  const defaultAuthor = validAuthors[0];
  
  // Generate default values for required fields
  if (filename) {
    const baseName = filename
      .split(/[\/\\]/)
      .pop()
      .replace(/\.md$/, '')
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    // Set default values for missing fields
    if (!frontmatter.title || !frontmatter.title.trim()) {
      frontmatter.title = baseName;
    }
    if (!frontmatter.description || !frontmatter.description.trim()) {
      frontmatter.description = `Comprehensive guide exploring ${baseName.toLowerCase()} and its impact on modern technology.`;
    }
    if (!frontmatter.author || !frontmatter.author.trim()) {
      frontmatter.author = defaultAuthor;
    }
    if (!frontmatter.read_time || !frontmatter.read_time.trim()) {
      frontmatter.read_time = "8 mins";
    }
    if (!frontmatter.publish_date) {
      frontmatter.publish_date = now.toISOString().split('T')[0];
    }
    if (!frontmatter.created_date) {
      frontmatter.created_date = now.toISOString().split('T')[0];
    }
    // Only set heroImage if it's completely missing
    if (!frontmatter.heroImage) {
      frontmatter.heroImage = `https://assets.magick.ai/${baseName.toLowerCase().replace(/\s+/g, '-')}.png`;
    }
    if (!frontmatter.cta || !frontmatter.cta.trim()) {
      frontmatter.cta = `Stay ahead of the curve! Follow us on LinkedIn for more insights about ${baseName.toLowerCase()} and other cutting-edge developments in AI and technology.`;
    }
  }

  // Validate all required fields are present
  for (const field of requiredFields) {
    const value = frontmatter[field];
    if (!value || (typeof value === 'string' && !value.trim())) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  return errors;
}

function cleanFrontmatter(frontmatter) {
  // Keep all existing fields and just clean their values
  const cleaned = {};
  
  // Process each field
  for (const [key, value] of Object.entries(frontmatter)) {
    cleaned[key] = value;
  }
  
  // Sort fields for consistent output
  const orderedFrontmatter = {};
  
  // Sort all keys alphabetically
  Object.keys(cleaned)
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
    
    // Extract and validate frontmatter
    const frontmatterMatch = content.match(/^---([\s\S]*?)---/);
    if (!frontmatterMatch) {
      console.error(`❌ No frontmatter found in ${filePath}`);
      return false;
    }

    // Pre-process the frontmatter
    const processedYaml = preprocessYaml(frontmatterMatch[1]);

    // Parse the processed YAML
    let frontmatter;
    try {
      // Parse the YAML content
      frontmatter = loadYaml(processedYaml.split('\n').slice(1, -1).join('\n')) || {};
      
      // Add filename for validation
      frontmatter._filename = filePath;

      // Validate and auto-generate missing fields
      const errors = validateFrontmatter(frontmatter);
      if (errors.length > 0) {
        console.error(`❌ Validation errors in ${filePath}:`);
        errors.forEach(error => console.error(`   - ${error}`));
        return false;
      }

      // Remove internal _filename field
      delete frontmatter._filename;
    } catch (error) {
      console.error(`❌ Error parsing frontmatter in ${filePath}:`, error.message);
      return false;
    }

    // Clean and format frontmatter
    const cleanedFrontmatter = cleanFrontmatter(frontmatter);
    
    // Format frontmatter with proper escaping and indentation
    const yamlLines = [];
    
    // Get all fields sorted alphabetically
    const orderedFields = Object.keys(cleanedFrontmatter).sort();

    // Generate YAML lines with proper formatting
    for (const key of orderedFields) {
      if (!(key in cleanedFrontmatter)) continue;
      
      const value = cleanedFrontmatter[key];
      const formattedValue = formatYamlValue(key, value);
      yamlLines.push(`${key}: ${formattedValue}`);
    }
    
    // Join lines with proper newlines
    const newFrontmatter = yamlLines.join('\n');

    // Extract content after frontmatter
    const contentAfterFrontmatter = content.replace(/^---([\s\S]*?)---/, '');
    
    // Combine new frontmatter with original content
    const newContent = `---\n${newFrontmatter}\n---${contentAfterFrontmatter}`;

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