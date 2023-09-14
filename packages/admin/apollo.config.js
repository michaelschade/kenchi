module.exports = {
  client: {
    service: {
      name: 'backend',
      // Relative to root for some silly reason
      includes: ['./packages/admin/**/*.{js,ts,tsx}'],
      excludes: ['./packages/admin/node_modules'],
      localSchemaFile: './packages/backend/api.graphql',
    },
  },
};
