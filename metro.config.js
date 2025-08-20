const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Resolver arquivos .tsx e .ts primeiro
config.resolver.sourceExts = ['js', 'jsx', 'ts', 'tsx', 'json'];

// Garantir que o resolver funcione corretamente
config.resolver.alias = {
  '@': './',
};

// Platforms suportadas
config.resolver.platforms = ['ios', 'android', 'web'];

module.exports = config;