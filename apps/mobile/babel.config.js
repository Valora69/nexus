module.exports = function (api) {
  api.cache(true);
  return {
    // `babel-preset-expo` reads `jsxImportSource: 'nativewind'` so JSX
    // `className` props are typed and processed correctly.
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    // `react-native-worklets/plugin` replaces the older
    // `react-native-reanimated/plugin` — Expo SDK 57 ships worklets 0.10.
    plugins: ['react-native-worklets/plugin'],
  };
};
