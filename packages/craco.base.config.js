const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  babel: {
    presets: [['@babel/preset-react', { runtime: 'automatic', importSource: '@emotion/react' }]],
    plugins: ['@emotion/babel-plugin', 'babel-plugin-graphql-tag'],
  },
  webpack: {
    configure: (webpackConfig) => {
      // https://github.com/formatjs/formatjs/issues/1395#issuecomment-518823361
      // https://github.com/reactioncommerce/reaction-component-library/issues/399#issuecomment-467860022
      webpackConfig.module.rules.push({
        include: /node_modules/,
        test: /\.mjs$/,
        type: 'javascript/auto',
      });

      if (isProduction) {
        webpackConfig.optimization.splitChunks = { chunks: 'all' };
      }

      return webpackConfig;
    }
  },
};
