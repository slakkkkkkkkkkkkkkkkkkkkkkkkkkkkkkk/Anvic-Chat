const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure proper resolution of modules
config.resolver.alias = {
  '@': './src',
};

config.resolver.platforms = ['ios', 'android', 'web'];

module.exports = config;