#!/usr/bin/env node
/**
 * SpeakSync Service Health Check Script
 * Tests connectivity to critical backend services
 */

const https = require('https');
const http = require('http');

// Load environment variables
require('dotenv').config();

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  fail: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`)
};

async function checkUrl(url, name, expectedStatus = 200) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, { timeout: 10000 }, (res) => {
      if (res.statusCode === expectedStatus || res.statusCode === 301 || res.statusCode === 302) {
        log.success(`${name}: Connected (${res.statusCode})`);
        resolve(true);
      } else {
        log.warn(`${name}: Unexpected status ${res.statusCode}`);
        resolve(true); // Still connected
      }
    });
    req.on('error', (err) => {
      log.fail(`${name}: ${err.message}`);
      resolve(false);
    });
    req.on('timeout', () => {
      log.fail(`${name}: Timeout`);
      req.destroy();
      resolve(false);
    });
  });
}

async function checkDeepgramApi() {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    log.warn('Deepgram: API key not configured');
    return false;
  }

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.deepgram.com',
      path: '/v1/projects',
      method: 'GET',
      headers: {
        'Authorization': `Token ${apiKey}`
      },
      timeout: 10000
    }, (res) => {
      if (res.statusCode === 200) {
        log.success('Deepgram API: Authenticated');
        resolve(true);
      } else if (res.statusCode === 401) {
        log.fail('Deepgram API: Invalid API key');
        resolve(false);
      } else {
        log.warn(`Deepgram API: Status ${res.statusCode}`);
        resolve(true);
      }
    });
    req.on('error', (err) => {
      log.fail(`Deepgram API: ${err.message}`);
      resolve(false);
    });
    req.on('timeout', () => {
      log.fail('Deepgram API: Timeout');
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

async function checkFirebaseConfig() {
  const config = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
  };

  const missing = Object.entries(config).filter(([_, v]) => !v).map(([k]) => k);

  if (missing.length === 0) {
    log.success('Firebase: All environment variables configured');

    // Test Firebase Auth endpoint
    const authUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${config.apiKey}`;
    return new Promise((resolve) => {
      const req = https.request(authUrl, { method: 'POST', timeout: 10000 }, (res) => {
        // 400 is expected (no email provided), but means API is reachable
        if (res.statusCode === 400 || res.statusCode === 200) {
          log.success('Firebase Auth: API reachable');
          resolve(true);
        } else {
          log.warn(`Firebase Auth: Status ${res.statusCode}`);
          resolve(true);
        }
      });
      req.on('error', (err) => {
        log.fail(`Firebase Auth: ${err.message}`);
        resolve(false);
      });
      req.on('timeout', () => {
        log.fail('Firebase Auth: Timeout');
        req.destroy();
        resolve(false);
      });
      req.end('{}');
    });
  } else {
    log.fail(`Firebase: Missing config: ${missing.join(', ')}`);
    return false;
  }
}

async function checkFirestore() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    log.warn('Firestore: Project ID not configured');
    return false;
  }

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
  return checkUrl(url, 'Firestore API', 401); // 401 expected without auth
}

async function runHealthChecks() {
  console.log('\n' + '='.repeat(50));
  console.log(`${colors.cyan}SpeakSync Service Health Check${colors.reset}`);
  console.log('='.repeat(50) + '\n');

  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };

  const checks = [
    { name: 'Environment', fn: async () => {
      log.info('Checking environment configuration...');
      return true;
    }},
    { name: 'Firebase Config', fn: checkFirebaseConfig },
    { name: 'Firestore', fn: checkFirestore },
    { name: 'Deepgram', fn: checkDeepgramApi },
    { name: 'RevenueCat', fn: () => checkUrl('https://api.revenuecat.com/v1', 'RevenueCat API') },
    { name: 'Expo Updates', fn: () => checkUrl('https://u.expo.dev', 'Expo Updates Server') }
  ];

  for (const check of checks) {
    results.total++;
    try {
      const passed = await check.fn();
      if (passed) {
        results.passed++;
      } else {
        results.failed++;
      }
    } catch (err) {
      log.fail(`${check.name}: ${err.message}`);
      results.failed++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`Results: ${colors.green}${results.passed} passed${colors.reset}, ${colors.red}${results.failed} failed${colors.reset} out of ${results.total}`);
  console.log('='.repeat(50) + '\n');

  return results.failed === 0;
}

// Run checks
runHealthChecks()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('Health check failed:', err);
    process.exit(1);
  });
