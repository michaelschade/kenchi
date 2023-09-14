const generatedFile =
  process.env.GQL_CODEGEN_FILE ?? './src/graphql/generated.ts';
module.exports = {
  schema: '../backend/api.graphql',
  documents: './src/**/*.{tsx,ts}',
  config: {
    nonOptionalTypename: true,
    avoidOptionals: {
      field: true,
    },
    omitOperationSuffix: true,
    namingConvention: {
      enumValues: 'keep',
    },
  },
  generates: {
    [generatedFile]: {
      plugins: [
        { add: { content: '/* eslint-disable */' } },
        'typescript',
        'typescript-operations',
      ],
    },
  },
};
