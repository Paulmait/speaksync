import { getDefaultConfig } from 'expo/metro-config.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config = getDefaultConfig(__dirname);

config.resolver.alias = {
  stream: 'readable-stream',
};

config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

export default config;
