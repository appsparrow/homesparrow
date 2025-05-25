const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Create a mock realtime module path
const mockRealtimePath = path.resolve(__dirname, 'mock-realtime.js');

// Exclude problematic Node.js packages
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

config.resolver.alias = {
  ...config.resolver.alias,
  stream: require.resolve('stream-browserify'),
  crypto: require.resolve('react-native-crypto'),
  ws: mockRealtimePath,
  '@supabase/realtime-js': mockRealtimePath,
  'node:stream': require.resolve('stream-browserify'),
  'node:crypto': require.resolve('react-native-crypto'),
};

config.resolver.fallback = {
  ...config.resolver.fallback,
  stream: require.resolve('stream-browserify'),
  crypto: require.resolve('react-native-crypto'),
  ws: mockRealtimePath,
  '@supabase/realtime-js': mockRealtimePath,
  fs: false,
  net: false,
  tls: false,
  http: false,
  https: false,
  os: false,
  path: false,
  'node:stream': require.resolve('stream-browserify'),
  'node:crypto': require.resolve('react-native-crypto'),
};

module.exports = config; 