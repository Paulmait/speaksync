// TypeScript Error Check Script
import { execSync } from 'child_process';

// eslint-disable-next-line no-console
console.log('\n=== Checking for TypeScript errors (Mobile Only) ===\n');

try {
  // Run TypeScript compiler in noEmit mode to check for errors in mobile code only
  // Exclude the web code files that are not needed for mobile testing
  execSync('npx tsc --noEmit --skipLibCheck --project ./tsconfig.mobile.json', { stdio: 'inherit' });
  
  // eslint-disable-next-line no-console
  console.log('\n✅ Mobile TypeScript checks passed! The app is ready for testing.\n');
} catch (_) {
  // eslint-disable-next-line no-console
  console.error('\n❌ TypeScript errors found in mobile code! Please fix them before testing.\n');
  process.exit(1);
}
