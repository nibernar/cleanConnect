#!/usr/bin/env node

/**
 * This script is a wrapper to run any npm script with increased memory allocation.
 * It modifies the NODE_OPTIONS environment variable to increase the heap size.
 */

const { spawn } = require('child_process');
const path = require('path');

// Determine which script to run
const scriptName = process.argv[2];
if (!scriptName) {
  console.error('Usage: node run-with-more-memory.js <script-name> [args...]');
  console.error('Example: node run-with-more-memory.js fix-axios');
  process.exit(1);
}

// Additional arguments to pass to the script
const scriptArgs = process.argv.slice(3);

console.log(`Running '${scriptName}' with increased memory allocation (8GB)...`);

// Set NODE_OPTIONS environment variable to increase memory
const env = {
  ...process.env,
  NODE_OPTIONS: '--max-old-space-size=8192'
};

// Path to the script to run
const scriptPath = path.resolve(__dirname, scriptName + '.js');

// Spawn the process with increased memory
const childProcess = spawn('node', [scriptPath, ...scriptArgs], { 
  stdio: 'inherit',
  env: env
});

childProcess.on('error', (error) => {
  console.error(`Error executing script: ${error.message}`);
  process.exit(1);
});

childProcess.on('close', (code) => {
  if (code !== 0) {
    console.error(`Script exited with code ${code}`);
  } else {
    console.log(`Successfully executed '${scriptName}' with increased memory.`);
  }
  process.exit(code);
});