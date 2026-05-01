module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Worklets plugin must be listed last (Reanimated 4+ uses react-native-worklets).
      'react-native-worklets/plugin',
    ],
  };
};
