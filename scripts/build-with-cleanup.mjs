import { spawn } from 'child_process';
import { unlink, copyFile, mkdir } from 'fs/promises';
import { resolve, join } from 'path';
import { existsSync } from 'fs';

const MAX_DELETIONS = 5;
let deletionCount = 0;

// Create backup directory if it doesn't exist
const backupDir = resolve(process.cwd(), 'backup-news-articles');
if (!existsSync(backupDir)) {
  await mkdir(backupDir, { recursive: true });
}

async function runBuild() {
  return new Promise((resolve, reject) => {
    console.log('\n🔨 Starting build process...');
    
    const build = spawn('astro', ['build'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true
    });

    let output = '';

    build.stdout.on('data', (data) => {
      output += data.toString();
      process.stdout.write(data);
    });

    build.stderr.on('data', (data) => {
      output += data.toString();
      process.stderr.write(data);
    });

    build.on('close', (code) => {
      if (code === 0) {
        resolve(null);
      } else {
        // Look for file paths in various error message formats
        let fileMatch = null;
        
        // Try to match YAML parsing errors
        const yamlMatch = output.match(/Location:\s+([^:]+\.md):(\d+):(\d+)/);
        if (yamlMatch) {
          fileMatch = yamlMatch[1];
        }
        
        // Try to match other error formats
        if (!fileMatch) {
          const otherMatch = output.match(/(?:Error|error|Invalid).*?(?:in|at|file) ['"]?(.*?\.md)['"]?[\s\n]/i);
          if (otherMatch) {
            fileMatch = otherMatch[1];
          }
        }

        // Clean up the file path if it contains /opt/buildhome/repo/
        if (fileMatch) {
          fileMatch = fileMatch.replace('/opt/buildhome/repo/', '');
          resolve(fileMatch);
        } else {
          reject(new Error('Build failed but could not identify problematic file'));
        }
      }
    });
  });
}

function isNewsMarkdownFile(filePath) {
  // Check if the file is in the news directory and is a markdown file
  const normalizedPath = filePath.replace(/\\/g, '/');
  return normalizedPath.includes('src/content/news/') && normalizedPath.endsWith('.md');
}

async function backupFile(filePath) {
  const fileName = filePath.split('/').pop();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = join(backupDir, `${fileName}.${timestamp}.bak`);
  
  try {
    await copyFile(filePath, backupPath);
    console.log(`📦 Backed up file to: ${backupPath}`);
  } catch (err) {
    console.warn(`⚠️  Failed to create backup: ${err.message}`);
  }
}

async function buildWithCleanup() {
  try {
    while (deletionCount < MAX_DELETIONS) {
      const problematicFile = await runBuild();
      
      if (!problematicFile) {
        console.log('\n✅ Build completed successfully');
        break;
      }

      const fullPath = resolve(process.cwd(), problematicFile);

      // Only delete files from the news directory
      if (!isNewsMarkdownFile(fullPath)) {
        console.error(`\n❌ Error: File ${problematicFile} is not in the news directory or is not a markdown file`);
        console.error('Stopping build process for safety');
        process.exit(1);
      }

      deletionCount++;
      console.log(`\n🗑️  Removing problematic file (${deletionCount}/${MAX_DELETIONS}): ${problematicFile}`);
      
      try {
        // Backup file before deletion
        await backupFile(fullPath);
        // Delete file
        await unlink(fullPath);
        console.log('✅ File removed successfully');
      } catch (err) {
        console.error('❌ Failed to remove file:', err);
        process.exit(1);
      }

      if (deletionCount === MAX_DELETIONS) {
        console.error('\n⚠️  Maximum number of file deletions reached');
        console.error('Please check your content files for systematic issues');
        process.exit(1);
      }

      console.log('\n🔄 Retrying build...\n');
    }
  } catch (err) {
    console.error('\n❌ Build failed:', err.message);
    process.exit(1);
  }
}

buildWithCleanup().catch(err => {
  console.error('\n❌ Script failed:', err);
  process.exit(1);
});