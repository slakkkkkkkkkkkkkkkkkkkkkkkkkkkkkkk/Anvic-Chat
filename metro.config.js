const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // Enable CSS for web
  isCSSEnabled: true,
});

// Configurações otimizadas para build
config.resolver.platforms = ['native', 'android', 'ios', 'web'];

config.resolver.alias = {
  '@': path.resolve(__dirname, './'),
  '@components': path.resolve(__dirname, './components'),
  '@services': path.resolve(__dirname, './services'),
  '@constants': path.resolve(__dirname, './constants'),
  '@hooks': path.resolve(__dirname, './hooks'),
  '@contexts': path.resolve(__dirname, './contexts'),
};

// Otimizações para performance
config.transformer.minifierConfig = {
  keep_fnames: true,  
  mangle: {
    keep_fnames: true,
  },
};

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