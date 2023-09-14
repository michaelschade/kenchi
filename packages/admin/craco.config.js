const { DefinePlugin } = require('webpack');
const baseConfig = require('../craco.base.config.js');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  ...baseConfig,
  webpack: {
    ...baseConfig.webpack,
    plugins: [
      new DefinePlugin({
        __DEV__: !isProduction,
      }),
    ],
  },
};
