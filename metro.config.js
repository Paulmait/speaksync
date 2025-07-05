const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.alias = {
  stream: 'readable-stream',
};

config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;
