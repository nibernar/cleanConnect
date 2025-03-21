#!/usr/bin/env node

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
  console.log('\nTo use these settings in your shell:');
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
