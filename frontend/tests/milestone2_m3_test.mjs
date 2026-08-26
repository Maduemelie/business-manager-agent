/**
 * Milestone 2 & 3 Verification Test Suite
 * Tests:
 * 1. backupService.js (Schema validation, corrupt payloads, valid payload export format)
 * 2. vite.config.js (Workbox runtime caching rules for Google fonts, static images, precache assets)
 * 3. Component module exports & React Hook contracts
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;
let failedTests = [];

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
  } else {
    failedTests.push(message);
    console.error(`❌ FAIL: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  totalTests++;
  if (actual === expected) {
    passedTests++;
  } else {
    const msg = `${message} (Expected: ${JSON.stringify(expected)}, Got: ${JSON.stringify(actual)})`;
    failedTests.push(msg);
    console.error(`❌ FAIL: ${msg}`);
  }
}

console.log('====================================================');
console.log('STARTING EMPIRICAL VERIFICATION: MILESTONES 2 & 3');
console.log('====================================================\n');

// ----------------------------------------------------
// SUITE 1: backupService.js Validation
// ----------------------------------------------------
console.log('--- Suite 1: backupService.js Schema Validation ---');
const { validateBackupSchema } = await import('../src/services/backupService.js');

// 1. Valid payload
const validPayload = {
  app: 'sirvinistyles',
  version: 1,
  exported_at: '2026-08-26T10:00:00.000Z',
  data: {
    perfumes: [
      { id: 1, perfume_name: 'Baccarat Rouge 540', brand: 'Maison Francis Kurkdjian' }
    ],
    posts: [
      { id: 'post-1', date: '2026-08-26', main_post: 'Luxury fragrance post' }
    ],
    selection_history: [
      { perfume_id: 1, selected_at: '2026-08-26T10:00:00.000Z' }
    ],
    app_settings: [
      { key: 'theme', value: 'dark' }
    ]
  }
};

const validResult = validateBackupSchema(validPayload);
assert(validResult.valid === true, 'Valid payload must return valid: true');

const validStringResult = validateBackupSchema(JSON.stringify(validPayload));
assert(validStringResult.valid === true, 'Valid JSON string must return valid: true');

// 2. Corrupt / Invalid JSON string
const corruptStringResult = validateBackupSchema('{ bad json string ');
assertEqual(corruptStringResult.valid, false, 'Corrupt JSON string must return valid: false');
assert(corruptStringResult.error.includes('Invalid JSON format'), 'Corrupt JSON should provide descriptive error');

// 3. Invalid root type
const nullResult = validateBackupSchema(null);
assertEqual(nullResult.valid, false, 'Null payload must return valid: false');

const arrayRootResult = validateBackupSchema([1, 2, 3]);
assertEqual(arrayRootResult.valid, false, 'Array root payload must return valid: false');

// 4. Invalid app identifier
const invalidAppResult = validateBackupSchema({ ...validPayload, app: 'other_app' });
assertEqual(invalidAppResult.valid, false, 'Invalid app must return valid: false');
assert(invalidAppResult.error.includes('Invalid backup identifier'), 'App mismatch error should be reported');

// 5. Invalid version
const invalidVersionResult = validateBackupSchema({ ...validPayload, version: 2 });
assertEqual(invalidVersionResult.valid, false, 'Unsupported version must return valid: false');
assert(invalidVersionResult.error.includes('Unsupported backup version'), 'Version mismatch error should be reported');

// 6. Missing data container
const missingDataResult = validateBackupSchema({ app: 'sirvinistyles', version: 1 });
assertEqual(missingDataResult.valid, false, 'Missing data object must return valid: false');

// 7. Missing or non-array stores
const missingPerfumesResult = validateBackupSchema({
  app: 'sirvinistyles',
  version: 1,
  data: { posts: [], selection_history: [], app_settings: [] }
});
assertEqual(missingPerfumesResult.valid, false, 'Missing data.perfumes array must return valid: false');

const missingPostsResult = validateBackupSchema({
  app: 'sirvinistyles',
  version: 1,
  data: { perfumes: [], selection_history: [], app_settings: [] }
});
assertEqual(missingPostsResult.valid, false, 'Missing data.posts array must return valid: false');

const missingHistoryResult = validateBackupSchema({
  app: 'sirvinistyles',
  version: 1,
  data: { perfumes: [], posts: [], app_settings: [] }
});
assertEqual(missingHistoryResult.valid, false, 'Missing data.selection_history array must return valid: false');

const missingSettingsResult = validateBackupSchema({
  app: 'sirvinistyles',
  version: 1,
  data: { perfumes: [], posts: [], selection_history: [] }
});
assertEqual(missingSettingsResult.valid, false, 'Missing data.app_settings array must return valid: false');

// 8. Corrupt perfume items in perfumes array
const corruptPerfumeResult = validateBackupSchema({
  app: 'sirvinistyles',
  version: 1,
  data: {
    perfumes: [{ bad_item: true }],
    posts: [],
    selection_history: [],
    app_settings: []
  }
});
assertEqual(corruptPerfumeResult.valid, false, 'Corrupt perfume item missing id must return valid: false');

// ----------------------------------------------------
// SUITE 2: vite.config.js Workbox & PWA Configuration
// ----------------------------------------------------
console.log('\n--- Suite 2: vite.config.js PWA & Workbox Configuration ---');
const viteConfigContent = fs.readFileSync(path.join(rootDir, 'vite.config.js'), 'utf8');

assert(viteConfigContent.includes('VitePWA'), 'vite.config.js must import and include VitePWA');
assert(viteConfigContent.includes('workbox:'), 'vite.config.js must configure workbox');
assert(viteConfigContent.includes('runtimeCaching:'), 'vite.config.js must configure runtimeCaching');
assert(viteConfigContent.includes('fonts.googleapis.com'), 'vite.config.js must cache Google Fonts stylesheets');
assert(viteConfigContent.includes('fonts.gstatic.com'), 'vite.config.js must cache Google Fonts webfonts');
assert(viteConfigContent.includes('CacheFirst'), 'vite.config.js must use CacheFirst strategy for fonts');
assert(viteConfigContent.includes('/images/'), 'vite.config.js must cache static /images/');

// ----------------------------------------------------
// SUITE 3: Component and Hook File Existence & Exports
// ----------------------------------------------------
console.log('\n--- Suite 3: Components & Hooks Structure ---');
const requiredFiles = [
  'src/hooks/useNetworkStatus.js',
  'src/components/OfflineStatusBanner.jsx',
  'src/components/BackupControls.jsx',
  'src/components/InstallPromptButton.jsx',
  'src/components/Header.jsx',
  'src/App.jsx'
];

for (const relPath of requiredFiles) {
  const fullPath = path.join(rootDir, relPath);
  assert(fs.existsSync(fullPath), `Required file ${relPath} must exist`);
  const content = fs.readFileSync(fullPath, 'utf8');
  assert(content.length > 50, `File ${relPath} must contain substantive implementation`);
}

// Check useNetworkStatus exports
const { useNetworkStatus } = await import('../src/hooks/useNetworkStatus.js');
assert(typeof useNetworkStatus === 'function', 'useNetworkStatus must be exported as a function');

console.log('\n====================================================');
console.log(`TOTAL TESTS: ${totalTests}`);
console.log(`PASSED: ${passedTests}`);
console.log(`FAILED: ${failedTests.length}`);
if (failedTests.length > 0) {
  console.log('Failed Tests:');
  failedTests.forEach(f => console.log(` - ${f}`));
}
console.log('====================================================');
