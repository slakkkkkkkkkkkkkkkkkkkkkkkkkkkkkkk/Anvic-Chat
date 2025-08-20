const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname, {
  // Enable CSS for web
  isCSSEnabled: true,
});

module.exports = config;