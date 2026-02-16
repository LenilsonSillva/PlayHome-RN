module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@": "./src"
          }
        }
      ],
      // Reanimated DEVE ser sempre o último da lista
      "react-native-reanimated/plugin"
    ]
  };
};
