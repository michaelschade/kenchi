const codegen = require('../codegen');

module.exports = {
  ...codegen,
  config: {
    ...codegen.config,
    strictScalars: true,
    scalars: {
      DataSourceOutput: 'any',
      DataSourceRequest: 'any',
      DateTime: 'string',
      InsertionPath: 'KenchiGQL.InsertionPath',
      Json: 'any',
      SlateNodeArray: 'KenchiGQL.SlateNodeArray',
      // TODO: clean up typing for ToolConfiguration, it's messy right now
      ToolConfiguration: 'any',
      ToolInput: 'KenchiGQL.ToolInput',
      WidgetInput: 'KenchiGQL.WidgetInput',
      Upload: 'File',
    },
  },
};
