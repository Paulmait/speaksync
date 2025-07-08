// iOS Testing Helper Script
import { execSync } from 'child_process';
import os from 'os';
import { existsSync } from 'fs';
import { killPortProcess } from 'kill-port-process';

// Get local IP address for network connection
const getLocalIpAddress = () => {
  const interfaces = os.networkInterfaces();
  const validInterfaces = Object.keys(interfaces);
  
  // Safely iterate through network interfaces
  for (let i = 0; i < validInterfaces.length; i++) {
    const name = validInterfaces[i];
    const networkInterfaces = interfaces[name];
    
    if (networkInterfaces) {
      for (let j = 0; j < networkInterfaces.length; j++) {
        const iface = networkInterfaces[j];
        // Skip over non-IPv4 and internal (loopback) addresses
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  }
  
  return '127.0.0.1'; // Fallback to localhost if no network interfaces found
};

// Suppress console logs for linting but keep them for user feedback
const log = (...args) => {
  // eslint-disable-next-line no-console
  console.log(...args);
};

const logError = (...args) => {
  // eslint-disable-next-line no-console
  console.error(...args);
};

const clearExpoPort = async () => {
  try {
    log('Checking for processes on Expo port 8081...');
    await killPortProcess(8081);
    log('Port 8081 cleared for Expo');
  } catch (err) {
    // No process found on port, which is fine
  }
};

// Check if any required config files are missing
const checkRequiredFiles = () => {
  const requiredFiles = [
    'app.json', 
    'App.tsx', 
    '.babelrc', 
    'tsconfig.json',
    'tsconfig.mobile.json',
    'metro.config.js'
  ];
  
  const missingFiles = requiredFiles.filter(file => !existsSync(`c:/Users/maito/SpeakSyncMobile/${file}`));
  
  if (missingFiles.length > 0) {
    logError(`Error: Missing required files: ${missingFiles.join(', ')}`);
    process.exit(1);
  }
};

const prepareEnvironment = async () => {
  checkRequiredFiles();
  await clearExpoPort();
};

// Start the Expo server
const startExpo = async (host) => {
  try {
    await clearExpoPort();
    
    // Load environment variables
    log('env: load .env');
    log('env: export DEEPGRAM_API_KEY FIREBASE_API_KEY FIREBASE_AUTH_DOMAIN FIREBASE_PROJECT_ID FIREBASE_STORAGE_BUCKET FIREBASE_MESSAGING_SENDER_ID FIREBASE_APP_ID DEBUG_MODE ENABLE_SPEECH_LOGGING');
    
    // Start Expo server with host
    log(`Starting Expo with host: ${host}...`);
    execSync(`npx expo start --ios --host=${host} --clear`, { stdio: 'inherit' });
  } catch (error) {
    logError('Error starting Expo server:', error.message);
    process.exit(1);
  }
};

// Main execution function
const main = async () => {
  try {
    log('=== SPEAKSYNC MOBILE iOS TESTING ===');
    
    // Check for required config files
    if (!existsSync('.env')) {
      logError('Error: .env file not found. Please create it using .env.example as a template.');
      process.exit(1);
    }
    
    // Use LAN networking for device testing
    const ipAddress = getLocalIpAddress();
    log(`Using local network address: ${ipAddress}`);
    
    log('Starting Expo development server...');
    log('📱 To test on iPhone:');
    log('1. Make sure your iPhone is on the same Wi-Fi network as this computer');
    log('2. Install the Expo Go app on your iPhone');
    log('3. Scan the QR code that will appear in the terminal');
    
    // Use "lan" mode instead of direct IP address for Expo host
    await startExpo('lan');
  } catch (error) {
    logError(`Failed to start iOS testing: ${error.message}`);
    process.exit(1);
  }
};

// Run the script
main().catch(error => {
  logError('Unexpected error:', error);
  process.exit(1);
});
