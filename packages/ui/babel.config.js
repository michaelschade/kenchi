module.exports = (api) => ({
  presets: [
    [
      '@babel/preset-env',
      {
        modules: api.env('test') ? 'auto' : false,
        targets: { chrome: '90' },
      },
    ],
    '@babel/preset-typescript',
    [
      '@babel/preset-react',
      {
        runtime: 'automatic',
        importSource: '@emotion/react',
      },
    ],
  ],
  plugins: ['macros', '@emotion'],
});
