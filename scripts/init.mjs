import { spawn } from 'child_process';
import { promisify } from 'util';
import { exec as execCallback } from 'child_process';

const exec = promisify(execCallback);

async function runCommand(command, description) {
  console.log(`\n🚀 ${description}...`);
  
  try {
    const { stdout, stderr } = await exec(command);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    console.log(`✅ ${description} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return false;
  }
}

async function checkEnvironment() {
  if (!process.env.REPLICATE_API_TOKEN) {
    console.error('❌ REPLICATE_API_TOKEN environment variable is required');
    console.error('Please set it with: export REPLICATE_API_TOKEN=your_token_here');
    process.exit(1);
  }
}

async function main() {
  console.log('🎬 Starting project initialization...\n');
  
  // Check environment
  await checkEnvironment();

  const steps = [
    {
      command: 'npm install',
      description: 'Installing dependencies'
    },
    {
      command: 'npm run generate-avatars',
      description: 'Generating author avatars'
    },
    {
      command: 'npm run generate-authors',
      description: 'Generating author profiles'
    },
    {
      command: 'npm run validate-authors',
      description: 'Validating author data'
    },
    {
      command: 'npm run build:vectors',
      description: 'Building vector database'
    }
  ];

  let success = true;
  for (const step of steps) {
    const result = await runCommand(step.command, step.description);
    if (!result) {
      success = false;
      break;
    }
    // Add small delay between steps
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  if (success) {
    console.log('\n✨ Project initialization completed successfully!');
    console.log('\nYou can now:');
    console.log('1. Run `npm run dev` to start the development server');
    console.log('2. Run `npm run build` to build for production');
    console.log('3. Run `npm run preview` to preview the production build');
  } else {
    console.error('\n❌ Project initialization failed');
    process.exit(1);
  }
}

// Handle errors
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  process.exit(1);
});

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});