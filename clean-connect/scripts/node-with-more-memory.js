#!/usr/bin/env node

/**
 * This script runs a Node.js script with increased memory allocation.
 * Usage: node node-with-more-memory.js <script-path> [args...]
 * 
 * It executes the child process with the --max-old-space-size flag to increase memory limit.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Check if script path is provided
if (process.argv.length < 3) {
  console.error('Usage: node node-with-more-memory.js <script-path> [args...]');
  process.exit(1);
}

const scriptPath = process.argv[2];
const args = process.argv.slice(3);

// Make sure the script exists
if (!fs.existsSync(scriptPath)) {
  console.error(`Script not found: ${scriptPath}`);
  process.exit(1);
}

// Run the script with increased memory (8GB)
const nodeProcess = spawn(
  'node', 
  ['--max-old-space-size=8192', scriptPath, ...args],
  { stdio: 'inherit' }
);

nodeProcess.on('close', (code) => {
  process.exit(code);
});