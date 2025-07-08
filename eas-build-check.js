// eas-build-check.js
// This script checks if all prerequisites are met for EAS builds

import fs from 'fs';
import { execSync } from 'child_process';

console.log('=== EAS Build Readiness Check ===\n');

// Check functions
const checks = {
  checkEasConfig: () => {
    try {
      const easConfig = fs.readFileSync('./eas.json', 'utf8');
      const config = JSON.parse(easConfig);
      
      if (!config.build || !config.build.test) {
        return { success: false, message: 'Missing build.test configuration in eas.json' };
      }
      
      return { success: true, message: 'eas.json is properly configured' };
    } catch (err) {
      return { success: false, message: `Error reading eas.json: ${err.message}` };
    }
  },
  
  checkAppConfig: () => {
    try {
      // Check if app.config.js exists
      if (fs.existsSync('./app.config.js')) {
        const appConfig = fs.readFileSync('./app.config.js', 'utf8');
        
        if (!appConfig.includes('projectId')) {
          return { success: false, message: 'Missing EAS projectId in app.config.js' };
        }
        
        return { success: true, message: 'app.config.js includes EAS projectId' };
      }
      
      // Check app.json if app.config.js doesn't exist
      const appJson = fs.readFileSync('./app.json', 'utf8');
      const config = JSON.parse(appJson);
      
      if (!config.expo?.extra?.eas?.projectId) {
        return { success: false, message: 'Missing expo.extra.eas.projectId in app.json' };
      }
      
      return { success: true, message: 'app.json includes EAS projectId' };
    } catch (err) {
      return { success: false, message: `Error reading app configuration: ${err.message}` };
    }
  },
  
  checkEasLogin: () => {
    try {
      const result = execSync('npx eas-cli whoami', { stdio: ['pipe', 'pipe', 'pipe'] });
      return { 
        success: true, 
        message: `Logged in as ${result.toString().trim()}` 
      };
    } catch (err) {
      return { success: false, message: 'Not logged in to EAS. Run "npx eas-cli login"' };
    }
  },
  
  checkTypeScript: () => {
    try {
      execSync('npx tsc --noEmit --project tsconfig.mobile.json', { stdio: ['pipe', 'pipe', 'pipe'] });
      return { success: true, message: 'TypeScript check passed' };
    } catch (err) {
      return { 
        success: false, 
        message: 'TypeScript errors detected. Run "node check-ts-errors.js" to see details' 
      };
    }
  }
};

// Run checks
let allGood = true;
Object.entries(checks).forEach(([name, check]) => {
  const result = check();
  console.log(`${result.success ? '✓' : '✗'} ${result.message}`);
  
  if (!result.success) {
    allGood = false;
  }
});

console.log('\n=== Summary ===');
if (allGood) {
  console.log('✓ All checks passed! You are ready to build with EAS.');
  console.log('  Run "npm run build:ios:test" to build for iOS testing.');
} else {
  console.log('✗ Some checks failed. Please fix the issues above before building with EAS.');
}
