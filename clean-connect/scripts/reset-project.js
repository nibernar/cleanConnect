/**
 * Reset Project Script
 * 
 * This script helps reset the project state by clearing caches and temporary files
 * that might be causing bundling or other development issues.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Define directories to clean
const DIRS_TO_CLEAN = [
  '.expo',
  'node_modules/.cache',
];

// Optional metro bundler cache based on OS
const homeDir = os.homedir();
let metroCacheDir = null;

if (process.platform === 'darwin') { // macOS
  metroCacheDir = path.join(homeDir, 'Library/Caches/metro');
} else if (process.platform === 'linux') { // Linux
  metroCacheDir = path.join(homeDir, '.cache/metro');
} else if (process.platform === 'win32') { // Windows
  metroCacheDir = path.join(homeDir, 'AppData/Local/Temp/metro-cache');
}

console.log('🧹 Cleaning project cache...');

// Clear project directories
DIRS_TO_CLEAN.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (fs.existsSync(dirPath)) {
    console.log(`Removing ${dir}...`);
    try {
      if (process.platform === 'win32') {
        // Windows needs special handling for deleting directories
        execSync(`rmdir /s /q "${dirPath}"`);
      } else {
        execSync(`rm -rf "${dirPath}"`);
      }
      console.log(`✅ Removed ${dir}`);
    } catch (error) {
      console.error(`❌ Failed to remove ${dir}: ${error.message}`);
    }
  } else {
    console.log(`Directory ${dir} does not exist, skipping.`);
  }
});

// Clear Metro cache if found
if (metroCacheDir && fs.existsSync(metroCacheDir)) {
  console.log(`Removing Metro cache at ${metroCacheDir}...`);
  try {
    if (process.platform === 'win32') {
      execSync(`rmdir /s /q "${metroCacheDir}"`);
    } else {
      execSync(`rm -rf "${metroCacheDir}"`);
    }
    console.log('✅ Removed Metro cache');
  } catch (error) {
    console.error(`❌ Failed to remove Metro cache: ${error.message}`);
  }
}

// Run Watchman watch-del-all if Watchman is installed
try {
  console.log('Resetting Watchman...');
  execSync('watchman watch-del-all', { stdio: 'ignore' });
  console.log('✅ Reset Watchman');
} catch (error) {
  // Watchman might not be installed, so we'll just ignore this error
  console.log('⚠️ Watchman not installed or command failed (not critical)');
}

console.log('🚀 Project reset complete! You can now restart your development server.');
console.log('\nRun one of the following commands to start your app:');
console.log('  npm start      - Start Expo development server');
console.log('  npm run android - Start app on Android device/emulator');
console.log('  npm run ios     - Start app on iOS simulator');
console.log('  npm run web     - Start app in web browser');