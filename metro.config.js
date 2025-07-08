import { getDefaultConfig } from 'expo/metro-config.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Get dirname in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Get base Expo config
const config = getDefaultConfig(__dirname);

// Add aliases for common dependencies
config.resolver.alias = {
  stream: 'readable-stream',
};

// Add resolver configuration for proper module resolution
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Add support for Flow and TypeScript syntax
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'jsx', 'js', 'ts', 'tsx', 'json', 'cjs', 'mjs'
];

// Export configuration
export default config;
