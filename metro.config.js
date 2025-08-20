const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // Enable CSS for web
  isCSSEnabled: true,
});

// Configurações otimizadas para build
config.resolver.platforms = ['native', 'android', 'ios', 'web'];

// Suporte para extensões adicionais
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'svg',
  'cjs',
];

// Configurações para assets
config.resolver.assetExts = [
  ...config.resolver.assetExts,
  'bin',
  'txt',
  'jpg',
  'png',
  'json',
  'mp4',
  'mov',
  'avi',
  'mp3',
  'wav',
  'm4a',
  'pdf',
  'doc',
  'docx',
  'zip',
  'rar',
];

module.exports = config;