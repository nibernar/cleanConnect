#!/usr/bin/env node

/**
 * Comprehensive script to fix Node.js memory issues in the clean-connect project.
 * This script implements several strategies to prevent JavaScript heap out of memory errors.
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

console.log('🚀 Starting comprehensive memory issue fixes for clean-connect...');

// Path constants
const ROOT_DIR = path.resolve(__dirname, '..');
const PACKAGE_JSON_PATH = path.join(ROOT_DIR, 'package.json');

// Check if cross-env is installed, install if not
function ensureCrossEnvInstalled() {
  try {
    console.log('Checking if cross-env is installed...');
    
    // Read package.json
    const packageJson = require(PACKAGE_JSON_PATH);
    
    // Check if cross-env is in dependencies or devDependencies
    const hasCrossEnv = (
      (packageJson.dependencies && packageJson.dependencies['cross-env']) ||
      (packageJson.devDependencies && packageJson.devDependencies['cross-env'])
    );
    
    if (!hasCrossEnv) {
      console.log('Installing cross-env as dev dependency...');
      execSync('npm install --save-dev cross-env', { stdio: 'inherit', cwd: ROOT_DIR });
      console.log('✅ cross-env installed successfully.');
    } else {
      console.log('✅ cross-env is already installed.');
    }
  } catch (error) {
    console.error('❌ Error checking/installing cross-env:', error.message);
    process.exit(1);
  }
}

// Create a .npmrc file with node memory settings
function createNpmrcWithMemorySettings() {
  const npmrcPath = path.join(ROOT_DIR, '.npmrc');
  const npmrcContent = 'node-options=--max-old-space-size=8192\n';
  
  console.log('Creating .npmrc with increased memory settings...');
  fs.writeFileSync(npmrcPath, npmrcContent);
  console.log(`✅ Created ${npmrcPath}`);
}

// Create a node memory environment setup script
function createNodeEnvSetupScript() {
  const setupScriptPath = path.join(ROOT_DIR, 'scripts', 'setup-node-env.js');
  const setupScriptContent = `#!/usr/bin/env node

/**
 * Sets up optimal Node.js environment variables for the clean-connect project.
 * Run this script before any memory-intensive operations.
 */

console.log('Setting optimal Node.js environment variables...');

// Export environment variables that other scripts can use
process.env.NODE_OPTIONS = '--max-old-space-size=8192';

console.log('✅ Node options set: NODE_OPTIONS=--max-old-space-size=8192');
console.log('✅ Environment ready for memory-intensive operations.');

// If this script is run directly, just display the configured environment
if (require.main === module) {
  console.log('\\nTo use these settings in your shell:');
  console.log('  - For bash/zsh: export NODE_OPTIONS=--max-old-space-size=8192');
  console.log('  - For Windows cmd: set NODE_OPTIONS=--max-old-space-size=8192');
  console.log('  - For PowerShell: $env:NODE_OPTIONS="--max-old-space-size=8192"');
}

module.exports = {
  setupNodeEnv: () => {
    process.env.NODE_OPTIONS = '--max-old-space-size=8192';
    return process.env;
  }
};
`;
  
  console.log('Creating Node.js environment setup script...');
  fs.writeFileSync(setupScriptPath, setupScriptContent);
  fs.chmodSync(setupScriptPath, '755');
  console.log(`✅ Created ${setupScriptPath}`);
}

// Update package.json scripts to use the increased memory settings
function updatePackageJsonScripts() {
  console.log('Updating package.json scripts with memory optimizations...');
  
  try {
    // Read the current package.json
    const packageJson = require(PACKAGE_JSON_PATH);
    
    // Add memory optimization to scripts that might need it
    const scriptsToOptimize = ['fix-date-fns', 'fix-axios', 'force-fix-axios', 'postinstall'];
    let modified = false;
    
    for (const scriptName of scriptsToOptimize) {
      if (packageJson.scripts[scriptName] && !packageJson.scripts[scriptName].includes('NODE_OPTIONS=--max-old-space-size=')) {
        packageJson.scripts[scriptName] = `cross-env NODE_OPTIONS=--max-old-space-size=8192 ${packageJson.scripts[scriptName]}`;
        modified = true;
      }
    }
    
    // Add convenience scripts for memory management
    if (!packageJson.scripts['with-memory']) {
      packageJson.scripts['with-memory'] = 'cross-env NODE_OPTIONS=--max-old-space-size=8192';
      modified = true;
    }
    
    if (modified) {
      // Write the updated package.json
      fs.writeFileSync(
        PACKAGE_JSON_PATH,
        JSON.stringify(packageJson, null, 2) + '\n'
      );
      console.log('✅ Updated package.json scripts with memory optimizations.');
    } else {
      console.log('✅ Package.json scripts already have memory optimizations.');
    }
  } catch (error) {
    console.error('❌ Error updating package.json:', error.message);
  }
}

// Create a README explaining the memory optimization approach
function createMemoryOptimizationReadme() {
  const readmePath = path.join(ROOT_DIR, 'MEMORY_OPTIMIZATION.md');
  const readmeContent = `# Memory Optimization for Clean-Connect

## Overview

This document explains how JavaScript heap out of memory errors have been addressed in the Clean-Connect project.

## The Problem

Node.js has a default memory limit (typically around 2GB for 64-bit systems), which can be exceeded when:
- Processing large files
- Working with large node_modules directories
- Running memory-intensive operations like patching/modifying dependencies
- Executing long-running build processes

The error typically looks like:

\`\`\`
FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory
\`\`\`

## Implemented Solutions

This project has implemented multiple strategies to resolve memory issues:

### 1. Package.json Script Optimization

Memory-intensive scripts in package.json have been updated to use \`cross-env\` to set the Node.js memory limit:

\`\`\`json
"fix-date-fns": "cross-env NODE_OPTIONS=--max-old-space-size=8192 node ./scripts/fix-date-fns.js"
\`\`\`

### 2. Helper Scripts

Several helper scripts have been created:

- \`scripts/node-with-more-memory.js\`: A wrapper to run any Node script with increased memory
- \`scripts/run-with-more-memory.js\`: A tool to run specific project scripts with more memory
- \`scripts/setup-node-env.js\`: Sets optimal Node.js environment variables for memory usage

### 3. Project-wide .npmrc

A project-wide .npmrc file configures memory settings for all npm operations.

## How to Use

### For Regular Development

The memory optimizations should work automatically for scripts defined in package.json.

### For Running Custom Scripts with More Memory

\`\`\`bash
# Option 1: Use the package.json "with-memory" helper
npm run with-memory your-script.js

# Option 2: Use the node-with-more-memory.js helper
node ./scripts/node-with-more-memory.js path/to/your-script.js
\`\`\`

### Setting Memory Options Manually

In your terminal:

- **Bash/Zsh**: \`export NODE_OPTIONS=--max-old-space-size=8192\`
- **Windows cmd**: \`set NODE_OPTIONS=--max-old-space-size=8192\`
- **PowerShell**: \`$env:NODE_OPTIONS="--max-old-space-size=8192"\`

## Memory Optimization Best Practices

1. Break large operations into smaller chunks
2. Avoid keeping large objects in memory unnecessarily 
3. Consider using streams for file operations
4. Use incremental processing where possible
5. For very large operations, consider using worker threads or child processes
`;
  
  console.log('Creating memory optimization documentation...');
  fs.writeFileSync(readmePath, readmeContent);
  console.log(`✅ Created ${readmePath}`);
}

// Create an optimized bash script to run with increased memory
function createBashHelper() {
  const scriptPath = path.join(ROOT_DIR, 'scripts', 'with-memory.sh');
  const scriptContent = `#!/bin/bash

# This script runs a Node.js command with increased memory allocation
# Usage: ./with-memory.sh <command> [args...]

if [ $# -eq 0 ]; then
  echo "Usage: ./with-memory.sh <command> [args...]"
  echo "Example: ./with-memory.sh npm run build"
  exit 1
fi

# Set increased memory limit
export NODE_OPTIONS="--max-old-space-size=8192"

echo "Running command with increased memory (8GB)..."
echo "$ $@"

# Execute the command with all arguments
"$@"
`;
  
  console.log('Creating bash helper script...');
  fs.writeFileSync(scriptPath, scriptContent);
  fs.chmodSync(scriptPath, '755');
  console.log(`✅ Created ${scriptPath}`);
}

// Make all scripts executable
function makeScriptsExecutable() {
  const scriptsDir = path.join(ROOT_DIR, 'scripts');
  const files = fs.readdirSync(scriptsDir);
  
  console.log('Making scripts executable...');
  
  let count = 0;
  for (const file of files) {
    if (file.endsWith('.js') || file.endsWith('.sh')) {
      const filePath = path.join(scriptsDir, file);
      fs.chmodSync(filePath, '755');
      count++;
    }
  }
  
  console.log(`✅ Made ${count} scripts executable.`);
}

// Run all the fix functions
function runAllFixes() {
  try {
    ensureCrossEnvInstalled();
    createNpmrcWithMemorySettings();
    createNodeEnvSetupScript();
    updatePackageJsonScripts();
    createMemoryOptimizationReadme();
    createBashHelper();
    makeScriptsExecutable();
    
    console.log('\n✅ All memory optimization fixes have been applied successfully!');
    console.log('✅ You should now be able to run memory-intensive operations without encountering heap out of memory errors.');
    console.log('\nRecommended next steps:');
    console.log('1. Run your previously failing command again');
    console.log('2. If you\'re encountering issues with npm install or postinstall, try:');
    console.log('   $ export NODE_OPTIONS=--max-old-space-size=8192 && npm install');
    console.log('3. Read the MEMORY_OPTIMIZATION.md file for detailed documentation');
    
  } catch (error) {
    console.error('\n❌ Error applying memory fixes:', error.message);
    process.exit(1);
  }
}

// Run all the fixes
runAllFixes();