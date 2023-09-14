const { DefinePlugin } = require('webpack');
const baseConfig = require('../craco.base.config.js');
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';

const rewireEntries = [
  {
    name: 'background',
    entry: path.resolve(__dirname, './src/background/index.ts'),
    template: path.resolve(__dirname, './src/background/index.html'),
    outPath: 'background.html',
  },
  {
    name: 'hud',
    entry: path.resolve(__dirname, './src/hud/index.tsx'),
    template: path.resolve(__dirname, './src/hud/index.html'),
    outPath: 'hud.html',
  },
];

const defaultEntryName = 'main';

const appIndexes = ['js', 'tsx', 'ts', 'jsx'].map((ext) =>
  path.resolve(__dirname, `src/index.${ext}`)
);

function webpackMultipleEntries(config) {
  // Multiple Entry JS
  const defaultEntryHTMLPlugin = config.plugins.filter((plugin) => {
    return plugin.constructor.name === 'HtmlWebpackPlugin';
  })[0];
  defaultEntryHTMLPlugin.userOptions.chunks = [defaultEntryName];

  // config.entry is not an array in Create React App 4
  if (!Array.isArray(config.entry)) {
    config.entry = [config.entry];
  }

  // If there is only one entry file then it should not be necessary for the rest of the entries
  const necessaryEntry =
    config.entry.length === 1
      ? []
      : config.entry.filter((file) => !appIndexes.includes(file));
  const multipleEntry = {};
  multipleEntry[defaultEntryName] = config.entry;

  rewireEntries.forEach((entry) => {
    multipleEntry[entry.name] = necessaryEntry.concat(entry.entry);
    // Multiple Entry HTML Plugin
    config.plugins.unshift(
      new defaultEntryHTMLPlugin.constructor(
        Object.assign({}, defaultEntryHTMLPlugin.options, {
          filename: entry.outPath,
          template: entry.template,
          chunks: [entry.name],
        })
      )
    );
  });
  config.entry = multipleEntry;

  // Multiple Entry Output File
  let names = config.output.filename.split('/').reverse();

  if (names[0].indexOf('[name]') === -1) {
    names[0] = '[name].' + names[0];
    config.output.filename = names.reverse().join('/');
  }

  return config;
}

module.exports = {
  ...baseConfig,
  webpack: {
    ...baseConfig.webpack,
    plugins: [
      new DefinePlugin({
        __DEV__: !isProduction,
      }),
    ],
    configure: (webpackConfig) => {
      webpackConfig = baseConfig.webpack?.configure?.(webpackConfig);
      webpackConfig = webpackMultipleEntries(webpackConfig);
      return webpackConfig;
    },
  },
};
