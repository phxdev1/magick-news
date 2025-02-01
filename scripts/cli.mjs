#!/usr/bin/env node
import { spawn } from 'child_process';
import { promisify } from 'util';
import { exec as execCallback } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';

const exec = promisify(execCallback);

// ANSI escape codes for colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Spinner frames for loading animation
const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

class Spinner {
  constructor(message) {
    this.message = message;
    this.frame = 0;
    this.interval = null;
  }

  start() {
    this.interval = setInterval(() => {
      process.stdout.write(`\r${colors.cyan}${frames[this.frame]} ${this.message}${colors.reset}`);
      this.frame = (this.frame + 1) % frames.length;
    }, 80);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      process.stdout.write('\r\x1b[K'); // Clear line
    }
  }

  update(message) {
    this.message = message;
  }
}

async function runCommand(command, description, options = {}) {
  const spinner = new Spinner(description);
  spinner.start();

  return new Promise((resolve, reject) => {
    const child = spawn(command, [], {
      shell: true,
      stdio: options.stdio || ['ignore', 'pipe', 'pipe']
    });

    let output = '';

    if (child.stdout) {
      child.stdout.on('data', (data) => {
        const str = data.toString();
        output += str;
        
        // Update spinner with last line of output
        const lines = str.trim().split('\n');
        if (lines.length > 0) {
          const lastLine = lines[lines.length - 1].trim();
          if (lastLine) {
            spinner.update(`${description} - ${lastLine}`);
          }
        }
      });
    }

    if (child.stderr) {
      child.stderr.on('data', (data) => {
        output += data.toString();
      });
    }

    child.on('close', (code) => {
      spinner.stop();
      if (code === 0) {
        console.log(`${colors.green}✓${colors.reset} ${description}`);
        resolve(output);
      } else {
        console.error(`${colors.red}✗${colors.reset} ${description} failed with code ${code}`);
        console.error(output);
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    child.on('error', (err) => {
      spinner.stop();
      console.error(`${colors.red}✗${colors.reset} ${description} failed:`, err.message);
      reject(err);
    });
  });
}

async function checkEnvironment() {
  if (!process.env.REPLICATE_API_TOKEN && process.argv[2] !== 'dev') {
    console.error(`${colors.red}✗${colors.reset} REPLICATE_API_TOKEN environment variable is required`);
    process.exit(1);
  }
}

function needsInitialization() {
  // Check for key directories and files that should exist after initialization
  const checks = [
    'public/images/authors',
    'src/content/authors',
    'node_modules',
    'public/vector-db'
  ];

  return checks.some(path => !existsSync(resolve(process.cwd(), path)));
}

const commands = {
  dev: {
    description: 'Start development server',
    steps: [
      {
        command: 'astro dev',
        description: 'Starting development server'
      }
    ]
  },
  build: {
    description: 'Build for production',
    steps: [
      {
        command: 'npm run build:vectors',
        description: 'Building vector database'
      },
      {
        command: 'npm run validate-authors',
        description: 'Validating author data'
      },
      {
        command: 'astro build',
        description: 'Building site'
      }
    ]
  },
  preview: {
    description: 'Preview production build',
    steps: [
      {
        command: 'astro build',
        description: 'Building site'
      },
      {
        command: 'wrangler pages dev',
        description: 'Starting preview server'
      }
    ]
  },
  deploy: {
    description: 'Deploy to production',
    steps: [
      {
        command: 'npm run build:vectors',
        description: 'Building vector database'
      },
      {
        command: 'astro build',
        description: 'Building site'
      },
      {
        command: 'wrangler pages deploy',
        description: 'Deploying to Cloudflare Pages'
      }
    ]
  }
};

const initSteps = [
  {
    command: 'npm install',
    description: 'Installing dependencies'
  },
  {
    command: 'npm run generate-avatars',
    description: 'Generating author avatars',
    options: { stdio: ['ignore', 'inherit', 'inherit'] }
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

function showHelp() {
  console.log(`\n${colors.bright}Available commands:${colors.reset}\n`);
  Object.entries(commands).forEach(([name, { description }]) => {
    console.log(`  ${colors.cyan}${name.padEnd(15)}${colors.reset}${description}`);
  });
  console.log('\nExample: npm run dev\n');
}

async function runInitialization() {
  console.log(`\n${colors.yellow}⚡ Project needs initialization${colors.reset}\n`);
  
  for (const step of initSteps) {
    try {
      await runCommand(step.command, step.description, step.options);
      // Add delay between steps
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`\n${colors.red}✗${colors.reset} Initialization failed`);
      process.exit(1);
    }
  }
  
  console.log(`\n${colors.green}✓${colors.reset} Initialization complete\n`);
}

async function main() {
  const command = process.argv[2];

  if (!command || command === '--help' || command === '-h') {
    showHelp();
    return;
  }

  const selectedCommand = commands[command];
  if (!selectedCommand) {
    console.error(`${colors.red}Unknown command: ${command}${colors.reset}`);
    showHelp();
    return;
  }

  await checkEnvironment();

  // Check if initialization is needed
  if (needsInitialization()) {
    await runInitialization();
  }

  console.log(`\n${colors.bright}${selectedCommand.description}${colors.reset}\n`);

  for (const step of selectedCommand.steps) {
    try {
      await runCommand(step.command, step.description, step.options);
      // Add delay between steps
      if (step !== selectedCommand.steps[selectedCommand.steps.length - 1]) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      process.exit(1);
    }
  }

  if (command === 'dev' || command === 'preview') {
    console.log(`\n${colors.green}✓${colors.reset} Server running! Press Ctrl+C to stop\n`);
  } else if (command === 'deploy') {
    console.log(`\n${colors.green}✓${colors.reset} Deployment complete! Your site is live\n`);
  } else {
    console.log(`\n${colors.green}✓${colors.reset} Done!\n`);
  }
}

// Handle errors
process.on('unhandledRejection', (err) => {
  console.error(`${colors.red}Unhandled rejection:${colors.reset}`, err);
  process.exit(1);
});

main().catch(err => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, err);
  process.exit(1);
});