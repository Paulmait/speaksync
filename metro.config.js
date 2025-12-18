// Learn more: https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const emptyShim = path.resolve(__dirname, 'shims', 'empty.js');

// Extra node modules for polyfilling Node.js built-ins
config.resolver.extraNodeModules = {
  // Polyfills for available modules
  stream: require.resolve('stream-browserify'),
  buffer: require.resolve('buffer'),
  crypto: require.resolve('crypto-browserify'),
  url: require.resolve('url'),
  events: require.resolve('events'),
  // Empty shims for server-only modules (not available in RN)
  http: emptyShim,
  https: emptyShim,
  net: emptyShim,
  tls: emptyShim,
  fs: emptyShim,
  child_process: emptyShim,
  dns: emptyShim,
  dgram: emptyShim,
  readline: emptyShim,
  cluster: emptyShim,
  module: emptyShim,
  os: emptyShim,
  path: emptyShim,
  zlib: emptyShim,
};

// Add resolver configuration for proper module resolution
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Support CommonJS modules
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];

module.exports = config;
