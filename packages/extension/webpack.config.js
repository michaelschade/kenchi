const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const { baseOptions, getDotenv, appEnv } = require('../webpack.base.config');

const options = {
  ...baseOptions,
  entry: {
    background: path.join(__dirname, 'src', 'background/index.ts'),
    contentScript: path.join(__dirname, 'src', 'contentScript/index.ts'),
    iframe: path.join(__dirname, 'src', 'iframe/index.ts'),
  },
  output: {
    path: path.join(__dirname, `build-${appEnv}`),
    filename: '[name].bundle.js',
    sourceMapFilename: '[name].bundle.js.map',
  },
  devtool: 'source-map', // Anything with eval will require relaxing extension CSP
  plugins: [
    ...baseOptions.plugins,
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'background/index.html'),
      filename: 'background.html',
      chunks: ['background'],
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'iframe/index.html'),
      filename: 'iframe.html',
      chunks: ['iframe'],
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.join(__dirname, 'manifest.json'),
          to: 'manifest.json',
          transform(content, _path) {
            // TODO: we should probably just parse/regen the JSON
            let rtn = content.toString();
            rtn = rtn.replace(/{{APP_HOST}}/g, getDotenv().APP_HOST);
            return rtn;
          },
        },
        { from: path.join(__dirname, 'inboxsdk.js') },
        { from: path.join(__dirname, 'images'), to: 'images/' },
      ],
    }),
  ],
};

module.exports = options;
