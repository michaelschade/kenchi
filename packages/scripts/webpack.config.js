const fs = require('fs');
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

const { baseOptions } = require('../webpack.base.config');
// production or development
const nodeEnv = process.env.NODE_ENV || 'development';

const injectedScriptsEntries = {};
fs.readdirSync(path.join(__dirname, 'src'), { withFileTypes: true })
  .filter((f) => f.isDirectory())
  .map((d) => d.name)
  .filter((dir) => !dir.startsWith('__'))
  .forEach((dir) => {
    injectedScriptsEntries[dir] = path.join(__dirname, 'src', dir);
  });

const options = {
  ...baseOptions,
  plugins: [
    ...baseOptions.plugins,
    new CopyPlugin({
      patterns: [
        {
          from: '**/*.html',
          context: 'src',
        },
      ],
    }),
  ],
  entry: injectedScriptsEntries,
  output: {
    path: nodeEnv === 'development' ? undefined : path.join(__dirname, `build`),
    filename: 'js/[name].bundle.js',
    sourceMapFilename: 'js/[name].bundle.js.map',
  },
  devServer: {
    compress: true,
    static: false,
    allowedHosts: 'scripts.kenchi.dev',
    hot: false,
    liveReload: false,
    host: '0.0.0.0',
    port: 4000,
    webSocketServer: false,
  },
};

module.exports = options;
