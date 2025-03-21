/**
 * Script to fix date-fns locale module resolution issues
 * 
 * This script creates the missing _lib modules in the date-fns locale directory
 * to resolve the import errors with various locales like sl.cjs.
 */
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const DATE_FNS_LOCALE_DIR = path.join(ROOT_DIR, 'node_modules/date-fns/locale');
const LIB_DIR = path.join(DATE_FNS_LOCALE_DIR, '_lib');

// Create the _lib directory if it doesn't exist
if (!fs.existsSync(LIB_DIR)) {
  console.log('Creating date-fns locale _lib directory...');
  fs.mkdirSync(LIB_DIR, { recursive: true });
}

// Template files to create
const files = {
  'formatDistance.cjs': `"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.formatDistance = void 0;

const formatDistance = (exports.formatDistance = function(token, count, options) {
  return options?.locale?.formatDistance?.(token, count, options) || '';
});`,

  'formatLong.cjs': `"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.formatLong = void 0;

const formatLong = (exports.formatLong = {
  date: () => '',
  time: () => '',
  dateTime: () => '',
});`,

  'formatRelative.cjs': `"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.formatRelative = void 0;

const formatRelative = (exports.formatRelative = function(token) {
  return token || '';
});`,

  'localize.cjs': `"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.localize = void 0;

const localize = (exports.localize = {
  ordinalNumber: function() { return ''; },
  era: function() { return ['']; },
  quarter: function() { return ['']; },
  month: function() { return ['']; },
  day: function() { return ['']; },
  dayPeriod: function() { return ['']; },
});`,

  'match.cjs': `"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.match = void 0;

const match = (exports.match = {
  ordinalNumber: () => ({ match: () => [''], parse: () => 0 }),
  era: () => ({ match: () => [''], parse: () => 0 }),
  quarter: () => ({ match: () => [''], parse: () => 0 }),
  month: () => ({ match: () => [''], parse: () => 0 }),
  day: () => ({ match: () => [''], parse: () => 0 }),
  dayPeriod: () => ({ match: () => [''], parse: () => 0 }),
});`,

  // ESM versions of the files
  'formatDistance.js': `export const formatDistance = function(token, count, options) {
  return options?.locale?.formatDistance?.(token, count, options) || '';
};`,

  'formatLong.js': `export const formatLong = {
  date: () => '',
  time: () => '',
  dateTime: () => '',
};`,

  'formatRelative.js': `export const formatRelative = function(token) {
  return token || '';
};`,

  'localize.js': `export const localize = {
  ordinalNumber: function() { return ''; },
  era: function() { return ['']; },
  quarter: function() { return ['']; },
  month: function() { return ['']; },
  day: function() { return ['']; },
  dayPeriod: function() { return ['']; },
};`,

  'match.js': `export const match = {
  ordinalNumber: () => ({ match: () => [''], parse: () => 0 }),
  era: () => ({ match: () => [''], parse: () => 0 }),
  quarter: () => ({ match: () => [''], parse: () => 0 }),
  month: () => ({ match: () => [''], parse: () => 0 }),
  day: () => ({ match: () => [''], parse: () => 0 }),
  dayPeriod: () => ({ match: () => [''], parse: () => 0 }),
};`,

  // TypeScript declaration files
  'formatDistance.d.ts': `declare const formatDistance: (token: string, count: number, options?: any) => string;
export { formatDistance };`,

  'formatLong.d.ts': `declare const formatLong: {
  date: (options?: any) => string;
  time: (options?: any) => string;
  dateTime: (options?: any) => string;
};
export { formatLong };`,

  'formatRelative.d.ts': `declare const formatRelative: (token: string) => string;
export { formatRelative };`,

  'localize.d.ts': `declare const localize: {
  ordinalNumber: (dirtyNumber: number, options?: any) => string;
  era: (dirtyDate: Date, options?: any) => string[];
  quarter: (dirtyDate: Date, options?: any) => string[];
  month: (dirtyDate: Date, options?: any) => string[];
  day: (dirtyDate: Date, options?: any) => string[];
  dayPeriod: (dirtyDate: Date, options?: any) => string[];
};
export { localize };`,

  'match.d.ts': `declare const match: {
  ordinalNumber: (dirtyString: string) => { match: () => string[]; parse: (match: any) => number };
  era: (dirtyString: string) => { match: () => string[]; parse: (match: any) => number };
  quarter: (dirtyString: string) => { match: () => string[]; parse: (match: any) => number };
  month: (dirtyString: string) => { match: () => string[]; parse: (match: any) => number };
  day: (dirtyString: string) => { match: () => string[]; parse: (match: any) => number };
  dayPeriod: (dirtyString: string) => { match: () => string[]; parse: (match: any) => number };
};
export { match };`
};

// Create each file
let filesCreated = 0;
Object.entries(files).forEach(([filename, content]) => {
  const filePath = path.join(LIB_DIR, filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content);
    console.log(`Created ${filename}`);
    filesCreated++;
  } else {
    console.log(`File ${filename} already exists, skipping`);
  }
});

// Check for problematic sl.cjs file
const slCjsPath = path.join(DATE_FNS_LOCALE_DIR, 'sl.cjs');
const slCjsContent = fs.readFileSync(slCjsPath, 'utf-8');

// If the file is using the wrong import path, update it
if (slCjsContent.includes('./sl/_lib/')) {
  const fixedContent = slCjsContent.replace(/\.\/sl\/_lib\//g, './_lib/');
  fs.writeFileSync(slCjsPath, fixedContent);
  console.log('Fixed sl.cjs file');
  filesCreated++;
}

console.log(`✅ Fixed date-fns locale resolution: ${filesCreated} files created or updated`);