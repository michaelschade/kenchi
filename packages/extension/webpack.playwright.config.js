const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

const options = require('./webpack.config');

options.output.path = path.join(__dirname, `build-playwright`);

const copyPlugin = options.plugins.find((p) => p instanceof CopyPlugin);
const manifestPattern = copyPlugin.patterns.find(
  (p) => p.to === 'manifest.json'
);
const originalTransform = manifestPattern.transform;
manifestPattern.transform = (content, path) => {
  let rtn = content.toString();
  rtn = rtn.replace(/"persistent":\s*false/g, '"persistent": true');
  return originalTransform(rtn, path);
};
module.exports = options;
