// register-test-devices.js
// This script helps register devices for testing with EAS

const { exec } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('=== EAS Device Registration Helper ===');
console.log('This script will help you register testing devices with EAS');
console.log('');

rl.question('Register a new device? (y/n): ', (answer) => {
  if (answer.toLowerCase() === 'y') {
    console.log('\nRunning EAS device registration...');
    console.log('Follow the instructions in the browser that opens.');
    
    exec('npx eas-cli device:create', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return;
      }
      
      if (stderr) {
        console.error(`Error: ${stderr}`);
        return;
      }
      
      console.log(stdout);
      console.log('\nDevice registration process completed!');
      console.log('You can now build for this device using:');
      console.log('  npm run build:ios:test');
      
      rl.close();
    });
  } else {
    console.log('\nTo list your currently registered devices, run:');
    console.log('  npx eas-cli device:list');
    console.log('\nTo build for your registered devices, run:');
    console.log('  npm run build:ios:test');
    
    rl.close();
  }
});
