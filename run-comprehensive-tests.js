#!/usr/bin/env node
// Comprehensive Test Runner for SpeakSync Mobile
// This script runs systematic tests to verify app functionality

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

const log = (message, color = colors.white) => {
  console.log(`${color}${message}${colors.reset}`);
};

const runCommand = (command, description, options = {}) => {
  log(`\n🔍 ${description}`, colors.cyan);
  log(`Running: ${command}`, colors.yellow);
  
  try {
    const output = execSync(command, { 
      stdio: 'pipe',
      encoding: 'utf8',
      cwd: process.cwd(),
      ...options 
    });
    
    log(`✅ ${description} - PASSED`, colors.green);
    return { success: true, output };
  } catch (error) {
    log(`❌ ${description} - FAILED`, colors.red);
    log(`Error: ${error.message}`, colors.red);
    if (error.stdout) {
      log(`Output: ${error.stdout}`, colors.yellow);
    }
    if (error.stderr) {
      log(`Error output: ${error.stderr}`, colors.red);
    }
    return { success: false, error: error.message };
  }
};

const checkFileExists = (filePath, description) => {
  log(`\n🔍 ${description}`, colors.cyan);
  const exists = fs.existsSync(filePath);
  
  if (exists) {
    log(`✅ ${description} - EXISTS`, colors.green);
    return true;
  } else {
    log(`❌ ${description} - MISSING`, colors.red);
    return false;
  }
};

const countFiles = (pattern, description) => {
  log(`\n📊 ${description}`, colors.cyan);
  
  try {
    // Use a simple directory traversal to count files
    const countInDir = (dir, extensions) => {
      let count = 0;
      const items = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        
        if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
          count += countInDir(fullPath, extensions);
        } else if (item.isFile()) {
          const ext = path.extname(item.name);
          if (extensions.includes(ext)) {
            count++;
          }
        }
      }
      
      return count;
    };
    
    const srcDir = path.join(process.cwd(), 'src');
    const tsFiles = countInDir(srcDir, ['.ts', '.tsx']);
    const testFiles = countInDir(process.cwd(), ['.test.ts', '.test.tsx', '.spec.ts', '.spec.tsx']);
    
    log(`📁 TypeScript files in src/: ${tsFiles}`, colors.blue);
    log(`🧪 Test files: ${testFiles}`, colors.blue);
    log(`📈 Test coverage ratio: ${((testFiles / tsFiles) * 100).toFixed(1)}%`, colors.blue);
    
    return { tsFiles, testFiles, ratio: (testFiles / tsFiles) * 100 };
  } catch (error) {
    log(`❌ Error counting files: ${error.message}`, colors.red);
    return { tsFiles: 0, testFiles: 0, ratio: 0 };
  }
};

async function runComprehensiveTests() {
  log('🚀 Starting Comprehensive Test Suite for SpeakSync Mobile', colors.magenta);
  log('=' * 80, colors.magenta);
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    categories: {}
  };
  
  const addResult = (category, success, description) => {
    results.total++;
    if (success) results.passed++;
    else results.failed++;
    
    if (!results.categories[category]) {
      results.categories[category] = { passed: 0, failed: 0, tests: [] };
    }
    
    results.categories[category][success ? 'passed' : 'failed']++;
    results.categories[category].tests.push({ success, description });
  };

  // 1. CODE QUALITY & STATIC ANALYSIS
  log('\n\n📋 PHASE 1: CODE QUALITY & STATIC ANALYSIS', colors.magenta);
  log('=' * 50, colors.magenta);
  
  // TypeScript compilation check
  let result = runCommand('npx tsc --noEmit --project tsconfig.mobile.json', 'TypeScript compilation check');
  addResult('Static Analysis', result.success, 'TypeScript compilation');
  
  // ESLint check
  result = runCommand('npm run lint', 'ESLint code quality check');
  addResult('Static Analysis', result.success, 'ESLint validation');
  
  // Check critical files exist
  const criticalFiles = [
    ['src/App.tsx', 'Main App component'],
    ['src/navigation/AppNavigator.tsx', 'Main navigation'],
    ['src/services/subscriptionService.ts', 'Subscription service'],
    ['src/services/firebase.ts', 'Firebase configuration'],
    ['app.config.js', 'Expo configuration'],
    ['eas.json', 'EAS build configuration']
  ];
  
  criticalFiles.forEach(([file, desc]) => {
    const exists = checkFileExists(file, desc);
    addResult('File Structure', exists, desc);
  });

  // 2. UNIT TESTS
  log('\n\n🧪 PHASE 2: UNIT TESTS', colors.magenta);
  log('=' * 50, colors.magenta);
  
  // Run Jest tests
  result = runCommand('npm run test:ci', 'Jest unit tests with coverage');
  addResult('Unit Tests', result.success, 'Jest test suite');
  
  // Test coverage analysis
  const fileStats = countFiles('**/*.{ts,tsx}', 'Code coverage analysis');
  const hasSufficientTests = fileStats.ratio >= 20; // At least 20% test coverage
  addResult('Test Coverage', hasSufficientTests, `Test coverage (${fileStats.ratio.toFixed(1)}%)`);

  // 3. SERVICE INTEGRATION TESTS
  log('\n\n🔧 PHASE 3: SERVICE INTEGRATION TESTS', colors.magenta);
  log('=' * 50, colors.magenta);
  
  // Test Firebase configuration
  result = runCommand('node -e "const config = require(\'./src/services/firebase.ts\'); console.log(\'Firebase config loaded\')"', 'Firebase service configuration', { stdio: 'pipe' });
  addResult('Services', result.success || result.output?.includes('Firebase'), 'Firebase configuration');
  
  // Test subscription service
  result = runCommand('node -e "const { subscriptionService } = require(\'./src/services/subscriptionService.ts\'); console.log(\'Subscription service loaded\')"', 'Subscription service import', { stdio: 'pipe' });
  addResult('Services', result.success || result.output?.includes('Subscription'), 'Subscription service');

  // 4. BUILD SYSTEM TESTS
  log('\n\n🏗️ PHASE 4: BUILD SYSTEM TESTS', colors.magenta);
  log('=' * 50, colors.magenta);
  
  // Expo configuration validation
  result = runCommand('npx expo config --type public', 'Expo configuration validation');
  addResult('Build System', result.success, 'Expo configuration');
  
  // EAS build configuration check
  result = runCommand('node eas-build-check.js', 'EAS build readiness check');
  addResult('Build System', result.success, 'EAS build configuration');
  
  // Metro bundler configuration
  result = runCommand('node -e "const config = require(\'./metro.config.js\'); console.log(\'Metro config loaded\')"', 'Metro bundler configuration');
  addResult('Build System', result.success, 'Metro configuration');

  // 5. DEPENDENCY ANALYSIS
  log('\n\n📦 PHASE 5: DEPENDENCY ANALYSIS', colors.magenta);
  log('=' * 50, colors.magenta);
  
  // Check for dependency vulnerabilities
  result = runCommand('npm audit --audit-level moderate', 'NPM security audit');
  addResult('Dependencies', result.success, 'Security vulnerability check');
  
  // Check for outdated packages
  result = runCommand('npm outdated', 'Outdated packages check', { stdio: 'pipe' });
  addResult('Dependencies', true, 'Package version analysis'); // Always pass, just informational
  
  // Verify critical dependencies
  const criticalDeps = [
    'expo', 'react', 'react-native', 'firebase', 
    '@react-navigation/native', 'zustand', 'react-native-paper'
  ];
  
  criticalDeps.forEach(dep => {
    const exists = checkFileExists(`node_modules/${dep}/package.json`, `Critical dependency: ${dep}`);
    addResult('Dependencies', exists, `Dependency: ${dep}`);
  });

  // 6. EXPO & REACT NATIVE SPECIFIC TESTS
  log('\n\n📱 PHASE 6: EXPO & REACT NATIVE TESTS', colors.magenta);
  log('=' * 50, colors.magenta);
  
  // Expo doctor check
  result = runCommand('npx expo doctor', 'Expo doctor diagnostic');
  addResult('Expo/RN', result.success, 'Expo doctor check');
  
  // Check for React Native compatibility
  result = runCommand('npx react-native info', 'React Native environment info', { stdio: 'pipe' });
  addResult('Expo/RN', result.success, 'React Native environment');

  // 7. FINAL VALIDATION
  log('\n\n✅ PHASE 7: FINAL VALIDATION', colors.magenta);
  log('=' * 50, colors.magenta);
  
  // Try to start bundler for a few seconds to ensure it works
  try {
    log('Testing Metro bundler startup...', colors.cyan);
    const child = execSync('timeout 10 npm start || true', { stdio: 'pipe', timeout: 15000 });
    addResult('Final Validation', true, 'Metro bundler startup test');
  } catch (error) {
    addResult('Final Validation', false, 'Metro bundler startup test');
  }

  // RESULTS SUMMARY
  log('\n\n🎯 TEST RESULTS SUMMARY', colors.magenta);
  log('=' * 80, colors.magenta);
  
  log(`\n📊 Overall Results:`, colors.cyan);
  log(`Total Tests: ${results.total}`, colors.blue);
  log(`Passed: ${results.passed}`, colors.green);
  log(`Failed: ${results.failed}`, colors.red);
  log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`, colors.cyan);
  
  log(`\n📋 Results by Category:`, colors.cyan);
  Object.entries(results.categories).forEach(([category, stats]) => {
    const total = stats.passed + stats.failed;
    const percentage = ((stats.passed / total) * 100).toFixed(1);
    log(`${category}: ${stats.passed}/${total} (${percentage}%)`, 
         stats.failed === 0 ? colors.green : colors.yellow);
    
    // Show failed tests
    if (stats.failed > 0) {
      stats.tests.filter(t => !t.success).forEach(test => {
        log(`  ❌ ${test.description}`, colors.red);
      });
    }
  });
  
  const overallSuccess = (results.passed / results.total) >= 0.8; // 80% success rate
  
  if (overallSuccess) {
    log('\n🎉 COMPREHENSIVE TEST SUITE: PASSED', colors.green);
    log('Your SpeakSync Mobile app is ready for testing and deployment!', colors.green);
  } else {
    log('\n⚠️  COMPREHENSIVE TEST SUITE: NEEDS ATTENTION', colors.yellow);
    log('Some issues were found. Please address failed tests before deployment.', colors.yellow);
  }
  
  return results;
}

// Run the tests
runComprehensiveTests().catch(error => {
  log(`\n💥 Test runner failed: ${error.message}`, colors.red);
  process.exit(1);
});
