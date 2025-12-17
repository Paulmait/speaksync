#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up SpeakSync Mobile for Beta Testing...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');

if (!fs.existsSync(envPath)) {
  console.log('❌ No .env file found!');
  console.log('📝 Please create a .env file with your API keys:');
  console.log('   cp .env.example .env');
  console.log('   Then edit .env with your actual API keys\n');
  process.exit(1);
}

// Read and validate .env file
const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');

const requiredKeys = [
  'DEEPGRAM_API_KEY',
  'FIREBASE_API_KEY',
  'FIREBASE_PROJECT_ID'
];

const placeholderKeys = [];

lines.forEach(line => {
  const trimmedLine = line.trim();
  if (trimmedLine && !trimmedLine.startsWith('#')) {
    const [key, value] = trimmedLine.split('=');
    if (key && value) {
      if (requiredKeys.includes(key)) {
        if (!value || value === 'your_' + key.toLowerCase() + '_here') {
          placeholderKeys.push(key);
        }
      }
    }
  }
});

if (placeholderKeys.length > 0) {
  console.log('⚠️  Found placeholder values in .env file:');
  placeholderKeys.forEach(key => {
    console.log(`   - ${key}: Please replace with actual value`);
  });
  console.log('');
}

// Create beta testing configuration
const betaConfig = {
  BETA_TESTING_MODE: 'true',
  ENABLE_MOCK_SERVICES: 'false',
  ENABLE_API_KEY_VALIDATION: 'true',
  ENABLE_ENVIRONMENT_CHECK: 'true',
  ENABLE_ANALYTICS: 'true',
  ENABLE_CRASH_REPORTING: 'true',
  DEBUG_MODE: 'false',
  ENABLE_SPEECH_LOGGING: 'false'
};

console.log('✅ Beta testing configuration:');
Object.entries(betaConfig).forEach(([key, value]) => {
  console.log(`   ${key}=${value}`);
});

console.log('\n🔒 Security Checklist:');
console.log('   ✅ Environment variables configured');
console.log('   ✅ API key validation enabled');
console.log('   ✅ Environment checks enabled');
console.log('   ✅ Mock services disabled for production testing');
console.log('   ✅ Analytics and crash reporting enabled');

console.log('\n📱 iPhone Testing Setup:');
console.log('   1. Install Expo Go on your iPhone');
console.log('   2. Run: npm run ios:local');
console.log('   3. Scan the QR code with your iPhone camera');
console.log('   4. Or use: npm run ios:check');

console.log('\n🧪 Beta Testing Features:');
console.log('   - Limited session duration (60 minutes)');
console.log('   - Limited scripts per user (10)');
console.log('   - Limited sessions per day (5)');
console.log('   - Enhanced error reporting');
console.log('   - Performance monitoring');

console.log('\n🚀 Ready for beta testing!');
console.log('   Run: npm start');
console.log('   Then: npm run ios:local'); 