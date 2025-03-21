#!/usr/bin/env node

/**
 * This script increases the Node.js memory limit for Metro bundler and other Node processes
 * This helps prevent "JavaScript heap out of memory" errors during development
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define the memory limit (in MB)
const MEMORY_LIMIT = 8192; // 8GB

console.log(`\n🚀 Setting up Node.js memory limit to ${MEMORY_LIMIT}MB\n`);

// Update package.json scripts
try {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = require(packageJsonPath);
  
  // Check if scripts need modification
  let modified = false;
  const scriptsToModify = ['start', 'android', 'ios', 'web'];
  
  for (const scriptName of scriptsToModify) {
    if (packageJson.scripts[scriptName] && !packageJson.scripts[scriptName].includes('NODE_OPTIONS')) {
      packageJson.scripts[scriptName] = `cross-env NODE_OPTIONS=--max-old-space-size=${MEMORY_LIMIT} ${packageJson.scripts[scriptName]}`;
      modified = true;
    }
  }
  
  // Add a clean-cache script if it doesn't exist
  if (!packageJson.scripts['clean-cache']) {
    packageJson.scripts['clean-cache'] = 'expo start --clear && watchman watch-del-all';
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Updated package.json scripts with increased memory limit');
  } else {
    console.log('✓ package.json scripts already have memory limit set');
  }
} catch (error) {
  console.error('❌ Failed to update package.json:', error.message);
}

// Update .npmrc file
try {
  const npmrcPath = path.join(__dirname, '..', '.npmrc');
  const npmrcContent = `node_options=--max-old-space-size=${MEMORY_LIMIT}\n`;
  
  fs.writeFileSync(npmrcPath, npmrcContent);
  console.log('✅ Updated .npmrc with increased memory limit');
} catch (error) {
  console.error('❌ Failed to update .npmrc:', error.message);
}

// Create a helper script to reset the project
try {
  const resetScriptPath = path.join(__dirname, 'reset-project.js');
  const resetScriptContent = `#!/usr/bin/env node

/**
 * This script helps reset various caches and temporary files
 * Useful when facing unexplained errors or "JavaScript heap out of memory" issues
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('\\n🧹 Cleaning project cache and temp files...\\n');

try {
  // Define directories to clean
  const dirsToRemove = [
    '.expo',
    'node_modules/.cache',
  ];
  
  // Remove cache directories
  dirsToRemove.forEach(dir => {
    const dirPath = path.join(__dirname, '..', dir);
    if (fs.existsSync(dirPath)) {
      console.log(\`Removing \${dir}...\`);
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  });
  
  // Run cleaning commands
  const commands = [
    'watchman watch-del-all',
    'expo start --clear',
    'yarn cache clean'
  ];
  
  commands.forEach(cmd => {
    try {
      console.log(\`Running: \${cmd}\`);
      execSync(cmd, { stdio: 'inherit' });
    } catch (e) {
      console.log(\`Warning: Command \${cmd} failed, continuing anyway\`);
    }
  });
  
  console.log('\\n✅ Project cache successfully cleaned!');
  console.log('\\n💡 Now run "yarn install" followed by "expo start" to restart your project.\\n');
} catch (error) {
  console.error('\\n❌ Error while cleaning cache:', error.message);
}
`;
  
  if (!fs.existsSync(resetScriptPath)) {
    fs.writeFileSync(resetScriptPath, resetScriptContent);
    fs.chmodSync(resetScriptPath, '755');
    console.log('✅ Created reset-project.js helper script');
  } else {
    console.log('✓ reset-project.js script already exists');
  }
} catch (error) {
  console.error('❌ Failed to create reset script:', error.message);
}

console.log('\n🔍 Checking for cross-env dependency...');
if (!Object.keys(require('../package.json').devDependencies || {}).includes('cross-env')) {
  console.log('   Installing cross-env as dev dependency...');
  try {
    execSync('npm install --save-dev cross-env', { stdio: 'inherit' });
    console.log('✅ Installed cross-env successfully');
  } catch (error) {
    console.error('❌ Failed to install cross-env. Please install it manually: npm install --save-dev cross-env');
  }
} else {
  console.log('✓ cross-env already installed');
}

console.log('\n✨ All done! Your Node.js memory settings have been optimized.');
console.log('   Try running your app again with "npm start" or "yarn start".');
console.log('   If you still encounter issues, try running "node scripts/reset-project.js" first.\n');