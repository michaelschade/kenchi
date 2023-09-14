const webpack = require("webpack");
const path = require("path");

const fileExtensions = ["jpg", "jpeg", "png", "gif", "eot", "otf", "svg", "ttf", "woff", "woff2"];

// production or development
const nodeEnv = process.env.NODE_ENV || "development";

// production, staging, or development
const appEnv = process.env.APP_ENV || nodeEnv;

function getDotenv() {
  const dotenv = require('dotenv').config({ path: path.resolve(`.env.${appEnv}`) });
  if (dotenv.error) {
    throw dotenv.error;
  }
  return dotenv.parsed;
}

const dotenv = getDotenv();
const dotenvDefineConfig = {};
for (const key in dotenv) {
  dotenvDefineConfig[`process.env.${key}`] = JSON.stringify(dotenv[key]);
}

const options = {
  mode: nodeEnv,
  devtool: 'source-map', // Anything with eval will require relaxing extension CSP
  stats: {
    children: false,
    modules: false,
    assets: false,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: new RegExp('.(' + fileExtensions.join('|') + ')$'),
        loader: "file-loader",
        options: { name: "[name].[ext]" },
        exclude: /node_modules/
      },
      {
        test: /\.html$/,
        loader: "html-loader",
        exclude: /node_modules/
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin(dotenvDefineConfig),
    new webpack.EnvironmentPlugin({
      APP_ENV: appEnv,
      SENTRY_VERSION: null,
    }),
  ]
};

module.exports = {
  baseOptions: options,
  getDotenv,
  appEnv,
};
