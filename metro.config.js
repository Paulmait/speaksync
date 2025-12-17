// Learn more: https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add aliases for Node.js built-ins and common dependencies
config.resolver.alias = {
  stream: 'stream-browserify',
};

// Extra node modules for polyfilling
config.resolver.extraNodeModules = {
  stream: require.resolve('stream-browserify'),
};

// Add resolver configuration for proper module resolution
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;
