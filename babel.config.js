module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          jsxImportSource: 'react'
        }
      ]
    ],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
            '@components': './components',
            '@services': './services',
            '@constants': './constants',
            '@hooks': './hooks',
            '@contexts': './contexts',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};