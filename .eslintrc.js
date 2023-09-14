module.exports = {
  // Not all of our packages use react-app, but it has a great set of defaults
  // and is safe for non-react projects, so use it anyway
  extends: ['react-app', 'plugin:prettier/recommended'],
  plugins: ['import', 'simple-import-sort', 'prettier'],
  rules: {
    'import/no-duplicates': 'error',
    'import/newline-after-import': 'error',
    'simple-import-sort/imports': [
      'error',
      {
        groups: [
          // Side effects
          ['^\\u0000'],
          // React (obvs)
          ['^react$'],
          // All other external packages
          ['^@?\\w'],
          // Our packages
          ['^@kenchi'],
          // Absolute imports and anything not matched above
          ['^'],
          // Relative imports
          ['^\\.'],
        ],
      },
    ],
    'simple-import-sort/exports': 'error',
    'no-empty-pattern': 'off',
    '@typescript-eslint/no-unused-vars': [
      process.env.CI === 'true' ? 'error' : 'warn',
      {
        args: 'none',
        ignoreRestSiblings: true,
        varsIgnorePattern: '^_',
      },
    ],
    'react/jsx-no-useless-fragment': [
      'error',
      {
        allowExpressions: true,
      },
    ],
    'prettier/prettier': 'error',
  },
};
