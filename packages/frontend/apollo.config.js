module.exports = {
  client: {
    service: {
      name: 'backend',
      // Relative to root for some silly reason
      includes: ['./packages/frontend/**/*.{js,ts,tsx}'],
      excludes: ['./packages/frontend/node_modules'],
      localSchemaFile: './packages/backend/api.graphql',
    },
  },
};
