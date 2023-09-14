import { faCogs } from '@fortawesome/pro-solid-svg-icons';

import { success } from '@kenchi/shared/lib/Result';

import { VariableMap } from '../useVariable';
import { ToolConfig } from './types';

export type CustomThingTemplateConfig = {};

const CustomThingTemplate: ToolConfig = {
  getIcon() {
    return faCogs;
  },

  needsExtension() {
    return false;
  },

  getPreview({}: CustomThingTemplateConfig, _variableMap: VariableMap) {
    return null;
  },

  async execute(
    _messageRouter: unknown,
    _pageContext: unknown,
    _domainSettings: unknown,
    _variableMap: VariableMap,
    {}: CustomThingTemplateConfig
  ) {
    return success(true);
  },
};

export default CustomThingTemplate;
