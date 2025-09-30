module.exports = function override(config, env) {
  // Ignore source map warnings for node_modules
  if (env === 'production') {
    config.ignoreWarnings = [
      {
        module: /node_modules\/@mediapipe\/tasks-vision/,
        message: /Failed to parse source map/
      }
    ];
  }

  return config;
};
