const codegen = require('../codegen');

module.exports = {
  ...codegen,
  config: {
    ...codegen.config,
    // We don't need or use the full types for everything in admin.
    onlyOperationTypes: true,
  },
};
