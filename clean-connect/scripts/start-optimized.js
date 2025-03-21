#!/usr/bin/env node

/**
 * Optimized starter script that:
 * 1. Cleans minimal caches before starting
 * 2. Uses optimized Metro configuration
 * 3. Monitors memory usage during development
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ANSI color codes for prettier console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

console.log(`\n${colors.bright}${colors.cyan}🚀 Starting Clean-Connect with optimized settings...${colors.reset}\n`);

// Get command line arguments
const args = process.argv.slice(2);
const platformArg = args.find(arg => ['android', 'ios', 'web'].includes(arg)) || '';
const clearCacheArg = args.includes('--clear-cache');
const productionArg = args.includes('--production');

// Memory monitoring thresholds in MB
const WARNING_THRESHOLD = 4096; // 4GB
const CRITICAL_THRESHOLD = 7168; // 7GB

// Step 1: Clear cache if requested
if (clearCacheArg) {
  console.log(`${colors.yellow}Clearing application cache...${colors.reset}`);
  try {
    // Clean .expo and Metro cache
    const cacheDirectories = [
      path.join(__dirname, '..', '.expo'),
      path.join(__dirname, '..', 'node_modules', '.cache')
    ];
    
    cacheDirectories.forEach(dir => {
      if (fs.existsSync(dir)) {
        console.log(`Removing ${dir}...`);
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });
    
    console.log(`${colors.green}✓ Cache cleared successfully${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error clearing cache: ${error.message}${colors.reset}`);
  }
}

// Step 2: Setup memory monitor
let memoryMonitorInterval;
const startMemoryMonitor = () => {
  memoryMonitorInterval = setInterval(() => {
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
    const memoryPercentage = Math.round((heapUsedMB / heapTotalMB) * 100);
    
    // Only log when above a certain threshold to reduce noise
    if (heapUsedMB > 1000) {
      let statusColor = colors.green;
      let statusSymbol = '✓';
      
      if (heapUsedMB > CRITICAL_THRESHOLD) {
        statusColor = colors.red;
        statusSymbol = '⚠️';
      } else if (heapUsedMB > WARNING_THRESHOLD) {
        statusColor = colors.yellow;
        statusSymbol = '⚠️';
      }
      
      console.log(`${statusColor}${statusSymbol} Memory: ${heapUsedMB}MB used / ${heapTotalMB}MB total (${memoryPercentage}%)${colors.reset}`);
      
      if (heapUsedMB > CRITICAL_THRESHOLD) {
        console.log(`${colors.red}Warning: Memory usage is very high! Consider restarting the app or clearing cache.${colors.reset}`);
      }
    }
  }, 30000); // Check every 30 seconds
};

// Step 3: Determine command to run
const getStartCommand = () => {
  // Base command
  let command = 'expo';
  let args = ['start'];
  
  // Add platform if specified
  if (platformArg) {
    args.push(`--${platformArg}`);
  }
  
  // Add production flag if needed
  if (productionArg) {
    args.push('--no-dev', '--minify');
  }
  
  return { command, args };
};

// Step 4: Start the app with proper settings
const startApp = () => {
  try {
    // Ensure NODE_OPTIONS is set for maximum memory
    process.env.NODE_OPTIONS = '--max-old-space-size=8192';
    
    const { command, args } = getStartCommand();
    console.log(`${colors.cyan}Running: ${command} ${args.join(' ')}${colors.reset}`);
    
    // Start memory monitoring
    startMemoryMonitor();
    
    // Start the app process
    const child = spawn(command, args, {
      stdio: 'inherit',
      env: process.env
    });
    
    // Handle process events
    child.on('close', (code) => {
      clearInterval(memoryMonitorInterval);
      if (code !== 0) {
        console.log(`${colors.red}Process exited with code ${code}${colors.reset}`);
      }
      process.exit(code);
    });
    
    // Handle CTRL+C and other termination signals
    process.on('SIGINT', () => {
      console.log(`\n${colors.yellow}Shutting down...${colors.reset}`);
      clearInterval(memoryMonitorInterval);
      child.kill('SIGINT');
    });
  } catch (error) {
    console.error(`${colors.red}Failed to start app: ${error.message}${colors.reset}`);
    clearInterval(memoryMonitorInterval);
    process.exit(1);
  }
};

// Start the application
startApp();